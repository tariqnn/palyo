import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { currentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";

type Member = { id: string; name: string; username: string; email: string; role: string; city: string; created_at: string; bookings: string; games: string };
type Count = { n: string };
const roles = ["PLAYER", "ORGANIZER", "SCOREKEEPER", "ADMIN", "SUPER_ADMIN"];

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin");
  const filters = await searchParams;
  const q = (filters.q || "").trim().slice(0, 80);
  const role = roles.includes(filters.role || "") ? filters.role! : "";
  const requested = Number(filters.page);
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  const params: unknown[] = [];
  const conditions: string[] = [];
  if (q) { params.push(`%${q}%`); conditions.push(`(u.name ILIKE $${params.length} OR u.username ILIKE $${params.length} OR u.email ILIKE $${params.length})`); }
  if (role) { params.push(role); conditions.push(`u.role=$${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const total = await one<Count>(`SELECT count(*)::text AS n FROM users u ${where}`, params);
  const pages = Math.max(1, Math.ceil(Number(total?.n || 0) / 25));
  const currentPage = Math.min(page, pages);
  const members = await query<Member>(`SELECT u.id,u.name,u.username,u.email,u.role,u.city,u.created_at,
    (SELECT count(*)::text FROM bookings b WHERE b.user_id=u.id) AS bookings,
    (SELECT count(*)::text FROM games g WHERE g.organizer_id=u.id) AS games
    FROM users u ${where} ORDER BY u.created_at DESC,u.name ASC LIMIT 25 OFFSET $${params.length + 1}`, [...params, (currentPage - 1) * 25]);
  const href = (target: number) => `/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), ...(role ? { role } : {}), page: String(target) })}`;
  return <AdminShell><div className="admin-heading"><div><span className="eyebrow muted">People</span><h1>Members</h1><p>Search registered accounts and review each member&apos;s activity.</p></div><span className="admin-count">{Number(total?.n || 0).toLocaleString("en-JO")} members</span></div>
    <form className="admin-filter" action="/admin/users" method="get"><input className="input" name="q" defaultValue={q} placeholder="Search name, username, or email" aria-label="Search members"/><select name="role" defaultValue={role} aria-label="Filter by role"><option value="">All roles</option>{roles.map(item => <option value={item} key={item}>{item.replaceAll("_", " ")}</option>)}</select><button className="btn btn-dark" type="submit">Apply filters</button>{(q || role) && <Link className="btn btn-outline" href="/admin/users">Clear</Link>}</form>
    <div className="card table-wrap"><table className="table admin-table admin-mobile-cards"><thead><tr><th>Member</th><th>Role</th><th>City</th><th>Bookings</th><th>Organized</th><th>Joined</th><th></th></tr></thead><tbody>{members.map(member => <tr key={member.id}><td data-label="Member" data-primary="true"><strong>{member.name}</strong><small>@{member.username} · {member.email}</small></td><td data-label="Role"><span className="badge">{member.role.replaceAll("_", " ")}</span></td><td data-label="City">{member.city}</td><td data-label="Bookings">{member.bookings}</td><td data-label="Organized">{member.games}</td><td data-label="Joined">{new Date(member.created_at).toLocaleDateString("en-JO", { dateStyle: "medium", timeZone: "Asia/Amman" })}</td><td data-label="Details"><Link className="inline-link" href={`/admin/users/${member.id}`}>View member</Link></td></tr>)}</tbody></table>{!members.length && <p className="admin-empty">No members match these filters.</p>}</div>
    {pages > 1 && <nav className="pagination" aria-label="Member pages">{currentPage > 1 && <Link href={href(currentPage - 1)}>Previous</Link>}<span>Page {currentPage} of {pages}</span>{currentPage < pages && <Link href={href(currentPage + 1)}>Next</Link>}</nav>}
  </AdminShell>;
}
