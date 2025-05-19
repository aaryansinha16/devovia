"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Default settings page that redirects to the security settings page
 * This ensures users landing on /settings will automatically be redirected to /settings/security
 */
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the security settings page
    router.replace("/settings/security");
  }, [router]);

  // Return a simple loading state while the redirect happens
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Redirecting to settings...</p>
      </div>
    </div>
  );
}
