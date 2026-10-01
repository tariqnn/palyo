import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, BarChart3, CalendarDays, Compass, CreditCard, GraduationCap, LayoutDashboard, Mail, MapPin, MessageSquare, Radio, Trophy, Users } from "lucide-react";
import { currentUser } from "@/lib/auth";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ORGANIZER", "ADMIN", "SUPER_ADMIN", "SCOREKEEPER"].includes(user.role)) redirect("/games");
  const admin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const links = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/games", label: "Games", icon: CalendarDays },
    { href: "/admin/bookings", label: "Bookings", icon: CreditCard },
    { href: "/admin/streams", label: "Streams", icon: Radio },
    ...(admin ? [
      { href: "/admin/users", label: "Members", icon: Users },
      { href: "/admin/venues", label: "Venues", icon: MapPin },
      { href: "/admin/academies", label: "Academies", icon: GraduationCap },
      { href: "/admin/activities", label: "Activities", icon: Compass },
      { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
      { href: "/admin/community", label: "Content review", icon: MessageSquare },
      { href: "/admin/activity", label: "Staff activity", icon: Activity },
      { href: "/admin/messages", label: "Messages", icon: Mail },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 }
    ] : [])
  ];
  return <main className="page admin-page"><div className="container admin-layout"><nav className="admin-nav" aria-label="Admin navigation"><div className="admin-nav-title"><strong>PlayUp Admin</strong><small>{admin ? "Platform management" : "Game management"}</small></div>{links.map(({ href, label, icon: Icon }) => <Link href={href} key={href}><Icon size={16}/>{label}</Link>)}</nav><div className="admin-content">{children}</div></div></main>;
}
