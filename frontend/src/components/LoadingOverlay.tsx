"use client";

interface LoadingOverlayProps {
  /** Message shown below the spinner. */
  message?: string;
}

/**
 * Full-screen loading overlay in Stitch design language.
 * Uses glassmorphism on the bg-background base with a primary spinner.
 */
export default function LoadingOverlay({ message = "Loading..." }: LoadingOverlayProps) {
  return (
    <div
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Circular spinner using primary color */}
        <div
          className="w-12 h-12 rounded-full border-4 border-primary-container border-t-primary animate-spin"
        />
        <p className="font-label text-sm font-semibold text-on-surface-variant tracking-wide">
          {message}
        </p>
      </div>
    </div>
  );
}
