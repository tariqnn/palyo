import Link from "next/link";
import { Activity, Building2, Gift, Map, Trophy, Users } from "lucide-react";
const destinations=[
 {href:"/venues",title:"Courts & venues",copy:"Search by sport, area and amenities, then reserve a court.",icon:Map},
 {href:"/games",title:"Open matches",copy:"Join casual and competitive games near you.",icon:Users},
 {href:"/academies",title:"Academies",copy:"Discover verified coaching and sports communities.",icon:Building2},
 {href:"/activities",title:"Outdoor adventures",copy:"Book hiking, kayaking and climbing experiences.",icon:Activity},
 {href:"/tournaments",title:"Tournaments",copy:"Enter upcoming competitions and track your season.",icon:Trophy},
 {href:"/rewards",title:"Rewards",copy:"Spend points on academy sessions and partner offers.",icon:Gift},
];
export default function Explore(){return <main className="page explore-page"><div className="container"><div className="page-head"><span className="eyebrow muted">Everything in one place</span><h1>Explore PlayUp</h1><p>Book, play, connect and earn across Jordan.</p></div><div className="feature-grid">{destinations.map(({href,title,copy,icon:Icon})=><Link className="feature-card" href={href} key={href}><span><Icon size={24}/></span><div><h2>{title}</h2><p>{copy}</p><strong>Explore →</strong></div></Link>)}</div></div></main>}
