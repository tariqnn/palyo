import pg from "pg";

const imageByVenue = new Map([
  ["infinity-basketball-5x5", "/images/infinity-sports/court_basketball_ac.jpeg"],
  ["infinity-basketball-3x3", "/images/infinity-sports/court_3x3.jpeg"],
  ["infinity-padel-court", "/images/infinity-sports/court_padel.jpeg"],
  ["infinity-volleyball-court", "/images/infinity-sports/court_volleyball.jpeg"],
  ["infinity-multipurpose-hall", ""],
]);
const academyPhoto = "/images/infinity-sports/court_3x3.jpeg";
const dryRun = process.env.DRY_RUN === "1";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  const academies = await client.query(
    "SELECT id FROM academies WHERE name = $1 AND active = TRUE",
    ["Infinity Sports Academy"],
  );
  if (academies.rowCount !== 1) throw new Error("Expected one active Infinity Sports Academy row.");
  const academyId = academies.rows[0].id;
  const venues = await client.query(
    "SELECT id, academy_id FROM venues WHERE id = ANY($1::text[]) AND active = TRUE ORDER BY id",
    [[...imageByVenue.keys()]],
  );
  if (venues.rowCount !== imageByVenue.size || venues.rows.some((venue) => venue.academy_id !== academyId)) {
    throw new Error("The active Infinity venue set changed; no image updates were applied.");
  }

  for (const [venueId, imagePath] of imageByVenue) {
    const result = await client.query(
      "UPDATE venues SET image_url = $1 WHERE id = $2 AND academy_id = $3 AND active = TRUE",
      [imagePath, venueId, academyId],
    );
    if (result.rowCount !== 1) throw new Error(`Expected one venue updated for ${venueId}.`);
  }
  const academyUpdate = await client.query(
    "UPDATE academies SET image_url = $1 WHERE id = $2 AND active = TRUE",
    [academyPhoto, academyId],
  );
  if (academyUpdate.rowCount !== 1) throw new Error("Expected one academy image updated.");

  const readback = await client.query(
    "SELECT id, image_url FROM venues WHERE id = ANY($1::text[]) ORDER BY id",
    [[...imageByVenue.keys()]],
  );
  for (const row of readback.rows) {
    if (row.image_url !== imageByVenue.get(row.id)) throw new Error(`Image read-back mismatch for ${row.id}.`);
  }
  if (dryRun) await client.query("ROLLBACK");
  else await client.query("COMMIT");
  console.log(JSON.stringify({ dryRun, updatedVenuePhotos: readback.rows.length, hallPhoto: "not available; cleared to show placeholder" }));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
