"use client";

interface ErrorBannerProps {
  /** Error message to display. Renders nothing when null. */
  message: string | null;
  /** Optional callback — shows a Retry button when provided. */
  onRetry?: () => void;
}

/**
 * Error banner refined for the "Vibrant Rounded Graffiti" aesthetic.
 * Uses high-contrast hot-pink and navy with tactile rounded shapes.
 */
export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="w-full rounded-full bg-hot-pink/10 border-4 border-hot-pink/20 px-6 py-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-hot-pink flex items-center justify-center text-white flex-shrink-0 shadow-md">
            <span className="material-symbols-outlined text-xl">error</span>
          </div>
          <p className="font-headline font-bold text-sm text-navy leading-snug">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 px-6 py-2.5 rounded-full bg-navy text-white font-headline text-xs font-black uppercase tracking-widest hover:bg-hot-pink transition-all border-2 border-transparent hover:border-white shadow-sm"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
