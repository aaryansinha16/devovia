import React from "react";
import { cn } from "../../lib/utils";

export interface BackgroundDecorativeProps {
  className?: string;
  variant?: "default" | "subtle" | "vibrant";
}

/**
 * BackgroundDecorative - Animated gradient background elements
 * 
 * A decorative background component with animated gradient orbs that adds
 * visual depth to pages. Supports light/dark mode and multiple variants.
 * 
 * @example
 * ```tsx
 * <div className="relative min-h-screen">
 *   <BackgroundDecorative />
 *   <div className="relative z-10">
 *     Your content here
 *   </div>
 * </div>
 * ```
 */
export function BackgroundDecorative({ 
  className,
  variant = "default" 
}: BackgroundDecorativeProps) {
  const opacityMap = {
    default: "bg-sky-500/30 dark:bg-sky-400/20",
    subtle: "bg-sky-500/20 dark:bg-sky-400/15",
    vibrant: "bg-sky-500/40 dark:bg-sky-400/30",
  };

  const secondaryOpacityMap = {
    default: "bg-purple-500/30 dark:bg-purple-400/20",
    subtle: "bg-purple-500/20 dark:bg-purple-400/15",
    vibrant: "bg-purple-500/40 dark:bg-purple-400/30",
  };

  const centerOpacityMap = {
    default: "from-sky-400/20 to-indigo-400/20 dark:from-sky-500/15 dark:to-indigo-500/15",
    subtle: "from-sky-400/15 to-indigo-400/15 dark:from-sky-500/10 dark:to-indigo-500/10",
    vibrant: "from-sky-400/30 to-indigo-400/30 dark:from-sky-500/25 dark:to-indigo-500/25",
  };

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <div 
        className={cn(
          "absolute top-10 left-10 w-96 h-96 rounded-full blur-[100px] animate-pulse",
          opacityMap[variant]
        )}
      />
      <div 
        className={cn(
          "absolute bottom-10 right-10 w-96 h-96 rounded-full blur-[100px] animate-pulse",
          secondaryOpacityMap[variant]
        )}
        style={{ animationDelay: '2s' }}
      />
      <div 
        className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr rounded-full blur-3xl",
          centerOpacityMap[variant]
        )}
      />
    </div>
  );
}
