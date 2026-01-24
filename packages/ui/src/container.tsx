import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils";

const containerVariants = cva("mx-auto", {
  variants: {
    size: {
      sm: "max-w-3xl",
      default: "container",
      lg: "max-w-7xl",
      full: "w-full",
    },
    padding: {
      none: "px-0",
      sm: "px-4",
      default: "px-4 sm:px-6 lg:px-8",
      lg: "px-6 sm:px-8 lg:px-12",
    },
    paddingY: {
      none: "py-0",
      sm: "py-4",
      default: "py-8",
      lg: "py-12",
    },
  },
  defaultVariants: {
    size: "default",
    padding: "default",
    paddingY: "default",
  },
});

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, paddingY, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(containerVariants({ size, padding, paddingY }), className)}
        {...props}
      />
    );
  }
);
Container.displayName = "Container";

export { Container, containerVariants };
