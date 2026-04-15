// Module declaration for framer-motion — dist/types is absent from the installed
// v12 package. This stub covers the API surface used across HatchQuest so tsc
// does not error on import. Remove once framer-motion types are restored.

declare module "framer-motion" {
  import type { ComponentType } from "react";

  type MotionStyle = Record<string, unknown>;

  type Transition = {
    duration?: number;
    delay?: number;
    ease?: string | number[];
    type?: string;
    stiffness?: number;
    damping?: number;
    mass?: number;
    repeat?: number;
    repeatType?: "loop" | "reverse" | "mirror";
  };

  type Variants = Record<string, Record<string, unknown>>;

  interface AnimationProps {
    initial?: Record<string, unknown> | string | boolean;
    animate?: Record<string, unknown> | string;
    exit?: Record<string, unknown> | string;
    transition?: Transition;
    variants?: Variants;
    whileHover?: Record<string, unknown> | string;
    whileTap?: Record<string, unknown> | string;
    whileFocus?: Record<string, unknown> | string;
    whileInView?: Record<string, unknown> | string;
    layout?: boolean | string;
    layoutId?: string;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
    onClick?: React.MouseEventHandler;
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
    key?: React.Key;
    ref?: React.Ref<unknown>;
    id?: string;
    role?: string;
    "aria-label"?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }

  // Allow any HTML attribute through index signature
  interface MotionProps extends AnimationProps {
    [key: string]: unknown;
  }

  type MotionTag<T extends keyof JSX.IntrinsicElements> = ComponentType<
    JSX.IntrinsicElements[T] & AnimationProps
  >;

  type MotionFactory = {
    [Tag in keyof JSX.IntrinsicElements]: MotionTag<Tag>;
  };

  export const motion: MotionFactory;

  export const AnimatePresence: ComponentType<{
    children?: React.ReactNode;
    mode?: "sync" | "popLayout" | "wait";
    initial?: boolean;
    onExitComplete?: () => void;
  }>;

  export function useAnimation(): {
    start(definition: Record<string, unknown> | string): Promise<void>;
    stop(): void;
    set(definition: Record<string, unknown>): void;
  };

  export function useMotionValue<T>(initial: T): { get(): T; set(v: T): void };
}
