"use client";

// This file provides a global cursor management solution
// It helps ensure cursor visibility is properly handled across the application

/**
 * Helper function to reset all cursor styles on the page
 * This ensures no element has hidden cursor styles
 */
export function resetAllCursorStyles() {
  // Reset body cursor
  document.body.style.cursor = "";
  
  // Reset all elements
  const allElements = document.querySelectorAll('*');
  allElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.style.cursor = "";
    }
  });
}

/**
 * Apply cursor:none to the entire page (for special pages like homepage)
 */
export function hideDefaultCursor() {
  // Hide cursor on body
  document.body.style.cursor = "none";
  
  // Hide cursor on all interactive elements
  const interactiveElements = document.querySelectorAll(
    'a, button, [role="button"], input[type="submit"], input[type="button"], label[for], select, textarea'
  );
  interactiveElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.style.cursor = "none";
    }
  });
}

/**
 * Register global event listeners to fix cursor visibility issues
 * This helps prevent cursor from disappearing after hovering on buttons
 */
export function registerGlobalCursorFix() {
  // Reset cursor visibility after any mouseout event on interactive elements
  const interactiveElements = document.querySelectorAll(
    'a, button, [role="button"], input[type="submit"], input[type="button"], label[for], select, textarea'
  );
  
  // Add mouseout handler to all interactive elements
  interactiveElements.forEach((el) => {
    el.addEventListener('mouseout', () => {
      // Ensure cursor is visible when leaving elements
      if (window.location.pathname !== '/') {
        document.body.style.cursor = "";
      }
    });
  });
  
  // Also add a global mousemove handler as a fallback
  document.addEventListener('mousemove', () => {
    // If we're not on the homepage, ensure cursor is visible
    if (window.location.pathname !== '/') {
      document.body.style.cursor = "";
    }
  });
}
