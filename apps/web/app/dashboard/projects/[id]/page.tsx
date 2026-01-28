"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../lib/auth-context";
import { getTokens } from "../../../../lib/services/auth-service";
import { API_URL } from "../../../../lib/api-config";
import { useProjectById, useDeleteProject } from "../../../../lib/hooks/useProject";
import Loader from "../../../../components/ui/loader";
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconUsers,
  IconLink,
  IconPlus,
  IconX,
  IconExternalLink,
  IconFileText,
  IconMessage,
  IconGitBranch,
  IconWorld,
  IconCalendar,
  IconClock,
} from "@tabler/icons-react";
import {
  Button,
  Container,
  Heading,
  Text,
  GlassCard,
  BackgroundDecorative,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import ProjectNotes from "./components/project-notes";
import ProjectChat from "./components/project-chat";
import { Eye, Link, Users } from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, loading, error, refetch } = useProjectById(projectId);
  const { mutate: deleteProject, loading: deleting } = useDeleteProject(projectId);

  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "team" | "links" | "notes" | "chat">("overview");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("MEMBER");
  
  // Links management state
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkType, setLinkType] = useState("documentation");

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await deleteProject();
      router.push("/dashboard/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project");
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail) {
      alert("Please enter an email address");
      return;
    }

    try {
      const tokens = getTokens();
      if (!tokens?.accessToken) return;

      // First, search for the user by email
      const searchResponse = await fetch(
        `${API_URL}/projects/search/user?email=${encodeURIComponent(memberEmail)}`,
        {
          headers: {
            "Authorization": `Bearer ${tokens.accessToken}`,
          },
        }
      );

      if (!searchResponse.ok) {
        if (searchResponse.status === 404) {
          alert("User not found. Please check the email address.");
        } else {
          alert("Error searching for user");
        }
        return;
      }

      const { user } = await searchResponse.json();

      // Then add the user as a member
      const addResponse = await fetch(
        `${API_URL}/projects/${params.id}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({
            userId: user.id,
            role: memberRole,
          }),
        }
      );

      if (addResponse.ok) {
        refetch();
        setShowAddMember(false);
        setMemberEmail("");
        setMemberRole("MEMBER");
      } else {
        const error = await addResponse.json();
        alert(error.error || "Failed to add member");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to add member");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const tokens = getTokens();
      if (!tokens?.accessToken) return;

      const response = await fetch(
        `${API_URL}/projects/${params.id}/members/${memberId}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${tokens.accessToken}`,
          },
        }
      );

      if (response.ok) {
        refetch();
      }
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const handleAddLink = async () => {
    if (!linkTitle || !linkUrl || !linkType) return;

    try {
      const tokens = getTokens();
      if (!tokens?.accessToken) return;

      const response = await fetch(`${API_URL}/projects/${params.id}/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          title: linkTitle,
          url: linkUrl,
          type: linkType,
        }),
      });

      if (response.ok) {
        refetch();
        setShowAddLink(false);
        setLinkTitle("");
        setLinkUrl("");
        setLinkType("documentation");
      }
    } catch (error) {
      console.error("Error adding link:", error);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;

    try {
      const tokens = getTokens();
      if (!tokens?.accessToken) return;

      const response = await fetch(
        `${API_URL}/projects/${params.id}/links/${linkId}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${tokens.accessToken}`,
          },
        }
      );

      if (response.ok) {
        refetch();
      }
    } catch (error) {
      console.error("Error deleting link:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNING":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "IN_PROGRESS":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "COMPLETED":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "ON_HOLD":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "ARCHIVED":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };

  const getLinkIcon = (type: string) => {
    switch (type) {
      case "repository":
        return <IconGitBranch className="w-5 h-5" />;
      case "deployment":
        return <IconWorld className="w-5 h-5" />;
      default:
        return <IconLink className="w-5 h-5" />;
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Heading size="h2" className="mb-4">Error loading project</Heading>
          <Text className="text-slate-400 mb-6">{error.message}</Text>
          <Button onClick={() => router.push("/dashboard/projects")}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const isOwner = true; // Simplified check - you can enhance this with proper auth

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <BackgroundDecorative />
      
      <Container className="py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              leftIcon={<IconArrowLeft className="w-5 h-5" />}
            >
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <Heading variant="gradient" size="h1" className="mb-2">{project.title}</Heading>
                <span
                  className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(
                    project.status
                  )}`}
                >
                  {formatStatus(project.status)}
                </span>
              </div>
              <Text variant="muted">
                Created by {project.owner?.name || 'Unknown'}
              </Text>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/dashboard/projects/${params.id}/edit`)}
              variant="outline"
              leftIcon={<IconEdit className="w-5 h-5" />}
            >
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              className="text-red-400 border-red-500/20 hover:bg-red-500/10"
              leftIcon={<IconTrash className="w-5 h-5" />}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-1 border-b border-slate-700/50 mt-6 mb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
              }`}
          >
            <Eye className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'team'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
              }`}
          >
            <Users className="w-4 h-4" />
            Team
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'links'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
              }`}
          >
            <Link className="w-4 h-4" />
            Links
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'notes'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
              }`}
          >
            <IconFileText className="w-4 h-4" />
            Notes
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
              }`}
          >
            <IconMessage className="w-4 h-4" />
            Chat
          </button>
        </div>

        {/* Thumbnail */}
        {project.thumbnail && (
          <GlassCard className="p-0 mb-6 overflow-hidden">
            <img
              src={project.thumbnail}
              alt={project.title}
              className="w-full h-96 object-cover"
            />
          </GlassCard>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <GlassCard className="p-6">
              <Heading size="h3" className="mb-4">
                Description
              </Heading>
              <Text className="text-slate-300 whitespace-pre-wrap">
                {project.description}
              </Text>
            </GlassCard>

            {/* Quick Links */}
            {(project.githubUrl || project.liveUrl) && (
              <GlassCard className="p-6">
                <Heading size={"h3"} className="mb-4">
                  Quick Links
                </Heading>
                <div className="flex gap-4">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <IconGitBranch className="w-5 h-5" />
                      <span>Repository</span>
                      <IconExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <IconWorld className="w-5 h-5" />
                      <span>Live Demo</span>
                      <IconExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Tech Stack */}
            {project.techStack && project.techStack.length > 0 && (
              <GlassCard className="p-6">
                <Heading size="h3" className="mb-4">
                  Tech Stack
                </Heading>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-sky-500/10 text-sky-400 rounded-lg text-sm border border-sky-500/20"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Project Info */}
            <GlassCard className="p-6">
              <Heading size="h3" className="mb-4">
                Project Information
              </Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.startDate && (
                  <div>
                    <Text className="text-slate-400 text-sm mb-1">Start Date</Text>
                    <div className="flex items-center gap-2">
                      <IconCalendar className="w-5 h-5 text-sky-400" />
                      <Text>{new Date(project.startDate).toLocaleDateString()}</Text>
                    </div>
                  </div>
                )}
                {project.endDate && (
                  <div>
                    <Text className="text-slate-400 text-sm mb-1">End Date</Text>
                    <div className="flex items-center gap-2">
                      <IconCalendar className="w-5 h-5 text-sky-400" />
                      <Text>{new Date(project.endDate).toLocaleDateString()}</Text>
                    </div>
                  </div>
                )}
                <div>
                  <Text className="text-slate-400 text-sm mb-1">Created</Text>
                  <div className="flex items-center gap-2">
                    <IconClock className="w-5 h-5 text-sky-400" />
                    <Text>{new Date(project.createdAt).toLocaleDateString()}</Text>
                  </div>
                </div>
                <div>
                  <Text className="text-slate-400 text-sm mb-1">Last Updated</Text>
                  <div className="flex items-center gap-2">
                    <IconClock className="w-5 h-5 text-sky-400" />
                    <Text>{new Date(project.updatedAt).toLocaleDateString()}</Text>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === "team" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Heading size="h3">Team Members</Heading>
              <Button
                onClick={() => setShowAddMember(true)}
                variant="gradient"
                size="sm"
                leftIcon={<IconPlus className="w-4 h-4" />}
              >
                Add Member
              </Button>
            </div>

            {showAddMember && (
              <GlassCard className="p-6">
                <Heading size="h4" className="mb-4">
                  Add Team Member
                </Heading>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="memberEmail">Email</Label>
                    <Input
                      id="memberEmail"
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="member@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="memberRole">Role</Label>
                    <Select value={memberRole} onValueChange={setMemberRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddMember} variant="gradient">
                      Add Member
                    </Button>
                    <Button
                      onClick={() => setShowAddMember(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Owner */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {project.owner?.avatar && (
                    <img
                      src={project.owner.avatar}
                      alt={project.owner.name}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <Text className="font-medium">
                      {project.owner?.name || 'Unknown'}
                    </Text>
                    <Text className="text-sm text-slate-400">Owner</Text>
                  </div>
                </div>
                <span className="px-3 py-1 bg-sky-500/10 text-sky-400 rounded-lg text-sm border border-sky-500/20">
                  OWNER
                </span>
              </div>
            </GlassCard>

            {/* Members */}
            {project.members && project.members.length > 0 && (
              <div className="space-y-4">
                {project.members.map((member: any) => (
                  <GlassCard key={member.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {member.user?.avatar && (
                          <img
                            src={member.user.avatar}
                            alt={member.user.name}
                            className="w-12 h-12 rounded-full"
                          />
                        )}
                        <div>
                          <Text className="font-medium">
                            {member.user?.name || member.user?.username}
                          </Text>
                          <Text className="text-sm text-slate-400">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </Text>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-white/5 rounded-lg text-sm">
                          {member.role}
                        </span>
                        {isOwner && (
                          <Button
                            onClick={() => handleRemoveMember(member.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-400 border-red-500/20 hover:bg-red-500/10"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Links Tab */}
        {activeTab === "links" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Heading size="h3">Project Links</Heading>
              <Button
                onClick={() => setShowAddLink(true)}
                variant="gradient"
                size="sm"
                leftIcon={<IconPlus className="w-4 h-4" />}
              >
                Add Link
              </Button>
            </div>

            {showAddLink && (
              <GlassCard className="p-6">
                <Heading size="h4" className="mb-4">
                  Add Project Link
                </Heading>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="linkTitle">Title</Label>
                    <Input
                      id="linkTitle"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="Documentation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkUrl">URL</Label>
                    <Input
                      id="linkUrl"
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://docs.example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkType">Type</Label>
                    <Select value={linkType} onValueChange={setLinkType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="documentation">Documentation</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="deployment">Deployment</SelectItem>
                        <SelectItem value="repository">Repository</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddLink} variant="gradient">
                      Add Link
                    </Button>
                    <Button
                      onClick={() => setShowAddLink(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Links List - Disabled for now */}
            {false ? (
              <div className="space-y-4">
                {[].map((link: any) => (
                  <GlassCard key={link.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 flex-1 hover:text-sky-400 transition-colors"
                      >
                        <div className="p-3 bg-sky-500/10 rounded-lg">
                          {getLinkIcon(link.type)}
                        </div>
                        <div>
                          <Text className="font-medium">{link.title}</Text>
                          <Text className="text-sm text-slate-400">{link.url}</Text>
                        </div>
                        <IconExternalLink className="w-5 h-5 ml-auto" />
                      </a>
                      <Button
                        onClick={() => handleDeleteLink(link.id)}
                        variant="outline"
                        size="sm"
                        className="ml-4 text-red-400 border-red-500/20 hover:bg-red-500/10"
                        leftIcon={<IconTrash className="w-4 h-4" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <GlassCard className="p-12 text-center">
                <IconLink className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <Heading size="h3" className="mb-2">
                  No links yet
                </Heading>
                <Text className="text-slate-400">
                  Add links to documentation, designs, or other resources
                </Text>
              </GlassCard>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === "notes" && (
          <div className="h-[calc(100vh-300px)] mt-6">
            <ProjectNotes projectId={projectId} />
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="h-[calc(100vh-300px)] mt-6">
            <ProjectChat projectId={projectId} />
          </div>
        )}
      </Container>
    </div>
  );
}
