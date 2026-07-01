CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  province TEXT,
  city TEXT,
  district TEXT,
  industry TEXT,
  website TEXT,
  source TEXT,
  hiring_status TEXT DEFAULT 'new',
  confidence_score NUMERIC(5,2),
  notes TEXT,
  last_ai_read_date DATE,
  last_ai_read_at TIMESTAMPTZ,
  last_ai_write_date DATE,
  last_ai_write_at TIMESTAMPTZ,
  ai_claimed_task_id TEXT,
  ai_claimed_at TIMESTAMPTZ,
  process_round INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS companies ADD COLUMN IF NOT EXISTS last_ai_read_date DATE;
ALTER TABLE IF EXISTS companies ADD COLUMN IF NOT EXISTS last_ai_read_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS companies ADD COLUMN IF NOT EXISTS last_ai_write_date DATE;
ALTER TABLE IF EXISTS companies ADD COLUMN IF NOT EXISTS last_ai_write_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS companies ADD COLUMN IF NOT EXISTS ai_claimed_task_id TEXT;
ALTER TABLE IF EXISTS companies ADD COLUMN IF NOT EXISTS ai_claimed_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS companies ADD COLUMN IF NOT EXISTS process_round INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS companies_normalized_name_idx ON companies (normalized_name);
CREATE INDEX IF NOT EXISTS companies_hiring_status_idx ON companies (hiring_status);
CREATE INDEX IF NOT EXISTS companies_city_idx ON companies (city);
CREATE INDEX IF NOT EXISTS companies_daily_queue_idx ON companies (hiring_status, last_ai_read_date, updated_at, id);

CREATE TABLE IF NOT EXISTS task_sessions (
  id TEXT PRIMARY KEY,
  title TEXT,
  status TEXT DEFAULT 'active',
  task_dir TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS task_messages (
  id BIGSERIAL PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES task_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_messages_task_id_idx ON task_messages (task_id, created_at);

CREATE TABLE IF NOT EXISTS company_contacts (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL,
  value TEXT NOT NULL,
  source_url TEXT,
  confidence_score NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT,
  title TEXT NOT NULL,
  location TEXT,
  salary TEXT,
  education TEXT,
  experience TEXT,
  description TEXT,
  apply_url TEXT,
  source_platform TEXT,
  source_url TEXT,
  status TEXT DEFAULT 'found',
  fit_score NUMERIC(5,2),
  evidence_text TEXT,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE IF EXISTS jobs ADD COLUMN IF NOT EXISTS ai_screen_status TEXT DEFAULT 'pending';
ALTER TABLE IF EXISTS jobs ADD COLUMN IF NOT EXISTS ai_screen_note TEXT;
ALTER TABLE IF EXISTS jobs ADD COLUMN IF NOT EXISTS ai_screen_score NUMERIC(5,2);
ALTER TABLE IF EXISTS jobs ADD COLUMN IF NOT EXISTS ai_screen_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS jobs ADD COLUMN IF NOT EXISTS ai_screen_task_id TEXT;
ALTER TABLE IF EXISTS jobs ADD COLUMN IF NOT EXISTS ai_screen_round INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS jobs_company_id_idx ON jobs (company_id);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs (status);
CREATE INDEX IF NOT EXISTS jobs_ai_screen_status_idx ON jobs (ai_screen_status, ai_screen_at, id);
CREATE INDEX IF NOT EXISTS jobs_last_seen_idx ON jobs (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS jobs_title_idx ON jobs USING gin (to_tsvector('simple', title));

CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  resume_version TEXT,
  status TEXT DEFAULT 'draft',
  applied_at TIMESTAMPTZ,
  account_used TEXT,
  notes TEXT,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS applications_status_idx ON applications (status);

CREATE TABLE IF NOT EXISTS notes (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE,
  note_type TEXT DEFAULT 'general',
  content TEXT NOT NULL,
  created_by TEXT DEFAULT 'ai',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS downloaded_files (
  id BIGSERIAL PRIMARY KEY,
  task_id TEXT REFERENCES task_sessions(id) ON DELETE SET NULL,
  original_path TEXT,
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_ext TEXT,
  mime_type TEXT,
  file_size BIGINT,
  sha256 TEXT UNIQUE,
  source_url TEXT,
  title TEXT,
  status TEXT DEFAULT 'indexed',
  extracted_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS downloaded_files ADD COLUMN IF NOT EXISTS task_id TEXT REFERENCES task_sessions(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS downloaded_files ADD COLUMN IF NOT EXISTS original_path TEXT;
ALTER TABLE IF EXISTS downloaded_files DROP CONSTRAINT IF EXISTS downloaded_files_sha256_key;

CREATE INDEX IF NOT EXISTS downloaded_files_created_idx ON downloaded_files (created_at DESC);
CREATE INDEX IF NOT EXISTS downloaded_files_task_idx ON downloaded_files (task_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS downloaded_files_ext_idx ON downloaded_files (file_ext);
CREATE INDEX IF NOT EXISTS downloaded_files_text_idx ON downloaded_files USING gin (to_tsvector('simple', coalesce(extracted_text, '')));
CREATE UNIQUE INDEX IF NOT EXISTS downloaded_files_task_sha_idx ON downloaded_files (task_id, sha256) WHERE task_id IS NOT NULL AND sha256 IS NOT NULL;

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
  job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  detail JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
