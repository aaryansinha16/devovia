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
  
  // Environment variable configuration
  env: {
    // Ensure these values are available at build time
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
  },
  
  // Configure redirects for OAuth callback handling
  async redirects() {
    return [
      {
        source: '/api/auth/github/callback',
        destination: '/auth/oauth-callback',
        permanent: true,
      },
    ];
  },
};

// Log environment information during build
console.log(`Building for ${process.env.NODE_ENV || 'development'} environment`);
console.log(`API URL: ${process.env.NEXT_PUBLIC_API_URL || 'Not set'}`);

export default nextConfig;
