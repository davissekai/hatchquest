"use client";

interface ErrorBannerProps {
  /** Error message to display. Renders nothing when null. */
  message: string | null;
  /** Optional callback — shows a Retry button when provided. */
  onRetry?: () => void;
}

/**
 * Displays a retro-styled error banner.
 * Renders null when message is null — safe to unconditionally mount.
 */
export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="w-full border-[3px] border-destructive bg-card px-4 py-3 shadow-brutal-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-body text-sm text-destructive leading-snug">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 border-[2px] border-destructive px-3 py-1 font-display text-xs tracking-wider text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            RETRY
          </button>
        )}
      </div>
    </div>
  );
}
