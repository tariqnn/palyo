import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ConfirmButton } from "@/components/confirm-button";
import { currentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { money, gameDate } from "@/lib/data";
import { adminCancelBookingAction } from "@/app/actions";

type Row = { id: string; reference: string; title: string; game_id: string; user_id: string; user_name: string; starts_at: string; status: string; payment_status: string; amount_fils: number };
type Count = { n: string };
const statuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
const payments = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string; q?: string; status?: string; payment?: string; page?: string }> }) {
  const filters = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ORGANIZER", "ADMIN", "SUPER_ADMIN", "SCOREKEEPER"].includes(user.role)) redirect("/games");
  const admin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
  const q = (filters.q || "").trim().slice(0, 80);
  const status = statuses.includes(filters.status || "") ? filters.status! : "";
  const payment = payments.includes(filters.payment || "") ? filters.payment! : "";
  const params: unknown[] = [];
  const conditions: string[] = [];
  if (!admin) { params.push(user.id); conditions.push(`(g.organizer_id=$${params.length} OR g.scorekeeper_id=$${params.length})`); }
  if (q) { params.push(`%${q}%`); conditions.push(`(b.reference ILIKE $${params.length} OR g.title ILIKE $${params.length} OR u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`); }
  if (status) { params.push(status); conditions.push(`b.status=$${params.length}`); }
  if (payment) { params.push(payment); conditions.push(`b.payment_status=$${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const from = `FROM bookings b JOIN games g ON g.id=b.game_id JOIN users u ON u.id=b.user_id ${where}`;
  const total = await one<Count>(`SELECT count(*)::text AS n ${from}`, params);
  const pages = Math.max(1, Math.ceil(Number(total?.n || 0) / 25));
  const requested = Number(filters.page);
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(pages, requested) : 1;
  const rows = await query<Row>(`SELECT b.id,b.reference,b.game_id,b.user_id,b.status,b.payment_status,b.amount_fils,g.title,g.starts_at,u.name AS user_name ${from} ORDER BY b.created_at DESC LIMIT 25 OFFSET $${params.length + 1}`, [...params, (page - 1) * 25]);
  const href = (target: number) => `/admin/bookings?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...(payment ? { payment } : {}), page: String(target) })}`;
  return <AdminShell><div className="admin-heading"><div><span className="eyebrow muted">Transactions</span><h1>Bookings</h1><p>Review players, booking status, and payment records.</p></div><span className="admin-count">{Number(total?.n || 0).toLocaleString("en-JO")} bookings</span></div>
    {filters.error && <div className="alert alert-error">{filters.error}</div>}{filters.notice && <div className="alert">{filters.notice}</div>}
    <form className="admin-filter" action="/admin/bookings" method="get"><input className="input" name="q" defaultValue={q} placeholder="Reference, game, player, or email" aria-label="Search bookings"/><select name="status" defaultValue={status} aria-label="Booking status"><option value="">All bookings</option>{statuses.map(item => <option value={item} key={item}>{item}</option>)}</select><select name="payment" defaultValue={payment} aria-label="Payment status"><option value="">All payments</option>{payments.map(item => <option value={item} key={item}>{item}</option>)}</select><button className="btn btn-dark" type="submit">Apply filters</button>{(q || status || payment) && <Link className="btn btn-outline" href="/admin/bookings">Clear</Link>}</form>
    <div className="card table-wrap"><table className="table admin-table admin-mobile-cards"><thead><tr><th>Reference</th><th>Game</th><th>Player</th><th>Date</th><th>Amount</th><th>Booking</th><th>Payment</th><th></th></tr></thead><tbody>{rows.map(b => <tr key={b.id}><td data-label="Reference">{b.reference}</td><td data-label="Game" data-primary="true"><Link className="inline-link" href={`/admin/games/${b.game_id}`}>{b.title}</Link></td><td data-label="Player" data-primary="true">{admin ? <Link className="inline-link" href={`/admin/users/${b.user_id}`}>{b.user_name}</Link> : b.user_name}</td><td data-label="Date">{gameDate(b.starts_at)}</td><td data-label="Amount">{money(b.amount_fils)}</td><td data-label="Booking"><span className="badge">{b.status}</span></td><td data-label="Payment"><span className={`badge ${b.payment_status === "PAID" ? "badge-green" : "badge-orange"}`}>{b.payment_status}</span></td><td data-label="Action">{user.role !== "SCOREKEEPER" && b.status === "CONFIRMED" && new Date(b.starts_at) > new Date() && <form action={adminCancelBookingAction}><input type="hidden" name="bookingId" value={b.id}/><ConfirmButton className="text-button" message="Remove this player and refund the booking?">Refund</ConfirmButton></form>}</td></tr>)}</tbody></table>{!rows.length && <p className="admin-empty" style={{ padding: 20 }}>No bookings match these filters.</p>}</div>
    {pages > 1 && <nav className="pagination" aria-label="Booking pages">{page > 1 && <Link href={href(page - 1)}>Previous</Link>}<span>Page {page} of {pages}</span>{page < pages && <Link href={href(page + 1)}>Next</Link>}</nav>}
  </AdminShell>;
}
