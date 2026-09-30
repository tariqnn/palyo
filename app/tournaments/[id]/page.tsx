import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { one,query } from "@/lib/db";
import { joinTournamentAction } from "@/app/actions";
import { gameDate,gameTime } from "@/lib/data";
type T={id:string;name:string;sport:string;description:string;starts_at:string;image_url:string;season:string;status:string};
type Match={id:string;title:string;starts_at:string;status:string;winner:string|null;venue_name:string;score:{black:number;white:number}|null};
type Entry={name:string;username:string;team_name:string|null};
export default async function TournamentDetail({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{tab?:string;notice?:string;error?:string}>}){
 const {id}=await params;const {tab="overview",notice,error}=await searchParams;
 const t=await one<T>("SELECT * FROM tournaments WHERE id=$1",[id]);if(!t)notFound();
 const [entries,matches]=await Promise.all([
  query<Entry>("SELECT u.name,u.username,e.team_name FROM tournament_entries e JOIN users u ON u.id=e.user_id WHERE e.tournament_id=$1 ORDER BY e.created_at",[id]),
  query<Match>("SELECT g.id,g.title,g.starts_at,g.status,g.winner,v.name AS venue_name,r.score FROM games g JOIN venues v ON v.id=g.venue_id LEFT JOIN results r ON r.game_id=g.id WHERE g.tournament_id=$1 ORDER BY g.starts_at",[id])
 ]);
 const standings=["BLACK","WHITE"].map(team=>{
  const completed=matches.filter(m=>m.status==="COMPLETED"&&m.score);
  const wins=completed.filter(m=>m.winner===team).length,draws=completed.filter(m=>!m.winner).length;
  return {team,played:completed.length,wins,draws,losses:completed.length-wins-draws,points:wins*(t.sport==="football"?3:2)+draws*(t.sport==="football"?1:0)};
 }).sort((a,b)=>b.points-a.points);
 return <main className="page"><div className="container"><div className="detail-cover"><Image src={t.image_url} alt={t.name} fill sizes="100vw"/></div>
  <div className="page-head" style={{marginTop:20}}><span className="badge badge-green">{t.sport}</span><h1>{t.name}</h1><p>{t.season}</p></div>
  {notice&&<div className="alert">{notice}</div>}
  {error&&<div className="alert alert-error">{error}</div>}
  <div className="tabs">{["overview","standings","fixtures","players","stats","videos","rules"].map(x=><Link className={tab===x?"active":""} href={`?tab=${x}`} key={x}>{x[0].toUpperCase()+x.slice(1)}</Link>)}</div>
  {tab==="overview"&&<><p>{t.description}</p><p className="muted">{matches.length} games · {entries.length} registered players</p>{t.status==="OPEN"&&new Date(t.starts_at)>new Date()&&<form className="card" style={{padding:18,maxWidth:450}} action={joinTournamentAction}><input type="hidden" name="id" value={id}/><div className="form-field"><label>Team name (optional)</label><input className="input" name="teamName" maxLength={60} placeholder="Join as an individual or enter your team"/></div><button className="btn btn-primary">Join Tournament</button></form>}</>}
  {tab==="standings"&&<div className="card table-wrap"><table className="table"><thead><tr><th>Side</th><th>Played</th><th>Wins</th><th>Draws</th><th>Losses</th><th>Points</th></tr></thead><tbody>{standings.map(s=><tr key={s.team}><td>{s.team}</td><td>{s.played}</td><td>{s.wins}</td><td>{s.draws}</td><td>{s.losses}</td><td><strong>{s.points}</strong></td></tr>)}</tbody></table></div>}
  {tab==="fixtures"&&(matches.length?<div className="card table-wrap"><table className="table"><thead><tr><th>Game</th><th>Date</th><th>Venue</th><th>Score</th><th>Status</th></tr></thead><tbody>{matches.map(m=><tr key={m.id}><td><Link className="inline-link" href={`/games/${m.id}`}>{m.title}</Link></td><td>{gameDate(m.starts_at)} · {gameTime(m.starts_at)}</td><td>{m.venue_name}</td><td>{m.score?`${m.score.black}–${m.score.white}`:"—"}</td><td>{m.status}</td></tr>)}</tbody></table></div>:<div className="empty">Fixtures will appear when games are scheduled.</div>)}
  {tab==="players"&&<div className="card table-wrap"><table className="table"><thead><tr><th>Player</th><th>Team</th></tr></thead><tbody>{entries.map(p=><tr key={p.username}><td><Link href={`/profile/${p.username}`}>{p.name}</Link></td><td>{p.team_name||"Individual"}</td></tr>)}</tbody></table></div>}
  {tab==="stats"&&<div className="empty"><h3>Match statistics</h3><p>Open a fixture to see its sport-specific player stats.</p></div>}
  {tab==="videos"&&<div className="empty"><h3>Videos</h3><p>Recordings from tournament games appear as they become ready.</p></div>}
  {tab==="rules"&&<div className="card" style={{padding:20}}><h3>Competition rules</h3><p>{t.sport==="football"?"Three points for a win and one for a draw.":"Two points for a win."} Results use each game&apos;s sport-specific score sheet.</p></div>}
 </div></main>;
}
