import { one, query } from "@/lib/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export type BrandConfig = {
  name: string;
  tagline: string;
  accentColor: string;
  currencySymbol: string;
  supportEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  officeAddress: string;
  logoUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
};

export type AnnouncementConfig = {
  enabled: boolean;
  text: string;
  link: string;
  linkLabel: string;
  bgColor: string;
  textColor: string;
};

export type HeroConfig = {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  copy: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  secondaryBtnText: string;
  secondaryBtnLink: string;
  imageUrl: string;
};

export type SportCardConfig = {
  key: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  enabled: boolean;
};

export type SectionVisibilityConfig = {
  showAnnouncement: boolean;
  showHero: boolean;
  showSportStrip: boolean;
  showMatches: boolean;
  matchesTitle: string;
  matchesEyebrow: string;
  matchesCount: number;
  showHowItWorks: boolean;
  howTitle: string;
  howStep1Title: string;
  howStep1Desc: string;
  howStep2Title: string;
  howStep2Desc: string;
  howStep3Title: string;
  howStep3Desc: string;
  showVenues: boolean;
  venuesTitle: string;
  venuesEyebrow: string;
  showAcademies: boolean;
  academiesTitle: string;
  academiesEyebrow: string;
  showAdventures: boolean;
  adventuresTitle: string;
  adventuresEyebrow: string;
  showCtaBanner: boolean;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaBtnText: string;
  ctaBtnLink: string;
  ctaImage: string;
};

export type StaticPagesConfig = {
  aboutHeroTitle: string;
  aboutHeroBody: string;
  aboutMission: string;
  contactHeadline: string;
  contactSub: string;
};

export type ThemeConfig = {
  primaryColor: string;
  fontScale: "normal" | "compact" | "large";
  cardStyle: "modern" | "classic" | "minimal";
};

export type SiteConfig = {
  brand: BrandConfig;
  announcement: AnnouncementConfig;
  hero: HeroConfig;
  sports: Record<string, SportCardConfig>;
  sections: SectionVisibilityConfig;
  staticPages: StaticPagesConfig;
  theme: ThemeConfig;
};

const safeLink = z.string().trim().max(500).refine(
  (value) => value === "" || value.startsWith("/") || value.startsWith("#") || value.startsWith("https://"),
  "Links must use a site path, page anchor, or https:// URL."
);
const safeImage = z.string().trim().max(1000).refine(
  (value) => value.startsWith("/") || value.startsWith("https://images.unsplash.com/") || value.startsWith("https://i.pravatar.cc/"),
  "Images must use an uploaded site path or an approved image-library URL."
);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color such as #22e879.");
const shortText = z.string().trim().min(1).max(160);
const bodyText = z.string().trim().min(1).max(2500);

