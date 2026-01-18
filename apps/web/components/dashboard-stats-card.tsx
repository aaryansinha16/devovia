import React from "react";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: "increase" | "decrease";
  };
  icon: React.ReactNode;
  gradient?: boolean;
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  gradient = false,
}: StatsCardProps) {
  return (
    <div className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">{title}</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-sky-600 dark:from-slate-100 dark:to-sky-400 bg-clip-text text-transparent">{value}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
        {change && (
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg ${
                change.type === "increase"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              }`}
            >
              {change.type === "increase" ? (
                <IconTrendingUp className="w-4 h-4" />
              ) : (
                <IconTrendingDown className="w-4 h-4" />
              )}
              <span>{change.value}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
