import "server-only";
import { randomUUID } from "node:crypto";
import { one, transaction } from "@/lib/db";

export type GameClock = { period:number; elapsedSeconds:number; running:boolean; asOf:string };
type Row = {period:number;elapsed_seconds:number;running:boolean;started_at:string|null};

function snapshot(row:Row|null):GameClock {
  const now=Date.now();
  const extra=row?.running&&row.started_at?Math.max(0,Math.floor((now-new Date(row.started_at).getTime())/1000)):0;
  return {period:Number(row?.period||1),elapsedSeconds:Number(row?.elapsed_seconds||0)+extra,running:!!row?.running,asOf:new Date(now).toISOString()};
}

export async function getGameClock(gameId:string):Promise<GameClock>{
  const row=await one<Row>("SELECT period,elapsed_seconds,running,started_at FROM game_clocks WHERE game_id=$1",[gameId]);
  return snapshot(row);
}

export async function controlGameClock(gameId:string,actorId:string,command:"START"|"PAUSE"|"RESET"|"NEXT_PERIOD"){
  return transaction(async tx=>{
    const game=(await tx.query("SELECT status,finalized_at FROM games WHERE id=$1 FOR UPDATE",[gameId])).rows[0];
    if(!game||game.status==="CANCELLED"||game.finalized_at)throw new Error("The match clock is closed.");
    await tx.query("INSERT INTO game_clocks(game_id) VALUES($1) ON CONFLICT DO NOTHING",[gameId]);
    const row=(await tx.query("SELECT period,elapsed_seconds,running,started_at FROM game_clocks WHERE game_id=$1 FOR UPDATE",[gameId])).rows[0] as Row;
    const current=snapshot(row);
    if(command==="START"){
      if(row.running)throw new Error("The clock is already running.");
      await tx.query("UPDATE game_clocks SET running=TRUE,started_at=now(),updated_at=now() WHERE game_id=$1",[gameId]);
      await tx.query("UPDATE games SET status='IN_PROGRESS' WHERE id=$1 AND status IN ('PUBLISHED','FILLING','FULL')",[gameId]);
    }else if(command==="PAUSE"){
      if(!row.running)throw new Error("The clock is already paused.");
      await tx.query("UPDATE game_clocks SET elapsed_seconds=$2,running=FALSE,started_at=NULL,updated_at=now() WHERE game_id=$1",[gameId,current.elapsedSeconds]);
    }else if(command==="RESET"){
      await tx.query("UPDATE game_clocks SET elapsed_seconds=0,running=FALSE,started_at=NULL,updated_at=now() WHERE game_id=$1",[gameId]);
    }else{
      if(row.period>=10)throw new Error("Maximum period reached.");
      await tx.query("UPDATE game_clocks SET period=period+1,elapsed_seconds=0,running=FALSE,started_at=NULL,updated_at=now() WHERE game_id=$1",[gameId]);
    }
    await tx.query("INSERT INTO audit_logs(id,actor_id,action,entity,entity_id,new_data) VALUES($1,$2,'CLOCK_CONTROL','game',$3,$4)",[randomUUID(),actorId,gameId,JSON.stringify({command,period:current.period,elapsedSeconds:current.elapsedSeconds})]);
  });
}
