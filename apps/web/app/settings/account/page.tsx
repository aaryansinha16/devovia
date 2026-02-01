"use client";

import { useState } from "react";
import { Button, GlassCard, Heading, Text, Input, Label, toast } from "@repo/ui";
import { IconKey, IconCopy, IconRefresh, IconTrash, IconPlus, IconEye, IconEyeOff } from "@tabler/icons-react";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
}

export default function AccountSettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: "1",
      name: "Production API",
      key: "dvv_prod_1234567890abcdef",
      createdAt: "2024-01-15",
      lastUsed: "2024-02-01"
    }
  ]);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  };

  const handleToggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `dvv_${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: null
    };

    setApiKeys([...apiKeys, newKey]);
    setNewKeyName("");
    setShowNewKeyDialog(false);
    toast.success("API key created successfully");
  };

  const handleDeleteKey = (id: string) => {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return;
    }
    setApiKeys(apiKeys.filter(key => key.id !== id));
    toast.success("API key deleted successfully");
  };

  const maskKey = (key: string) => {
    return key.substring(0, 12) + "•".repeat(20);
  };

  return (
    <div className="space-y-6">
      {/* API Keys */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <Heading size="h2" className="mb-2">
              API Keys
            </Heading>
            <Text variant="muted">
              Manage your API keys for programmatic access
            </Text>
          </div>
          <Button
            onClick={() => setShowNewKeyDialog(true)}
            variant="gradient"
            size="sm"
            leftIcon={<IconPlus className="w-4 h-4" />}
          >
            Create Key
          </Button>
        </div>

        {showNewKeyDialog && (
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
            <Label htmlFor="keyName">Key Name</Label>
            <Input
              id="keyName"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., Production API, Development Key"
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button onClick={handleCreateKey} variant="gradient" size="sm">
                Create
              </Button>
              <Button onClick={() => setShowNewKeyDialog(false)} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-200 mb-1">{apiKey.name}</h3>
                  <div className="flex items-center gap-2 font-mono text-sm text-slate-400">
                    <span>{showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}</span>
                    <button
                      onClick={() => handleToggleKeyVisibility(apiKey.id)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showKeys[apiKey.id] ? (
                        <IconEyeOff className="w-4 h-4" />
                      ) : (
                        <IconEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCopyKey(apiKey.key)}
                    variant="outline"
                    size="sm"
                    leftIcon={<IconCopy className="w-4 h-4" />}
                  >
                    Copy
                  </Button>
                  <Button
                    onClick={() => handleDeleteKey(apiKey.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-400 hover:bg-red-500/10"
                    leftIcon={<IconTrash className="w-4 h-4" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>Created: {apiKey.createdAt}</span>
                <span>•</span>
                <span>Last used: {apiKey.lastUsed || "Never"}</span>
              </div>
            </div>
          ))}

          {apiKeys.length === 0 && (
            <div className="text-center py-8">
              <IconKey className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <Text variant="muted">No API keys created yet</Text>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Account Preferences */}
      <GlassCard className="p-6">
        <Heading size="h2" className="mb-6">
          Account Preferences
        </Heading>

        <div className="space-y-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-200 mb-1">Language</h3>
                <Text variant="muted" className="text-sm">
                  Choose your preferred language for the interface
                </Text>
              </div>
              <select className="px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-200 mb-1">Timezone</h3>
                <Text variant="muted" className="text-sm">
                  Set your timezone for accurate timestamps
                </Text>
              </div>
              <select className="px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50">
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-200 mb-1">Date Format</h3>
                <Text variant="muted" className="text-sm">
                  Choose how dates are displayed
                </Text>
              </div>
              <select className="px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50">
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="gradient" size="sm">
            Save Preferences
          </Button>
        </div>
      </GlassCard>

      {/* Danger Zone */}
      <GlassCard className="p-6 border-2 border-red-500/20">
        <Heading size="h2" className="mb-2 text-red-400">
          Danger Zone
        </Heading>
        <Text variant="muted" className="mb-6">
          Irreversible and destructive actions
        </Text>

        <div className="space-y-4">
          <div className="p-4 bg-red-500/5 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-200 mb-1">Export Account Data</h3>
                <Text variant="muted" className="text-sm">
                  Download all your account data in JSON format
                </Text>
              </div>
              <Button variant="outline" size="sm">
                Export Data
              </Button>
            </div>
          </div>

          <div className="p-4 bg-red-500/5 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-red-400 mb-1">Delete Account</h3>
                <Text variant="muted" className="text-sm">
                  Permanently delete your account and all associated data
                </Text>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-400 hover:bg-red-500/10"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
