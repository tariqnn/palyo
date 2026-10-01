import Image from "next/image";
import { CalendarDays, Check, Clock, MapPin, Phone, Users } from "lucide-react";
import { query } from "@/lib/db";
import { money } from "@/lib/data";
import { bookActivityAction } from "@/app/actions";

type Activity = { id: string; title: string; category: string; area: string; description: string; image_url: string; price_fils: number; duration_minutes: number; difficulty: string; capacity: number; operator_name: string; operator_phone: string | null; badge: string; includes: string[]; price_unit: string };
const duration = (m: number) => m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} ${m === 60 ? "hour" : "hours"}` : `${Math.floor(m / 60)}h ${m % 60}m`;
const whatsapp = (phone: string) => `https://wa.me/${phone.replace(/[^\d]/g, "")}`;

export default async function Activities({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string; type?: string }> }) {
  const f = await searchParams;
  const all = await query<Activity>("SELECT * FROM activities WHERE active=TRUE ORDER BY created_at DESC, title");
  const types = [...new Set(all.map(a => a.category))];
  const rows = f.type ? all.filter(a => a.category === f.type) : all;
  return <main className="page"><div className="container">
    <div className="page-head"><span className="eyebrow muted">Beyond the court</span><h1>Outdoor sport adventures</h1><p>Scuba diving, parasailing, canyoning, hiking and more. Clear pricing in JD, paid in cash on the day.</p></div>
    {f.notice && <div className="alert">{f.notice}</div>}{f.error && <div className="alert alert-error">{f.error}</div>}
    {types.length > 1 && <div className="pill-row" style={{ marginBottom: 18, flexWrap: "wrap" }}><a className={`pill ${!f.type ? "active" : ""}`} href="/activities">All</a>{types.map(t => <a className={`pill ${f.type === t ? "active" : ""}`} href={`/activities?type=${encodeURIComponent(t)}`} key={t}>{t}</a>)}</div>}
    {rows.length ? <div className="grid-3">{rows.map(a => <article className="card activity-card" key={a.id}>
      <div className="activity-image"><Image src={a.image_url} alt={a.title} fill sizes="(max-width:760px) 100vw, 33vw"/><span className="sport-chip">{a.category}</span></div>
      <div className="activity-body">
        {a.badge && <span className="badge badge-green" style={{ alignSelf: "flex-start" }}>{a.badge}</span>}
        <h2>{a.title}</h2>
        {a.operator_name && <p className="muted" style={{ margin: "0 0 6px" }}>by {a.operator_name}</p>}
        <p>{a.description}</p>
        <div className="activity-meta"><span><MapPin size={14}/>{a.area}</span><span><Clock size={14}/>{duration(a.duration_minutes)}</span><span><Users size={14}/>Up to {a.capacity}</span><span><CalendarDays size={14}/>{a.difficulty}</span></div>
        {a.includes.length > 0 && <ul style={{ listStyle: "none", padding: 0, margin: "10px 0", display: "grid", gap: 4, fontSize: 13 }}>{a.includes.slice(0, 5).map(i => <li key={i} style={{ display: "flex", gap: 6 }}><Check size={14} style={{ flex: "none", marginTop: 3 }}/><span>{i}</span></li>)}</ul>}
        <strong>{money(a.price_fils)} <span className="muted" style={{ fontWeight: 400 }}>/ {a.price_unit}</span></strong>
        <form action={bookActivityAction} className="compact-form"><input type="hidden" name="activityId" value={a.id}/><label>Date<input className="input" type="date" name="date" required/></label><label>People<input className="input" type="number" name="participants" min="1" max={Math.min(8, a.capacity)} defaultValue="1" required/></label><button className="btn btn-primary" type="submit">Book · {money(a.price_fils)}</button></form>
        {a.operator_phone && <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}><a className="btn btn-outline btn-small" href={`tel:${a.operator_phone}`}><Phone size={14}/> Call</a><a className="btn btn-outline btn-small" href={whatsapp(a.operator_phone)} target="_blank" rel="noopener noreferrer">WhatsApp</a></div>}
      </div>
    </article>)}</div> : <div className="empty"><h3>Adventures are coming soon</h3><p>We&apos;re adding scuba diving, parasailing, canyoning and more. Check back shortly.</p></div>}
  </div></main>;
}
