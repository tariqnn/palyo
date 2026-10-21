"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

type PackageDraft = {
  title: string;
  description: string;
  price: string;
  duration: string;
  imageUrl: string;
};

type EventDraft = {
  title: string;
  startsAt: string;
  location: string;
  description: string;
  imageUrl: string;
};

const emptyPackage = (): PackageDraft => ({
  title: "",
  description: "",
  price: "",
  duration: "",
  imageUrl: "",
});

const emptyEvent = (): EventDraft => ({
  title: "",
  startsAt: "",
  location: "",
  description: "",
  imageUrl: "",
});

const photoChoices = [
  { value: "/images/football.jpg", label: "Football" },
  { value: "/images/basketball.jpg", label: "Basketball" },
  { value: "/images/dodgeball.jpg", label: "Dodgeball" },
  { value: "/images/tennis.jpg", label: "Tennis" },
  { value: "/images/hero-ground.jpg", label: "Stadium" },
  { value: "/images/infinity-sports/court_3x3.jpeg", label: "Infinity Sports · 3x3 basketball" },
  { value: "/images/infinity-sports/court_basketball_ac.jpeg", label: "Infinity Sports · indoor basketball" },
  { value: "/images/infinity-sports/court_padel.jpeg", label: "Infinity Sports · padel" },
  { value: "/images/infinity-sports/court_volleyball.jpeg", label: "Infinity Sports · volleyball" },
];

function jordanDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Amman",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return parts.replace(" ", "T");
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary academy-save-button" type="submit" disabled={pending}>
      {pending ? "Saving your academy page…" : "Save academy page"}
    </button>
  );
}

function PhotoPreview({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <div className="academy-editor-photo" aria-label={label}>
      {src && !failed ? (
        <img src={src} alt="" onError={() => setFailed(true)} />
      ) : (
        <span>{src ? "Photo could not load" : "No photo added"}</span>
      )}
    </div>
  );
}

