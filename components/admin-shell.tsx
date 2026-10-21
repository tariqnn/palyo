import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { WorkspaceNav, type WorkspaceNavGroup } from "@/components/workspace-nav";

export async function AdminShell({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!["ORGANIZER", "ADMIN", "SUPER_ADMIN", "SCOREKEEPER"].includes(user.role)) {
    redirect("/games");
  }

  const admin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const groups: WorkspaceNavGroup[] = [
    {
      label: "Workspace",
      links: [{ href: "/admin", label: "Overview", icon: "dashboard" }],
    },
    {
      label: "Daily operations",
      links: [
        { href: "/admin/games", label: "Games", icon: "games" },
        { href: "/admin/bookings", label: "Bookings", icon: "bookings" },
        { href: "/admin/streams", label: "Streams", icon: "streams" },
      ],
    },
    ...(admin
      ? [
          {
            label: "Platform",
            links: [
              { href: "/admin/site-editor", label: "Owner studio", icon: "studio" },
              { href: "/admin/users", label: "Members", icon: "users" },
              { href: "/admin/venues", label: "Venues", icon: "venues" },
              { href: "/admin/academies", label: "Academies", icon: "academy" },
              { href: "/admin/activities", label: "Activities", icon: "activities" },
              { href: "/admin/tournaments", label: "Tournaments", icon: "tournaments" },
              { href: "/admin/community", label: "Content review", icon: "content" },
              { href: "/admin/activity", label: "Staff activity", icon: "activity" },
              { href: "/admin/messages", label: "Messages", icon: "messages" },
              { href: "/admin/analytics", label: "Analytics", icon: "analytics" },
            ],
          },
        ]
      : []),
  ];

  return (
    <main className="page admin-page">
      <div className="container admin-layout">
        <WorkspaceNav
          title="PlayUp Admin"
          subtitle={admin ? "Platform management" : "Game management"}
          ariaLabel="Admin navigation"
          groups={groups}
        />
        <div className="admin-content">{children}</div>
      </div>
    </main>
  );
}
