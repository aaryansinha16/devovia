
import React, { useRef, CSSProperties, ReactNode, ElementRef, ElementType, JSX } from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

// FIX: Define own props for AnimatedElement to distinguish them from passthrough HTML attributes.
interface AnimatedElementOwnProps<T extends keyof JSX.IntrinsicElements> {
  children: ReactNode;
  className?: string;
  animationClassName?: string;
  delay?: string;
  threshold?: number;
  as?: T;
  style?: CSSProperties;
}

// FIX: Update props type to combine own props with standard HTML attributes for the given element type T.
// This allows passthrough of attributes like 'id', 'aria-*', etc.
// Omit keys already defined in AnimatedElementOwnProps from JSX.IntrinsicElements[T] to prevent conflicts.
// 'ref' is also omitted as the component manages its own ref.
type AnimatedElementProps<T extends keyof JSX.IntrinsicElements = 'div'> =
  AnimatedElementOwnProps<T> & Omit<JSX.IntrinsicElements[T], keyof AnimatedElementOwnProps<T> | 'ref'>;

// FIX: Changed component to be a generic function.
// This allows `useRef` and the rendered `Tag` to be correctly typed based on the `as` prop.
const AnimatedElement = <T extends keyof JSX.IntrinsicElements = 'div'>({
  // Destructure own props
  children,
  className = '',
  animationClassName = 'animate-fade-in-up',
  delay = '',
  threshold = 0.1,
  as,
  style,
  // FIX: Capture remaining props (like 'id', 'aria-*') to pass them through.
  ...restProps
}: AnimatedElementProps<T>) => {
  // FIX: Determine the tag to render. Default to 'div' if 'as' is not provided.
  // The cast `as T` is safe because if `as` is undefined, T defaults to 'div'.
  const InternalTag = as || ('div' as T);
  // FIX: Cast to React.ElementType to simplify type inference for JSX compiler with generic intrinsic tags
  const TagToRender = InternalTag as ElementType;


  // FIX: `useRef` is now typed based on `React.ElementRef<T>`, which resolves to the correct DOM element type
  // (e.g., HTMLDivElement if T is 'div', SVGSVGElement if T is 'svg').
  const ref = useRef<ElementRef<T>>(null);

  // FIX: Pass the correctly typed `ref` to `useIntersectionObserver`.
  // `React.ElementRef<T>` will always be a subtype of `Element` (e.g., HTMLDivElement extends Element).
  // Therefore, `RefObject<React.ElementRef<T>>` is compatible with `RefObject<Element>`.
  // An explicit cast `as React.RefObject<Element>` can be used if TypeScript needs further clarification,
  // but is often not necessary.
  const isVisible = useIntersectionObserver(ref as React.RefObject<Element>, { threshold });

  // Construct the className string as in the original component
  const combinedClassName = `${className} ${delay} ${
    isVisible ? animationClassName : 'opacity-0' // Start with opacity-0 to avoid flash before animation
  }`.trim();

  // Construct the style object as in the original component
  // Ensure initial state is invisible for JS-driven animations
  const animationDrivenStyle = !isVisible ? { opacity: 0 } : {};
  
  // FIX: Merge incoming style with animation-driven style
  const finalStyle: CSSProperties = {
    ...style, // User-provided style
    ...animationDrivenStyle, // Animation-specific style (e.g., opacity)
  };


  return (
    // Render the determined Tag with the correctly typed ref and calculated props.
    // The `ref` prop on `TagToRender` now correctly matches `React.Ref<React.ElementRef<T>>`.
    // FIX: Spread ...restProps to pass through other HTML attributes like 'id'.
    <TagToRender
      ref={ref}
      className={combinedClassName}
      style={finalStyle}
      {...restProps}
    >
      {children}
    </TagToRender>
  );
};

export default AnimatedElement;
