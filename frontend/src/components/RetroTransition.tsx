"use client";

import { useState, useEffect } from "react";

interface RetroTransitionProps {
  messages?: string[];
  duration?: number;
  onComplete: () => void;
}

const defaultMessages = [
  "Loading market data...",
  "Connecting to Accra...",
  "Building your empire...",
  "Calculating the odds...",
];

/**
 * Full-screen loading transition in Stitch design language.
 * Shows cycling messages and an animated progress bar.
 * Calls onComplete when the duration elapses.
 */
const RetroTransition = ({
  messages = defaultMessages,
  duration = 2500,
  onComplete,
}: RetroTransitionProps) => {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  /* Progress bar — 10 steps over duration */
  useEffect(() => {
    const stepTime = duration / 10;
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setProgress(current * 10);
      if (current >= 10) {
        clearInterval(interval);
        setTimeout(onComplete, 200);
      }
    }, stepTime);
    return () => clearInterval(interval);
  }, [duration, onComplete]);

  /* Cycle messages every 600 ms */
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 600);
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Subtle kente texture at very low opacity */}
      <div className="absolute inset-0 kente-pattern opacity-30 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-8 max-w-sm w-full">
        {/* Animated icon */}
        <div className="w-20 h-20 rounded-full hero-gradient flex items-center justify-center shadow-[0_12px_40px_rgba(82,79,178,0.3)]">
          <span className="material-symbols-outlined text-on-primary text-4xl animate-pulse">
            rocket_launch
          </span>
        </div>

        {/* Cycling message */}
        <p className="font-body italic text-lg text-on-surface-variant text-center min-h-[2em]">
          {messages[msgIndex]}
        </p>

        {/* Progress bar */}
        <div className="w-full rounded-full bg-surface-container-high overflow-hidden h-2">
          <div
            className="h-full bg-primary rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="font-label text-xs text-on-surface-variant tracking-widest uppercase">
          {progress}%
        </p>
      </div>
    </div>
  );
};

export default RetroTransition;
