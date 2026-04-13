"use client";

import { useOffline } from "@/hooks/useOffline";

/**
 * Renders a sticky banner at the top of the screen when the browser is offline.
 * Mount once in the root layout — renders nothing when online.
 */
export default function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 border-b-[3px] border-destructive bg-destructive/10 px-4 py-2 text-center"
    >
      <span className="font-display text-xs tracking-[0.25em] text-destructive uppercase">
        YOU ARE OFFLINE — Progress may not be saved
      </span>
    </div>
  );
}
