import 'server-only';
import { createClient, type Client, type InValue } from '@libsql/client';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runContentMigrations } from './content-migrations';
import {
  createSeedData, seedAccreditations, seedContent, seedCountries, seedPrograms,
  seedTeamMembers, seedTestimonials,
} from './seed';
import { isLoopbackIp, normalizeIp } from './ip';
import type {
  Accreditation, AdminData, BlockedIp, Country, PreviewStore, PublicData, SecurityOverview,
  SiteContent, StorageMode, StudyProgram, Submission, SubmissionStatus, SubmissionType,
  TeamMember, Testimonial, Visitor, VisitorActivityKind, VisitorVisit,
} from './types';

const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();
// Turso is authoritative whenever both variables exist. Live query errors are
// surfaced rather than silently serving stale preview JSON in production.
export const storageMode: StorageMode = tursoUrl && tursoToken ? 'turso' : 'preview';

const fallbackPath = process.env.NETLIFY
  ? '/tmp/redpath-immigration-cms.json'
  : path.join(process.cwd(), '.data', 'cms.json');

let client: Client | undefined;
let initialization: Promise<void> | undefined;
let writeQueue: Promise<unknown> = Promise.resolve();

function jsonParse<T>(value: unknown, fallback: T): T {
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeDefaults(defaultValue: unknown, savedValue: unknown): unknown {
  if (Array.isArray(defaultValue)) return savedValue === undefined ? defaultValue : savedValue;
  if (isObject(defaultValue)) {
    const saved = isObject(savedValue) ? savedValue : {};
    return Object.fromEntries(Object.entries(defaultValue).map(([key, value]) => [key, mergeDefaults(value, saved[key])]));
  }
  return savedValue === undefined ? defaultValue : savedValue;
}

function normalizeContent(value: unknown): SiteContent {
  // Turso TEXT columns arrive as strings, while the preview store and admin
  // writes already contain objects. Parse both forms before applying defaults;
  // passing a JSON string to mergeDefaults would incorrectly return seed copy.
  const parsed = typeof value === 'string' ? jsonParse<unknown>(value, {}) : value;
  const sourceVersion = isObject(parsed) && typeof parsed.contentVersion === 'number' ? parsed.contentVersion : 0;
  const merged = mergeDefaults(seedContent, parsed) as SiteContent;
  return runContentMigrations(merged, sourceVersion);
}

async function schema() {
  return readFile(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');
}

async function writeFallback(data: PreviewStore) {
  await mkdir(path.dirname(fallbackPath), { recursive: true });
  const temporary = `${fallbackPath}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(data, null, 2), 'utf8');
  await rename(temporary, fallbackPath);
}

async function seedFallback() {
  const data = createSeedData();
  await writeFallback(data);
}

/**
 * Existing databases created before the visitor-security feature do not have
 * `submissions.ip`, and SQLite has no `ADD COLUMN IF NOT EXISTS`. Inspect the
 * table and add the column once; concurrent instances may race, so a duplicate
 * column error is treated as success.
 */
async function ensureSubmissionsIpColumn(db: Client) {
  const columns = await db.execute('PRAGMA table_info(submissions)');
  if (!columns.rows.some((row) => String(row.name) === 'ip')) {
    try {
      await db.execute("ALTER TABLE submissions ADD COLUMN ip TEXT NOT NULL DEFAULT ''");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/duplicate column/i.test(message)) throw error;
    }
  }
  // The index lives here rather than in schema.sql: executing the schema on a
  // database that predates `submissions.ip` must not fail before the ALTER runs.
  await db.execute('CREATE INDEX IF NOT EXISTS idx_submissions_ip ON submissions(ip)');
}

async function seedTurso(db: Client) {
  const now = new Date().toISOString();
  await db.execute({ sql: 'INSERT OR IGNORE INTO site_content (id, data, updated_at) VALUES (1, ?, ?)', args: [JSON.stringify(seedContent), now] });
  for (const item of seedCountries) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO countries (id, slug, name, code, flag, tagline, summary, image, routes, eligibility, processes, timeline, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [item.id, item.slug, item.name, item.code, item.flag, item.tagline, item.summary, item.image, JSON.stringify(item.routes), JSON.stringify(item.eligibility), JSON.stringify(item.processes), JSON.stringify(item.timeline), item.sortOrder, now],
    });
  }
  for (const item of seedPrograms) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO study_programs (id, degree, title, destination, duration, description, highlights, requirements, intake, investment, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [item.id, item.degree, item.title, item.destination, item.duration, item.description, JSON.stringify(item.highlights), JSON.stringify(item.requirements), item.intake, item.investment, item.sortOrder, now],
    });
  }
  for (const item of seedTestimonials) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO testimonials (id, name, role, location, quote, rating, media_type, media_url, poster_url, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [item.id, item.name, item.role, item.location, item.quote, item.rating, item.mediaType, item.mediaUrl, item.posterUrl, item.sortOrder, now],
    });
  }
  for (const item of seedTeamMembers) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO team_members (id, name, role, bio, credentials, photo_url, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [item.id, item.name, item.role, item.bio, JSON.stringify(item.credentials), item.photoUrl, item.sortOrder, now],
    });
  }
  for (const item of seedAccreditations) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO accreditations (id, title, subtitle, image_url, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [item.id, item.title, item.subtitle, item.imageUrl, item.sortOrder, now],
    });
  }
}

async function initialize() {
  if (storageMode === 'turso') {
    client = createClient({ url: tursoUrl!, authToken: tursoToken! });
    await client.executeMultiple(await schema());
    await ensureSubmissionsIpColumn(client);
    await seedTurso(client);
  } else {
    try { await readFile(fallbackPath, 'utf8'); } catch { await seedFallback(); }
  }
}

async function ready() {
  if (!initialization) initialization = initialize().catch((error) => { initialization = undefined; throw error; });
  await initialization;
}

async function readFallback(): Promise<PreviewStore> {
  await ready();
  try {
    const data = JSON.parse(await readFile(fallbackPath, 'utf8')) as Partial<PreviewStore>;
    return {
      content: normalizeContent(data.content),
      countries: Array.isArray(data.countries) ? data.countries : structuredClone(seedCountries),
      programs: Array.isArray(data.programs) ? data.programs : structuredClone(seedPrograms),
      testimonials: Array.isArray(data.testimonials) ? data.testimonials : structuredClone(seedTestimonials),
      teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : structuredClone(seedTeamMembers),
      accreditations: Array.isArray(data.accreditations) ? data.accreditations : structuredClone(seedAccreditations),
      submissions: (Array.isArray(data.submissions) ? data.submissions : []).map((item) => ({
        ...item,
        ip: typeof item.ip === 'string' ? item.ip : '',
      })),
      visitors: Array.isArray(data.visitors) ? data.visitors : [],
      visitorVisits: Array.isArray(data.visitorVisits) ? data.visitorVisits : [],
      blockedIps: Array.isArray(data.blockedIps) ? data.blockedIps : [],
      storageMode: 'preview',
    };
  } catch {
    await seedFallback();
    return createSeedData();
  }
}

async function mutateFallback<T>(mutator: (data: PreviewStore) => T | Promise<T>): Promise<T> {
  const operation = writeQueue.then(async () => {
    const data = await readFallback();
    const result = await mutator(data);
    data.content = normalizeContent(data.content);
    await writeFallback(data);
    return result;
  });
  writeQueue = operation.catch(() => undefined);
  return operation;
}

function mapCountry(row: Record<string, unknown>): Country {
  return {
    id: String(row.id), slug: String(row.slug), name: String(row.name), code: String(row.code || ''),
    flag: String(row.flag || ''), tagline: String(row.tagline || ''), summary: String(row.summary || ''), image: String(row.image || ''),
    routes: jsonParse(row.routes, []), eligibility: jsonParse(row.eligibility, []),
    processes: jsonParse(row.processes, []), timeline: jsonParse(row.timeline, []), sortOrder: Number(row.sort_order || 0),
  };
}

function mapProgram(row: Record<string, unknown>): StudyProgram {
  return {
    id: String(row.id), degree: String(row.degree), title: String(row.title), destination: String(row.destination || ''),
    duration: String(row.duration || ''), description: String(row.description || ''),
    highlights: jsonParse(row.highlights, []), requirements: jsonParse(row.requirements, []),
    intake: String(row.intake || ''), investment: String(row.investment || ''), sortOrder: Number(row.sort_order || 0),
  };
}

function mapTestimonial(row: Record<string, unknown>): Testimonial {
  return {
    id: String(row.id), name: String(row.name), role: String(row.role || ''), location: String(row.location || ''),
    quote: String(row.quote || ''), rating: Number(row.rating || 5), mediaType: row.media_type === 'video' ? 'video' : 'image',
    mediaUrl: String(row.media_url || ''), posterUrl: String(row.poster_url || ''), sortOrder: Number(row.sort_order || 0),
  };
}

function mapTeamMember(row: Record<string, unknown>): TeamMember {
  return {
    id: String(row.id), name: String(row.name), role: String(row.role || ''), bio: String(row.bio || ''),
    credentials: jsonParse(row.credentials, []), photoUrl: String(row.photo_url || ''),
    sortOrder: Number(row.sort_order || 0),
  };
}

function mapAccreditation(row: Record<string, unknown>): Accreditation {
  return {
    id: String(row.id), title: String(row.title), subtitle: String(row.subtitle || ''),
    imageUrl: String(row.image_url || ''), sortOrder: Number(row.sort_order || 0),
  };
}

function mapSubmission(row: Record<string, unknown>): Submission {
  return {
    id: String(row.id), reference: String(row.reference), type: row.type === 'student' ? 'student' : 'job',
    fullName: String(row.full_name), email: String(row.email), data: jsonParse(row.data, {}),
    status: (['new', 'reviewed', 'contacted', 'archived'].includes(String(row.status)) ? String(row.status) : 'new') as SubmissionStatus,
    createdAt: String(row.created_at),
    ip: String(row.ip || ''),
  };
}

function mapVisitor(row: Record<string, unknown>, submissionCount = 0): Visitor {
  return {
    ip: String(row.ip), firstSeen: String(row.first_seen || ''), lastSeen: String(row.last_seen || ''),
    visitCount: Number(row.visit_count || 0), lastPage: String(row.last_page || ''),
    lastUserAgent: String(row.last_user_agent || ''), lastReferrer: String(row.last_referrer || ''),
    submissionCount,
  };
}

function mapVisitorVisit(row: Record<string, unknown>): VisitorVisit {
  const kind = String(row.kind || 'page');
  return {
    id: String(row.id), ip: String(row.ip), path: String(row.path || ''),
    userAgent: String(row.user_agent || ''), referrer: String(row.referrer || ''),
    kind: (['page', 'submission', 'blocked'].includes(kind) ? kind : 'page') as VisitorActivityKind,
    createdAt: String(row.created_at || ''),
  };
}

function mapBlockedIp(row: Record<string, unknown>): BlockedIp {
  return {
    ip: String(row.ip), reason: String(row.reason || ''),
    blockedAt: String(row.blocked_at || ''), blockedBy: String(row.blocked_by || 'admin'),
  };
}

function startOfUtcDay() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}

export async function getPublicData(): Promise<PublicData> {
  await ready();
  if (storageMode === 'preview') {
    const { content, countries, programs, testimonials, teamMembers, accreditations } = await readFallback();
    return { content, countries, programs, testimonials, teamMembers, accreditations };
  }
  const db = client!;
  const [contentResult, countryResult, programResult, testimonialResult, teamResult, accreditationResult] = await Promise.all([
    db.execute('SELECT data FROM site_content WHERE id = 1'),
    db.execute('SELECT * FROM countries ORDER BY sort_order ASC, name ASC'),
    db.execute('SELECT * FROM study_programs ORDER BY sort_order ASC, title ASC'),
    db.execute('SELECT * FROM testimonials ORDER BY sort_order ASC, created_at DESC'),
    db.execute('SELECT * FROM team_members ORDER BY sort_order ASC, name ASC'),
    db.execute('SELECT * FROM accreditations ORDER BY sort_order ASC, title ASC'),
  ]);
  return {
    content: normalizeContent(contentResult.rows[0]?.data),
    countries: countryResult.rows.map((row) => mapCountry(row as unknown as Record<string, unknown>)),
    programs: programResult.rows.map((row) => mapProgram(row as unknown as Record<string, unknown>)),
    testimonials: testimonialResult.rows.map((row) => mapTestimonial(row as unknown as Record<string, unknown>)),
    teamMembers: teamResult.rows.map((row) => mapTeamMember(row as unknown as Record<string, unknown>)),
    accreditations: accreditationResult.rows.map((row) => mapAccreditation(row as unknown as Record<string, unknown>)),
  };
}

/** A lightweight revision token for live clients; no CMS rows or media are returned. */
export async function getPublicContentVersion(): Promise<string> {
  await ready();
  if (storageMode === 'preview') {
    try { return String((await stat(fallbackPath)).mtimeMs); } catch { return '0'; }
  }
  const result = await client!.execute(`SELECT
    (SELECT updated_at FROM site_content WHERE id = 1) AS content_stamp,
    (SELECT COUNT(*) || ':' || COALESCE(MAX(updated_at), '') FROM countries) AS country_stamp,
    (SELECT COUNT(*) || ':' || COALESCE(MAX(updated_at), '') FROM study_programs) AS program_stamp,
    (SELECT COUNT(*) || ':' || COALESCE(MAX(updated_at), '') FROM testimonials) AS testimonial_stamp,
    (SELECT COUNT(*) || ':' || COALESCE(MAX(updated_at), '') FROM team_members) AS team_stamp,
    (SELECT COUNT(*) || ':' || COALESCE(MAX(updated_at), '') FROM accreditations) AS accreditation_stamp`);
  const row = result.rows[0];
  return [row?.content_stamp, row?.country_stamp, row?.program_stamp, row?.testimonial_stamp, row?.team_stamp, row?.accreditation_stamp].map(String).join('|');
}

export async function getAdminData(): Promise<AdminData> {
  const publicData = await getPublicData();
  if (storageMode === 'preview') {
    const data = await readFallback();
    return { ...publicData, submissions: data.submissions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), storageMode };
  }
  const result = await client!.execute('SELECT * FROM submissions ORDER BY created_at DESC');
  return { ...publicData, submissions: result.rows.map((row) => mapSubmission(row as unknown as Record<string, unknown>)), storageMode };
}

export async function saveContent(content: SiteContent) {
  const normalized = normalizeContent(content);
  if (storageMode === 'preview') return mutateFallback((data) => { data.content = normalized; return normalized; });
  await ready();
  await client!.execute({ sql: 'UPDATE site_content SET data = ?, updated_at = ? WHERE id = 1', args: [JSON.stringify(normalized), new Date().toISOString()] });
  return normalized;
}

export async function saveCountry(input: Country) {
  const item = { ...input, id: input.id || `country-${randomUUID()}`, sortOrder: Number(input.sortOrder) || 0 };
  if (storageMode === 'preview') return mutateFallback((data) => {
    const index = data.countries.findIndex((entry) => entry.id === item.id);
    if (index >= 0) data.countries[index] = item; else data.countries.push(item);
    data.countries.sort((a, b) => a.sortOrder - b.sortOrder);
    return item;
  });
  await ready();
  await client!.execute({
    sql: `INSERT INTO countries (id, slug, name, code, flag, tagline, summary, image, routes, eligibility, processes, timeline, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, name=excluded.name, code=excluded.code, flag=excluded.flag, tagline=excluded.tagline, summary=excluded.summary, image=excluded.image, routes=excluded.routes, eligibility=excluded.eligibility, processes=excluded.processes, timeline=excluded.timeline, sort_order=excluded.sort_order, updated_at=excluded.updated_at`,
    args: [item.id, item.slug, item.name, item.code, item.flag, item.tagline, item.summary, item.image, JSON.stringify(item.routes), JSON.stringify(item.eligibility), JSON.stringify(item.processes), JSON.stringify(item.timeline), item.sortOrder, new Date().toISOString()],
  });
  return item;
}

export async function deleteCountry(id: string) {
  if (storageMode === 'preview') return mutateFallback((data) => { data.countries = data.countries.filter((item) => item.id !== id); });
  await ready();
  await client!.execute({ sql: 'DELETE FROM countries WHERE id = ?', args: [id] });
}

export async function saveProgram(input: StudyProgram) {
  const item = { ...input, id: input.id || `program-${randomUUID()}`, sortOrder: Number(input.sortOrder) || 0 };
  if (storageMode === 'preview') return mutateFallback((data) => {
    const index = data.programs.findIndex((entry) => entry.id === item.id);
    if (index >= 0) data.programs[index] = item; else data.programs.push(item);
    data.programs.sort((a, b) => a.sortOrder - b.sortOrder);
    return item;
  });
  await ready();
  await client!.execute({
    sql: `INSERT INTO study_programs (id, degree, title, destination, duration, description, highlights, requirements, intake, investment, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET degree=excluded.degree, title=excluded.title, destination=excluded.destination, duration=excluded.duration, description=excluded.description, highlights=excluded.highlights, requirements=excluded.requirements, intake=excluded.intake, investment=excluded.investment, sort_order=excluded.sort_order, updated_at=excluded.updated_at`,
    args: [item.id, item.degree, item.title, item.destination, item.duration, item.description, JSON.stringify(item.highlights), JSON.stringify(item.requirements), item.intake, item.investment, item.sortOrder, new Date().toISOString()],
  });
  return item;
}

export async function deleteProgram(id: string) {
  if (storageMode === 'preview') return mutateFallback((data) => { data.programs = data.programs.filter((item) => item.id !== id); });
  await ready();
  await client!.execute({ sql: 'DELETE FROM study_programs WHERE id = ?', args: [id] });
}

export async function saveTestimonial(input: Testimonial) {
  const item = { ...input, id: input.id || `testimonial-${randomUUID()}`, rating: Math.min(5, Math.max(1, Number(input.rating) || 5)), sortOrder: Number(input.sortOrder) || 0 };
  if (storageMode === 'preview') return mutateFallback((data) => {
    const index = data.testimonials.findIndex((entry) => entry.id === item.id);
    if (index >= 0) data.testimonials[index] = item; else data.testimonials.push(item);
    data.testimonials.sort((a, b) => a.sortOrder - b.sortOrder);
    return item;
  });
  await ready();
  await client!.execute({
    sql: `INSERT INTO testimonials (id, name, role, location, quote, rating, media_type, media_url, poster_url, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, role=excluded.role, location=excluded.location, quote=excluded.quote, rating=excluded.rating, media_type=excluded.media_type, media_url=excluded.media_url, poster_url=excluded.poster_url, sort_order=excluded.sort_order, updated_at=excluded.updated_at`,
    args: [item.id, item.name, item.role, item.location, item.quote, item.rating, item.mediaType, item.mediaUrl, item.posterUrl, item.sortOrder, new Date().toISOString()],
  });
  return item;
}

export async function deleteTestimonial(id: string) {
  if (storageMode === 'preview') return mutateFallback((data) => { data.testimonials = data.testimonials.filter((item) => item.id !== id); });
  await ready();
  await client!.execute({ sql: 'DELETE FROM testimonials WHERE id = ?', args: [id] });
}

export async function saveTeamMember(input: TeamMember) {
  const item = { ...input, id: input.id || `team-${randomUUID()}`, sortOrder: Number(input.sortOrder) || 0 };
  if (storageMode === 'preview') return mutateFallback((data) => {
    const index = data.teamMembers.findIndex((entry) => entry.id === item.id);
    if (index >= 0) data.teamMembers[index] = item; else data.teamMembers.push(item);
    data.teamMembers.sort((a, b) => a.sortOrder - b.sortOrder);
    return item;
  });
  await ready();
  await client!.execute({
    sql: `INSERT INTO team_members (id, name, role, bio, credentials, photo_url, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, role=excluded.role, bio=excluded.bio, credentials=excluded.credentials, photo_url=excluded.photo_url, sort_order=excluded.sort_order, updated_at=excluded.updated_at`,
    args: [item.id, item.name, item.role, item.bio, JSON.stringify(item.credentials), item.photoUrl, item.sortOrder, new Date().toISOString()],
  });
  return item;
}

export async function deleteTeamMember(id: string) {
  if (storageMode === 'preview') return mutateFallback((data) => { data.teamMembers = data.teamMembers.filter((item) => item.id !== id); });
  await ready();
  await client!.execute({ sql: 'DELETE FROM team_members WHERE id = ?', args: [id] });
}

export async function saveAccreditation(input: Accreditation) {
  const item = { ...input, id: input.id || `accreditation-${randomUUID()}`, sortOrder: Number(input.sortOrder) || 0 };
  if (storageMode === 'preview') return mutateFallback((data) => {
    const index = data.accreditations.findIndex((entry) => entry.id === item.id);
    if (index >= 0) data.accreditations[index] = item; else data.accreditations.push(item);
    data.accreditations.sort((a, b) => a.sortOrder - b.sortOrder);
    return item;
  });
  await ready();
  await client!.execute({
    sql: `INSERT INTO accreditations (id, title, subtitle, image_url, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title=excluded.title, subtitle=excluded.subtitle, image_url=excluded.image_url, sort_order=excluded.sort_order, updated_at=excluded.updated_at`,
    args: [item.id, item.title, item.subtitle, item.imageUrl, item.sortOrder, new Date().toISOString()],
  });
  return item;
}

export async function deleteAccreditation(id: string) {
  if (storageMode === 'preview') return mutateFallback((data) => { data.accreditations = data.accreditations.filter((item) => item.id !== id); });
  await ready();
  await client!.execute({ sql: 'DELETE FROM accreditations WHERE id = ?', args: [id] });
}

function reference(type: SubmissionType) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `RP-${type === 'job' ? 'JOB' : 'STU'}-${date}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export async function createSubmission(type: SubmissionType, data: Record<string, unknown>, rawIp = '') {
  const item: Submission = {
    id: randomUUID(), reference: reference(type), type,
    fullName: String(data.fullName), email: String(data.email).toLowerCase(), data,
    status: 'new', createdAt: new Date().toISOString(), ip: normalizeIp(rawIp) || '',
  };
  if (storageMode === 'preview') return mutateFallback((store) => { store.submissions.push(item); return item; });
  await ready();
  await client!.execute({
    sql: 'INSERT INTO submissions (id, reference, type, full_name, email, data, status, created_at, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [item.id, item.reference, item.type, item.fullName, item.email, JSON.stringify(item.data), item.status, item.createdAt, item.ip] as InValue[],
  });
  return item;
}

export async function updateSubmissionStatus(id: string, status: SubmissionStatus) {
  if (storageMode === 'preview') return mutateFallback((data) => {
    const item = data.submissions.find((entry) => entry.id === id);
    if (!item) throw new Error('Submission not found.');
    item.status = status;
    return item;
  });
  await ready();
  const result = await client!.execute({ sql: 'UPDATE submissions SET status = ? WHERE id = ? RETURNING *', args: [status, id] });
  if (!result.rows[0]) throw new Error('Submission not found.');
  return mapSubmission(result.rows[0] as unknown as Record<string, unknown>);
}

export async function deleteSubmission(id: string) {
  if (storageMode === 'preview') return mutateFallback((data) => { data.submissions = data.submissions.filter((item) => item.id !== id); });
  await ready();
  await client!.execute({ sql: 'DELETE FROM submissions WHERE id = ?', args: [id] });
}

/* ------------------------------------------------------------------------- *
 * Visitor tracking & IP firewall
 * ------------------------------------------------------------------------- */

/** Maximum activity rows retained in Turso before the oldest entries rotate out. */
const MAX_ACTIVITY_ROWS = 5000;
const VISITOR_RETENTION_DAYS = 365;

export interface RecordVisitInput {
  ip: string;
  path?: string;
  userAgent?: string;
  referrer?: string;
  kind?: VisitorActivityKind;
}

/**
 * Records a page view or assessment submission for a visitor address. Never
 * throws: tracking must not be able to break a public page render.
 */
export async function recordVisit(input: RecordVisitInput): Promise<void> {
  const ip = normalizeIp(input.ip);
  // Internal server requests arrive without proxy headers and resolve to
  // loopback; they are not real visitors and would only add noise to the logs.
  if (!ip || isLoopbackIp(ip)) return;

  const now = new Date().toISOString();
  const path = (input.path || '/').slice(0, 300) || '/';
  const userAgent = (input.userAgent || '').slice(0, 400);
  const referrer = (input.referrer || '').slice(0, 500);
  const kind: VisitorActivityKind = input.kind === 'submission' || input.kind === 'blocked' ? input.kind : 'page';
  const id = randomUUID();

  if (storageMode === 'preview') {
    await mutateFallback((data) => {
      const existing = data.visitors.find((entry) => entry.ip === ip);
      if (existing) {
        existing.lastSeen = now;
        existing.visitCount += 1;
        existing.lastPage = path;
        existing.lastUserAgent = userAgent;
        existing.lastReferrer = referrer;
      } else {
        data.visitors.push({
          ip, firstSeen: now, lastSeen: now, visitCount: 1, lastPage: path,
          lastUserAgent: userAgent, lastReferrer: referrer, submissionCount: 0,
        });
      }
      data.visitorVisits.unshift({ id, ip, path, userAgent, referrer, kind, createdAt: now });
      if (data.visitorVisits.length > MAX_ACTIVITY_ROWS) data.visitorVisits.length = MAX_ACTIVITY_ROWS;
    });
    return;
  }

  await ready();
  await Promise.all([
    client!.execute({
      sql: `INSERT INTO visitors (ip, first_seen, last_seen, visit_count, last_page, last_user_agent, last_referrer)
            VALUES (?, ?, ?, 1, ?, ?, ?)
            ON CONFLICT(ip) DO UPDATE SET
              last_seen = excluded.last_seen,
              visit_count = visitors.visit_count + 1,
              last_page = excluded.last_page,
              last_user_agent = excluded.last_user_agent,
              last_referrer = excluded.last_referrer`,
      args: [ip, now, now, path, userAgent, referrer],
    }),
    client!.execute({
      sql: 'INSERT INTO visitor_visits (id, ip, path, user_agent, referrer, kind, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [id, ip, path, userAgent, referrer, kind, now],
    }),
  ]);

  // Rotate the activity log and drop stale aggregates opportunistically so
  // neither table grows without bound. Submissions keep their own IP record.
  if (Math.random() < 0.03) {
    const staleBefore = new Date(Date.now() - VISITOR_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await Promise.all([
      client!.execute({
        sql: 'DELETE FROM visitor_visits WHERE id IN (SELECT id FROM visitor_visits ORDER BY created_at DESC LIMIT -1 OFFSET ?)',
        args: [MAX_ACTIVITY_ROWS],
      }),
      client!.execute({ sql: 'DELETE FROM visitors WHERE last_seen < ?', args: [staleBefore] }),
    ]).catch(() => undefined);
  }
}

/** True when the address is on the Turso firewall list. Invalid values are never blocked. */
export async function isIpBlocked(rawIp: string): Promise<boolean> {
  const ip = normalizeIp(rawIp);
  if (!ip) return false;
  if (storageMode === 'preview') {
    const data = await readFallback();
    return data.blockedIps.some((entry) => entry.ip === ip);
  }
  await ready();
  const result = await client!.execute({ sql: 'SELECT 1 FROM blocked_ips WHERE ip = ? LIMIT 1', args: [ip] });
  return result.rows.length > 0;
}

export async function blockIp(rawIp: string, reason = '', blockedBy = 'admin') {
  const ip = normalizeIp(rawIp);
  if (!ip) throw new Error('Enter a valid IPv4 or IPv6 address to block.');
  const entry: BlockedIp = {
    ip, reason: reason.trim().slice(0, 280), blockedAt: new Date().toISOString(), blockedBy,
  };

  if (storageMode === 'preview') {
    await mutateFallback((data) => {
      data.blockedIps = data.blockedIps.filter((item) => item.ip !== ip);
      data.blockedIps.unshift(entry);
    });
    return entry;
  }

  await ready();
  await client!.execute({
    sql: `INSERT INTO blocked_ips (ip, reason, blocked_at, blocked_by) VALUES (?, ?, ?, ?)
          ON CONFLICT(ip) DO UPDATE SET reason = excluded.reason, blocked_at = excluded.blocked_at, blocked_by = excluded.blocked_by`,
    args: [entry.ip, entry.reason, entry.blockedAt, entry.blockedBy],
  });
  return entry;
}

export async function unblockIp(rawIp: string) {
  const ip = normalizeIp(rawIp);
  if (!ip) throw new Error('Enter a valid IPv4 or IPv6 address to unblock.');

  if (storageMode === 'preview') {
    let removed = false;
    await mutateFallback((data) => {
      const before = data.blockedIps.length;
      data.blockedIps = data.blockedIps.filter((entry) => entry.ip !== ip);
      removed = data.blockedIps.length !== before;
    });
    return { ip, removed };
  }

  await ready();
  const result = await client!.execute({ sql: 'DELETE FROM blocked_ips WHERE ip = ?', args: [ip] });
  return { ip, removed: Number(result.rowsAffected) > 0 };
}

/** Aggregated data for the Admin Portal "Visitor Logs & IP Security" tab. */
export async function getSecurityOverview(currentIp: string | null = null): Promise<SecurityOverview> {
  await ready();

  if (storageMode === 'preview') {
    const data = await readFallback();
    const dayStart = startOfUtcDay();
    const counts = new Map<string, number>();
    for (const item of data.submissions) {
      if (!item.ip) continue;
      counts.set(item.ip, (counts.get(item.ip) || 0) + 1);
    }
    const visitors = [...data.visitors]
      .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
      .slice(0, 250)
      .map((entry) => ({ ...entry, submissionCount: counts.get(entry.ip) || 0 }));
    return {
      storageMode,
      visitors,
      recentVisits: [...data.visitorVisits].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100),
      blockedIps: [...data.blockedIps].sort((a, b) => b.blockedAt.localeCompare(a.blockedAt)),
      stats: {
        totalVisitors: data.visitors.length,
        totalVisits: data.visitors.reduce((total, entry) => total + entry.visitCount, 0),
        visitsToday: data.visitorVisits.filter((entry) => entry.createdAt >= dayStart).length,
        blockedCount: data.blockedIps.length,
        linkedSubmissions: [...counts.values()].reduce((total, count) => total + count, 0),
        submissionsToday: data.submissions.filter((entry) => entry.createdAt >= dayStart).length,
      },
      currentIp,
    };
  }

  const db = client!;
  const dayStart = startOfUtcDay();
  const [visitorRows, visitRows, blockedRows, totals, todayVisits, submissionRows, todaySubmissions] = await Promise.all([
    db.execute('SELECT * FROM visitors ORDER BY last_seen DESC LIMIT 250'),
    db.execute('SELECT * FROM visitor_visits ORDER BY created_at DESC LIMIT 100'),
    db.execute('SELECT * FROM blocked_ips ORDER BY blocked_at DESC'),
    db.execute('SELECT COUNT(*) AS total_visitors, COALESCE(SUM(visit_count), 0) AS total_visits FROM visitors'),
    db.execute({ sql: 'SELECT COUNT(*) AS visits_today FROM visitor_visits WHERE created_at >= ?', args: [dayStart] }),
    db.execute("SELECT ip, COUNT(*) AS count FROM submissions WHERE ip <> '' GROUP BY ip"),
    db.execute({ sql: 'SELECT COUNT(*) AS count FROM submissions WHERE created_at >= ?', args: [dayStart] }),
  ]);

  const submissionCounts = new Map<string, number>();
  for (const row of submissionRows.rows) submissionCounts.set(String(row.ip), Number(row.count || 0));

  const visitors = visitorRows.rows.map((row) => {
    const record = row as unknown as Record<string, unknown>;
    return mapVisitor(record, submissionCounts.get(String(record.ip)) || 0);
  });
  const totalRow = totals.rows[0] as unknown as Record<string, unknown> | undefined;

  return {
    storageMode,
    visitors,
    recentVisits: visitRows.rows.map((row) => mapVisitorVisit(row as unknown as Record<string, unknown>)),
    blockedIps: blockedRows.rows.map((row) => mapBlockedIp(row as unknown as Record<string, unknown>)),
    stats: {
      totalVisitors: Number(totalRow?.total_visitors || 0),
      totalVisits: Number(totalRow?.total_visits || 0),
      visitsToday: Number((todayVisits.rows[0] as unknown as Record<string, unknown> | undefined)?.visits_today || 0),
      blockedCount: blockedRows.rows.length,
      linkedSubmissions: [...submissionCounts.values()].reduce((total, count) => total + count, 0),
      submissionsToday: Number((todaySubmissions.rows[0] as unknown as Record<string, unknown> | undefined)?.count || 0),
    },
    currentIp,
  };
}
