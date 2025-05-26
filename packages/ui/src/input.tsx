import * as React from "react";

import { cn } from "./lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "ui-flex ui-h-10 ui-w-full ui-rounded-md ui-border ui-border-input ui-bg-background ui-px-3 ui-py-2 ui-text-sm ui-ring-offset-background",
          "ui-file:ui-border-0 ui-file:ui-bg-transparent ui-file:ui-text-sm ui-file:ui-font-medium",
          "ui-placeholder:ui-text-muted-foreground",
          "ui-focus-visible:ui-outline-none ui-focus-visible:ui-ring-2 ui-focus-visible:ui-ring-ring ui-focus-visible:ui-ring-offset-2",
          "ui-disabled:ui-cursor-not-allowed ui-disabled:ui-opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
