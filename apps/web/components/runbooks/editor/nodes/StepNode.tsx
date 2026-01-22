"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  IconApi,
  IconDatabase,
  IconClock,
  IconUserCheck,
  IconGitBranch,
  IconBrain,
  IconArrowsSplit,
} from "@tabler/icons-react";
import type { RunbookStep } from "../../../../lib/services/runbooks-service";

const stepIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  HTTP: IconApi,
  SQL: IconDatabase,
  WAIT: IconClock,
  MANUAL: IconUserCheck,
  CONDITIONAL: IconGitBranch,
  AI: IconBrain,
  PARALLEL: IconArrowsSplit,
};

const stepColors: Record<string, { bg: string; border: string; icon: string }> = {
  HTTP: { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-300 dark:border-blue-600", icon: "text-blue-600 dark:text-blue-400" },
  SQL: { bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-300 dark:border-purple-600", icon: "text-purple-600 dark:text-purple-400" },
  WAIT: { bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-300 dark:border-amber-600", icon: "text-amber-600 dark:text-amber-400" },
  MANUAL: { bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-300 dark:border-green-600", icon: "text-green-600 dark:text-green-400" },
  CONDITIONAL: { bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-300 dark:border-orange-600", icon: "text-orange-600 dark:text-orange-400" },
  AI: { bg: "bg-pink-50 dark:bg-pink-900/20", border: "border-pink-300 dark:border-pink-600", icon: "text-pink-600 dark:text-pink-400" },
  PARALLEL: { bg: "bg-cyan-50 dark:bg-cyan-900/20", border: "border-cyan-300 dark:border-cyan-600", icon: "text-cyan-600 dark:text-cyan-400" },
};

interface StepNodeData {
  step: RunbookStep;
  index: number;
}

export const StepNode = memo(({ data, selected }: NodeProps<StepNodeData>) => {
  const { step, index } = data;
  const Icon = stepIcons[step.type] || IconApi;
  const colors = stepColors[step.type] || { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-300 dark:border-blue-600", icon: "text-blue-600 dark:text-blue-400" };

  return (
    <div
      className={`
        min-w-[200px] max-w-[280px] rounded-xl border-2 shadow-lg transition-all
        ${colors.bg} ${colors.border}
        ${selected ? "ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-900" : ""}
        hover:shadow-xl cursor-pointer
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-400 dark:!bg-slate-500 !border-2 !border-white dark:!border-slate-800"
      />

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${colors.bg}`}>
            <Icon size={18} className={colors.icon} />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Step {index + 1}
          </span>
          <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded ${colors.bg} ${colors.icon}`}>
            {step.type}
          </span>
        </div>

        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
          {step.name}
        </h3>

        {step.type === "HTTP" && (step.config as any)?.url && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
            {(step.config as any).method} {(step.config as any).url}
          </p>
        )}

        {step.type === "WAIT" && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Wait {(step.config as any)?.duration || 0}s
          </p>
        )}

        {step.type === "SQL" && (step.config as any)?.query && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate font-mono">
            {(step.config as any).query.slice(0, 30)}...
          </p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-400 dark:!bg-slate-500 !border-2 !border-white dark:!border-slate-800"
      />
    </div>
  );
});

StepNode.displayName = "StepNode";
