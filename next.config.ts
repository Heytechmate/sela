import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // This is the specific project URL from your error log
        hostname: "hinoydsqasuckerlurjd.supabase.co", 
      },
      {
        protocol: "https",
        hostname: "**.supabase.co", // Keep wildcard for other potential projects
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "pub-a42d3ae553984b2e928c351907ba6343.r2.dev",
      },
      {
        protocol: "https",
        hostname: "www.luluhypermarket.com",
      },
      {
        protocol: "https",
        hostname: "gcc.luluhypermarket.com",
      },
    ],
  },
};

export default nextConfig;