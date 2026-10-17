
import { VenuePhoto } from "@/components/venue-photo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Star } from "lucide-react";
import { getVenue } from "@/lib/data";
import { query } from "@/lib/db";
import { GameCard } from "@/components/game-card";
import type { Game } from "@/lib/data";

export default async function VenuePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const venue=await getVenue(id);if(!venue)notFound();
 const games=await query<Game>("SELECT g.*,v.name AS venue_name,v.area,v.address,u.name AS organizer_name FROM games g JOIN venues v ON v.id=g.venue_id JOIN users u ON u.id=g.organizer_id WHERE g.venue_id=$1 AND g.starts_at>now() ORDER BY g.starts_at LIMIT 6",[id]);
 return <main className="page"><div className="container"><div className="breadcrumb"><Link href="/venues">Venues</Link> / {venue.name}</div><div className="detail-cover"><VenuePhoto src={venue.image_url} alt={venue.name} sizes="100vw"/></div><div className="venue-detail-head"><div className="page-head" style={{marginTop:23}}><h1>{venue.name}</h1><p><MapPin size={14} style={{display:"inline"}}/> {venue.address} · {Number(venue.rating)>0&&<><Star size={14} fill="#22e879" style={{display:"inline"}}/> {Number(venue.rating).toFixed(1)}</>}</p><p>{venue.sports.join(" · ")}</p><p>{venue.hourly_rate_fils==null?"Contact the venue for current rates and availability.":`From ${Math.round(venue.hourly_rate_fils/1000)} JD per hour`}</p></div>{venue.hourly_rate_fils!=null&&<Link className="btn btn-primary" href={`/venues/${id}/book`}>Reserve this court</Link>}</div><div style={{marginBottom:35}}>{venue.amenities.map(a=><span className="pill" key={a}>{a}</span>)}</div>{venue.source_url&&<p><a className="inline-link" href={venue.source_url} target="_blank" rel="noopener noreferrer">View venue source ↗</a></p>}<div className="section-head"><h2>Upcoming games</h2></div>{games.length?<div className="game-grid">{games.map(g=><GameCard game={g} key={g.id}/>)}</div>:<div className="empty">No upcoming games at this venue.</div>}</div></main>;
}
