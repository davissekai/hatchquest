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
          {/* ── Hero gradient header — score + verdict ──────────────────── */}
          <div className="hero-gradient relative overflow-hidden py-20 px-6 text-center">
            <div className="absolute inset-0 kente-pattern opacity-10" />
            <div className="relative z-10 max-w-xl mx-auto space-y-4">
              <p className="font-label text-sm font-bold text-on-primary/70 tracking-widest uppercase">
                Your Results
              </p>
              <div className="text-8xl font-headline font-extrabold text-secondary-fixed leading-none">
                {score.toFixed(1)}
              </div>
              <p className="font-label text-sm font-bold text-on-primary/70 tracking-widest uppercase">
                Acumen Score
              </p>
              <div className="pt-4">
                <h2 className="font-headline text-3xl font-extrabold text-on-primary italic">
                  {verdict.text}
                </h2>
                <p className="font-body text-lg text-on-primary/80 mt-2 italic">
                  {verdict.desc}
                </p>
              </div>
            </div>
          </div>

          {/* ── Body — cards on bg-background ──────────────────────────── */}
          <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">

            {/* EO Radar chart */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_40px_rgba(21,5,120,0.06)]">
              <h3 className="font-headline font-bold text-lg text-primary uppercase tracking-widest mb-4 text-center">
                Entrepreneurial Profile
              </h3>
              {results.summary && (
                <p className="font-body text-base text-on-surface-variant mb-6 leading-relaxed italic text-center whitespace-pre-line">
                  &ldquo;{results.summary}&rdquo;
                </p>
              )}
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

            {/* Final Resources */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_40px_rgba(21,5,120,0.06)]">
              <h3 className="font-headline font-bold text-lg text-primary uppercase tracking-widest mb-4">
                Final Resources
              </h3>
              <div className="space-y-4">
                {/* Capital */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-label font-semibold text-on-surface-variant text-sm">Capital</span>
                    <span className="font-headline font-bold text-xl text-secondary">
                      GHS {(clientState?.capital ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${capitalBarWidth}%` }}
                    />
                  </div>
                </div>

                {/* Reputation */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-label font-semibold text-on-surface-variant text-sm">Reputation</span>
                    <span className="font-headline font-bold text-xl text-secondary">
                      {clientState?.reputation ?? 0}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full bg-tertiary-container rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, ((clientState?.reputation ?? 0) / 80) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Network */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-label font-semibold text-on-surface-variant text-sm">Network</span>
                    <span className="font-headline font-bold text-xl text-secondary">
                      {clientState?.networkStrength ?? 0}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full bg-secondary-container rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, ((clientState?.networkStrength ?? 0) / 80) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pb-8">
              <button
                onClick={handlePlayAgain}
                className="w-full py-5 bg-primary text-on-primary rounded-xl font-headline font-extrabold text-lg shadow-[0_8px_30px_rgba(82,79,178,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
              >
                Play Again
              </button>
              <button
                onClick={handleShare}
                className="w-full py-4 bg-surface-container-low text-on-surface-variant rounded-xl font-headline font-bold text-base hover:bg-surface-container transition-colors"
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
