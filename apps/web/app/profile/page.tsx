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
import { Button, Container, Heading, Text, GlassCard, BackgroundDecorative, Input, Label, Textarea, Badge, toast } from "@repo/ui";
import { IconUser, IconMail, IconBrandGithub, IconBrandTwitter, IconWorld, IconCalendar, IconEdit, IconShield, IconKey, IconTrash, IconAlertTriangle, IconCheck, IconRocket, IconCode, IconFileText, IconChartBar } from "@tabler/icons-react";
import Loader from "../../components/ui/loader";
import { DashboardFloatingDock } from "../../components/dashboard-floating-dock";
import { DashboardMobileSidebar } from "../../components/dashboard-mobile-sidebar";

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
          setUser(response.data);
          // Initialize form data with profile data
          setFormData({
            name: response.data.name || "",
            bio: response.data.bio || "",
            githubUrl: response.data.githubUrl || "",
            twitterUrl: response.data.twitterUrl || "",
            portfolioUrl: response.data.portfolioUrl || "",
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
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !user) {
    return <Loader />;
  }

  return (
    <>
      {/* Mobile Sidebar */}
      <DashboardMobileSidebar />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-28">
        <BackgroundDecorative />
      
      <Container className="py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Heading size="h1" variant="gradient" spacing="sm">
              My Profile
            </Heading>
            <Text variant="muted">
              Manage your personal information and preferences
            </Text>
          </div>
          {!isEditing && (
            <Button 
              onClick={() => setIsEditing(true)} 
              variant="gradient"
              leftIcon={<IconEdit className="w-4 h-4" />}
            >
              Edit Profile
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-lg mb-6 flex items-start gap-3">
            <IconAlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar & Basic Info */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6">
              {user && (
                <div className="text-center">
                  <div className="mb-6">
                    <AvatarUpload
                      currentAvatar={user.avatar}
                      username={user.username}
                      onAvatarUpdate={handleAvatarUpdate}
                    />
                  </div>
                  <Heading size="h3" className="mb-1">
                    {user.name || user.username}
                  </Heading>
                  <Text variant="muted" className="text-sm mb-4">
                    @{user.username}
                  </Text>
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                    <IconCalendar className="w-4 h-4" />
                    <span>
                      Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'}
                    </span>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Account Stats */}
            <GlassCard className="p-4 mt-6">
              <Heading size="h4" className="mb-4">Account Stats</Heading>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <IconRocket className="w-4 h-4" />
                    <span className="text-sm">Projects</span>
                  </div>
                  <span className="text-slate-200 font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <IconCode className="w-4 h-4" />
                    <span className="text-sm">Snippets</span>
                  </div>
                  <span className="text-slate-200 font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <IconFileText className="w-4 h-4" />
                    <span className="text-sm">Runbooks</span>
                  </div>
                  <span className="text-slate-200 font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <IconChartBar className="w-4 h-4" />
                    <span className="text-sm">Deployments</span>
                  </div>
                  <span className="text-slate-200 font-semibold">0</span>
                </div>
              </div>
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard className="p-4 mt-6">
              <Heading size="h4" className="mb-4">Quick Actions</Heading>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push("/settings/security")}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  leftIcon={<IconShield className="w-4 h-4" />}
                >
                  Security Settings
                </Button>
                <Button
                  onClick={() => router.push("/profile/password")}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  leftIcon={<IconKey className="w-4 h-4" />}
                >
                  Change Password
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-red-400 hover:bg-red-500/10"
                  onClick={() => router.push("/profile/delete-account")}
                  leftIcon={<IconTrash className="w-4 h-4" />}
                >
                  Delete Account
                </Button>
              </div>
            </GlassCard>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            {isEditing ? (
              <GlassCard className="p-6">
                <Heading size="h3" className="mb-6">Edit Profile</Heading>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Tell us about yourself"
                    />
                    <Text variant="muted" className="text-xs mt-1">
                      {formData.bio?.length || 0}/500 characters
                    </Text>
                  </div>

                  <div>
                    <Label htmlFor="githubUrl">GitHub URL</Label>
                    <Input
                      type="url"
                      id="githubUrl"
                      name="githubUrl"
                      value={formData.githubUrl}
                      onChange={handleChange}
                      placeholder="https://github.com/username"
                    />
                  </div>

                  <div>
                    <Label htmlFor="twitterUrl">Twitter URL</Label>
                    <Input
                      type="url"
                      id="twitterUrl"
                      name="twitterUrl"
                      value={formData.twitterUrl}
                      onChange={handleChange}
                      placeholder="https://twitter.com/username"
                    />
                  </div>

                  <div>
                    <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                    <Input
                      type="url"
                      id="portfolioUrl"
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleChange}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
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
                    <Button type="submit" disabled={isLoading} variant="gradient">
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </GlassCard>
            ) : (
              <GlassCard className="p-6">
                <Heading size="h3" className="mb-6">Profile Information</Heading>
                <div className="space-y-6">
                  {/* Email */}
                  <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="p-2 rounded-lg bg-slate-800/50">
                      <IconMail className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <Text variant="muted" className="text-sm mb-1">Email</Text>
                      <p className="text-slate-200">{user?.email}</p>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="p-2 rounded-lg bg-slate-800/50">
                      <IconUser className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <Text variant="muted" className="text-sm mb-1">Name</Text>
                      <p className="text-slate-200">{user?.name || "Not set"}</p>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <Text variant="muted" className="text-sm mb-2">Bio</Text>
                    <p className="text-slate-200 whitespace-pre-wrap">
                      {user?.bio || "No bio provided"}
                    </p>
                  </div>

                  {/* Social Links */}
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <Text variant="muted" className="text-sm mb-3">Social Links</Text>
                    <div className="space-y-2">
                      {user?.githubUrl && (
                        <a
                          href={user.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors"
                        >
                          <IconBrandGithub className="w-4 h-4" />
                          <span className="text-sm">GitHub</span>
                        </a>
                      )}
                      {user?.twitterUrl && (
                        <a
                          href={user.twitterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors"
                        >
                          <IconBrandTwitter className="w-4 h-4" />
                          <span className="text-sm">Twitter</span>
                        </a>
                      )}
                      {user?.portfolioUrl && (
                        <a
                          href={user.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors"
                        >
                          <IconWorld className="w-4 h-4" />
                          <span className="text-sm">Portfolio</span>
                        </a>
                      )}
                      {!user?.githubUrl && !user?.twitterUrl && !user?.portfolioUrl && (
                        <Text variant="muted" className="text-sm">No links provided</Text>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </Container>
    </div>

    {/* Floating Dock - Desktop only */}
    <div className="hidden md:block">
      <DashboardFloatingDock />
    </div>
  </>
  );
}
