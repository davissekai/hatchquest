"use client";

import { useOffline } from "@/hooks/useOffline";

/**
 * Renders a sticky banner at the top of the screen when the browser is offline.
 * Refined for the "Vibrant Rounded Graffiti" aesthetic.
 */
export default function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[100] bg-navy border-b-4 border-white px-6 py-3 text-center shadow-lg"
    >
      <span className="font-headline font-black text-xs tracking-[0.3em] text-hot-pink uppercase flex items-center justify-center gap-3 drop-shadow-sm">
        <span className="material-symbols-outlined text-sm animate-pulse">cloud_off</span>
        YOU ARE OFFLINE — Progress may not be saved
      </span>
    </div>
  );
}
