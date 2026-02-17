"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconCheck, IconChecks, IconBell, IconLoader2 } from "@tabler/icons-react";
import { useNotifications } from "../../lib/notification-context";
import NotificationItem from "./notification-item";

export default function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    isDropdownOpen,
    setIsDropdownOpen,
    loadMore,
    markAllAsRead,
  } = useNotifications();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, setIsDropdownOpen]);

  // Infinite scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function handleScroll() {
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - scrollTop - clientHeight < 80 && hasMore && !isLoading) {
        loadMore();
      }
    }

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoading, loadMore]);

  if (!isDropdownOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] rounded-xl bg-slate-900/95 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden z-[9990]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shadow-[0_1px_0_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-sky-500/20 text-sky-400">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-sky-400 transition-colors"
            >
              <IconChecks className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notification list */}
        <div ref={scrollRef} className="overflow-y-auto max-h-[380px]">
          {notifications.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <IconBell className="w-8 h-8 mb-2 opacity-40" />
              <span className="text-sm">No notifications yet</span>
            </div>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {notifications.map((n) => (
                  <NotificationItem key={n.id} notification={n} />
                ))}
              </AnimatePresence>

              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <IconLoader2 className="w-5 h-5 text-slate-500 animate-spin" />
                </div>
              )}

              {!hasMore && notifications.length > 0 && (
                <div className="text-center py-3 text-xs text-slate-600">
                  No more notifications
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shadow-[0_-1px_0_0_rgba(255,255,255,0.04)] px-4 py-2">
          <a
            href="/settings/notifications"
            className="text-xs text-slate-500 hover:text-sky-400 transition-colors"
            onClick={() => setIsDropdownOpen(false)}
          >
            Notification settings
          </a>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
