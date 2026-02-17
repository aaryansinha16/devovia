"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { DashboardFloatingDock } from "../../components/dashboard-floating-dock";
import { DashboardMobileSidebar } from "../../components/dashboard-mobile-sidebar";
import { SuperchargedProvider } from "../../components/supercharged/supercharged-context";
import SuperchargedPanel from "../../components/supercharged/supercharged-panel";
import { NotificationProvider } from "../../lib/notification-context";
import Loader from "../../components/ui/loader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <Loader />;
  }

  // If user is not authenticated, don't render anything (will redirect)
  if (!user) {
    return null;
  }

  return (
    <SuperchargedProvider>
      <NotificationProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Mobile Sidebar - Only visible on mobile */}
        <DashboardMobileSidebar />

        {/* Main Content - Full width on desktop, with bottom padding for dock */}
        <div className="flex-1 overflow-y-auto relative">
          {children}
        </div>

        {/* Floating Dock - Only visible on desktop (md and up) */}
        <div className="hidden md:block">
          <DashboardFloatingDock />
        </div>

        {/* Supercharged Mode — global command palette */}
        <SuperchargedPanel />
      </div>
      </NotificationProvider>
    </SuperchargedProvider>
  );
}
