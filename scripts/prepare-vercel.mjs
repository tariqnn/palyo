const privatePreview = process.env.VERCEL_ENV === "preview"
  && process.env.VERCEL_GIT_COMMIT_REF === "vercel-demo"
  && (process.env.PLAYUP_PRIVATE_DEMO ?? process.env.PLAYO_PRIVATE_DEMO) === "1";

if (privatePreview || process.env.VERCEL_ENV === "production") {
  if (!process.env.DATABASE_URL) throw new Error("The deployment needs a PostgreSQL DATABASE_URL.");
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/([?&])sslmode=(?:prefer|require|verify-ca)(?=&|$)/i, "$1sslmode=verify-full");
  // Real deployments only run migrations: no sample data is ever created.
  await import("./migrate.mjs");
  if (privatePreview) {
    const adminPassword = process.env.PLAYUP_ADMIN_PASSWORD ?? process.env.PLAYO_ADMIN_PASSWORD;
    process.env.ALLOW_DEMO_SEED = "1";
    if (adminPassword) process.env.PLAYUP_ADMIN_PASSWORD = adminPassword;
    await import("./seed.mjs");
    await import("./seed-parity.mjs");
  }
}
