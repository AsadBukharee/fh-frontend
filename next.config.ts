import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Enables standalone build for Docker optimization
  output: "standalone",

  images: {
   domains: ["91.99.235.94"],

  },

  webpack: (config) => {
    // Add alias '@' to your project root directory
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
    };
    return config;
  },
};

export default nextConfig;
