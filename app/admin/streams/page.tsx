import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
type S={id:string;status:string;visibility:string;title:string;sport:string;game_id:string};
export default async function AdminStreams(){
 const user=await currentUser();if(!user)redirect("/login");if(!["ORGANIZER","ADMIN","SUPER_ADMIN","SCOREKEEPER"].includes(user.role))redirect("/games");const own=!(["ADMIN","SUPER_ADMIN"].includes(user.role));
 const rows=await query<S>(`SELECT s.*,g.title,g.sport FROM streams s JOIN games g ON g.id=s.game_id ${own?"WHERE g.organizer_id=$1 OR g.scorekeeper_id=$1":""} ORDER BY g.starts_at DESC`,own?[user.id]:[]);
 return <AdminShell><div className="page-head"><h1>Live Streams</h1><p>Streams stay connected to their games.</p></div><div className="card table-wrap"><table className="table"><thead><tr><th>Game</th><th>Sport</th><th>Status</th><th>Visibility</th><th></th></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td>{s.title}</td><td>{s.sport}</td><td>{s.status}</td><td>{s.visibility}</td><td><Link className="inline-link" href={`/admin/games/${s.game_id}`}>Manage</Link></td></tr>)}</tbody></table></div></AdminShell>;
}
