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
  const cardClasses = gradient
    ? "relative overflow-hidden"
    : "bg-card border border-slate-700 rounded-xl";

  const innerClasses = gradient
    ? "bg-background rounded-xl p-6 relative z-10"
    : "p-6";

  return (
    <div className={cardClasses}>
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-600 to-cyan-600 p-[1px] rounded-xl">
          <div className="bg-background rounded-xl h-full w-full"></div>
        </div>
      )}
      <div className={innerClasses}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        </div>
        {change && (
          <div
            className={`mt-4 flex items-center text-sm ${
              change.type === "increase"
                ? "text-green-500 dark:text-green-400"
                : "text-red-500 dark:text-red-400"
            }`}
          >
            {change.type === "increase" ? (
              <IconTrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <IconTrendingDown className="w-4 h-4 mr-1" />
            )}
            {change.value}
          </div>
        )}
      </div>
    </div>
  );
}
