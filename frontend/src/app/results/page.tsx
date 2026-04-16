"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { TopAppBar } from "@/components/stitch/TopAppBar";
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
    <div className="bg-background text-on-surface min-h-screen">
      <TopAppBar />

      {isLoading && <LoadingOverlay message="Calculating your results..." />}

      {error && !isLoading && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-6">
          <ErrorBanner
            message={error}
            onRetry={() => sessionId ? void loadResults(sessionId) : undefined}
          />
          <button
            onClick={handlePlayAgain}
            className="px-8 py-4 bg-surface-container-low text-on-surface rounded-xl font-headline font-bold hover:bg-surface-container transition-colors"
          >
            Play Again
          </button>
        </div>
      )}

      {!error && results && (
        <div className="pt-20">
          {/* ── Hero header — score + verdict ──────────────────── */}
          <div className="bg-navy relative overflow-hidden py-24 px-6 text-center rounded-b-[4rem] shadow-[0_20px_60px_rgba(30,58,138,0.3)]">
            <div className="absolute inset-0 adinkra-pattern opacity-10" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-hot-pink rounded-full opacity-30 blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-lime rounded-full opacity-20 blur-[100px] translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 max-w-xl mx-auto space-y-6">
              <p className="font-label text-sm font-bold text-white/70 tracking-widest uppercase bg-white/10 px-4 py-2 rounded-full inline-block">
                Your Results
              </p>
              <div className="text-8xl md:text-9xl font-headline font-extrabold text-lime leading-none drop-shadow-md">
                {score.toFixed(1)}
              </div>
              <p className="font-label text-sm font-bold text-white/70 tracking-widest uppercase">
                Acumen Score
              </p>
              <div className="pt-4">
                <h2 className="font-headline text-4xl font-extrabold text-electric-cyan italic drop-shadow-sm">
                  {verdict.text}
                </h2>
                <p className="font-body text-xl text-white/90 mt-4 italic max-w-md mx-auto">
                  {verdict.desc}
                </p>
              </div>
            </div>
          </div>

          {/* ── Body — cards on bg-background ──────────────────────────── */}
          <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">

            {/* EO Radar chart */}
            <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-[0_15px_40px_rgba(30,58,138,0.1)] border-4 border-cream">
              <h3 className="font-headline font-bold text-xl text-navy uppercase tracking-widest mb-6 text-center">
                Entrepreneurial Profile
              </h3>
              {results.summary && (
                <p className="font-body text-lg text-navy/80 mb-8 leading-relaxed italic text-center whitespace-pre-line bg-cream p-6 rounded-3xl border border-surface-container">
                  &ldquo;{results.summary}&rdquo;
                </p>
              )}
              <div className="bg-cream/50 rounded-full p-4 border-2 border-white">
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
            <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-[0_15px_40px_rgba(30,58,138,0.1)] border-4 border-cream">
              <h3 className="font-headline font-bold text-xl text-navy uppercase tracking-widest mb-8 text-center">
                Final Resources
              </h3>
              <div className="space-y-6">
                {/* Capital */}
                <div className="bg-cream p-5 rounded-[2rem] border-2 border-white shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-label font-bold text-navy/70 text-sm uppercase tracking-wider">Capital</span>
                    <span className="font-headline font-extrabold text-2xl text-lime drop-shadow-sm">
                      GHS {(clientState?.capital ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="h-5 w-full rounded-full bg-white border border-surface-container overflow-hidden shadow-inner p-1">
                    <div
                      className="h-full bg-lime rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: `${capitalBarWidth}%` }}
                    />
                  </div>
                </div>

                {/* Reputation */}
                <div className="bg-cream p-5 rounded-[2rem] border-2 border-white shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-label font-bold text-navy/70 text-sm uppercase tracking-wider">Reputation</span>
                    <span className="font-headline font-extrabold text-2xl text-hot-pink drop-shadow-sm">
                      {clientState?.reputation ?? 0}
                    </span>
                  </div>
                  <div className="h-5 w-full rounded-full bg-white border border-surface-container overflow-hidden shadow-inner p-1">
                    <div
                      className="h-full bg-hot-pink rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: `${Math.min(100, ((clientState?.reputation ?? 0) / 80) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Network */}
                <div className="bg-cream p-5 rounded-[2rem] border-2 border-white shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-label font-bold text-navy/70 text-sm uppercase tracking-wider">Network</span>
                    <span className="font-headline font-extrabold text-2xl text-electric-cyan drop-shadow-sm">
                      {clientState?.networkStrength ?? 0}
                    </span>
                  </div>
                  <div className="h-5 w-full rounded-full bg-white border border-surface-container overflow-hidden shadow-inner p-1">
                    <div
                      className="h-full bg-electric-cyan rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: `${Math.min(100, ((clientState?.networkStrength ?? 0) / 80) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 pb-12">
              <button
                onClick={handlePlayAgain}
                className="w-full py-6 bg-lime text-navy rounded-full font-headline font-extrabold text-xl shadow-[0_10px_30px_rgba(57,255,20,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-white"
              >
                Play Again
              </button>
              <button
                onClick={handleShare}
                className="w-full py-5 bg-white text-navy/70 rounded-full font-headline font-bold text-lg hover:bg-cream transition-colors border-4 border-transparent hover:border-white shadow-sm"
              >
                {copied ? "Copied to clipboard!" : "Share Results"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
