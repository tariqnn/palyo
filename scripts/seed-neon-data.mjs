import pg from "pg";
import { hashSync } from "bcryptjs";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("DATABASE_URL or POSTGRES_URL environment variable is required.");
  process.exit(1);
}

console.log("Connecting to Neon database...");
const db = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await db.connect();
const q = (sql, values = []) => db.query(sql, values);

// Run all migrations to be 100% sure schema is complete
console.log("Applying migrations if needed...");
for (const file of ["001_init.sql", "002_mobile_feature_parity.sql", "003_activities_academies_detail.sql"]) {
  const sql = await readFile(`db/migrations/${file}`, "utf8");
  await q(sql);
}

console.log("Cleaning old tables for fresh comprehensive seed...");
const tables = [
  "audit_logs", "webhook_events", "contact_messages", "support_tickets",
  "match_messages", "video_moments", "recordings", "streams",
  "post_comments", "post_likes", "posts", "notifications",
  "reviews", "mvp_votes", "game_events", "results", "rating_history",
  "xp_awards", "achievements", "team_players", "teams", "game_clocks",
  "payments", "court_bookings", "activity_bookings", "reward_redemptions",
  "bookings", "waitlist", "tournament_entries", "games", "tournaments",
  "offers", "activities", "academy_staff", "venues", "academies",
  "friendships", "sport_profiles", "sessions", "password_resets", "login_attempts", "users"
];

