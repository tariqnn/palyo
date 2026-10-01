import Link from "next/link";
import Image from "next/image";
import { Search, Bell, Menu } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { brand } from "@/lib/brand";
import { logoutAction } from "@/app/actions";

export async function Header() {
  const user = await currentUser();
  const manager = user && ["ORGANIZER", "ADMIN", "SUPER_ADMIN", "SCOREKEEPER"].includes(user.role);
  const academy = user?.role === "ORGANIZER";
  return <header className="site-header"><div className="header-inner"><Link className="logo" href="/">{brand.name}</Link><nav className="desktop-nav" aria-label="Main navigation"><Link href="/explore">Explore</Link><Link href="/games">Matches</Link><Link href="/venues">Courts</Link><Link href="/academies">Academies</Link><Link href="/activities">Adventures</Link><Link href="/tournaments">Tournaments</Link><Link href="/community">Community</Link></nav><div className="header-actions"><Link href="/search" aria-label="Search"><Search size={17}/></Link>{user ? <>{academy&&<Link className="header-admin-link" href="/academy">Academy</Link>}{manager && <Link className="header-admin-link" href="/admin">Admin</Link>}<Link href="/notifications" aria-label="Notifications"><Bell size={17}/></Link><Link className="header-avatar" href={`/profile/${user.username}`} title={user.name}>{user.avatar_url ? <Image src={user.avatar_url} alt="" width={28} height={28}/> : user.name[0]}</Link><form action={logoutAction}><button className="text-button" type="submit">Log out</button></form></> : <><Link className="btn btn-outline btn-small" href="/login">Log In</Link><Link className="btn btn-primary btn-small" href="/signup">Sign Up</Link></>}</div><details className="mobile-nav"><summary aria-label="Open menu"><Menu size={22}/></summary><div><Link href="/explore">Explore</Link><Link href="/games">Open matches</Link><Link href="/matches/create">Create match</Link><Link href="/venues">Courts & venues</Link><Link href="/venues/map">Venue map</Link><Link href="/academies">Academies</Link><Link href="/activities">Adventures</Link><Link href="/tournaments">Tournaments</Link><Link href="/community">Community</Link><Link href="/rewards">Rewards</Link><Link href="/bookings">My bookings</Link><Link href="/settings">Settings</Link>{academy&&<Link href="/academy">Academy workspace</Link>}{manager && <Link href="/admin">Admin dashboard</Link>}</div></details></div></header>;
}
