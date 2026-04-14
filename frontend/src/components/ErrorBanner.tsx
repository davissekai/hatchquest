"use client";

interface ErrorBannerProps {
  /** Error message to display. Renders nothing when null. */
  message: string | null;
  /** Optional callback — shows a Retry button when provided. */
  onRetry?: () => void;
}

/**
 * Stitch-style error banner using tertiary (terracotta) color.
 * Renders null when message is null — safe to unconditionally mount.
 */
export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="w-full rounded-xl bg-error-container/10 border border-error/20 px-5 py-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-error text-xl">error</span>
          <p className="font-body text-sm text-on-error-container leading-snug">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 px-4 py-2 rounded-full bg-error text-on-error font-label text-xs font-bold hover:bg-error-dim transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
