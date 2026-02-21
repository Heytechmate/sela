import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // --- ADDED FOR HIGH PERFORMANCE ---
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // Cache images for 1 year
    // ----------------------------------
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // WILDCARD: Allows images from ANY secure source
      },
      {
        protocol: "https",
        hostname: "hinoydsqasuckerlurjd.supabase.co", 
      },
      {
        protocol: "https",
        hostname: "**.supabase.co", 
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