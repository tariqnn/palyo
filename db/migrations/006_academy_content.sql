CREATE TABLE IF NOT EXISTS academy_packages (
  id TEXT PRIMARY KEY,
  academy_id TEXT NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS academy_packages_public_idx ON academy_packages(academy_id, sort_order);

CREATE TABLE IF NOT EXISTS academy_events (
  id TEXT PRIMARY KEY,
  academy_id TEXT NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  starts_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS academy_events_public_idx ON academy_events(status, starts_at);
