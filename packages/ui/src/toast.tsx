"use client";

import * as React from "react";
import { cn } from "./lib/utils";
import { ToastProps } from "./hooks/use-toast";

// A simple toast component
const Toast: React.FC<ToastProps & { onDismiss: () => void }> = ({
  id,
  title,
  description,
  action,
  type = "default",
  duration = 5000,
  onDismiss,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration, onDismiss]);

  const getToastClassName = () => {
    switch (type) {
      case "success":
        return "bg-green-500 text-white";
      case "error":
        return "bg-red-500 text-white";
      case "warning":
        return "bg-yellow-500 text-white";
      case "info":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-800 text-white dark:bg-gray-700";
    }
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-4 overflow-hidden rounded-md p-4 shadow-lg transition-all",
        getToastClassName()
      )}
    >
      <div className="flex-1 flex flex-col gap-1">
        {title && <h3 className="font-medium">{title}</h3>}
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
      <button
        onClick={onDismiss}
        className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};

export const Toaster: React.FC = () => {
  const { toasts, dismiss } = React.useMemo(() => {
    // Import dynamically to avoid SSR issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useToast } = require("./hooks/use-toast");
    return useToast();
  }, []);

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex w-full items-start gap-4 transition-all mb-2 last:mb-0"
        >
          <Toast {...toast} onDismiss={() => dismiss(toast.id)} />
        </div>
      ))}
    </div>
  );
};

export { Toast };
