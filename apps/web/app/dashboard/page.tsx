"use client";

// This ensures the page is always rendered at request time, not build time
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { StatsCard } from "../../components/dashboard-stats-card";
import { DashboardQuickActions } from "../../components/dashboard-quick-actions";
import { DashboardRecentProjects } from "../../components/dashboard-recent-projects";
import {
  IconPlus,
  IconBell,
  IconCheck,
  IconCode,
  IconRocket,
  IconUsers,
} from "@tabler/icons-react";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.name || user?.username || "Developer"}!
          </h2>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex space-x-4">
          <Link
            href="/dashboard/blogs/create"
            className="bg-primary hover:bg-primary/90 px-6 py-2 rounded-lg font-medium transition-colors text-primary-foreground flex items-center space-x-2"
          >
            <IconPlus className="w-4 h-4" />
            <span>New Project</span>
          </Link>
          <button className="bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg transition-colors">
            <IconBell className="w-5 h-5 text-secondary-foreground" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Active Projects"
          value="12"
          change={{ value: "+2 this week", type: "increase" }}
          icon={
            <IconCheck className="w-6 h-6 text-white bg-blue-600 p-1 rounded" />
          }
          gradient={true}
        />

        <StatsCard
          title="Code Snippets"
          value="247"
          change={{ value: "+15 this week", type: "increase" }}
          icon={
            <IconCode className="w-6 h-6 text-white bg-purple-600 p-1 rounded" />
          }
        />

        <StatsCard
          title="Deployments"
          value="89"
          change={{ value: "+7 this week", type: "increase" }}
          icon={
            <IconRocket className="w-6 h-6 text-white bg-green-600 p-1 rounded" />
          }
        />

        <StatsCard
          title="Team Members"
          value="8"
          change={{ value: "+1 this week", type: "increase" }}
          icon={
            <IconUsers className="w-6 h-6 text-white bg-orange-600 p-1 rounded" />
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <DashboardRecentProjects />
        </div>

        {/* Quick Actions */}
        <div>
          <DashboardQuickActions />
        </div>
      </div>
    </div>
  );
}
