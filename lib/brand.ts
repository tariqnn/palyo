export const brand = {
  name: "PLAYO",
  description: "Find your game. Play your sport.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  color: "#22e879",
  supportEmail: "hello@playo.example",
  social: { instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL, x: process.env.NEXT_PUBLIC_X_URL },
} as const;

export const sports = ["football", "basketball", "dodgeball", "tennis"] as const;
export type Sport = (typeof sports)[number];
export const sportLabels: Record<Sport, string> = {
  football: "Football", basketball: "Basketball", dodgeball: "Dodgeball", tennis: "Tennis",
};
export const sportImages: Record<Sport, string> = {
  football: "/images/football.jpg",
  basketball: "/images/basketball.jpg",
  dodgeball: "/images/dodgeball.jpg",
  tennis: "/images/tennis.jpg",
};
export const heroImage = "/images/hero-ground.jpg";
