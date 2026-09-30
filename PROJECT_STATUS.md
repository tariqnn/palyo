# PLAYO project status

## Implemented

- Responsive public site following the supplied reference: photographic home page; sports, games, venues, tournaments, community, leaderboards, watch, and search pages.
- Player signup, login, password reset, onboarding, profiles, and server-side role checks for organizers, scorekeepers, and admins.
- PostgreSQL schema and idempotent migration, local PGlite database, 54 fictional players, eight venues, 42 games, two tournament seasons, and historical competition data.
- Capacity-safe bookings, mock payment interface, cancellations and refunds, waitlist offers, recording consent, and notifications.
- Balanced teams, sport-specific event scoring, score correction by reversal, persisted match clock, live score stream, player stats, MVP voting, transactional result finalization, ratings, XP, achievements, and reviews.
- Stream and recording data model, mock stream lifecycle, server-side visibility checks, archive and My Videos pages, recording moments, organizer management, and admin analytics.
- Browser smoke coverage for auth and booking, a concurrent last-spot booking race, organizer scoring and clock control, finalization, role and stream permissions, and completed-game reviews. Unit checks cover scoring, team balancing, and progression.

## Remaining before public launch

- Integrate a Jordan-supported payment processor and its signed webhooks, asynchronous settlement, and real refunds. The mock adapter is restricted to development and explicitly enabled private Vercel Preview demos.
- Integrate a video provider for ingest, playback, recording processing, signed playback URLs, and provider webhooks. The mock stream records metadata only; no video is available without an adapter.
- Configure a real SMTP service for password reset email and production monitoring/operations. Development shows the reset link locally.
- Expand tournaments and seasons beyond the present entry, fixture, and standings foundation if league operations are required.
- Run deployment, accessibility, load, and security checks against the target production environment and provider credentials.

## Local database note

This machine has no Docker or PostgreSQL service, so local development uses embedded PGlite. An earlier local database failed to reopen after the dev server ended. It was preserved as `.playo-db-backup-20260930/` and a fresh `.playo-db/` was seeded; migration and browser checks then passed. Both directories are excluded from Git.
