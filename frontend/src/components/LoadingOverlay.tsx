"use client";

interface LoadingOverlayProps {
  /** Message shown below the spinner. */
  message?: string;
}

/**
 * Full-screen loading overlay.
 * Refined for the "Vibrant Rounded Graffiti" aesthetic with high-contrast navy backdrop.
 */
export default function LoadingOverlay({ message = "Loading..." }: LoadingOverlayProps) {
  return (
    <div
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-navy/90 backdrop-blur-md"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Vibrant spinner */}
        <div
          className="w-16 h-16 rounded-full border-4 border-white/20 border-t-lime animate-spin shadow-[0_0_20px_rgba(57,255,20,0.3)]"
        />
        <p className="font-headline text-lg font-bold text-white tracking-widest uppercase italic drop-shadow-sm">
          {message}
        </p>
      </div>
    </div>
  );
}
