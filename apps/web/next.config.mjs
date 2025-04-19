/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  // Disable static optimization for auth-related pages
  experimental: {
    // This ensures pages with client-side features aren't prerendered
    // during build time, which causes errors with sessionStorage, etc.
    optimizeCss: true,
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.vercel.app"],
    },
  },
  // Explicitly set which pages should be statically generated vs. server-side rendered
  exportPathMap: async function (defaultPathMap) {
    // Remove auth pages from static generation
    delete defaultPathMap['/auth/oauth-callback'];
    delete defaultPathMap['/auth/login'];
    delete defaultPathMap['/auth/register'];
    delete defaultPathMap['/dashboard'];
    
    return defaultPathMap;
  },
};

export default nextConfig;
