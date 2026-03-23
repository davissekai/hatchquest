"use client";

import { useEffect, useRef } from "react";

interface AnimatedScoreProps {
  target: number;
  duration?: number;
}

const AnimatedScore = ({ target, duration = 2000 }: AnimatedScoreProps) => {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = (eased * target).toFixed(1);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return (
    <span
      ref={spanRef}
      className="font-display text-7xl sm:text-8xl tabular-nums text-accent"
    >
      0.0
    </span>
  );
};

export default AnimatedScore;
