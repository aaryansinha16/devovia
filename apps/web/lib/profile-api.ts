import { getTokens } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/**
 * User profile types
 */
export interface ProfileData {
  id: string;
  email: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  portfolioUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProfile {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  portfolioUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  _count: {
    projects: number;
  };
}

export interface ProfileUpdateData {
  name?: string;
  bio?: string;
  githubUrl?: string;
  twitterUrl?: string;
  portfolioUrl?: string;
}

export interface AvatarFile {
  file: File;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Fetch the current user's profile
 */
export async function fetchCurrentUserProfile(): Promise<{
  user: ProfileData;
}> {
  const tokens = getTokens();

  if (!tokens) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/users/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch profile");
  }

  return response.json();
}

/**
 * Fetch a user's public profile by username
 */
export async function fetchUserByUsername(
  username: string,
): Promise<{ user: PublicProfile }> {
  const response = await fetch(`${API_URL}/users/${username}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch user profile");
  }

  return response.json();
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(
  profileData: ProfileUpdateData,
): Promise<{ user: ProfileData }> {
  const tokens = getTokens();

  if (!tokens) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/users/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`,
    },
    credentials: "include",
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update profile");
  }

  return response.json();
}

/**
 * Update the user's avatar with a file upload
 */
export async function updateUserAvatar(avatarData: AvatarFile): Promise<{
  success: boolean;
  user: { id: string; username: string; avatar: string | null };
}> {
  const tokens = getTokens();

  if (!tokens) {
    throw new Error("Not authenticated");
  }

  // Create a FormData object to send the file
  const formData = new FormData();
  formData.append("avatar", avatarData.file);

  const response = await fetch(`${API_URL}/users/profile/avatar`, {
    method: "PATCH",
    headers: {
      // Don't set Content-Type here, it will be set automatically with the boundary
      Authorization: `Bearer ${tokens.accessToken}`,
    },
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update avatar");
  }

  return response.json();
}

/**
 * Change the user's password
 */
export async function changePassword(
  passwordData: PasswordChangeData,
): Promise<{ message: string }> {
  const tokens = getTokens();

  if (!tokens) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/users/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`,
    },
    credentials: "include",
    body: JSON.stringify(passwordData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to change password");
  }

  return response.json();
}

/**
 * Delete the user's account
 */
export async function deleteAccount(
  password: string,
): Promise<{ message: string }> {
  const tokens = getTokens();

  if (!tokens) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/users/profile`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`,
    },
    credentials: "include",
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete account");
  }

  return response.json();
}
