'use client';

import { useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { ThemeToggle } from '../../components/ui/theme-toggle';

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      // Use window.location for a full page navigation to avoid RSC fetch errors
      window.location.href = '/auth/login';
    }
  }, [user, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, don't render anything (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card shadow border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <h1 className="text-xl font-bold text-foreground">Devovia</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={logout}
                className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:text-primary hover:bg-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border border-border rounded-lg p-6 bg-card">
            <h2 className="text-2xl font-bold mb-4 text-card-foreground">Welcome to your Dashboard</h2>
            
            <div className="bg-background shadow overflow-hidden sm:rounded-lg mb-6 border border-border">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-foreground">User Information</h3>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Personal details and authentication status.</p>
              </div>
              <div className="border-t border-border">
                <dl>
                  <div className="bg-accent px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-muted-foreground">User ID</dt>
                    <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">{user.id}</dd>
                  </div>
                  <div className="bg-card px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-muted-foreground">Role</dt>
                    <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary">
                        {user.role}
                      </span>
                    </dd>
                  </div>
                  <div className="bg-accent px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-muted-foreground">Verification Status</dt>
                    <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">
                      {user.isVerified ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/10 text-green-500">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-500/10 text-yellow-500">
                          Not Verified
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-md border border-primary/10">
              <p className="text-primary">
                You have successfully authenticated with the Devovia API. This dashboard demonstrates that both the authentication flow and role-based access control are working correctly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
