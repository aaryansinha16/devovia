"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import {
  fetchCurrentUserProfile,
  updateUserProfile,
  ProfileData,
  ProfileUpdateData,
} from "../../lib/profile-api";
import AvatarUpload from "../../components/AvatarUpload";
import { Button } from "@repo/ui";

export default function ProfilePage() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<ProfileUpdateData>({
    name: "",
    bio: "",
    githubUrl: "",
    twitterUrl: "",
    portfolioUrl: "",
  });

  // Fetch user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!authUser && !authLoading) {
        router.push("/login");
        return;
      }

      if (authUser) {
        try {
          setIsLoading(true);
          setError(null);
          const response = await fetchCurrentUserProfile();
          setUser(response.user);
          // Initialize form data with profile data
          setFormData({
            name: response.user.name || "",
            bio: response.user.bio || "",
            githubUrl: response.user.githubUrl || "",
            twitterUrl: response.user.twitterUrl || "",
            portfolioUrl: response.user.portfolioUrl || "",
          });
        } catch (err) {
          setError("Failed to load profile. Please try again.");
          console.error("Error loading profile:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadProfile();
  }, [authUser, authLoading, router]);

  // Handle form input change
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle avatar update
  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (user) {
      setUser({
        ...user,
        avatar: newAvatarUrl,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Only send fields that have changed
      const updatedFields: ProfileUpdateData = {};
      if (formData.name !== user?.name) updatedFields.name = formData.name;
      if (formData.bio !== user?.bio) updatedFields.bio = formData.bio;
      if (formData.githubUrl !== user?.githubUrl)
        updatedFields.githubUrl = formData.githubUrl;
      if (formData.twitterUrl !== user?.twitterUrl)
        updatedFields.twitterUrl = formData.twitterUrl;
      if (formData.portfolioUrl !== user?.portfolioUrl)
        updatedFields.portfolioUrl = formData.portfolioUrl;

      const response = await updateUserProfile(updatedFields);
      setUser(response.user);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto pt-8 pb-16 px-4 sm:px-6">
      <div className="bg-card shadow-md rounded-lg overflow-hidden border border-border">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Profile</h1>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit Profile
              </Button>
            )}
          </div>

          {/* Avatar section */}
          {user && (
            <div className="mb-8 flex justify-center">
              <AvatarUpload
                currentAvatar={user.avatar}
                username={user.username}
                onAvatarUpdate={handleAvatarUpdate}
              />
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 text-green-500 rounded-md border border-green-500">
              {success}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  placeholder="Tell us about yourself"
                ></textarea>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.bio?.length || 0}/500 characters
                </p>
              </div>

              <div>
                <label
                  htmlFor="githubUrl"
                  className="block text-sm font-medium mb-1"
                >
                  GitHub URL
                </label>
                <input
                  type="url"
                  id="githubUrl"
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  placeholder="https://github.com/username"
                />
              </div>

              <div>
                <label
                  htmlFor="twitterUrl"
                  className="block text-sm font-medium mb-1"
                >
                  Twitter URL
                </label>
                <input
                  type="url"
                  id="twitterUrl"
                  name="twitterUrl"
                  value={formData.twitterUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div>
                <label
                  htmlFor="portfolioUrl"
                  className="block text-sm font-medium mb-1"
                >
                  Portfolio URL
                </label>
                <input
                  type="url"
                  id="portfolioUrl"
                  name="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  placeholder="https://yourportfolio.com"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data
                    setFormData({
                      name: user?.name || "",
                      bio: user?.bio || "",
                      githubUrl: user?.githubUrl || "",
                      twitterUrl: user?.twitterUrl || "",
                      portfolioUrl: user?.portfolioUrl || "",
                    });
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Username
                </h3>
                <p className="text-foreground">{user?.username}</p>
              </div>

              <div className="border-b border-border pb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Email
                </h3>
                <p className="text-foreground">{user?.email}</p>
              </div>

              <div className="border-b border-border pb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Name
                </h3>
                <p className="text-foreground">{user?.name || "Not set"}</p>
              </div>

              <div className="border-b border-border pb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Bio
                </h3>
                <p className="text-foreground whitespace-pre-wrap">
                  {user?.bio || "No bio provided"}
                </p>
              </div>

              <div className="border-b border-border pb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Links
                </h3>
                <div className="space-y-2 mt-2">
                  {user?.githubUrl && (
                    <a
                      href={user.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.164 22 16.42 22 12c0-5.523-4.477-10-10-10z"
                          clipRule="evenodd"
                        />
                      </svg>
                      GitHub
                    </a>
                  )}
                  {user?.twitterUrl && (
                    <a
                      href={user.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                      Twitter
                    </a>
                  )}
                  {user?.portfolioUrl && (
                    <a
                      href={user.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm1 16.057v-3.057h2.994c-.059 1.143-.212 2.24-.456 3.279-.823-.12-1.674-.188-2.538-.222zm1.957 2.162c-.499 1.33-1.159 2.497-1.957 3.456v-3.62c.666.028 1.319.081 1.957.164zm-1.957-7.219v-3.015c.868-.034 1.721-.103 2.548-.224.238 1.027.389 2.111.446 3.239h-2.994zm0-5.014v-3.661c.806.969 1.471 2.15 1.971 3.496-.642.084-1.3.137-1.971.165zm2.703-3.267c1.237.496 2.354 1.228 3.29 2.146-.642.234-1.311.442-2.019.607-.344-.992-.775-1.91-1.271-2.753zm-7.241 13.56c-.244-1.039-.398-2.136-.456-3.279h2.994v3.057c-.865.034-1.714.102-2.538.222zm2.538 1.776v3.62c-.798-.959-1.458-2.126-1.957-3.456.638-.083 1.291-.136 1.957-.164zm-2.994-7.055c.057-1.128.207-2.212.446-3.239.827.121 1.68.19 2.548.224v3.015h-2.994zm1.024-5.179c.5-1.346 1.165-2.527 1.97-3.496v3.661c-.671-.028-1.329-.081-1.97-.165zm-2.005-.35c-.708-.165-1.377-.373-2.018-.607.937-.918 2.053-1.65 3.29-2.146-.496.844-.927 1.762-1.272 2.753zm-.549 1.918c-.264 1.151-.434 2.36-.492 3.611h-3.933c.165-1.658.739-3.197 1.617-4.518.88.361 1.816.67 2.808.907zm.009 9.262c-.988.236-1.92.542-2.797.9-.89-1.328-1.471-2.879-1.637-4.551h3.934c.058 1.265.231 2.488.5 3.651zm.553 1.917c.342.976.768 1.881 1.257 2.712-1.223-.49-2.326-1.211-3.256-2.115.636-.229 1.299-.435 1.999-.597zm9.924 0c.7.163 1.362.367 1.999.597-.931.903-2.034 1.625-3.257 2.116.489-.832.915-1.737 1.258-2.713zm.553-1.917c.27-1.163.442-2.386.501-3.651h3.934c-.167 1.672-.748 3.223-1.638 4.551-.877-.358-1.81-.664-2.797-.9zm.501-5.651c-.058-1.251-.229-2.46-.492-3.611.992-.237 1.929-.546 2.809-.907.877 1.321 1.451 2.86 1.616 4.518h-3.933z" />
                      </svg>
                      Portfolio
                    </a>
                  )}
                  {!user?.githubUrl &&
                    !user?.twitterUrl &&
                    !user?.portfolioUrl && (
                      <p className="text-muted-foreground text-sm">
                        No links provided
                      </p>
                    )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Member Since
                </h3>
                <p className="text-foreground">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-card shadow-md rounded-lg overflow-hidden border border-border">
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            <div className="space-y-4">
              <Button
                onClick={() => router.push("/settings/security")}
                variant="outline"
                className="w-full justify-start"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Security Settings
              </Button>

              <Button
                onClick={() => router.push("/profile/password")}
                variant="outline"
                className="w-full justify-start"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                Change Password
              </Button>

              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => router.push("/profile/delete-account")}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
