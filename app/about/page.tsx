import Link from "next/link";
import { getSiteConfig } from "@/lib/site-editor";

export default async function About() {
  const config = await getSiteConfig();
  const brandName = config.brand.name || "PlayUp";
  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="page-head">
          <span className="eyebrow muted">{brandName} Story</span>
          <h1>{config.staticPages.aboutHeroTitle || `About ${brandName}`}</h1>
          <p>{config.brand.tagline}</p>
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.6 }}>
          {config.staticPages.aboutHeroBody}
        </p>
        <div className="card" style={{ padding: 22, margin: "25px 0", borderLeft: `4px solid ${config.brand.accentColor}` }}>
          <strong style={{ display: "block", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>
            Our Mission
          </strong>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
            {config.staticPages.aboutMission}
          </p>
        </div>
        <p>
          {brandName} is a community-driven sports platform connecting players, venues, and academies across Jordan.
        </p>
        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          <Link className="btn btn-primary" href="/games">Find a game</Link>
          <Link className="btn btn-outline" href="/venues">Explore venues</Link>
        </div>
      </div>
    </main>
  );
}
