/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure React to be less strict about hydration mismatches
  reactStrictMode: true,
  onDemandEntries: {
    // Make hot reloading resilient to browser extensions changing the DOM
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
  transpilePackages: ["@repo/ui"],
  // Configuration for handling client-side features
  experimental: {
    // Disable optimizeCss as it requires the critters dependency
    // which is causing build errors
    optimizeCss: false,
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.vercel.app"],
    },
    // Improve development stability
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Development configuration for better stability
  ...(process.env.NODE_ENV === 'development' && {
    // Reduce chunk splitting in development
    webpack: (config, { isServer, dev }) => {
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
      
      // Improve development stability
      if (dev) {
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              default: {
                minChunks: 1,
                priority: -20,
                reuseExistingChunk: true,
              },
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: -10,
                chunks: 'all',
              },
            },
          },
        };
      }
      
      return config;
    },
  }),
  // Disable static generation for the entire app to avoid prerendering issues
  // with client-side authentication features
  output: 'standalone',
  
  // Image optimization configuration
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'github.com',
      'ui-avatars.com',
      'localhost',
      'res.cloudinary.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com'
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com'
      }
    ]
  },
  
  // Environment variable configuration
  env: {
    // Ensure these values are available at build time
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
