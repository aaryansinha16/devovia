/**
 * API configuration for the web app
 */

// API base URL based on environment
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// Default request headers
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

/**
 * Constructs a URL with query parameters
 * @param base Base URL
 * @param params Query parameters object
 */
export function buildUrl(base: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return base;
  }

  const queryParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  return `${base}${base.includes("?") ? "&" : "?"}${queryParams}`;
}
