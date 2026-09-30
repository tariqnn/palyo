import { z } from "zod";
import type { Sport } from "@/lib/brand";

export const eventTypes:Record<Sport,readonly string[]>={
 football:["GOAL","ASSIST","OWN_GOAL","YELLOW_CARD","RED_CARD","SAVE","PENALTY_SCORED","PENALTY_MISSED","SUBSTITUTION","CUSTOM"],
 basketball:["FREE_THROW","FIELD_GOAL_2","FIELD_GOAL_3","ASSIST","REBOUND","STEAL","BLOCK","TURNOVER","FOUL","TIMEOUT","CUSTOM"],
 dodgeball:["ELIMINATION","CATCH","DODGE","ROUND_WIN","LAST_PLAYER_STANDING","CUSTOM"],
 tennis:["POINT","ACE","DOUBLE_FAULT","SERVE","BREAK_POINT","CUSTOM"],
};
export const eventSchema=z.object({type:z.string(),team:z.enum(["BLACK","WHITE"]),playerId:z.string().uuid().optional(),assistId:z.string().uuid().optional(),period:z.coerce.number().int().min(1).max(10).optional(),clockSeconds:z.coerce.number().int().min(0).max(36000).optional()});
export type ScoreEvent={id?:string;type:string;team?:string|null;player_id?:string|null;assist_id?:string|null;period?:number|null;clock_seconds?:number|null;reverses_event_id?:string|null;metadata?:Record<string,unknown>};
export type ScoreState={black:number;white:number;label:string;period?:string;tennis?:{sets:[number,number][];games:[number,number];points:[string,string];tiebreak:boolean;winner?:string};winner?:string};
export type ScoringConfig={tennisBestOf?:3|5;tennisTiebreak?:boolean};
const pointNames=["0","15","30","40"];

export function validateEvent(sport:Sport,event:{type:string;team:string}) {
  if(!eventTypes[sport].includes(event.type)) throw new Error(`${event.type} is not a valid ${sport} event.`);
  if(!["BLACK","WHITE"].includes(event.team)) throw new Error("Choose Black or White.");
}

function tennisScore(events:ScoreEvent[],bestOf:3|5=3,useTiebreak=true):ScoreState {
  let points:[number,number]=[0,0], games:[number,number]=[0,0]; const sets:[number,number][]=[];
  const setWins:[number,number]=[0,0]; let tiebreak=false,winner:string|undefined;
  for(const e of events){
    if(winner||!["POINT","ACE","DOUBLE_FAULT"].includes(e.type)) continue;
    const side=e.type==="DOUBLE_FAULT"?(e.team==="BLACK"?1:0):(e.team==="BLACK"?0:1);
    const other=1-side;
    points[side]++;
    const gameWon=tiebreak ? points[side]>=7&&points[side]-points[other]>=2 : points[side]>=4&&points[side]-points[other]>=2;
    if(!gameWon) continue;
    games[side]++; points=[0,0];
    const setWon=games[side]>=6&&games[side]-games[other]>=2 || useTiebreak&&games[side]===7;
    if(setWon){sets.push([...games] as [number,number]);setWins[side]++;games=[0,0];tiebreak=false;if(setWins[side]>Math.floor(bestOf/2)) winner=side===0?"BLACK":"WHITE";}
    else tiebreak=useTiebreak&&games[0]===6&&games[1]===6;
  }
  const displayPoints:[string,string]=tiebreak?[String(points[0]),String(points[1])]:points[0]>=3&&points[1]>=3
    ?points[0]===points[1]?["40","40"]:points[0]>points[1]?["AD","40"]:["40","AD"]
    :[pointNames[Math.min(3,points[0])],pointNames[Math.min(3,points[1])]];
  return {black:setWins[0],white:setWins[1],label:"Sets",winner,tennis:{sets,games,points:displayPoints,tiebreak,winner}};
}
export function calculateScore(sport:Sport,events:ScoreEvent[],config:ScoringConfig={}):ScoreState {
  const reversed=new Set(events.filter(e=>e.type==="REVERSAL").map(e=>e.reverses_event_id));
  const active=events.filter(e=>e.type!=="REVERSAL"&&!reversed.has(e.id));
  if(sport==="tennis") return tennisScore(active,config.tennisBestOf===5?5:3,config.tennisTiebreak!==false);
  let black=0,white=0;
  for(const event of active){
    let side=event.team;
    if(event.type==="OWN_GOAL") side=side==="BLACK"?"WHITE":"BLACK";
    const points=sport==="football"?(["GOAL","OWN_GOAL","PENALTY_SCORED"].includes(event.type)?1:0):
      sport==="basketball"?({FREE_THROW:1,FIELD_GOAL_2:2,FIELD_GOAL_3:3} as Record<string,number>)[event.type]||0:
      event.type==="ROUND_WIN"?1:0;
    if(side==="BLACK") black+=points; else if(side==="WHITE") white+=points;
  }
  return {black,white,label:sport==="dodgeball"?"Rounds":sport==="basketball"?"Points":"Goals",winner:black===white?undefined:black>white?"BLACK":"WHITE"};
}
export function playerStats(sport:Sport,events:ScoreEvent[]){
  const reversed=new Set(events.filter(e=>e.type==="REVERSAL").map(e=>e.reverses_event_id));
  const stats:Record<string,Record<string,number>>={};
  for(const e of events){
    if(e.type==="REVERSAL"||reversed.has(e.id)) continue;
    if(e.player_id){stats[e.player_id]??={};stats[e.player_id][e.type]=(stats[e.player_id][e.type]||0)+1;
      if(sport==="basketball"){const points=({FREE_THROW:1,FIELD_GOAL_2:2,FIELD_GOAL_3:3} as Record<string,number>)[e.type]||0;stats[e.player_id].PTS=(stats[e.player_id].PTS||0)+points;}
    }
    if(e.assist_id&&sport==="football"){stats[e.assist_id]??={};stats[e.assist_id].ASSIST=(stats[e.assist_id].ASSIST||0)+1;}
  }
  return stats;
}
