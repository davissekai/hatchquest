"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import RetroTransition from "@/components/RetroTransition";
import { useGame } from "@/context/GameContext";

/** Post-Layer 0 loading screen — shown while the classifier routes the player to Layer 1. */
const Layer0LoadingPage = () => {
  const router = useRouter();
  const { hasActiveSession, resumeSession } = useGame();

  useEffect(() => {
    // Guard: if no session in localStorage the player navigated here directly.
    if (!hasActiveSession()) {
      router.replace("/create");
    } else {
      // Hydrate state so when we reach /play, it has the Layer 1 node ready.
      void resumeSession();
    }
  }, [hasActiveSession, resumeSession, router]);

  const handleComplete = useCallback(() => {
    router.replace("/play");
  }, [router]);

  return (
    <RetroTransition
      messages={[
        "Reading your instincts...",
        "Mapping your entrepreneurial orientation...",
        "Charting your path through Accra...",
        "The district is ready for you...",
      ]}
      duration={2800}
      onComplete={handleComplete}
    />
  );
};

export default Layer0LoadingPage;
