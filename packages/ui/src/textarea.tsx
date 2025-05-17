import * as React from "react";

import { cn } from "../lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "ui-flex ui-min-h-[80px] ui-w-full ui-rounded-md ui-border ui-border-input ui-bg-background ui-px-3 ui-py-2 ui-text-sm ui-ring-offset-background",
          "ui-placeholder:ui-text-muted-foreground",
          "ui-focus-visible:ui-outline-none ui-focus-visible:ui-ring-2 ui-focus-visible:ui-ring-ring ui-focus-visible:ui-ring-offset-2",
          "ui-disabled:ui-cursor-not-allowed ui-disabled:ui-opacity-50",
          "ui-resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
