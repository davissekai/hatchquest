"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import RetroTransition from "@/components/RetroTransition";

/** Post-Layer 0 loading screen — shown while the classifier routes the player to Layer 1. */
const Layer0LoadingPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Guard: if no session in localStorage the player navigated here directly.
    const sessionId = localStorage.getItem("hq-session-id");
    if (!sessionId) {
      router.replace("/create");
    }
  }, [router]);

  const handleComplete = useCallback(() => {
    router.push("/play");
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
