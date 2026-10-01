import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { currentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";

type Audit = { id: string; action: string; entity: string; entity_id: string; actor_name: string | null; created_at: string };
type Count = { n: string };
export default async function AdminActivity({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin");
  const { page: rawPage } = await searchParams;
  const total = await one<Count>("SELECT count(*)::text AS n FROM audit_logs");
  const pages = Math.max(1, Math.ceil(Number(total?.n || 0) / 50));
  const requested = Number(rawPage);
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, pages) : 1;
  const rows = await query<Audit>("SELECT a.id,a.action,a.entity,a.entity_id,a.created_at,u.name AS actor_name FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 50 OFFSET $1", [(page - 1) * 50]);
  return <AdminShell><div className="admin-heading"><div><span className="eyebrow muted">Accountability</span><h1>Staff activity</h1><p>Actions recorded by PlayUp staff and system processes.</p></div><span className="admin-count">{Number(total?.n || 0)} entries</span></div><div className="card table-wrap"><table className="table admin-table admin-mobile-cards"><thead><tr><th>When</th><th>Action</th><th>Actor</th><th>Entity</th><th>ID</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td data-label="When">{new Date(row.created_at).toLocaleString("en-JO", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Amman" })}</td><td data-label="Action" data-primary="true"><strong>{row.action.replaceAll("_", " ")}</strong></td><td data-label="Actor">{row.actor_name || "System"}</td><td data-label="Entity">{row.entity}</td><td data-label="ID" data-primary="true"><code>{row.entity_id}</code></td></tr>)}</tbody></table>{!rows.length && <p className="admin-empty">No staff actions recorded yet.</p>}</div>{pages > 1 && <nav className="pagination" aria-label="Activity pages">{page > 1 && <Link href={`/admin/activity?page=${page - 1}`}>Previous</Link>}<span>Page {page} of {pages}</span>{page < pages && <Link href={`/admin/activity?page=${page + 1}`}>Next</Link>}</nav>}</AdminShell>;
}
