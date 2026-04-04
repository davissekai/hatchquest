"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import RetroTransition from "@/components/RetroTransition";

const LoadingPage = () => {
  const router = useRouter();

  const handleComplete = useCallback(() => {
    router.push("/play");
  }, [router]);

  return (
    <RetroTransition
      messages={[
        "INITIALIZING YOUR EMPIRE...",
        "SCANNING ACCRA MARKETS...",
        "LOADING OPPORTUNITIES...",
        "PREPARING YOUR JOURNEY...",
      ]}
      duration={2500}
      onComplete={handleComplete}
    />
  );
};

export default LoadingPage;
