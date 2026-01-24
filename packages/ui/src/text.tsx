import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils";

const textVariants = cva("", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      default: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
    variant: {
      default: "text-slate-700 dark:text-slate-300",
      muted: "text-slate-600 dark:text-slate-400",
      subtle: "text-slate-500 dark:text-slate-500",
      primary: "text-sky-600 dark:text-sky-400",
      success: "text-green-600 dark:text-green-400",
      warning: "text-amber-600 dark:text-amber-400",
      error: "text-red-600 dark:text-red-400",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
    weight: "normal",
  },
});

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div" | "label";
}

const Text = React.forwardRef<any, TextProps>(
  ({ className, size, variant, weight, as: Comp = "p", ...props }, ref) => {
    return (
      <Comp
        ref={ref}
        className={cn(textVariants({ size, variant, weight }), className)}
        {...props}
      />
    );
  }
);
Text.displayName = "Text";

export { Text, textVariants };
