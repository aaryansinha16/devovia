import * as React from "react";
import { cn } from "./lib/utils";

// Using 'React.ElementRef<"div">'' and 'React.ComponentPropsWithoutRef<"div">'
// instead of HTMLDivElement to avoid TypeScript issues
export interface AvatarProps extends React.ComponentPropsWithoutRef<"div"> {
  src?: string;
  alt?: string;
  fallback?: string;
}

const Avatar = React.forwardRef<React.ElementRef<"div">, AvatarProps>(
  ({ src, alt, fallback, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium overflow-hidden",
          className,
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || "Avatar"}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{fallback || "U"}</span>
        )}
      </div>
    );
  },
);

Avatar.displayName = "Avatar";

export { Avatar };
