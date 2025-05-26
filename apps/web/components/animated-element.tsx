// components/animated-element.tsx
import React, {
  ElementType,
  ReactNode,
  CSSProperties,
  forwardRef,
  ReactElement,
  Ref,
  useRef,
} from "react";
import useIntersectionObserver from "../hooks/useIntersectionObserver";

// 1) Polymorphic boilerplate, with ref always as HTMLElement
//    PolymorphicRef<T> resolves to Ref<HTMLElement> so refs always point to an HTMLElement
//    PropsToOmit & PolymorphicComponentProps merge OwnProps with intrinsic element props

type PolymorphicRef<T extends ElementType> = Ref<HTMLElement>;

type PropsToOmit<T extends ElementType, P> = keyof (P & { as?: T });

type PolymorphicComponentProps<T extends ElementType, P> = P & {
  as?: T;
  children?: ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, PropsToOmit<T, P>>;

// 2) Your own props
interface OwnProps {
  className?: string;
  animationClassName?: string;
  delay?: string;
  threshold?: number;
  style?: CSSProperties;
}

// 3) Full polymorphic props
//    AnimatedElementProps<T> = OwnProps + as prop + children + intrinsic props of T

type AnimatedElementProps<T extends ElementType> = PolymorphicComponentProps<
  T,
  OwnProps
>;

// 4) Implementation — _AnimatedElement handles logic, uses React.createElement for dynamic Tag

function _AnimatedElement<T extends ElementType = "div">(
  {
    as,
    children,
    className = "",
    animationClassName = "animate-fade-in-up",
    delay = "",
    threshold = 0.1,
    style,
    ...restProps
  }: AnimatedElementProps<T>,
  ref: PolymorphicRef<T>,
): ReactElement | null {
  const Tag = (as || "div") as ElementType;

  // always resolve to an HTMLElement for IntersectionObserver
  const internalRef = useRef<HTMLElement>(null);
  const resolvedRef = (ref as any) || internalRef;

  const isVisible = useIntersectionObserver(resolvedRef, { threshold });

  const combinedClassName = [
    className,
    delay,
    isVisible ? animationClassName : "opacity-0",
  ]
    .filter(Boolean)
    .join(" ");

  const finalStyle = {
    ...style,
    ...(isVisible ? {} : { opacity: 0 }),
  };

  return React.createElement(
    Tag,
    {
      ref: resolvedRef,
      className: combinedClassName,
      style: finalStyle,
      ...restProps,
    },
    children,
  );
}

// 5) Define a component interface that is callable and has displayName

interface AnimatedElementComponent {
  <T extends ElementType = "div">(
    props: AnimatedElementProps<T> & { ref?: PolymorphicRef<T> },
  ): ReactElement | null;
  displayName?: string;
}

// 6) forwardRef + cast to our interface
const AnimatedElement = forwardRef(
  _AnimatedElement,
) as AnimatedElementComponent;

// 7) Assign displayName for DevTools
AnimatedElement.displayName = "AnimatedElement";

export default AnimatedElement;
