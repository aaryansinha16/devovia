"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  IconRocket,
  IconRocketOff,
  IconBriefcase,
  IconDeviceDesktop,
  IconPlayerPlay,
  IconPlayerPlayFilled,
  IconAt,
  IconShield,
  IconInfoCircle,
  IconTrash,
} from "@tabler/icons-react";
import { Notification, useNotifications } from "../../lib/notification-context";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  deployment_success: { icon: IconRocket, color: "text-emerald-400" },
  deployment_failed: { icon: IconRocketOff, color: "text-red-400" },
  project_invite: { icon: IconBriefcase, color: "text-sky-400" },
  project_update: { icon: IconBriefcase, color: "text-slate-400" },
  session_invite: { icon: IconDeviceDesktop, color: "text-violet-400" },
  session_joined: { icon: IconDeviceDesktop, color: "text-violet-400" },
  runbook_completed: { icon: IconPlayerPlayFilled, color: "text-emerald-400" },
  runbook_failed: { icon: IconPlayerPlay, color: "text-red-400" },
  mention: { icon: IconAt, color: "text-amber-400" },
  security: { icon: IconShield, color: "text-red-400" },
  system: { icon: IconInfoCircle, color: "text-slate-400" },
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationItem({ notification }: { notification: Notification }) {
  const router = useRouter();
  const { markAsRead, deleteNotification, setIsDropdownOpen } = useNotifications();

  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system || { icon: IconInfoCircle, color: "text-slate-400" };
  const Icon: React.ElementType = config.icon;

  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.data?.url) {
      setIsDropdownOpen(false);
      router.push(notification.data.url);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notification.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={handleClick}
      className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${
        notification.read
          ? "hover:bg-slate-800/40"
          : "bg-slate-800/60 hover:bg-slate-800/80"
      }`}
    >
      {/* Icon */}
      <div className={`mt-0.5 shrink-0 ${config.color}`}>
        {React.createElement(Icon, { className: "w-5 h-5" })}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium truncate ${
              notification.read ? "text-slate-400" : "text-slate-200"
            }`}
          >
            {notification.title}
          </span>
          {!notification.read && (
            <span className="shrink-0 w-2 h-2 rounded-full bg-sky-400" />
          )}
        </div>
        <p
          className={`text-xs mt-0.5 line-clamp-2 ${
            notification.read ? "text-slate-500" : "text-slate-400"
          }`}
        >
          {notification.message}
        </p>
        <span className="text-[11px] text-slate-600 mt-1 block">
          {timeAgo(notification.createdAt)}
        </span>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400"
        title="Delete"
      >
        <IconTrash className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
