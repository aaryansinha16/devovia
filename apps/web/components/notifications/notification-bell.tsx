"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconBell } from "@tabler/icons-react";
import { useNotifications } from "../../lib/notification-context";
import NotificationDropdown from "./notification-dropdown";

export default function NotificationBell() {
  const { unreadCount, isDropdownOpen, setIsDropdownOpen } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 hover:bg-white/[0.06] text-slate-400 hover:text-slate-200"
        title="Notifications"
      >
        <IconBell className={`w-5 h-5 transition-transform ${unreadCount > 0 ? "animate-[wiggle_0.4s_ease-in-out]" : ""}`} />

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className={`absolute flex items-center justify-center font-semibold rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-500/40 ${
                unreadCount < 10
                  ? "-top-0.5 -right-0.5 w-[18px] h-[18px] text-[10px]"
                  : "-top-1 -right-2 min-w-[22px] h-[18px] px-1.5 text-[9px]"
              }`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring behind badge when unread */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-sky-400/30 animate-ping"
            />
          )}
        </AnimatePresence>
      </button>

      <NotificationDropdown />
    </div>
  );
}
