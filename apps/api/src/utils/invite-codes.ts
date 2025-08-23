import crypto from 'crypto';

/**
 * Generate a secure, URL-safe invite code
 * Format: 8 character alphanumeric string (no ambiguous characters)
 */
export function generateInviteCode(): string {
  // Use characters that are easy to read and type (no 0, O, 1, l, I)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let result = '';
  
  // Generate 8 random characters
  for (let i = 0; i < 8; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    result += chars[randomIndex];
  }
  
  return result;
}

/**
 * Validate invite code format
 */
export function isValidInviteCode(code: string): boolean {
  return /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/.test(code);
}

/**
 * Generate a session-specific WebSocket room name
 */
export function generateRoomName(sessionId: string): string {
  return `session:${sessionId}`;
}

/**
 * Generate a unique client ID for WebSocket connections
 */
export function generateClientId(): string {
  return crypto.randomUUID();
}
