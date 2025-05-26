"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "../lib/theme-context";

const CursorBlobEffect: React.FC = () => {
  const { theme } = useTheme();
  const [position, setPosition] = useState({ x: -500, y: -500 }); // Start far off-screen
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const updateMousePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeaveDocument = () => setIsVisible(false);
    const handleMouseEnterDocument = () => setIsVisible(true);

    document.addEventListener("mousemove", updateMousePosition);
    document.documentElement.addEventListener(
      "mouseleave",
      handleMouseLeaveDocument,
    );
    document.documentElement.addEventListener(
      "mouseenter",
      handleMouseEnterDocument,
    );

    document.body.style.cursor = "none";
    const interactiveElements = document.querySelectorAll(
      'a, button, [role="button"], input[type="submit"], input[type="button"], label[for], select, textarea',
    );
    interactiveElements.forEach(
      (el) => ((el as HTMLElement).style.cursor = "none"),
    );

    return () => {
      document.removeEventListener("mousemove", updateMousePosition);
      document.documentElement.removeEventListener(
        "mouseleave",
        handleMouseLeaveDocument,
      );
      document.documentElement.removeEventListener(
        "mouseenter",
        handleMouseEnterDocument,
      );
      document.body.style.cursor = "";
      interactiveElements.forEach(
        (el) => ((el as HTMLElement).style.cursor = ""),
      );
    };
  }, [isMounted]);

  // Adjusted blob colors for significantly darker/more saturated effect
  const blobColorLight = "rgba(14, 165, 233, 0.75)"; // sky-500 based, further increased alpha
  const blobColorDark = "rgba(56, 189, 248, 0.7)"; // sky-400 based, further increased alpha

  const centerDotColorLight = "bg-sky-600";
  const centerDotColorDark = "bg-sky-400";

  const currentBlobColor = theme === "light" ? blobColorLight : blobColorDark;
  const currentCenterDotColor =
    theme === "light" ? centerDotColorLight : centerDotColorDark;

  if (!isMounted) return null;

  return (
    <div
      id="cursor-blob-effect"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        background: `radial-gradient(circle, ${currentBlobColor} 0%, transparent 50%)`,
        filter: "blur(50px) opacity(0.9)", // Slightly reduced blur, increased filter opacity
      }}
      className={`fixed w-80 h-80 md:w-[400px] md:h-[400px] rounded-full pointer-events-none z-[99] transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ease-out
      ${isVisible ? "opacity-100" : "opacity-0"} 
      `}
    >
      {/* Center Dot */}
      <div
        id="cursor-blob-center-dot"
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full opacity-85 ${currentCenterDotColor}`}
      />
    </div>
  );
};

export default CursorBlobEffect;
