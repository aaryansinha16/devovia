"use client";

import { useState } from "react";
import { ModeratorOrAdmin } from "../../components/role-based";
import { useAuth } from "../../lib/auth-context";

export default function ModeratorDashboardPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("content");

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ModeratorOrAdmin
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full p-6 bg-card rounded-xl shadow-lg border border-border text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              Access Denied
            </h2>
            <p className="text-foreground mb-4">
              You don't have permission to access the moderator dashboard.
            </p>
            <p className="text-muted-foreground">
              This area is restricted to moderators and administrators only.
            </p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-background">
        <header className="bg-card shadow border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-primary">
                    Moderator Dashboard
                  </h1>
                </div>
              </div>
              <div className="flex items-center">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border border-border rounded-lg bg-card">
              <div className="border-b border-border">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab("content")}
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === "content"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Content Moderation
                  </button>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === "reports"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    User Reports
                  </button>
                  <button
                    onClick={() => setActiveTab("logs")}
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === "logs"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Activity Logs
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === "content" && (
                  <div>
                    <h2 className="text-lg font-medium text-foreground mb-4">
                      Content Moderation
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      This section will allow moderators to review and manage
                      user-generated content:
                    </p>
                    <ul className="list-disc pl-5 text-foreground space-y-2">
                      <li>Review and approve/reject new submissions</li>
                      <li>Flag inappropriate content</li>
                      <li>Edit or remove content that violates guidelines</li>
                      <li>Manage content categories and tags</li>
                    </ul>
                    <div className="mt-6 p-4 bg-accent rounded-md">
                      <p className="text-muted-foreground italic">
                        Content moderation functionality will be implemented in
                        a future update.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "reports" && (
                  <div>
                    <h2 className="text-lg font-medium text-foreground mb-4">
                      User Reports
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      This section will allow moderators to handle user reports:
                    </p>
                    <ul className="list-disc pl-5 text-foreground space-y-2">
                      <li>View and respond to user-submitted reports</li>
                      <li>Take action on reported content or users</li>
                      <li>Track report resolution status</li>
                      <li>Escalate serious issues to administrators</li>
                    </ul>
                    <div className="mt-6 p-4 bg-accent rounded-md">
                      <p className="text-muted-foreground italic">
                        User reports functionality will be implemented in a
                        future update.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "logs" && (
                  <div>
                    <h2 className="text-lg font-medium text-foreground mb-4">
                      Activity Logs
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      This section will allow moderators to view activity logs:
                    </p>
                    <ul className="list-disc pl-5 text-foreground space-y-2">
                      <li>Track moderation actions taken by all moderators</li>
                      <li>View user activity patterns</li>
                      <li>Monitor system events and notifications</li>
                      <li>Generate reports on moderation activities</li>
                    </ul>
                    <div className="mt-6 p-4 bg-accent rounded-md">
                      <p className="text-muted-foreground italic">
                        Activity logs functionality will be implemented in a
                        future update.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModeratorOrAdmin>
  );
}
