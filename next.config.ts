import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "pub-a42d3ae553984b2e928c351907ba6343.r2.dev",
      },
    ],
  },
};

export default nextConfig;