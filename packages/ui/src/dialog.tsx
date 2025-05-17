import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "../lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "ui-fixed ui-inset-0 ui-z-50 ui-bg-black/80 ui-backdrop-blur-sm ui-data-[state=open]:ui-animate-in ui-data-[state=closed]:ui-animate-out ui-data-[state=closed]:ui-fade-out-0 ui-data-[state=open]:ui-fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "ui-fixed ui-left-[50%] ui-top-[50%] ui-z-50 ui-grid ui-w-full ui-max-w-lg ui-translate-x-[-50%] ui-translate-y-[-50%] ui-gap-4 ui-border ui-border-input ui-bg-background ui-p-6 ui-shadow-lg ui-duration-200 ui-data-[state=open]:ui-animate-in ui-data-[state=closed]:ui-animate-out ui-data-[state=closed]:ui-fade-out-0 ui-data-[state=open]:ui-fade-in-0 ui-data-[state=closed]:ui-zoom-out-95 ui-data-[state=open]:ui-zoom-in-95 ui-data-[state=closed]:ui-slide-out-to-left-1/2 ui-data-[state=closed]:ui-slide-out-to-top-[48%] ui-data-[state=open]:ui-slide-in-from-left-1/2 ui-data-[state=open]:ui-slide-in-from-top-[48%] sm:ui-rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="ui-absolute ui-right-4 ui-top-4 ui-rounded-sm ui-opacity-70 ui-ring-offset-background ui-transition-opacity ui-hover:ui-opacity-100 ui-focus:ui-outline-none ui-focus:ui-ring-2 ui-focus:ui-ring-ring ui-focus:ui-ring-offset-2 ui-disabled:ui-pointer-events-none ui-data-[state=open]:ui-bg-accent ui-data-[state=open]:ui-text-muted-foreground">
        <X className="ui-h-4 ui-w-4" />
        <span className="ui-sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "ui-flex ui-flex-col ui-space-y-1.5 ui-text-center sm:ui-text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "ui-flex ui-flex-col-reverse sm:ui-flex-row sm:ui-justify-end sm:ui-space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "ui-text-lg ui-font-semibold ui-leading-none ui-tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("ui-text-sm ui-text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
