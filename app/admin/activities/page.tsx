import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ActiveToggle, ImageField } from "@/components/admin-fields";
import { currentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { money } from "@/lib/data";
import { saveActivityAction } from "@/app/actions";

type Activity = { id: string; title: string; category: string; area: string; description: string; image_url: string; price_fils: number; duration_minutes: number; difficulty: string; capacity: number; operator_name: string; operator_phone: string | null; badge: string; includes: string[]; price_unit: string; active: boolean };
const categories = ["Scuba diving", "Snorkeling", "Parasailing", "Kayaking", "Skydiving", "Canyoning", "Hiking", "Rock climbing", "Desert safari & sandboarding", "Camping", "Cycling", "Other"];

export default async function AdminActivities({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string; edit?: string }> }) {
  const f = await searchParams;
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin");
  const rows = await query<Activity>("SELECT * FROM activities ORDER BY created_at DESC, title");
  const edit = f.edit ? await one<Activity>("SELECT * FROM activities WHERE id=$1", [f.edit]) : null;
  return <AdminShell>
    <div className="admin-heading"><div><span className="eyebrow muted">Adventures</span><h1>Activities</h1><p>Scuba diving, parasailing, canyoning and other outdoor experiences shown on the public Activities page.</p></div><span className="admin-count">{rows.length} activities</span></div>
    {f.error && <div className="alert alert-error">{f.error}</div>}{f.notice && <div className="alert">{f.notice}</div>}
    <form className="admin-form card" style={{ padding: 24, marginBottom: 20 }} action={saveActivityAction} key={edit?.id || "new"}>
      <h2 style={{ marginTop: 0 }}>{edit ? `Edit: ${edit.title}` : "Add an activity"}</h2>
      {edit && <input type="hidden" name="id" value={edit.id}/>}
      <div className="grid-2">
        <div className="form-field"><label>Title</label><input className="input" name="title" defaultValue={edit?.title} required placeholder="Aqaba coral reef scuba diving"/></div>
        <div className="form-field"><label>Type</label><input className="input" name="category" list="activity-categories" defaultValue={edit?.category} required placeholder="Scuba diving"/><datalist id="activity-categories">{categories.map(c => <option value={c} key={c}/>)}</datalist></div>
        <div className="form-field"><label>Location</label><input className="input" name="area" defaultValue={edit?.area} required placeholder="South Beach, Aqaba"/></div>
        <div className="form-field"><label>Operator / provider name</label><input className="input" name="operatorName" defaultValue={edit?.operator_name} required/></div>
        <div className="form-field"><label>Operator phone / WhatsApp</label><input className="input" name="operatorPhone" defaultValue={edit?.operator_phone || ""} placeholder="+962 7X XXX XXXX"/></div>
        <div className="form-field"><label>Price (JD)</label><input className="input" type="number" min="0" step="0.5" name="price" defaultValue={edit ? edit.price_fils / 1000 : ""} required/></div>
        <div className="form-field"><label>Price is per</label><select name="priceUnit" defaultValue={edit?.price_unit || "person"}><option value="person">person</option><option value="group">group</option><option value="hour">hour</option><option value="jump">jump</option><option value="dive">dive</option></select></div>
        <div className="form-field"><label>Duration (minutes)</label><input className="input" type="number" min="15" step="15" name="duration" defaultValue={edit?.duration_minutes || 120} required/></div>
        <div className="form-field"><label>Difficulty</label><select name="difficulty" defaultValue={edit?.difficulty || "All levels"}><option>All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
        <div className="form-field"><label>Maximum people per slot</label><input className="input" type="number" min="1" name="capacity" defaultValue={edit?.capacity || 10} required/></div>
        <div className="form-field"><label>Badge (optional)</label><input className="input" name="badge" defaultValue={edit?.badge} placeholder="Beginner friendly"/></div>
        <ImageField defaultValue={edit?.image_url}/>
      </div>
      <div className="form-field"><label>Description</label><textarea className="input" name="description" rows={4} defaultValue={edit?.description} required/></div>
      <div className="form-field"><label>What&apos;s included (one per line)</label><textarea className="input" name="includes" rows={4} defaultValue={edit?.includes?.join("\n")}/></div>
      <div style={{ display: "flex", gap: 10 }}><button className="btn btn-primary" type="submit">{edit ? "Save changes" : "Add activity"}</button>{edit && <a className="btn btn-outline" href="/admin/activities">Cancel</a>}</div>
    </form>
    <div className="card table-wrap"><table className="table admin-table admin-mobile-cards"><thead><tr><th>Activity</th><th>Type</th><th>Location</th><th>Price</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(a => <tr key={a.id}><td data-label="Activity" data-primary="true"><strong>{a.title}</strong><br/><small className="muted">{a.operator_name}</small></td><td data-label="Type">{a.category}</td><td data-label="Location">{a.area}</td><td data-label="Price">{money(a.price_fils)} / {a.price_unit}</td><td data-label="Status"><span className={`badge ${a.active ? "badge-green" : "badge-orange"}`}>{a.active ? "Live" : "Hidden"}</span></td><td data-label="Actions"><div style={{ display: "flex", gap: 12 }}><a className="inline-link" href={`/admin/activities?edit=${a.id}`}>Edit</a><ActiveToggle table="activities" id={a.id} active={a.active}/></div></td></tr>)}</tbody></table>{!rows.length && <p className="admin-empty" style={{ padding: 20 }}>No activities yet. Add the first one above.</p>}</div>
  </AdminShell>;
}