const siteConfigSchema = z.object({
  brand: z.object({
    name: z.string().trim().min(1).max(50),
    tagline: z.string().trim().max(160),
    accentColor: color,
    currencySymbol: z.string().trim().min(1).max(8),
    supportEmail: z.email(),
    contactPhone: z.string().trim().max(40),
    whatsappNumber: z.string().trim().max(40),
    officeAddress: z.string().trim().max(240),
    logoUrl: safeImage.optional().or(z.literal("")),
    instagramUrl: safeLink.optional(),
    xUrl: safeLink.optional(),
  }),
  announcement: z.object({
    enabled: z.boolean(),
    text: z.string().trim().max(240),
    link: safeLink,
    linkLabel: z.string().trim().max(80),
    bgColor: color,
    textColor: color,
  }),
  hero: z.object({
    eyebrow: shortText,
    titleLine1: shortText,
    titleLine2: shortText,
    copy: bodyText,
    primaryBtnText: z.string().trim().max(80),
    primaryBtnLink: safeLink,
    secondaryBtnText: z.string().trim().max(80),
    secondaryBtnLink: safeLink,
    imageUrl: safeImage,
  }),
  sports: z.record(z.string(), z.object({
    key: z.string().trim().min(1).max(40),
    title: shortText,
    subtitle: z.string().trim().max(120),
    imageUrl: safeImage,
    enabled: z.boolean(),
  })),
  sections: z.object({
    showAnnouncement: z.boolean(), showHero: z.boolean(), showSportStrip: z.boolean(),
    showMatches: z.boolean(), matchesTitle: shortText, matchesEyebrow: shortText,
    matchesCount: z.number().int().min(1).max(24),
    showHowItWorks: z.boolean(), howTitle: shortText,
    howStep1Title: shortText, howStep1Desc: bodyText,
    howStep2Title: shortText, howStep2Desc: bodyText,
    howStep3Title: shortText, howStep3Desc: bodyText,
    showVenues: z.boolean(), venuesTitle: shortText, venuesEyebrow: shortText,
    showAcademies: z.boolean(), academiesTitle: shortText, academiesEyebrow: shortText,
    showAdventures: z.boolean(), adventuresTitle: shortText, adventuresEyebrow: shortText,
    showCtaBanner: z.boolean(), ctaTitle: shortText, ctaSubtitle: bodyText,
    ctaBtnText: z.string().trim().max(80), ctaBtnLink: safeLink, ctaImage: safeImage,
  }),
  staticPages: z.object({
    aboutHeroTitle: shortText, aboutHeroBody: bodyText, aboutMission: bodyText,
    contactHeadline: shortText, contactSub: bodyText,
  }),
  theme: z.object({
    primaryColor: color,
    fontScale: z.enum(["normal", "compact", "large"]),
    cardStyle: z.enum(["modern", "classic", "minimal"]),
  }),
});

export const defaultSiteConfig: SiteConfig = {
  brand: {
    name: "PlayUp",
    tagline: "Find your game. Play your sport.",
    accentColor: "#22e879",
    currencySymbol: "JD",
    supportEmail: "info@creativnetworks.com",
    contactPhone: "+962 795 550 073",
    whatsappNumber: "+962 795 550 073",
    officeAddress: "",
    logoUrl: "",
    instagramUrl: "",
    xUrl: "",
  },
  announcement: {
    enabled: false,
    text: "🔥 Amman Champions League Season 2 is now open! Register your squad today.",
    link: "/tournaments",
    linkLabel: "View Tournaments →",
    bgColor: "#091711",
    textColor: "#22e879",
  },
  hero: {
    eyebrow: "The game starts here",
    titleLine1: "DON'T HAVE A TEAM?",
    titleLine2: "JUST PLAY.",
    copy: "Find and join pickup games for football, basketball, dodgeball, tennis and more. Meet new players, stay active, compete, and become part of a real sports community.",
    primaryBtnText: "Find a Game",
    primaryBtnLink: "/games",
    secondaryBtnText: "How It Works",
    secondaryBtnLink: "#how-it-works",
    imageUrl: "/images/hero-ground.jpg",
  },
  sports: {
    football: {
      key: "football",
      title: "Football",
      subtitle: "5v5 · 7v7",
      imageUrl: "/images/football.jpg",
      enabled: true,
    },
    basketball: {
      key: "basketball",
      title: "Basketball",
      subtitle: "3v3 · 5v5",
      imageUrl: "/images/basketball.jpg",
      enabled: true,
    },
    dodgeball: {
      key: "dodgeball",
      title: "Dodgeball",
      subtitle: "Team Games",
      imageUrl: "/images/dodgeball.jpg",
      enabled: true,
    },
    tennis: {
      key: "tennis",
      title: "Tennis",
      subtitle: "Singles · Doubles",
      imageUrl: "/images/tennis.jpg",
      enabled: true,
    },
  },
  sections: {
    showAnnouncement: true,
    showHero: true,
    showSportStrip: true,
    showMatches: true,
    matchesTitle: "Upcoming games near you",
    matchesEyebrow: "Find your next match",
    matchesCount: 6,
    showHowItWorks: true,
    howTitle: "How PlayUp works",
    howStep1Title: "Find a game",
    howStep1Desc: "Browse local games by sport, date, location, or skill level.",
    howStep2Title: "Save your spot",
    howStep2Desc: "Join a game, meet your players, and get the details in one place.",
    howStep3Title: "Play and progress",
    howStep3Desc: "Track scores, stats, ratings, and the games that made your week.",
    showVenues: true,
    venuesTitle: "Popular venues",
    venuesEyebrow: "Places to play",
    showAcademies: true,
    academiesTitle: "Top Sports Academies",
    academiesEyebrow: "Train with certified coaches",
    showAdventures: true,
    adventuresTitle: "Outdoor Adventures",
    adventuresEyebrow: "Explore Jordan with fellow athletes",
    showCtaBanner: true,
    ctaTitle: "Good games are better together.",
    ctaSubtitle: "Join Amman's growing community of players.",
    ctaBtnText: "Join PlayUp",
    ctaBtnLink: "/signup",
    ctaImage: "/images/hero-ground.jpg",
  },
  staticPages: {
    aboutHeroTitle: "Built by athletes for athletes in Amman",
    aboutHeroBody: "PlayUp was founded to remove the friction of organizing pickup games and connecting with local sports venues across Jordan.",
    aboutMission: "Make active sports effortless, social, and accessible to everyone in every neighborhood.",
    contactHeadline: "We're here to help you get on the court",
    contactSub: "Have questions about games, venue partnerships, or academy listings? Reach out to our team.",
  },
  theme: {
    primaryColor: "#22e879",
    fontScale: "normal",
    cardStyle: "modern",
  },
};

