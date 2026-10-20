import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Mail, MapPin, Phone } from "lucide-react";
import { one, query } from "@/lib/db";
import { VenuePhoto } from "@/components/venue-photo";
import type { Venue } from "@/lib/data";

type Academy = { id:string; name:string; area:string; address:string; description:string; sports:string[]; image_url:string; rating:number; verified:boolean; phone:string|null; email:string|null; website:string|null; source_url:string|null; training_packages:string[]; active:boolean };
type Package = { id:string; title:string; description:string; price:string; duration:string; image_url:string };
type Event = { id:string; title:string; description:string; location:string; image_url:string; starts_at:Date|string };

export default async function AcademyPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const academy=await one<Academy>("SELECT * FROM academies WHERE id=$1",[id]);
  if(!academy||!academy.active)notFound();
  const [venues,packages,events]=await Promise.all([
    query<Venue>("SELECT * FROM venues WHERE academy_id=$1 AND active=TRUE ORDER BY name",[id]),
    query<Package>("SELECT id,title,description,price,duration,image_url FROM academy_packages WHERE academy_id=$1 ORDER BY sort_order",[id]).catch(()=>[]),
    query<Event>("SELECT id,title,description,location,image_url,starts_at FROM academy_events WHERE academy_id=$1 AND status='PUBLISHED' AND starts_at>now() ORDER BY starts_at",[id]).catch(()=>[]),
  ]);
  return <main className="page"><div className="container">
    <div className="breadcrumb"><Link href="/academies">Academies</Link> / {academy.name}</div>
    <div className="detail-cover"><VenuePhoto src={academy.image_url} alt={academy.name} sizes="100vw"/></div>
    <div className="academy-profile"><div><span className="eyebrow muted">{academy.verified?"Verified academy":"Academy listing"}</span><h1>{academy.name} {academy.verified&&<BadgeCheck size={22}/>}</h1><p><MapPin size={14}/> {academy.address}</p></div><div className="academy-contact">{academy.phone&&<a href={`tel:${academy.phone}`}><Phone size={16}/>{academy.phone}</a>}{academy.email&&<a href={`mailto:${academy.email}`}><Mail size={16}/>{academy.email}</a>}{academy.website&&<a href={academy.website} target="_blank" rel="noopener noreferrer">Official website</a>}</div></div>
    <p className="lead-copy">{academy.description}</p><div className="pill-row">{academy.sports.map(s=><span className="pill" key={s}>{s}</span>)}</div>
    {(packages.length>0||academy.training_packages.length>0)&&<><div className="section-head"><div><span className="eyebrow muted">Programs</span><h2>Training packages</h2></div></div>{packages.length>0?<div className="academy-package-grid">{packages.map(p=><article className="academy-package-card" key={p.id}><div className="academy-package-image">{p.image_url&&<Image src={p.image_url} alt={p.title} fill sizes="33vw"/>}</div><div className="academy-package-copy"><h3>{p.title}</h3>{p.description&&<p>{p.description}</p>}<div className="academy-package-meta">{p.price&&<span className="pill">{p.price}</span>}{p.duration&&<span className="pill">{p.duration}</span>}</div></div></article>)}</div>:<div className="pill-row" style={{flexWrap:"wrap"}}>{academy.training_packages.map(t=><span className="pill" key={t}>{t}</span>)}</div>}</>}
    {events.length>0&&<><div className="section-head"><div><span className="eyebrow muted">Coming up</span><h2>Academy events</h2></div></div>{events.map(e=><article className="academy-event-card" key={e.id}><div className="academy-event-image">{e.image_url&&<Image src={e.image_url} alt={e.title} fill sizes="30vw"/>}</div><div className="academy-event-copy"><span className="eyebrow muted">{new Date(e.starts_at).toLocaleDateString("en-JO",{day:"numeric",month:"short",year:"numeric"})}</span><h3>{e.title}</h3>{e.location&&<strong><MapPin size={13}/> {e.location}</strong>}{e.description&&<p>{e.description}</p>}</div></article>)}</>}
    {venues.length>0&&<div className="section-head"><div><span className="eyebrow muted">Places to play</span><h2>Academy venues</h2></div></div>}<div className="grid-3">{venues.map(v=><Link className="card venue-compact" href={`/venues/${v.id}`} key={v.id}><div className="venue-image"><VenuePhoto src={v.image_url} alt={v.name} sizes="33vw"/></div><div className="venue-body"><h3>{v.name}</h3><p>{v.area}</p><span className="inline-link">Venue details →</span></div></Link>)}</div>
    {academy.source_url&&<p><a className="inline-link" href={academy.source_url} target="_blank" rel="noopener noreferrer">See official academy website ↗</a></p>}
  </div></main>;
}
