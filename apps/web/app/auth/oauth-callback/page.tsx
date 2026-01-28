"use client";

// This ensures the page is always rendered at request time, not build time
export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import Link from "next/link";
import Loader from "../../../components/ui/loader";

// Component that uses searchParams wrapped in Suspense
function OAuthCallbackContent() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    // Only run once to prevent infinite loops
    const hasRun = sessionStorage.getItem("oauth_callback_processed");
    if (hasRun === "true") {
      console.log("OAuth callback already processed, skipping");
      return;
    }

    const handleOAuthCallback = async () => {
      try {
        console.log("Processing OAuth callback...");

        // Get tokens from URL parameters
        const accessToken = searchParams.get("accessToken");
        const refreshToken = searchParams.get("refreshToken");
        const errorParam = searchParams.get("error");
        const userId = searchParams.get("userId");

        console.log("OAuth tokens received:", {
          accessToken: accessToken
            ? `${accessToken.substring(0, 10)}...`
            : null,
          refreshToken: refreshToken
            ? `${refreshToken.substring(0, 10)}...`
            : null,
          userId,
          error: errorParam,
        });

        if (errorParam) {
          console.error("OAuth error from params:", errorParam);
          setError(errorParam);
          return;
        }

        if (!accessToken || !refreshToken) {
          console.error("Missing tokens in OAuth callback");
          setError("Authentication failed: Missing tokens");
          return;
        }

        // Store tokens and update auth context
        console.log("Storing tokens and updating auth context...");
        login({
          accessToken,
          refreshToken,
        });

        // Mark as processed AFTER successful login
        sessionStorage.setItem("oauth_callback_processed", "true");

        console.log("Redirecting to dashboard...");
        // Use window.location for a full page navigation instead of router.push
        window.location.href = "/dashboard";
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError("Authentication failed");
        // Clear the processed flag if there's an error
        sessionStorage.removeItem("oauth_callback_processed");
      }
    };

    handleOAuthCallback();

    // Add a safety timeout to prevent getting stuck indefinitely
    const safetyTimeout = setTimeout(() => {
      console.log("Safety timeout triggered - forcing navigation to dashboard");
      window.location.href = "/dashboard";
    }, 5000); // 5 second safety timeout

    // Cleanup function to ensure we don't get stuck
    return () => {
      clearTimeout(safetyTimeout);
      console.log("OAuth callback component unmounted, cleanup performed");
      // If there was an error or we're not redirecting, clear the processed flag
      if (error) {
        sessionStorage.removeItem("oauth_callback_processed");
      }
    };
  }, [searchParams, login, error]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {error ? "Authentication Error" : "Authentication Successful"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {error
                ? error
                : "You have successfully authenticated with GitHub. Redirecting to dashboard..."}
            </p>
          </div>

          {error && (
            <div className="flex justify-center">
              <Link
                href="/login"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Loader />
  );
}

// Loading fallback for Suspense
function OAuthCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Processing Authentication
          </h1>
          <div className="flex justify-center my-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
          <p className="text-muted-foreground">
            Please wait while we verify your credentials...
          </p>
        </div>
      </div>
    </div>
  );
}

// Main component that wraps the content in Suspense
export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<OAuthCallbackLoading />}>
      <OAuthCallbackContent />
    </Suspense>
  );
}
