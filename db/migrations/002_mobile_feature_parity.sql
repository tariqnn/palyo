ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS reliability INTEGER NOT NULL DEFAULT 100 CHECK (reliability BETWEEN 0 AND 100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS academy_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{"booking":true,"matches":true,"rewards":true,"community":true}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_preferences JSONB NOT NULL DEFAULT '{"profile":"public","activity":true,"friendRequests":true}';

CREATE TABLE IF NOT EXISTS academies (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, area TEXT NOT NULL, address TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '', sports TEXT[] NOT NULL DEFAULT '{}', image_url TEXT NOT NULL,
 rating NUMERIC NOT NULL DEFAULT 4.8, verified BOOLEAN NOT NULL DEFAULT FALSE,
 phone TEXT, email TEXT, website TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS academy_id TEXT REFERENCES academies(id);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS hourly_rate_fils INTEGER NOT NULL DEFAULT 20000 CHECK (hourly_rate_fils >= 0);

CREATE TABLE IF NOT EXISTS court_bookings (
 id TEXT PRIMARY KEY, reference TEXT NOT NULL UNIQUE, venue_id TEXT NOT NULL REFERENCES venues(id),
 user_id TEXT NOT NULL REFERENCES users(id), starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
 status TEXT NOT NULL DEFAULT 'CONFIRMED', payment_status TEXT NOT NULL DEFAULT 'PAY_AT_VENUE',
 amount_fils INTEGER NOT NULL CHECK (amount_fils >= 0), participant_count INTEGER NOT NULL DEFAULT 1,
 cancellation_reason TEXT, checked_in_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS court_bookings_availability_idx ON court_bookings(venue_id,starts_at,ends_at,status);
CREATE INDEX IF NOT EXISTS court_bookings_user_idx ON court_bookings(user_id,starts_at);

CREATE TABLE IF NOT EXISTS friendships (
 id TEXT PRIMARY KEY, requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 addressee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 status TEXT NOT NULL DEFAULT 'PENDING', created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK (requester_id <> addressee_id),
 UNIQUE(requester_id,addressee_id)
);

CREATE TABLE IF NOT EXISTS offers (
 id TEXT PRIMARY KEY, academy_id TEXT REFERENCES academies(id), title TEXT NOT NULL,
 partner TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Academy', description TEXT NOT NULL,
 points_cost INTEGER NOT NULL CHECK (points_cost >= 0), image_url TEXT,
 active BOOLEAN NOT NULL DEFAULT TRUE, expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reward_redemptions (
 id TEXT PRIMARY KEY, offer_id TEXT NOT NULL REFERENCES offers(id), user_id TEXT NOT NULL REFERENCES users(id),
 code TEXT NOT NULL UNIQUE, points_spent INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'AVAILABLE',
 redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(), used_at TIMESTAMPTZ,
 UNIQUE(offer_id,user_id)
);

CREATE TABLE IF NOT EXISTS activities (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, area TEXT NOT NULL,
 description TEXT NOT NULL, image_url TEXT NOT NULL, price_fils INTEGER NOT NULL DEFAULT 0,
 duration_minutes INTEGER NOT NULL DEFAULT 120, difficulty TEXT NOT NULL DEFAULT 'All levels',
 capacity INTEGER NOT NULL DEFAULT 12, active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS activity_bookings (
 id TEXT PRIMARY KEY, activity_id TEXT NOT NULL REFERENCES activities(id), user_id TEXT NOT NULL REFERENCES users(id),
 scheduled_for TIMESTAMPTZ NOT NULL, participants INTEGER NOT NULL DEFAULT 1,
 amount_fils INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'CONFIRMED', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS match_messages (
 id TEXT PRIMARY KEY, game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS match_messages_game_idx ON match_messages(game_id,created_at);

CREATE TABLE IF NOT EXISTS support_tickets (
 id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
 category TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'OPEN',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academy_staff (
 academy_id TEXT NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role TEXT NOT NULL DEFAULT 'STAFF', permissions TEXT[] NOT NULL DEFAULT '{}',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(academy_id,user_id)
);
