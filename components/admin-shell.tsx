import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
export async function AdminShell({children}:{children:React.ReactNode}){
 const user=await currentUser();if(!user)redirect("/login");if(!["ORGANIZER","ADMIN","SUPER_ADMIN","SCOREKEEPER"].includes(user.role))redirect("/games");
 const admin=["ADMIN","SUPER_ADMIN"].includes(user.role);
 return <main className="page"><div className="container admin-layout"><nav className="admin-nav" aria-label="Admin"><strong style={{display:"block",padding:"7px 11px 16px"}}>Manage PLAYO</strong><Link href="/admin">Overview</Link><Link href="/admin/games">Games</Link><Link href="/admin/streams">Live Streams</Link><Link href="/admin/bookings">Bookings</Link><Link href="/venues">Venues</Link><Link href="/tournaments">Tournaments</Link><Link href="/community">Community</Link>{admin&&<><Link href="/admin/messages">Messages</Link><Link href="/admin/analytics">Analytics</Link></>}</nav><div>{children}</div></div></main>;
}
