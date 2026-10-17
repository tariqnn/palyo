import Link from "next/link";
import { getSiteConfig } from "@/lib/site-editor";

export async function Footer() {
  const config = await getSiteConfig();
  const brandName = config.brand.name || "PlayUp";
  const tagline = config.brand.tagline || "Find your game. Play your sport.";
  const address = config.brand.officeAddress || "Amman, Jordan · Cash payment at the venue";

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <Link className="logo" href="/">{brandName}</Link>
          <p>{tagline}</p>
          <small>{address}</small>
          <div style={{ display: "flex", gap: 12, marginTop: 9 }}>
            {config.brand.instagramUrl && (
              <a href={config.brand.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>
            )}
            {config.brand.xUrl && (
              <a href={config.brand.xUrl} target="_blank" rel="noreferrer">X</a>
            )}
            {config.brand.whatsappNumber && (
              <a href={`https://wa.me/${config.brand.whatsappNumber.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            )}
          </div>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/explore">Explore</Link>
          <Link href="/games">Matches</Link>
          <Link href="/venues">Courts</Link>
          <Link href="/academies">Academies</Link>
          <Link href="/activities">Adventures</Link>
          <Link href="/rewards">Rewards</Link>
          <Link href="/tournaments">Tournaments</Link>
          <Link href="/community">Community</Link>
          <Link href="/watch">Watch</Link>
          <Link href="/support">Help</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
