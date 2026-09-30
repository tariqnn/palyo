import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getProfile,gameDate } from "@/lib/data";
import { query } from "@/lib/db";
import { sports,sportLabels,type Sport } from "@/lib/brand";
import { currentUser } from "@/lib/auth";
import { playerStats,type ScoreEvent } from "@/lib/scoring";
import { divisionFor } from "@/lib/ratings";

type SportProfile={sport:Sport;rating:number;games:number;wins:number};
type History={game_id:string;title:string;sport:Sport;starts_at:string;venue_name:string;status:string;winner:string|null;team:string|null;rating_change:number|null;recording_id:string|null};
type Achievement={code:string;earned_at:string};
export default async function ProfilePage({params,searchParams}:{params:Promise<{username:string}>;searchParams:Promise<{tab?:string}>}){
 const {username}=await params;const {tab="overview"}=await searchParams;
 const [profile,user]=await Promise.all([getProfile(username),currentUser()]);if(!profile)notFound();
 const [ratings,history,achievements,events]=await Promise.all([
  query<SportProfile>("SELECT sport,rating,games,wins FROM sport_profiles WHERE user_id=$1 ORDER BY sport",[profile.id]),
  query<History>("SELECT b.game_id,g.title,g.sport,g.starts_at,v.name AS venue_name,b.status,g.winner,t.name AS team,rh.change AS rating_change,(SELECT r.id FROM recordings r WHERE r.game_id=g.id AND r.status='READY' LIMIT 1) AS recording_id FROM bookings b JOIN games g ON g.id=b.game_id JOIN venues v ON v.id=g.venue_id LEFT JOIN LATERAL (SELECT t.name FROM team_players tp JOIN teams t ON t.id=tp.team_id WHERE tp.user_id=b.user_id AND t.game_id=b.game_id LIMIT 1) t ON TRUE LEFT JOIN rating_history rh ON rh.game_id=g.id AND rh.user_id=b.user_id WHERE b.user_id=$1 ORDER BY g.starts_at DESC LIMIT 40",[profile.id]),
  query<Achievement>("SELECT code,earned_at FROM achievements WHERE user_id=$1 ORDER BY earned_at DESC",[profile.id]),
  query<ScoreEvent&{sport:Sport}>("SELECT e.*,g.sport FROM game_events e JOIN games g ON g.id=e.game_id WHERE e.player_id=$1 OR e.assist_id=$1 ORDER BY e.created_at",[profile.id])
 ]);
 const totalGames=ratings.reduce((s,r)=>s+r.games,0),totalWins=ratings.reduce((s,r)=>s+r.wins,0);
 const stats=Object.fromEntries(sports.map(s=>[s,playerStats(s,events.filter(e=>e.sport===s))[profile.id]||{}])) as Record<Sport,Record<string,number>>;
 const columns:Record<Sport,string[]>={football:["GOAL","ASSIST","SAVE","YELLOW_CARD"],basketball:["PTS","ASSIST","REBOUND","STEAL","BLOCK"],dodgeball:["ELIMINATION","CATCH","ROUND_WIN"],tennis:["ACE","DOUBLE_FAULT","BREAK_POINT"]};
 return <main className="page"><div className="container">
  <div className="profile-cover"/><div className="profile-head">{profile.avatar_url?<Image src={profile.avatar_url} alt={profile.name} width={82} height={82}/>:<div className="header-avatar">{profile.name[0]}</div>}<div><h1>{profile.name}</h1><p>Level {Math.floor(profile.xp/1000)+1} · {profile.xp.toLocaleString()} XP</p><p><MapPin size={12} style={{display:"inline"}}/> {profile.city}, Jordan</p></div>{user?.id===profile.id&&<Link href="/onboarding/sports" className="btn btn-outline btn-small">Edit Sports</Link>}</div>
  <div className="tabs">{["overview","stats","games","videos","achievements"].map(t=><Link className={t===tab?"active":""} href={`?tab=${t}`} key={t}>{t[0].toUpperCase()+t.slice(1)}</Link>)}</div>
  {tab==="overview"&&<><div className="stat-grid"><div className="stat-box"><strong>{totalGames}</strong><span>Games Played</span></div><div className="stat-box"><strong>{totalWins}</strong><span>Wins</span></div><div className="stat-box"><strong>{achievements.filter(a=>a.code==="MVP").length}</strong><span>MVPs</span></div><div className="stat-box"><strong>{totalGames?Math.round(totalWins/totalGames*100):0}%</strong><span>Win Rate</span></div></div><h2 style={{marginTop:28}}>Sport Ratings</h2><div className="grid-4">{sports.map(s=>{const r=ratings.find(p=>p.sport===s);return <div className="card" style={{padding:17}} key={s}><strong>{sportLabels[s]}</strong><p style={{fontSize:23,fontWeight:800,margin:"5px 0"}}>{r?.rating||1000}</p><small className="muted">{divisionFor(r?.rating||1000)} · {r?.games||0} games · {r?.wins||0} wins</small></div>})}</div><h2 style={{marginTop:30}}>Recent Games</h2>{history.slice(0,4).map(g=><Link className="card" style={{display:"block",padding:13,marginBottom:8}} href={`/games/${g.game_id}`} key={g.game_id}><strong>{g.title}</strong><span className="muted" style={{float:"right"}}>{gameDate(g.starts_at)}</span><p className="muted" style={{margin:"3px 0"}}>{g.venue_name} · {g.status}</p></Link>)}</>}
  {tab==="stats"&&<div className="grid-2">{sports.map(s=><div className="card" style={{padding:18}} key={s}><h2 style={{marginTop:0}}>{sportLabels[s]}</h2><p>Rating: <strong>{ratings.find(r=>r.sport===s)?.rating||1000}</strong></p>{columns[s].map(c=><div key={c} style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid #eee",padding:"8px 0"}}><span>{c.replaceAll("_"," ")}</span><strong>{stats[s][c]||0}</strong></div>)}</div>)}</div>}
  {tab==="games"&&(history.length?<div className="card table-wrap"><table className="table"><thead><tr><th>Game</th><th>Date</th><th>Venue</th><th>Result</th><th>Rating</th><th>Video</th></tr></thead><tbody>{history.map(g=><tr key={g.game_id}><td><Link href={`/games/${g.game_id}`}>{g.title}</Link></td><td>{gameDate(g.starts_at)}</td><td>{g.venue_name}</td><td>{g.winner?(g.team===g.winner?"Win":"Loss"):g.status}</td><td>{g.rating_change==null?"—":g.rating_change>0?`+${g.rating_change}`:g.rating_change}</td><td>{g.recording_id?<Link className="inline-link" href={`/watch/${g.recording_id}`}>Watch</Link>:"—"}</td></tr>)}</tbody></table></div>:<div className="empty">No games yet.</div>)}
  {tab==="videos"&&(history.some(g=>g.recording_id)?<div className="grid-3">{history.filter(g=>g.recording_id).map(g=><Link className="card" style={{padding:16}} href={`/watch/${g.recording_id}`} key={g.game_id}><strong>{g.title}</strong><p className="muted">{gameDate(g.starts_at)} · {g.venue_name}</p><span className="inline-link">Watch game →</span></Link>)}</div>:<div className="empty">Recordings from played games appear here.</div>)}
  {tab==="achievements"&&(achievements.length?<div className="grid-3">{achievements.map(a=><div className="card" style={{padding:18}} key={a.code}><strong>{a.code.replaceAll("_"," ")}</strong><p className="muted">Earned {gameDate(a.earned_at)}</p></div>)}</div>:<div className="empty">Achievements appear as you play.</div>)}
 </div></main>;
}
