import React from "react";
import Link from "next/link";
import { IconExternalLink } from "@tabler/icons-react";
import { GlassCard, Heading, Text, EmptyState } from "@repo/ui";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "in-review" | "deployed" | "paused";
  lastUpdated: string;
  tech: string[];
  color: string;
}

// Mock data - replace with real data from your API
const recentProjects: Project[] = [
  {
    id: "1",
    name: "E-commerce Dashboard",
    description: "Modern admin dashboard for online store",
    status: "active",
    lastUpdated: "2h ago",
    tech: ["React", "TypeScript", "Tailwind"],
    color: "bg-blue-600",
  },
  {
    id: "2",
    name: "API Gateway Service",
    description: "Microservices API gateway",
    status: "in-review",
    lastUpdated: "5h ago",
    tech: ["Node.js", "Express", "MongoDB"],
    color: "bg-purple-600",
  },
  {
    id: "3",
    name: "Mobile App Template",
    description: "Cross-platform mobile starter",
    status: "deployed",
    lastUpdated: "1d ago",
    tech: ["React Native", "Expo"],
    color: "bg-green-600",
  },
];

const statusConfig = {
  active: { label: "Active", className: "bg-green-600 text-green-100" },
  "in-review": {
    label: "In Review",
    className: "bg-yellow-600 text-yellow-100",
  },
  deployed: { label: "Deployed", className: "bg-blue-600 text-blue-100" },
  paused: { label: "Paused", className: "bg-gray-600 text-gray-100" },
};

export function DashboardRecentProjects() {
  return (
    <GlassCard padding="lg">
      <div className="flex justify-between items-center mb-6">
        <Heading size="h3" variant="gradient">
          Recent Projects
        </Heading>
        <Link
          href="/dashboard/projects"
          className="flex items-center gap-2 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 text-sm font-medium transition-colors group"
        >
          <span>View All</span>
          <IconExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      <div className="space-y-3">
        {recentProjects.map((project) => (
          <div
            key={project.id}
            className="group flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 dark:hover:from-sky-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 cursor-pointer hover:shadow-md"
          >
            <div className="flex items-center gap-4 flex-1">
              <div
                className={`w-12 h-12 ${project.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors text-base">
                  {project.name}
                </h4>
                <Text variant="muted" size="sm" className="mt-0.5">
                  {project.tech.join(" • ")}
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1.5 text-xs font-medium rounded-lg ${statusConfig[project.status].className}`}
                >
                  {statusConfig[project.status].label}
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5">
                  Updated {project.lastUpdated}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recentProjects.length === 0 && (
        <EmptyState
          icon="📁"
          title="No recent projects found"
          action={
            <Link
              href="/dashboard/projects/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-sky-500/30"
            >
              Create your first project
            </Link>
          }
        />
      )}
    </GlassCard>
  );
}
