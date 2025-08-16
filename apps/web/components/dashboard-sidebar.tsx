"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { ThemeToggle } from "./ui/theme-toggle";
import {
  IconDashboard,
  IconCode,
  IconTemplate,
  IconRocket,
  IconUsers,
  IconChartBar,
  IconFileText,
  IconSettings,
  IconLogout,
} from "@tabler/icons-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: IconDashboard },
  { name: "Blogs", href: "/dashboard/blogs", icon: IconFileText },
  { name: "Code Snippets", href: "/dashboard/snippets", icon: IconCode },
  {
    name: "Project Templates",
    href: "/dashboard/templates",
    icon: IconTemplate,
  },
  { name: "Deployments", href: "/dashboard/deployments", icon: IconRocket },
  { name: "Team Collaboration", href: "/dashboard/team", icon: IconUsers },
  { name: "Analytics", href: "/dashboard/analytics", icon: IconChartBar },
  { name: "Settings", href: "/settings", icon: IconSettings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="w-64 bg-card border-r border-slate-700 flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <img src="/favicon-devovia.png" alt="Devovia" className="w-8 h-8" />
          <h1 className="text-xl font-bold text-foreground">Devovia</h1>
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User Profile Section - Fixed at bottom */}
      <div className="p-4 border-t border-slate-700 flex-shrink-0">
        {/* Theme Toggle */}
        <div className="mb-4">
          <ThemeToggle />
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-semibold">
              {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name || user?.username || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center space-x-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
        >
          <IconLogout className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
