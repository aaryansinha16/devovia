"use client";

import { useEffect } from "react";
import { resetAllCursorStyles } from "../lib/cursor-manager";

/**
 * Global cursor manager component that ensures cursor behaves correctly
 * across the application. It handles resetting cursor styles and ensuring
 * the cursor remains visible on non-homepage routes.
 */
export default function CursorManager() {
  useEffect(() => {
    // Only apply cursor fixes if we're not on homepage
    if (window.location.pathname !== "/") {
      resetAllCursorStyles();

      // This handles the case where the cursor disappears after hovering over buttons
      const fixCursorVisibility = () => {
        if (window.location.pathname !== "/") {
          document.body.style.cursor = "";
        }
      };

      // Add a global mousemove event listener to ensure cursor stays visible
      document.addEventListener("mousemove", fixCursorVisibility);

      // Add a listener to all buttons and interactive elements
      const interactiveElements = document.querySelectorAll(
        'a, button, [role="button"], input[type="submit"], input[type="button"], label[for], select, textarea',
      );

      interactiveElements.forEach((el) => {
        el.addEventListener("mouseenter", fixCursorVisibility);
        el.addEventListener("mouseleave", fixCursorVisibility);
      });

      return () => {
        document.removeEventListener("mousemove", fixCursorVisibility);
        interactiveElements.forEach((el) => {
          el.removeEventListener("mouseenter", fixCursorVisibility);
          el.removeEventListener("mouseleave", fixCursorVisibility);
        });
      };
    }
  }, []);

  return null; // This component doesn't render anything
}
