import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { currentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { gameDate, money } from "@/lib/data";

type Member = { id: string; name: string; username: string; email: string; phone: string | null; role: string; city: string; xp: number; created_at: string };
type Booking = { id: string; reference: string; status: string; payment_status: string; amount_fils: number; title: string; starts_at: string; game_id: string };
type Sport = { sport: string; rating: number; games: number; wins: number };
type Count = { n: string };

export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const actor = await currentUser();
  if (!actor) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN"].includes(actor.role)) redirect("/admin");
  const { id } = await params;
  const member = await one<Member>("SELECT id,name,username,email,phone,role,city,xp,created_at FROM users WHERE id=$1", [id]);
  if (!member) notFound();
  const [bookings, sports, organized, sessions] = await Promise.all([
    query<Booking>("SELECT b.id,b.reference,b.status,b.payment_status,b.amount_fils,g.id AS game_id,g.title,g.starts_at FROM bookings b JOIN games g ON g.id=b.game_id WHERE b.user_id=$1 ORDER BY b.created_at DESC LIMIT 20", [id]),
    query<Sport>("SELECT sport,rating,games,wins FROM sport_profiles WHERE user_id=$1 ORDER BY sport", [id]),
    one<Count>("SELECT count(*)::text AS n FROM games WHERE organizer_id=$1", [id]),
    one<Count>("SELECT count(*)::text AS n FROM sessions WHERE user_id=$1 AND expires_at>now()", [id])
  ]);
  return <AdminShell><Link className="admin-back" href="/admin/users">← All members</Link><div className="admin-heading"><div><span className="eyebrow muted">Member profile</span><h1>{member.name}</h1><p>@{member.username} · {member.role.replaceAll("_", " ")}</p></div><Link className="btn btn-outline btn-small" href={`/profile/${member.username}`}>Public profile</Link></div>
    <div className="admin-detail-grid"><div className="admin-panel"><h2>Account</h2><dl className="admin-facts"><div><dt>Email</dt><dd>{member.email}</dd></div><div><dt>Phone</dt><dd>{member.phone || "Not provided"}</dd></div><div><dt>City</dt><dd>{member.city}</dd></div><div><dt>Joined</dt><dd>{new Date(member.created_at).toLocaleString("en-JO", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Amman" })}</dd></div><div><dt>Active sessions</dt><dd>{sessions?.n || 0}</dd></div></dl></div><div className="admin-panel"><h2>Participation</h2><div className="admin-mini-stats"><div><strong>{bookings.length}{bookings.length === 20 ? "+" : ""}</strong><span>Recent bookings</span></div><div><strong>{organized?.n || 0}</strong><span>Games organized</span></div><div><strong>{member.xp}</strong><span>XP earned</span></div></div><h3>Sport ratings</h3>{sports.length ? sports.map(s => <p className="admin-sport-row" key={s.sport}><span>{s.sport}</span><strong>{s.rating}</strong><small>{s.games} games · {s.wins} wins</small></p>) : <p className="muted">No sport profile yet.</p>}</div></div>
    <section className="admin-panel admin-detail-bookings"><div className="admin-panel-head"><div><span className="eyebrow muted">Activity</span><h2>Recent bookings</h2></div></div>{bookings.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Reference</th><th>Game</th><th>Date</th><th>Amount</th><th>Booking</th><th>Payment</th></tr></thead><tbody>{bookings.map(b => <tr key={b.id}><td>{b.reference}</td><td><Link className="inline-link" href={`/admin/games/${b.game_id}`}>{b.title}</Link></td><td>{gameDate(b.starts_at)}</td><td>{money(b.amount_fils)}</td><td>{b.status}</td><td>{b.payment_status}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No bookings yet.</p>}</section>
  </AdminShell>;
}
