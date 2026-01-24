"use client";

import React from "react";
import {
  IconApi,
  IconDatabase,
  IconClock,
  IconUserCheck,
  IconGitBranch,
  IconBrain,
  IconArrowsSplit,
} from "@tabler/icons-react";

interface StepPaletteProps {
   
  onAddStep: (type: string) => void;
}

const stepTypes = [
  { type: "HTTP", label: "HTTP Request", icon: IconApi, description: "Make API calls", color: "blue" },
  { type: "SQL", label: "SQL Query", icon: IconDatabase, description: "Run database queries", color: "purple" },
  { type: "WAIT", label: "Wait", icon: IconClock, description: "Pause execution", color: "amber" },
  { type: "MANUAL", label: "Manual Approval", icon: IconUserCheck, description: "Require approval", color: "green" },
  { type: "CONDITIONAL", label: "Conditional", icon: IconGitBranch, description: "Branch logic", color: "orange" },
  { type: "AI", label: "AI Analysis", icon: IconBrain, description: "AI processing", color: "pink" },
  { type: "PARALLEL", label: "Parallel", icon: IconArrowsSplit, description: "Run in parallel", color: "cyan" },
];

const colorClasses: Record<string, { bg: string; hover: string; icon: string }> = {
  blue: { bg: "bg-blue-50 dark:bg-blue-900/20", hover: "hover:bg-blue-100 dark:hover:bg-blue-900/40", icon: "text-blue-600 dark:text-blue-400" },
  purple: { bg: "bg-purple-50 dark:bg-purple-900/20", hover: "hover:bg-purple-100 dark:hover:bg-purple-900/40", icon: "text-purple-600 dark:text-purple-400" },
  amber: { bg: "bg-amber-50 dark:bg-amber-900/20", hover: "hover:bg-amber-100 dark:hover:bg-amber-900/40", icon: "text-amber-600 dark:text-amber-400" },
  green: { bg: "bg-green-50 dark:bg-green-900/20", hover: "hover:bg-green-100 dark:hover:bg-green-900/40", icon: "text-green-600 dark:text-green-400" },
  orange: { bg: "bg-orange-50 dark:bg-orange-900/20", hover: "hover:bg-orange-100 dark:hover:bg-orange-900/40", icon: "text-orange-600 dark:text-orange-400" },
  pink: { bg: "bg-pink-50 dark:bg-pink-900/20", hover: "hover:bg-pink-100 dark:hover:bg-pink-900/40", icon: "text-pink-600 dark:text-pink-400" },
  cyan: { bg: "bg-cyan-50 dark:bg-cyan-900/20", hover: "hover:bg-cyan-100 dark:hover:bg-cyan-900/40", icon: "text-cyan-600 dark:text-cyan-400" },
};

export function StepPalette({ onAddStep }: StepPaletteProps) {
  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
        Add Steps
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Click or drag to add a step to your workflow
      </p>

      <div className="space-y-2">
        {stepTypes.map((step) => {
          const colors = colorClasses[step.color];
          const Icon = step.icon;

          const safeColors = colors || { bg: "bg-blue-50 dark:bg-blue-900/20", hover: "hover:bg-blue-100 dark:hover:bg-blue-900/40", icon: "text-blue-600 dark:text-blue-400" };

          return (
            <div
              key={step.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/reactflow", step.type);
                e.dataTransfer.effectAllowed = "move";
              }}
              onClick={() => onAddStep(step.type)}
              className={`
                w-full flex items-center gap-3 p-3 rounded-xl border border-transparent
                ${safeColors.bg} ${safeColors.hover}
                transition-all duration-200 cursor-grab active:cursor-grabbing
                hover:border-slate-200 dark:hover:border-slate-600
                hover:shadow-sm
              `}
            >
              <div className={`p-2 rounded-lg ${safeColors.bg}`}>
                <Icon size={18} className={safeColors.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {step.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
          Tips
        </h4>
        <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <li>• Drag steps onto canvas</li>
          <li>• Click step to configure</li>
          <li>• Press Delete to remove</li>
          <li>• Drag edges to reconnect</li>
        </ul>
      </div>
    </div>
  );
}
