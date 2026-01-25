"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Heading,
  Text,
  GlassCard,
  Button,
  Input,
  Label,
  Textarea,
  BackgroundDecorative,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  IconPlus,
  IconX,
} from "@repo/ui";

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [status, setStatus] = useState("PLANNING");
  const [visibility, setVisibility] = useState("PRIVATE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProject();
    }
  }, [params.id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const tokens = getTokens();
      if (!tokens?.accessToken) {
        router.push("/dashboard/projects");
        return;
      }

      const response = await fetch(`${API_URL}/projects/${params.id}`, {
        headers: {
          "Authorization": `Bearer ${tokens.accessToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const project = data.project;
        setTitle(project.title);
        setDescription(project.description);
        setRepoUrl(project.repoUrl || "");
        setDemoUrl(project.demoUrl || "");
        setThumbnail(project.thumbnail || "");
        setTechStack(project.techStack || []);
        setStatus(project.status);
        setVisibility(project.visibility);
        setStartDate(project.startDate ? project.startDate.split("T")[0] : "");
        setEndDate(project.endDate ? project.endDate.split("T")[0] : "");
      } else {
        router.push("/dashboard/projects");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      router.push("/dashboard/projects");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTech = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      setTechStack([...techStack, techInput.trim()]);
      setTechInput("");
    }
  };

  const handleRemoveTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tokens = getTokens();
      if (!tokens?.accessToken) {
        alert("Please log in to update projects");
        return;
      }

      const response = await fetch(`${API_URL}/projects/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          title,
          description,
          repoUrl: repoUrl || null,
          demoUrl: demoUrl || null,
          thumbnail: thumbnail || null,
          techStack,
          status,
          visibility,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });

      if (response.ok) {
        router.push(`/dashboard/projects/${params.id}`);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <BackgroundDecorative />
      
      <Container className="py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            leftIcon={<IconArrowLeft className="w-5 h-5" />}
          >
            Back
          </Button>
          <div>
            <Heading size="h1" className="mb-2">
              Edit Project
            </Heading>
            <Text className="text-slate-400">
              Update your project information
            </Text>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <GlassCard className="p-8 mb-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Awesome Project"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project..."
                  rows={4}
                  required
                />
              </div>

              {/* URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="repoUrl">Repository URL</Label>
                  <Input
                    id="repoUrl"
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                  />
                </div>
                <div>
                  <Label htmlFor="demoUrl">Demo URL</Label>
                  <Input
                    id="demoUrl"
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://demo.example.com"
                  />
                </div>
              </div>

              {/* Thumbnail */}
              <div>
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  type="url"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                {thumbnail && (
                  <div className="mt-2 rounded-lg overflow-hidden">
                    <img
                      src={thumbnail}
                      alt="Thumbnail preview"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Tech Stack */}
              <div>
                <Label htmlFor="techStack">Tech Stack</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="techStack"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTech();
                      }
                    }}
                    placeholder="Add technology (e.g., React, Node.js)"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTech}
                    variant="outline"
                    leftIcon={<IconPlus className="w-4 h-4" />}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-sky-500/10 text-sky-400 rounded-lg text-sm flex items-center gap-2 border border-sky-500/20"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(tech)}
                        className="hover:text-sky-300"
                      >
                        <IconX className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Status and Visibility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                      <SelectItem value="TEAM_ONLY">Team Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Actions */}
          <div className="flex gap-4 justify-end pb-6">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={saving || !title || !description}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
}
