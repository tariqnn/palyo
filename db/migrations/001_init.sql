CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, username TEXT NOT NULL UNIQUE, email TEXT NOT NULL UNIQUE,
 phone TEXT, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'PLAYER', city TEXT NOT NULL DEFAULT 'Amman',
 avatar_url TEXT, xp INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS password_resets (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS login_attempts (
 id TEXT PRIMARY KEY, email TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempts_email_idx ON login_attempts(email,created_at);
CREATE TABLE IF NOT EXISTS venues (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, area TEXT NOT NULL, address TEXT NOT NULL,
 sports TEXT[] NOT NULL, amenities TEXT[] NOT NULL DEFAULT '{}', image_url TEXT NOT NULL,
 latitude NUMERIC, longitude NUMERIC, rating NUMERIC NOT NULL DEFAULT 4.7, demo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS games (
 id TEXT PRIMARY KEY, sport TEXT NOT NULL, title TEXT NOT NULL, format TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '', rules TEXT NOT NULL DEFAULT '', venue_id TEXT NOT NULL REFERENCES venues(id),
 organizer_id TEXT NOT NULL REFERENCES users(id), scorekeeper_id TEXT REFERENCES users(id),
 starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL, capacity INTEGER NOT NULL CHECK (capacity > 0),
 booked_count INTEGER NOT NULL DEFAULT 0 CHECK (booked_count >= 0 AND booked_count <= capacity),
 price_fils INTEGER NOT NULL DEFAULT 0 CHECK (price_fils >= 0), skill TEXT NOT NULL DEFAULT 'All Levels',
 status TEXT NOT NULL DEFAULT 'PUBLISHED', image_url TEXT NOT NULL,
 stats_enabled BOOLEAN NOT NULL DEFAULT TRUE, mvp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 stream_enabled BOOLEAN NOT NULL DEFAULT FALSE, recording_enabled BOOLEAN NOT NULL DEFAULT FALSE,
 recording_visibility TEXT NOT NULL DEFAULT 'PUBLIC', finalized_at TIMESTAMPTZ,
 winner TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS games_browse_idx ON games(starts_at, sport, status);
ALTER TABLE games ADD COLUMN IF NOT EXISTS mvp_id TEXT REFERENCES users(id);
ALTER TABLE games ADD COLUMN IF NOT EXISTS score_config JSONB NOT NULL DEFAULT '{}';
CREATE TABLE IF NOT EXISTS game_clocks (
 game_id TEXT PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
 period INTEGER NOT NULL DEFAULT 1 CHECK (period BETWEEN 1 AND 10),
 elapsed_seconds INTEGER NOT NULL DEFAULT 0 CHECK (elapsed_seconds >= 0),
 running BOOLEAN NOT NULL DEFAULT FALSE,
 started_at TIMESTAMPTZ,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bookings (
 id TEXT PRIMARY KEY, reference TEXT NOT NULL UNIQUE, game_id TEXT NOT NULL REFERENCES games(id),
 user_id TEXT NOT NULL REFERENCES users(id), status TEXT NOT NULL DEFAULT 'PENDING',
 payment_status TEXT NOT NULL DEFAULT 'PENDING', amount_fils INTEGER NOT NULL,
 recording_acknowledged BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(game_id,user_id)
);
CREATE TABLE IF NOT EXISTS payments (
 id TEXT PRIMARY KEY, booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id), provider TEXT NOT NULL,
 provider_ref TEXT, amount_fils INTEGER NOT NULL, status TEXT NOT NULL,
 idempotency_key TEXT NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS waitlist (
 id TEXT PRIMARY KEY, game_id TEXT NOT NULL REFERENCES games(id), user_id TEXT NOT NULL REFERENCES users(id),
 position INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'WAITING', created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(game_id,user_id), UNIQUE(game_id,position)
);
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS offered_at TIMESTAMPTZ;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS sport_profiles (
 user_id TEXT NOT NULL REFERENCES users(id), sport TEXT NOT NULL, rating INTEGER NOT NULL DEFAULT 1000,
 games INTEGER NOT NULL DEFAULT 0, wins INTEGER NOT NULL DEFAULT 0, position TEXT, preferred_foot TEXT,
 dominant_hand TEXT, tennis_preference TEXT, skill TEXT NOT NULL DEFAULT 'Intermediate',
 PRIMARY KEY(user_id,sport)
);
CREATE TABLE IF NOT EXISTS teams (
 id TEXT PRIMARY KEY, game_id TEXT NOT NULL REFERENCES games(id), name TEXT NOT NULL,
 UNIQUE(game_id,name)
);
CREATE TABLE IF NOT EXISTS team_players (
 team_id TEXT NOT NULL REFERENCES teams(id), user_id TEXT NOT NULL REFERENCES users(id),
 PRIMARY KEY(team_id,user_id)
);
CREATE TABLE IF NOT EXISTS mvp_votes (
 game_id TEXT NOT NULL REFERENCES games(id), voter_id TEXT NOT NULL REFERENCES users(id),
 nominee_id TEXT NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(game_id,voter_id)
);
CREATE TABLE IF NOT EXISTS game_events (
 id TEXT PRIMARY KEY, game_id TEXT NOT NULL REFERENCES games(id), sequence INTEGER NOT NULL,
 type TEXT NOT NULL, team TEXT, player_id TEXT REFERENCES users(id), assist_id TEXT REFERENCES users(id),
 value INTEGER, period INTEGER, clock_seconds INTEGER, metadata JSONB NOT NULL DEFAULT '{}',
 actor_id TEXT NOT NULL REFERENCES users(id), reverses_event_id TEXT REFERENCES game_events(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(game_id,sequence)
);
CREATE INDEX IF NOT EXISTS game_events_game_idx ON game_events(game_id,sequence);
CREATE TABLE IF NOT EXISTS results (
 game_id TEXT PRIMARY KEY REFERENCES games(id), sport TEXT NOT NULL, winner TEXT,
 score JSONB NOT NULL, finalized_by TEXT NOT NULL REFERENCES users(id), finalized_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rating_history (
 id TEXT PRIMARY KEY, game_id TEXT NOT NULL REFERENCES games(id), user_id TEXT NOT NULL REFERENCES users(id),
 sport TEXT NOT NULL, old_rating INTEGER NOT NULL, new_rating INTEGER NOT NULL, change INTEGER NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(game_id,user_id)
);
CREATE TABLE IF NOT EXISTS xp_awards (
 id TEXT PRIMARY KEY, game_id TEXT NOT NULL REFERENCES games(id), user_id TEXT NOT NULL REFERENCES users(id),
 reason TEXT NOT NULL, amount INTEGER NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(game_id,user_id,reason)
);
CREATE TABLE IF NOT EXISTS achievements (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), code TEXT NOT NULL,
 game_id TEXT REFERENCES games(id), earned_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(user_id,code,game_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS achievements_user_code_idx ON achievements(user_id,code);
CREATE TABLE IF NOT EXISTS streams (
 id TEXT PRIMARY KEY, game_id TEXT NOT NULL UNIQUE REFERENCES games(id), provider TEXT NOT NULL,
 provider_id TEXT, status TEXT NOT NULL DEFAULT 'SCHEDULED', visibility TEXT NOT NULL DEFAULT 'PUBLIC',
 playback_url TEXT, secret_key TEXT, started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS recordings (
 id TEXT PRIMARY KEY, game_id TEXT NOT NULL REFERENCES games(id), stream_id TEXT REFERENCES streams(id),
 provider_id TEXT UNIQUE, status TEXT NOT NULL DEFAULT 'PROCESSING', visibility TEXT NOT NULL DEFAULT 'PUBLIC',
 playback_url TEXT, duration_seconds INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS video_moments (
 id TEXT PRIMARY KEY, recording_id TEXT NOT NULL REFERENCES recordings(id), game_id TEXT NOT NULL REFERENCES games(id),
 event_id TEXT REFERENCES game_events(id), player_id TEXT REFERENCES users(id),
 timestamp_seconds INTEGER NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tournaments (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, sport TEXT NOT NULL, description TEXT NOT NULL,
 starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL, image_url TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'OPEN', season TEXT
);
ALTER TABLE games ADD COLUMN IF NOT EXISTS tournament_id TEXT REFERENCES tournaments(id);
CREATE TABLE IF NOT EXISTS tournament_entries (
 tournament_id TEXT NOT NULL REFERENCES tournaments(id), user_id TEXT NOT NULL REFERENCES users(id),
 team_name TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(tournament_id,user_id)
);
CREATE TABLE IF NOT EXISTS posts (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), game_id TEXT REFERENCES games(id),
 body TEXT NOT NULL, image_url TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS post_likes (
 post_id TEXT NOT NULL REFERENCES posts(id), user_id TEXT NOT NULL REFERENCES users(id), PRIMARY KEY(post_id,user_id)
);
CREATE TABLE IF NOT EXISTS post_comments (
 id TEXT PRIMARY KEY, post_id TEXT NOT NULL REFERENCES posts(id), user_id TEXT NOT NULL REFERENCES users(id),
 body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notifications (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), type TEXT NOT NULL, title TEXT NOT NULL,
 body TEXT NOT NULL, href TEXT, read_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reviews (
 id TEXT PRIMARY KEY, game_id TEXT NOT NULL REFERENCES games(id), user_id TEXT NOT NULL REFERENCES users(id),
 venue_rating INTEGER NOT NULL CHECK (venue_rating BETWEEN 1 AND 5), organization_rating INTEGER NOT NULL CHECK (organization_rating BETWEEN 1 AND 5),
 experience_rating INTEGER NOT NULL CHECK (experience_rating BETWEEN 1 AND 5), body TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(game_id,user_id)
);
CREATE TABLE IF NOT EXISTS audit_logs (
 id TEXT PRIMARY KEY, actor_id TEXT REFERENCES users(id), action TEXT NOT NULL, entity TEXT NOT NULL,
 entity_id TEXT NOT NULL, old_data JSONB, new_data JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS webhook_events (
 id TEXT PRIMARY KEY, provider TEXT NOT NULL, event_id TEXT NOT NULL, processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(provider,event_id)
);
CREATE TABLE IF NOT EXISTS contact_messages (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, body TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
