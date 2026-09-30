import type { MetadataRoute } from "next";
import { brand,sports } from "@/lib/brand";
import { query } from "@/lib/db";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const paths=["/","/sports","/games","/watch","/venues","/tournaments","/community","/leaderboards",...sports.map(s=>`/sports/${s}`)];const base=paths.map(p=>({url:`${brand.url}${p}`,lastModified:new Date()}));const games=await query<{id:string}>("SELECT id FROM games WHERE status IN ('PUBLISHED','FILLING','FULL') AND starts_at>now() LIMIT 500");return [...base,...games.map(g=>({url:`${brand.url}/games/${g.id}`,lastModified:new Date()}))];}
