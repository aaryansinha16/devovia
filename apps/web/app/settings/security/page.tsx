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
import { Button, GlassCard, Heading, Text, Badge, toast } from "@repo/ui";
import { IconDeviceLaptop, IconLock, IconKey, IconShieldCheck, IconAlertTriangle, IconLoader2, IconTrash } from "@tabler/icons-react";
import Loader from "../../../components/ui/loader";

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
      setSessions(response.data);
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
        toast.success("Logged out successfully");
        logout();
        return;
      }

      toast.success("Session revoked successfully");
      // Reload sessions
      await loadSessions();
    } catch (err: any) {
      setError(err.message || "Failed to revoke session");
      toast.error(err.message || "Failed to revoke session");
      console.error("Error revoking session:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm("Are you sure you want to log out from all other devices?")) {
      return;
    }
    
    try {
      setLoading(true);
      await revokeAllSessions();
      toast.success("Logged out from all other devices");
      await loadSessions();
    } catch (err: any) {
      setError(err.message || "Failed to revoke all sessions");
      toast.error(err.message || "Failed to revoke all sessions");
      console.error("Error revoking all sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  // If user is not authenticated, don't render anything
  if (!user) {
    return null;
  }

  if (loading && sessions.length === 0) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Active Sessions */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <Heading size="h2" className="mb-2">
              Active Sessions
            </Heading>
            <Text variant="muted">
              Manage your active sessions across different devices
            </Text>
          </div>
          {sessions.length > 1 && (
            <Button
              onClick={handleRevokeAllSessions}
              disabled={loading}
              variant="outline"
              size="sm"
              leftIcon={<IconTrash className="w-4 h-4" />}
            >
              Revoke All Others
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-lg mb-4 flex items-start gap-3">
            <IconAlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <IconDeviceLaptop className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <Text variant="muted">No active sessions found</Text>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-lg transition-all ${
                  session.id === currentSessionId
                    ? "bg-sky-500/10"
                    : "bg-slate-800/50 hover:bg-slate-800/70"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-slate-800/50 mt-1">
                      <IconDeviceLaptop className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-slate-200">
                          {session.device || "Unknown Device"}
                        </h3>
                        {session.id === currentSessionId && (
                          <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20">
                            Current Session
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <span>IP:</span>
                          <span className="text-slate-300">
                            {session.ipAddress === "0.0.0.0" ? (
                              <span title="IP address not available for this session type">
                                Not available
                                {session.userAgent === "GitHub OAuth" && (
                                  <span className="ml-1 text-xs">(OAuth)</span>
                                )}
                              </span>
                            ) : (
                              session.ipAddress || "Unknown"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Last active:</span>
                          <span className="text-slate-300" title={formatSessionDate(session.lastActive)}>
                            {formatSessionAge(session.lastActive)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Created:</span>
                          <span className="text-slate-300">
                            {formatSessionDate(session.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="text-red-400 hover:bg-red-500/10"
                  >
                    {session.id === currentSessionId ? "Log out" : "Revoke"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Account Security */}
      <GlassCard className="p-6">
        <Heading size="h2" className="mb-6">
          Account Security
        </Heading>

        <div className="space-y-4">
          {/* Password */}
          <div className="p-5 bg-slate-800/50 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-slate-800/50">
                <IconKey className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-200 mb-1">Password</h3>
                <Text variant="muted" className="text-sm mb-4">
                  Change your password regularly to keep your account secure
                </Text>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="p-5 bg-slate-800/50 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-slate-800/50">
                <IconShieldCheck className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-200 mb-1">Two-Factor Authentication</h3>
                <Text variant="muted" className="text-sm mb-4">
                  Add an extra layer of security to your account
                </Text>
                <Button variant="gradient" size="sm">
                  Setup 2FA
                </Button>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
