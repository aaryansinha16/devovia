"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { DashboardCanvasLayout } from "../../components/dashboard-canvas-layout";
import { fetchDashboardStats, fetchDashboardActivity, DashboardStats, DashboardActivity } from "../../lib/dashboard-api";
import { IconPlus } from "@tabler/icons-react";
import NotificationBell from "../../components/notifications/notification-bell";
import { Button, Container, Heading, Text, BackgroundDecorative, toast } from "@repo/ui";
import { useRouter } from "next/navigation";
import Loader from "../../components/ui/loader";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [statsResponse, activityResponse] = await Promise.all([
          fetchDashboardStats(),
          fetchDashboardActivity(5),
        ]);
        setStats(statsResponse.data);
        setActivities(activityResponse.data);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (isLoading && !stats) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900 pb-24 relative overflow-hidden">
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
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/blogs/create"
              className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 text-white flex items-center gap-2 shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 hover:scale-105"
            >
              <IconPlus className="w-5 h-5" />
              <span>New Project</span>
            </Link>
            <NotificationBell />
          </div>
        </div>

        {/* Canvas Widget Dashboard */}
        <DashboardCanvasLayout
          stats={stats}
          activities={activities}
          isLoading={isLoading}
        />
      </Container>
    </div>
  );
}
