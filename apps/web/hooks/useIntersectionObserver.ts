import { useState, useEffect, RefObject } from "react";

// Define the IntersectionObserverInit interface if it's not available
interface IntersectionObserverInit {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
}

interface IntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

function useIntersectionObserver(
  elementRef: RefObject<Element>,
  {
    threshold = 0.1,
    root = null,
    rootMargin = "0%",
    freezeOnceVisible = true,
  }: IntersectionObserverOptions = {}, // Provide default for the entire options object
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const node = elementRef?.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsIntersecting(true);
          if (freezeOnceVisible) {
            observer.unobserve(node);
          }
        } else if (entry) {
          if (!freezeOnceVisible) {
            setIsIntersecting(false);
          }
        }
      },
      { threshold, root, rootMargin },
    );

    observer.observe(node);

    return () => {
      if (node) {
        observer.unobserve(node);
      }
      observer.disconnect();
    };
    // We intentionally only want this effect to run when these specific dependencies change
  }, [elementRef, threshold, root, rootMargin, freezeOnceVisible]);

  return isIntersecting;
}

export default useIntersectionObserver;
