import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // This setting IS still supported and will ignore Type errors
    ignoreBuildErrors: true,
  },
  // The 'eslint' block is removed because we handle it in package.json now
};

export default nextConfig;