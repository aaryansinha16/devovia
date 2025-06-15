import { cn } from "../../lib/utils";
import { useEffect, useRef, useState } from "react";
import { motion, MotionValue, useMotionValue, useSpring, useTransform } from "motion/react";
import { AnimatePresence } from "motion/react";
import {
  IconLayoutNavbarCollapse,
  IconChevronRight,
} from "@tabler/icons-react";

// Import custom CSS for the dock
import "./floating-dock.css";

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: {
                    delay: idx * 0.05,
                  },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                <a
                  href={item.href}
                  key={item.title}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-900"
                >
                  <div className="h-4 w-4">{item.icon}</div>
                </a>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-800"
      >
        <IconLayoutNavbarCollapse className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  className?: string;
}) => {
  let mouseX = useMotionValue(Infinity);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Initial check
      setIsDarkMode(document.documentElement.classList.contains('dark'));

      // Set up observer to watch for class changes on html element
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });
      
      return () => observer.disconnect();
    }
  }, []);
  
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn("mx-auto hidden rounded-2xl px-4 pb-3 backdrop-blur-sm md:flex gap-4 h-16", className)}
      style={{
        alignItems: "flex-end",
        // backgroundColor: isDarkMode ? "#171717" : "#f9fafb", // Dark: neutral-900, Light: gray-50
        background: isDarkMode ? "rgba(49, 46, 129, 0.2)" : "rgba(249, 250, 251, 0.2)",
        borderRadius: "16px",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        // backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href: string;
}) {
  let ref = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Initial check
      setIsDarkMode(document.documentElement.classList.contains('dark'));

      // Set up observer to watch for class changes on html element
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });
      
      return () => observer.disconnect();
    }
  }, []);
 
  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
 
    return val - bounds.x - bounds.width / 2;
  });
 
  let widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  let heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
 
  let widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
  let heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 40, 20],
  );
 
  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
 
  let widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
 
  const [hovered, setHovered] = useState(false);
 
  return (
    <a href={href}>
      <motion.div
        ref={ref}
        style={{ 
          width, 
          height,
          backgroundColor: isDarkMode ? "#000" : "#e5e7eb", // Dark: neutral-800, Light: gray-200
          borderRadius: "9999px", // rounded-full
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          aspectRatio: "1 / 1"
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-8 left-1/2 w-fit rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs whitespace-pre text-neutral-700 dark:border-neutral-900 dark:bg-neutral-800 dark:text-white"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence> */}
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </a>
  );
}
