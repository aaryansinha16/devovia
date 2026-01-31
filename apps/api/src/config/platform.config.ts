/**
 * Platform Configuration
 * Configuration for external platform integrations
 */

export interface PlatformConfig {
  baseUrl: string;
  apiVersion?: string;
  timeout?: number;
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  VERCEL: {
    baseUrl: process.env.VERCEL_API_URL || 'https://api.vercel.com',
    timeout: 30000,
  },
  NETLIFY: {
    baseUrl: process.env.NETLIFY_API_URL || 'https://api.netlify.com',
    apiVersion: 'v1',
    timeout: 30000,
  },
  RAILWAY: {
    baseUrl: process.env.RAILWAY_API_URL || 'https://backboard.railway.app/graphql',
    timeout: 30000,
  },
  RENDER: {
    baseUrl: process.env.RENDER_API_URL || 'https://api.render.com',
    apiVersion: 'v1',
    timeout: 30000,
  },
  FLY_IO: {
    baseUrl: process.env.FLY_IO_API_URL || 'https://api.fly.io/graphql',
    timeout: 30000,
  },
  AWS_AMPLIFY: {
    baseUrl: process.env.AWS_AMPLIFY_API_URL || 'https://amplify.us-east-1.amazonaws.com',
    timeout: 30000,
  },
  CLOUDFLARE_PAGES: {
    baseUrl: process.env.CLOUDFLARE_API_URL || 'https://api.cloudflare.com/client/v4',
    timeout: 30000,
  },
  GITHUB_PAGES: {
    baseUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
    timeout: 30000,
  },
  HEROKU: {
    baseUrl: process.env.HEROKU_API_URL || 'https://api.heroku.com',
    timeout: 30000,
  },
  DIGITAL_OCEAN: {
    baseUrl: process.env.DIGITAL_OCEAN_API_URL || 'https://api.digitalocean.com',
    apiVersion: 'v2',
    timeout: 30000,
  },
};

/**
 * Get platform configuration
 */
export function getPlatformConfig(platform: string): PlatformConfig {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return config;
}

/**
 * Webhook configuration
 */
export const WEBHOOK_CONFIG = {
  maxPayloadSize: process.env.WEBHOOK_MAX_PAYLOAD_SIZE || '10mb',
  timeout: Number(process.env.WEBHOOK_TIMEOUT) || 30000,
  retryAttempts: Number(process.env.WEBHOOK_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.WEBHOOK_RETRY_DELAY) || 1000,
};

/**
 * AI configuration
 */
export const AI_CONFIG = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  model: process.env.AI_MODEL || 'gpt-4',
  maxTokens: Number(process.env.AI_MAX_TOKENS) || 2000,
  temperature: Number(process.env.AI_TEMPERATURE) || 0.7,
};
