import pg from "pg";

if (process.env.VERCEL_ENV !== "production" || process.env.CONFIRM_REPLACE_DEMO_DATA !== "1") {
  throw new Error("Refusing to mutate the production catalogue without explicit confirmation.");
}
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
if (!connectionString) throw new Error("Production database configuration is unavailable.");
const db = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await db.connect();
const expected = {
  venues: ["Al Reem Pitch", "Frontier Courts", "Galaxy Pitch", "Green Field", "Mecca Sports Hall", "Royal Club", "Sport City", "The Arena"],
  academies: ["Amman Multi-Sport Academy", "Jordan Racquet Club", "PlayUp Football Academy"],
  activities: ["Dead Sea kayaking session", "Sunrise hike in Wadi Mujib", "Wadi Rum climbing day"],
  offers: ["25% off court time", "Free football session", "PlayUp training bottle"],
};
const sorted = (items) => [...items].sort().join("\n");
try {
  await db.query("BEGIN");
  await db.query("LOCK TABLE users,venues,games,academies,activities,offers IN SHARE ROW EXCLUSIVE MODE");
  const users = (await db.query("SELECT id,role,email FROM users ORDER BY role,email")).rows;
  const admins = users.filter((user) => user.role === "SUPER_ADMIN");
  if (admins.length !== 1 || users.length !== 54 || users.some((user) => user.role !== "SUPER_ADMIN" && !/@play(?:up|o)\.local$/i.test(user.email))) {
    throw new Error("Preflight failed: account inventory differs from the verified seed-only snapshot.");
  }
  const adminId = admins[0].id;
  for (const [table, names] of [["venues", expected.venues], ["academies", expected.academies], ["activities", expected.activities], ["offers", expected.offers]]) {
    const column = table === "activities" || table === "offers" ? "title" : "name";
    const result = await db.query(`SELECT ${column} AS name FROM ${table} ORDER BY ${column}`);
    const current = result.rows.map((row) => row.name);
    if (sorted(current) !== sorted(names)) throw new Error(`Preflight failed: ${table} catalogue does not match known demo rows.`);
  }
  const fixtures = await db.query(`SELECT
    (SELECT count(*) FROM venues WHERE demo=TRUE)::int AS demo_venues,
    (SELECT count(*) FROM venues WHERE demo=FALSE)::int AS non_demo_venues,
    (SELECT count(*) FROM games)::int AS games,
    (SELECT count(*) FROM bookings)::int AS bookings,
    (SELECT count(*) FROM reviews)::int AS reviews,
    (SELECT count(*) FROM posts)::int AS posts,
    (SELECT count(*) FROM tournaments)::int AS tournaments,
    (SELECT count(*) FROM payments)::int AS payments,
    (SELECT count(*) FROM reward_redemptions)::int AS redemptions,
    (SELECT count(*) FROM court_bookings)::int AS court_bookings,
    (SELECT count(*) FROM activity_bookings)::int AS activity_bookings`);
  const f = fixtures.rows[0];
  if (f.demo_venues !== 8 || f.non_demo_venues !== 0 || f.games !== 42 || f.bookings !== 373 || f.reviews !== 45 || f.posts !== 9 || f.tournaments !== 2 || f.payments !== 0 || f.redemptions !== 0 || f.court_bookings !== 1 || f.activity_bookings !== 1) {
    throw new Error(`Preflight failed: seeded content or dependency counts changed: ${JSON.stringify(f)}`);
  }
  const adminRows = await db.query(`SELECT
    (SELECT count(*) FROM bookings WHERE user_id=$1)::int AS bookings,
    (SELECT count(*) FROM court_bookings WHERE user_id=$1)::int AS court_bookings,
    (SELECT count(*) FROM activity_bookings WHERE user_id=$1)::int AS activity_bookings,
    (SELECT count(*) FROM posts WHERE user_id=$1)::int AS posts,
    (SELECT count(*) FROM games WHERE organizer_id=$1)::int AS organized_games`, [adminId]);
  const a = adminRows.rows[0];
  if (a.bookings !== 4 || a.court_bookings !== 0 || a.activity_bookings !== 0 || a.posts !== 1 || a.organized_games !== 0) {
    throw new Error(`Preflight failed: administrator-linked content differs from the verified generated rows: ${JSON.stringify(a)}`);
  }

  // Remove generated records in foreign-key order. Admin access, audit history,
  // support/contact records, webhook history, and site configuration are kept.
  for (const table of ["video_moments", "recordings", "streams", "game_events", "game_clocks", "mvp_votes", "results", "rating_history", "xp_awards", "achievements", "reviews", "match_messages", "payments", "bookings", "waitlist", "team_players", "teams", "tournament_entries"]) {
    if (table === "game_events") await db.query("UPDATE game_events SET reverses_event_id=NULL");
    await db.query(`DELETE FROM ${table}`);
  }
  await db.query("DELETE FROM post_comments");
  await db.query("DELETE FROM post_likes");
  await db.query("DELETE FROM posts");
  await db.query("DELETE FROM games");
  await db.query("DELETE FROM tournaments");
  await db.query("DELETE FROM court_bookings");
  await db.query("DELETE FROM activity_bookings");
  await db.query("DELETE FROM reward_redemptions");
  await db.query("DELETE FROM offers");
  await db.query("DELETE FROM academy_staff");
  await db.query("DELETE FROM activities");
  await db.query("UPDATE users SET academy_id=NULL WHERE id<>$1", [adminId]);
  await db.query("UPDATE venues SET academy_id=NULL");
  await db.query("DELETE FROM venues");
  await db.query("DELETE FROM academies");
  await db.query("DELETE FROM friendships WHERE requester_id<>$1 OR addressee_id<>$1", [adminId]);
  await db.query("DELETE FROM sport_profiles WHERE user_id<>$1", [adminId]);
  await db.query("DELETE FROM notifications WHERE user_id<>$1", [adminId]);
  await db.query("DELETE FROM password_resets WHERE user_id<>$1", [adminId]);
  await db.query("DELETE FROM sessions WHERE user_id<>$1", [adminId]);
  await db.query("UPDATE audit_logs SET actor_id=NULL WHERE actor_id<>$1", [adminId]);
  await db.query("UPDATE site_config SET updated_by=NULL WHERE updated_by<>$1", [adminId]);
  await db.query("UPDATE support_tickets SET user_id=NULL WHERE user_id<>$1", [adminId]);
  await db.query("DELETE FROM users WHERE id<>$1", [adminId]);
  await db.query("UPDATE users SET xp=0,academy_id=NULL WHERE id=$1", [adminId]);

  const academyId = "infinity-sports-academy";
  await db.query(`INSERT INTO academies(id,name,area,address,description,sports,image_url,rating,verified,phone,email,website,training_packages,featured,latitude,longitude,active,source_url)
    VALUES($1,$2,$3,$4,$5,$6,$7,0,FALSE,$8,$9,$10,$11,TRUE,31.9648333,35.8961111,TRUE,$10)`, [
    academyId, "Infinity Sports Academy", "Shemisani", "Princess Alia College, Shemisani, Amman, Jordan",
    "Sports campus offering basketball and volleyball training, padel, a multipurpose hall, and FIBA-approved basketball courts. Listing details and programs are sourced from Infinity Sports' official website.",
    ["basketball", "volleyball", "padel", "yoga", "pilates", "ballet", "kickboxing"], "/images/infinity-logo.png",
    "07 9624 4059", "infinitysportsacademyjo@gmail.com", "https://www.infinitysportsjo.com/",
    [
      "Volleyball (Spikers Academy): ages 7+; 10 sessions for 100 JOD; Saturday, Tuesday and Sunday 7–9 PM; sibling discount 10%; group rates available.",
      "Basketball Boys U16: 12 sessions over three weeks; contact for current price and schedule.",
      "Basketball Little Kobes U10–U12: Monday, Wednesday and Saturday 5–6 PM; 12 classes; contact for price.",
      "Basketball Men: Tuesday and Sunday 9–10 PM; Thursday 6–7 PM; contact for price.",
      "Basketball Small Groups U14: Monday, Wednesday and Saturday 6–7 PM; contact for price.",
      "Basketball Women: Monday and Wednesday 8–9 PM; Saturday 4–5 PM; contact for price.",
      "Basketball Girls U16: Friday and Saturday 12–1 PM; contact for price.",
      "Basketball private 1v1: flexible scheduling; contact for price.",
    ],
  ]);
  const infinityCourts = [
    ["infinity-basketball-5x5", "Infinity Sports — FIBA 5x5 Basketball Court", ["basketball"], ["FIBA-approved full-size 5x5 court"] , "/images/basketball.jpg"],
    ["infinity-basketball-3x3", "Infinity Sports — FIBA 3x3 Basketball Court", ["basketball"], ["FIBA-approved 3x3 court"], "/images/basketball.jpg"],
    ["infinity-multipurpose-hall", "Infinity Sports — Multipurpose Hall", ["yoga", "pilates", "ballet", "kickboxing"], ["Multipurpose indoor hall"], "/images/dodgeball.jpg"],
    ["infinity-padel-court", "Infinity Sports — Padel Court", ["padel"], ["Padel court by Merry Sports"], "/images/tennis.jpg"],
    ["infinity-volleyball-court", "Infinity Sports — Volleyball Court", ["volleyball"], ["Official volleyball court"], "/images/dodgeball.jpg"],
  ];
  for (const [id, name, sports, amenities, image] of infinityCourts) await db.query(`INSERT INTO venues(id,name,area,address,sports,amenities,image_url,latitude,longitude,rating,demo,academy_id,hourly_rate_fils,active,source_url)
    VALUES($1,$2,'Shemisani','Princess Alia College, Shemisani, Amman, Jordan',$3,$4,$5,31.9648333,35.8961111,0,FALSE,$6,NULL,TRUE,'https://www.infinitysportsjo.com/facilities')`, [id, name, sports, amenities, image, academyId]);
  const tripAdvisorListings = [
    ["trax-jo", "Trax Jo", "Amman", "King Abdullah II Street, Amman 11821, Jordan", ["tennis", "padel", "football", "basketball", "volleyball"], "/images/football.jpg", "https://www.tripadvisor.com/Attraction_Review-g293986-d24183576-Reviews-Trax_Jo-Amman_Amman_Governorate.html"],
    ["the-courts-by-ayla", "The Courts By Ayla", "Aqaba", "Zan Street, Ayla Coral Entrance, Aqaba 77110, Jordan", ["tennis", "padel", "basketball", "football"], "/images/tennis.jpg", "https://www.tripadvisor.com/Attraction_Review-g298101-d23143744-Reviews-The_Courts_By_Ayla-Aqaba_Al_Aqabah_Governorate.html"],
  ];
  for (const [id, name, area, address, sports, image, source] of tripAdvisorListings) await db.query(`INSERT INTO venues(id,name,area,address,sports,amenities,image_url,rating,demo,academy_id,hourly_rate_fils,active,source_url)
    VALUES($1,$2,$3,$4,$5,'{}',$6,0,FALSE,NULL,NULL,TRUE,$7)`, [id, name, area, address, sports, image, source]);

  const after = await db.query(`SELECT
    (SELECT count(*) FROM users)::int AS users,
    (SELECT count(*) FROM venues WHERE active=TRUE)::int AS active_venues,
    (SELECT count(*) FROM venues WHERE demo=TRUE)::int AS demo_venues,
    (SELECT count(*) FROM academies WHERE active=TRUE)::int AS active_academies,
    (SELECT count(*) FROM games)::int AS games,
    (SELECT count(*) FROM bookings)::int AS bookings,
    (SELECT count(*) FROM reviews)::int AS reviews,
    (SELECT count(*) FROM activities)::int AS activities,
    (SELECT count(*) FROM offers)::int AS offers,
    (SELECT count(*) FROM tournaments)::int AS tournaments,
    (SELECT count(*) FROM posts)::int AS posts`);
  const final = after.rows[0];
  if (final.users !== 1 || final.active_venues !== 7 || final.demo_venues !== 0 || final.active_academies !== 1 || final.games !== 0 || final.bookings !== 0 || final.reviews !== 0 || final.activities !== 0 || final.offers !== 0 || final.tournaments !== 0 || final.posts !== 0) {
    throw new Error(`Postflight failed; rolling back: ${JSON.stringify(final)}`);
  }
  if (process.env.DRY_RUN === "1") await db.query("ROLLBACK");
  else await db.query("COMMIT");
  console.log(JSON.stringify({dryRun: process.env.DRY_RUN === "1", retainedAdminId: adminId, removedDemoRows: f, publishedRealCatalogue: {academy: 1, infinityCourts: infinityCourts.length, tripAdvisorVenues: tripAdvisorListings.length}, final}, null, 2));
} catch (error) {
  await db.query("ROLLBACK");
  throw error;
} finally {
  await db.end();
}
