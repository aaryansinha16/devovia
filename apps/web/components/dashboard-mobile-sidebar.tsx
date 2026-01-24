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
  IconPlayerPlay,
  IconMenu2,
  IconX,
  IconBriefcase,
} from "@tabler/icons-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: IconDashboard },
  { name: "Sessions", href: "/dashboard/sessions", icon: IconDeviceDesktop },
  { name: "Runbooks", href: "/dashboard/runbooks", icon: IconPlayerPlay },
  { name: "Blogs", href: "/dashboard/blogs", icon: IconFileText },
  { name: "Code Snippets", href: "/dashboard/snippets", icon: IconCode },
  { name: "Projects & Teams", href: "/dashboard/projects", icon: IconBriefcase },
  {
    name: "Project Templates",
    href: "/dashboard/templates",
    icon: IconTemplate,
  },
  { name: "Deployments", href: "/dashboard/deployments", icon: IconRocket },
  { name: "Analytics", href: "/dashboard/analytics", icon: IconChartBar },
  { name: "Settings", href: "/settings", icon: IconSettings },
];

export function DashboardMobileSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-[60] p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
      >
        {isOpen ? (
          <IconX className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        ) : (
          <IconMenu2 className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[55]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-[58] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <img
              src="/favicon-devovia.png"
              alt="Devovia"
              className="w-8 h-8 flex-shrink-0"
            />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Devovia
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          {user && (
            <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <div className="flex items-center space-x-3">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || user.username}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {(user.name || user.username || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {user.name || user.username}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">Theme</span>
            <ThemeToggle />
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
          >
            <IconLogout className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
