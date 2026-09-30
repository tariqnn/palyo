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

## 4. Initialize the Preview database once

Run these commands from a **local PowerShell terminal** in the repository after the Vercel project and database are connected. The environment file is ignored by Git.

```powershell
npx vercel login
npx vercel link
npx vercel env pull .env.preview.local --environment=preview
$env:ALLOW_DEMO_SEED = '1'
$env:PLAYO_PRIVATE_DEMO = '1'
$env:VERCEL_ENV = 'preview'
node --env-file=.env.preview.local scripts/migrate.mjs
node --env-file=.env.preview.local scripts/seed.mjs
Remove-Item Env:ALLOW_DEMO_SEED
Remove-Item Env:PLAYO_PRIVATE_DEMO
Remove-Item Env:VERCEL_ENV
```

The seed adds fictional players, venues, games, bookings, tournaments, and known demo credentials. It refuses a hosted database unless explicitly allowed. Run it only against the dedicated **Preview** database. It is idempotent and will leave an existing populated database unchanged.

If the CLI says `DATABASE_URL` is missing, check the Preview environment variable in Vercel and pull it again. If the database provider offers both pooled and direct URLs, use the pooled URL for the app; a direct URL can be used for the one-time migration if the provider requires it.

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
