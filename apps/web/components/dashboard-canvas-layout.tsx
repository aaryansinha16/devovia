"use client";

import React, { useState, useEffect, JSX } from "react";
import { Rnd } from "react-rnd";
import { GlassCard, Button, Text, toast } from "@repo/ui";
import { StatsCard } from "./dashboard-stats-card";
import { DashboardQuickActions } from "./dashboard-quick-actions";
import { DashboardStats, DashboardActivity } from "../lib/dashboard-api";
import Link from "next/link";
import {
  IconRocket,
  IconCode,
  IconFileText,
  IconBrandGithub,
  IconDeviceDesktop,
  IconTrendingUp,
  IconClock,
  IconPlayerPlay,
  IconX,
  IconPlus,
  IconLayoutGrid,
  IconRotateClockwise,
  IconLock,
  IconLockOpen,
} from "@tabler/icons-react";

interface DashboardCanvasLayoutProps {
  stats: DashboardStats | null;
  activities: DashboardActivity[];
  isLoading: boolean;
}

interface WidgetPosition {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

const activityConfig = {
  project: { icon: IconRocket, color: "bg-blue-600", href: (id: string) => `/dashboard/projects/${id}` },
  snippet: { icon: IconCode, color: "bg-purple-600", href: (id: string) => `/dashboard/snippets/${id}` },
  blog: { icon: IconFileText, color: "bg-green-600", href: (id: string) => `/blogs/${id}` },
  runbook: { icon: IconPlayerPlay, color: "bg-orange-600", href: (id: string) => `/dashboard/runbooks/${id}` },
  deployment: { icon: IconBrandGithub, color: "bg-sky-600", href: (id: string) => `/dashboard/deployments/${id}` },
};

const getTimeAgo = (timestamp: string) => {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const DEFAULT_WIDGETS: WidgetPosition[] = [
  { id: "activity", title: "Recent Activity", x: 16, y: 16, width: 580, height: 380, visible: true },
  { id: "projects", title: "Recent Projects", x: 616, y: 16, width: 500, height: 380, visible: true },
  { id: "quick-actions", title: "Quick Actions", x: 16, y: 416, width: 400, height: 340, visible: true },
  { id: "insights", title: "Insights & Breakdown", x: 436, y: 416, width: 680, height: 340, visible: true },
];

export function DashboardCanvasLayout({ stats, activities, isLoading }: DashboardCanvasLayoutProps) {
  const [widgets, setWidgets] = useState<WidgetPosition[]>(DEFAULT_WIDGETS);
  const [isEditMode, setIsEditMode] = useState(false);

  const toggleEditMode = () => {
    const next = !isEditMode;
    setIsEditMode(next);
    if (next) {
      toast.info("Edit Mode: Drag to move • Resize from any edge or corner");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("dashboard-canvas-layout");
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved layout", e);
      }
    }
  }, []);

  const saveLayout = (newWidgets: WidgetPosition[]) => {
    localStorage.setItem("dashboard-canvas-layout", JSON.stringify(newWidgets));
  };

  const updateWidget = (id: string, updates: Partial<WidgetPosition>) => {
    const newWidgets = widgets.map((w) => (w.id === id ? { ...w, ...updates } : w));
    setWidgets(newWidgets);
    saveLayout(newWidgets);
  };

  const toggleWidget = (id: string) => {
    const newWidgets = widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    setWidgets(newWidgets);
    saveLayout(newWidgets);
  };

