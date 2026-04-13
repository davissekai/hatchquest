"use client";

import { useState, useEffect } from "react";

/**
 * Returns true when the browser is offline.
 * Subscribes to window online/offline events and updates reactively.
 * Returns false during SSR — the server is never "offline" in the browser sense.
 */
export function useOffline(): boolean {
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !navigator.onLine;
  });

  useEffect(() => {
    const handleOffline = (): void => setIsOffline(true);
    const handleOnline = (): void => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return isOffline;
}
