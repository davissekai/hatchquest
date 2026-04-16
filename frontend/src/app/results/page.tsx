"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { TopAppBar } from "@/components/TopAppBar";
import RadarChart from "@/components/RadarChart";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingOverlay from "@/components/LoadingOverlay";

const getVerdict = (score: number) => {
  if (score >= 85) return { text: "Visionary Founder", desc: "You balance ambition with wisdom. Accra's next big thing." };
  if (score >= 68) return { text: "Sharp Operator", desc: "Calculated, resourceful, consistent. You know how to play the game." };
  if (score >= 52) return { text: "Promising Entrepreneur", desc: "Strong instincts. A few more lessons and you'll be unstoppable." };
  return { text: "Emerging Hustler", desc: "You've got the spirit. Keep learning, keep building." };
};

const Results = () => {
  const router = useRouter();
  const { state, phase, hasActiveSession, resumeSession, loadResults, resetGame, isLoading, error } = useGame();
  const [copied, setCopied] = useState(false);
  const sessionId = state.sessionId;
  const results = state.results;
  const clientState = results?.clientState;

  useEffect(() => {
    if (phase === "idle" && !isLoading) {
      if (hasActiveSession()) {
        void resumeSession();
      } else {
        router.replace("/");
      }
    } else if (phase === "layer0") {
      router.replace("/layer0");
    } else if (phase === "active") {
      router.replace("/play");
    } else if (phase === "complete" && !results && sessionId && !isLoading) {
      void loadResults(sessionId);
    }
  }, [phase, isLoading, hasActiveSession, resumeSession, loadResults, results, sessionId, router]);

  const score = results?.eoProfile
    ? (Object.values(results.eoProfile).reduce((a, b) => a + b, 0) / 5) * 10
    : 0;
  const verdict = getVerdict(score);
  const capitalBarWidth = clientState ? Math.min(100, (clientState.capital / 50000) * 100) : 0;

  const handlePlayAgain = () => {
    resetGame();
    router.push("/");
  };

  const handleShare = () => {
    const text = `I scored ${score.toFixed(1)} on HatchQuest! I'm a "${verdict.text}". Can you beat me? 🇬🇭`;
    if (navigator.share) {
      void navigator.share({ title: "HatchQuest Results", text });
    } else {
      navigator.clipboard?.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="bg-cream text-navy min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 adinkra-pattern opacity-10 pointer-events-none z-0" />
      <TopAppBar />

      {isLoading && <LoadingOverlay message="Calculating your results..." />}

      {error && !isLoading && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-8 relative z-10">
          <ErrorBanner
            message={error}
            onRetry={() => sessionId ? void loadResults(sessionId) : undefined}
          />
          <button
            onClick={handlePlayAgain}
            className="px-10 py-5 bg-lime text-navy rounded-full font-headline font-black text-xl shadow-[0_10px_30px_rgba(57,255,20,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-white"
          >
            Return to Accra
          </button>
        </div>
      )}

      {!error && results && (
        <div className="pt-20 relative z-10">
          {/* ── Hero header — score + verdict ──────────────────── */}
          <div className="bg-navy relative overflow-hidden py-24 px-6 text-center rounded-b-[4rem] shadow-[0_20px_60px_rgba(30,58,138,0.3)] border-b-8 border-white">
            <div className="absolute inset-0 kente-pattern opacity-10" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-hot-pink rounded-full opacity-30 blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-lime rounded-full opacity-20 blur-[120px] translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 max-w-xl mx-auto space-y-6">
              <p className="font-headline text-sm font-black text-white/70 tracking-[0.3em] uppercase bg-white/10 px-6 py-2 rounded-full inline-block border border-white/20">
                Quest Complete
              </p>
              <div className="text-[10rem] md:text-[12rem] font-headline font-black text-lime leading-none drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] tracking-tighter italic">
                {score.toFixed(1)}
              </div>
              <p className="font-headline text-lg font-black text-white tracking-[0.2em] uppercase">
                Acumen Score
              </p>
              <div className="pt-6">
                <h2 className="font-headline text-5xl md:text-6xl font-black text-electric-cyan italic drop-shadow-md leading-tight">
                  {verdict.text}
                </h2>
                <p className="font-body text-2xl text-white/90 mt-6 italic max-w-md mx-auto font-medium leading-relaxed">
                  {verdict.desc}
                </p>
              </div>
            </div>
          </div>

          {/* ── Body — cards on bg-cream ──────────────────────────── */}
          <div className="max-w-2xl mx-auto px-6 py-16 space-y-10">

            {/* EO Radar chart */}
            <div className="bg-white rounded-[3.5rem] p-10 md:p-12 shadow-[0_20px_60px_rgba(30,58,138,0.1)] border-4 border-white">
              <h3 className="font-headline font-black text-xl text-navy uppercase tracking-[0.2em] mb-10 text-center">
                Your <span className="text-hot-pink italic">Founder DNA</span>
              </h3>
              {results.summary && (
                <p className="font-body text-xl text-navy/80 mb-12 leading-relaxed italic text-center whitespace-pre-line bg-cream p-8 rounded-[2.5rem] border-4 border-white shadow-inner font-medium">
                  &ldquo;{results.summary}&rdquo;
                </p>
              )}
              <div className="bg-cream/50 rounded-full p-6 border-4 border-white shadow-sm">
                <RadarChart
                  maxValue={10}
                  dimensions={
                    results.eoProfile ?? {
                      autonomy: 0,
                      innovativeness: 0,
                      proactiveness: 0,
                      riskTaking: 0,
                      competitiveAggressiveness: 0,
                    }
                  }
                />
              </div>
            </div>

            {/* Final Resources */}
            <div className="bg-white rounded-[3.5rem] p-10 md:p-12 shadow-[0_20px_60px_rgba(30,58,138,0.1)] border-4 border-white">
              <h3 className="font-headline font-black text-xl text-navy uppercase tracking-[0.2em] mb-10 text-center">
                Empire <span className="text-electric-cyan italic">Assets</span>
              </h3>
              <div className="space-y-8">
                {/* Capital */}
                <div className="bg-cream p-6 rounded-[2.5rem] border-4 border-white shadow-sm">
                  <div className="flex justify-between items-end mb-4 px-2">
                    <span className="font-headline font-black text-navy/40 text-xs uppercase tracking-widest">Capital</span>
                    <span className="font-headline font-black text-3xl text-lime drop-shadow-sm">
                      GHS {(clientState?.capital ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="h-6 w-full rounded-full bg-white border-2 border-cream overflow-hidden shadow-inner p-1.5">
                    <div
                      className="h-full bg-lime rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(57,255,20,0.4)]"
                      style={{ width: `${capitalBarWidth}%` }}
                    />
                  </div>
                </div>

                {/* Reputation */}
                <div className="bg-cream p-6 rounded-[2.5rem] border-4 border-white shadow-sm">
                  <div className="flex justify-between items-end mb-4 px-2">
                    <span className="font-headline font-black text-navy/40 text-xs uppercase tracking-widest">Reputation</span>
                    <span className="font-headline font-black text-3xl text-hot-pink drop-shadow-sm">
                      {clientState?.reputation ?? 0}
                    </span>
                  </div>
                  <div className="h-6 w-full rounded-full bg-white border-2 border-cream overflow-hidden shadow-inner p-1.5">
                    <div
                      className="h-full bg-hot-pink rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,42,133,0.4)]"
                      style={{ width: `${Math.min(100, ((clientState?.reputation ?? 0) / 80) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Network */}
                <div className="bg-cream p-6 rounded-[2.5rem] border-4 border-white shadow-sm">
                  <div className="flex justify-between items-end mb-4 px-2">
                    <span className="font-headline font-black text-navy/40 text-xs uppercase tracking-widest">Network</span>
                    <span className="font-headline font-black text-3xl text-electric-cyan drop-shadow-sm">
                      {clientState?.networkStrength ?? 0}
                    </span>
                  </div>
                  <div className="h-6 w-full rounded-full bg-white border-2 border-cream overflow-hidden shadow-inner p-1.5">
                    <div
                      className="h-full bg-electric-cyan rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                      style={{ width: `${Math.min(100, ((clientState?.networkStrength ?? 0) / 80) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-6 pb-20">
              <button
                onClick={handlePlayAgain}
                className="w-full py-7 bg-lime text-navy rounded-full font-headline font-black text-2xl shadow-[0_15px_45px_rgba(57,255,20,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-white"
              >
                Play Again
              </button>
              <button
                onClick={handleShare}
                className="w-full py-5 bg-white text-navy/60 rounded-full font-headline font-black text-lg hover:text-navy transition-all border-4 border-transparent hover:border-white shadow-sm uppercase tracking-[0.2em]"
              >
                {copied ? "Copied to clipboard!" : "Share Legacy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
