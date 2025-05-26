import { API_URL } from "./config";
import { getTokens } from "./auth";

/**
 * Get all users (admin only)
 */
export async function getAllUsers() {
  const tokens = getTokens();

  if (!tokens) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/admin/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch users");
  }

  return response.json();
}

/**
 * Update a user's role (admin only)
 */
export async function updateUserRole(
  userId: string,
  role: "USER" | "ADMIN" | "MODERATOR",
) {
  const tokens = getTokens();

  if (!tokens) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update user role");
  }

  return response.json();
}

/**
 * Update a user's verification status (admin only)
 */
export async function updateUserVerification(
  userId: string,
  isVerified: boolean,
) {
  const tokens = getTokens();

  if (!tokens) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/admin/users/${userId}/verification`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isVerified }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update user verification");
  }

  return response.json();
}

/**
 * Get content for moderation (moderator or admin only)
 */
export async function getContentForModeration() {
  const tokens = getTokens();

  if (!tokens) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/moderator/content`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch content for moderation");
  }

  return response.json();
}

/**
 * Get reported content (moderator or admin only)
 */
export async function getReportedContent() {
  const tokens = getTokens();

  if (!tokens) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/moderator/reports`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch reported content");
  }

  return response.json();
}

/**
 * Get moderation logs (moderator or admin only)
 */
export async function getModerationLogs() {
  const tokens = getTokens();

  if (!tokens) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/moderator/logs`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch moderation logs");
  }

  return response.json();
}
