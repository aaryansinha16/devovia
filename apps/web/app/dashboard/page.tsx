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
import { Button, Container, Heading, Text, IconButton, BackgroundDecorative } from "@repo/ui";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <BackgroundDecorative />

      <Container className="relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-10">
          <div>
            <Heading size="h1" variant="gradient" spacing="sm">
              Welcome back, {user?.name || user?.username || "Developer"}!
            </Heading>
            <Text>
              Here's what's happening with your projects today.
            </Text>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/blogs/create"
              className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 text-white flex items-center gap-2 shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 hover:scale-105"
            >
              <IconPlus className="w-5 h-5" />
              <span>New Project</span>
            </Link>
            <IconButton icon={<IconBell className="w-5 h-5 text-slate-700 dark:text-slate-300" />} />
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
      </Container>
    </div>
  );
}
