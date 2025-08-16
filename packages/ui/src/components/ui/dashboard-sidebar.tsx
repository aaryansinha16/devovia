"use client";

import React, { useState } from "react";
import { cn } from "../../lib/utils";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const SidebarLink: React.FC<SidebarLinkProps> = ({
  href,
  icon,
  label,
  isActive = false,
  onClick,
}) => {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent",
      )}
    >
      <div
        className={cn(
          "w-5 h-5",
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
};

interface DashboardSidebarProps {
  links: Array<{
    href: string;
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
  }>;
  className?: string;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  links,
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "h-screen sticky top-0 bg-card border-r border-border transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[70px]" : "w-[240px]",
        className,
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div
            className={cn(
              "transition-opacity",
              isCollapsed ? "opacity-0" : "opacity-100",
            )}
          >
            <h2 className="text-lg font-bold text-foreground">Dashboard</h2>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            {isCollapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            )}
          </button>
        </div>
        <div className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1 px-3">
            {links.map((link, index) => (
              <SidebarLink
                key={index}
                href={link.href}
                icon={link.icon}
                label={link.label}
                isActive={link.isActive}
                onClick={() => {
                  // For mobile, collapse sidebar after click
                  if (window.innerWidth < 768) {
                    setIsCollapsed(true);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
