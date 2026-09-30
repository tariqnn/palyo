import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { gameDate } from "@/lib/data";
type R={id:string;title:string;sport:string;starts_at:string;venue_name:string;status:string};
export default async function MyVideos(){const user=await currentUser();if(!user)redirect("/login");const rows=await query<R>("SELECT r.id,r.status,g.title,g.sport,g.starts_at,v.name AS venue_name FROM recordings r JOIN games g ON g.id=r.game_id JOIN venues v ON v.id=g.venue_id JOIN bookings b ON b.game_id=g.id WHERE b.user_id=$1 AND b.status IN ('CONFIRMED','COMPLETED') ORDER BY g.starts_at DESC",[user.id]);return <main className="page"><div className="container"><div className="page-head"><h1>My Game Videos</h1><p>Recordings from games you played.</p></div>{rows.length?<div className="grid-3">{rows.map(r=><Link className="card" href={`/watch/${r.id}`} key={r.id} style={{padding:18}}><span className="badge">{r.sport}</span><h3>{r.title}</h3><p className="muted">{gameDate(r.starts_at)} · {r.venue_name}</p><span className="inline-link">{r.status==="READY"?"Watch Game":"Recording Processing"} →</span></Link>)}</div>:<div className="empty"><h3>No game videos yet</h3><p>Recordings from games you join will appear here.</p></div>}</div></main>}
