import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Exclude web-app directory from TypeScript and ESLint checking
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // Don't run ESLint during production builds due to config issues
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
