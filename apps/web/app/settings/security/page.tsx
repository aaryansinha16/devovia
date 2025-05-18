"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../lib/auth-context";
import {
  fetchUserSessions,
  revokeSession,
  revokeAllSessions,
  SessionData,
  formatSessionDate,
  formatSessionAge,
} from "../../../lib/session-api";
import { Button } from "@repo/ui";

export default function SecuritySettingsPage() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchUserSessions();
      setSessions(response.sessions);
      setCurrentSessionId(response.currentSessionId);
    } catch (err: any) {
      setError(err.message || "Failed to load sessions");
      console.error("Error loading sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setLoading(true);
      const result = await revokeSession(sessionId);

      // If current session was revoked, log out
      if (result.isCurrentSession) {
        logout();
        return;
      }

      // Reload sessions
      await loadSessions();
    } catch (err: any) {
      setError(err.message || "Failed to revoke session");
      console.error("Error revoking session:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      setLoading(true);
      await revokeAllSessions();
      await loadSessions();
    } catch (err: any) {
      setError(err.message || "Failed to revoke all sessions");
      console.error("Error revoking all sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  // If user is not authenticated, don't render anything
  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Security Settings</h1>

      <div className="bg-card rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>
        <p className="text-muted-foreground mb-6">
          These are your active sessions across different devices. You can log
          out of any session if you don't recognize it.
        </p>

        {loading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No active sessions found.
          </div>
        )}

        {sessions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className={
                      session.id === currentSessionId ? "bg-primary/5" : ""
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-foreground">
                          {session.device || "Unknown Device"}
                          {session.id === currentSessionId && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {session.ipAddress === "0.0.0.0" ? (
                        <span title="IP address not available for this session type">
                          <span className="text-muted-foreground/60">
                            Not available
                          </span>
                          {session.userAgent === "GitHub OAuth" && (
                            <span className="ml-1 text-xs text-muted-foreground/50">
                              (OAuth login)
                            </span>
                          )}
                        </span>
                      ) : (
                        session.ipAddress || "Unknown"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <span title={formatSessionDate(session.lastActive)}>
                        {formatSessionAge(session.lastActive)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatSessionDate(session.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={loading}
                      >
                        {session.id === currentSessionId ? "Log out" : "Revoke"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sessions.length > 1 && (
          <div className="mt-6 flex justify-end">
            <Button
              variant="outline"
              onClick={handleRevokeAllSessions}
              disabled={loading}
            >
              Log out from all other devices
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Account Security</h2>

        <div className="space-y-4">
          <div className="p-4 border border-border rounded-md">
            <h3 className="font-medium mb-2">Password</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Change your password regularly to keep your account secure.
            </p>
            <Button variant="outline">Change Password</Button>
          </div>

          <div className="p-4 border border-border rounded-md">
            <h3 className="font-medium mb-2">Two-factor Authentication</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add an extra layer of security to your account by enabling
              two-factor authentication.
            </p>
            <Button variant="outline">Setup 2FA</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
