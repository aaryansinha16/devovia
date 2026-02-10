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
  IconBolt,
} from "@tabler/icons-react";
import { useSupercharged } from "./supercharged/supercharged-context";

export function DashboardFloatingDock() {
  const pathname = usePathname();
  const { toggle, isOpen, isActivating } = useSupercharged();

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
      <div className="pointer-events-auto flex items-end justify-center">
        <FloatingDock items={links} />
      </div>

      {/* Supercharged trigger — circle button, absolutely positioned */}
      <button
        onClick={toggle}
        title="Supercharged Mode (⌘K)"
        className={`supercharge-ring ${isActivating ? "active" : ""} pointer-events-auto absolute right-6 bottom-0 group flex items-center justify-center w-[46px] h-[46px] rounded-full transition-all duration-300 hover:scale-110 active:scale-95`}
        style={{
          animation: isActivating
            ? 'supercharge-vibrate 0.15s linear infinite, supercharge-electric 1.2s ease-in-out infinite'
            : 'none',
          background: isActivating || isOpen
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)'
            : 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          // position: "relative",
          // overflow: "visible",
          // Don't set boxShadow when activating — let the supercharge-electric animation control it
          ...(!isActivating && {
            boxShadow: isOpen
              ? '0 0 12px 3px rgba(129, 140, 248, 0.4), 0 0 24px 6px rgba(129, 140, 248, 0.15)'
              : '0 0 0 1px rgba(99, 102, 241, 0.15), 0 8px 32px -8px rgba(0, 0, 0, 0.5)',
          }),
        }}
      >
        <IconBolt
          className={`h-5 w-5 transition-all duration-300 ${
            isActivating
              ? 'text-indigo-200'
              : isOpen
                ? 'text-indigo-300'
                : 'text-indigo-400 group-hover:text-indigo-300'
          }`}
          style={{
            animation: isActivating
              ? 'supercharge-spin 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards, icon-charge 0.6s ease-in-out infinite'
              : 'none',
          }}
        />
      </button>
    </div>
  );
}
