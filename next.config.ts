import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{protocol:"https",hostname:"images.unsplash.com"},{protocol:"https",hostname:"i.pravatar.cc"}] },
  serverExternalPackages: ["@electric-sql/pglite"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    ] }];
  },
};

export default nextConfig;
