"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "@repo/ui";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  read: boolean;
  readAt: string | null;
  groupKey: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  channelOverrides: Record<string, { email?: boolean; push?: boolean; inApp?: boolean }> | null;
  digestFrequency: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  preferences: NotificationPreferences | null;
  loadPreferences: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  pushSupported: boolean;
  pushSubscribed: boolean;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ─── Notification sound ──────────────────────────────────────────────────────

function playNotificationPing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // Two-tone chime: a short high note followed by a slightly lower note
    const frequencies = [880, 660]; // A5 → E5
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.25);
    });

    // Clean up context after sound finishes
    setTimeout(() => ctx.close(), 600);
  } catch {
    // Silently ignore if AudioContext is unavailable
  }
}

// ─── API helpers ─────────────────────────────────────────────────────────────

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

// ─── Provider ────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // ── Fetch notifications ──────────────────────────────────────────────

  const fetchNotifications = useCallback(async (cursor?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (cursor) params.set("cursor", cursor);
      const res = await apiFetch(`?${params.toString()}`);
      if (res.success) {
        const newNotifs = res.data.notifications || [];
        if (cursor) {
          setNotifications((prev) => [...prev, ...newNotifs]);
        } else {
          setNotifications(newNotifs);
        }
        setNextCursor(res.data.nextCursor);
        setHasMore(!!res.data.nextCursor);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiFetch("/unread-count");
      if (res.success) {
        setUnreadCount(res.data.count);
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  const refresh = useCallback(async () => {
    setNextCursor(null);
    setHasMore(true);
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !nextCursor) return;
    await fetchNotifications(nextCursor);
  }, [hasMore, isLoading, nextCursor, fetchNotifications]);

  // ── Mutations ────────────────────────────────────────────────────────

  const markAsRead = useCallback(async (id: string) => {
    try {
      const res = await apiFetch(`/${id}/read`, { method: "PATCH" });
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await apiFetch("/read-all", { method: "PATCH" });
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const notification = notifications.find((n) => n.id === id);
      const res = await apiFetch(`/${id}`, { method: "DELETE" });
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (notification && !notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  }, [notifications]);

  // ── Preferences ──────────────────────────────────────────────────────

  const loadPreferences = useCallback(async () => {
    try {
      const res = await apiFetch("/preferences");
      if (res.success) {
        setPreferences(res.data);
      }
    } catch (err) {
      console.error("Failed to load preferences:", err);
    }
  }, []);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    try {
      const res = await apiFetch("/preferences", {
        method: "PUT",
        body: JSON.stringify(prefs),
      });
      if (res.success) {
        setPreferences(res.data);
      }
    } catch (err) {
      console.error("Failed to update preferences:", err);
    }
  }, []);

  // ── Push notifications ─────────────────────────────────────────────

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setPushSupported(true);
      // Check if already subscribed
      navigator.serviceWorker.getRegistration("/sw-push.js").then((reg) => {
        if (reg) {
          reg.pushManager.getSubscription().then((sub) => {
            setPushSubscribed(!!sub);
          });
        }
      });
    }
  }, []);

  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    try {
      if (!pushSupported) return false;

      // Get VAPID public key from server
      const vapidRes = await apiFetch("/push/vapid-key");
      if (!vapidRes.success || !vapidRes.data.publicKey) {
        console.error("No VAPID public key configured on server");
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw-push.js");
      await navigator.serviceWorker.ready;

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Push notification permission denied");
        return false;
      }

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidRes.data.publicKey),
      });

      // Send subscription to server
      const subJson = subscription.toJSON();
      await apiFetch("/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          subscription: {
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          },
        }),
      });

      setPushSubscribed(true);
      toast.success("Push notifications enabled");
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      toast.error("Failed to enable push notifications");
      return false;
    }
  }, [pushSupported]);

  const unsubscribeFromPush = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw-push.js");
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await apiFetch("/push/unsubscribe", {
            method: "POST",
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
      }
      setPushSubscribed(false);
      toast.success("Push notifications disabled");
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    }
  }, []);

  // ── WebSocket for real-time notifications ────────────────────────────

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace("/api", "");

    const socket = io(wsUrl, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      // User room is auto-joined on the server side
    });

    socket.on("notification", (notification: Notification) => {
      // Prepend new notification to the list
      setNotifications((prev) => [notification, ...prev]);

      // Play notification sound
      playNotificationPing();

      // Show toast
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    });

    socket.on("notification-count", (data: { count: number }) => {
      setUnreadCount(data.count);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────

  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [fetchNotifications, fetchUnreadCount]);

  // ── Context value ────────────────────────────────────────────────────

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        hasMore,
        isDropdownOpen,
        setIsDropdownOpen,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh,
        preferences,
        loadPreferences,
        updatePreferences,
        pushSupported,
        pushSubscribed,
        subscribeToPush,
        unsubscribeFromPush,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
