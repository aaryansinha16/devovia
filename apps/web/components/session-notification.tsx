"use client";

import { useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "@repo/ui";

export default function SessionNotification() {
  const { sessionError, logout } = useAuth();
  const router = useRouter();

  // Handle forced logout notification
  useEffect(() => {
    if (sessionError) {
      toast.error(sessionError, {
        duration: 5000,
      });

      const timeoutId = setTimeout(() => {
        logout();
        router.push("/login?sessionExpired=true");
      }, 5000);

      return () => clearTimeout(timeoutId);
    }
  }, [sessionError, logout, router]);

  return null;
}
