PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS site_content (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  flag TEXT NOT NULL DEFAULT '',
  tagline TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  routes TEXT NOT NULL DEFAULT '[]',
  eligibility TEXT NOT NULL DEFAULT '[]',
  processes TEXT NOT NULL DEFAULT '[]',
  timeline TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Degree labels are CMS-managed free text, supporting Bachelor's (BSc), Master's, PhD and custom programs.
CREATE TABLE IF NOT EXISTS study_programs (
  id TEXT PRIMARY KEY,
  degree TEXT NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  highlights TEXT NOT NULL DEFAULT '[]',
  requirements TEXT NOT NULL DEFAULT '[]',
  intake TEXT NOT NULL DEFAULT '',
  investment TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL DEFAULT '',
  poster_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  credentials TEXT NOT NULL DEFAULT '[]',
  photo_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accreditations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('job', 'student')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  data TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'contacted', 'archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Visitor address captured from the request headers at submission time.
  ip TEXT NOT NULL DEFAULT ''
);

-- One aggregate row per visitor address (visit count, timestamps, last page).
CREATE TABLE IF NOT EXISTS visitors (
  ip TEXT PRIMARY KEY,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  visit_count INTEGER NOT NULL DEFAULT 0,
  last_page TEXT NOT NULL DEFAULT '',
  last_user_agent TEXT NOT NULL DEFAULT '',
  last_referrer TEXT NOT NULL DEFAULT ''
);

-- Append-only activity log for the security dashboard (trimmed automatically).
CREATE TABLE IF NOT EXISTS visitor_visits (
  id TEXT PRIMARY KEY,
  ip TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'page' CHECK (kind IN ('page', 'submission', 'blocked')),
  created_at TEXT NOT NULL
);

-- Firewall list. Any address here receives the 403 Access Denied page.
CREATE TABLE IF NOT EXISTS blocked_ips (
  ip TEXT PRIMARY KEY,
  reason TEXT NOT NULL DEFAULT '',
  blocked_at TEXT NOT NULL,
  blocked_by TEXT NOT NULL DEFAULT 'admin'
);

CREATE INDEX IF NOT EXISTS idx_submissions_type_created ON submissions(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_countries_order ON countries(sort_order);
CREATE INDEX IF NOT EXISTS idx_programs_order ON study_programs(sort_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_order ON testimonials(sort_order);
CREATE INDEX IF NOT EXISTS idx_team_members_order ON team_members(sort_order);
CREATE INDEX IF NOT EXISTS idx_accreditations_order ON accreditations(sort_order);
CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON visitors(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_visits_created ON visitor_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_visits_ip ON visitor_visits(ip, created_at DESC);
