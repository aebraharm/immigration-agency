import 'server-only';
import { createClient, type Client, type InValue } from '@libsql/client';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createSeedData, seedContent, seedCountries, seedPrograms, seedTestimonials } from './seed';
import type {
  AdminData, Country, PublicData, SiteContent, StorageMode, StudyProgram,
  Submission, SubmissionStatus, SubmissionType, Testimonial,
} from './types';

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;
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
  return mergeDefaults(seedContent, value) as SiteContent;
}

async function schema() {
  return readFile(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');
}

async function writeFallback(data: AdminData) {
  await mkdir(path.dirname(fallbackPath), { recursive: true });
  const temporary = `${fallbackPath}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(data, null, 2), 'utf8');
  await rename(temporary, fallbackPath);
}

async function seedFallback() {
  const data = createSeedData();
  await writeFallback(data);
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
}

async function initialize() {
  if (storageMode === 'turso') {
    client = createClient({ url: tursoUrl!, authToken: tursoToken! });
    await client.executeMultiple(await schema());
    await seedTurso(client);
  } else {
    try { await readFile(fallbackPath, 'utf8'); } catch { await seedFallback(); }
  }
}

async function ready() {
  if (!initialization) initialization = initialize().catch((error) => { initialization = undefined; throw error; });
  await initialization;
}

async function readFallback(): Promise<AdminData> {
  await ready();
  try {
    const data = JSON.parse(await readFile(fallbackPath, 'utf8')) as AdminData;
    return { ...data, content: normalizeContent(data.content), storageMode: 'preview' };
  } catch {
    await seedFallback();
    return createSeedData();
  }
}

async function mutateFallback<T>(mutator: (data: AdminData) => T | Promise<T>): Promise<T> {
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

function mapSubmission(row: Record<string, unknown>): Submission {
  return {
    id: String(row.id), reference: String(row.reference), type: row.type === 'student' ? 'student' : 'job',
    fullName: String(row.full_name), email: String(row.email), data: jsonParse(row.data, {}),
    status: (['new', 'reviewed', 'contacted', 'archived'].includes(String(row.status)) ? String(row.status) : 'new') as SubmissionStatus,
    createdAt: String(row.created_at),
  };
}

export async function getPublicData(): Promise<PublicData> {
  await ready();
  if (storageMode === 'preview') {
    const { content, countries, programs, testimonials } = await readFallback();
    return { content, countries, programs, testimonials };
  }
  const db = client!;
  const [contentResult, countryResult, programResult, testimonialResult] = await Promise.all([
    db.execute('SELECT data FROM site_content WHERE id = 1'),
    db.execute('SELECT * FROM countries ORDER BY sort_order ASC, name ASC'),
    db.execute('SELECT * FROM study_programs ORDER BY sort_order ASC, title ASC'),
    db.execute('SELECT * FROM testimonials ORDER BY sort_order ASC, created_at DESC'),
  ]);
  return {
    content: normalizeContent(contentResult.rows[0]?.data),
    countries: countryResult.rows.map((row) => mapCountry(row as unknown as Record<string, unknown>)),
    programs: programResult.rows.map((row) => mapProgram(row as unknown as Record<string, unknown>)),
    testimonials: testimonialResult.rows.map((row) => mapTestimonial(row as unknown as Record<string, unknown>)),
  };
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

function reference(type: SubmissionType) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `RP-${type === 'job' ? 'JOB' : 'STU'}-${date}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export async function createSubmission(type: SubmissionType, data: Record<string, unknown>) {
  const item: Submission = {
    id: randomUUID(), reference: reference(type), type,
    fullName: String(data.fullName), email: String(data.email).toLowerCase(), data,
    status: 'new', createdAt: new Date().toISOString(),
  };
  if (storageMode === 'preview') return mutateFallback((store) => { store.submissions.push(item); return item; });
  await ready();
  await client!.execute({
    sql: 'INSERT INTO submissions (id, reference, type, full_name, email, data, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [item.id, item.reference, item.type, item.fullName, item.email, JSON.stringify(item.data), item.status, item.createdAt] as InValue[],
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
