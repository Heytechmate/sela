import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // This still works to ignore Type errors
    ignoreBuildErrors: true,
  },
  // We removed the 'eslint' block because it is now handled in package.json
};

export default nextConfig;