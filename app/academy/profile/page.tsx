import { AcademyShell } from "@/components/academy-shell";
import { academyProfileAction } from "@/app/actions";
import { requireAcademyAccess } from "@/lib/academy";
import { one, query } from "@/lib/db";

type Academy = { name: string; description: string; phone: string | null; email: string | null; address: string; image_url: string; sports: string[] };
type Package = { title: string; description: string; price: string; duration: string; image_url: string };
type Event = { title: string; description: string; location: string; image_url: string; starts_at: Date | string };

export default async function AcademyProfile({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const access = await requireAcademyAccess();
  const f = await searchParams;
  const [academy, packages, events] = await Promise.all([
    one<Academy>("SELECT name,description,phone,email,address,image_url,sports FROM academies WHERE id=$1", [access.academyId]),
    query<Package>("SELECT title,description,price,duration,image_url FROM academy_packages WHERE academy_id=$1 ORDER BY sort_order", [access.academyId]).catch(() => []),
    query<Event>("SELECT title,description,location,image_url,starts_at FROM academy_events WHERE academy_id=$1 ORDER BY starts_at", [access.academyId]).catch(() => []),
  ]);
  const packageText = packages.map(p => [p.title,p.description,p.price,p.duration,p.image_url].join(" | ")).join("\n");
  const eventText = events.map(e => [e.title,new Date(e.starts_at).toISOString(),e.location,e.description,e.image_url].join(" | ")).join("\n");
  return <AcademyShell name={academy?.name || "Academy"}>
    {f.notice && <div className="alert">{f.notice}</div>}{f.error && <div className="alert alert-error">{f.error}</div>}
    <div className="admin-heading"><div><span className="eyebrow muted">Public information</span><h1>Academy page</h1><p>Manage your academy profile, programs, photos, and upcoming events.</p></div></div>
    <form className="admin-panel admin-form" action={academyProfileAction}>
      <div className="grid-2">
        <div className="form-field"><label htmlFor="name">Academy name</label><input className="input" id="name" name="name" defaultValue={academy?.name} required maxLength={100}/></div>
        <div className="form-field"><label htmlFor="imageUrl">Cover photo URL</label><input className="input" id="imageUrl" name="imageUrl" defaultValue={academy?.image_url||""} placeholder="/images/your-photo.jpg or images.unsplash.com URL"/></div>
      </div>
      <div className="form-field"><label htmlFor="description">Description</label><textarea id="description" name="description" minLength={20} maxLength={2000} defaultValue={academy?.description} required/></div>
      <div className="grid-2"><div className="form-field"><label htmlFor="address">Location / address</label><input className="input" id="address" name="address" defaultValue={academy?.address||""} maxLength={200}/></div><div className="form-field"><label htmlFor="sports">Sports (comma separated)</label><input className="input" id="sports" name="sports" defaultValue={academy?.sports?.join(", ")||""} placeholder="football, basketball"/></div></div>
      <div className="grid-2"><div className="form-field"><label htmlFor="phone">Phone</label><input className="input" id="phone" name="phone" defaultValue={academy?.phone||""} maxLength={30}/></div><div className="form-field"><label htmlFor="email">Email</label><input className="input" id="email" type="email" name="email" defaultValue={academy?.email||""} required/></div></div>
      <div className="form-field"><label htmlFor="packages">Training packages</label><textarea id="packages" name="packages" rows={6} defaultValue={packageText} placeholder="One package per line: title | description | price | duration | photo URL"/><small>Each package becomes a photo card. Use a PlayUp image path or an images.unsplash.com URL.</small></div>
      <div className="form-field"><label htmlFor="events">Academy events</label><textarea id="events" name="events" rows={6} defaultValue={eventText} placeholder="One event per line: title | 2026-11-15T09:00:00Z | location | description | photo URL"/><small>Use ISO date/time. Saving replaces this academy’s event list; remove a line to unpublish it.</small></div>
      <button className="btn btn-primary">Save academy page</button>
    </form>
  </AcademyShell>;
}
