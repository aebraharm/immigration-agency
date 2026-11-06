import { createClient } from '@libsql/client';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  const env = await readFile(file, 'utf8');
  for (const line of env.split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.log('Turso environment variables are not set. The app will use its automatic preview store.');
  console.log('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN, then run npm run db:init again.');
  process.exit(0);
}

const db = createClient({ url, authToken });
const schema = await readFile(path.join(process.cwd(), 'db/schema.sql'), 'utf8');
const seed = JSON.parse(await readFile(path.join(process.cwd(), 'db/seed.json'), 'utf8'));
const now = new Date().toISOString();

console.log(`Initializing ${url}…`);
await db.executeMultiple(schema);
await db.execute({ sql: 'INSERT OR IGNORE INTO site_content (id, data, updated_at) VALUES (1, ?, ?)', args: [JSON.stringify(seed.content), now] });
for (const item of seed.countries) {
  await db.execute({ sql: 'INSERT OR IGNORE INTO countries (id, slug, name, code, flag, tagline, summary, image, routes, eligibility, processes, timeline, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', args: [item.id, item.slug, item.name, item.code, item.flag, item.tagline, item.summary, item.image, JSON.stringify(item.routes), JSON.stringify(item.eligibility), JSON.stringify(item.processes), JSON.stringify(item.timeline), item.sortOrder, now] });
}
for (const item of seed.programs) {
  await db.execute({ sql: 'INSERT OR IGNORE INTO study_programs (id, degree, title, destination, duration, description, highlights, requirements, intake, investment, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', args: [item.id, item.degree, item.title, item.destination, item.duration, item.description, JSON.stringify(item.highlights), JSON.stringify(item.requirements), item.intake, item.investment, item.sortOrder, now] });
}
for (const item of seed.testimonials) {
  await db.execute({ sql: 'INSERT OR IGNORE INTO testimonials (id, name, role, location, quote, rating, media_type, media_url, poster_url, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', args: [item.id, item.name, item.role, item.location, item.quote, item.rating, item.mediaType, item.mediaUrl, item.posterUrl, item.sortOrder, now] });
}
for (const item of seed.teamMembers) {
  await db.execute({ sql: 'INSERT OR IGNORE INTO team_members (id, name, role, bio, credentials, photo_url, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', args: [item.id, item.name, item.role, item.bio, JSON.stringify(item.credentials), item.photoUrl, item.sortOrder, now] });
}
for (const item of seed.accreditations) {
  await db.execute({ sql: 'INSERT OR IGNORE INTO accreditations (id, title, subtitle, image_url, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?)', args: [item.id, item.title, item.subtitle, item.imageUrl, item.sortOrder, now] });
}
const tables = ['site_content', 'countries', 'study_programs', 'testimonials', 'team_members', 'accreditations', 'submissions'];
for (const table of tables) {
  const result = await db.execute(`SELECT COUNT(*) AS count FROM ${table}`);
  console.log(`✓ ${table}: ${result.rows[0].count} records`);
}
console.log('Turso schema and idempotent seed complete. Existing CMS edits were preserved.');
