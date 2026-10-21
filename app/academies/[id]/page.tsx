import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";
import { one, query } from "@/lib/db";
import { VenuePhoto } from "@/components/venue-photo";
import type { Venue } from "@/lib/data";

type Academy = {
  id: string;
  name: string;
  area: string;
  address: string;
  description: string;
  sports: string[];
  image_url: string;
  rating: number;
  verified: boolean;
  phone: string | null;
  email: string | null;
  website: string | null;
  source_url: string | null;
  training_packages: string[];
  active: boolean;
};

type Package = {
  id: string;
  title: string;
  description: string;
  price: string;
  duration: string;
  image_url: string;
};

type Event = {
  id: string;
  title: string;
  description: string;
  location: string;
  image_url: string;
  starts_at: Date | string;
};

type ProgramDetails = {
  title: string;
  sport: string;
  age?: string;
  sessions?: string;
  schedule?: string;
  price?: string;
  perks?: string;
  note?: string;
};

function presentProgram(raw: string, sport: string): ProgramDetails {
  const normalized = raw.toLowerCase();
  const detectedSport = [
    "volleyball",
    "basketball",
    "padel",
    "football",
    "tennis",
    "ballet",
    "pilates",
    "kickboxing",
    "yoga",
  ].find((candidate) => normalized.includes(candidate));
  const programSport = detectedSport || sport;
  const parts = raw.split(/;\s*/).map((value) => value.trim()).filter(Boolean);
  const headline = parts.shift() || "Training program";
  const headlineParts = headline.split(/:\s*/);
  const title = headlineParts.shift() || "Training program";
  const inlineDetails = headlineParts.join(":").trim();
  if (inlineDetails && /\b(?:ages?|sessions?|classes?|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|contact for|flexible scheduling)\b/i.test(inlineDetails)) {
    parts.unshift(inlineDetails);
  } else if (inlineDetails) {
    return {
      title: headline,
      sport: programSport,
      note: parts.join(" · ") || undefined,
    };
  }

  const age = parts.join("; ").match(/ages?\s+[^;]+/i)?.[0];
  const sessions = parts.join("; ").match(/\b\d+\s+(?:sessions?|classes?)(?:\s+over\s+[^;]+)?/i)?.[0];
  const schedule = parts.join("; ").match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[^;]*/i)?.[0];
  const price = parts.join("; ").match(/(?:\d+(?:\.\d+)?\s*(?:JOD|JD)|contact for (?:current )?price|contact for price)/i)?.[0];
  const perks = parts.join("; ").match(/(?:sibling discount|group rates)[^;]*/i)?.[0];
  const known = [age, sessions, schedule, price, perks].filter(Boolean) as string[];
  const note = parts
    .filter((part) => !known.some((item) => part.toLowerCase().includes(item.toLowerCase())))
    .join(" · ");
  return { title, sport: programSport, age, sessions, schedule, price, perks, note: note || undefined };
}

function packagePhoto(raw: string, index: number, academy: Academy, fallback: string) {
  if (!academy.name.toLowerCase().includes("infinity")) return fallback;
  const normalized = raw.toLowerCase();
  if (normalized.includes("volley")) return "/images/infinity-sports/court_volleyball.jpeg";
  if (normalized.includes("padel")) return "/images/infinity-sports/court_padel.jpeg";
  if (normalized.includes("basket")) {
    return index % 2 === 0
      ? "/images/infinity-sports/court_basketball_ac.jpeg"
      : "/images/infinity-sports/court_3x3.jpeg";
  }
  return academy.image_url || fallback;
}

