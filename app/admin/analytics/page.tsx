import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { currentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { money } from "@/lib/data";
import { privateDemoEnabled } from "@/lib/demo";

type Metrics = { users: string; games: string; bookings: string; booking_value: string; payment_value: string; completed: string; cancelled: string };
type Day = { day: string; signups: string; bookings: string };
type Sport = { sport: string; games: string; bookings: string };

export default async function Analytics() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin");
  const [metrics, days, sports] = await Promise.all([
    one<Metrics>(`SELECT
      (SELECT count(*)::text FROM users) AS users,
      (SELECT count(*)::text FROM games) AS games,
      (SELECT count(*)::text FROM bookings WHERE status='CONFIRMED') AS bookings,
      (SELECT coalesce(sum(amount_fils),0)::text FROM bookings WHERE status='CONFIRMED' AND payment_status='PAID') AS booking_value,
      (SELECT coalesce(sum(amount_fils),0)::text FROM payments WHERE status='PAID') AS payment_value,
      (SELECT count(*)::text FROM games WHERE status='COMPLETED') AS completed,
      (SELECT count(*)::text FROM bookings WHERE status='CANCELLED') AS cancelled`),
    query<Day>(`SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
      (SELECT count(*)::text FROM users u WHERE (u.created_at AT TIME ZONE 'Asia/Amman')::date=d.day) AS signups,
      (SELECT count(*)::text FROM bookings b WHERE (b.created_at AT TIME ZONE 'Asia/Amman')::date=d.day) AS bookings
      FROM generate_series((now() AT TIME ZONE 'Asia/Amman')::date-6,(now() AT TIME ZONE 'Asia/Amman')::date,interval '1 day') AS d(day)
      ORDER BY d.day`),
    query<Sport>(`SELECT g.sport,count(DISTINCT g.id)::text AS games,count(b.id)::text AS bookings
      FROM games g LEFT JOIN bookings b ON b.game_id=g.id AND b.status='CONFIRMED'
      GROUP BY g.sport ORDER BY count(b.id) DESC,g.sport`)
  ]);
  const maxSignups = Math.max(1, ...days.map(d => Number(d.signups)));
  const maxBookings = Math.max(1, ...days.map(d => Number(d.bookings)));
  return <AdminShell><div className="admin-heading"><div><span className="eyebrow muted">Performance</span><h1>Analytics</h1><p>Current totals and activity over the last seven days · Amman time</p></div></div>
    {privateDemoEnabled() && <div className="admin-demo-note"><strong>Private demo</strong><span>Seeded bookings and their values are simulated. Processed payments counts only records in the payments table.</span></div>}
    <div className="admin-metrics admin-analytics-metrics"><div className="admin-metric"><span className="admin-metric-label">Members</span><strong>{metrics?.users || 0}</strong><small>Registered accounts</small></div><div className="admin-metric"><span className="admin-metric-label">Games</span><strong>{metrics?.games || 0}</strong><small>{metrics?.completed || 0} completed</small></div><div className="admin-metric"><span className="admin-metric-label">Confirmed bookings</span><strong>{metrics?.bookings || 0}</strong><small>{metrics?.cancelled || 0} cancelled</small></div><div className="admin-metric"><span className="admin-metric-label">Processed payments</span><strong>{money(Number(metrics?.payment_value || 0))}</strong><small>From payment records</small></div></div>
    <div className="admin-summary-strip"><span><strong>{money(Number(metrics?.booking_value || 0))}</strong> confirmed booking value{privateDemoEnabled() ? " (simulated)" : ""}</span></div>
    <div className="admin-panels"><section className="admin-panel"><div className="admin-panel-head"><div><span className="eyebrow muted">Growth</span><h2>New members</h2></div></div><div className="admin-chart">{days.map(d => <div className="admin-chart-row" key={d.day}><span>{new Date(`${d.day}T12:00:00Z`).toLocaleDateString("en-JO", { weekday: "short", timeZone: "UTC" })}</span><div className="admin-chart-track"><div style={{ width: `${Math.max(3, Number(d.signups) / maxSignups * 100)}%` }}/></div><strong>{d.signups}</strong></div>)}</div></section><section className="admin-panel"><div className="admin-panel-head"><div><span className="eyebrow muted">Demand</span><h2>New bookings</h2></div></div><div className="admin-chart">{days.map(d => <div className="admin-chart-row" key={d.day}><span>{new Date(`${d.day}T12:00:00Z`).toLocaleDateString("en-JO", { weekday: "short", timeZone: "UTC" })}</span><div className="admin-chart-track"><div style={{ width: `${Math.max(3, Number(d.bookings) / maxBookings * 100)}%` }}/></div><strong>{d.bookings}</strong></div>)}</div></section></div>
    <section className="admin-panel admin-detail-bookings"><div className="admin-panel-head"><div><span className="eyebrow muted">Sports</span><h2>Popularity by confirmed bookings</h2></div></div><div className="table-wrap"><table className="table"><thead><tr><th>Sport</th><th>Games</th><th>Confirmed bookings</th></tr></thead><tbody>{sports.map(s => <tr key={s.sport}><td style={{ textTransform: "capitalize" }}>{s.sport}</td><td>{s.games}</td><td>{s.bookings}</td></tr>)}</tbody></table></div></section>
  </AdminShell>;
}
