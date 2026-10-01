import Link from "next/link";
import { CalendarDays, Gift, Settings, Trophy, Users, WalletCards } from "lucide-react";

const links=[
  {href:"/bookings",label:"Bookings",icon:CalendarDays},
  {href:"/friends",label:"Friends",icon:Users},
  {href:"/rewards",label:"Rewards",icon:Gift},
  {href:"/wallet",label:"Wallet",icon:WalletCards},
  {href:"/leaderboards",label:"Leaderboard",icon:Trophy},
  {href:"/settings",label:"Settings",icon:Settings},
];
export function MemberShell({children,title,subtitle}:{children:React.ReactNode;title:string;subtitle?:string}){
 return <main className="page member-page"><div className="container"><div className="member-head"><div><span className="eyebrow muted">My PlayUp</span><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div></div><div className="member-layout"><nav className="member-nav" aria-label="Player account">{links.map(({href,label,icon:Icon})=><Link href={href} key={href}><Icon size={18}/><span>{label}</span></Link>)}</nav><section className="member-content">{children}</section></div></div></main>;
}
