"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import RetroTransition from "@/components/RetroTransition";

/** Post-auth loading screen — shown after account creation, before Layer 0. */
const LoadingPage = () => {
  const router = useRouter();

  const handleComplete = useCallback(() => {
    router.push("/layer0");
  }, [router]);

  return (
    <RetroTransition
      messages={[
        "Initializing your empire...",
        "Scanning Accra markets...",
        "Loading your opportunities...",
        "Preparing your journey...",
      ]}
      duration={2500}
      onComplete={handleComplete}
    />
  );
};

export default LoadingPage;
