import { API_URL, DEFAULT_HEADERS } from "../api-config";

/**
 * Get authentication headers for API requests
 * Uses the access token stored in localStorage if available
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  // Access token is stored in localStorage by the auth context
  let accessToken = "";

  // Browser-side code only
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("accessToken") || "";
  }

  return {
    ...DEFAULT_HEADERS,
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
  };
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string }> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = await response.json();
  return { accessToken: data.accessToken };
}

/**
 * Logout the user by invalidating the refresh token
 */
export async function logout(refreshToken: string): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ refreshToken }),
    });
  } catch (error) {
    console.error("Error during logout:", error);
  }

  // Clear tokens from localStorage regardless of API response
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}
