"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { FloatingDock } from "@repo/ui";
import {
  IconDashboard,
  IconCode,
  IconTemplate,
  IconRocket,
  IconUsers,
  IconChartBar,
  IconFileText,
  IconSettings,
  IconDeviceDesktop,
  IconPlayerPlay,
  IconBriefcase,
} from "@tabler/icons-react";

export function DashboardFloatingDock() {
  const pathname = usePathname();

  const links = [
    {
      title: "Dashboard",
      icon: (
        <IconDashboard className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/dashboard",
      isActive: pathname === "/dashboard",
    },
    {
      title: "Sessions",
      icon: (
        <IconDeviceDesktop className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/dashboard/sessions",
      isActive: pathname.startsWith("/dashboard/sessions"),
    },
    {
      title: "Runbooks",
      icon: (
        <IconPlayerPlay className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/dashboard/runbooks",
      isActive: pathname.startsWith("/dashboard/runbooks"),
    },
    {
      title: "Blogs",
      icon: (
        <IconFileText className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/dashboard/blogs",
      isActive: pathname.startsWith("/dashboard/blogs"),
    },
    {
      title: "Snippets",
      icon: (
        <IconCode className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/dashboard/snippets",
      isActive: pathname.startsWith("/dashboard/snippets"),
    },
    {
      title: "Projects & Teams",
      icon: (
        <IconBriefcase className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/dashboard/projects",
      isActive: pathname.startsWith("/dashboard/projects"),
    },
    {
      title: "Templates",
      icon: (
        <IconTemplate className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/dashboard/templates",
      isActive: pathname.startsWith("/dashboard/templates"),
    },
    {
      title: "Deployments",
      icon: (
        <IconRocket className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/dashboard/deployments",
      isActive: pathname.startsWith("/dashboard/deployments"),
    },
    {
      title: "Analytics",
      icon: (
        <IconChartBar className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/dashboard/analytics",
      isActive: pathname.startsWith("/dashboard/analytics"),
    },
    {
      title: "Settings",
      icon: (
        <IconSettings className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/settings",
      isActive: pathname.startsWith("/settings"),
    },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none">
      <div className="pointer-events-auto">
        <FloatingDock items={links} />
      </div>
    </div>
  );
}
