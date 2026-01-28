/**
 * Auth-specific hooks that wrap authentication service functions
 * Note: Most auth state is managed by the AuthContext
 * These hooks are for specific auth operations
 */

import { useApiMutation } from './useApiData';
import { refreshAccessToken, logout } from '../services/auth-service';

/**
 * Hook for refreshing the access token
 */
export function useRefreshToken() {
  return useApiMutation<{ accessToken: string }, string>(
    (refreshToken) => refreshAccessToken(refreshToken)
  );
}

/**
 * Hook for logging out
 */
export function useLogout() {
  return useApiMutation<void, string>(
    (refreshToken) => logout(refreshToken)
  );
}
