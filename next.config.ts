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
    ],
  },
};

export default nextConfig;
