import { one, query } from "@/lib/db";
import { type Sport } from "@/lib/brand";
import type { ScoringConfig } from "@/lib/scoring";

export type Game = { id:string; sport:Sport; title:string; format:string; description:string; rules:string; starts_at:string; ends_at:string; capacity:number; booked_count:number; price_fils:number; skill:string; status:string; finalized_at:string|null; image_url:string; recording_enabled:boolean; stream_enabled:boolean; venue_id:string; venue_name:string; area:string; address:string; organizer_id:string; organizer_name:string; mvp_id:string|null; score_config:ScoringConfig };
export type Venue = {id:string;name:string;area:string;address:string;sports:string[];amenities:string[];image_url:string;rating:number};
export type Profile = {id:string;name:string;username:string;avatar_url:string|null;xp:number;city:string;created_at:string};
export function money(fils:number){return `${(fils/1000).toFixed(fils%1000?1:0)} JD`;}
export function gameDate(date:string){return new Date(date).toLocaleDateString("en-JO",{weekday:"short",month:"short",day:"numeric",timeZone:"Asia/Amman"});}
export function gameTime(date:string){return new Date(date).toLocaleTimeString("en-JO",{hour:"numeric",minute:"2-digit",timeZone:"Asia/Amman"});}
export async function getGames(filters:{sport?:string;q?:string;skill?:string;sort?:string;page?:number;date?:string;area?:string;maxPrice?:number;available?:string;from?:string}={}) {
  const conditions=["g.status IN ('PUBLISHED','FILLING','FULL')","g.starts_at > now()"];
  const params:unknown[]=[];
  if(filters.sport&&filters.sport!=="all"){params.push(filters.sport);conditions.push(`g.sport=$${params.length}`);}
  if(filters.skill&&filters.skill!=="all"){params.push(filters.skill);conditions.push(`g.skill=$${params.length}`);}
  if(filters.area&&filters.area!=="all"){params.push(filters.area);conditions.push(`v.area=$${params.length}`);}
  if(filters.maxPrice!==undefined&&Number.isFinite(filters.maxPrice)){params.push(Math.round(filters.maxPrice*1000));conditions.push(`g.price_fils<=$${params.length}`);}
  if(filters.available==="yes")conditions.push("g.booked_count<g.capacity");
  if(filters.q){params.push(`%${filters.q.slice(0,100)}%`);conditions.push(`(g.title ILIKE $${params.length} OR v.name ILIKE $${params.length} OR v.area ILIKE $${params.length})`);}
  if(filters.date==="today") conditions.push("(g.starts_at AT TIME ZONE 'Asia/Amman')::date=(now() AT TIME ZONE 'Asia/Amman')::date");
  if(filters.date==="tomorrow") conditions.push("(g.starts_at AT TIME ZONE 'Asia/Amman')::date=(now() AT TIME ZONE 'Asia/Amman')::date+1");
  if(filters.date==="week") conditions.push("g.starts_at < now() + interval '7 days'");
  if(filters.date==="custom"&&filters.from&&/^\d{4}-\d{2}-\d{2}$/.test(filters.from)){params.push(filters.from);conditions.push(`(g.starts_at AT TIME ZONE 'Asia/Amman')::date=$${params.length}::date`);}
  const where=conditions.join(" AND ");
  const order=filters.sort==="popular"?"g.booked_count DESC":filters.sort==="price"?"g.price_fils ASC":filters.sort==="spots"?"(g.capacity-g.booked_count) DESC":"g.starts_at ASC";
  const page=Math.max(1,Number(filters.page)||1);
  const count=await one<{count:string}>(`SELECT count(*)::text AS count FROM games g JOIN venues v ON v.id=g.venue_id WHERE ${where}`,params);
  const rows=await query<Game>(`SELECT g.*,v.name AS venue_name,v.area,v.address,u.name AS organizer_name FROM games g JOIN venues v ON v.id=g.venue_id JOIN users u ON u.id=g.organizer_id WHERE ${where} ORDER BY ${order} LIMIT 12 OFFSET ${Math.max(0,page-1)*12}`,params);
  return {rows,total:Number(count?.count||0),page,pages:Math.max(1,Math.ceil(Number(count?.count||0)/12))};
}
export function getGame(id:string){return one<Game>("SELECT g.*,v.name AS venue_name,v.area,v.address,u.name AS organizer_name FROM games g JOIN venues v ON v.id=g.venue_id JOIN users u ON u.id=g.organizer_id WHERE g.id=$1",[id]);}
export function getVenues(){return query<Venue>("SELECT * FROM venues ORDER BY name");}
export function getVenue(id:string){return one<Venue>("SELECT * FROM venues WHERE id=$1",[id]);}
export function getProfile(username:string){return one<Profile>("SELECT id,name,username,avatar_url,xp,city,created_at FROM users WHERE username=$1",[username]);}
