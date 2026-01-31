"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Heading,
  Text,
  GlassCard,
  Button,
  BackgroundDecorative,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import {
  IconPlus,
  IconSearch,
  IconLayoutGrid,
  IconLayoutList,
  IconRocket,
  IconUsers,
  IconLink,
  IconCalendar,
  IconClock,
} from "@tabler/icons-react";
import { useProjects } from "../../../lib/hooks/useProject";
import { useDebouncedValue } from "../../../lib/hooks/useDebounce";
import Loader from "../../../components/ui/loader";

export default function ProjectsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedVisibility, setSelectedVisibility] = useState<string>("all");
  const [myProjectsOnly, setMyProjectsOnly] = useState(false);

  const debouncedSearch = useDebouncedValue(searchQuery, 500);

  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
    visibility: selectedVisibility !== "all" ? selectedVisibility : undefined,
    myProjects: myProjectsOnly || undefined,
  }), [debouncedSearch, selectedStatus, selectedVisibility, myProjectsOnly]);

  const { data: projects = [], loading, error } = useProjects(1, 100, filters);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-28">
      <BackgroundDecorative />
      
      <Container className="py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <Heading size="h1" variant="gradient" spacing="sm">
              Projects
            </Heading>
            <Text variant="muted">
              Manage and showcase your development projects
            </Text>
          </div>
          <Button
            onClick={() => router.push("/dashboard/projects/create")}
            variant="gradient"
            size="md"
            leftIcon={<IconPlus className="w-5 h-5" />}
          >
            New Project
          </Button>
        </div>

        {/* Filters */}
        <GlassCard className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50"
              />
            </div>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PLANNING">Planning</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Visibility Filter */}
            <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
              <SelectTrigger>
                <SelectValue placeholder="All Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
                <SelectItem value="TEAM_ONLY">Team Only</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex gap-2">
              <Button
                variant={myProjectsOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setMyProjectsOnly(!myProjectsOnly)}
                className="flex-1"
              >
                My Projects
              </Button>
              <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid"
                      ? "bg-sky-500 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <IconLayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "list"
                      ? "bg-sky-500 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <IconLayoutList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Projects Grid/List */}
        {loading ? (
          <Loader />
        ) : error ? (
          <GlassCard className="p-12 text-center">
            <IconRocket className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <Heading size="h3" className="mb-2">
              Error loading projects
            </Heading>
            <Text className="text-slate-400 mb-6">
              {error.message}
            </Text>
          </GlassCard>
        ) : projects.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <IconRocket className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <Heading size="h3" className="mb-2">
              No projects found
            </Heading>
            <Text className="text-slate-400 mb-6">
              {myProjectsOnly
                ? "You haven't created any projects yet. Start by creating your first project!"
                : "No projects match your filters. Try adjusting your search criteria."}
            </Text>
            {myProjectsOnly && (
              <Button
                onClick={() => router.push("/dashboard/projects/create")}
                variant="gradient"
              >
                Create Your First Project
              </Button>
            )}
          </GlassCard>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
            }
          >
            {projects.map((project) => (
              <GlassCard
                key={project.id}
                className="p-6 hover:shadow-xl hover:shadow-sky-500/10 transition-all cursor-pointer group"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                {/* Thumbnail */}
                {project.thumbnail && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <Heading size="h3" className="group-hover:text-sky-400 transition-colors">
                    {project.title}
                  </Heading>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {formatStatus(project.status)}
                  </span>
                </div>

                {/* Description */}
                <Text className="text-slate-400 mb-4 line-clamp-2">
                  {project.description}
                </Text>

                {/* Tech Stack */}
                {project.techStack && project.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.techStack.slice(0, 3).map((tech: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-white/5 rounded-lg text-xs text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.techStack.length > 3 && (
                      <span className="px-2 py-1 bg-white/5 rounded-lg text-xs text-slate-400">
                        +{project.techStack.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <IconUsers className="w-4 h-4" />
                    <span>{project.members?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconLink className="w-4 h-4" />
                    <span>{project._count?.links || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconCalendar className="w-4 h-4" />
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
