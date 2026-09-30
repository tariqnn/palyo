# Deploy PLAYO as a private Vercel demo

This guide uses a **Preview deployment**, a dedicated hosted PostgreSQL database, and Vercel Authentication. Do not publish the seeded demo accounts on an unprotected production domain. The demo uses simulated payments and stream metadata; it does not charge cards or play live video.

## 1. Import the repository

In Vercel, choose **Add New → Project**, import `tariqnn/palyo`, keep the **Next.js** framework preset and repository root, then deploy. Vercel reads `npm run build` from `package.json`. The initial production deployment can build without a database, but database-backed pages will return an error until you configure one.

## 2. Protect Preview deployments

Open **Project Settings → Deployment Protection** and choose **Vercel Authentication** with **Standard Protection**. Team members must sign in to open Preview URLs. On the Hobby plan, Standard Protection does **not** protect the production domain, so keep the demo database and `PLAYO_PRIVATE_DEMO` scoped to **Preview only**. A Pro or Enterprise project may choose All Deployments protection if the production domain must also be private.

## 3. Connect a Preview PostgreSQL database

Create a dedicated PostgreSQL database using Vercel Marketplace Storage (Neon is one option). Connect it to the project for the **Preview** environment. Confirm the Preview environment has a pooled connection string named `DATABASE_URL`. If the integration uses a different variable name, add `DATABASE_URL` manually with the pooled PostgreSQL URL. Keep this database separate from any public production database.

Add these variables in **Project Settings → Environment Variables**, scoped to **Preview**:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Preview PostgreSQL connection string, preferably pooled |
| `PLAYO_PRIVATE_DEMO` | `1` |
| `PAYMENT_PROVIDER` | `mock` |
| `STREAM_PROVIDER` | `mock` |
| `NEXT_PUBLIC_SITE_URL` | Preview branch URL, including `https://`, once known |

`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` are optional for the demo. Password reset email requires them. Add environment variables before redeploying; changes only reach new deployments.

## 4. Initialize the Preview database

The `vercel-demo` build runs `scripts/prepare-vercel.mjs` before Next.js. When the branch, Preview environment, and `PLAYO_PRIVATE_DEMO=1` match, it migrates the connected PostgreSQL database and seeds fictional demo data. The seed is idempotent and leaves an existing populated database unchanged. No database URL needs to be copied to your computer.

If Neon provides `DATABASE_URL_UNPOOLED`, migrations use that direct connection. Application requests continue to use the pooled `DATABASE_URL`.

This automatic initialization runs **only** for the protected `vercel-demo` Preview. Never connect a customer production database to that branch.

## 5. Deploy the demo branch

Use the `vercel-demo` branch. Once Vercel is connected to GitHub, push the branch or choose **Deployments → Create Deployment** for `vercel-demo`. Vercel creates a protected Preview URL. Set `NEXT_PUBLIC_SITE_URL` to its stable branch URL and redeploy so metadata and password reset links use the correct origin.

Open `/api/health` on that Preview URL after signing in through Vercel Authentication. It should return `{"status":"ok"}`. Then sign in to PLAYO with:

| Role | Email | Password |
| --- | --- | --- |
| Player | `player@playo.local` | `PlayoDemo2026!` |
| Organizer | `organizer@playo.local` | `PlayoDemo2026!` |
| Scorekeeper | `scorekeeper@playo.local` | `PlayoDemo2026!` |
| Admin | `admin@playo.local` | `PlayoDemo2026!` |

Bookings in this protected Preview record **simulated** payments. Stream controls create metadata only; video playback remains unavailable without a streaming provider. The production domain should not use these seeded accounts or mock providers.

## Monitor the private demo

Sign in with the admin demo account, then open `/admin` on the protected Preview URL. The header also shows an **Admin** link for staff accounts. The overview shows member, game, booking, and stream totals from the connected database; use **Refresh** to reload them. The sidebar provides:

- **Games** and **Bookings**: searchable, filterable lists with management actions and pagination.
- **Streams**: stream status and visibility for each game.
- **Members**: searchable account list and individual booking and sport history.
- **Venues** and **Tournaments**: location, registration, and game activity.
- **Content review**: recent community posts and game reviews; admins can remove posts and their comments, with the action recorded in the audit log.
- **Staff activity**: paginated audit log entries.
- **Messages**: contact form submissions.
- **Analytics**: overall counts, processed payments, seven-day trends, and sport demand.

The dashboard is responsive on phones. Member, game, booking, stream, and activity rows become cards at phone widths. Metrics reflect the database when the page is loaded; the dashboard does not stream live updates. Demo booking values are simulated and are labeled separately from processed payment records.
