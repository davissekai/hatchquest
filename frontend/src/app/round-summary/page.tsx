"use client";

// v2: round-summary is a v1 concept — layers replaced rounds.
// This page is not in the v2 navigation path. Redirect to play as a safe fallback.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const RoundSummary = () => {
  const router = useRouter();
  useEffect(() => { router.replace("/play"); }, [router]);
  return null;
};

export default RoundSummary;
