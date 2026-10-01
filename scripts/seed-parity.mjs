import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
const db=process.env.DATABASE_URL?new pg.Client({connectionString:process.env.DATABASE_URL}):new PGlite(process.env.PLAYUP_DB_DIR||process.env.PLAYO_DB_DIR||".playup-db");
if(process.env.DATABASE_URL)await db.connect();
const q=(text,params=[])=>db.query(text,params);
const academies=[
 ["0b0c7aa7-c796-4d92-86b6-bd14a20e6580","PlayUp Football Academy","Abdoun","Al Reem Street, Abdoun","Structured football coaching, open play and youth development in central Amman.",["football"],"/images/football.jpg",4.9,true,"+962 6 555 0140","academy@playup.local"],
 ["d0ec4c7e-0baa-42a0-a118-fc79a9539fc7","Jordan Racquet Club","Dabouq","Dabouq, Amman","Tennis, padel and fitness coaching for beginners, families and competitive players.",["tennis","padel","fitness"],"/images/tennis.jpg",4.8,true,"+962 6 555 0188","racquet@playup.local"],
 ["99c5ae4a-8e72-4f2f-a870-cd5fc2935a91","Amman Multi-Sport Academy","Sport City","Al Hussein Youth City","Community coaching and leagues across basketball, volleyball, badminton and dodgeball.",["basketball","volleyball","badminton","dodgeball"],"/images/basketball.jpg",4.7,true,"+962 6 555 0162","multisport@playup.local"]
];
for(const row of academies)await q("INSERT INTO academies(id,name,area,address,description,sports,image_url,rating,verified,phone,email) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(id) DO UPDATE SET name=$2,area=$3,address=$4,description=$5,sports=$6,image_url=$7,rating=$8,verified=$9,phone=$10,email=$11",row);
const venues=(await q("SELECT id,name FROM venues ORDER BY name")).rows;
for(let i=0;i<venues.length;i++)await q("UPDATE venues SET academy_id=$1,hourly_rate_fils=$2 WHERE id=$3",[academies[i%academies.length][0],18000+(i%4)*3000,venues[i].id]);
const offers=[
 ["0ef10e5c-20d9-4e03-a9a6-829707838038",academies[0][0],"Free football session","PlayUp Football Academy","Academy","Redeem one coached group session, subject to availability.",1200,"/images/football.jpg"],
 ["c2e11ffc-bde8-42fc-98e9-c232f4a528fc",academies[1][0],"25% off court time","Jordan Racquet Club","Academy","Save 25% on one off-peak tennis or padel court booking.",800,"/images/tennis.jpg"],
 ["0b788c61-410e-4015-9ad3-790fb08631bd",null,"PlayUp training bottle","PlayUp","Sponsors","A reusable PlayUp bottle available for collection at participating venues.",600,"/images/hero-ground.jpg"]
];
for(const row of offers)await q("INSERT INTO offers(id,academy_id,title,partner,category,description,points_cost,image_url,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,now()+interval '180 days') ON CONFLICT(id) DO UPDATE SET title=$3,partner=$4,category=$5,description=$6,points_cost=$7,image_url=$8",row);
const activities=[
 ["66170079-240a-4735-bd86-83d4a5147478","Sunrise hike in Wadi Mujib","Hiking","Wadi Mujib","A guided sunrise route with safety briefing, trail support and transport meeting point.","/images/hero-ground.jpg",28000,240,"Intermediate",14],
 ["2514eb4c-179f-4a4f-8cab-39566aa877a2","Dead Sea kayaking session","Kayaking","Dead Sea","A calm-water guided paddle with equipment, instruction and a small group.","/images/tennis.jpg",35000,150,"Beginner",10],
 ["00ae75b8-b68d-4eb4-91ed-f6470996dfa5","Wadi Rum climbing day","Climbing","Wadi Rum","Supervised sandstone climbing with certified guides and safety equipment.","/images/basketball.jpg",65000,360,"All levels",8]
];
for(const row of activities)await q("INSERT INTO activities(id,title,category,area,description,image_url,price_fils,duration_minutes,difficulty,capacity) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(id) DO UPDATE SET title=$2,category=$3,area=$4,description=$5,image_url=$6,price_fils=$7,duration_minutes=$8,difficulty=$9,capacity=$10",row);
const owner=(await q("SELECT id FROM users WHERE role IN ('ORGANIZER','ADMIN','SUPER_ADMIN') ORDER BY CASE role WHEN 'ORGANIZER' THEN 0 ELSE 1 END LIMIT 1")).rows[0];
if(owner){await q("UPDATE users SET academy_id=$1,permissions=ARRAY['academy.bookings','academy.courts','academy.offers','academy.analytics','academy.staff'] WHERE id=$2",[academies[0][0],owner.id]);await q("INSERT INTO academy_staff(academy_id,user_id,role,permissions) VALUES($1,$2,'OWNER',ARRAY['academy.bookings','academy.courts','academy.offers','academy.analytics','academy.staff']) ON CONFLICT DO NOTHING",[academies[0][0],owner.id]);}
await db.end?.();await db.close?.();
console.log("Mobile feature parity data ready.");
