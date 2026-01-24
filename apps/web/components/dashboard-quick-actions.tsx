import React from "react";
import Link from "next/link";
import {
  IconPlus,
  IconTemplate,
  IconRocket,
  IconUsers,
  IconCode,
  IconFileText,
} from "@tabler/icons-react";
import { GlassCard, Heading } from "@repo/ui";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    title: "Create Blog",
    description: "Write a new blog post",
    href: "/dashboard/blogs/create",
    icon: <IconFileText className="w-5 h-5" />,
    color: "bg-blue-600",
  },
  {
    title: "New Snippet",
    description: "Save reusable code",
    href: "/dashboard/snippets/create",
    icon: <IconCode className="w-5 h-5" />,
    color: "bg-purple-600",
  },
  {
    title: "Use Template",
    description: "Start from template",
    href: "/dashboard/templates",
    icon: <IconTemplate className="w-5 h-5" />,
    color: "bg-green-600",
  },
  {
    title: "Deploy Project",
    description: "Setup deployment",
    href: "/dashboard/deployments",
    icon: <IconRocket className="w-5 h-5" />,
    color: "bg-orange-600",
  },
];

export function DashboardQuickActions() {
  return (
    <GlassCard padding="lg">
      <Heading size="h3" variant="gradient" spacing="lg">
        Quick Actions
      </Heading>

      <div className="space-y-3">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group w-full flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 dark:hover:from-sky-900/20 dark:hover:to-indigo-900/20 rounded-xl transition-all duration-300 hover:shadow-md"
          >
            <div
              className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
            >
              {action.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{action.title}</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 p-6 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl shadow-lg shadow-sky-500/30">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-bold text-white mb-2">Pro Tip</h4>
            <p className="text-white/90 text-sm leading-relaxed">
              Use keyboard shortcuts to speed up your workflow. Press <kbd className="px-2 py-1 bg-white/20 rounded text-xs font-mono">Cmd+K</kbd> to open the command palette.
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
