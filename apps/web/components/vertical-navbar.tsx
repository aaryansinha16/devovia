"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "../lib/auth-context";
import { ThemeToggle } from "./ui/theme-toggle";

interface NavLink {
  href: string;
  label: string;
}

interface VerticalNavbarProps {
  navLinks: NavLink[];
  position: {
    top?: string;
    left?: string;
    width?: string;
  };
  onClose?: () => void;
}

export const VerticalNavbar: React.FC<VerticalNavbarProps> = ({
  navLinks,
  position,
  onClose,
}) => {
  const { user } = useAuth();
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const navbarHeight = 400; // Estimated height

  // Load saved position from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const savedPosition = localStorage.getItem("verticalNavPosition");
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setDragPosition(parsed);
      } catch (e) {
        console.warn("Failed to parse saved navbar position");
      }
    }
  }, []);

  // Calculate drag constraints to keep navbar on screen
  const getDragConstraints = () => {
    if (typeof window !== "undefined") {
      return {
        top: 0,
        left: -parseFloat(position.left || "0"),
        right: window.innerWidth - (parseFloat(position.left || "0") + 280),
        bottom:
          window.innerHeight - (parseFloat(position.top || "0") + navbarHeight),
      };
    }
    return { top: 0, left: 0, right: 0, bottom: 0 };
  };

  // Handle drag end to save position
  const handleDragEnd = (event: any, info: any) => {
    const newPosition = {
      x: info.point.x - (parseFloat(position.left || "0") + 140), // Center offset
      y: info.point.y - parseFloat(position.top || "0"),
    };
    setDragPosition(newPosition);
    localStorage.setItem("verticalNavPosition", JSON.stringify(newPosition));
  };

  const menuVariants = {
    hidden: {
      opacity: 0,
      y: -20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      x: -20,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      className="fixed z-40"
      style={{
        ...position,
        x: dragPosition.x,
        y: dragPosition.y,
      }}
      variants={menuVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      drag
      dragMomentum={false}
      dragConstraints={getDragConstraints()}
      dragElastic={0.1}
      whileDrag={{
        scale: 1.02,
        rotate: 0.5,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      }}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/30 overflow-hidden">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Menu
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg
              className="w-4 h-4 text-slate-500 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="py-2">
          {navLinks.map((link, index) => (
            <motion.div key={link.label} variants={itemVariants}>
              <Link
                href={link.href}
                onClick={onClose}
                className="flex items-center px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 transition-all duration-200 group"
              >
                <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full mr-3 group-hover:bg-sky-500 transition-colors"></div>
                <span className="text-sm font-medium">{link.label}</span>
                <svg
                  className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200/50 dark:border-slate-700/50"></div>

        {/* User Actions */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Settings
            </span>
            <ThemeToggle />
          </div>

          {user ? (
            <motion.div variants={itemVariants}>
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-sky-500/25"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Dashboard
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <motion.div variants={itemVariants}>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Login
                </Link>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Link
                  href="/register"
                  onClick={onClose}
                  className="flex items-center w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-sky-500/25"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  Sign Up
                </Link>
              </motion.div>
            </div>
          )}
        </div>

        {/* Footer - Drag Handle */}
        <motion.div
          className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200/50 dark:border-slate-700/50 cursor-move select-none"
          whileHover={{ backgroundColor: "rgba(148, 163, 184, 0.1)" }}
          // whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center space-x-1">
            <motion.div
              className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            ></motion.div>
            <motion.div
              className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            ></motion.div>
            <motion.div
              className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            ></motion.div>
          </div>
          {/* <div className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1 opacity-0 hover:opacity-100 transition-opacity">
            Drag to move
          </div> */}
        </motion.div>
      </div>
    </motion.div>
  );
};
