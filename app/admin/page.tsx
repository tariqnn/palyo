import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowUpRight, CalendarDays, CreditCard, Radio, RefreshCw, Users } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { currentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { gameDate, gameTime, money } from "@/lib/data";
import { demoEnabled, publicDemoEnabled } from "@/lib/demo";

type GameStats = { total: string; upcoming: string; today: string; completed: string };
type BookingStats = { confirmed: string; pending: string; cancelled: string; value_fils: string };
type Count = { n: string };
type GameRow = { id: string; title: string; starts_at: string; booked_count: number; capacity: number; venue_name: string };
type BookingRow = { id: string; title: string; player_name: string; status: string; created_at: string };
type ActivityRow = { id: string; action: string; entity: string; actor_name: string | null; created_at: string };
const fmt = (value?: string) => Number(value || 0).toLocaleString("en-JO");
const timestamp = (value: string) => new Date(value).toLocaleString("en-JO", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Amman" });

export default async function Admin() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ORGANIZER", "ADMIN", "SUPER_ADMIN", "SCOREKEEPER"].includes(user.role)) redirect("/games");
  const admin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
  const params = admin ? [] : [user.id];
  const scope = admin ? "" : "WHERE (g.organizer_id=$1 OR g.scorekeeper_id=$1)";
  const scopedAnd = scope ? `${scope} AND` : "WHERE";
  const [games, bookings, people, streams, upcoming, recentBookings, activity, messages] = await Promise.all([
    one<GameStats>(`SELECT count(*)::text AS total,
      count(*) FILTER (WHERE g.starts_at>now() AND g.status IN ('PUBLISHED','FILLING','FULL'))::text AS upcoming,
      count(*) FILTER (WHERE (g.starts_at AT TIME ZONE 'Asia/Amman')::date=(now() AT TIME ZONE 'Asia/Amman')::date AND g.status IN ('PUBLISHED','FILLING','FULL'))::text AS today,
      count(*) FILTER (WHERE g.status='COMPLETED')::text AS completed FROM games g ${scope}`, params),
    one<BookingStats>(`SELECT count(*) FILTER (WHERE b.status='CONFIRMED')::text AS confirmed,
      count(*) FILTER (WHERE b.status='PENDING' OR (b.status='CONFIRMED' AND b.payment_status='PENDING'))::text AS pending,
      count(*) FILTER (WHERE b.status='CANCELLED')::text AS cancelled,
      coalesce(sum(b.amount_fils) FILTER (WHERE b.status='CONFIRMED' AND b.payment_status='PAID'),0)::text AS value_fils
      FROM bookings b JOIN games g ON g.id=b.game_id ${scope}`, params),
    one<Count>(admin ? "SELECT count(*)::text AS n FROM users" : "SELECT count(DISTINCT b.user_id)::text AS n FROM bookings b JOIN games g ON g.id=b.game_id WHERE g.organizer_id=$1 OR g.scorekeeper_id=$1", params),
    one<Count>(`SELECT count(*)::text AS n FROM streams s JOIN games g ON g.id=s.game_id ${scopedAnd} s.status='LIVE'`, params),
    query<GameRow>(`SELECT g.id,g.title,g.starts_at,g.booked_count,g.capacity,v.name AS venue_name FROM games g JOIN venues v ON v.id=g.venue_id ${scopedAnd} g.starts_at>now() AND g.status IN ('PUBLISHED','FILLING','FULL') ORDER BY g.starts_at ASC LIMIT 5`, params),
    query<BookingRow>(`SELECT b.id,b.status,b.created_at,g.title,u.name AS player_name FROM bookings b JOIN games g ON g.id=b.game_id JOIN users u ON u.id=b.user_id ${scope} ORDER BY b.created_at DESC LIMIT 5`, params),
    admin ? query<ActivityRow>("SELECT a.id,a.action,a.entity,a.created_at,u.name AS actor_name FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 5") : Promise.resolve([]),
    admin ? one<Count>("SELECT count(*)::text AS n FROM contact_messages") : Promise.resolve(null)
  ]);
  const metrics = [
    { label: admin ? "Members" : "Players", value: fmt(people?.n), detail: admin ? "Registered accounts" : "In your games", icon: Users, href: admin ? "/admin/users" : "/admin/bookings" },
    { label: "Upcoming games", value: fmt(games?.upcoming), detail: `${fmt(games?.today)} today · ${fmt(games?.completed)} completed`, icon: CalendarDays, href: "/admin/games" },
    { label: "Confirmed bookings", value: fmt(bookings?.confirmed), detail: `${fmt(bookings?.pending)} need payment review`, icon: CreditCard, href: "/admin/bookings" },
    { label: "Live streams", value: fmt(streams?.n), detail: "Active right now", icon: Radio, href: "/admin/streams" }
  ];
  return <AdminShell>
    <div className="admin-heading"><div><span className="eyebrow muted">Operations center</span><h1>{admin ? "PLAYO overview" : "Your games overview"}</h1><p>Current database records · Times shown in Amman</p></div><Link className="btn btn-outline btn-small" href="/admin"><RefreshCw size={14}/> Refresh</Link></div>
    {demoEnabled() && <div className="admin-demo-note"><strong>{publicDemoEnabled() ? "Public demo" : "Private demo"}</strong><span>Bookings and payment values are simulated. No real money has been collected.</span></div>}
    <div className="admin-metrics">{metrics.map(({ label, value, detail, icon: Icon, href }) => <Link className="admin-metric" href={href} key={label}><span className="admin-metric-icon"><Icon size={19}/></span><span className="admin-metric-label">{label}</span><strong>{value}</strong><small>{detail}</small><ArrowUpRight className="admin-metric-arrow" size={16}/></Link>)}</div>
    <div className="admin-summary-strip"><span><strong>{fmt(games?.total)}</strong> total games</span><span><strong>{fmt(bookings?.cancelled)}</strong> cancelled bookings</span><span><strong>{money(Number(bookings?.value_fils || 0))}</strong> confirmed booking value{demoEnabled() ? " (simulated)" : ""}</span>{admin && <Link href="/admin/messages"><strong>{fmt(messages?.n)}</strong> contact messages <ArrowUpRight size={13}/></Link>}</div>
    <div className="admin-panels"><section className="admin-panel"><div className="admin-panel-head"><div><span className="eyebrow muted">Schedule</span><h2>Next games</h2></div><Link href="/admin/games">All games <ArrowUpRight size={14}/></Link></div>{upcoming.length ? <div className="admin-list">{upcoming.map(game => <Link href={user.role === "SCOREKEEPER" ? `/admin/games/${game.id}/scorekeeper` : `/admin/games/${game.id}`} className="admin-list-row" key={game.id}><span className="admin-list-icon"><CalendarDays size={18}/></span><span className="admin-list-main"><strong>{game.title}</strong><small>{gameDate(game.starts_at)} · {gameTime(game.starts_at)} · {game.venue_name}</small></span><span className="admin-list-side">{game.booked_count}/{game.capacity} players</span></Link>)}</div> : <p className="admin-empty">No upcoming games. <Link href="/admin/games/new">Create one</Link>.</p>}</section>
      <section className="admin-panel"><div className="admin-panel-head"><div><span className="eyebrow muted">Transactions</span><h2>Recent bookings</h2></div><Link href="/admin/bookings">All bookings <ArrowUpRight size={14}/></Link></div>{recentBookings.length ? <div className="admin-list">{recentBookings.map(booking => <Link href="/admin/bookings" className="admin-list-row" key={booking.id}><span className="admin-list-icon"><CreditCard size={18}/></span><span className="admin-list-main"><strong>{booking.player_name}</strong><small>{booking.title} · {timestamp(booking.created_at)}</small></span><span className={`admin-status ${booking.status === "CONFIRMED" ? "is-good" : ""}`}>{booking.status.toLowerCase()}</span></Link>)}</div> : <p className="admin-empty">No bookings yet.</p>}</section></div>
    {admin && <div className="admin-panels admin-panels-bottom"><section className="admin-panel"><div className="admin-panel-head"><div><span className="eyebrow muted">Accountability</span><h2>Staff activity</h2></div><Link href="/admin/activity">Audit log <ArrowUpRight size={14}/></Link></div>{activity.length ? <div className="admin-list">{activity.map(item => <div className="admin-list-row" key={item.id}><span className="admin-list-icon"><Activity size={18}/></span><span className="admin-list-main"><strong>{item.action.replaceAll("_", " ")}</strong><small>{item.actor_name || "System"} · {item.entity} · {timestamp(item.created_at)}</small></span></div>)}</div> : <p className="admin-empty">No staff actions recorded yet.</p>}</section><section className="admin-panel admin-shortcuts"><div className="admin-panel-head"><div><span className="eyebrow muted">Navigate</span><h2>Manage PLAYO</h2></div></div><div className="admin-shortcut-grid"><Link href="/admin/users">Members <ArrowUpRight size={16}/></Link><Link href="/admin/analytics">Analytics <ArrowUpRight size={16}/></Link><Link href="/admin/messages">Messages <ArrowUpRight size={16}/></Link><Link href="/admin/streams">Streams <ArrowUpRight size={16}/></Link></div></section></div>}
  </AdminShell>;
}
