import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:
          "bg-sky-500 hover:bg-sky-600 text-white shadow-sm",
        gradient:
          "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 hover:scale-105 duration-200",
        destructive:
          "bg-red-500 hover:bg-red-600 text-white shadow-sm",
        outline:
          "border border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
        secondary:
          "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600",
        ghost:
          "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
        icon:
          "p-2 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-xl",
        link:
          "text-sky-500 hover:text-sky-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "px-4 py-2 text-sm",
        sm: "px-3 py-1.5 text-xs",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
};

interface ButtonAsButtonProps
  extends ButtonBaseProps,
    React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: undefined;
}

interface ButtonAsAnchorProps
  extends ButtonBaseProps,
    React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;

const Button = React.forwardRef<HTMLElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      href,
      leftIcon,
      rightIcon,
      ...props
    },
    ref,
  ) => {
    // If href is provided and asChild is false, use an anchor tag
    const Comp = asChild ? Slot : href ? "a" : "button";

    const content = (
      <>
        {leftIcon && (
          <span className="mr-2 -ml-1 h-5 w-5 flex items-center justify-center">{leftIcon}</span>
        )}
        {props.children}
        {rightIcon && (
          <span className="ml-2 -mr-1 h-5 w-5 flex items-center justify-center">{rightIcon}</span>
        )}
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
        {leftIcon || rightIcon ? content : props.children}
      </RenderComp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
