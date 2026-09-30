const privatePreview = process.env.VERCEL_ENV === "preview"
  && process.env.VERCEL_GIT_COMMIT_REF === "vercel-demo"
  && process.env.PLAYO_PRIVATE_DEMO === "1";

if (privatePreview) {
  if (!process.env.DATABASE_URL) throw new Error("The vercel-demo Preview needs a PostgreSQL DATABASE_URL.");
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/([?&])sslmode=(?:prefer|require|verify-ca)(?=&|$)/i, "$1sslmode=verify-full");
  process.env.ALLOW_DEMO_SEED = "1";
  await import("./migrate.mjs");
  await import("./seed.mjs");
}
