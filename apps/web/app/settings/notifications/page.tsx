"use client";

import { useState } from "react";
import { Button, GlassCard, Heading, Text, Badge, toast } from "@repo/ui";
import { IconBell, IconMail, IconBrandGithub, IconMessageCircle, IconCheck, IconX } from "@tabler/icons-react";

export default function NotificationsSettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [projectUpdates, setProjectUpdates] = useState(true);
  const [deploymentAlerts, setDeploymentAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Notification preferences saved successfully");
    setLoading(false);
  };

  const NotificationToggle = ({ 
    title, 
    description, 
    enabled, 
    onChange,
    icon: Icon 
  }: { 
    title: string; 
    description: string; 
    enabled: boolean; 
    onChange: (value: boolean) => void;
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
        onClick={() => onChange(!enabled)}
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
            description="Receive notifications via email"
            enabled={emailNotifications}
            onChange={setEmailNotifications}
            icon={IconMail}
          />
          <NotificationToggle
            title="Push Notifications"
            description="Receive push notifications in your browser"
            enabled={pushNotifications}
            onChange={setPushNotifications}
            icon={IconBell}
          />
        </div>
      </GlassCard>

      {/* Notification Preferences */}
      <GlassCard className="p-6">
        <Heading size="h2" className="mb-2">
          Notification Preferences
        </Heading>
        <Text variant="muted" className="mb-6">
          Customize what notifications you want to receive
        </Text>

        <div className="space-y-3">
          <NotificationToggle
            title="Project Updates"
            description="Get notified about updates to your projects"
            enabled={projectUpdates}
            onChange={setProjectUpdates}
            icon={IconBrandGithub}
          />
          <NotificationToggle
            title="Deployment Alerts"
            description="Receive alerts about deployment status changes"
            enabled={deploymentAlerts}
            onChange={setDeploymentAlerts}
            icon={IconMessageCircle}
          />
          <NotificationToggle
            title="Security Alerts"
            description="Important security notifications and updates"
            enabled={securityAlerts}
            onChange={setSecurityAlerts}
            icon={IconBell}
          />
        </div>

        <div className="flex justify-end mt-6 pt-6">
          <Button
            onClick={handleSave}
            disabled={loading}
            variant="gradient"
            leftIcon={loading ? undefined : <IconCheck className="w-4 h-4" />}
          >
            {loading ? "Saving..." : "Save Preferences"}
          </Button>
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
          <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800/70 transition-colors">
            <input
              type="radio"
              name="digest"
              value="daily"
              defaultChecked
              className="w-4 h-4 text-sky-500 border-slate-600 focus:ring-sky-500"
            />
            <div>
              <div className="font-medium text-slate-200">Daily Digest</div>
              <Text variant="muted" className="text-sm">
                Receive a daily summary of your notifications
              </Text>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800/70 transition-colors">
            <input
              type="radio"
              name="digest"
              value="weekly"
              className="w-4 h-4 text-sky-500 border-slate-600 focus:ring-sky-500"
            />
            <div>
              <div className="font-medium text-slate-200">Weekly Digest</div>
              <Text variant="muted" className="text-sm">
                Receive a weekly summary of your notifications
              </Text>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800/70 transition-colors">
            <input
              type="radio"
              name="digest"
              value="never"
              className="w-4 h-4 text-sky-500 border-slate-600 focus:ring-sky-500"
            />
            <div>
              <div className="font-medium text-slate-200">Never</div>
              <Text variant="muted" className="text-sm">
                Don't send me email digests
              </Text>
            </div>
          </label>
        </div>
      </GlassCard>
    </div>
  );
}
