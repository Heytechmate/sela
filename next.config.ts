import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // This setting IS still supported and will ignore Type errors
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-a42d3ae553984b2e928c351907ba6343.r2.dev",
        port: "",
        pathname: "/**",
      },
      // ADD THIS NEW BLOCK FOR UNSPLASH
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;