/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  // Configuration for handling client-side features
  experimental: {
    // Disable optimizeCss as it requires the critters dependency
    // which is causing build errors
    optimizeCss: false,
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.vercel.app"],
    },
  },
  // Disable static generation for the entire app to avoid prerendering issues
  // with client-side authentication features
  output: 'standalone',
};

export default nextConfig;
