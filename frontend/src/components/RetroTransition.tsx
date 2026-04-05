"use client";

import { useState, useEffect } from "react";

interface RetroTransitionProps {
  messages?: string[];
  duration?: number;
  onComplete: () => void;
}

const defaultMessages = [
  "LOADING MARKET DATA...",
  "CONNECTING TO ACCRA...",
  "BUILDING YOUR EMPIRE...",
  "CALCULATING ODDS...",
];

const RetroTransition = ({
  messages = defaultMessages,
  duration = 2500,
  onComplete,
}: RetroTransitionProps) => {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const steps = 10;
    const stepTime = duration / steps;
    let current = 0;

    const interval = setInterval(() => {
      current++;
      setProgress(current * 10);
      if (current >= steps) {
        clearInterval(interval);
        setTimeout(onComplete, 200);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 600);
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="scanlines pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        <span className="font-display text-5xl text-accent retro-blink">&#9654;</span>

        <p className="font-display text-xs sm:text-sm tracking-[0.2em] text-primary text-center min-h-[2em]">
          {messages[msgIndex]}
        </p>

        <div className="w-64 sm:w-80 border-[3px] border-primary bg-card p-1 shadow-brutal-sm">
          <div className="flex gap-[2px] h-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 transition-colors duration-100 ${
                  i < progress / 10 ? "bg-accent" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <span className="font-display text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
          {progress}%
        </span>
      </div>
    </div>
  );
};

export default RetroTransition;
