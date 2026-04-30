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
 * Full-screen loading transition.
 * Re-imagined for the "Vibrant Rounded Graffiti" aesthetic.
 * Shows cycling messages and a chunky, vibrant progress bar.
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
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-navy">
      {/* Subtle kente texture at very low opacity */}
      <div className="absolute inset-0 kente-pattern opacity-10 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-10 px-8 max-w-sm w-full">
        {/* Animated icon */}
        <div className="w-24 h-24 rounded-full bg-hot-pink flex items-center justify-center shadow-[0_12px_40px_rgba(255,42,133,0.4)] border-4 border-white animate-pulse">
          <span className="material-symbols-outlined text-white text-5xl">
            rocket_launch
          </span>
        </div>

        {/* Cycling message */}
        <p className="font-headline font-extrabold text-xl text-white italic text-center min-h-[3em] drop-shadow-md tracking-tight">
          {messages[msgIndex]}
        </p>

        <div className="w-full space-y-4">
          {/* Progress bar */}
          <div className="w-full rounded-full bg-white/10 overflow-hidden h-6 border-4 border-white/20 p-1">
            <div
              className="h-full bg-lime rounded-full transition-all duration-200 ease-out shadow-[0_0_15px_rgba(57,255,20,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="font-headline font-black text-center text-sm text-lime tracking-widest uppercase">
            System status: {progress}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default RetroTransition;