for (const t of tables) {
  try {
    await q(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`);
  } catch {
    // Ignore if table doesn't exist
  }
}

console.log("Seeding users...");
const sports = ["football", "basketball", "dodgeball", "tennis"];
const image = {
  football: "/images/football.jpg",
  basketball: "/images/basketball.jpg",
  dodgeball: "/images/dodgeball.jpg",
  tennis: "/images/tennis.jpg"
};
const first = ["Tariq","Ahmad","Omar","Yousef","Kareem","Ali","Hassan","Sami","Lina","Sara","Noor","Maya","Rami","Zaid","Hadi","Adam","Malik","Rana","Dana","Faris","Nour","Yara","Khaled","Jad","Basil","Nadine","Leen","Salma","Ameer","Ibrahim","Laith","Rashed","Hamza","Rami","Fadi","Alaa","Hussein","Zain","Haya","Mariam","Zara","Ola","Yazan","Razan","Samer","Reem","Amal","Bilal","Nouran","Nader","Anas","Saba","Dalia","Mahmoud"];
const last = ["Ahmed","Mansour","Haddad","Nasser","Khalil","Saleh","Odeh","Sabbagh","Fayez","Hamdan","Khatib","Abdullah"];

// Master test password for all accounts: PlayUp2026!
const demoHash = hashSync("PlayUp2026!", 12);
const users = [];

for (let i = 0; i < first.length; i++) {
  const id = randomUUID();
  const name = `${first[i]} ${last[i % last.length]}`;
  const username = i === 0 ? "tariq" : `${first[i].toLowerCase()}${i}`;
  const email = i < 4 
    ? ["player@playup.local", "scorekeeper@playup.local", "organizer@playup.local", "admin@playup.local"][i]
    : `${username}@playup.local`;
  const role = i === 1 ? "SCOREKEEPER" : i === 2 ? "ORGANIZER" : i === 3 ? "ADMIN" : "PLAYER";
  const xp = Math.max(0, 4820 - i * 67);
  const avatar = `https://i.pravatar.cc/120?img=${(i % 70) + 1}`;
  
  await q(
    "INSERT INTO users(id,name,username,email,password_hash,role,xp,avatar_url,bio,reliability) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
    [id, name, username, email, demoHash, role, xp, avatar, `Active sports enthusiast in Amman. Love playing ${sports[i % 4]}!`, 95 + (i % 6)]
  );
  users.push({ id, name, username, email, role });

  for (const sport of sports) {
    await q(
      "INSERT INTO sport_profiles(user_id,sport,rating,games,wins,skill) VALUES($1,$2,$3,$4,$5,$6)",
      [id, sport, Math.max(810, 1284 - i * 9 + (sports.indexOf(sport) * 47) % 150), Math.max(0, 43 - i % 35), Math.max(0, 26 - i % 23), i % 3 === 0 ? "Intermediate" : i % 3 === 1 ? "Advanced" : "All Levels"]
    );
  }
}
console.log(`Seeded ${users.length} users with password "PlayUp2026!".`);

console.log("Seeding academies...");
const academiesData = [
  ["0b0c7aa7-c796-4d92-86b6-bd14a20e6580", "PlayUp Football Academy", "Abdoun", "Al Reem Street, Abdoun", "Structured football coaching, open play and youth development in central Amman.", ["football"], "/images/football.jpg", 4.9, true, "+962 6 555 0140", "academy@playup.local", ["Youth Grassroots (U12)", "Elite Teen Squad (U18)", "Adult Evening League"]],
  ["d0ec4c7e-0baa-42a0-a118-fc79a9539fc7", "Jordan Racquet Club", "Dabouq", "Dabouq, Amman", "Tennis, padel and fitness coaching for beginners, families and competitive players.", ["tennis", "padel", "fitness"], "/images/tennis.jpg", 4.8, true, "+962 6 555 0188", "racquet@playup.local", ["Beginner Fundamentals", "Private 1-on-1 Coaching", "Weekend Doubles Clinic"]],
  ["99c5ae4a-8e72-4f2f-a870-cd5fc2935a91", "Amman Multi-Sport Academy", "Sport City", "Al Hussein Youth City", "Community coaching and leagues across basketball, volleyball, badminton and dodgeball.", ["basketball", "volleyball", "badminton", "dodgeball"], "/images/basketball.jpg", 4.7, true, "+962 6 555 0162", "multisport@playup.local", ["Hoops Summer Camp", "Adult Pickup Pass", "Dodgeball Tournament Prep"]]
];

for (const row of academiesData) {
  await q(
    "INSERT INTO academies(id,name,area,address,description,sports,image_url,rating,verified,phone,email,training_packages,featured) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true)",
    row
  );
}

// Link organizer as academy owner
await q(
  "UPDATE users SET academy_id=$1, permissions=ARRAY['academy.bookings','academy.courts','academy.offers','academy.analytics','academy.staff'] WHERE id=$2",
  [academiesData[0][0], users[2].id]
);
await q(
  "INSERT INTO academy_staff(academy_id,user_id,role,permissions) VALUES($1,$2,'OWNER',ARRAY['academy.bookings','academy.courts','academy.offers','academy.analytics','academy.staff'])",
  [academiesData[0][0], users[2].id]
);

console.log("Seeding venues...");
const venueNames = [
  ["Al Reem Pitch", "Football", "Abdoun", "Al Reem Street, Abdoun", ["football"], "Parking", "Lighting", "Showers"],
  ["Sport City", "Multi-sport", "Sport City", "Al Hussein Youth City", ["basketball", "football"], "Parking", "Indoor", "Spectator Seating"],
  ["The Arena", "Court", "Dabouq", "Dabouq, Amman", ["basketball", "dodgeball"], "Changing Rooms", "Water", "Air Conditioned"],
  ["Royal Club", "Courts", "Abdoun", "Abdoun, Amman", ["tennis"], "Parking", "Showers", "Cafeteria"],
  ["Galaxy Pitch", "Football", "Tla' Al-Ali", "Tla' Al-Ali, Amman", ["football"], "Lighting", "Water", "Turf 4G"],
  ["Frontier Courts", "Courts", "Sweifieh", "Sweifieh, Amman", ["basketball", "tennis"], "Indoor", "Parking", "Equipment Rental"],
  ["Mecca Sports Hall", "Multi-sport", "Mecca Street", "Mecca Street, Amman", ["dodgeball", "basketball"], "Indoor", "Changing Rooms", "Locker Rooms"],
  ["Green Field", "Football", "Khalda", "Khalda, Amman", ["football"], "Lighting", "Parking", "Viewing Deck"]
];

const venues = [];
for (let i = 0; i < venueNames.length; i++) {
  const [name, , area, address, vs, ...amenities] = venueNames[i];
  const id = randomUUID();
  const rate = 18000 + (i % 4) * 3000;
  const academyId = academiesData[i % academiesData.length][0];
  await q(
    "INSERT INTO venues(id,name,area,address,sports,amenities,image_url,rating,academy_id,hourly_rate_fils,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)",
    [id, name, area, address, vs, amenities, image[vs[0]], (4.9 - i * 0.08).toFixed(1), academyId, rate]
  );
  venues.push({ id, name, area, sports: vs });
}
console.log(`Seeded ${venues.length} venues.`);

console.log("Seeding activities and adventures...");
const activitiesData = [
  ["66170079-240a-4735-bd86-83d4a5147478", "Sunrise hike in Wadi Mujib", "Hiking", "Wadi Mujib", "A guided sunrise canyon route with safety briefing, trail support and transport meeting point from 7th Circle Amman.", "/images/hero-ground.jpg", 28000, 240, "Intermediate", 14, "Mujib Adventures", "+962 7 9123 4567", "Featured", ["Safety Gear", "Trail Guide", "Water & Snacks"]],
  ["2514eb4c-179f-4a4f-8cab-39566aa877a2", "Dead Sea kayaking session", "Kayaking", "Dead Sea", "A calm-water guided paddle with professional equipment, certified instructor and small group dynamic.", "/images/tennis.jpg", 35000, 150, "Beginner", 10, "Jordan Water Sports", "+962 7 9876 5432", "Popular", ["Kayak & Paddle", "Life Jacket", "Hotel Pickup Option"]],
  ["00ae75b8-b68d-4eb4-91ed-f6470996dfa5", "Wadi Rum climbing day", "Climbing", "Wadi Rum", "Supervised sandstone climbing with certified guides, full safety equipment and Bedouin tea break.", "/images/basketball.jpg", 65000, 360, "All levels", 8, "Desert Rock Guides", "+962 7 9456 7890", "Epic", ["Climbing Harness", "Helmets", "Traditional Lunch"]]
];

for (const row of activitiesData) {
  await q(
    "INSERT INTO activities(id,title,category,area,description,image_url,price_fils,duration_minutes,difficulty,capacity,operator_name,operator_phone,badge,includes,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true)",
    row
  );
}

console.log("Seeding offers...");
const offersData = [
  ["0ef10e5c-20d9-4e03-a9a6-829707838038", academiesData[0][0], "Free football session", "PlayUp Football Academy", "Academy", "Redeem one coached group session, subject to availability.", 1200, "/images/football.jpg"],
  ["c2e11ffc-bde8-42fc-98e9-c232f4a528fc", academiesData[1][0], "25% off court time", "Jordan Racquet Club", "Academy", "Save 25% on one off-peak tennis or padel court booking.", 800, "/images/tennis.jpg"],
  ["0b788c61-410e-4015-9ad3-790fb08631bd", null, "PlayUp training bottle", "PlayUp", "Sponsors", "A reusable PlayUp stainless-steel bottle available for collection at participating venues.", 600, "/images/hero-ground.jpg"]
];

for (const row of offersData) {
  await q(
    "INSERT INTO offers(id,academy_id,title,partner,category,description,points_cost,image_url,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,now()+interval '180 days')",
    row
  );
}

console.log("Seeding tournaments...");
const tournamentsData = [
  ["t-football-2027", "Amman Premier Football Cup", "football", "The premier amateur 7v7 football cup in Amman. Group stage into knockout finals with trophy and medals.", new Date(Date.now() + 14 * 86400000), new Date(Date.now() + 60 * 86400000), "/images/football.jpg", "OPEN", "Spring 2027"],
  ["t-basket-2027", "Amman Basketball Cup", "basketball", "5v5 championship tournament hosted at Sport City. 12 squads battle across 4 weekends.", new Date(Date.now() + 20 * 86400000), new Date(Date.now() + 80 * 86400000), "/images/basketball.jpg", "OPEN", "Spring 2027"]
];

for (const row of tournamentsData) {
  await q(
    "INSERT INTO tournaments(id,name,sport,description,starts_at,ends_at,image_url,status,season) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    row
  );
}

console.log("Seeding games, bookings, and matches...");
const formats = {
  football: ["5v5", "7v7"],
  basketball: ["3v3", "5v5"],
  dodgeball: ["Team Game"],
  tennis: ["Singles", "Doubles"]
};

const gameIds = [];
const now = Date.now();

// We create 42 games:
// Games 0..26: Upcoming matches (from today and next 26 days)
// Games 27..41: Completed past matches (for historical stats, scores, reviews)
for (let i = 0; i < 42; i++) {
  const sport = sports[i % 4];
  const formatList = formats[sport];
  const format = formatList[i % formatList.length];
  const venue = venues.find((v, j) => v.sports.includes(sport) && j >= (i % 8)) || venues.find(v => v.sports.includes(sport));
  
  let start;
  if (i === 0) {
    // Today evening!
    start = new Date(now + 4 * 3600000);
  } else if (i === 1) {
    // Tomorrow
    start = new Date(now + 24 * 3600000);
  } else if (i < 27) {
    // Upcoming over next 2-25 days
    start = new Date(now + (i + 1) * 86400000);
  } else {
    // Past completed games
    start = new Date(now - (i - 25) * 86400000);
  }
  start.setHours(18 + (i % 4), i % 2 ? 30 : 0, 0, 0);
  const end = new Date(start.getTime() + 90 * 60000);
  
  const cap = sport === "tennis" ? (format === "Singles" ? 2 : 4) : sport === "basketball" ? 10 : sport === "dodgeball" ? 14 : 14;
  
  // Create varied capacity states:
  // Game 0: nearly full (2 spots remaining)
  // Game 1: half full
  // Game 2: 1 spot remaining
  let count;
  if (i === 0) count = cap - 2;
  else if (i === 1) count = Math.floor(cap / 2);
  else if (i === 2) count = cap - 1;
  else if (i < 27) count = Math.min(cap - 1, Math.max(2, cap - 1 - (i % 5)));
  else count = cap; // Past matches were full
  
  const status = i < 27 ? (count === cap ? "FULL" : "PUBLISHED") : "COMPLETED";
  const gameId = randomUUID();
  const prices = [6000, 5000, 5000, 7000];
  const price = prices[i % 4];
  const skill = i % 3 === 0 ? "Intermediate" : i % 3 === 1 ? "Advanced" : "All Levels";
  const tournamentId = i % 5 === 0 ? (sport === "football" ? tournamentsData[0][0] : sport === "basketball" ? tournamentsData[1][0] : null) : null;

  await q(
    `INSERT INTO games(
      id,sport,title,format,description,rules,venue_id,organizer_id,scorekeeper_id,
      starts_at,ends_at,capacity,booked_count,price_fils,skill,status,image_url,
      recording_enabled,stream_enabled,tournament_id
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
    [
      gameId, sport, `${sport[0].toUpperCase() + sport.slice(1)} ${format}`, format,
      `Join this thrilling ${format} game at ${venue.name}. Teams will be balanced by skill level. All equipment and bibs provided.`,
      "Arrive 15 minutes prior to kickoff. Respect the referee, opponents, and venue guidelines. Clean indoor shoes or turf boots required.",
      venue.id, users[2].id, users[1].id,
      start, end, cap, count, price, skill, status, image[sport],
      i % 2 === 0, i % 3 === 0, tournamentId
    ]
  );
  gameIds.push({ id: gameId, sport, status, cap, count, organizer_id: users[2].id, recording_enabled: i % 2 === 0 });

  // Book players
  for (let j = 0; j < count; j++) {
    const user = users[(i + j) % users.length];
    const bStatus = i < 27 ? "CONFIRMED" : "COMPLETED";
    await q(
      `INSERT INTO bookings(id,reference,game_id,user_id,status,payment_status,amount_fils,recording_acknowledged)
       VALUES($1,$2,$3,$4,$5,'PAID',$6,true) ON CONFLICT DO NOTHING`,
      [randomUUID(), `PLY-${String(i).padStart(2, "0")}${String(j).padStart(4, "0")}`, gameId, user.id, bStatus, price]
    );
  }
}
console.log(`Seeded ${gameIds.length} games and hundreds of player bookings.`);

console.log("Enriching completed games with scores, events, teams, and reviews...");
let enrichedCount = 0;
for (const g of gameIds) {
  if (g.status !== "COMPLETED") continue;

  const players = (await q("SELECT user_id FROM bookings WHERE game_id=$1 ORDER BY created_at,user_id", [g.id])).rows;
  if (!players.length) continue;

  const teams = { BLACK: [], WHITE: [] };
  for (let i = 0; i < players.length; i++) {
    teams[i % 2 ? "WHITE" : "BLACK"].push(players[i].user_id);
  }

  for (const name of ["BLACK", "WHITE"]) {
    const tid = randomUUID();
    await q("INSERT INTO teams(id,game_id,name) VALUES($1,$2,$3) ON CONFLICT DO NOTHING", [tid, g.id, name]);
    const team = (await q("SELECT id FROM teams WHERE game_id=$1 AND name=$2", [g.id, name])).rows[0];
    if (team) {
      for (const u of teams[name]) {
        await q("INSERT INTO team_players(team_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [team.id, u]);
      }
    }
  }

  let seq = 0;
  const addEvent = async (type, team, player) => {
    seq++;
    await q(
      "INSERT INTO game_events(id,game_id,sequence,type,team,player_id,actor_id,clock_seconds) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
      [randomUUID(), g.id, seq, type, team, player || null, g.organizer_id, seq * 60]
    );
  };

  let score;
  if (g.sport === "football") {
    await addEvent("GOAL", "BLACK", teams.BLACK[0]);
    await addEvent("GOAL", "WHITE", teams.WHITE[0]);
    await addEvent("GOAL", "BLACK", teams.BLACK[1] || teams.BLACK[0]);
    score = { black: 2, white: 1, label: "Goals", winner: "BLACK" };
  } else if (g.sport === "basketball") {
    await addEvent("FIELD_GOAL_3", "BLACK", teams.BLACK[0]);
    await addEvent("FIELD_GOAL_2", "WHITE", teams.WHITE[0]);
    await addEvent("FREE_THROW", "BLACK", teams.BLACK[1] || teams.BLACK[0]);
    score = { black: 4, white: 2, label: "Points", winner: "BLACK" };
  } else if (g.sport === "dodgeball") {
    await addEvent("ROUND_WIN", "BLACK", teams.BLACK[0]);
    await addEvent("ROUND_WIN", "WHITE", teams.WHITE[0]);
    await addEvent("ROUND_WIN", "BLACK", teams.BLACK[1] || teams.BLACK[0]);
    score = { black: 2, white: 1, label: "Rounds", winner: "BLACK" };
  } else {
    for (let k = 0; k < 12; k++) await addEvent("POINT", "BLACK", teams.BLACK[0]);
    score = { black: 2, white: 0, label: "Sets", winner: "BLACK", tennis: { sets: [[6, 3], [6, 4]], games: [0, 0], points: ["0", "0"], tiebreak: false, winner: "BLACK" } };
  }

  await q(
    "INSERT INTO results(game_id,sport,winner,score,finalized_by) VALUES($1,$2,'BLACK',$3,$4) ON CONFLICT (game_id) DO UPDATE SET score=$3,winner='BLACK'",
    [g.id, g.sport, JSON.stringify(score), g.organizer_id]
  );
  await q("UPDATE games SET finalized_at=now(),winner='BLACK' WHERE id=$1", [g.id]);

  // Add reviews for the completed game
  for (let r = 0; r < Math.min(3, players.length); r++) {
    const reviewer = players[r].user_id;
    await q(
      `INSERT INTO reviews(id,game_id,user_id,venue_rating,organization_rating,experience_rating,body)
       VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
      [
        randomUUID(), g.id, reviewer,
        5 - (r % 2), 5, 5 - (r % 2),
        r === 0 ? "Incredible match! The pace was intense, pitch quality was pristine, and everyone showed great sportsmanship." : "Super well organized by Kareem. Balanced sides and prompt start."
      ]
    );
  }

  if (g.recording_enabled) {
    const streamId = randomUUID();
    await q("INSERT INTO streams(id,game_id,provider,provider_id,status,visibility,started_at,ended_at) VALUES($1,$2,'mock',$3,'ENDED','PUBLIC',now()-interval '2 hours',now()-interval '30 minutes') ON CONFLICT DO NOTHING", [streamId, g.id, `mock_${g.id}`]);
    const stream = (await q("SELECT id FROM streams WHERE game_id=$1", [g.id])).rows[0];
    if (stream) {
      await q("INSERT INTO recordings(id,game_id,stream_id,status,visibility) VALUES($1,$2,$3,'PROCESSING','PUBLIC') ON CONFLICT DO NOTHING", [randomUUID(), g.id, stream.id]);
    }
  }

  enrichedCount++;
}
console.log(`Enriched ${enrichedCount} completed games.`);

console.log("Seeding community posts and notifications...");
for (let i = 0; i < 8; i++) {
  await q("INSERT INTO posts(id,user_id,body,game_id) VALUES($1,$2,$3,$4)", [
    randomUUID(), users[i].id,
    [
      "Great match tonight at Al Reem Pitch! Clean passes and great vibes ⚽ Who is down for basketball tomorrow?",
      "Jordan Racquet Club courts are in top condition. Looking for a tennis doubles partner this Saturday afternoon!",
      "First time using PlayUp and the team balancing worked like magic. 10/10 experience!",
      "What a buzzer beater at The Arena in Dabouq! GGs to team White 🏀"
    ][i % 4],
    gameIds[i].id
  ]);
}

await q(
  "INSERT INTO notifications(id,user_id,type,title,body,href) VALUES($1,$2,'WELCOME','Welcome to PlayUp','Your next match in Amman is ready to book. Browse upcoming games!','/games')",
  [randomUUID(), users[0].id]
);

// Verify final counts
console.log("\n--- Final Database Verification ---");
const counts = {};
for (const t of ["users", "venues", "academies", "activities", "games", "bookings", "tournaments", "posts", "reviews"]) {
  const res = await q(`SELECT count(*) FROM "${t}"`);
  counts[t] = Number(res.rows[0].count);
}
console.log("Database Row Counts:", counts);

await db.end();
console.log("\n✅ Test data seeding completed successfully!");