function PhotoPicker({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedPreset = photoChoices.some((choice) => choice.value === value) ? value : "";

  return (
    <div className="form-field academy-photo-picker">
      <label htmlFor={id}>{label}</label>
      <select
        id={`${id}-preset`}
        aria-label={`Choose a PlayUp photo for ${label.toLowerCase()}`}
        value={selectedPreset}
        onChange={(event) => {
          if (event.target.value) onChange(event.target.value);
        }}
      >
        <option value="">Choose a PlayUp photo…</option>
        {photoChoices.map((choice) => (
          <option value={choice.value} key={choice.value}>{choice.label}</option>
        ))}
      </select>
      <input
        className="input"
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Or paste an images.unsplash.com link"
        maxLength={500}
        aria-describedby={`${id}-help`}
      />
      <small id={`${id}-help`}>Choose a photo above or paste a supported image link.</small>
      <PhotoPreview src={value} label={`${label} preview`} />
    </div>
  );
}

export function AcademyProfileEditor({
  action,
  academy,
  packages: initialPackages,
  events: initialEvents,
}: {
  action: (formData: FormData) => void | Promise<void>;
  academy: {
    name: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    imageUrl: string;
    sports: string;
  };
  packages: PackageDraft[];
  events: EventDraft[];
}) {
  const [packages, setPackages] = useState(
    initialPackages.length ? initialPackages : [],
  );
  const [events, setEvents] = useState(
    initialEvents.map((event) => ({ ...event, startsAt: jordanDateTime(event.startsAt) })),
  );
  const [coverUrl, setCoverUrl] = useState(academy.imageUrl);

  const updatePackage = (index: number, field: keyof PackageDraft, value: string) => {
    setPackages((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const updateEvent = (index: number, field: keyof EventDraft, value: string) => {
    setEvents((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  return (
    <form className="admin-panel admin-form academy-profile-form" action={action}>
      <section className="academy-editor-section" aria-labelledby="academy-details-title">
        <div className="academy-editor-heading">
          <div>
            <span className="eyebrow muted">Step 1 · Your public page</span>
            <h2 id="academy-details-title">Academy details</h2>
            <p>Help players recognize your academy and contact the right person.</p>
          </div>
          <span className="academy-editor-step">Profile</span>
        </div>
        <div className="grid-2">
          <div className="form-field">
            <label htmlFor="name">Academy name</label>
            <input className="input" id="name" name="name" defaultValue={academy.name} required maxLength={100} />
          </div>
          <PhotoPicker id="imageUrl" label="Cover photo" value={coverUrl} onChange={setCoverUrl} />
          <input type="hidden" name="imageUrl" value={coverUrl} />
        </div>
        <div className="form-field">
          <label htmlFor="description">About your academy</label>
          <textarea id="description" name="description" minLength={20} maxLength={2000} defaultValue={academy.description} required />
          <small>Tell players what you offer in a few clear sentences.</small>
        </div>
        <div className="grid-2">
          <div className="form-field">
            <label htmlFor="address">Location or address</label>
            <input className="input" id="address" name="address" defaultValue={academy.address} maxLength={200} />
          </div>
          <div className="form-field">
            <label htmlFor="sports">Sports you offer</label>
            <input className="input" id="sports" name="sports" defaultValue={academy.sports} placeholder="Football, basketball" />
            <small>Separate sports with commas.</small>
          </div>
        </div>
        <div className="grid-2">
          <div className="form-field">
            <label htmlFor="phone">Contact phone</label>
            <input className="input" id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={academy.phone} maxLength={30} />
          </div>
          <div className="form-field">
            <label htmlFor="email">Contact email</label>
            <input className="input" id="email" type="email" name="email" autoComplete="email" defaultValue={academy.email} required />
          </div>
        </div>
      </section>

      <section className="academy-editor-section" aria-labelledby="academy-packages-title">
        <div className="academy-editor-heading">
          <div>
            <span className="eyebrow muted">Step 2 · What players can join</span>
            <h2 id="academy-packages-title">Training packages</h2>
            <p>Each package appears as its own card. Add only the details you want players to see.</p>
          </div>
          <button
            className="btn btn-outline academy-add-button"
            type="button"
            onClick={() => setPackages((current) => [...current, emptyPackage()])}
            disabled={packages.length >= 30}
          >
            Add package
          </button>
        </div>
        <input type="hidden" name="packagesJson" value={JSON.stringify(packages)} />
        {packages.length === 0 ? (
          <div className="academy-editor-empty">
            <strong>No packages yet</strong>
            <span>Add a package so players can compare your training options.</span>
          </div>
        ) : (
          <div className="academy-editor-list">
            {packages.map((item, index) => (
              <fieldset className="academy-editor-card" key={`package-${index}`}>
                <legend>Package {index + 1}</legend>
                <button
                  className="academy-remove-button"
                  type="button"
                  onClick={() => setPackages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  aria-label={`Remove package ${item.title || index + 1}`}
                >
                  Remove
                </button>
                <div className="grid-2">
                  <div className="form-field">
                    <label htmlFor={`package-title-${index}`}>Package name</label>
                    <input className="input" id={`package-title-${index}`} value={item.title} onChange={(event) => updatePackage(index, "title", event.target.value)} required maxLength={100} />
                  </div>
                  <div className="grid-2 academy-package-meta-fields">
                    <div className="form-field">
                      <label htmlFor={`package-price-${index}`}>Price</label>
                      <input className="input" id={`package-price-${index}`} value={item.price} onChange={(event) => updatePackage(index, "price", event.target.value)} placeholder="e.g. 35 JD" maxLength={60} />
                    </div>
                    <div className="form-field">
                      <label htmlFor={`package-duration-${index}`}>Duration</label>
                      <input className="input" id={`package-duration-${index}`} value={item.duration} onChange={(event) => updatePackage(index, "duration", event.target.value)} placeholder="e.g. 8 sessions" maxLength={60} />
                    </div>
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor={`package-description-${index}`}>What is included?</label>
                  <textarea id={`package-description-${index}`} value={item.description} onChange={(event) => updatePackage(index, "description", event.target.value)} maxLength={500} placeholder="Describe the sessions, level, or equipment included." />
                </div>
                <PhotoPicker
                  id={`package-image-${index}`}
                  label="Package photo"
                  value={item.imageUrl}
                  onChange={(value) => updatePackage(index, "imageUrl", value)}
                />
              </fieldset>
            ))}
          </div>
        )}
      </section>

      <section className="academy-editor-section" aria-labelledby="academy-events-title">
        <div className="academy-editor-heading">
          <div>
            <span className="eyebrow muted">Step 3 · What is coming up</span>
            <h2 id="academy-events-title">Events</h2>
            <p>Publish a trial, camp, or open day. Dates are shown in Jordan time.</p>
          </div>
          <button
            className="btn btn-outline academy-add-button"
            type="button"
            onClick={() => setEvents((current) => [...current, emptyEvent()])}
            disabled={events.length >= 30}
          >
            Add event
          </button>
        </div>
        <input type="hidden" name="eventsJson" value={JSON.stringify(events)} />
        {events.length === 0 ? (
          <div className="academy-editor-empty">
            <strong>No events scheduled</strong>
            <span>Add an event when you are ready to invite players.</span>
          </div>
        ) : (
          <div className="academy-editor-list">
            {events.map((item, index) => (
              <fieldset className="academy-editor-card" key={`event-${index}`}>
                <legend>Event {index + 1}</legend>
                <button
                  className="academy-remove-button"
                  type="button"
                  onClick={() => setEvents((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  aria-label={`Remove event ${item.title || index + 1}`}
                >
                  Remove
                </button>
                <div className="grid-2">
                  <div className="form-field">
                    <label htmlFor={`event-title-${index}`}>Event name</label>
                    <input className="input" id={`event-title-${index}`} value={item.title} onChange={(event) => updateEvent(index, "title", event.target.value)} required maxLength={100} />
                  </div>
                  <div className="form-field">
                    <label htmlFor={`event-date-${index}`}>Date and time (Jordan)</label>
                    <input className="input" id={`event-date-${index}`} type="datetime-local" value={item.startsAt} onChange={(event) => updateEvent(index, "startsAt", event.target.value)} required />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-field">
                    <label htmlFor={`event-location-${index}`}>Location</label>
                    <input className="input" id={`event-location-${index}`} value={item.location} onChange={(event) => updateEvent(index, "location", event.target.value)} placeholder="Academy training ground" maxLength={200} />
                  </div>
                  <PhotoPicker
                    id={`event-image-${index}`}
                    label="Event photo"
                    value={item.imageUrl}
                    onChange={(value) => updateEvent(index, "imageUrl", value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`event-description-${index}`}>Event details</label>
                  <textarea id={`event-description-${index}`} value={item.description} onChange={(event) => updateEvent(index, "description", event.target.value)} maxLength={500} placeholder="Who can join, what to bring, and how to register." />
                </div>
              </fieldset>
            ))}
          </div>
        )}
      </section>

      <SubmitButton />
    </form>
  );
}
