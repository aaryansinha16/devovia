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
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
  },
  
  // Configure webpack to handle native Node.js modules
  webpack: (config, { isServer }) => {
    // If it's a client-side bundle, ignore Node.js specific modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        os: false,
        path: false,
        stream: false,
        zlib: false,
        http: false,
        https: false,
        dns: false,
        child_process: false,
        'mock-aws-s3': false,
        'aws-sdk': false,
        'nock': false,
      };
    }
    
    return config;
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
