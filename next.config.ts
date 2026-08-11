import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    localPatterns: [
      {
        pathname: "/dramabox-logo.png",
        search: "",
      },
      {
        pathname: "/pinedrama-logo.png",
        search: "",
      },
      {
        pathname: "/iqiyi-logo.png",
        search: "",
      },
    ],
    remotePatterns: [
      // iQIYI image CDN
      {
        protocol: "https",
        hostname: "**.iqiyi.com",
      },
      {
        protocol: "https",
        hostname: "**.iq.com",
      },
      // DramaBox CDN images
      {
        protocol: "https",
        hostname: "**.dramaboxdb.com",
      },
      // PineDrama/TikTok CDN images
      {
        protocol: "https",
        hostname: "**.tiktokcdn.com",
      },
      {
        protocol: "https",
        hostname: "**.tiktokv.com",
      },
      // Generic cover images (many APIs use various CDNs)
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
    ],
  },
};

export default nextConfig;
