"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Compass,
  ExternalLink,
  Eye,
  GraduationCap,
  Image as ImageIcon,
  Layout,
  MapPin,
  Megaphone,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  Trophy,
  Type,
  Users,
  MessageSquare,
} from "lucide-react";
import type { SiteConfig } from "@/lib/site-editor";
import { saveSiteConfigAction, resetSiteConfigAction } from "@/app/actions";

const CURATED_IMAGES = [
  { label: "Night Stadium", url: "/images/hero-ground.jpg" },
  { label: "Football Field", url: "/images/football.jpg" },
  { label: "Basketball Court", url: "/images/basketball.jpg" },
  { label: "Tennis Clay/Hard", url: "/images/tennis.jpg" },
  { label: "Indoor Dodgeball", url: "/images/dodgeball.jpg" },
  { label: "Turf Under Lights", url: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1600&q=80" },
  { label: "Basketball Arena", url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&q=80" },
  { label: "Sunny Tennis Court", url: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1600&q=80" },
];

const ACCENT_COLORS = [
  { label: "PlayUp Emerald", hex: "#22e879" },
  { label: "Electric Lime", hex: "#10b981" },
  { label: "Ocean Blue", hex: "#0ea5e9" },
  { label: "Deep Indigo", hex: "#6366f1" },
  { label: "Electric Violet", hex: "#a855f7" },
  { label: "Solar Amber", hex: "#f59e0b" },
  { label: "Fiery Coral", hex: "#f43f5e" },
];

const CONTENT_AREAS = [
  { href: "/admin/games", title: "Matches & scores", description: "Create matches, edit schedules, assign staff, and manage results.", icon: CalendarDays },
  { href: "/admin/venues", title: "Courts & venues", description: "Edit venue copy, photos, pricing, facilities, and visibility.", icon: MapPin },
  { href: "/admin/academies", title: "Academies", description: "Manage profiles, programs, coaches, contact details, and listings.", icon: GraduationCap },
  { href: "/admin/activities", title: "Adventures", description: "Edit experiences, imagery, capacity, pricing, and publishing state.", icon: Compass },
  { href: "/admin/tournaments", title: "Tournaments", description: "Control competitions, dates, formats, brackets, and standings.", icon: Trophy },
  { href: "/admin/community", title: "Community content", description: "Review posts, comments, and user-generated content.", icon: MessageSquare },
  { href: "/admin/users", title: "Members & permissions", description: "Manage accounts, staff roles, status, and access levels.", icon: Users },
];

function hasSiteConfigShape(value: unknown): value is SiteConfig {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return ["brand", "announcement", "hero", "sports", "sections", "staticPages", "theme"]
    .every((key) => candidate[key] && typeof candidate[key] === "object");
}

function PublishButton({ compact = false, disabled = false }: { compact?: boolean; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className={`btn btn-primary${compact ? " btn-small" : ""}`} type="submit" disabled={pending || disabled}>
      <Save size={compact ? 14 : 15} /> {pending ? "Publishing…" : compact ? "Publish changes" : "Save & publish"}
    </button>
  );
}

function ResetButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-outline btn-small" type="submit" disabled={pending} title="Reset editable website copy and media to defaults">
      <RotateCcw size={14} /> {pending ? "Restoring…" : "Reset defaults"}
    </button>
  );
}

export function SiteEditorForm({ initialConfig }: { initialConfig: SiteConfig }) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<"content" | "hero" | "media" | "layout" | "brand" | "static" | "json">("content");
  const [isDirty, setIsDirty] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(initialConfig, null, 2));
  const [jsonError, setJsonError] = useState("");

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const updateField = (path: string, value: unknown) => {
    setIsDirty(true);
    setConfig((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let current = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return copy;
    });
  };

  const updateAccent = (value: string) => {
    updateField("brand.accentColor", value);
    updateField("theme.primaryColor", value);
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      setJsonError("Your browser blocked clipboard access. Select the JSON and copy it manually.");
    }
  };

  const applyJsonDraft = () => {
    try {
      const parsed: unknown = JSON.parse(jsonDraft);
      if (!hasSiteConfigShape(parsed)) throw new Error("Missing configuration groups");
      setConfig(parsed);
      setIsDirty(true);
      setJsonError("");
    } catch {
      setJsonError("The JSON is not valid yet. Fix the highlighted configuration before applying it.");
    }
  };

  return (
    <div className="site-editor">
      {/* Top Action & Status Bar */}
      <div className="editor-topbar">
        <div className="editor-title-group">
          <div className="editor-badge-row">
            <span className="badge badge-green">OWNER STUDIO</span>
            {isDirty ? (
              <span className="badge badge-amber" style={{ background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}>
                <AlertTriangle size={12} /> Unsaved changes
              </span>
            ) : (
              <span className="badge" style={{ background: "#f0fdf4", color: "#166534", borderColor: "#bbf7d0" }}>
                <Check size={12} /> Synced with live site
              </span>
            )}
          </div>
          <h2>Website owner studio</h2>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Control public content, homepage copy, imagery, branding, contacts, and section visibility from one workspace.
          </p>
        </div>

        <div className="editor-actions">
          <Link className="btn btn-outline btn-small" href="/" target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> View Live Site
          </Link>

          <form action={resetSiteConfigAction} onSubmit={(e) => {
            if (!confirm("Are you sure you want to restore all website content to factory defaults?")) {
              e.preventDefault();
            }
          }}>
            <ResetButton />
          </form>

          <form action={saveSiteConfigAction}>
            <input type="hidden" name="configJson" value={JSON.stringify(config)} />
            <PublishButton compact disabled={!isDirty} />
          </form>
        </div>
      </div>

      {/* Tabs */}
      <div className="editor-tabs" role="tablist" aria-label="Owner studio sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "content"}
          className={`editor-tab ${activeTab === "content" ? "active" : ""}`}
          onClick={() => setActiveTab("content")}
        >
          <Layout size={16} /> Content hub
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "hero"}
          className={`editor-tab ${activeTab === "hero" ? "active" : ""}`}
          onClick={() => setActiveTab("hero")}
        >
          <Megaphone size={16} /> Hero & Announcement
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "media"}
          className={`editor-tab ${activeTab === "media" ? "active" : ""}`}
          onClick={() => setActiveTab("media")}
        >
          <ImageIcon size={16} /> Photos & Visuals
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "layout"}
          className={`editor-tab ${activeTab === "layout" ? "active" : ""}`}
          onClick={() => setActiveTab("layout")}
        >
          <Layout size={16} /> Layout & Sections
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "brand"}
          className={`editor-tab ${activeTab === "brand" ? "active" : ""}`}
          onClick={() => setActiveTab("brand")}
        >
          <Palette size={16} /> Brand & Contacts
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "static"}
          className={`editor-tab ${activeTab === "static" ? "active" : ""}`}
          onClick={() => setActiveTab("static")}
        >
          <Type size={16} /> About & Copy
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "json"}
          className={`editor-tab ${activeTab === "json" ? "active" : ""}`}
          onClick={() => { setJsonDraft(JSON.stringify(config, null, 2)); setJsonError(""); setActiveTab("json"); }}
        >
          <Sparkles size={16} /> Raw JSON / Backup
        </button>
      </div>

      {activeTab === "content" && (
        <div className="editor-section" role="tabpanel">
          <div className="card editor-card owner-hub-intro">
            <div>
              <span className="eyebrow muted">Full platform control</span>
              <h3>Choose what you want to manage</h3>
              <p className="muted">Use the visual editor tabs for global website presentation. Use the operational modules below for the records that power every listing page.</p>
            </div>
            <Link className="btn btn-outline" href="/admin/activity">View staff activity</Link>
          </div>
          <div className="owner-content-grid">
            {CONTENT_AREAS.map(({ href, title, description, icon: Icon }) => (
              <Link className="owner-content-card" href={href} key={href}>
                <span className="owner-content-icon"><Icon size={20} /></span>
                <span><strong>{title}</strong><small>{description}</small></span>
                <ExternalLink size={16} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: HERO & ANNOUNCEMENT */}
      {activeTab === "hero" && (
        <div className="editor-section" role="tabpanel">
          {/* Announcement Bar */}
          <div className="card editor-card">
            <div className="editor-card-header">
              <div>
                <h3>Top Announcement Bar</h3>
                <p className="muted">Sticky promotional banner at the top of every page.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.announcement.enabled}
                  onChange={(e) => updateField("announcement.enabled", e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">{config.announcement.enabled ? "ACTIVE" : "HIDDEN"}</span>
              </label>
            </div>

            {config.announcement.enabled && (
              <div className="editor-fields-grid">
                <div className="form-field full-width">
                  <label>Announcement Message</label>
                  <input
                    className="input"
                    value={config.announcement.text}
                    onChange={(e) => updateField("announcement.text", e.target.value)}
                    placeholder="e.g. 🔥 Amman Champions League Season 2 is now open!"
                  />
                </div>
                <div className="form-field">
                  <label>Destination Link (URL or page path)</label>
                  <input
                    className="input"
                    value={config.announcement.link}
                    onChange={(e) => updateField("announcement.link", e.target.value)}
                    placeholder="/tournaments or https://..."
                  />
                </div>
                <div className="form-field">
                  <label>Link Button Label</label>
                  <input
                    className="input"
                    value={config.announcement.linkLabel}
                    onChange={(e) => updateField("announcement.linkLabel", e.target.value)}
                    placeholder="e.g. Register Now →"
                  />
                </div>
                <div className="form-field">
                  <label>Banner Background Color</label>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      type="color"
                      value={config.announcement.bgColor}
                      onChange={(e) => updateField("announcement.bgColor", e.target.value)}
                      style={{ width: 44, height: 38, border: "1px solid var(--line)", borderRadius: 6, cursor: "pointer" }}
                    />
                    <input
                      className="input"
                      value={config.announcement.bgColor}
                      onChange={(e) => updateField("announcement.bgColor", e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label>Banner Text Color</label>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      type="color"
                      value={config.announcement.textColor}
                      onChange={(e) => updateField("announcement.textColor", e.target.value)}
                      style={{ width: 44, height: 38, border: "1px solid var(--line)", borderRadius: 6, cursor: "pointer" }}
                    />
                    <input
                      className="input"
                      value={config.announcement.textColor}
                      onChange={(e) => updateField("announcement.textColor", e.target.value)}
                    />
                  </div>
                </div>

                {/* Live Announcement Preview */}
                <div className="full-width" style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6, display: "block" }}>
                    Live Banner Preview
                  </label>
                  <div style={{
                    background: config.announcement.bgColor,
                    color: config.announcement.textColor,
                    padding: "10px 18px",
                    borderRadius: 6,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    <span>{config.announcement.text || "Announcement preview message"}</span>
                    {config.announcement.linkLabel && (
                      <span style={{ textDecoration: "underline", marginLeft: 15 }}>{config.announcement.linkLabel}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hero Section */}
          <div className="card editor-card">
            <div className="editor-card-header">
              <div>
                <h3>Homepage Hero Banner</h3>
                <p className="muted">The main visual showcase at the top of the homepage.</p>
              </div>
            </div>

            <div className="editor-fields-grid">
              <div className="form-field">
                <label>Top Eyebrow Badge</label>
                <input
                  className="input"
                  value={config.hero.eyebrow}
                  onChange={(e) => updateField("hero.eyebrow", e.target.value)}
                  placeholder="e.g. The game starts here"
                />
              </div>

              <div className="form-field">
                <label>Headline Line 1</label>
                <input
                  className="input"
                  value={config.hero.titleLine1}
                  onChange={(e) => updateField("hero.titleLine1", e.target.value)}
                  placeholder="e.g. DON'T HAVE A TEAM?"
                />
              </div>

              <div className="form-field full-width">
                <label>Headline Line 2 (Highlighted Text)</label>
                <input
                  className="input"
                  value={config.hero.titleLine2}
                  onChange={(e) => updateField("hero.titleLine2", e.target.value)}
                  placeholder="e.g. JUST PLAY."
                />
              </div>

              <div className="form-field full-width">
                <label>Hero Subtitle / Description Copy</label>
                <textarea
                  className="input"
                  rows={3}
                  value={config.hero.copy}
                  onChange={(e) => updateField("hero.copy", e.target.value)}
                  placeholder="Descriptive copy welcoming visitors..."
                />
              </div>

              <div className="form-field">
                <label>Primary Button Text</label>
                <input
                  className="input"
                  value={config.hero.primaryBtnText}
                  onChange={(e) => updateField("hero.primaryBtnText", e.target.value)}
                  placeholder="e.g. Find a Game"
                />
              </div>

              <div className="form-field">
                <label>Primary Button Link</label>
                <input
                  className="input"
                  value={config.hero.primaryBtnLink}
                  onChange={(e) => updateField("hero.primaryBtnLink", e.target.value)}
                  placeholder="/games"
                />
              </div>

              <div className="form-field">
                <label>Secondary Button Text</label>
                <input
                  className="input"
                  value={config.hero.secondaryBtnText}
                  onChange={(e) => updateField("hero.secondaryBtnText", e.target.value)}
                  placeholder="e.g. How It Works"
                />
              </div>

              <div className="form-field">
                <label>Secondary Button Link</label>
                <input
                  className="input"
                  value={config.hero.secondaryBtnLink}
                  onChange={(e) => updateField("hero.secondaryBtnLink", e.target.value)}
                  placeholder="#how-it-works"
                />
              </div>

              {/* Hero Image Selection */}
              <div className="form-field full-width">
                <label>Hero Background Photo URL</label>
                <input
                  className="input"
                  value={config.hero.imageUrl}
                  onChange={(e) => updateField("hero.imageUrl", e.target.value)}
                  placeholder="/images/hero-ground.jpg or https://..."
                />

                <div className="preset-row">
                  <span className="muted" style={{ fontSize: 12 }}>Curated Presets:</span>
                  {CURATED_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      className="btn btn-outline btn-small preset-pill"
                      onClick={() => updateField("hero.imageUrl", img.url)}
                    >
                      {img.label}
                    </button>
                  ))}
                </div>

                {/* Hero Preview Box */}
                <div className="media-preview-box" style={{ height: 200, marginTop: 12 }}>
                  {config.hero.imageUrl && (
                    <Image src={config.hero.imageUrl} alt="Hero preview" fill sizes="(max-width: 768px) 100vw, 720px" />
                  )}
                  <div className="media-preview-overlay">
                    <span style={{ color: config.brand.accentColor, fontSize: 12, fontWeight: 700 }}>{config.hero.eyebrow}</span>
                    <h4 style={{ color: "#fff", margin: "4px 0", fontSize: 20 }}>
                      {config.hero.titleLine1} <span style={{ color: config.brand.accentColor }}>{config.hero.titleLine2}</span>
                    </h4>
                    <p style={{ color: "#d1d5db", fontSize: 11, maxWidth: 400, margin: 0 }}>
                      {config.hero.copy.slice(0, 110)}...
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHOTOS & VISUALS */}
      {activeTab === "media" && (
        <div className="editor-section">
          <div className="card editor-card">
            <div className="editor-card-header">
              <div>
                <h3>Sport Category Tiles</h3>
                <p className="muted">The visual cards shown directly beneath the hero for quick sport selection.</p>
              </div>
            </div>

            <div className="sport-cards-editor-grid">
              {Object.entries(config.sports).map(([key, sport]) => (
                <div className="card sport-card-item" key={key}>
                  <div className="sport-card-preview">
                    {sport.imageUrl && <Image src={sport.imageUrl} alt={`${sport.title} tile preview`} fill sizes="(max-width: 768px) 100vw, 360px" />}
                    <div className="sport-card-badge">
                      <label className="toggle-switch small">
                        <input
                          type="checkbox"
                          checked={sport.enabled}
                          onChange={(e) => updateField(`sports.${key}.enabled`, e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="sport-card-fields">
                    <div className="form-field">
                      <label>Sport Title</label>
                      <input
                        className="input"
                        value={sport.title}
                        onChange={(e) => updateField(`sports.${key}.title`, e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label>Subtitle Tagline</label>
                      <input
                        className="input"
                        value={sport.subtitle}
                        onChange={(e) => updateField(`sports.${key}.subtitle`, e.target.value)}
                      />
                    </div>

                    <div className="form-field full-width">
                      <label>Photo URL</label>
                      <input
                        className="input"
                        value={sport.imageUrl}
                        onChange={(e) => updateField(`sports.${key}.imageUrl`, e.target.value)}
                        placeholder="/images/sport.jpg or https://..."
                      />
                    </div>

                    <div className="preset-row">
                      {CURATED_IMAGES.slice(0, 4).map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          className="btn btn-outline btn-small preset-pill-micro"
                          onClick={() => updateField(`sports.${key}.imageUrl`, p.url)}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action Banner Image */}
          <div className="card editor-card">
            <div className="editor-card-header">
              <div>
                <h3>Bottom Call-To-Action Banner Photo</h3>
                <p className="muted">Background imagery for the footer banner prompting users to sign up.</p>
              </div>
            </div>

            <div className="editor-fields-grid">
              <div className="form-field full-width">
                <label>Background Image URL</label>
                <input
                  className="input"
                  value={config.sections.ctaImage}
                  onChange={(e) => updateField("sections.ctaImage", e.target.value)}
                />
              </div>

              <div className="preset-row full-width">
                {CURATED_IMAGES.map((img) => (
                  <button
                    key={img.label}
                    type="button"
                    className="btn btn-outline btn-small preset-pill"
                    onClick={() => updateField("sections.ctaImage", img.url)}
                  >
                    {img.label}
                  </button>
                ))}
              </div>

              <div className="full-width media-preview-box" style={{ height: 160 }}>
                {config.sections.ctaImage && <Image src={config.sections.ctaImage} alt="Call-to-action banner preview" fill sizes="(max-width: 768px) 100vw, 720px" />}
                <div className="media-preview-overlay">
                  <h4 style={{ color: "#fff", margin: 0 }}>{config.sections.ctaTitle}</h4>
                  <p style={{ color: "#d1d5db", fontSize: 12, margin: "4px 0 0" }}>{config.sections.ctaSubtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LAYOUT & SECTIONS */}
      {activeTab === "layout" && (
        <div className="editor-section">
          <div className="card editor-card">
            <div className="editor-card-header">
              <div>
                <h3>Homepage Section Visibility & Order</h3>
                <p className="muted">Turn entire sections on or off, edit their titles, and customize item limits.</p>
              </div>
            </div>

            <div className="section-switches-list">
              {/* Section: Announcement */}
              <div className="section-switch-row">
                <div className="section-switch-meta">
                  <strong>Top Announcement Bar</strong>
                  <small>Pinned promotional bar for tournaments and events.</small>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.sections.showAnnouncement}
                    onChange={(e) => updateField("sections.showAnnouncement", e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Section: Hero */}
              <div className="section-switch-row">
                <div className="section-switch-meta">
                  <strong>Main Hero Showcase</strong>
                  <small>High-impact headline, description, search buttons, and background graphic.</small>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.sections.showHero}
                    onChange={(e) => updateField("sections.showHero", e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Section: Sport Tiles Strip */}
              <div className="section-switch-row">
                <div className="section-switch-meta">
                  <strong>Sports Quick Strip</strong>
                  <small>Football, Basketball, Dodgeball, and Tennis category cards.</small>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.sections.showSportStrip}
                    onChange={(e) => updateField("sections.showSportStrip", e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Section: Upcoming Matches */}
              <div className="section-switch-row expanded">
                <div className="section-switch-header">
                  <div className="section-switch-meta">
                    <strong>Upcoming Games & Matches Grid</strong>
                    <small>Live open pickup matches ready for booking.</small>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={config.sections.showMatches}
                      onChange={(e) => updateField("sections.showMatches", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {config.sections.showMatches && (
                  <div className="section-subfields">
                    <div className="form-field">
                      <label>Section Eyebrow</label>
                      <input
                        className="input"
                        value={config.sections.matchesEyebrow}
                        onChange={(e) => updateField("sections.matchesEyebrow", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Section Heading</label>
                      <input
                        className="input"
                        value={config.sections.matchesTitle}
                        onChange={(e) => updateField("sections.matchesTitle", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Display Count</label>
                      <select
                        className="input"
                        value={config.sections.matchesCount}
                        onChange={(e) => updateField("sections.matchesCount", Number(e.target.value))}
                      >
                        <option value={3}>3 Matches</option>
                        <option value={6}>6 Matches</option>
                        <option value={9}>9 Matches</option>
                        <option value={12}>12 Matches</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Section: How It Works */}
              <div className="section-switch-row expanded">
                <div className="section-switch-header">
                  <div className="section-switch-meta">
                    <strong>&quot;How PlayUp Works&quot; Steps</strong>
                    <small>Explainer cards walking new visitors through the booking and match process.</small>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={config.sections.showHowItWorks}
                      onChange={(e) => updateField("sections.showHowItWorks", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {config.sections.showHowItWorks && (
                  <div className="section-subfields">
                    <div className="form-field full-width">
                      <label>Section Title</label>
                      <input
                        className="input"
                        value={config.sections.howTitle}
                        onChange={(e) => updateField("sections.howTitle", e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label>Step 1 Title</label>
                      <input
                        className="input"
                        value={config.sections.howStep1Title}
                        onChange={(e) => updateField("sections.howStep1Title", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Step 1 Description</label>
                      <input
                        className="input"
                        value={config.sections.howStep1Desc}
                        onChange={(e) => updateField("sections.howStep1Desc", e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label>Step 2 Title</label>
                      <input
                        className="input"
                        value={config.sections.howStep2Title}
                        onChange={(e) => updateField("sections.howStep2Title", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Step 2 Description</label>
                      <input
                        className="input"
                        value={config.sections.howStep2Desc}
                        onChange={(e) => updateField("sections.howStep2Desc", e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label>Step 3 Title</label>
                      <input
                        className="input"
                        value={config.sections.howStep3Title}
                        onChange={(e) => updateField("sections.howStep3Title", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Step 3 Description</label>
                      <input
                        className="input"
                        value={config.sections.howStep3Desc}
                        onChange={(e) => updateField("sections.howStep3Desc", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Popular Venues */}
              <div className="section-switch-row expanded">
                <div className="section-switch-header">
                  <div className="section-switch-meta">
                    <strong>Popular Venues & Facilities</strong>
                    <small>Featured sports centers across Amman.</small>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={config.sections.showVenues}
                      onChange={(e) => updateField("sections.showVenues", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {config.sections.showVenues && (
                  <div className="section-subfields">
                    <div className="form-field">
                      <label>Section Eyebrow</label>
                      <input
                        className="input"
                        value={config.sections.venuesEyebrow}
                        onChange={(e) => updateField("sections.venuesEyebrow", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Section Heading</label>
                      <input
                        className="input"
                        value={config.sections.venuesTitle}
                        onChange={(e) => updateField("sections.venuesTitle", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Top Academies */}
              <div className="section-switch-row expanded">
                <div className="section-switch-header">
                  <div className="section-switch-meta">
                    <strong>Sports Academies Showcase</strong>
                    <small>Highlight accredited training academies on homepage.</small>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={config.sections.showAcademies}
                      onChange={(e) => updateField("sections.showAcademies", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {config.sections.showAcademies && (
                  <div className="section-subfields">
                    <div className="form-field">
                      <label>Section Eyebrow</label>
                      <input
                        className="input"
                        value={config.sections.academiesEyebrow}
                        onChange={(e) => updateField("sections.academiesEyebrow", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Section Heading</label>
                      <input
                        className="input"
                        value={config.sections.academiesTitle}
                        onChange={(e) => updateField("sections.academiesTitle", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Outdoor Adventures */}
              <div className="section-switch-row expanded">
                <div className="section-switch-header">
                  <div className="section-switch-meta">
                    <strong>Outdoor Adventures Showcase</strong>
                    <small>Jordan outdoor hikes, kayaking, and climbing trips.</small>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={config.sections.showAdventures}
                      onChange={(e) => updateField("sections.showAdventures", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {config.sections.showAdventures && (
                  <div className="section-subfields">
                    <div className="form-field">
                      <label>Section Eyebrow</label>
                      <input
                        className="input"
                        value={config.sections.adventuresEyebrow}
                        onChange={(e) => updateField("sections.adventuresEyebrow", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Section Heading</label>
                      <input
                        className="input"
                        value={config.sections.adventuresTitle}
                        onChange={(e) => updateField("sections.adventuresTitle", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Bottom CTA Banner */}
              <div className="section-switch-row expanded">
                <div className="section-switch-header">
                  <div className="section-switch-meta">
                    <strong>Bottom Call-To-Action Banner</strong>
                    <small>Full-width banner inviting visitors to register an account.</small>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={config.sections.showCtaBanner}
                      onChange={(e) => updateField("sections.showCtaBanner", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {config.sections.showCtaBanner && (
                  <div className="section-subfields">
                    <div className="form-field">
                      <label>Banner Headline</label>
                      <input
                        className="input"
                        value={config.sections.ctaTitle}
                        onChange={(e) => updateField("sections.ctaTitle", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Banner Subtitle</label>
                      <input
                        className="input"
                        value={config.sections.ctaSubtitle}
                        onChange={(e) => updateField("sections.ctaSubtitle", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Button Label</label>
                      <input
                        className="input"
                        value={config.sections.ctaBtnText}
                        onChange={(e) => updateField("sections.ctaBtnText", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Button Link</label>
                      <input
                        className="input"
                        value={config.sections.ctaBtnLink}
                        onChange={(e) => updateField("sections.ctaBtnLink", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BRAND & CONTACTS */}
      {activeTab === "brand" && (
        <div className="editor-section">
          <div className="card editor-card">
            <div className="editor-card-header">
              <div>
                <h3>Brand Identity & Theme</h3>
                <p className="muted">Global styling, platform name, currency, and brand color palette.</p>
              </div>
            </div>

            <div className="editor-fields-grid">
              <div className="form-field">
                <label>Platform / Brand Name</label>
                <input
                  className="input"
                  value={config.brand.name}
                  onChange={(e) => updateField("brand.name", e.target.value)}
                  placeholder="PlayUp"
                />
              </div>

              <div className="form-field">
                <label>Tagline / Slogan</label>
                <input
                  className="input"
                  value={config.brand.tagline}
                  onChange={(e) => updateField("brand.tagline", e.target.value)}
                  placeholder="Find your game. Play your sport."
                />
              </div>

              <div className="form-field">
                <label>Currency Symbol</label>
                <input
                  className="input"
                  value={config.brand.currencySymbol}
                  onChange={(e) => updateField("brand.currencySymbol", e.target.value)}
                  placeholder="JD"
                />
              </div>

              {/* Accent Color Picker */}
              <div className="form-field">
                <label>Brand Accent Color</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="color"
                    value={config.brand.accentColor}
                    onChange={(e) => updateAccent(e.target.value)}
                    style={{ width: 44, height: 38, border: "1px solid var(--line)", borderRadius: 6, cursor: "pointer" }}
                  />
                  <input
                    className="input"
                    value={config.brand.accentColor}
                    onChange={(e) => updateAccent(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field full-width">
                <label>Preset Color Palettes</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      className="color-swatch-btn"
                      style={{
                        border: config.brand.accentColor === c.hex ? "2px solid #000" : "1px solid var(--line)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 12px",
                        borderRadius: 20,
                        background: "#fff",
                        cursor: "pointer"
                      }}
                      onClick={() => updateAccent(c.hex)}
                    >
                      <span style={{ width: 16, height: 16, borderRadius: "50%", background: c.hex, display: "inline-block" }}></span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="owner-font-scale">Interface density</label>
                <select id="owner-font-scale" value={config.theme.fontScale} onChange={(e) => updateField("theme.fontScale", e.target.value)}>
                  <option value="compact">Compact</option>
                  <option value="normal">Comfortable</option>
                  <option value="large">Large text</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="owner-card-style">Card appearance</label>
                <select id="owner-card-style" value={config.theme.cardStyle} onChange={(e) => updateField("theme.cardStyle", e.target.value)}>
                  <option value="modern">Modern rounded</option>
                  <option value="classic">Classic compact</option>
                  <option value="minimal">Minimal flat</option>
                </select>
              </div>
            </div>
          </div>

          {/* Official Contact Details */}
          <div className="card editor-card">
            <div className="editor-card-header">
              <div>
                <h3>Official Contact Details</h3>
                <p className="muted">Public customer support and partnership contact information.</p>
              </div>
            </div>

            <div className="editor-fields-grid">
              <div className="form-field">
                <label>Customer Support Email</label>
                <input
                  className="input"
                  value={config.brand.supportEmail}
                  onChange={(e) => updateField("brand.supportEmail", e.target.value)}
                  placeholder="support@playup.jo"
                />
              </div>

              <div className="form-field">
                <label>Phone Number</label>
                <input
                  className="input"
                  value={config.brand.contactPhone}
                  onChange={(e) => updateField("brand.contactPhone", e.target.value)}
                  placeholder="+962 7 9000 0000"
                />
              </div>

              <div className="form-field">
                <label>WhatsApp Number</label>
                <input
                  className="input"
                  value={config.brand.whatsappNumber}
                  onChange={(e) => updateField("brand.whatsappNumber", e.target.value)}
                  placeholder="+962 7 9000 0000"
                />
              </div>

              <div className="form-field">
                <label>Office Address</label>
                <input
                  className="input"
                  value={config.brand.officeAddress}
                  onChange={(e) => updateField("brand.officeAddress", e.target.value)}
                  placeholder="Amman, Jordan"
                />
              </div>

              <div className="form-field">
                <label>Instagram URL</label>
                <input
                  className="input"
                  value={config.brand.instagramUrl || ""}
                  onChange={(e) => updateField("brand.instagramUrl", e.target.value)}
                  placeholder="https://instagram.com/playup"
                />
              </div>

              <div className="form-field">
                <label>X (Twitter) URL</label>
                <input
                  className="input"
                  value={config.brand.xUrl || ""}
                  onChange={(e) => updateField("brand.xUrl", e.target.value)}
                  placeholder="https://x.com/playup"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ABOUT & STATIC PAGES */}
      {activeTab === "static" && (
        <div className="editor-section">
          <div className="card editor-card">
            <div className="editor-card-header">
              <div>
                <h3>About Us & Company Story</h3>
                <p className="muted">Text displayed on the /about page.</p>
              </div>
            </div>

            <div className="editor-fields-grid">
              <div className="form-field full-width">
                <label>About Page Headline</label>
                <input
                  className="input"
                  value={config.staticPages.aboutHeroTitle}
                  onChange={(e) => updateField("staticPages.aboutHeroTitle", e.target.value)}
                />
              </div>

              <div className="form-field full-width">
                <label>Company Story & Narrative</label>
                <textarea
                  className="input"
                  rows={4}
                  value={config.staticPages.aboutHeroBody}
                  onChange={(e) => updateField("staticPages.aboutHeroBody", e.target.value)}
                />
              </div>

              <div className="form-field full-width">
                <label>Company Mission Statement</label>
                <textarea
                  className="input"
                  rows={2}
                  value={config.staticPages.aboutMission}
                  onChange={(e) => updateField("staticPages.aboutMission", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card editor-card">
            <div className="editor-card-header">
              <div>
                <h3>Contact & Support Page Copy</h3>
                <p className="muted">Text displayed on /contact and /support.</p>
              </div>
            </div>

            <div className="editor-fields-grid">
              <div className="form-field full-width">
                <label>Contact Page Headline</label>
                <input
                  className="input"
                  value={config.staticPages.contactHeadline}
                  onChange={(e) => updateField("staticPages.contactHeadline", e.target.value)}
                />
              </div>

              <div className="form-field full-width">
                <label>Contact Subtext</label>
                <textarea
                  className="input"
                  rows={2}
                  value={config.staticPages.contactSub}
                  onChange={(e) => updateField("staticPages.contactSub", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: RAW JSON & BACKUP */}
      {activeTab === "json" && (
        <div className="editor-section" role="tabpanel">
          <div className="card editor-card">
            <div className="editor-card-header">
              <div>
                <h3>Raw JSON Configuration & Backup</h3>
                <p className="muted">Directly inspect, copy, or paste configuration payloads for backups or staging migration.</p>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-small"
                  onClick={handleCopyJson}
                >
                  {copySuccess ? "Copied" : "Copy JSON"}
                </button>
              </div>
            </div>

            <div className="form-field full-width">
              <label>Live Configuration JSON</label>
              <textarea
                className="input code-editor-textarea"
                rows={18}
                value={jsonDraft}
                onChange={(e) => { setJsonDraft(e.target.value); setJsonError(""); }}
                aria-invalid={Boolean(jsonError)}
                aria-describedby="json-editor-help json-editor-error"
                style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.5 }}
              />
              <small id="json-editor-help" className="muted" style={{ display: "block", marginTop: 6 }}>
                Edit or paste a backup, apply it to the form, review the visual tabs, then publish.
              </small>
              {jsonError && <p id="json-editor-error" className="editor-inline-error" role="alert">{jsonError}</p>}
              <button className="btn btn-outline" type="button" onClick={applyJsonDraft}>Apply JSON to editor</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Footer */}
      <div className="editor-floating-footer">
        <div className="container editor-floating-inner">
          <div className="editor-floating-info">
            {isDirty ? (
              <span><AlertTriangle size={15} /> You have unpublished changes.</span>
            ) : (
              <span><Check size={15} /> Editor matches the saved website configuration.</span>
            )}
          </div>
          <div className="editor-floating-btns">
            <Link className="btn btn-outline" href="/" target="_blank" rel="noreferrer">
              <Eye size={15} /> Preview Site
            </Link>
            <form action={saveSiteConfigAction}>
              <input type="hidden" name="configJson" value={JSON.stringify(config)} />
              <PublishButton disabled={!isDirty} />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
