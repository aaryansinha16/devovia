import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const oauthConfig = {
  github: {
    clientID: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/auth/github/callback',
    scope: ['user:email', 'read:user'],
  },
  // Add other OAuth providers here (Google, etc.)
};

// Validate OAuth configuration
if (!oauthConfig.github.clientID || !oauthConfig.github.clientSecret) {
  console.warn('GitHub OAuth credentials are not configured. GitHub authentication will not work.');
}
