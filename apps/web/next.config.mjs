/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  // Configuration for handling client-side features
  experimental: {
    // This ensures pages with client-side features aren't prerendered
    // during build time, which causes errors with sessionStorage, etc.
    optimizeCss: true,
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.vercel.app"],
    },
  },
  // Disable static generation for the entire app to avoid prerendering issues
  // with client-side authentication features
  output: 'standalone',
};

export default nextConfig;
