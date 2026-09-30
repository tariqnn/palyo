import "server-only";
import { randomUUID } from "node:crypto";
import { transaction, query } from "@/lib/db";
import { calculateScore, validateEvent, type ScoreEvent, type ScoringConfig } from "@/lib/scoring";
import { balanceTeams } from "@/lib/teams";
import type { Sport } from "@/lib/brand";
import { defaultRatingAlgorithm } from "@/lib/ratings";
import { xpForResult } from "@/lib/xp";
import { achievementsForResult } from "@/lib/achievements";

export async function scoreEvents(gameId:string){return query<ScoreEvent & {sequence:number;created_at:string;player_name:string|null}>("SELECT e.*,u.name AS player_name FROM game_events e LEFT JOIN users u ON u.id=e.player_id WHERE e.game_id=$1 ORDER BY e.sequence",[gameId]);}
export async function addScoreEvent(gameId:string,actorId:string,input:{type:string;team:string;playerId?:string;assistId?:string;period?:number;clockSeconds?:number}){
  return transaction(async tx=>{
    const game=(await tx.query("SELECT * FROM games WHERE id=$1 FOR UPDATE",[gameId])).rows[0];
    if(!game||game.status==="CANCELLED"||game.finalized_at) throw new Error("Scoring is closed for this game.");
    validateEvent(game.sport as Sport,input);
    if(input.playerId){const player=(await tx.query("SELECT id FROM bookings WHERE game_id=$1 AND user_id=$2 AND status IN ('CONFIRMED','COMPLETED')",[gameId,input.playerId])).rows[0];if(!player) throw new Error("Choose a player booked for this game.");}
    const seq=(await tx.query("SELECT COALESCE(MAX(sequence),0)+1 AS seq FROM game_events WHERE game_id=$1",[gameId])).rows[0];
    await tx.query("INSERT INTO game_events(id,game_id,sequence,type,team,player_id,assist_id,period,clock_seconds,actor_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",[randomUUID(),gameId,seq.seq,input.type,input.team,input.playerId||null,input.assistId||null,input.period||null,input.clockSeconds||null,actorId]);
    await tx.query("UPDATE games SET status='IN_PROGRESS' WHERE id=$1 AND status IN ('PUBLISHED','FILLING','FULL')",[gameId]);
  });
}
export async function undoScoreEvent(gameId:string,actorId:string){
  return transaction(async tx=>{
    const game=(await tx.query("SELECT finalized_at FROM games WHERE id=$1 FOR UPDATE",[gameId])).rows[0];
    if(!game||game.finalized_at) throw new Error("Scoring is closed.");
    const last=(await tx.query("SELECT e.id FROM game_events e WHERE e.game_id=$1 AND e.type<>'REVERSAL' AND NOT EXISTS(SELECT 1 FROM game_events r WHERE r.reverses_event_id=e.id) ORDER BY e.sequence DESC LIMIT 1",[gameId])).rows[0];
    if(!last) throw new Error("There is no event to undo.");
    const seq=(await tx.query("SELECT COALESCE(MAX(sequence),0)+1 AS seq FROM game_events WHERE game_id=$1",[gameId])).rows[0];
    await tx.query("INSERT INTO game_events(id,game_id,sequence,type,actor_id,reverses_event_id) VALUES($1,$2,$3,'REVERSAL',$4,$5)",[randomUUID(),gameId,seq.seq,actorId,last.id]);
    await tx.query("INSERT INTO audit_logs(id,actor_id,action,entity,entity_id,new_data) VALUES($1,$2,'SCORE_UNDO','game',$3,$4)",[randomUUID(),actorId,gameId,JSON.stringify({reversedEventId:last.id})]);
  });
}
export async function generateTeams(gameId:string){
  return transaction(async tx=>{
    const game=(await tx.query("SELECT sport FROM games WHERE id=$1 FOR UPDATE",[gameId])).rows[0];
    if(!game) throw new Error("Game not found.");
    const players=(await tx.query("SELECT b.user_id AS id,COALESCE(p.rating,1000) AS rating,p.position FROM bookings b LEFT JOIN sport_profiles p ON p.user_id=b.user_id AND p.sport=$2 WHERE b.game_id=$1 AND b.status='CONFIRMED'",[gameId,game.sport])).rows as {id:string;rating:number;position:string|null}[];
    const teams=balanceTeams(players);
    await tx.query("DELETE FROM team_players WHERE team_id IN (SELECT id FROM teams WHERE game_id=$1)",[gameId]);
    await tx.query("DELETE FROM teams WHERE game_id=$1",[gameId]);
    for(const name of ["BLACK","WHITE"] as const){const id=randomUUID();await tx.query("INSERT INTO teams(id,game_id,name) VALUES($1,$2,$3)",[id,gameId,name]);for(const p of teams[name.toLowerCase() as "black"|"white"]) await tx.query("INSERT INTO team_players(team_id,user_id) VALUES($1,$2)",[id,p.id]);}
    return teams.difference;
  });
}
export async function finalizeGame(gameId:string,actorId:string){
  return transaction(async tx=>{
    const game=(await tx.query("SELECT * FROM games WHERE id=$1 FOR UPDATE",[gameId])).rows[0];
    if(!game||game.finalized_at) throw new Error("This result is already final or the game is missing.");
    if(game.status==="CANCELLED") throw new Error("A cancelled game cannot be finalized.");
    const events=(await tx.query("SELECT * FROM game_events WHERE game_id=$1 ORDER BY sequence",[gameId])).rows as ScoreEvent[];
    if(!events.length) throw new Error("Add score events before finalizing.");
    const score=calculateScore(game.sport as Sport,events,game.score_config as ScoringConfig);
    let mvpId=game.mvp_id;
    if(!mvpId&&game.mvp_enabled){const vote=(await tx.query("SELECT nominee_id,count(*) AS votes FROM mvp_votes WHERE game_id=$1 GROUP BY nominee_id ORDER BY votes DESC,nominee_id LIMIT 1",[gameId])).rows[0];mvpId=vote?.nominee_id||null;}
    await tx.query("INSERT INTO results(game_id,sport,winner,score,finalized_by) VALUES($1,$2,$3,$4,$5)",[gameId,game.sport,score.winner||null,JSON.stringify(score),actorId]);
    await tx.query("UPDATE games SET status='COMPLETED',finalized_at=now(),winner=$2,mvp_id=$3 WHERE id=$1",[gameId,score.winner||null,mvpId]);
    const players=(await tx.query("SELECT b.user_id,t.name AS team FROM bookings b LEFT JOIN LATERAL (SELECT t.name FROM team_players tp JOIN teams t ON t.id=tp.team_id WHERE tp.user_id=b.user_id AND t.game_id=b.game_id LIMIT 1) t ON TRUE WHERE b.game_id=$1 AND b.status='CONFIRMED'",[gameId])).rows;
    if(!players.length)throw new Error("A result needs at least one booked player.");
    if(players.some(p=>!p.team))throw new Error("Assign players to sides before finalizing.");
    for(const p of players){
      const win=!!score.winner&&p.team===score.winner;
      const profile=(await tx.query("SELECT rating FROM sport_profiles WHERE user_id=$1 AND sport=$2 FOR UPDATE",[p.user_id,game.sport])).rows[0];
      const old=Number(profile?.rating||1000),change=defaultRatingAlgorithm.change({winner:score.winner,team:String(p.team||"")});
      await tx.query("INSERT INTO sport_profiles(user_id,sport,rating,games,wins) VALUES($1,$2,$3,1,$4) ON CONFLICT(user_id,sport) DO UPDATE SET rating=sport_profiles.rating+$5,games=sport_profiles.games+1,wins=sport_profiles.wins+$4",[p.user_id,game.sport,old+change,win?1:0,change]);
      await tx.query("INSERT INTO rating_history(id,game_id,user_id,sport,old_rating,new_rating,change) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING",[randomUUID(),gameId,p.user_id,game.sport,old,old+change,change]);
      for(const [reason,amount] of xpForResult({completed:true,won:win,mvp:mvpId===p.user_id})){const award=await tx.query("INSERT INTO xp_awards(id,game_id,user_id,reason,amount) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING id",[randomUUID(),gameId,p.user_id,reason,amount]);if(award.rows.length)await tx.query("UPDATE users SET xp=xp+$2 WHERE id=$1",[p.user_id,amount]);}
      await tx.query("UPDATE bookings SET status='COMPLETED' WHERE game_id=$1 AND user_id=$2",[gameId,p.user_id]);
      const progress=(await tx.query("SELECT games,wins FROM sport_profiles WHERE user_id=$1 AND sport=$2",[p.user_id,game.sport])).rows[0];
      const activeSports=(await tx.query("SELECT count(*)::int AS n FROM sport_profiles WHERE user_id=$1 AND games>0",[p.user_id])).rows[0];
      for(const code of achievementsForResult({games:Number(progress.games),wins:Number(progress.wins),mvp:mvpId===p.user_id,activeSports:Number(activeSports.n)}))await tx.query("INSERT INTO achievements(id,user_id,code,game_id) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",[randomUUID(),p.user_id,code,gameId]);
    }
    await tx.query("INSERT INTO audit_logs(id,actor_id,action,entity,entity_id,new_data) VALUES($1,$2,'RESULT_FINALIZED','game',$3,$4)",[randomUUID(),actorId,gameId,JSON.stringify(score)]);
    return score;
  });
}
export async function getScore(gameId:string,sport:Sport,config:ScoringConfig={}){return calculateScore(sport,await scoreEvents(gameId),config);}
export async function gamePlayers(gameId:string){return query<{id:string;name:string;avatar_url:string|null;team:string|null}>("SELECT u.id,u.name,u.avatar_url,t.name AS team FROM bookings b JOIN users u ON u.id=b.user_id LEFT JOIN LATERAL (SELECT t.name FROM team_players tp JOIN teams t ON t.id=tp.team_id WHERE tp.user_id=u.id AND t.game_id=b.game_id LIMIT 1) t ON TRUE WHERE b.game_id=$1 AND b.status IN ('CONFIRMED','COMPLETED') ORDER BY u.name",[gameId]);}
