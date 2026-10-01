# PlayUp

For Vercel Preview and public demo deployments, follow [the Vercel guide](docs/VERCEL.md).

PlayUp is a responsive web platform for recreational football, basketball, dodgeball, and tennis in Amman. The visual system follows the supplied design reference: a dark photographic home page, compact white internal pages, and a restrained green accent.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS, CSS design tokens, Lucide icons
- PostgreSQL SQL schema with an embedded PGlite database for local development and `pg` for hosted PostgreSQL
- Zod server validation, bcrypt password hashing, opaque database-backed sessions in HTTP-only cookies
- Server Actions for mutations, Server-Sent Events for live score updates
- Vitest unit checks and Playwright browser smoke scripts

## Local setup

Requires Node.js 20.9 or later.

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp` if preferred. Open http://localhost:3000. If `DATABASE_URL` is empty, the app stores data in `.playup-db/`. `PLAYUP_DB_DIR` can point to another local PGlite directory. Seed data is idempotent; `npm run db:enrich` adds historical scores and competition data to an existing demo database.

The demo seed creates 54 fictional players, eight fictional venues, 42 games (27 future and 15 historical), two tournaments, bookings, ratings, score events, achievements, posts, notifications, and processing recording metadata. All prices are in JD.

### Local and protected Preview demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Player | `player@playup.local` | `PlayUpDemo2026!` |
| Scorekeeper | `scorekeeper@playup.local` | `PlayUpDemo2026!` |
| Organizer | `organizer@playup.local` | `PlayUpDemo2026!` |
| Admin | `admin@playup.local` | `PlayUpDemo2026!` |

The public Production demo uses a separate database. Its sample players get unknown random passwords, and its admin password comes from a Vercel Secret; the credentials above do not work there. The seed script refuses an external `DATABASE_URL` unless `ALLOW_DEMO_SEED=1` is explicitly set. Never enable the demo seed against a live customer database.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

With the development server running, browser checks use installed Chrome:

```bash
node scripts/smoke.mjs
node scripts/smoke-admin.mjs
node scripts/smoke-finalize.mjs
node scripts/smoke-capacity.mjs
node scripts/smoke-permissions.mjs
node scripts/smoke-review.mjs
```

These browser scripts create demo records and update local game state. `smoke.mjs` covers signup, sport onboarding, booking, duplicate booking display, cancellation, password reset, and login. The organizer scripts cover game creation, match clock controls, score event undo, team generation, MVP selection, and result finalization. The other scripts check a concurrent last-spot booking, waitlist promotion, role and private stream access, and completed-game reviews.

## Architecture and current behavior

The schema centers on `games`. Bookings, waitlist entries, teams, score events, results, ratings, XP awards, streams, recordings, moments, and audit entries all reference a game. `db/migrations/001_init.sql` is an idempotent SQL migration. Local PGlite runs it on connection; for hosted PostgreSQL, run `npm run db:migrate` before starting the app.

Booking locks the game row in a transaction, checks start time, status, duplicate booking, and capacity, then uses the payment provider interface. The development provider settles mock payments immediately. Cancellation refunds once, notifies the next waitlisted player, and gives them a two-hour reserved offer. Game cancellation refunds confirmed bookings and records an audit entry. Payment amounts come from the database.

Sport-specific scoring lives in `lib/scoring.ts`. Football supports goals and own goals; basketball counts 1, 2, and 3 point shots; dodgeball counts round wins; tennis calculates points, deuce, advantage, games, configurable tiebreaks, and best-of-three or best-of-five sets. Events are append-oriented and undo creates a reversal event. The persisted match clock supports start, pause, reset, and period changes. The spectator scoreboard receives score and clock changes through SSE. Finalization is transactional and records results, sport ratings, XP, achievements, booking completion, and an audit entry. MVP can be selected by the organizer or determined from one vote per booked player. Players with completed bookings can submit or update game reviews; venue ratings reflect reviews.

The stream provider interface and visibility checks are in `lib/streaming.ts`. The mock provider creates development stream metadata and demonstrates the lifecycle, but has no real video ingest or playback. Public, participant-only, unlisted, and private access checks run on the server. Recordings and moments are modeled against games and events.

## Hosted PostgreSQL and provider configuration

Set `DATABASE_URL` to a standard PostgreSQL connection string and run `npm run db:migrate`. Set `NEXT_PUBLIC_SITE_URL` to the public origin. Password resets require `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`; in development, the reset link is shown on screen instead. Optional brand social URLs are `NEXT_PUBLIC_INSTAGRAM_URL` and `NEXT_PUBLIC_X_URL`.

`PAYMENT_PROVIDER=mock` is allowed in development or in an explicitly enabled **private Vercel Preview demo**. Production bookings need a Jordan-supported payment adapter with webhook signature checks, asynchronous settlement, and idempotent refunds before real money can be accepted. `STREAM_PROVIDER=mock` provides metadata only; a production stream adapter, signed playback URLs, webhook processing, and storage configuration are still required. See `PROJECT_STATUS.md` for the remaining launch work.

## Photo assets

Local sports photos in `public/images/` came from [Unsplash](https://unsplash.com/license), including [night football](https://unsplash.com/photos/night-soccer-game-on-an-outdoor-court-with-bright-lights-YTeWVVtOydI), [night basketball](https://unsplash.com/photos/men-playing-basketball-on-an-outdoor-court-at-night-n3x6o7oXLfQ), and [dodgeball](https://unsplash.com/photos/people-playing-soccer-on-field-7X60-5nr3Tk). Local copies avoid external image timeouts in the development environment.
