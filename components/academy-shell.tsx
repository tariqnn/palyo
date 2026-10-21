import type { ReactNode } from "react";
import { WorkspaceNav, type WorkspaceNavGroup } from "@/components/workspace-nav";

const groups: WorkspaceNavGroup[] = [
  {
    label: "Workspace",
    links: [{ href: "/academy", label: "Overview", icon: "dashboard" }],
  },
  {
    label: "Daily operations",
    links: [
      { href: "/academy/bookings", label: "Bookings", icon: "bookings" },
      { href: "/academy/courts", label: "Courts", icon: "court" },
    ],
  },
  {
    label: "Grow your academy",
    links: [
      { href: "/academy/offers", label: "Offers", icon: "gift" },
      { href: "/academy/analytics", label: "Analytics", icon: "analytics" },
      { href: "/academy/staff", label: "Staff", icon: "users" },
      { href: "/academy/profile", label: "Public page", icon: "academy" },
    ],
  },
];

export function AcademyShell({
  children,
  name,
}: {
  children: ReactNode;
  name: string;
}) {
  return (
    <main className="page academy-workspace">
      <div className="container">
        <div className="admin-demo-note">
          <strong>Academy workspace</strong>
          <span>{name} · cash-first booking operations</span>
        </div>
        <div className="admin-layout">
          <WorkspaceNav
            title={name}
            subtitle="Academy workspace"
            ariaLabel="Academy navigation"
            groups={groups}
          />
          <section className="admin-content">{children}</section>
        </div>
      </div>
    </main>
  );
}