function ProgramCard({
  details,
  image,
  academy,
  price,
  duration,
}: {
  details: ProgramDetails;
  image: string;
  academy: Academy;
  price?: string;
  duration?: string;
}) {
  const displayedPrice = price || details.price || "Contact for price";
  const displayedDuration = duration || details.sessions;

  return (
    <article className="academy-legacy-package academy-program-card">
      <div className="academy-legacy-image">
        <Image
          src={image}
          alt={`${details.sport} training at ${academy.name}`}
          fill
          sizes="(max-width: 700px) 82vw, (max-width: 1100px) 45vw, 30vw"
        />
        <span>{details.sport}</span>
      </div>
      <div className="academy-legacy-copy">
        <span className="academy-program-label">{details.sport}</span>
        <h3>{details.title}</h3>
        {details.note && <p className="academy-program-note">{details.note}</p>}
        <div className="academy-program-facts">
          {details.age && <span><Users size={14} />{details.age}</span>}
          {displayedDuration && <span><Sparkles size={14} />{displayedDuration}</span>}
          {details.schedule && <span><CalendarDays size={14} />{details.schedule}</span>}
        </div>
        <div className="academy-program-footer">
          <strong>{displayedPrice}</strong>
          {details.perks && <small>{details.perks}</small>}
          {academy.phone && (
            <a className="academy-program-contact" href={`tel:${academy.phone}`}>
              Ask about this program
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function AcademyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const academy = await one<Academy>("SELECT * FROM academies WHERE id=$1", [id]);
  if (!academy || !academy.active) notFound();

  const [venues, packages, events] = await Promise.all([
    query<Venue>("SELECT * FROM venues WHERE academy_id=$1 AND active=TRUE ORDER BY name", [id]),
    query<Package>(
      "SELECT id,title,description,price,duration,image_url FROM academy_packages WHERE academy_id=$1 ORDER BY sort_order",
      [id],
    ).catch(() => []),
    query<Event>(
      "SELECT id,title,description,location,image_url,starts_at FROM academy_events WHERE academy_id=$1 AND status='PUBLISHED' AND starts_at>now() ORDER BY starts_at",
      [id],
    ).catch(() => []),
  ]);

  const sportText = academy.sports.join(" ").toLowerCase();
  const packageFallback = sportText.includes("basket")
    ? "/images/basketball.jpg"
    : sportText.includes("football")
      ? "/images/football.jpg"
      : "/images/tennis.jpg";
  const infinity = academy.name.toLowerCase().includes("infinity");
  const nonEmptyImages = packages.map((item) => item.image_url).filter(Boolean);
  const repeatedImage = infinity && new Set(nonEmptyImages).size === 1 && packages.length > 1;

  return (
    <main className="page">
      <div className="container">
        <div className="breadcrumb"><Link href="/academies">Academies</Link> / {academy.name}</div>
        <section className="academy-hero-card" aria-labelledby="academy-title">
          <div className="academy-hero-photo">
            <VenuePhoto src={academy.image_url} alt={`${academy.name} training facilities`} sizes="(max-width: 760px) 100vw, 52vw" />
          </div>
          <div className="academy-hero-copy">
            <span className="academy-kicker"><Sparkles size={14} />{academy.verified ? "Verified academy" : "Academy profile"}</span>
            <h1 id="academy-title">{academy.name} {academy.verified && <BadgeCheck size={22} aria-label="Verified" />}</h1>
            <p className="academy-hero-description">{academy.description}</p>
            <p className="academy-location"><MapPin size={16} />{academy.address || academy.area}</p>
            <div className="academy-sport-tags">{academy.sports.map((sport) => <span key={sport}>{sport}</span>)}</div>
            {academy.phone && <a className="btn btn-primary academy-hero-cta" href={`tel:${academy.phone}`}><Phone size={16} />Contact academy</a>}
          </div>
        </section>

        {(academy.phone || academy.email || academy.website) && (
          <div className="academy-contact-strip">
            {academy.phone && <a href={`tel:${academy.phone}`}><Phone size={15} />{academy.phone}</a>}
            {academy.email && <a href={`mailto:${academy.email}`}><Mail size={15} />{academy.email}</a>}
            {academy.website && <a href={academy.website} target="_blank" rel="noopener noreferrer">Visit official website ↗</a>}
          </div>
        )}

        {(packages.length > 0 || academy.training_packages.length > 0) && (
          <>
            <div className="section-head academy-section-head">
              <div>
                <span className="eyebrow muted">Find your fit</span>
                <h2>Training programs</h2>
                <p>Compare age groups, session plans, and schedules. Contact the academy to confirm current availability.</p>
              </div>
            </div>
      <div className="academy-legacy-packages academy-program-grid">
              {packages.length > 0
                ? packages.map((item, index) => {
                    const details = presentProgram(
                      [item.title, item.description].filter(Boolean).join("; "),
                      academy.sports[0] || "Academy training",
                    );
                    const image = repeatedImage
                      ? packagePhoto(item.title, index, academy, packageFallback)
                      : item.image_url || packagePhoto(item.title, index, academy, packageFallback);
                    return (
                      <ProgramCard
                        key={item.id}
                        details={{
                          ...details,
                          sessions: details.sessions || item.duration || undefined,
                        }}
                        image={image}
                        academy={academy}
                        price={item.price || undefined}
                        duration={details.sessions ? item.duration || undefined : undefined}
                      />
                    );
                  })
                : academy.training_packages.map((raw, index) => {
                    const details = presentProgram(raw, academy.sports[0] || "Academy training");
                    return (
                      <ProgramCard
                        key={`${raw}-${index}`}
                        details={details}
                        image={packagePhoto(raw, index, academy, packageFallback)}
                        academy={academy}
                      />
                    );
                  })}
            </div>
          </>
        )}

        {events.length > 0 && (
          <>
            <div className="section-head academy-section-head">
              <div><span className="eyebrow muted">Coming up</span><h2>Academy events</h2></div>
            </div>
            <div className="academy-events">
              {events.map((event) => (
                <article className="academy-event-card" key={event.id}>
                  <div className="academy-event-image">{event.image_url && <Image src={event.image_url} alt={event.title} fill sizes="30vw" />}</div>
                  <div className="academy-event-copy">
                    <span className="eyebrow muted">{new Date(event.starts_at).toLocaleString("en-JO", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Amman" })}</span>
                    <h3>{event.title}</h3>
                    {event.location && <strong><MapPin size={13} /> {event.location}</strong>}
                    {event.description && <p>{event.description}</p>}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {venues.length > 0 && (
          <>
            <div className="section-head academy-section-head">
              <div><span className="eyebrow muted">Places to play</span><h2>Courts and facilities</h2><p>Open a facility to see details, location and booking options.</p></div>
              <span className="academy-venue-count">{venues.length} {venues.length === 1 ? "facility" : "facilities"}</span>
            </div>
            <div className="academy-venue-list">
              {venues.map((venue, index) => (
                <details className="academy-venue-item" key={venue.id}>
                  <summary>
                    <span className="academy-venue-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="academy-venue-thumb"><VenuePhoto src={venue.image_url} alt="" sizes="72px" /></span>
                    <span className="academy-venue-summary"><strong>{venue.name}</strong><small><MapPin size={13} />{venue.area}</small></span>
                    <span className="academy-venue-open">View details <span aria-hidden="true">⌄</span></span>
                  </summary>
                  <div className="academy-venue-expanded">
                    <VenuePhoto src={venue.image_url} alt={`${venue.name} court`} sizes="(max-width: 760px) 100vw, 360px" />
                    <div><span className="eyebrow muted">Facility {String(index + 1).padStart(2, "0")}</span><h3>{venue.name}</h3><p>{venue.area}</p><Link className="btn btn-dark btn-small" href={`/venues/${venue.id}`}>Explore court →</Link></div>
                  </div>
                </details>
              ))}
            </div>
          </>
        )}

        {academy.source_url && <p className="academy-source"><a className="inline-link" href={academy.source_url} target="_blank" rel="noopener noreferrer">See official academy website ↗</a></p>}
      </div>
    </main>
  );
}
