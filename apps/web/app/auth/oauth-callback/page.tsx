'use client';

// This ensures the page is always rendered at request time, not build time
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import Link from 'next/link';

// Component that uses searchParams wrapped in Suspense
function OAuthCallbackContent() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    // Only run once to prevent infinite loops
    const hasRun = sessionStorage.getItem('oauth_callback_processed');
    if (hasRun === 'true') return;

    const handleOAuthCallback = async () => {
      try {
        // Mark as processed to prevent infinite loops
        sessionStorage.setItem('oauth_callback_processed', 'true');
        
        // Get tokens from URL parameters
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError(errorParam);
          return;
        }

        if (!accessToken || !refreshToken) {
          setError('Authentication failed: Missing tokens');
          return;
        }

        // Store tokens and update auth context
        login({
          accessToken,
          refreshToken,
        });

        // Use window.location for a full page navigation instead of router.push
        // This helps avoid RSC (React Server Component) fetch errors
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500); // Small delay to ensure tokens are properly stored
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Authentication failed');
        // Clear the processed flag if there's an error
        sessionStorage.removeItem('oauth_callback_processed');
      }
    };

    handleOAuthCallback();
    
    // Cleanup function to ensure we don't get stuck
    return () => {
      // If component unmounts without successful navigation, clear the flag
      if (!error) {
        sessionStorage.removeItem('oauth_callback_processed');
      }
    };
  }, [searchParams, login, error]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {error ? 'Authentication Error' : 'Authentication Successful'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {error
                ? error
                : 'You have successfully authenticated with GitHub. Redirecting to dashboard...'}
            </p>
          </div>

          {error && (
            <div className="flex justify-center">
              <Link
                href="/auth/login"
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Authenticating...</h1>
          <div className="flex justify-center my-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
          <p className="text-muted-foreground">Please wait while we complete your authentication.</p>
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function OAuthCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Processing Authentication</h1>
          <div className="flex justify-center my-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
          <p className="text-muted-foreground">Please wait while we verify your credentials...</p>
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
