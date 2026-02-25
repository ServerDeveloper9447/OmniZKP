/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Enable WebAssembly in Webpack
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
};

export default nextConfig;