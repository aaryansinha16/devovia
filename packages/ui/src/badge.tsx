import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const badgeVariants = cva(
  "ui-inline-flex ui-items-center ui-rounded-full ui-border ui-px-2.5 ui-py-0.5 ui-text-xs ui-font-semibold ui-transition-colors ui-focus:ui-outline-none ui-focus:ui-ring-2 ui-focus:ui-ring-ring ui-focus:ui-ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "ui-border-transparent ui-bg-primary ui-text-primary-foreground ui-hover:ui-bg-primary/80",
        secondary:
          "ui-border-transparent ui-bg-secondary ui-text-secondary-foreground ui-hover:ui-bg-secondary/80",
        destructive:
          "ui-border-transparent ui-bg-destructive ui-text-destructive-foreground ui-hover:ui-bg-destructive/80",
        outline: "ui-text-foreground",
        success: 
          "ui-border-transparent ui-bg-green-500/20 ui-text-green-700 dark:ui-text-green-400",
        warning:
          "ui-border-transparent ui-bg-yellow-500/20 ui-text-yellow-700 dark:ui-text-yellow-400",
        info:
          "ui-border-transparent ui-bg-blue-500/20 ui-text-blue-700 dark:ui-text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
