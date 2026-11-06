# Redpath Immigration — Website, CMS & Admin Portal

A complete immigration agency website and content-management workspace built with **Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, Netlify and Turso (`@libsql/client`)**.

The project includes a polished public website, structured CMS editing, device media uploads, conditional job and postgraduate assessments, and a private submission-management dashboard. It is seeded with five destinations, Master's/PhD programs, testimonials, legal content and all form labels/options.

## Run the application

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The dev server binds to `0.0.0.0` for workspace previews.

```bash
npm run typecheck   # TypeScript validation
npm run build       # Production build
npm start           # Serve the production build
```

## Admin Portal

- URL: `/admin`
- Email: `portal11@gmail.com`
- Password: `Hankr8119$`

The **Admin Portal** navigation entry is hidden below `1024px` and appears only on laptop/desktop screens. There is no client portal or client login.

Authentication uses a signed, HTTP-only, same-site session cookie with an eight-hour expiry. Login and public submissions are rate-limited. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD` and a strong random `AUTH_SECRET` in production; the supplied credentials remain the defaults required by this project.

## What is editable

### Branding & general content

- Agency logo, name, tagline, contact information and SEO copy
- Navigation links, hero content, imagery and statistical badges
- Destination, testimonial, final CTA and footer copy
- Journey steps and frequently asked questions
- Consultation cards, success content, privacy text and terms & conditions
- Every assessment field label, shared control label and select/tick-box option
- Advanced, validated JSON editing for the complete public content document

### Countries & processes

Add, edit and delete destinations, including imagery, flag, routes, eligibility criteria, immigration process steps and detailed timelines. The initial destinations are the USA, Canada, UK, Luxembourg and Australia.

### Study abroad

Edit the full section introduction and image, then manage any number of Master's, PhD or custom postgraduate programs. Each program supports destination countries, duration, highlights, requirements, intake and tuition/funding guidance.

### Testimonials

Add, edit and delete client stories with ratings, roles and locations. Upload photos, playable videos and optional video poster images directly from a device. Uploads are converted to Base64 data URLs and stored with their CMS record, so no third-party media service is needed.

### Consultation submissions

- Filter All / Job / Student and by follow-up status
- Search by applicant, email or private reference
- Open a grouped, full-detail view of every submitted answer
- Mark assessments New, Reviewed, Contacted or Archived
- Export the current filtered result to CSV
- Permanently delete records when required by your retention policy

## Assessment forms

The public **Book a consultation now** buttons open a glassmorphic, dynamic-logo assessment modal.

**Job assessment:** personal/contact details, children conditional logic, passport details, education, current and previous employment, 20 professional skills, language-level matrix, employment preferences, medical/criminal/travel/family/exam disclosures and mandatory terms.

**Student assessment:** personal/contact details, conditional passport details, repeatable education history, Master's/PhD target, destination, course/research field, intake, funding, language proficiency/exams, all disclosures and mandatory terms.

Both forms use five guided steps, per-step validation, conditional fields, keyboard-accessible dialogs, server-side validation, a honeypot and submission references.

## Database and preview fallback

Copy the environment template when needed:

```bash
cp .env.example .env.local
```

### Without Turso (instant preview)

No setup is required. The application automatically creates and seeds `.data/cms.json`. All edits, uploads and submissions work in the preview. This file is intentionally Git-ignored.

On Netlify, if Turso variables are absent, the fallback uses `/tmp` so the app remains functional, but serverless fallback data is **ephemeral** and should not be used as the production system of record. The admin dashboard clearly displays which storage mode is active.

### With Turso (production)

Set:

```bash
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-token
AUTH_SECRET=a-long-random-secret
```

The app automatically executes `db/schema.sql` and idempotently inserts missing seed records on first use. Existing CMS edits are preserved. You can also initialize explicitly:

```bash
npm run db:init
```

The SQL schema contains:

- `site_content`
- `countries`
- `study_programs`
- `testimonials`
- `submissions`

`db/seed.json` is the shared source for initial content used by automatic initialization and the standalone seed script.

## Deploy to Netlify

`netlify.toml` is already configured with Next.js build settings and `@netlify/plugin-nextjs`.

1. Push this repository to GitHub.
2. In Netlify, choose **Add new site → Import an existing project** and select the repository.
3. Keep the supplied build command (`npm run build`) and publish directory (`.next`).
4. Add `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` and `AUTH_SECRET` under **Site configuration → Environment variables**. Optionally override the admin credentials.
5. Deploy. The Next runtime and API routes are deployed by Netlify's Next.js plugin.

To create a Turso database with the Turso CLI:

```bash
turso db create redpath-immigration
turso db show redpath-immigration --url
turso db tokens create redpath-immigration
```

Use the resulting URL and token in `.env.local` for `npm run db:init`, and in Netlify for deployment.

## Media limits

Base64 keeps uploads portable across Turso and the preview store, but serverless platforms impose request/response limits. The UI limits logos to 2 MB, testimonial images to 3 MB and testimonial videos to 4 MB. Compress larger video clips before upload. All uploads render immediately in the editor and persist when the record is saved.

## Project structure

```text
app/                       Public page, admin page and API route handlers
components/site/           Public sections, country explorer and assessments
components/admin/          Login, CMS managers and submission viewer
components/ui/             Buttons, modals, fields, uploads and motion
lib/                       Types, auth, validation, Turso/preview repository
db/schema.sql              Complete idempotent SQL schema
db/seed.json               Initial site, destination, program and media records
scripts/init-db.mjs        Standalone Turso initialization/seed script
public/images/             Initial editorial imagery
netlify.toml               Netlify build/runtime configuration
```

## Operational notes

- Public pages are dynamically rendered so saved CMS changes appear without a rebuild.
- Admin APIs reject unauthenticated requests; the admin page itself is marked `noindex`.
- The preview store uses atomic writes and a local mutation queue.
- Turso seed operations use `INSERT OR IGNORE`, so rerunning initialization does not overwrite live content.
- To reset only the local preview, stop the app, delete `.data/cms.json`, and restart. Do this only if you intend to discard preview edits and submissions.
