import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "./lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "ui-flex ui-h-10 ui-w-full ui-items-center ui-justify-between ui-rounded-md ui-border ui-border-input ui-bg-background ui-px-3 ui-py-2 ui-text-sm ui-ring-offset-background",
      "ui-placeholder:ui-text-muted-foreground",
      "ui-focus:ui-outline-none ui-focus:ui-ring-2 ui-focus:ui-ring-ring ui-focus:ui-ring-offset-2",
      "ui-disabled:ui-cursor-not-allowed ui-disabled:ui-opacity-50",
      "ui-data-[placeholder]:ui-text-muted-foreground",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="ui-h-4 ui-w-4 ui-opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "ui-flex ui-cursor-default ui-items-center ui-justify-center ui-py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="ui-h-4 ui-w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "ui-flex ui-cursor-default ui-items-center ui-justify-center ui-py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="ui-h-4 ui-w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "ui-relative ui-z-50 ui-max-h-96 ui-min-w-[8rem] ui-overflow-hidden ui-rounded-md ui-border ui-border-input ui-bg-popover ui-text-popover-foreground ui-shadow-md ui-data-[state=open]:ui-animate-in ui-data-[state=closed]:ui-animate-out ui-data-[state=closed]:ui-fade-out-0 ui-data-[state=open]:ui-fade-in-0 ui-data-[state=closed]:ui-zoom-out-95 ui-data-[state=open]:ui-zoom-in-95 ui-data-[side=bottom]:ui-slide-in-from-top-2 ui-data-[side=left]:ui-slide-in-from-right-2 ui-data-[side=right]:ui-slide-in-from-left-2 ui-data-[side=top]:ui-slide-in-from-bottom-2",
        position === "popper" &&
          "ui-data-[side=bottom]:ui-translate-y-1 ui-data-[side=left]:ui--translate-x-1 ui-data-[side=right]:ui-translate-x-1 ui-data-[side=top]:ui--translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "ui-p-1",
          position === "popper" &&
            "ui-h-[var(--radix-select-trigger-height)] ui-w-full ui-min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("ui-py-1.5 ui-pl-8 ui-pr-2 ui-text-sm ui-font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "ui-relative ui-flex ui-w-full ui-cursor-default ui-select-none ui-items-center ui-rounded-sm ui-py-1.5 ui-pl-8 ui-pr-2 ui-text-sm ui-outline-none",
      "ui-focus:ui-bg-accent ui-focus:ui-text-accent-foreground",
      "ui-data-[disabled]:ui-pointer-events-none ui-data-[disabled]:ui-opacity-50",
      className
    )}
    {...props}
  >
    <span className="ui-absolute ui-left-2 ui-flex ui-h-3.5 ui-w-3.5 ui-items-center ui-justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="ui-h-4 ui-w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("ui--mx-1 ui-my-1 ui-h-px ui-bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
