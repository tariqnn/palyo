import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { gameDate } from "@/lib/data";

type Tournament = { id: string; name: string; sport: string; status: string; starts_at: string; ends_at: string; entries: string; games: string };
export default async function AdminTournaments() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin");
  const rows = await query<Tournament>(`SELECT t.id,t.name,t.sport,t.status,t.starts_at,t.ends_at,
    count(DISTINCT e.user_id)::text AS entries,count(DISTINCT g.id)::text AS games
    FROM tournaments t LEFT JOIN tournament_entries e ON e.tournament_id=t.id
    LEFT JOIN games g ON g.tournament_id=t.id
    GROUP BY t.id,t.name,t.sport,t.status,t.starts_at,t.ends_at ORDER BY t.starts_at DESC`);
  return <AdminShell><div className="admin-heading"><div><span className="eyebrow muted">Competition</span><h1>Tournaments</h1><p>Review seasons, registration, and linked games.</p></div><span className="admin-count">{rows.length} tournaments</span></div><div className="card table-wrap"><table className="table admin-table admin-mobile-cards"><thead><tr><th>Tournament</th><th>Sport</th><th>Dates</th><th>Status</th><th>Entries</th><th>Games</th><th></th></tr></thead><tbody>{rows.map(t => <tr key={t.id}><td data-label="Tournament" data-primary="true"><strong>{t.name}</strong></td><td data-label="Sport" style={{textTransform:"capitalize"}}>{t.sport}</td><td data-label="Dates">{gameDate(t.starts_at)} – {gameDate(t.ends_at)}</td><td data-label="Status"><span className="badge">{t.status}</span></td><td data-label="Entries">{t.entries}</td><td data-label="Games">{t.games}</td><td data-label="Details"><Link className="inline-link" href={`/tournaments/${t.id}`}>View tournament</Link></td></tr>)}</tbody></table>{!rows.length && <p className="admin-empty" style={{padding:20}}>No tournaments yet.</p>}</div></AdminShell>;
}