/**
 * Deep merge utility to ensure partial custom configs preserve all default keys
 */
function mergeConfigs(target: SiteConfig, source?: Partial<SiteConfig> | null): SiteConfig {
  if (!source || typeof source !== "object") return target;
  return {
    ...target,
    ...source,
    brand: { ...target.brand, ...(source.brand || {}) },
    announcement: { ...target.announcement, ...(source.announcement || {}) },
    hero: { ...target.hero, ...(source.hero || {}) },
    sports: { ...target.sports, ...(source.sports || {}) },
    sections: { ...target.sections, ...(source.sections || {}) },
    staticPages: { ...target.staticPages, ...(source.staticPages || {}) },
    theme: { ...target.theme, ...(source.theme || {}) },
  };
}

/**
 * Read site configuration with safe database fallback
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const row = await one<{ data: Partial<SiteConfig> }>(
      "SELECT data FROM site_config WHERE id = 'current'"
    );
    if (!row || !row.data) return defaultSiteConfig;
    const parsed = siteConfigSchema.safeParse(mergeConfigs(defaultSiteConfig, row.data));
    return parsed.success ? parsed.data : defaultSiteConfig;
  } catch {
    return defaultSiteConfig;
  }
}

/**
 * Save site configuration to PostgreSQL and record audit log
 */
export async function saveSiteConfig(newConfig: SiteConfig, actorId?: string): Promise<SiteConfig> {
  const merged = siteConfigSchema.parse(mergeConfigs(defaultSiteConfig, newConfig));
  await query(
    `INSERT INTO site_config(id, data, updated_at, updated_by)
     VALUES('current', $1, now(), $2)
     ON CONFLICT(id) DO UPDATE SET data = $1, updated_at = now(), updated_by = $2`,
    [JSON.stringify(merged), actorId || null]
  );

  if (actorId) {
    try {
      await query(
        `INSERT INTO audit_logs(id, actor_id, action, entity, entity_id, new_data)
         VALUES($1, $2, 'SITE_CONFIG_UPDATED', 'site_config', 'current', $3)`,
        [randomUUID(), actorId, JSON.stringify({ brand: merged.brand.name, updated_at: new Date().toISOString() })]
      );
    } catch {
      // ignore audit log failure if table not ready
    }
  }

  return merged;
}

/**
 * Restore site configuration to default
 */
export async function resetSiteConfig(actorId?: string): Promise<SiteConfig> {
  return saveSiteConfig(defaultSiteConfig, actorId);
}
