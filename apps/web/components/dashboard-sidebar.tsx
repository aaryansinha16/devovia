"use client";

import React, { useState } from "react";
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
  IconDeviceDesktop,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: IconDashboard },
  { name: "Sessions", href: "/dashboard/sessions", icon: IconDeviceDesktop },
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      className={`bg-card border-r border-slate-700 flex flex-col h-full transition-all duration-300 ease-in-out relative ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-[100] w-6 h-6 bg-card border border-slate-700 rounded-full flex items-center justify-center hover:bg-accent transition-colors shadow-lg"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <IconChevronRight className="w-4 h-4 text-foreground" />
        ) : (
          <IconChevronLeft className="w-4 h-4 text-foreground" />
        )}
      </button>

      {/* Logo Section */}
      <div className="p-6 border-b border-slate-700 flex-shrink-0">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <img src="/favicon-devovia.png" alt="Devovia" className="w-8 h-8 flex-shrink-0" />
          <h1 className={`text-xl font-bold text-foreground transition-all duration-300 overflow-hidden ${
            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          }`}>Devovia</h1>
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
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                    isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                  }`}>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User Profile Section - Fixed at bottom */}
      <div className="p-4 border-t border-slate-700 flex-shrink-0">
        {/* Theme Toggle */}
        <div className={`mb-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <ThemeToggle />
        </div>

        {/* User Info */}
        <div className={`flex items-center mb-4 ${
          isCollapsed ? 'justify-center' : 'space-x-3'
        }`}>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-semibold">
              {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
            </span>
          </div>
          <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${
            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          }`}>
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
          className={`w-full flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200 ${
            isCollapsed ? 'justify-center' : 'space-x-2'
          }`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <IconLogout className="w-4 h-4 flex-shrink-0" />
          <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          }`}>Logout</span>
        </button>
      </div>
    </div>
  );
}
