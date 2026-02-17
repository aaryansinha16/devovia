"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, GlassCard, Heading, Text, toast } from "@repo/ui";
import {
  IconBell,
  IconBellRinging,
  IconMail,
  IconBriefcase,
  IconRocket,
  IconShield,
  IconAt,
  IconPlayerPlay,
  IconDeviceDesktop,
  IconCheck,
  IconLoader2,
} from "@tabler/icons-react";
import { useNotifications } from "../../../lib/notification-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken") || null;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}/notifications${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return res.json();
}

interface Preferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  channelOverrides: Record<string, { email?: boolean; push?: boolean; inApp?: boolean }> | null;
  digestFrequency: string;
}

const NOTIFICATION_TYPES = [
  { key: "deployment_failed", label: "Deployment Failures", desc: "When a deployment fails", icon: IconRocket },
  { key: "deployment_success", label: "Deployment Success", desc: "When a deployment completes", icon: IconRocket },
  { key: "project_invite", label: "Project Invites", desc: "When you're added to a project", icon: IconBriefcase },
  { key: "session_invite", label: "Session Invites", desc: "When you're invited to a session", icon: IconDeviceDesktop },
  { key: "runbook_completed", label: "Runbook Completed", desc: "When a runbook finishes", icon: IconPlayerPlay },
  { key: "runbook_failed", label: "Runbook Failures", desc: "When a runbook fails", icon: IconPlayerPlay },
  { key: "mention", label: "Mentions", desc: "When someone @mentions you", icon: IconAt },
  { key: "security", label: "Security Alerts", desc: "Password changes, new logins", icon: IconShield },
];

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { pushSupported, pushSubscribed, subscribeToPush, unsubscribeFromPush } = useNotifications();

  const loadPrefs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/preferences");
      if (res.success) setPrefs(res.data);
    } catch (err) {
      console.error("Failed to load preferences:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  const savePrefs = async (updated: Partial<Preferences>) => {
    setSaving(true);
    try {
      const res = await apiFetch("/preferences", {
        method: "PUT",
        body: JSON.stringify(updated),
      });
      if (res.success) {
        setPrefs(res.data);
        toast.success("Preferences saved");
      }
    } catch (err) {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = (field: "emailEnabled" | "pushEnabled" | "inAppEnabled") => {
    if (!prefs) return;
    const updated = { ...prefs, [field]: !prefs[field] };
    setPrefs(updated);
    savePrefs({ [field]: updated[field] });
  };

  const toggleTypeChannel = (type: string, channel: "email" | "inApp" | "push") => {
    if (!prefs) return;
    const overrides = { ...(prefs.channelOverrides || {}) };
    const current = overrides[type] || {};
    overrides[type] = { ...current, [channel]: !current[channel] };
    const updated = { ...prefs, channelOverrides: overrides };
    setPrefs(updated);
    savePrefs({ channelOverrides: overrides });
  };

  const setDigest = (freq: string) => {
    if (!prefs) return;
    setPrefs({ ...prefs, digestFrequency: freq });
    savePrefs({ digestFrequency: freq });
  };

  const NotificationToggle = ({
    title,
    description,
    enabled,
    onChange,
    icon: Icon,
  }: {
    title: string;
    description: string;
    enabled: boolean;
    onChange: () => void;
    icon: any;
  }) => (
    <div className="flex items-start justify-between gap-4 p-4 bg-slate-800/50 rounded-lg">
      <div className="flex items-start gap-3 flex-1">
        <div className="p-2 rounded-lg bg-slate-800/50 mt-1">
          <Icon className="w-5 h-5 text-slate-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-200 mb-1">{title}</h3>
          <Text variant="muted" className="text-sm">
            {description}
          </Text>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-sky-500" : "bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  if (loading || !prefs) {
    return (
      <div className="flex items-center justify-center py-20">
        <IconLoader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Channels */}
      <GlassCard className="p-6">
        <Heading size="h2" className="mb-2">
          Notification Channels
        </Heading>
        <Text variant="muted" className="mb-6">
          Choose how you want to receive notifications
        </Text>

        <div className="space-y-3">
          <NotificationToggle
            title="Email Notifications"
            description="Receive notifications via email for important events"
            enabled={prefs.emailEnabled}
            onChange={() => toggleChannel("emailEnabled")}
            icon={IconMail}
          />
          <NotificationToggle
            title="In-App Notifications"
            description="See notifications in the bell icon and dropdown"
            enabled={prefs.inAppEnabled}
            onChange={() => toggleChannel("inAppEnabled")}
            icon={IconBell}
          />
          <NotificationToggle
            title="Push Notifications"
            description={
              !pushSupported
                ? "Your browser does not support push notifications"
                : pushSubscribed
                  ? "Browser push notifications are active on this device"
                  : "Receive browser push notifications even when the site is closed"
            }
            enabled={prefs.pushEnabled && pushSubscribed}
            onChange={async () => {
              if (!pushSupported) {
                toast.error("Your browser does not support push notifications");
                return;
              }
              if (pushSubscribed) {
                await unsubscribeFromPush();
                savePrefs({ pushEnabled: false });
              } else {
                const ok = await subscribeToPush();
                if (ok) savePrefs({ pushEnabled: true });
              }
            }}
            icon={IconBellRinging}
          />
        </div>
      </GlassCard>

      {/* Per-type preferences */}
      <GlassCard className="p-6">
        <Heading size="h2" className="mb-2">
          Notification Types
        </Heading>
        <Text variant="muted" className="mb-6">
          Control which notifications you receive and how
        </Text>

        <div className="space-y-2">
          {/* Header row */}
          <div className="flex items-center gap-4 px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <div className="flex-1">Type</div>
            <div className="w-16 text-center">In-App</div>
            <div className="w-16 text-center">Email</div>
            <div className="w-16 text-center">Push</div>
          </div>

          {NOTIFICATION_TYPES.map((type) => {
            const overrides = prefs.channelOverrides?.[type.key] || {};
            const inApp = overrides.inApp !== undefined ? overrides.inApp : true;
            const email = overrides.email !== undefined ? overrides.email : false;
            const push = overrides.push !== undefined ? overrides.push : false;
            const Icon = type.icon;

            return (
              <div
                key={type.key}
                className="flex items-center gap-4 px-4 py-3 bg-slate-800/30 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-slate-300">{type.label}</div>
                    <div className="text-xs text-slate-500">{type.desc}</div>
                  </div>
                </div>
                <div className="w-16 flex justify-center">
                  <button
                    onClick={() => toggleTypeChannel(type.key, "inApp")}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      inApp
                        ? "bg-sky-500 border-sky-500"
                        : "border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    {inApp && <IconCheck className="w-3 h-3 text-white" />}
                  </button>
                </div>
                <div className="w-16 flex justify-center">
                  <button
                    onClick={() => toggleTypeChannel(type.key, "email")}
                    disabled={!prefs.emailEnabled}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      email && prefs.emailEnabled
                        ? "bg-sky-500 border-sky-500"
                        : "border-slate-600 hover:border-slate-500"
                    } ${!prefs.emailEnabled ? "opacity-30 cursor-not-allowed" : ""}`}
                  >
                    {email && prefs.emailEnabled && <IconCheck className="w-3 h-3 text-white" />}
                  </button>
                </div>
                <div className="w-16 flex justify-center">
                  <button
                    onClick={() => toggleTypeChannel(type.key, "push")}
                    disabled={!pushSubscribed}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      push && pushSubscribed
                        ? "bg-sky-500 border-sky-500"
                        : "border-slate-600 hover:border-slate-500"
                    } ${!pushSubscribed ? "opacity-30 cursor-not-allowed" : ""}`}
                  >
                    {push && pushSubscribed && <IconCheck className="w-3 h-3 text-white" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Email Digest */}
      <GlassCard className="p-6">
        <Heading size="h2" className="mb-2">
          Email Digest
        </Heading>
        <Text variant="muted" className="mb-6">
          Receive a summary of your notifications
        </Text>

        <div className="space-y-3">
          {[
            { value: "daily", label: "Daily Digest", desc: "Receive a daily summary of your notifications" },
            { value: "weekly", label: "Weekly Digest", desc: "Receive a weekly summary of your notifications" },
            { value: "never", label: "Never", desc: "Don't send me email digests" },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800/70 transition-colors"
            >
              <input
                type="radio"
                name="digest"
                value={opt.value}
                checked={prefs.digestFrequency === opt.value}
                onChange={() => setDigest(opt.value)}
                className="w-4 h-4 text-sky-500 border-slate-600 focus:ring-sky-500"
              />
              <div>
                <div className="font-medium text-slate-200">{opt.label}</div>
                <Text variant="muted" className="text-sm">
                  {opt.desc}
                </Text>
              </div>
            </label>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
