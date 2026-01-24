import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils";

const headingVariants = cva("font-bold", {
  variants: {
    size: {
      h1: "text-4xl",
      h2: "text-3xl",
      h3: "text-2xl",
      h4: "text-xl",
      h5: "text-lg",
      h6: "text-base",
    },
    variant: {
      default: "text-slate-800 dark:text-slate-100",
      gradient:
        "bg-gradient-to-r from-slate-800 to-sky-600 dark:from-slate-100 dark:to-sky-400 bg-clip-text text-transparent",
      muted: "text-slate-600 dark:text-slate-400",
    },
    spacing: {
      none: "mb-0",
      sm: "mb-2",
      default: "mb-4",
      lg: "mb-6",
    },
  },
  defaultVariants: {
    size: "h1",
    variant: "default",
    spacing: "default",
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, size, variant, spacing, as, ...props }, ref) => {
    const Comp = as || (size as "h1" | "h2" | "h3" | "h4" | "h5" | "h6") || "h1";
    
    return (
      <Comp
        ref={ref}
        className={cn(headingVariants({ size, variant, spacing }), className)}
        {...props}
      />
    );
  }
);
Heading.displayName = "Heading";

export { Heading, headingVariants };
