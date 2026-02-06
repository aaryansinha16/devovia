import React from "react";
import Link from "next/link";
import { GlassCard, Heading, Text } from "@repo/ui";
import {
  IconRocket,
  IconCode,
  IconFileText,
  IconPlayerPlay,
  IconBrandGithub,
  IconClock,
} from "@tabler/icons-react";
import { DashboardActivity } from "../lib/dashboard-api";

interface ActivityFeedProps {
  activities: DashboardActivity[];
  isLoading?: boolean;
}

const activityConfig = {
  project: {
    icon: IconRocket,
    color: "bg-blue-600",
    href: (id: string) => `/dashboard/projects/${id}`,
  },
  snippet: {
    icon: IconCode,
    color: "bg-purple-600",
    href: (id: string) => `/dashboard/snippets/${id}`,
  },
  blog: {
    icon: IconFileText,
    color: "bg-green-600",
    href: (id: string) => `/blogs/${id}`,
  },
  runbook: {
    icon: IconPlayerPlay,
    color: "bg-orange-600",
    href: (id: string) => `/dashboard/runbooks/${id}`,
  },
  deployment: {
    icon: IconBrandGithub,
    color: "bg-sky-600",
    href: (id: string) => `/dashboard/deployments/${id}`,
  },
};

const getTimeAgo = (timestamp: string) => {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
};

export function DashboardActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <GlassCard padding="lg">
        <Heading size="h3" variant="gradient" spacing="lg">
          Recent Activity
        </Heading>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg">
              <div className="w-10 h-10 bg-slate-700/50 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700/50 rounded w-3/4" />
                <div className="h-3 bg-slate-700/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (activities.length === 0) {
    return (
      <GlassCard padding="lg">
        <Heading size="h3" variant="gradient" spacing="lg">
          Recent Activity
        </Heading>
        <div className="text-center py-12">
          <IconClock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <Text variant="muted">No recent activity</Text>
          <Text variant="muted" size="sm" className="mt-2">
            Start creating projects, snippets, or blogs to see your activity here
          </Text>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="lg">
      <Heading size="h3" variant="gradient" spacing="lg">
        Recent Activity
      </Heading>

      <div className="space-y-2">
        {activities.map((activity) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;

          return (
            <Link
              key={`${activity.type}-${activity.id}-${activity.timestamp}`}
              href={config.href(activity.id)}
              className="group flex items-center gap-4 p-4 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
            >
              <div
                className={`w-10 h-10 ${config.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 font-medium truncate group-hover:text-sky-400 transition-colors">
                  {activity.title}
                </p>
                <p className="text-slate-400 text-sm mt-0.5">
                  <span className="capitalize">{activity.action}</span> • {getTimeAgo(activity.timestamp)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </GlassCard>
  );
}
