"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  Compass,
  CreditCard,
  Gift,
  GraduationCap,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageSquare,
  Radio,
  SlidersHorizontal,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  activity: Activity,
  analytics: BarChart3,
  academy: GraduationCap,
  bookings: CreditCard,
  calendar: CalendarDays,
  content: MessageSquare,
  court: Building2,
  dashboard: LayoutDashboard,
  gift: Gift,
  games: CalendarDays,
  messages: Mail,
  streams: Radio,
  tournaments: Trophy,
  users: Users,
  venues: MapPin,
  activities: Compass,
  studio: SlidersHorizontal,
};

export type WorkspaceNavGroup = {
  label: string;
  links: { href: string; label: string; icon: string }[];
};

export function WorkspaceNav({
  title,
  subtitle,
  ariaLabel,
  groups,
}: {
  title: string;
  subtitle: string;
  ariaLabel: string;
  groups: WorkspaceNavGroup[];
}) {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label={ariaLabel}>
      <div className="admin-nav-title">
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </div>
      <div className="admin-nav-groups">
        {groups.map((group) => (
          <div className="admin-nav-group" key={group.label}>
            <span className="admin-nav-label">{group.label}</span>
            {group.links.map(({ href, label, icon }) => {
              const current =
                pathname === href ||
                (href !== "/admin" && href !== "/academy" && pathname.startsWith(`${href}/`));
              const Icon = icons[icon];
              return (
                <Link
                  href={href}
                  key={href}
                  aria-current={current ? "page" : undefined}
                  className={current ? "is-current" : undefined}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
