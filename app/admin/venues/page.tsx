import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";

type Venue = { id: string; name: string; area: string; sports: string[]; rating: string; games: string; upcoming: string; booked_spots: string };
export default async function AdminVenues() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin");
  const rows = await query<Venue>(`SELECT v.id,v.name,v.area,v.sports,v.rating::text,
    count(g.id)::text AS games,
    count(g.id) FILTER (WHERE g.starts_at>now() AND g.status IN ('PUBLISHED','FILLING','FULL'))::text AS upcoming,
    coalesce(sum(g.booked_count),0)::text AS booked_spots
    FROM venues v LEFT JOIN games g ON g.venue_id=v.id GROUP BY v.id,v.name,v.area,v.sports,v.rating ORDER BY v.name`);
  return <AdminShell><div className="admin-heading"><div><span className="eyebrow muted">Places</span><h1>Venues</h1><p>Review the locations used by games and their activity.</p></div><span className="admin-count">{rows.length} venues</span></div><div className="card table-wrap"><table className="table admin-table admin-mobile-cards"><thead><tr><th>Venue</th><th>Area</th><th>Sports</th><th>Rating</th><th>Games</th><th>Upcoming</th><th>Booked spots</th><th></th></tr></thead><tbody>{rows.map(v => <tr key={v.id}><td data-label="Venue" data-primary="true"><strong>{v.name}</strong></td><td data-label="Area">{v.area}</td><td data-label="Sports">{v.sports.join(", ")}</td><td data-label="Rating">{v.rating}</td><td data-label="Games">{v.games}</td><td data-label="Upcoming">{v.upcoming}</td><td data-label="Booked spots">{v.booked_spots}</td><td data-label="Details"><Link className="inline-link" href={`/venues/${v.id}`}>View venue</Link></td></tr>)}</tbody></table>{!rows.length && <p className="admin-empty" style={{padding:20}}>No venues yet.</p>}</div></AdminShell>;
}
