"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { DashboardSidebar } from "../../components/dashboard-sidebar";
import {
  resetAllCursorStyles,
  registerGlobalCursorFix,
} from "../../lib/cursor-manager";

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

  // Ensure cursor is always visible in dashboard
  useEffect(() => {
    // Reset any lingering cursor styles
    resetAllCursorStyles();

    // Register global fix for cursor disappearing on button hover
    registerGlobalCursorFix();

    return () => {
      resetAllCursorStyles();
    };
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, don't render anything (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