  const resetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem("dashboard-canvas-layout");
  };

  const renderActivityWidget = () => (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-3 bg-slate-800/30 rounded-lg">
                <div className="w-10 h-10 bg-slate-700/50 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700/50 rounded w-3/4" />
                  <div className="h-3 bg-slate-700/50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <IconClock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <Text variant="muted">No recent activity</Text>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => {
              const config = activityConfig[activity.type];
              const Icon = config.icon;
              return (
                <Link
                  key={`${activity.type}-${activity.id}-${activity.timestamp}`}
                  href={config.href(activity.id)}
                  className="group flex items-center gap-3 p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg transition-all"
                >
                  <div className={`w-9 h-9 ${config.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate group-hover:text-sky-400 transition-colors">
                      {activity.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="capitalize">{activity.action}</span> • {getTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderProjectsWidget = () => (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar">
        {!stats?.recent.projects || stats.recent.projects.length === 0 ? (
          <div className="text-center py-8">
            <IconRocket className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <Text variant="muted">No projects yet</Text>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recent.projects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="block p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg transition-all group"
              >
                <h4 className="font-semibold text-slate-200 mb-1 text-sm group-hover:text-sky-400 transition-colors">
                  {project.title}
                </h4>
                <p className="text-slate-400 text-xs line-clamp-1">{project.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span className="capitalize px-2 py-0.5 bg-slate-700/50 rounded">
                    {project.status.toLowerCase().replace("_", " ")}
                  </span>
                  <span>{project._count.members} members</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderQuickActionsWidget = () => (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar">
        <DashboardQuickActions />
      </div>
    </div>
  );

  const renderInsightsWidget = () => (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/30 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconFileText className="w-5 h-5 text-sky-400" />
                <span className="text-sm text-slate-300">Published Blogs</span>
              </div>
              <span className="text-lg font-bold text-slate-100">{stats?.overview.blogs.published || 0}</span>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconDeviceDesktop className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-slate-300">Active Sessions</span>
              </div>
              <span className="text-lg font-bold text-slate-100">{stats?.overview.sessions.active || 0}</span>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconTrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-sm text-slate-300">Engagement</span>
              </div>
              <span className="text-lg font-bold text-slate-100">
                {(stats?.overview.engagement.likes || 0) + (stats?.overview.engagement.comments || 0)}
              </span>
            </div>
          </div>

          {stats?.breakdown && (
            <div className="space-y-3 pt-3 border-t border-slate-700/50">
              {stats.breakdown.projectsByStatus.length > 0 && (
                <div>
                  <Text variant="muted" size="sm" className="mb-2 font-medium">
                    Projects by Status
                  </Text>
                  <div className="space-y-1">
                    {stats.breakdown.projectsByStatus.map((item) => (
                      <div key={item.status} className="flex items-center justify-between text-sm py-1">
                        <span className="text-slate-400 capitalize">{item.status.toLowerCase().replace("_", " ")}</span>
                        <span className="text-slate-300 font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {stats.breakdown.snippetsByLanguage.length > 0 && (
                <div>
                  <Text variant="muted" size="sm" className="mb-2 font-medium">
                    Top Languages
                  </Text>
                  <div className="space-y-1">
                    {stats.breakdown.snippetsByLanguage.slice(0, 5).map((item) => (
                      <div key={item.language} className="flex items-center justify-between text-sm py-1">
                        <span className="text-slate-400">{item.language}</span>
                        <span className="text-slate-300 font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const widgetRenderers: Record<string, () => JSX.Element> = {
    activity: renderActivityWidget,
    projects: renderProjectsWidget,
    "quick-actions": renderQuickActionsWidget,
    insights: renderInsightsWidget,
  };

  const widgetIcons: Record<string, JSX.Element> = {
    activity: <IconClock className="w-4 h-4 text-sky-400" />,
    projects: <IconRocket className="w-4 h-4 text-blue-400" />,
    "quick-actions": <IconPlus className="w-4 h-4 text-green-400" />,
    insights: <IconTrendingUp className="w-4 h-4 text-purple-400" />,
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview - Always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Projects"
          value={stats?.overview.projects.total || 0}
          change={{
            value: `${(stats?.overview.projects.change || 0) >= 0 ? "+" : ""}${stats?.overview.projects.change || 0}%`,
            type: (stats?.overview.projects.change || 0) >= 0 ? "increase" : "decrease",
          }}
          icon={<IconRocket className="w-6 h-6 text-white" />}
        />
        <StatsCard
          title="Code Snippets"
          value={stats?.overview.snippets.total || 0}
          change={{
            value: `${(stats?.overview.snippets.change || 0) >= 0 ? "+" : ""}${stats?.overview.snippets.change || 0}%`,
            type: (stats?.overview.snippets.change || 0) >= 0 ? "increase" : "decrease",
          }}
          icon={<IconCode className="w-6 h-6 text-white" />}
        />
        <StatsCard
          title="Runbooks"
          value={stats?.overview.runbooks.total || 0}
          change={{
            value: `${(stats?.overview.runbooks.change || 0) >= 0 ? "+" : ""}${stats?.overview.runbooks.change || 0}%`,
            type: (stats?.overview.runbooks.change || 0) >= 0 ? "increase" : "decrease",
          }}
          icon={<IconFileText className="w-6 h-6 text-white" />}
        />
        <StatsCard
          title="Deployments"
          value={stats?.overview.deployments.total || 0}
          change={{
            value: `${(stats?.overview.deployments.change || 0) >= 0 ? "+" : ""}${stats?.overview.deployments.change || 0}%`,
            type: (stats?.overview.deployments.change || 0) >= 0 ? "increase" : "decrease",
          }}
          icon={<IconBrandGithub className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <IconLayoutGrid className="w-5 h-5 text-sky-400" />
          <h2 className="text-lg font-semibold text-slate-200">Canvas Dashboard</h2>
          <Text variant="muted" size="sm" className="ml-2">
            {isEditMode ? "Drag widgets to move • Resize from any edge or corner" : "Click to unlock editing"}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={toggleEditMode}
          >
            {isEditMode ? <IconLockOpen className="w-4 h-4 mr-1" /> : <IconLock className="w-4 h-4 mr-1" />}
            {isEditMode ? "Lock Layout" : "Unlock Layout"}
          </Button>
          <Button variant="outline" size="sm" onClick={resetLayout}>
            <IconRotateClockwise className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative min-h-[800px] bg-slate-900/30 rounded-lg overflow-hidden">
        {widgets
          .filter((w) => w.visible)
          .map((widget) => (
            <Rnd
              key={widget.id}
              default={{
                x: widget.x,
                y: widget.y,
                width: widget.width,
                height: widget.height,
              }}
              minWidth={300}
              minHeight={250}
              bounds="parent"
              disableDragging={!isEditMode}
              enableResizing={isEditMode}
              onDragStop={(e, d) => {
                updateWidget(widget.id, { x: d.x, y: d.y });
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                updateWidget(widget.id, {
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height),
                  ...position,
                });
              }}
              className={`${isEditMode ? "cursor-move" : ""}`}
              resizeHandleStyles={{
                top: { cursor: "ns-resize" },
                right: { cursor: "ew-resize" },
                bottom: { cursor: "ns-resize" },
                left: { cursor: "ew-resize" },
                topRight: { cursor: "nesw-resize" },
                bottomRight: { cursor: "nwse-resize" },
                bottomLeft: { cursor: "nesw-resize" },
                topLeft: { cursor: "nwse-resize" },
              }}
            >
              <GlassCard className={`h-full flex flex-col ${isEditMode ? "ring-2 ring-sky-500/30" : ""}`}>
                <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    {widgetIcons[widget.id]}
                    <h3 className="font-semibold text-slate-200 text-sm">{widget.title}</h3>
                  </div>
                  {isEditMode && (
                    <button
                      onClick={() => toggleWidget(widget.id)}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <IconX className="w-4 h-4 text-slate-400 hover:text-red-400" />
                    </button>
                  )}
                </div>
                {widgetRenderers[widget.id]?.()}
              </GlassCard>
            </Rnd>
          ))}
      </div>


      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.7);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(71, 85, 105, 0.5) rgba(15, 23, 42, 0.3);
        }
      `}</style>
    </div>
  );
}
