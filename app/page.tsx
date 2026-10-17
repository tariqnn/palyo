import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck, UsersRound, Trophy, ArrowUpRight, MapPin, Star, GraduationCap, Compass } from "lucide-react";
import { GameCard } from "@/components/game-card";
import { getGames, getVenues } from "@/lib/data";
import { getSiteConfig } from "@/lib/site-editor";
import { query } from "@/lib/db";
import { money } from "@/lib/data";

type AcademyPreview = { id: string; name: string; area: string; sports: string[]; rating: number; image_url: string };
type ActivityPreview = { id: string; title: string; category: string; area: string; price_fils: number; image_url: string; difficulty: string };

export default async function Home() {
  const [config, { rows: games }, venues, academies, activities] = await Promise.all([
    getSiteConfig(),
    getGames(),
    getVenues(),
    query<AcademyPreview>("SELECT id, name, area, sports, rating, image_url FROM academies WHERE active=true ORDER BY rating DESC LIMIT 3").catch(() => []),
    query<ActivityPreview>("SELECT id, title, category, area, price_fils, image_url, difficulty FROM activities WHERE active=true ORDER BY created_at DESC LIMIT 3").catch(() => []),
  ]);

  const activeSports = Object.entries(config.sports).filter(([, sport]) => sport.enabled);
  const accent = config.brand.accentColor || "#22e879";

  return (
    <main>
      {/* Dynamic Announcement Ribbon */}
      {config.sections.showAnnouncement && config.announcement.enabled && (
        <div
          className="top-announcement-bar"
          style={{ background: config.announcement.bgColor, color: config.announcement.textColor }}
        >
          <div className="container announcement-inner">
            <span className="announcement-text">{config.announcement.text}</span>
            {config.announcement.link && (
              <Link className="announcement-link" href={config.announcement.link}>
                {config.announcement.linkLabel || "Learn more →"}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      {config.sections.showHero && (
        <section className="hero">
          <div className="hero-image">
            <Image
              src={config.hero.imageUrl || "/images/hero-ground.jpg"}
              alt={config.hero.titleLine1 || "Sports in Amman"}
              fill
              priority
              sizes="100vw"
            />
          </div>
          <div className="container hero-content">
            <div>
              <p className="eyebrow" style={{ color: accent }}>{config.hero.eyebrow}</p>
              <h1>
                {config.hero.titleLine1}
                <span style={{ color: accent }}>{config.hero.titleLine2}</span>
              </h1>
              <p className="hero-copy">{config.hero.copy}</p>
              <div className="hero-buttons">
                {config.hero.primaryBtnText && (
                  <Link className="btn btn-primary" href={config.hero.primaryBtnLink || "/games"}>
                    {config.hero.primaryBtnText} <ArrowRight size={16} />
                  </Link>
                )}
                {config.hero.secondaryBtnText && (
                  <Link className="btn btn-outline" href={config.hero.secondaryBtnLink || "#how-it-works"}>
                    {config.hero.secondaryBtnText}
                  </Link>
                )}
              </div>
            </div>

            {/* Dynamic Sport Quick Strip */}
            {config.sections.showSportStrip && activeSports.length > 0 && (
              <div className="sport-strip">
                {activeSports.map(([key, s]) => (
                  <Link className="sport-tile" href={`/sports/${s.key}`} key={key}>
                    <Image src={s.imageUrl || "/images/football.jpg"} alt={s.title} fill sizes="25vw" />
                    <div className="sport-tile-text">
                      <div>
                        <strong>{s.title}</strong>
                        <small>{s.subtitle}</small>
                      </div>
                      <ArrowUpRight size={15} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Upcoming Matches Section */}
      {config.sections.showMatches && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow muted">{config.sections.matchesEyebrow}</span>
                <h2>{config.sections.matchesTitle}</h2>
                <p>Real games. Real people. Your city.</p>
              </div>
              <Link className="section-link" href="/games">
                Browse all games <ArrowRight size={15} />
              </Link>
            </div>
            {games.length ? <div className="game-grid">
              {games.slice(0, config.sections.matchesCount || 6).map((g) => (
                <GameCard game={g} key={g.id} />
              ))}
            </div> : <div className="empty"><h3>No upcoming games listed</h3><p>New games will appear here when local organizers publish their schedules.</p></div>}
          </div>
        </section>
      )}

      {/* How It Works Section */}
      {config.sections.showHowItWorks && (
        <section className="section section-soft" id="how-it-works">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow muted">Simple from the first tap</span>
                <h2>{config.sections.howTitle}</h2>
              </div>
            </div>
            <div className="feature-row">
              <div className="feature">
                <span className="feature-icon"><CalendarCheck size={20} /></span>
                <h3>{config.sections.howStep1Title}</h3>
                <p>{config.sections.howStep1Desc}</p>
              </div>
              <div className="feature">
                <span className="feature-icon"><UsersRound size={20} /></span>
                <h3>{config.sections.howStep2Title}</h3>
                <p>{config.sections.howStep2Desc}</p>
              </div>
              <div className="feature">
                <span className="feature-icon"><Trophy size={20} /></span>
                <h3>{config.sections.howStep3Title}</h3>
                <p>{config.sections.howStep3Desc}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Popular Venues Section */}
      {config.sections.showVenues && venues.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow muted">{config.sections.venuesEyebrow}</span>
                <h2>{config.sections.venuesTitle}</h2>
              </div>
              <Link className="section-link" href="/venues">
                Explore venues <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid-4">
              {venues.slice(0, 4).map((v) => (
                <Link className="card venue-home-card" href={`/venues/${v.id}`} key={v.id}>
                  <div className="venue-image">
                    <Image src={v.image_url} alt={v.name} fill sizes="25vw" />
                  </div>
                  <div className="venue-body">
                    <h3>{v.name}</h3>
                    <p><MapPin size={12} style={{ display: "inline" }} /> {v.area}, Jordan</p>
                    <div className="venue-bottom">
                      <span>{v.sports.map((sp) => sp.toUpperCase()).join(" · ")}</span>
                      {Number(v.rating) > 0 && (
                        <span><Star size={12} fill={accent} /> {Number(v.rating).toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Academies Showcase Section */}
      {config.sections.showAcademies && academies.length > 0 && (
        <section className="section section-soft">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow muted">{config.sections.academiesEyebrow}</span>
                <h2>{config.sections.academiesTitle}</h2>
                <p>Explore published coaching programs and academy facilities.</p>
              </div>
              <Link className="section-link" href="/academies">
                All academies <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid-3">
              {academies.map((a) => (
                <Link className="card" href={`/academies/${a.id}`} key={a.id} style={{ overflow: "hidden" }}>
                  <div style={{ position: "relative", height: 160 }}>
                    <Image src={a.image_url} alt={a.name} fill sizes="33vw" />
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <GraduationCap size={15} style={{ color: accent }} />
                      <span className="muted" style={{ fontSize: 11 }}>{a.area}, Jordan</span>
                    </div>
                    <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{a.name}</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                      <span className="badge badge-green" style={{ fontSize: 11 }}>{a.sports.slice(0, 2).join(" & ")}</span>
                      {Number(a.rating) > 0 && <span>★ {Number(a.rating).toFixed(1)}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Outdoor Adventures Section */}
      {config.sections.showAdventures && activities.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow muted">{config.sections.adventuresEyebrow}</span>
                <h2>{config.sections.adventuresTitle}</h2>
                <p>Hiking, climbing, and watersports with the PlayUp community.</p>
              </div>
              <Link className="section-link" href="/activities">
                All adventures <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid-3">
              {activities.map((act) => (
                <Link className="card" href={`/activities/${act.id}`} key={act.id} style={{ overflow: "hidden" }}>
                  <div style={{ position: "relative", height: 160 }}>
                    <Image src={act.image_url} alt={act.title} fill sizes="33vw" />
                    <span className="badge" style={{ position: "absolute", top: 10, left: 10, background: "#000a", color: "#fff" }}>
                      {act.difficulty}
                    </span>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Compass size={15} style={{ color: accent }} />
                      <span className="muted" style={{ fontSize: 11 }}>{act.area}</span>
                    </div>
                    <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{act.title}</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                      <span className="muted">{act.category}</span>
                      <strong style={{ color: accent }}>{money(act.price_fils)}</strong>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call To Action Banner */}
      {config.sections.showCtaBanner && (
        <section
          className="photo-banner"
          style={{
            backgroundImage: config.sections.ctaImage ? `linear-gradient(rgba(7,17,13,0.85), rgba(7,17,13,0.85)), url('${config.sections.ctaImage}')` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div className="container">
            <div>
              <h2>{config.sections.ctaTitle}</h2>
              <p>{config.sections.ctaSubtitle}</p>
            </div>
            {config.sections.ctaBtnText && (
              <Link className="btn btn-primary" href={config.sections.ctaBtnLink || "/signup"}>
                {config.sections.ctaBtnText} <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
