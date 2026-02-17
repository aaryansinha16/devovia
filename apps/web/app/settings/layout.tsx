"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { Container, Heading, Text, GlassCard, BackgroundDecorative, Button } from "@repo/ui";
import { IconSettings, IconUser, IconShield, IconBell, IconChevronRight, IconAdjustments } from "@tabler/icons-react";
import { DashboardFloatingDock } from "../../components/dashboard-floating-dock";
import { DashboardMobileSidebar } from "../../components/dashboard-mobile-sidebar";
import { SuperchargedProvider } from "../../components/supercharged/supercharged-context";
import SuperchargedPanel from "../../components/supercharged/supercharged-panel";
import { NotificationProvider } from "../../lib/notification-context";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // Show nothing while loading to prevent flash
  if (isLoading) {
    return null;
  }

  // If user is not authenticated, redirect or show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <BackgroundDecorative />
        <GlassCard className="p-8 text-center relative z-10">
          <Heading size="h2" className="mb-4">Login Required</Heading>
          <Text variant="muted" className="mb-6">Please log in to access your account settings.</Text>
          <Button asChild variant="gradient">
            <Link href="/login">Login</Link>
          </Button>
        </GlassCard>
      </div>
    );
  }

  const navItems = [
    { name: "Profile", href: "/profile", icon: IconUser },
    { name: "Account", href: "/settings/account", icon: IconAdjustments },
    { name: "Security", href: "/settings/security", icon: IconShield },
    { name: "Notifications", href: "/settings/notifications", icon: IconBell },
  ];

  return (
    <SuperchargedProvider>
      <NotificationProvider>
        {/* Mobile Sidebar */}
        <DashboardMobileSidebar />
        
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-28">
          <BackgroundDecorative />
        
          <Container className="py-8 relative z-10">
            {/* Header */}
            <div className="mb-8">
              <Heading size="h1" variant="gradient" spacing="sm">
                Settings
              </Heading>
              <Text variant="muted">
                Manage your account settings and preferences
              </Text>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar Navigation */}
              <aside className="w-full lg:w-64 shrink-0">
                <GlassCard className="p-4">
                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all duration-200 group ${
                            isActive 
                              ? "bg-sky-500/10 text-sky-400" 
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5" />
                            <span>{item.name}</span>
                          </div>
                          <IconChevronRight className={`w-4 h-4 transition-transform ${
                            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                          }`} />
                        </Link>
                      );
                    })}
                  </nav>
                </GlassCard>
              </aside>

              {/* Main Content */}
              <main className="flex-1 min-w-0">{children}</main>
            </div>
          </Container>
        </div>

        {/* Floating Dock - Desktop only */}
        <div className="hidden md:block">
          <DashboardFloatingDock />
        </div>

        {/* Supercharged Mode — global command palette */}
        <SuperchargedPanel />
      </NotificationProvider>
    </SuperchargedProvider>
  );
}
