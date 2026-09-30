"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ScoreState, ScoreEvent } from "@/lib/scoring";
import type { GameClock } from "@/lib/clock";

type EventRow=ScoreEvent&{sequence:number;created_at:string;player_name:string|null};

export function LiveScore({id,initialScore,initialEvents,initialClock}:{id:string;initialScore:ScoreState;initialEvents:EventRow[];initialClock:GameClock}){
  const [score,setScore]=useState(initialScore);
  const [events,setEvents]=useState(initialEvents);
  const [clock,setClock]=useState(initialClock);
  const [now,setNow]=useState(0);
  useEffect(()=>{
    const es=new EventSource(`/api/games/${id}/score/stream`);
    es.onmessage=e=>{try{const data=JSON.parse(e.data);setScore(data.score);setEvents(data.events);setClock(data.clock);}catch{}};
    const ticker=setInterval(()=>setNow(Date.now()),1000);
    return ()=>{es.close();clearInterval(ticker);};
  },[id]);
  const elapsed=clock.elapsedSeconds+(clock.running&&now?Math.max(0,Math.floor((now-new Date(clock.asOf).getTime())/1000)):0);
  return <>
    <div className="scoreboard"><div><div className="score-team">BLACK</div><div className="score-number">{score.black}</div></div><div className="score-mid">{score.label}<br/>VS</div><div><div className="score-team">WHITE</div><div className="score-number">{score.white}</div></div></div>
    <div className="card" style={{padding:14,marginTop:14,textAlign:"center"}}><strong>Period {clock.period} · {Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,"0")}</strong> <span className={clock.running?"badge badge-green":"badge"}>{clock.running?"Running":"Paused"}</span></div>
    {score.tennis&&<div className="card" style={{padding:18,marginTop:16}}><strong>Sets</strong><p>{score.tennis.sets.map((s,i)=>`Set ${i+1}: ${s[0]}–${s[1]}`).join(" · ")||"First set"}</p><p>Games {score.tennis.games[0]}–{score.tennis.games[1]} · Current points {score.tennis.points[0]}–{score.tennis.points[1]}{score.tennis.tiebreak?" (tiebreak)":""}</p></div>}
    <p style={{marginTop:16}}><Link className="inline-link" href={`/games/${id}/mvp`}>Vote for MVP →</Link></p>
    <h2 style={{marginTop:28}}>Match timeline</h2><ul className="timeline">{events.filter(e=>e.type!=="REVERSAL").slice().reverse().map(e=><li key={e.id}><time>{e.clock_seconds!=null?`${Math.floor(e.clock_seconds/60)}:${String(e.clock_seconds%60).padStart(2,"0")}`:"—"}</time><strong>{e.type.replaceAll("_"," ")}</strong> · {e.player_name||e.team}</li>)}</ul>
  </>;
}
