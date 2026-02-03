"use client";

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, Variants } from 'framer-motion';
import { useCursor } from '../lib/cursor-context';
import { useTheme } from '../lib/theme-context';

interface Ripple {
  x: number;
  y: number;
  id: number;
}

const GlobalCursor: React.FC = () => {
  const { cursorVariant, textMessage } = useCursor();
  const { theme } = useTheme();
  const [isClicked, setIsClicked] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Motion values for mouse position
  const mouseX = useMotionValue(-100); // Start off-screen
  const mouseY = useMotionValue(-100);

  // Main cursor physics - Higher stiffness for sharper response, lower damping for speed
  const springConfig = { damping: 25, stiffness: 1200, mass: 0.1 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Trail physics - Softer stiffness for a more fluid, elegant following motion
  const trailSpringConfig = { damping: 20, stiffness: 300, mass: 0.3 };

  const t1x = useSpring(mouseX, trailSpringConfig);
  const t1y = useSpring(mouseY, trailSpringConfig);

  const t2x = useSpring(t1x, trailSpringConfig);
  const t2y = useSpring(t1y, trailSpringConfig);

  const t3x = useSpring(t2x, trailSpringConfig);
  const t3y = useSpring(t2y, trailSpringConfig);

  const t4x = useSpring(t3x, trailSpringConfig);
  const t4y = useSpring(t3y, trailSpringConfig);

  const t5x = useSpring(t4x, trailSpringConfig);
  const t5y = useSpring(t4y, trailSpringConfig);

  const trails = [
    { x: t1x, y: t1y },
    { x: t2x, y: t2y },
    { x: t3x, y: t3y },
    { x: t4x, y: t4y },
    { x: t5x, y: t5y },
  ];

  useEffect(() => {
    // Hide default cursor globally with maximum specificity
    const applyCursorNone = () => {
      document.body.style.setProperty('cursor', 'none', 'important');
      document.documentElement.style.setProperty('cursor', 'none', 'important');
    };

    applyCursorNone();

    // Apply cursor:none to all interactive elements with !important
    const style = document.createElement('style');
    style.id = 'global-cursor-style';
    style.textContent = `
      *, *::before, *::after,
      a, button, input, textarea, select,
      [role="button"], [role="link"],
      .cursor-pointer, [onclick] {
        cursor: none !important;
      }
      
      /* Override any inline styles */
      body, html {
        cursor: none !important;
      }
      
      /* Target specific UI library components */
      [class*="button"], [class*="btn"],
      [class*="link"], [class*="input"] {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    // Aggressive reapply using requestAnimationFrame
    let rafId: number;
    const reapplyCursorNone = () => {
      applyCursorNone();
      rafId = requestAnimationFrame(reapplyCursorNone);
    };
    rafId = requestAnimationFrame(reapplyCursorNone);

    // Watch for DOM changes that might reset cursor
    const observer = new MutationObserver(() => {
      applyCursorNone();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: true,
      childList: true
    });

    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const onMouseDown = () => {
      setIsClicked(true);
      setRipples(prev => [
        ...prev,
        { x: mouseX.get(), y: mouseY.get(), id: Date.now() }
      ]);
      applyCursorNone();
    };

    const onMouseUp = () => {
      setIsClicked(false);
      applyCursorNone();
    };

    const onClick = () => {
      applyCursorNone();
    };

    const forceTargetCursorNone = (target: EventTarget | null) => {
      if (target instanceof HTMLElement) {
        target.style.setProperty('cursor', 'none', 'important');
      }
    };

    const onPointerOver = (e: PointerEvent) => {
      forceTargetCursorNone(e.target);
    };

    const onPointerDown = (e: PointerEvent) => {
      forceTargetCursorNone(e.target);
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('click', onClick, true); // Use capture phase
    document.addEventListener('click', onClick, true);
    document.addEventListener('pointerover', onPointerOver, true);
    document.addEventListener('pointerdown', onPointerDown, true);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('click', onClick, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('pointerover', onPointerOver, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      cancelAnimationFrame(rafId);
      observer.disconnect();

      // Cleanup
      document.body.style.cursor = "";
      document.documentElement.style.cursor = "";
      const existingStyle = document.getElementById('global-cursor-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [mouseX, mouseY]);

  // Variants to define how the cursor container looks in different states
  const variants: Variants = {
    default: {
      rotate: 0,
      scale: 1,
      x: -4,
      y: -4,
      transition: { type: 'spring', stiffness: 500, damping: 25, mass: 0.3 }
    },
    button: {
      rotate: -8, // Subtle tilt for action
      scale: 1.1,
      x: -4,
      y: -4,
      transition: { type: 'spring', stiffness: 500, damping: 25, mass: 0.3 }
    },
    text: {
      rotate: 0,
      scale: 0.8,
      x: -4,
      y: -4,
      opacity: 1,
      transition: { type: 'spring', stiffness: 500, damping: 25, mass: 0.3 }
    },
    card: {
      scale: 1.2,
      rotate: 8, // Subtle tilt for emphasis
      x: -4,
      y: -4,
      transition: { type: 'spring', stiffness: 500, damping: 25, mass: 0.3 }
    }
  };

  // Gradient stop color variants - Adaptive to theme
  const gradientStartVariants: Variants = {
    default: {
      stopColor: theme === 'dark' ? "#0a0a0a" : "#1F2937",
      transition: { duration: 0.2 }
    },
    button: { stopColor: "#4f46e5", transition: { duration: 0.2 } },
    text: { stopColor: "#10b981", transition: { duration: 0.2 } },
    card: { stopColor: "#7c3aed", transition: { duration: 0.2 } }
  };

  const gradientEndVariants: Variants = {
    default: {
      stopColor: theme === 'dark' ? "##404040" : "#4B5563",
      transition: { duration: 0.2 }
    },
    button: { stopColor: "#818cf8", transition: { duration: 0.2 } }, // Indigo-400
    text: { stopColor: "#34d399", transition: { duration: 0.2 } }, // Emerald-400
    card: { stopColor: "#a78bfa", transition: { duration: 0.2 } }  // Violet-400
  };

  // Variants for the SVG path itself
  const pathVariants: Variants = {
    default: {
      opacity: 1,
      strokeWidth: 3.5,
      scale: 1,
      stroke: '#ffffff',
      transition: { duration: 0.2 }
    },
    button: {
      opacity: 1,
      strokeWidth: 2.5,
      scale: [1, 1.15, 1], // Breathing effect
      stroke: '#ffffff',
      transition: {
        default: { duration: 0.2 },
        scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
      }
    },
    text: {
      opacity: 0.9,
      strokeWidth: 2,
      scale: [1, 0.9, 1], // Subtle shrink pulse
      stroke: '#ffffff',
      transition: {
        default: { duration: 0.2 },
        scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
      }
    },
    card: {
      opacity: 0.9,
      strokeWidth: 3.5,
      scale: [1, 1.1, 1],
      stroke: '#ffffff',
      transition: {
        default: { duration: 0.2 },
        scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
      }
    }
  };

  return (
    <>
      {/* Ripple Effects */}
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          className={`fixed z-[9990] pointer-events-none rounded-full border ${theme === 'dark' ? 'border-neutral-400' : 'border-neutral-500'}`}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          onAnimationComplete={() => {
            setRipples(prev => prev.filter(r => r.id !== ripple.id));
          }}
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 30,
            height: 30,
            translateX: "-50%",
            translateY: "-50%"
          }}
        />
      ))}

      {/* Trail Elements */}
      {trails.map((trail, index) => (
        <motion.div
          key={index}
          className={`fixed top-0 left-0 z-[9998] pointer-events-none rounded-full ${theme === 'dark' ? 'bg-neutral-200' : 'bg-neutral-800'}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: cursorVariant === 'card' ? 0 : (1 - index * 0.18) * 0.3,
            scale: cursorVariant === 'card' ? 0.5 : 1
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{
            x: trail.x,
            y: trail.y,
            width: Math.max(2, 10 - index * 1.5),
            height: Math.max(2, 10 - index * 1.5),
            translateX: "-50%",
            translateY: "-50%"
          }}
        />
      ))}

      {/* Main Cursor */}
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none flex items-center justify-center"
        style={{
          translateX: smoothX,
          translateY: smoothY,
          transformOrigin: "center center"
        }}
      >
        <motion.div
          variants={variants}
          animate={cursorVariant}
          className="relative"
        >
          <motion.div
            animate={{ scale: isClicked ? 0.75 : 1 }}
            transition={{ type: "spring", stiffness: 800, damping: 20 }}
          >
            <motion.svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-lg"
              style={{ filter: 'drop-shadow(0px 4px 6px rgba(255, 255, 255, 0.3))' }}
            >
              <defs>
                <linearGradient id="cursor-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <motion.stop offset="0%" variants={gradientStartVariants} animate={cursorVariant} />
                  <motion.stop offset="100%" variants={gradientEndVariants} animate={cursorVariant} />
                </linearGradient>
              </defs>
              <motion.path
                variants={pathVariants}
                animate={cursorVariant}
                d="M5 5 L11.5 24 L15.5 15.5 L25 11.5 L5 5Z"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="url(#cursor-gradient)"
                style={{ originX: 0.5, originY: 0.5 }}
              />
            </motion.svg>
          </motion.div>

          {textMessage && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 30, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              className={`absolute top-1/2 -translate-y-1/2 left-0 whitespace-nowrap text-xs font-bold px-2 py-1 rounded-md ${theme === 'dark' ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'}`}
            >
              {textMessage}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </>
  );
};

export default GlobalCursor;
