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
    <div className="space-y-8">
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-sky-600 dark:from-slate-100 dark:to-sky-400 bg-clip-text text-transparent mb-3">Active Sessions</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          These are your active sessions across different devices. You can log
          out of any session if you don't recognize it.
        </p>

        {loading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-4">
            {error}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            No active sessions found.
          </div>
        )}

        {sessions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className={
                      session.id === currentSessionId 
                        ? "bg-sky-50/50 dark:bg-sky-900/10 border-b border-slate-200 dark:border-slate-700" 
                        : "border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {session.device || "Unknown Device"}
                          {session.id === currentSessionId && (
                            <span className="ml-2 inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-sky-500 to-indigo-600 text-white">
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {session.ipAddress === "0.0.0.0" ? (
                        <span title="IP address not available for this session type">
                          <span className="text-slate-500 dark:text-slate-500">
                            Not available
                          </span>
                          {session.userAgent === "GitHub OAuth" && (
                            <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                              (OAuth login)
                            </span>
                          )}
                        </span>
                      ) : (
                        session.ipAddress || "Unknown"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      <span title={formatSessionDate(session.lastActive)}>
                        {formatSessionAge(session.lastActive)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {formatSessionDate(session.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg font-medium transition-all disabled:opacity-50"
                      >
                        {session.id === currentSessionId ? "Log out" : "Revoke"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sessions.length > 1 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleRevokeAllSessions}
              disabled={loading}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-medium transition-all disabled:opacity-50"
            >
              Log out from all other devices
            </button>
          </div>
        )}
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-sky-600 dark:from-slate-100 dark:to-sky-400 bg-clip-text text-transparent mb-6">Account Security</h2>

        <div className="space-y-4">
          <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Password</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Change your password regularly to keep your account secure.
            </p>
            <button className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-medium transition-all">
              Change Password
            </button>
          </div>

          <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Two-factor Authentication</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Add an extra layer of security to your account by enabling
              two-factor authentication.
            </p>
            <button className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-sky-500/30">
              Setup 2FA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
