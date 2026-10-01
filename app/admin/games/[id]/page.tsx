import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ConfirmButton } from "@/components/confirm-button";
import { getGame,gameDate,money } from "@/lib/data";
import { gamePlayers } from "@/lib/competition";
import { currentUser } from "@/lib/auth";
import { one,query } from "@/lib/db";
import { teamsAction,createStreamAction,endStreamAction,selectMvpAction,cancelGameAction } from "@/app/actions";
type Stream={id:string;status:string;visibility:string;secret_key:string;provider_id:string};

export default async function ManageGame({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{notice?:string;error?:string}>}){
 const {id}=await params;const f=await searchParams;
 const [game,user]=await Promise.all([getGame(id),currentUser()]);if(!game)notFound();
 const allowed=user&&(user.id===game.organizer_id||["ADMIN","SUPER_ADMIN"].includes(user.role));
 if(!allowed)return <AdminShell><div className="alert alert-error">You cannot manage this game.</div></AdminShell>;
 const [players,waitlist,stream]=await Promise.all([
  gamePlayers(id),
  query<{position:number;name:string}>("SELECT w.position,u.name FROM waitlist w JOIN users u ON u.id=w.user_id WHERE w.game_id=$1 AND w.status='WAITING' ORDER BY w.position",[id]),
  one<Stream>("SELECT * FROM streams WHERE game_id=$1",[id])
 ]);
 return <AdminShell><div className="breadcrumb"><Link href="/admin/games">Games</Link> / {game.title}</div>
  <div className="page-head"><h1>{game.title}</h1><p>{gameDate(game.starts_at)} · {game.venue_name} · {game.status}</p></div>
  {f.notice&&<div className="alert">{f.notice}</div>}{f.error&&<div className="alert alert-error">{f.error}</div>}
  <div className="stat-grid"><div className="stat-box"><strong>{players.length}/{game.capacity}</strong><span>Players</span></div><div className="stat-box"><strong>{waitlist.length}</strong><span>Waitlist</span></div><div className="stat-box"><strong>{money(game.price_fils)}</strong><span>Price</span></div><div className="stat-box"><strong>{game.status}</strong><span>Status</span></div></div>
  <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"22px 0"}}><form action={teamsAction}><input type="hidden" name="gameId" value={id}/><button className="btn btn-outline">{game.sport==="tennis"?"Assign sides":"Generate balanced teams"}</button></form><Link className="btn btn-dark" href={`/admin/games/${id}/scorekeeper`}>Open Scorekeeper</Link><Link className="btn btn-outline" href={`/games/${id}`}>View public page</Link></div>
  <div className="grid-2"><div className="card" style={{padding:18}}><h2 style={{fontSize:17,marginTop:0}}>Players</h2>{players.map(p=><p key={p.id} style={{borderBottom:"1px solid #eee",paddingBottom:7}}>{p.name}<span className="muted" style={{float:"right"}}>{p.team||"Unassigned"}</span></p>)}</div><div className="card" style={{padding:18}}><h2 style={{fontSize:17,marginTop:0}}>Waitlist</h2>{waitlist.length?waitlist.map(p=><p key={p.position}>#{p.position} {p.name}</p>):<p className="muted">No players waiting.</p>}</div></div>
  <div className="card" style={{padding:20,marginTop:18}}><h2 style={{fontSize:18,marginTop:0}}>Most valuable player</h2><p className="muted" style={{fontSize:12}}>Select a booked player before finalizing. MVP earns 50 XP.</p>{game.mvp_id?<p>Selected: <strong>{players.find(p=>p.id===game.mvp_id)?.name||"Player"}</strong></p>:null}{!game.status.includes("COMPLETED")&&<form action={selectMvpAction} style={{display:"flex",gap:8,alignItems:"center",maxWidth:470}}><input type="hidden" name="gameId" value={id}/><select name="playerId" required defaultValue=""><option value="" disabled>Choose a player</option>{players.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select><button className="btn btn-outline">Select MVP</button></form>}</div>
  <div className="card" style={{padding:20,marginTop:18}}><h2 style={{fontSize:18,marginTop:0}}>Live stream</h2>{stream?<><p>Status: <strong>{stream.status}</strong> · Visibility: {stream.visibility}</p><p className="muted" style={{fontSize:12}}>Development stream preview only. Connect a video provider for real RTMP ingest and playback.</p><p>RTMP server: <code>rtmp://localhost/preview-only</code></p><p>Stream key: <code>{stream.secret_key}</code></p><Link className="inline-link" href={`/watch/live/${stream.id}`}>Viewer page →</Link>{stream.status!=="ENDED"&&<form action={endStreamAction} style={{marginTop:15}}><input type="hidden" name="gameId" value={id}/><ConfirmButton message="End this stream?">End Stream</ConfirmButton></form>}</>:<form action={createStreamAction}><input type="hidden" name="gameId" value={id}/><div className="form-field" style={{maxWidth:220}}><label>Visibility</label><select name="visibility"><option>PUBLIC</option><option>PARTICIPANTS_ONLY</option><option>UNLISTED</option><option>PRIVATE</option></select></div><button className="btn btn-primary">Create Stream</button></form>}</div>
  {!(["CANCELLED","COMPLETED"].includes(game.status))&&<div className="card" style={{padding:20,marginTop:18}}><h2 style={{fontSize:18,marginTop:0}}>Cancel game</h2><p className="muted">All confirmed players will be notified. Nothing is owed because payment is cash at the venue.</p><form action={cancelGameAction}><input type="hidden" name="gameId" value={id}/><ConfirmButton className="btn btn-outline" message="Cancel this game and notify every confirmed player?">Cancel Game</ConfirmButton></form></div>}
 </AdminShell>;
}
