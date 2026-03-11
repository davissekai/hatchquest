"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSessionResults } from "../../lib/game-api";
import { ResultsResponse } from "../../types/game";
import Link from "next/link";

function ResultsScreen() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided.");
      setIsLoading(false);
      return;
    }

    const loadResults = async () => {
      try {
        const res = await getSessionResults("mock-token", sessionId);
        setResults(res);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load results");
      } finally {
        setIsLoading(false);
      }
    };

    void loadResults();
  }, [sessionId]);

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      maximumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-light">
        <div className="animate-pulse flex items-center space-x-2 bg-tealAccent/20 px-6 py-2 rounded-full border border-tealAccent/30 backdrop-blur-sm z-30">
          <div className="w-2 h-2 bg-tealAccent rounded-full"></div>
          <span className="text-tealAccent font-bold text-xs sm:text-sm tracking-widest uppercase">Loading Results...</span>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary text-light">
        <div className="text-red-400 bg-red-400/10 px-6 py-4 rounded-xl border border-red-400/20 max-w-md w-full text-center">
          {error || "Failed to load results"}
        </div>
      </div>
    );
  }

  const { state } = results;

  return (
    <div className="min-h-screen bg-primary text-light flex flex-col items-center justify-center p-6 selection:bg-accent selection:text-primary relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-30">
        <div className="absolute top-[20%] left-[20%] w-[50%] h-[50%] bg-accent blur-[150px] rounded-full mix-blend-screen opacity-50"></div>
      </div>

      <div className="bg-light text-primary w-full max-w-2xl rounded-[2rem] shadow-2xl p-8 sm:p-12 border-t-8 border-accent z-10 text-center animate-in zoom-in duration-500">
        <h1 className="text-4xl sm:text-5xl font-black mb-2 text-primary tracking-tight">Game Complete</h1>
        <p className="text-xl text-mutedBlue font-semibold mb-8">
          Your Startup Journey has concluded.
        </p>

        <div className="bg-primary/5 rounded-2xl p-6 mb-8 text-left space-y-4 border border-mutedBlue/20">
          <div className="flex justify-between items-center border-b border-mutedBlue/20 pb-4">
            <span className="text-primary/70 font-bold uppercase tracking-wider text-sm">Final Capital</span>
            <span className="text-tealAccent font-black text-lg">{formatMoney(state.resources.v_capital)}</span>
          </div>
          <div className="flex justify-between items-center border-b border-mutedBlue/20 pb-4">
            <span className="text-primary/70 font-bold uppercase tracking-wider text-sm">Reputation Score</span>
            <span className="text-primary font-black text-lg">{state.resources.reputation}</span>
          </div>
          <div className="flex justify-between items-center border-b border-mutedBlue/20 pb-4">
            <span className="text-primary/70 font-bold uppercase tracking-wider text-sm">Network Level</span>
            <span className="text-primary font-black text-lg">{state.resources.network}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-primary/70 font-bold uppercase tracking-wider text-sm">Momentum</span>
            <span className="text-accent font-black text-lg">{state.resources.momentumMultiplier}x</span>
          </div>
        </div>

        <Link 
          href="/game"
          className="inline-block w-full sm:w-auto bg-accent text-primary font-extrabold text-xl py-4 px-12 rounded-full shadow-[0_4px_20px_0_rgba(247,184,1,0.4)] hover:shadow-[0_8px_30px_rgba(247,184,1,0.3)] hover:bg-[#ffb600] transition-all transform hover:-translate-y-1"
        >
          Play Again
        </Link>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-light">
        <div className="animate-pulse flex items-center space-x-2 bg-tealAccent/20 px-6 py-2 rounded-full border border-tealAccent/30 backdrop-blur-sm z-30">
          <div className="w-2 h-2 bg-tealAccent rounded-full"></div>
          <span className="text-tealAccent font-bold text-xs sm:text-sm tracking-widest uppercase">Loading Results Boundary...</span>
        </div>
      </div>
    }>
      <ResultsScreen />
    </Suspense>
  );
}
