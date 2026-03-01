import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js bottom-left dev indicator
  devIndicators: false,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack: (config: any) => {
    // Enable WebAssembly in Webpack
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
};

export default nextConfig;
