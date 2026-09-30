import Link from "next/link";
import type { Metadata } from "next";
import { Search, LayoutGrid, List } from "lucide-react";
import { GameCard } from "@/components/game-card";
import { getGames, getVenues } from "@/lib/data";
import { sports, sportLabels } from "@/lib/brand";

export const metadata:Metadata={title:"Browse Games",description:"Find pickup football, basketball, dodgeball, and tennis games in Amman."};
type Filters=Record<string,string|undefined>;
export default async function GamesPage({searchParams}:{searchParams:Promise<Filters>}){
 const f=await searchParams;
 const [{rows,total,page,pages},venues]=await Promise.all([
  getGames({sport:f.sport,q:f.q,skill:f.skill,date:f.date,sort:f.sort,page:Number(f.page)||1,area:f.area,maxPrice:f.maxPrice?Number(f.maxPrice):undefined,available:f.available,from:f.from}),
  getVenues()
 ]);
 const areas=[...new Set(venues.map(v=>v.area))].sort();
 const url=(extra:Record<string,string>)=>`/games?${new URLSearchParams({...Object.fromEntries(Object.entries(f).filter(([,v])=>!!v)) as Record<string,string>,...extra})}`;
 return <main className="page"><div className="container">
  <div className="page-head"><span className="eyebrow muted">Play in Amman</span><h1>Games</h1><p>Find upcoming games near you.</p></div>
  <form className="filter-bar" action="/games">
   <div style={{position:"relative",flex:"1 1 260px",maxWidth:360}}><Search size={16} style={{position:"absolute",left:11,top:12,color:"#667085"}}/><input className="input" style={{paddingLeft:34,maxWidth:"none"}} name="q" defaultValue={f.q} placeholder="Search games, venues or sports..."/></div>
   <select name="sport" defaultValue={f.sport||"all"} aria-label="Sport"><option value="all">All Sports</option>{sports.map(s=><option key={s} value={s}>{sportLabels[s]}</option>)}</select>
   <select name="date" defaultValue={f.date||"all"} aria-label="Date"><option value="all">Any Date</option><option value="today">Today</option><option value="tomorrow">Tomorrow</option><option value="week">This Week</option><option value="custom">Custom</option></select>
   <select name="area" defaultValue={f.area||"all"} aria-label="Location"><option value="all">All Amman</option>{areas.map(a=><option key={a} value={a}>{a}</option>)}</select>
   <select name="skill" defaultValue={f.skill||"all"} aria-label="Skill"><option value="all">All Levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Competitive</option></select>
   <details className="advanced-filters" open={!!(f.from||f.maxPrice||f.available==="yes")}><summary>More Filters</summary><div><label>Custom date<input className="input" name="from" type="date" defaultValue={f.from}/></label><label>Maximum price<select name="maxPrice" defaultValue={f.maxPrice||""} aria-label="Maximum price"><option value="">Any Price</option><option value="5">Up to 5 JD</option><option value="10">Up to 10 JD</option><option value="20">Up to 20 JD</option></select></label><label>Availability<select name="available" defaultValue={f.available||"all"} aria-label="Availability"><option value="all">All Games</option><option value="yes">Spots Open</option></select></label></div></details>
   <select name="sort" defaultValue={f.sort||"soonest"} aria-label="Sort"><option value="soonest">Soonest</option><option value="popular">Popular</option><option value="price">Price Low → High</option><option value="spots">Spots Remaining</option></select>
   <button className="btn btn-dark" type="submit">Search</button>
  </form>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:15}}><p className="muted" style={{fontSize:12,margin:0}}>{total} games found</p><div style={{display:"flex",gap:8}}><Link className={f.view!=="list"?"inline-link":"muted"} href={url({view:"grid"})} aria-label="Grid view"><LayoutGrid size={18}/></Link><Link className={f.view==="list"?"inline-link":"muted"} href={url({view:"list"})} aria-label="List view"><List size={18}/></Link></div></div>
  {rows.length?<div className={`game-grid ${f.view==="list"?"game-list":""}`}>{rows.map(g=><GameCard game={g} key={g.id}/>)}</div>:<div className="empty"><h3>No games match your filters</h3><p>Try another date, sport or venue.</p><Link href="/games" className="btn btn-primary">Clear filters</Link></div>}
  {pages>1&&<nav className="pagination" aria-label="Pages">{Array.from({length:pages},(_,i)=><Link className={page===i+1?"active":""} href={url({page:String(i+1)})} key={i}>{i+1}</Link>)}</nav>}
 </div></main>;
}
