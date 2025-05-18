import { API_URL } from "./config";

/**
 * Interface for session data returned from API
 */
export interface SessionData {
  id: string;
  device: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  lastActive: string;
  createdAt: string;
}

/**
 * Interface for session response from API
 */
export interface SessionResponse {
  sessions: SessionData[];
  currentSessionId: string | null;
}

/**
 * Format a session date string to a readable format
 */
export const formatSessionDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

/**
 * Format a session's age (time since last active)
 */
export const formatSessionAge = (lastActiveString: string): string => {
  const lastActive = new Date(lastActiveString);
  const now = new Date();
  const diffMs = now.getTime() - lastActive.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};

/**
 * Fetch all active sessions for the current user
 */
export const fetchUserSessions = async (): Promise<SessionResponse> => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    throw new Error("No access token found");
  }

  // Note: API_URL already contains '/api', so we're using the base URL
  const baseUrl = API_URL.replace(/\/api$/, "");
  const response = await fetch(`${baseUrl}/api/sessions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch sessions");
  }

  return await response.json();
};

/**
 * Revoke (forcibly logout) a specific session
 */
export const revokeSession = async (
  sessionId: string,
): Promise<{ isCurrentSession: boolean }> => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    throw new Error("No access token found");
  }

  // Note: API_URL already contains '/api', so we're using the base URL
  const baseUrl = API_URL.replace(/\/api$/, "");
  const response = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to revoke session");
  }

  return await response.json();
};

/**
 * Revoke all sessions except the current one
 */
export const revokeAllSessions = async (): Promise<{ message: string }> => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    throw new Error("No access token found");
  }

  // Note: API_URL already contains '/api', so we're using the base URL
  const baseUrl = API_URL.replace(/\/api$/, "");
  const response = await fetch(`${baseUrl}/api/sessions`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to revoke all sessions");
  }

  return await response.json();
};
