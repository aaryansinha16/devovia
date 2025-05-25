import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "ui-bg-primary ui-text-primary-foreground ui-hover:ui-bg-primary/90",
        destructive:
          "ui-bg-destructive ui-text-destructive-foreground ui-hover:ui-bg-destructive/90",
        outline:
          "ui-border ui-border-input ui-bg-background ui-hover:ui-bg-accent ui-hover:ui-text-accent-foreground",
        secondary:
          "ui-bg-secondary ui-text-secondary-foreground ui-hover:ui-bg-secondary/80",
        ghost: "ui-hover:ui-bg-accent ui-hover:ui-text-accent-foreground",
        link: "ui-text-primary ui-underline-offset-4 ui-hover:ui-underline",
        // New variants from custom button
        primary: "bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white focus:ring-sky-500 dark:focus:ring-sky-600",
        secondaryAlt: "ui-bg-indigo-500 ui-hover:ui-bg-indigo-600 dark:ui-bg-indigo-600 dark:ui-hover:ui-bg-indigo-700 ui-text-white ui-focus:ui-ring-indigo-500 dark:ui-focus:ui-ring-indigo-600 hover:ui--translate-y-0.5",
        outlineAlt: "ui-bg-transparent ui-hover:ui-bg-sky-500/10 dark:ui-hover:ui-bg-sky-400/10 ui-text-sky-500 dark:ui-text-sky-400 ui-border ui-border-sky-500 dark:ui-border-sky-400 ui-focus:ui-ring-sky-500 dark:ui-focus:ui-ring-sky-400 hover:ui--translate-y-0.5",
      },
      size: {
        default: "ui-h-10 ui-px-4 ui-py-2",
        sm: "px-4 py-2 text-sm",
        lg: "px-6 py-2.5 text-base",
        icon: "ui-h-10 ui-w-10",
        // New sizes from custom button
        md: "px-6 py-2.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
};

interface ButtonAsButtonProps extends ButtonBaseProps, React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: undefined;
}

interface ButtonAsAnchorProps extends ButtonBaseProps, React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;

const Button = React.forwardRef<HTMLElement, ButtonProps>(
  ({ className, variant, size, asChild = false, href, leftIcon, rightIcon, ...props }, ref) => {
    // If href is provided and asChild is false, use an anchor tag
    const Comp = asChild ? Slot : href ? "a" : "button";
    
    const content = (
      <>
        {leftIcon && <span className="ui-mr-2 ui--ml-1 ui-h-5 ui-w-5">{leftIcon}</span>}
        {props.children}
        {rightIcon && <span className="ui-ml-2 ui--mr-1 ui-h-5 ui-w-5">{rightIcon}</span>}
      </>
    );
    
    const RenderComp = Comp as any; // Cast Comp to any to resolve ref typing issue
    return (
      <RenderComp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        href={href}
        {...props}
      >
        {(leftIcon || rightIcon) ? content : props.children}
      </RenderComp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
