import React from "react";
import Link from "next/link";
import { IconExternalLink } from "@tabler/icons-react";

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
    <div className="bg-card border border-slate-700 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-foreground">
          Recent Projects
        </h3>
        <Link
          href="/dashboard/projects"
          className="text-primary hover:text-primary/80 text-sm font-medium flex items-center space-x-1"
        >
          <span>View All</span>
          <IconExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-4">
        {recentProjects.map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between p-4 bg-background rounded-lg hover:bg-accent transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-10 h-10 ${project.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {project.name}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {project.tech.join(" • ")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-2 py-1 text-xs rounded-full ${statusConfig[project.status].className}`}
              >
                {statusConfig[project.status].label}
              </span>
              <p className="text-muted-foreground text-sm mt-1">
                Updated {project.lastUpdated}
              </p>
            </div>
          </div>
        ))}
      </div>

      {recentProjects.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400">No recent projects found.</p>
          <Link
            href="/dashboard/projects/create"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium mt-2 inline-block"
          >
            Create your first project
          </Link>
        </div>
      )}
    </div>
  );
}
