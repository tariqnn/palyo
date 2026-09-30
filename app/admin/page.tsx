import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { query,one } from "@/lib/db";
import { currentUser } from "@/lib/auth";
export default async function Admin(){
 const user=await currentUser();if(!user)redirect("/login");if(!["ORGANIZER","ADMIN","SUPER_ADMIN","SCOREKEEPER"].includes(user.role))redirect("/games");
 const own=!(["ADMIN","SUPER_ADMIN"].includes(user.role));const params=own?[user.id]:[];
 const scope=own?"WHERE organizer_id=$1 OR scorekeeper_id=$1":"";
 const bookingScope=own?"JOIN games g ON g.id=b.game_id WHERE (g.organizer_id=$1 OR g.scorekeeper_id=$1) AND":"WHERE";
 const [games,bookings,players,streams]=await Promise.all([
  one<{n:string}>(`SELECT count(*)::text AS n FROM games ${scope}`,params),
  one<{n:string}>(`SELECT count(*)::text AS n FROM bookings b ${bookingScope} b.status='CONFIRMED'`,params),
  one<{n:string}>(own?"SELECT count(DISTINCT b.user_id)::text AS n FROM bookings b JOIN games g ON g.id=b.game_id WHERE g.organizer_id=$1 OR g.scorekeeper_id=$1":"SELECT count(*)::text AS n FROM users",params),
  one<{n:string}>(`SELECT count(*)::text AS n FROM streams s JOIN games g ON g.id=s.game_id WHERE s.status='LIVE' ${own?"AND (g.organizer_id=$1 OR g.scorekeeper_id=$1)":""}`,params)
 ]);
 const recent=await query<{id:string;title:string;status:string;starts_at:string}>(`SELECT id,title,status,starts_at FROM games ${scope} ORDER BY starts_at DESC LIMIT 6`,params);
 return <AdminShell><div className="page-head"><h1>Overview</h1><p>Manage games and keep PLAYO moving.</p></div><div className="stat-grid"><div className="stat-box"><strong>{games?.n||0}</strong><span>Games</span></div><div className="stat-box"><strong>{streams?.n||0}</strong><span>Live Now</span></div><div className="stat-box"><strong>{bookings?.n||0}</strong><span>Bookings</span></div><div className="stat-box"><strong>{players?.n||0}</strong><span>Players</span></div></div><div className="section-head" style={{marginTop:30}}><h2>Recent games</h2>{user.role!=="SCOREKEEPER"&&<Link className="btn btn-primary btn-small" href="/admin/games/new">Create Game</Link>}</div><div className="card table-wrap"><table className="table"><thead><tr><th>Game</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>{recent.map(g=><tr key={g.id}><td>{g.title}</td><td>{new Date(g.starts_at).toLocaleDateString("en-JO")}</td><td>{g.status}</td><td><Link className="inline-link" href={user.role==="SCOREKEEPER"?`/admin/games/${g.id}/scorekeeper`:`/admin/games/${g.id}`}>Manage</Link></td></tr>)}</tbody></table></div></AdminShell>;
}
