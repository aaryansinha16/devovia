'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import Link from 'next/link';

export default function OAuthCallbackPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
            <p className="text-gray-700 mb-6">{error}</p>
            <Link 
              href="/auth/login"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none inline-block"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authenticating...</h1>
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
          <p className="text-gray-700">Please wait while we complete your authentication.</p>
        </div>
      </div>
    </div>
  );
}
