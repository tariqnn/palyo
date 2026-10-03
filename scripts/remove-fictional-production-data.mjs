import pg from "pg";

if (process.env.VERCEL_ENV !== "production" || process.env.CONFIRM_REMOVE_FICTIONAL_DATA !== "1") {
  throw new Error("Refusing to change data without the production environment and explicit confirmation flag.");
}

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
if (!connectionString) throw new Error("Production database configuration is unavailable.");

const academyIds = [
  "0b0c7aa7-c796-4d92-86b6-bd14a20e6580",
  "d0ec4c7e-0baa-42a0-a118-fc79a9539fc7",
  "99c5ae4a-8e72-4f2f-a870-cd5fc2935a91",
];
const activityIds = [
  "66170079-240a-4735-bd86-83d4a5147478",
  "2514eb4c-179f-4a4f-8cab-39566aa877a2",
  "00ae75b8-b68d-4eb4-91ed-f6470996dfa5",
];
const offerIds = [
  "0ef10e5c-20d9-4e03-a9a6-829707838038",
  "c2e11ffc-bde8-42fc-98e9-c232f4a528fc",
  "0b788c61-410e-4015-9ad3-790fb08631bd",
];

const db = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await db.connect();
try {
  await db.query("BEGIN");
  const dependencies = await db.query(`SELECT
    (SELECT count(*) FROM activity_bookings WHERE activity_id = ANY($1))::int AS activity_bookings,
    (SELECT count(*) FROM reward_redemptions WHERE offer_id = ANY($2))::int AS reward_redemptions`, [activityIds, offerIds]);
  if (dependencies.rows[0].activity_bookings || dependencies.rows[0].reward_redemptions) {
    throw new Error(`Refusing to remove demo records with dependent bookings or redemptions: ${JSON.stringify(dependencies.rows[0])}`);
  }
  await db.query("UPDATE users SET academy_id=NULL WHERE academy_id = ANY($1)", [academyIds]);
  await db.query("UPDATE venues SET academy_id=NULL WHERE academy_id = ANY($1)", [academyIds]);
  const offers = await db.query("DELETE FROM offers WHERE id = ANY($1)", [offerIds]);
  const activities = await db.query("DELETE FROM activities WHERE id = ANY($1)", [activityIds]);
  const academies = await db.query("DELETE FROM academies WHERE id = ANY($1)", [academyIds]);
  await db.query("COMMIT");
  console.log(JSON.stringify({ removed: { academies: academies.rowCount, activities: activities.rowCount, offers: offers.rowCount } }, null, 2));
} catch (error) {
  await db.query("ROLLBACK");
  throw error;
} finally {
  await db.end();
}
