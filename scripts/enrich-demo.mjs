import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

const previewSeed=process.env.DATABASE_URL&&process.env.ALLOW_DEMO_SEED==="1"&&process.env.PLAYO_PRIVATE_DEMO==="1"&&process.env.VERCEL_ENV==="preview";
const publicSeed=process.env.DATABASE_URL&&process.env.ALLOW_DEMO_SEED==="1"&&process.env.PLAYO_PUBLIC_DEMO==="1"&&process.env.VERCEL_ENV==="production";
if((process.env.NODE_ENV==="production"&&!previewSeed&&!publicSeed)||(process.env.DATABASE_URL&&process.env.ALLOW_DEMO_SEED!=="1"))throw new Error("Demo enrichment requires an explicitly enabled demo database.");

const db=process.env.DATABASE_URL?new pg.Client({connectionString:process.env.DATABASE_URL}):new PGlite(process.env.PLAYO_DB_DIR||".playo-db");
if(process.env.DATABASE_URL)await db.connect();
const schema=await readFile("db/migrations/001_init.sql","utf8");
if(db.exec)await db.exec(schema);else await db.query(schema);
const q=(text,params=[])=>db.query(text,params);
const games=(await q("SELECT id,sport,organizer_id,recording_enabled FROM games WHERE status='COMPLETED' ORDER BY starts_at ASC")).rows;
let completed=0;
for(const game of games){
 const exists=(await q("SELECT game_id FROM results WHERE game_id=$1",[game.id])).rows[0];if(exists)continue;
 const players=(await q("SELECT user_id FROM bookings WHERE game_id=$1 ORDER BY created_at,user_id",[game.id])).rows;
 const teams={BLACK:[],WHITE:[]};
 for(let i=0;i<players.length;i++)teams[i%2?"WHITE":"BLACK"].push(players[i].user_id);
 for(const name of ["BLACK","WHITE"]){const id=randomUUID();await q("INSERT INTO teams(id,game_id,name) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",[id,game.id,name]);const team=(await q("SELECT id FROM teams WHERE game_id=$1 AND name=$2",[game.id,name])).rows[0];for(const userId of teams[name])await q("INSERT INTO team_players(team_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING",[team.id,userId]);}
 let seq=0;
 const add=async(type,team,player)=>{seq++;await q("INSERT INTO game_events(id,game_id,sequence,type,team,player_id,actor_id,clock_seconds) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[randomUUID(),game.id,seq,type,team,player||null,game.organizer_id,seq*60]);};
 let score;
 if(game.sport==="football"){await add("GOAL","BLACK",teams.BLACK[0]);await add("GOAL","WHITE",teams.WHITE[0]);await add("GOAL","BLACK",teams.BLACK[1]||teams.BLACK[0]);score={black:2,white:1,label:"Goals",winner:"BLACK"};}
 else if(game.sport==="basketball"){await add("FIELD_GOAL_3","BLACK",teams.BLACK[0]);await add("FIELD_GOAL_2","WHITE",teams.WHITE[0]);await add("FREE_THROW","BLACK",teams.BLACK[1]||teams.BLACK[0]);score={black:4,white:2,label:"Points",winner:"BLACK"};}
 else if(game.sport==="dodgeball"){await add("ROUND_WIN","BLACK",teams.BLACK[0]);await add("ROUND_WIN","WHITE",teams.WHITE[0]);await add("ROUND_WIN","BLACK",teams.BLACK[1]||teams.BLACK[0]);score={black:2,white:1,label:"Rounds",winner:"BLACK"};}
 else {for(let i=0;i<48;i++)await add("POINT","BLACK",teams.BLACK[0]);score={black:2,white:0,label:"Sets",winner:"BLACK",tennis:{sets:[[6,0],[6,0]],games:[0,0],points:["0","0"],tiebreak:false,winner:"BLACK"}};}
 await q("INSERT INTO results(game_id,sport,winner,score,finalized_by) VALUES($1,$2,'BLACK',$3,$4)",[game.id,game.sport,JSON.stringify(score),game.organizer_id]);
 await q("UPDATE games SET finalized_at=now(),winner='BLACK' WHERE id=$1",[game.id]);
 for(const name of ["BLACK","WHITE"])for(const userId of teams[name]){
  const win=name==="BLACK";
  const profile=(await q("SELECT rating FROM sport_profiles WHERE user_id=$1 AND sport=$2",[userId,game.sport])).rows[0];
  const old=Number(profile?.rating||1000),change=win?16:-12;
  await q("UPDATE sport_profiles SET rating=rating+$3,games=games+1,wins=wins+$4 WHERE user_id=$1 AND sport=$2",[userId,game.sport,change,win?1:0]);
  await q("INSERT INTO rating_history(id,game_id,user_id,sport,old_rating,new_rating,change) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING",[randomUUID(),game.id,userId,game.sport,old,old+change,change]);
  await q("INSERT INTO xp_awards(id,game_id,user_id,reason,amount) VALUES($1,$2,$3,'COMPLETED_GAME',100) ON CONFLICT DO NOTHING",[randomUUID(),game.id,userId]);
  await q("UPDATE users SET xp=xp+100 WHERE id=$1",[userId]);
  await q("UPDATE bookings SET status='COMPLETED' WHERE game_id=$1 AND user_id=$2",[game.id,userId]);
  await q("INSERT INTO achievements(id,user_id,code,game_id) VALUES($1,$2,'FIRST_GAME',$3) ON CONFLICT DO NOTHING",[randomUUID(),userId,game.id]);
  if(win)await q("INSERT INTO achievements(id,user_id,code,game_id) VALUES($1,$2,'FIRST_WIN',$3) ON CONFLICT DO NOTHING",[randomUUID(),userId,game.id]);
 }
 if(game.recording_enabled){const streamId=randomUUID();await q("INSERT INTO streams(id,game_id,provider,provider_id,status,visibility,started_at,ended_at) VALUES($1,$2,'mock',$3,'ENDED','PUBLIC',now()-interval '2 hours',now()-interval '30 minutes') ON CONFLICT DO NOTHING",[streamId,game.id,`mock_${game.id}`]);const stream=(await q("SELECT id FROM streams WHERE game_id=$1",[game.id])).rows[0];await q("INSERT INTO recordings(id,game_id,stream_id,status,visibility) VALUES($1,$2,$3,'PROCESSING','PUBLIC')",[randomUUID(),game.id,stream.id]);}
 completed++;
}
const tournaments=(await q("SELECT id,sport FROM tournaments ORDER BY starts_at")).rows;
for(const tournament of tournaments){
  const matches=(await q("SELECT id FROM games WHERE sport=$1 AND tournament_id IS NULL ORDER BY starts_at DESC LIMIT 8",[tournament.sport])).rows;
  for(const match of matches)await q("UPDATE games SET tournament_id=$1 WHERE id=$2",[tournament.id,match.id]);
}
console.log(`Enriched ${completed} historical games with sport score events, results, teams, ratings, XP, achievements, and recording metadata.`);
await db.end?.();await db.close?.();
