import * as React from "react";
import { cn } from "./lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "text-center py-16 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-700",
          className
        )}
        {...props}
      >
        {icon && <div className="text-7xl mb-6">{icon}</div>}
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
          {title}
        </h3>
        {description && (
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            {description}
          </p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
