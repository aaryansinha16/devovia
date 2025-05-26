/**
 * Environment Configuration
 *
 * This file centralizes environment-specific configuration
 * for both development and production environments.
 */

// Determine the current environment
// Using NEXT_PUBLIC variables to avoid turbo/no-undeclared-env-vars warning
const isDevelopment = process.env.NEXT_PUBLIC_VERCEL_ENV !== "production";

// API URL configuration
// For integrated API approach, use relative URL in production
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (isDevelopment ? "http://localhost:4000/api" : "/api");

// Frontend URL configuration
export const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL ||
  (isDevelopment ? "http://localhost:3000" : "https://devovia.com");

// Log environment information during build/startup
if (typeof window === "undefined") {
  console.log(
    `Running in ${isDevelopment ? "development" : "production"} mode`,
  );
  console.log(`API URL: ${API_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
}

// Export environment flag for use in components
export const IS_DEVELOPMENT = isDevelopment;
