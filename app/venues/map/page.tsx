import Link from "next/link";
import { Navigation, Star } from "lucide-react";
import { query } from "@/lib/db";

type Venue = {
  id: string;
  name: string;
  area: string;
  address: string;
  rating: number;
  latitude: number | null;
  longitude: number | null;
  sports: string[];
};

const verifiedAddressCoordinates: Record<string, { latitude: number; longitude: number }> = {
  "princess alia college, shemisani, amman, jordan": {
    latitude: 31.9648333,
    longitude: 35.8961111,
  },
};

function coordinatesFor(venue: Venue) {
  if (
    typeof venue.latitude === "number" &&
    Number.isFinite(venue.latitude) &&
    typeof venue.longitude === "number" &&
    Number.isFinite(venue.longitude)
  ) {
    return { latitude: venue.latitude, longitude: venue.longitude };
  }
  const address = venue.address.trim().toLocaleLowerCase("en");
  return verifiedAddressCoordinates[address] ?? null;
}

export default async function VenueMap() {
  const rows = await query<Venue>(
    "SELECT id,name,area,address,rating,latitude,longitude,sports FROM venues WHERE active=TRUE ORDER BY rating DESC",
  );
  const located = rows.flatMap((venue) => {
    const coordinates = coordinatesFor(venue);
    return coordinates ? [{ ...venue, ...coordinates }] : [];
  });

  let mapUrl: string | null = null;
  if (located.length) {
    const latitude = located.reduce((sum, venue) => sum + venue.latitude!, 0) / located.length;
    const longitude = located.reduce((sum, venue) => sum + venue.longitude!, 0) / located.length;
    const uniqueLocations = new Set(located.map((venue) => `${venue.latitude},${venue.longitude}`));
    const span = 0.06;
    const bbox = [longitude - span, latitude - span, longitude + span, latitude + span].join(",");
    const marker = uniqueLocations.size === 1 ? `&marker=${latitude},${longitude}` : "";
    mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik${marker}`;
  }

  return (
    <main className="page map-page">
      <div className="container">
        <div className="page-head">
          <span className="eyebrow muted">Near you</span>
          <h1>Venue map</h1>
          <p>View venues with verified map coordinates, then open directions or venue details.</p>
        </div>
        <div className="map-layout">
          <div className="map-canvas" aria-label="OpenStreetMap showing venues with known coordinates">
            {mapUrl ? (
              <iframe
                className="map-frame"
                src={mapUrl}
                title="Map of PlayUp venues"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="map-empty">
                <strong>No verified venue coordinates yet</strong>
                <span>Use a venue address to open directions while map locations are added.</span>
              </div>
            )}
            {located.length > 0 && (
              <span className="map-count">{located.length} venue{located.length === 1 ? "" : "s"} with coordinates</span>
            )}
          </div>
          <div className="map-list">
            {rows.map((venue, index) => (
              <article className="map-row" key={venue.id}>
                <span className="map-number">{index + 1}</span>
                <div>
                  <Link href={`/venues/${venue.id}`}><strong>{venue.name}</strong></Link>
                  <small>{venue.address || venue.area}</small>
                  <small>
                    {venue.sports.join(" · ")}
                    {Number(venue.rating) > 0 && <>
                      {venue.sports.length > 0 && " · "}
                      <Star size={11} fill="currentColor" /> {Number(venue.rating).toFixed(1)}
                    </>}
                    {!coordinatesFor(venue) ? " · Map coordinates unavailable" : ""}
                  </small>
                </div>
                <a
                  className="icon-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinatesFor(venue) ? `${coordinatesFor(venue)!.latitude},${coordinatesFor(venue)!.longitude}` : venue.address || venue.area)}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Directions to ${venue.name}`}
                >
                  <Navigation size={18} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
