import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
type S={id:string;status:string;visibility:string;title:string;sport:string;game_id:string};
export default async function AdminStreams(){
 const user=await currentUser();if(!user)redirect("/login");if(!["ORGANIZER","ADMIN","SUPER_ADMIN","SCOREKEEPER"].includes(user.role))redirect("/games");const own=!(["ADMIN","SUPER_ADMIN"].includes(user.role));
 const rows=await query<S>(`SELECT s.*,g.title,g.sport FROM streams s JOIN games g ON g.id=s.game_id ${own?"WHERE g.organizer_id=$1 OR g.scorekeeper_id=$1":""} ORDER BY g.starts_at DESC`,own?[user.id]:[]);
 return <AdminShell><div className="admin-heading"><div><span className="eyebrow muted">Broadcasts</span><h1>Streams</h1><p>Review status and visibility for each game stream.</p></div></div><div className="card table-wrap"><table className="table admin-table admin-mobile-cards"><thead><tr><th>Game</th><th>Sport</th><th>Status</th><th>Visibility</th><th></th></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td data-label="Game" data-primary="true"><strong>{s.title}</strong></td><td data-label="Sport" style={{textTransform:"capitalize"}}>{s.sport}</td><td data-label="Status"><span className="badge">{s.status}</span></td><td data-label="Visibility">{s.visibility.replaceAll("_"," ")}</td><td data-label="Action"><Link className="inline-link" href={user.role==="SCOREKEEPER"?`/admin/games/${s.game_id}/scorekeeper`:`/admin/games/${s.game_id}`}>Manage</Link></td></tr>)}</tbody></table>{!rows.length&&<p className="admin-empty" style={{padding:20}}>No streams yet.</p>}</div></AdminShell>;
}
