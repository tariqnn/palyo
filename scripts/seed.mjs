import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { hashSync } from "bcryptjs";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

if(process.env.NODE_ENV==="production"||(process.env.DATABASE_URL&&process.env.ALLOW_DEMO_SEED!=="1"))throw new Error("Demo seed is disabled for production or external databases without ALLOW_DEMO_SEED=1.");

const db = process.env.DATABASE_URL ? new pg.Client({ connectionString: process.env.DATABASE_URL }) : new PGlite(process.env.PLAYO_DB_DIR || ".playo-db");
if (process.env.DATABASE_URL) await db.connect();
const q = (sql, values = []) => db.query(sql, values);
await db.exec?.(await readFile("db/migrations/001_init.sql", "utf8"));
if (process.env.DATABASE_URL) await q(await readFile("db/migrations/001_init.sql", "utf8"));
const existing = await q("SELECT id FROM users LIMIT 1");
if (existing.rows.length) { console.log("Seed data already exists."); await db.end?.(); await db.close?.(); process.exit(0); }

const sports = ["football", "basketball", "dodgeball", "tennis"];
const image = {
 football: "/images/football.jpg",
 basketball: "/images/basketball.jpg",
 dodgeball: "/images/dodgeball.jpg",
 tennis: "/images/tennis.jpg"
};
const first = ["Tariq","Ahmad","Omar","Yousef","Kareem","Ali","Hassan","Sami","Lina","Sara","Noor","Maya","Rami","Zaid","Hadi","Adam","Malik","Rana","Dana","Faris","Nour","Yara","Khaled","Jad","Basil","Nadine","Leen","Salma","Ameer","Ibrahim","Laith","Rashed","Hamza","Rami","Fadi","Alaa","Hussein","Zain","Haya","Mariam","Zara","Ola","Yazan","Razan","Samer","Reem","Amal","Bilal","Nouran","Nader","Anas","Saba","Dalia","Mahmoud"];
const last = ["Ahmed","Mansour","Haddad","Nasser","Khalil","Saleh","Odeh","Sabbagh","Fayez","Hamdan","Khatib","Abdullah"];
const demoHash = hashSync("PlayoDemo2026!", 12);
const users = [];
for (let i=0;i<first.length;i++) {
 const id=randomUUID(), name=`${first[i]} ${last[i%last.length]}`, username=i===0?"tariq":`${first[i].toLowerCase()}${i}`;
 const email=i<4?["player@playo.local","scorekeeper@playo.local","organizer@playo.local","admin@playo.local"][i]:`${username}@playo.local`;
 const role=i===1?"SCOREKEEPER":i===2?"ORGANIZER":i===3?"ADMIN":"PLAYER";
 await q("INSERT INTO users(id,name,username,email,password_hash,role,xp,avatar_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[id,name,username,email,demoHash,role,Math.max(0,4820-i*67),`https://i.pravatar.cc/120?img=${(i%70)+1}`]);
 users.push({id,name,username});
 for(const sport of sports) await q("INSERT INTO sport_profiles(user_id,sport,rating,games,wins) VALUES($1,$2,$3,$4,$5)",[id,sport,Math.max(810,1284-i*9+(sports.indexOf(sport)*47)%150),Math.max(0,43-i%35),Math.max(0,26-i%23)]);
}
const venueNames=[
 ["Al Reem Pitch","Football","Abdoun","Al Reem Street, Abdoun",["football"],"Parking","Lighting"],
 ["Sport City","Multi-sport","Sport City","Al Hussein Youth City",["basketball","football"],"Parking","Indoor"],
 ["The Arena","Court","Dabouq","Dabouq, Amman",["basketball","dodgeball"],"Changing Rooms","Water"],
 ["Royal Club","Courts","Abdoun","Abdoun, Amman",["tennis"],"Parking","Showers"],
 ["Galaxy Pitch","Football","Tla' Al-Ali","Tla' Al-Ali, Amman",["football"],"Lighting","Water"],
 ["Frontier Courts","Courts","Sweifieh","Sweifieh, Amman",["basketball","tennis"],"Indoor","Parking"],
 ["Mecca Sports Hall","Multi-sport","Mecca Street","Mecca Street, Amman",["dodgeball","basketball"],"Indoor","Changing Rooms"],
 ["Green Field","Football","Khalda","Khalda, Amman",["football"],"Lighting","Parking"]
];
const venues=[];
for(let i=0;i<venueNames.length;i++) { const [name,,area,address,vs,...amenities]=venueNames[i], id=randomUUID(); await q("INSERT INTO venues(id,name,area,address,sports,amenities,image_url,rating) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[id,name,area,address,vs,amenities,image[vs[0]],(4.9-i*.08).toFixed(1)]); venues.push({id,name,area,sports:vs}); }
const formats={football:["5v5","7v7"],basketball:["3v3","5v5"],dodgeball:["Team Game"],tennis:["Singles","Doubles"]};
const gameIds=[];
for(let i=0;i<42;i++) {
 const sport=sports[i%4], format=formats[sport][i%formats[sport].length], venue=venues.find((v,j)=>v.sports.includes(sport)&&j>=(i%8))||venues.find(v=>v.sports.includes(sport));
 const start=new Date(Date.now()+((i<27?1+i:-i+26)*86400000)); start.setHours(18+(i%4),i%2?30:0,0,0);
 const end=new Date(start.getTime()+90*60000), id=randomUUID(), cap=sport==="tennis"?(format==="Singles"?2:4):sport==="basketball"?10:sport==="dodgeball"?20:14;
 const count=i<27?Math.min(cap-1,Math.max(2,cap-1-i%5)):Math.min(cap,8+i%6);
 const status=i<27?(count===cap?"FULL":"PUBLISHED"):"COMPLETED";
 await q("INSERT INTO games(id,sport,title,format,description,rules,venue_id,organizer_id,scorekeeper_id,starts_at,ends_at,capacity,booked_count,price_fils,skill,status,image_url,recording_enabled,stream_enabled) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)",[id,sport,`${sport[0].toUpperCase()+sport.slice(1)} ${format}`,format,`Come play a competitive ${format} game. All players are welcome; teams will be balanced by the organizer.`,"Arrive 15 minutes early. Respect your teammates and the venue.",venue.id,users[2].id,users[1].id,start,end,cap,count,[6000,5000,5000,7000][i%4],i%3===0?"Intermediate":"All Levels",status,image[sport],i%3===0,i%3===0]);
 gameIds.push(id);
 for(let j=0;j<count;j++) {const user=users[(i+j)%users.length]; await q("INSERT INTO bookings(id,reference,game_id,user_id,status,payment_status,amount_fils,recording_acknowledged) VALUES($1,$2,$3,$4,'CONFIRMED','PAID',$5,true) ON CONFLICT DO NOTHING",[randomUUID(),`PLY-${String(i).padStart(2,"0")}${String(j).padStart(4,"0")}`,id,user.id,[6000,5000,5000,7000][i%4]]);}
}
for(let i=0;i<2;i++) await q("INSERT INTO tournaments(id,name,sport,description,starts_at,ends_at,image_url,status,season) VALUES($1,$2,$3,$4,$5,$6,$7,'OPEN',$8)",[randomUUID(),i?"Amman Basketball Cup":"Spring Season 2027",i?"basketball":"football","Join a season of competitive local sport.",new Date(Date.now()+20*86400000),new Date(Date.now()+100*86400000),image[i?"basketball":"football"],"Spring 2027"]);
for(let i=0;i<8;i++) await q("INSERT INTO posts(id,user_id,body,game_id) VALUES($1,$2,$3,$4)",[randomUUID(),users[i].id,["Great games tonight! Who's in for basketball tomorrow?","New to PLAYO and already found my team.","Looking for tennis doubles partners this weekend.","What a finish at Al Reem Pitch! ⚽"][i%4],gameIds[i]]);
await q("INSERT INTO notifications(id,user_id,type,title,body,href) VALUES($1,$2,'WELCOME','Welcome to PLAYO','Your next game is waiting.','/games')",[randomUUID(),users[0].id]);
console.log(`Seeded ${users.length} players, ${venues.length} venues, ${gameIds.length} games, 2 tournaments, posts and bookings.`);
await db.end?.(); await db.close?.();
await import("./enrich-demo.mjs");
