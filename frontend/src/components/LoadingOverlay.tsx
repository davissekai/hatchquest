"use client";

interface LoadingOverlayProps {
  /** Message to display below the spinner. */
  message?: string;
}

/**
 * Full-screen loading overlay in retro HatchQuest style.
 * Mount conditionally — renders a fixed overlay when mounted.
 */
export default function LoadingOverlay({ message = "LOADING..." }: LoadingOverlayProps) {
  return (
    <div
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background/90"
    >
      <div className="scanlines pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Retro spinner — 4 rotating blocks */}
        <div className="grid grid-cols-2 gap-1.5 animate-spin-slow">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-4 w-4 border-[2px] border-primary bg-accent"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <span className="font-display text-xs tracking-[0.3em] text-muted-foreground uppercase animate-pulse">
          {message}
        </span>
      </div>
    </div>
  );
}
