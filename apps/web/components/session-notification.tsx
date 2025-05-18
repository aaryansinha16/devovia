"use client";

import { useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { useRouter } from "next/navigation";

export default function SessionNotification() {
  const { sessionError, logout } = useAuth();
  const router = useRouter();

  // Handle forced logout notification
  useEffect(() => {
    if (sessionError) {
      // Show the notification to the user
      const timeoutId = setTimeout(() => {
        // After showing the notification, log the user out and redirect to login
        logout();
        router.push("/login?sessionExpired=true");
      }, 5000); // Show the notification for 5 seconds before redirecting

      return () => clearTimeout(timeoutId);
    }
  }, [sessionError, logout, router]);

  if (!sessionError) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
      <div className="bg-destructive text-white px-6 py-3 rounded-md shadow-lg flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>{sessionError}</span>
        <button
          className="ml-4 hover:underline"
          onClick={() => {
            logout();
            router.push("/login?sessionExpired=true");
          }}
        >
          Login again
        </button>
      </div>
    </div>
  );
}
