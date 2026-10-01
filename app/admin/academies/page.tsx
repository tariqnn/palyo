import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ActiveToggle, ImageField } from "@/components/admin-fields";
import { currentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { saveAcademyAction } from "@/app/actions";

type Academy = { id: string; name: string; area: string; address: string; description: string; sports: string[]; image_url: string; verified: boolean; phone: string | null; email: string | null; website: string | null; training_packages: string[]; featured: boolean; latitude: string | null; longitude: string | null; active: boolean };

export default async function AdminAcademies({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string; edit?: string }> }) {
  const f = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin");
  const rows = await query<Academy>("SELECT * FROM academies ORDER BY created_at DESC, name");
  const edit = f.edit ? await one<Academy>("SELECT * FROM academies WHERE id=$1", [f.edit]) : null;
  return <AdminShell>
    <div className="admin-heading"><div><span className="eyebrow muted">Train and belong</span><h1>Academies</h1><p>Coaching academies and clubs shown on the public Academies page.</p></div><span className="admin-count">{rows.length} academies</span></div>
    {f.error && <div className="alert alert-error">{f.error}</div>}{f.notice && <div className="alert">{f.notice}</div>}
    <form className="admin-form card" style={{ padding: 24, marginBottom: 20 }} action={saveAcademyAction} key={edit?.id || "new"}>
      <h2 style={{ marginTop: 0 }}>{edit ? `Edit: ${edit.name}` : "Add an academy"}</h2>
      {edit && <input type="hidden" name="id" value={edit.id}/>}
      <div className="grid-2">
        <div className="form-field"><label>Name</label><input className="input" name="name" defaultValue={edit?.name} required/></div>
        <div className="form-field"><label>Area</label><input className="input" name="area" defaultValue={edit?.area} required placeholder="Abdoun"/></div>
        <div className="form-field"><label>Address</label><input className="input" name="address" defaultValue={edit?.address} required/></div>
        <div className="form-field"><label>Sports (comma separated)</label><input className="input" name="sports" defaultValue={edit?.sports?.join(", ")} placeholder="football, tennis"/></div>
        <div className="form-field"><label>Phone / WhatsApp</label><input className="input" name="phone" defaultValue={edit?.phone || ""}/></div>
        <div className="form-field"><label>Email</label><input className="input" type="email" name="email" defaultValue={edit?.email || ""}/></div>
        <div className="form-field"><label>Website</label><input className="input" name="website" defaultValue={edit?.website || ""} placeholder="https://"/></div>
        <ImageField defaultValue={edit?.image_url}/>
        <div className="form-field"><label>Latitude (optional)</label><input className="input" name="latitude" defaultValue={edit?.latitude || ""}/></div>
        <div className="form-field"><label>Longitude (optional)</label><input className="input" name="longitude" defaultValue={edit?.longitude || ""}/></div>
      </div>
      <div className="form-field"><label>Description</label><textarea className="input" name="description" rows={4} defaultValue={edit?.description}/></div>
      <div className="form-field"><label>Training packages (one per line)</label><textarea className="input" name="packages" rows={3} defaultValue={edit?.training_packages?.join("\n")}/></div>
      <label className="check-row"><input type="checkbox" name="verified" defaultChecked={edit?.verified}/><span>Verified academy</span></label>
      <label className="check-row"><input type="checkbox" name="featured" defaultChecked={edit?.featured}/><span>Featured on the Academies page</span></label>
      <div style={{ display: "flex", gap: 10 }}><button className="btn btn-primary" type="submit">{edit ? "Save changes" : "Add academy"}</button>{edit && <a className="btn btn-outline" href="/admin/academies">Cancel</a>}</div>
    </form>
    <div className="card table-wrap"><table className="table admin-table admin-mobile-cards"><thead><tr><th>Academy</th><th>Area</th><th>Sports</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(a => <tr key={a.id}><td data-label="Academy" data-primary="true"><strong>{a.name}</strong>{a.verified && <span className="badge badge-green" style={{ marginLeft: 8 }}>Verified</span>}</td><td data-label="Area">{a.area}</td><td data-label="Sports">{a.sports.join(", ")}</td><td data-label="Status"><span className={`badge ${a.active ? "badge-green" : "badge-orange"}`}>{a.active ? "Live" : "Hidden"}</span></td><td data-label="Actions"><div style={{ display: "flex", gap: 12 }}><a className="inline-link" href={`/admin/academies?edit=${a.id}`}>Edit</a><ActiveToggle table="academies" id={a.id} active={a.active}/></div></td></tr>)}</tbody></table>{!rows.length && <p className="admin-empty" style={{ padding: 20 }}>No academies yet. Add the first one above.</p>}</div>
  </AdminShell>;
}
