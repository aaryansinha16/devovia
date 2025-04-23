import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';

// Set up callback URLs based on environment
const apiBaseUrl = isProduction
  ? process.env.API_URL || 'https://devovia-api.up.railway.app/api'
  : process.env.API_URL || 'http://localhost:4000/api';

const frontendBaseUrl = isProduction
  ? process.env.FRONTEND_URL || 'https://devovia.com'
  : process.env.FRONTEND_URL || 'http://localhost:3000';

export const oauthConfig = {
  github: {
    clientID: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackURL:
      process.env.GITHUB_CALLBACK_URL || `${apiBaseUrl}/auth/github/callback`,
    scope: ['user:email', 'read:user'],
  },
  // Add other OAuth providers here (Google, etc.)
};

// Log environment information
console.log(`Running in ${isProduction ? 'production' : 'development'} mode`);
console.log(`API Base URL: ${apiBaseUrl}`);
console.log(`Frontend Base URL: ${frontendBaseUrl}`);

// Validate OAuth configuration
if (!oauthConfig.github.clientID || !oauthConfig.github.clientSecret) {
  console.warn(
    'GitHub OAuth credentials are not configured. GitHub authentication will not work.',
  );
}
