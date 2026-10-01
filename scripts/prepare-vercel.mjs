const privatePreview = process.env.VERCEL_ENV === "preview"
  && process.env.VERCEL_GIT_COMMIT_REF === "vercel-demo"
  && (process.env.PLAYUP_PRIVATE_DEMO ?? process.env.PLAYO_PRIVATE_DEMO) === "1";
const publicProduction = process.env.VERCEL_ENV === "production"
  && process.env.VERCEL_GIT_COMMIT_REF === "main"
  && (process.env.PLAYUP_PUBLIC_DEMO ?? process.env.PLAYO_PUBLIC_DEMO) === "1";

if (privatePreview || publicProduction) {
  if (!process.env.DATABASE_URL) throw new Error("The demo deployment needs a PostgreSQL DATABASE_URL.");
  const adminPassword = process.env.PLAYUP_ADMIN_PASSWORD ?? process.env.PLAYO_ADMIN_PASSWORD;
  if (publicProduction && (!adminPassword || adminPassword.length < 20)) {
    throw new Error("The public demo needs a unique PLAYUP_ADMIN_PASSWORD of at least 20 characters.");
  }
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/([?&])sslmode=(?:prefer|require|verify-ca)(?=&|$)/i, "$1sslmode=verify-full");
  process.env.ALLOW_DEMO_SEED = "1";
  if (adminPassword) process.env.PLAYUP_ADMIN_PASSWORD = adminPassword;
  await import("./migrate.mjs");
  await import("./seed.mjs");
  await import("./seed-parity.mjs");
}
