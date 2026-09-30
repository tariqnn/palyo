import Link from "next/link";
import Image from "next/image";
import { sports,sportLabels,type Sport } from "@/lib/brand";
import { query } from "@/lib/db";
type Leader={name:string;username:string;avatar_url:string|null;rating:number;games:number;wins:number};
type StatLeader={name:string;username:string;value:number};
const categories:Record<Sport,{label:string;types:string[];weighted?:boolean}[]>={
 football:[{label:"Top Scorers",types:["GOAL","PENALTY_SCORED"]},{label:"Top Assists",types:["ASSIST"]},{label:"Top Saves",types:["SAVE"]}],
 basketball:[{label:"Points",types:["FREE_THROW","FIELD_GOAL_2","FIELD_GOAL_3"],weighted:true},{label:"Assists",types:["ASSIST"]},{label:"Rebounds",types:["REBOUND"]},{label:"Steals",types:["STEAL"]}],
 dodgeball:[{label:"Eliminations",types:["ELIMINATION"]},{label:"Catches",types:["CATCH"]},{label:"Round Wins",types:["ROUND_WIN"]}],
 tennis:[{label:"Aces",types:["ACE"]},{label:"Break Points",types:["BREAK_POINT"]}],
};
export default async function Leaderboards({searchParams}:{searchParams:Promise<{sport?:string;period?:string}>}){
 const {sport,period="all"}=await searchParams;const key=sports.includes(sport as Sport)?sport as Sport:"football";
 const dateClause=period==="month"?"AND g.starts_at>=date_trunc('month',now())":period==="season"?"AND g.starts_at>=now()-interval '90 days'":"";
 const leaders=await query<Leader>("SELECT u.name,u.username,u.avatar_url,p.rating,p.games,p.wins FROM sport_profiles p JOIN users u ON u.id=p.user_id WHERE p.sport=$1 ORDER BY p.rating DESC LIMIT 50",[key]);
 const stats=await Promise.all(categories[key].map(async category=>{
  const placeholders=category.types.map((_,i)=>`$${i+2}`).join(",");
  const value=category.weighted?"SUM(CASE e.type WHEN 'FREE_THROW' THEN 1 WHEN 'FIELD_GOAL_2' THEN 2 WHEN 'FIELD_GOAL_3' THEN 3 ELSE 0 END)":"count(*)";
  const rows=await query<StatLeader>(`SELECT u.name,u.username,${value}::int AS value FROM game_events e JOIN games g ON g.id=e.game_id JOIN users u ON u.id=e.player_id WHERE g.sport=$1 AND e.type IN (${placeholders}) ${dateClause} AND NOT EXISTS(SELECT 1 FROM game_events r WHERE r.reverses_event_id=e.id) GROUP BY u.id,u.name,u.username ORDER BY value DESC,u.name LIMIT 5`,[key,...category.types]);
  return {...category,rows};
 }));
 return <main className="page"><div className="container"><div className="page-head"><h1>Leaderboards</h1><p>Top players across all sports.</p></div>
  <div className="tabs">{sports.map(s=><Link className={key===s?"active":""} href={`/leaderboards?sport=${s}&period=${period}`} key={s}>{sportLabels[s]}</Link>)}</div>
  <div className="filter-bar"><span className="muted" style={{fontSize:12}}>Stats period:</span>{[["all","All Time"],["season","This Season"],["month","This Month"]].map(([v,label])=><Link className={`btn btn-small ${period===v?"btn-dark":"btn-outline"}`} href={`/leaderboards?sport=${key}&period=${v}`} key={v}>{label}</Link>)}</div>
  <div className="card table-wrap"><table className="table"><thead><tr><th>Rank</th><th>Player</th><th>Rating</th><th>Games</th><th>Wins</th><th>Win %</th></tr></thead><tbody>{leaders.map((p,i)=><tr key={p.username} className={p.username==="tariq"?"rank-highlight":""}><td>{i+1}</td><td><Link className="avatar-row" href={`/profile/${p.username}`}>{p.avatar_url&&<Image src={p.avatar_url} alt="" width={27} height={27}/>}<strong>{p.name}</strong></Link></td><td>{p.rating}</td><td>{p.games}</td><td>{p.wins}</td><td>{p.games?Math.round(p.wins/p.games*100):0}%</td></tr>)}</tbody></table></div>
  <div className="section-head" style={{marginTop:36}}><h2>{sportLabels[key]} stats</h2></div><div className="grid-3">{stats.map(group=><div className="card" style={{padding:17}} key={group.label}><h3 style={{marginTop:0}}>{group.label}</h3>{group.rows.length?group.rows.map((p,i)=><div key={p.username} style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid #eee",padding:"8px 0"}}><Link href={`/profile/${p.username}`}>{i+1}. {p.name}</Link><strong>{p.value}</strong></div>):<p className="muted">No recorded stats yet.</p>}</div>)}</div>
 </div></main>;
}
