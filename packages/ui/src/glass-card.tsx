import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils";

const glassCardVariants = cva(
  "transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-slate-900/50",
        subtle: "bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700",
        solid: "bg-white dark:bg-slate-800 shadow-xl",
        ghost: "bg-transparent",
      },
      rounded: {
        default: "rounded-2xl",
        sm: "rounded-lg",
        lg: "rounded-3xl",
        xl: "rounded-[2rem]",
        full: "rounded-full",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
      hover: {
        none: "",
        lift: "hover:shadow-2xl hover:scale-[1.01]",
        glow: "hover:shadow-2xl hover:shadow-sky-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
      rounded: "default",
      padding: "default",
      hover: "none",
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  asChild?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, rounded, padding, hover, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          glassCardVariants({ variant, rounded, padding, hover }),
          className
        )}
        style={{
          backdropFilter: "blur(9.8px)",
          boxShadow: "rgba(0, 0, 0, 0.3) 0px 7px 29px 0px",
          ...style,
        }}
        {...props}
      />
    );
  }
);
GlassCard.displayName = "GlassCard";

export { GlassCard, glassCardVariants };
