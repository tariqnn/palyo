# PlayUp project status

## Implemented

- Responsive public site following the supplied reference: photographic home page; sports, games, venues, tournaments, community, leaderboards, watch, and search pages.
- Persistent English/Arabic language switcher with Arabic typography, right-to-left layout, translated public/member/admin UI, form labels, statuses, validation feedback, and responsive RTL handling.
- Player signup, login, password reset, onboarding, profiles, and server-side role checks for organizers, scorekeepers, and admins.
- PostgreSQL schema and idempotent migration, local PGlite database, 54 fictional players, eight venues, 42 games, two tournament seasons, and historical competition data.
- Capacity-safe bookings, mock payment interface, cancellations and refunds, waitlist offers, recording consent, and notifications.
- Balanced teams, sport-specific event scoring, score correction by reversal, persisted match clock, live score stream, player stats, MVP voting, transactional result finalization, ratings, XP, achievements, and reviews.
- Stream and recording data model, mock stream lifecycle, server-side visibility checks, archive and My Videos pages, recording moments, organizer management, and admin analytics.
- Browser smoke coverage for auth and booking, a concurrent last-spot booking race, organizer scoring and clock control, finalization, role and stream permissions, and completed-game reviews. Unit checks cover scoring, team balancing, and progression.
- Baseline Vercel Analytics and Speed Insights, a database-aware health endpoint, scheduled uptime checks, and repeatable production-data and mobile-localization audits.
- Privacy and Terms pages covering pilot operations, plus authenticated data-export and account-deletion request workflows routed to administrators.

## Launch model

- The first public release is a cash-at-venue web pilot. Online payment processing and refunds are post-launch work, not launch dependencies.
- The website uses PostgreSQL/Neon while the Flutter app currently uses Firebase Auth and Firestore. They provide matching core workflows but do not yet share accounts or live user data; cross-platform identity and data synchronization is the first post-launch integration.
- Live video remains provider-dependent. The current stream and recording pages safely expose metadata and availability states without pretending mock video exists.

## Remaining operational work

The actionable owner checklist is maintained in [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md).

- Configure Resend or SMTP so production password-reset emails can be delivered. Until then, users can sign up and sign in, but self-service password recovery is unavailable.
- Connect a branded domain and support email, confirm Neon recovery settings, and complete accessibility, load, and security checks against the live deployment.
- Production currently contains one administrator account and no venues, matches, or public users; verified real launch data must be added before invitations are sent.
- Expand tournaments and seasons beyond the present entry, fixture, and standings foundation if full league operations are required.

## Local database note

This machine has no Docker or PostgreSQL service, so local development uses embedded PGlite. An earlier local database failed to reopen after the dev server ended. It was preserved as `.playup-db-backup-20260930/` and a fresh `.playup-db/` was seeded; migration and browser checks then passed. Both directories are excluded from Git.
