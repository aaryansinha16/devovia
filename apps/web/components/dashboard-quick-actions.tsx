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
    <div className="bg-card border border-slate-700 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-foreground mb-6">
        Quick Actions
      </h3>

      <div className="space-y-4">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="w-full flex items-center space-x-3 p-4 bg-background hover:bg-accent rounded-lg transition-colors text-left group"
          >
            <div
              className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
            >
              {action.icon}
            </div>
            <div>
              <h4 className="font-medium text-foreground">{action.title}</h4>
              <p className="text-muted-foreground text-sm">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gradient-to-r from-primary to-purple-600 rounded-lg">
        <h4 className="font-semibold text-white mb-2">💡 Pro Tip</h4>
        <p className="text-primary-foreground/90 text-sm">
          Use keyboard shortcuts to speed up your workflow. Press Cmd+K to open
          the command palette.
        </p>
      </div>
    </div>
  );
}
