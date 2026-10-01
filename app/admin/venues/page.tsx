import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ActiveToggle, ImageField } from "@/components/admin-fields";
import { currentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { saveVenueAction } from "@/app/actions";

type Venue = { id: string; name: string; area: string; sports: string[]; rating: string; games: string; upcoming: string; booked_spots: string; active: boolean };
type VenueEdit = { id: string; name: string; area: string; address: string; sports: string[]; amenities: string[]; image_url: string; latitude: string | null; longitude: string | null; academy_id: string | null; hourly_rate_fils: number };

export default async function AdminVenues({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string; edit?: string }> }) {
  const f = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin");
  const rows = await query<Venue>(`SELECT v.id,v.name,v.area,v.sports,v.rating::text,v.active,
    count(g.id)::text AS games,
    count(g.id) FILTER (WHERE g.starts_at>now() AND g.status IN ('PUBLISHED','FILLING','FULL'))::text AS upcoming,
    coalesce(sum(g.booked_count),0)::text AS booked_spots
    FROM venues v LEFT JOIN games g ON g.venue_id=v.id GROUP BY v.id,v.name,v.area,v.sports,v.rating,v.active ORDER BY v.name`);
  const edit = f.edit ? await one<VenueEdit>("SELECT id,name,area,address,sports,amenities,image_url,latitude::text,longitude::text,academy_id,hourly_rate_fils FROM venues WHERE id=$1", [f.edit]) : null;
  const academies = await query<{ id: string; name: string }>("SELECT id,name FROM academies ORDER BY name");
  return <AdminShell>
    <div className="admin-heading"><div><span className="eyebrow muted">Places</span><h1>Venues</h1><p>Add the real pitches and courts where games and court bookings happen.</p></div><span className="admin-count">{rows.length} venues</span></div>
    {f.error && <div className="alert alert-error">{f.error}</div>}{f.notice && <div className="alert">{f.notice}</div>}
    <form className="admin-form card" style={{ padding: 24, marginBottom: 20 }} action={saveVenueAction} key={edit?.id || "new"}>
      <h2 style={{ marginTop: 0 }}>{edit ? `Edit: ${edit.name}` : "Add a venue"}</h2>
      {edit && <input type="hidden" name="id" value={edit.id}/>}
      <div className="grid-2">
        <div className="form-field"><label>Name</label><input className="input" name="name" defaultValue={edit?.name} required/></div>
        <div className="form-field"><label>Area</label><input className="input" name="area" defaultValue={edit?.area} required placeholder="Abdoun"/></div>
        <div className="form-field"><label>Address</label><input className="input" name="address" defaultValue={edit?.address} required/></div>
        <div className="form-field"><label>Sports (comma separated)</label><input className="input" name="sports" defaultValue={edit?.sports?.join(", ")} required placeholder="football, basketball"/></div>
        <div className="form-field"><label>Court hire per hour (JD)</label><input className="input" type="number" min="0" step="0.5" name="hourlyRate" defaultValue={edit ? edit.hourly_rate_fils / 1000 : 0} required/></div>
        <div className="form-field"><label>Academy (optional)</label><select name="academyId" defaultValue={edit?.academy_id || ""}><option value="">None</option>{academies.map(a => <option value={a.id} key={a.id}>{a.name}</option>)}</select></div>
        <div className="form-field"><label>Amenities (comma separated)</label><input className="input" name="amenities" defaultValue={edit?.amenities?.join(", ")} placeholder="Parking, Showers, Floodlights"/></div>
        <ImageField defaultValue={edit?.image_url}/>
        <div className="form-field"><label>Latitude (optional)</label><input className="input" name="latitude" defaultValue={edit?.latitude || ""}/></div>
        <div className="form-field"><label>Longitude (optional)</label><input className="input" name="longitude" defaultValue={edit?.longitude || ""}/></div>
      </div>
      <div style={{ display: "flex", gap: 10 }}><button className="btn btn-primary" type="submit">{edit ? "Save changes" : "Add venue"}</button>{edit && <a className="btn btn-outline" href="/admin/venues">Cancel</a>}</div>
    </form>
    <div className="card table-wrap"><table className="table admin-table admin-mobile-cards"><thead><tr><th>Venue</th><th>Area</th><th>Sports</th><th>Games</th><th>Upcoming</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(v => <tr key={v.id}><td data-label="Venue" data-primary="true"><strong>{v.name}</strong></td><td data-label="Area">{v.area}</td><td data-label="Sports">{v.sports.join(", ")}</td><td data-label="Games">{v.games}</td><td data-label="Upcoming">{v.upcoming}</td><td data-label="Status"><span className={`badge ${v.active ? "badge-green" : "badge-orange"}`}>{v.active ? "Live" : "Hidden"}</span></td><td data-label="Actions"><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><Link className="inline-link" href={`/admin/venues?edit=${v.id}`}>Edit</Link><Link className="inline-link" href={`/venues/${v.id}`}>View</Link><ActiveToggle table="venues" id={v.id} active={v.active}/></div></td></tr>)}</tbody></table>{!rows.length && <p className="admin-empty" style={{ padding: 20 }}>No venues yet. Add the first one above.</p>}</div>
  </AdminShell>;
}
