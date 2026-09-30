import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { currentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { gameDate, money } from "@/lib/data";

type GameRow = { id: string; title: string; sport: string; starts_at: string; venue_name: string; booked_count: number; capacity: number; price_fils: number; status: string };
type Count = { n: string };
const sports = ["football", "basketball", "dodgeball", "tennis"];
const statuses = ["PUBLISHED", "FILLING", "FULL", "COMPLETED", "CANCELLED"];

export default async function AdminGames({ searchParams }: { searchParams: Promise<{ q?: string; sport?: string; status?: string; page?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ORGANIZER", "ADMIN", "SUPER_ADMIN", "SCOREKEEPER"].includes(user.role)) redirect("/games");
  const admin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const filters = await searchParams;
  const q = (filters.q || "").trim().slice(0, 80);
  const sport = sports.includes(filters.sport || "") ? filters.sport! : "";
  const status = statuses.includes(filters.status || "") ? filters.status! : "";
  const params: unknown[] = [];
  const conditions: string[] = [];
  if (!admin) { params.push(user.id); conditions.push(`(g.organizer_id=$${params.length} OR g.scorekeeper_id=$${params.length})`); }
  if (q) { params.push(`%${q}%`); conditions.push(`(g.title ILIKE $${params.length} OR v.name ILIKE $${params.length})`); }
  if (sport) { params.push(sport); conditions.push(`g.sport=$${params.length}`); }
  if (status) { params.push(status); conditions.push(`g.status=$${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const from = `FROM games g JOIN venues v ON v.id=g.venue_id ${where}`;
  const total = await one<Count>(`SELECT count(*)::text AS n ${from}`, params);
  const pages = Math.max(1, Math.ceil(Number(total?.n || 0) / 25));
  const requested = Number(filters.page);
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(pages, requested) : 1;
  const rows = await query<GameRow>(`SELECT g.id,g.title,g.sport,g.starts_at,g.booked_count,g.capacity,g.price_fils,g.status,v.name AS venue_name ${from} ORDER BY g.starts_at DESC LIMIT 25 OFFSET $${params.length + 1}`, [...params, (page - 1) * 25]);
  const href = (target: number) => `/admin/games?${new URLSearchParams({ ...(q ? { q } : {}), ...(sport ? { sport } : {}), ...(status ? { status } : {}), page: String(target) })}`;
  return <AdminShell><div className="admin-heading"><div><span className="eyebrow muted">Schedule</span><h1>Games</h1><p>Create, search, and manage matches.</p></div>{user.role !== "SCOREKEEPER" && <Link className="btn btn-primary" href="/admin/games/new">Create Game</Link>}</div>
    <form className="admin-filter" action="/admin/games" method="get"><input className="input" name="q" defaultValue={q} placeholder="Search games or venues" aria-label="Search games"/><select name="sport" defaultValue={sport} aria-label="Sport"><option value="">All sports</option>{sports.map(item => <option value={item} key={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select><select name="status" defaultValue={status} aria-label="Game status"><option value="">All statuses</option>{statuses.map(item => <option value={item} key={item}>{item}</option>)}</select><button className="btn btn-dark" type="submit">Apply filters</button>{(q || sport || status) && <Link className="btn btn-outline" href="/admin/games">Clear</Link>}</form>
    <p className="admin-result-count">{Number(total?.n || 0).toLocaleString("en-JO")} games</p>
    <div className="card table-wrap"><table className="table admin-table admin-mobile-cards"><thead><tr><th>Game</th><th>Sport</th><th>Date</th><th>Venue</th><th>Players</th><th>Price</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(g => <tr key={g.id}><td data-label="Game" data-primary="true"><strong>{g.title}</strong></td><td data-label="Sport" style={{ textTransform: "capitalize" }}>{g.sport}</td><td data-label="Date">{gameDate(g.starts_at)}</td><td data-label="Venue">{g.venue_name}</td><td data-label="Players">{g.booked_count}/{g.capacity}</td><td data-label="Price">{money(g.price_fils)}</td><td data-label="Status"><span className="badge">{g.status}</span></td><td data-label="Action"><Link className="inline-link" href={user.role === "SCOREKEEPER" ? `/admin/games/${g.id}/scorekeeper` : `/admin/games/${g.id}`}>Manage</Link></td></tr>)}</tbody></table>{!rows.length && <p className="admin-empty" style={{ padding: 20 }}>No games match these filters.</p>}</div>
    {pages > 1 && <nav className="pagination" aria-label="Game pages">{page > 1 && <Link href={href(page - 1)}>Previous</Link>}<span>Page {page} of {pages}</span>{page < pages && <Link href={href(page + 1)}>Next</Link>}</nav>}
  </AdminShell>;
}
