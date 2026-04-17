"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { TopAppBar } from "@/components/TopAppBar";
import RadarChart from "@/components/RadarChart";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingOverlay from "@/components/LoadingOverlay";
import { archiveSession, loadArchive } from "@/lib/session-archive";
import { Starburst, Sparkle } from "@/components/Decorations";
import type { ArchivedSession } from "@/lib/session-archive";

const getVerdict = (score: number) => {
  if (score >= 85) return { text: "Visionary Founder", desc: "You balance ambition with wisdom. Accra's next big thing." };
  if (score >= 68) return { text: "Sharp Operator", desc: "Calculated, resourceful, consistent. You know how to play the game." };
  if (score >= 52) return { text: "Promising Entrepreneur", desc: "Strong instincts. A few more lessons and you'll be unstoppable." };
  return { text: "Emerging Hustler", desc: "You've got the spirit. Keep learning, keep building." };
};

export default function Results() {
  const router = useRouter();
  const { state, phase, hasActiveSession, resumeSession, loadResults, resetGame, isLoading, error } = useGame();
  const [copied, setCopied] = useState(false);
  const [archivedSessions, setArchivedSessions] = useState<ArchivedSession[]>([]);
  const [showCompare, setShowCompare] = useState(false);
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

  useEffect(() => {
    if (!results?.eoProfile || !results.clientState || !sessionId) return;
    archiveSession(sessionId, results.eoProfile, results.clientState);
    const id = setTimeout(() => setArchivedSessions(loadArchive()), 0);
    return () => clearTimeout(id);
  }, [results, sessionId]);

  const score = results?.eoProfile
    ? (Object.values(results.eoProfile).reduce((a, b) => a + b, 0) / 5) * 10
    : 0;
  const verdict = getVerdict(score);
  
  const capitalBarWidth = clientState ? Math.max(0, Math.min(100, (clientState.capital / 50000) * 100)) : 0;
  const capitalAmount = clientState?.capital ?? 0;
  const capitalTextClass =
    capitalAmount < 0
      ? "text-pill-red"
      : capitalAmount < 10_000
        ? "text-[#FFC107]"
        : "text-lime";
  const capitalFillClass =
    capitalAmount < 0
      ? "bg-pill-red"
      : capitalAmount < 10_000
        ? "bg-[#FFC107]"
        : "bg-lime";

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
    <div className="bg-[#F5F2EB] text-slate-900 min-h-screen relative overflow-hidden selection:bg-hot-pink selection:text-white">
      <TopAppBar />

      {/* Decorative Background Elements */}
      <Starburst className="w-64 h-64 -top-20 -left-20 rotate-45 opacity-50" fill="var(--color-pill-blue)" />
      <Starburst className="w-48 h-48 bottom-[10%] -right-10 -rotate-12" fill="var(--color-pill-red)" />
      <Sparkle className="w-20 h-20 top-[20%] right-[10%]" fill="var(--color-grass-green)" />
      <Sparkle className="w-16 h-16 bottom-[15%] left-[10%]" fill="#FFC107" />

      {isLoading && <LoadingOverlay message="Calculating your results..." />}

      {error && !isLoading && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-8 relative z-10">
          <ErrorBanner
            message={error}
            onRetry={() => sessionId ? void loadResults(sessionId) : undefined}
          />
          <button
            onClick={handlePlayAgain}
            className="px-12 py-6 bg-lime text-slate-900 rounded-full font-headline font-black text-2xl uppercase tracking-widest shadow-[8px_8px_0px_#0f172a] border-[6px] border-slate-900 hover:-translate-y-1 hover:shadow-[12px_12px_0px_#0f172a] active:translate-y-1 active:shadow-[2px_2px_0px_#0f172a] transition-all"
          >
            Return to Accra
          </button>
        </div>
      )}

      {!error && results && (
        <div className="pt-20 pb-32 relative z-10">
          {/* ── Hero header ── */}
          <div className="bg-white relative overflow-hidden py-24 px-6 text-center shadow-[0_20px_0px_#0f172a] border-b-[8px] border-slate-900 z-20">
            <Starburst className="w-96 h-96 -top-32 -left-32 rotate-[-15deg] opacity-20 pointer-events-none" fill="var(--color-hot-pink)" />
            <Starburst className="w-80 h-80 bottom-[-100px] -right-20 rotate-[15deg] opacity-20 pointer-events-none" fill="var(--color-pill-blue)" />
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <div className="inline-block px-8 py-3 bg-[#FFC107] border-[4px] border-slate-900 rounded-full font-headline font-black text-sm uppercase tracking-widest shadow-[6px_6px_0px_#0f172a] rotate-[-2deg]">
                Quest Complete
              </div>
              <div className="text-[10rem] md:text-[14rem] font-headline font-black text-slate-900 leading-none tracking-tighter shadow-none drop-shadow-[12px_12px_0px_var(--color-lime)]">
                {score.toFixed(1)}
              </div>
              <p className="font-headline text-2xl font-black text-slate-900 tracking-widest uppercase">
                Acumen Score
              </p>
              <div className="pt-8">
                <h2 className="font-headline text-5xl md:text-7xl font-black text-pill-red uppercase tracking-tighter leading-tight drop-shadow-[4px_4px_0px_#0f172a]">
                  {verdict.text}
                </h2>
                <p className="font-body text-xl text-slate-700 mt-6 max-w-lg mx-auto font-bold leading-relaxed border-t-[4px] border-slate-900 pt-6">
                  {verdict.desc}
                </p>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="max-w-4xl mx-auto px-6 pt-24 space-y-16">

            {/* EO Radar chart */}
            <div className="bg-white rounded-[2rem] p-10 md:p-16 shadow-[16px_16px_0px_#0f172a] border-[8px] border-slate-900 relative">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-pill-blue border-[4px] border-slate-900 rounded-full shadow-[4px_4px_0px_#0f172a]" />
              <h3 className="font-headline font-black text-3xl text-slate-900 uppercase tracking-tighter mb-10 text-center border-b-8 border-slate-900 pb-4">
                Founder DNA
              </h3>
              {results.summary && (
                <div className="bg-[#F5F2EB] p-8 rounded-[1.5rem] border-[4px] border-slate-900 shadow-[6px_6px_0px_#0f172a] mb-12">
                  <p className="font-body text-xl text-slate-800 leading-relaxed font-bold">
                    &ldquo;{results.summary}&rdquo;
                  </p>
                </div>
              )}
              <div className="flex justify-center">
                <RadarChart
                  maxValue={10}
                  dimensions={
                    results.eoProfile ?? {
                      autonomy: 0,
                      innovativeness: 0,
                      riskTaking: 0,
                      proactiveness: 0,
                      competitiveAggressiveness: 0,
                    }
                  }
                />
              </div>
            </div>

            {/* Compare toggle */}
            {archivedSessions.length >= 2 && (
              <div className="text-center">
                <button
                  onClick={() => setShowCompare(!showCompare)}
                  className="px-8 py-4 bg-pill-blue text-white rounded-full font-headline font-black uppercase tracking-widest border-[4px] border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#0f172a] active:translate-y-1 active:shadow-[2px_2px_0px_#0f172a] transition-all"
                >
                  {showCompare ? "Hide Compare" : "Compare Last Run"}
                </button>
              </div>
            )}

            {showCompare && archivedSessions.length >= 2 && (() => {
              const current = archivedSessions[0];
              const previous = archivedSessions[1];
              if (!current || !previous) return null;

              const dims = ["autonomy", "innovativeness", "riskTaking", "proactiveness", "competitiveAggressiveness"] as const;

              return (
                <div className="bg-white rounded-[2rem] p-10 md:p-16 shadow-[16px_16px_0px_#0f172a] border-[8px] border-slate-900 space-y-10">
                  <h3 className="font-headline font-black text-3xl text-slate-900 uppercase tracking-tighter text-center border-b-8 border-slate-900 pb-4">
                    Run Comparison
                  </h3>

                  {/* EO dimension diff */}
                  <div className="space-y-6">
                    {dims.map((dim) => {
                      const curr = current.eoProfile[dim];
                      const prev = previous.eoProfile[dim];
                      const diff = curr - prev;
                      return (
                        <div key={dim} className="flex flex-col md:flex-row md:items-center gap-4">
                          <span className="font-headline font-black text-sm uppercase tracking-widest text-slate-900 md:w-48 shrink-0">
                            {dim.replace(/([A-Z])/g, " $1").toLowerCase()}
                          </span>
                          <div className="flex-1 flex flex-col gap-2 relative">
                            {/* Previous Run */}
                            <div className="h-4 bg-slate-300 border-[3px] border-slate-900 rounded-full" style={{ width: `${(prev / 10) * 100}%` }} />
                            {/* Current Run */}
                            <div className="h-4 bg-pill-blue border-[3px] border-slate-900 rounded-full shadow-[2px_2px_0px_#0f172a]" style={{ width: `${(curr / 10) * 100}%` }} />
                          </div>
                          <span className={`font-headline font-black text-xl w-16 text-right md:text-left ${diff > 0 ? "text-lime" : diff < 0 ? "text-pill-red" : "text-slate-400"}`}>
                            {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-8 justify-center text-xs font-headline font-black uppercase tracking-widest text-slate-500">
                    <span className="flex items-center gap-3"><span className="w-6 h-3 bg-pill-blue border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-full inline-block" /> This run</span>
                    <span className="flex items-center gap-3"><span className="w-6 h-3 bg-slate-300 border-2 border-slate-900 rounded-full inline-block" /> Last run</span>
                  </div>
                </div>
              );
            })()}

            {/* Final Resources */}
            <div className="bg-white rounded-[2rem] p-10 md:p-16 shadow-[16px_16px_0px_#0f172a] border-[8px] border-slate-900">
              <h3 className="font-headline font-black text-3xl text-slate-900 uppercase tracking-tighter mb-10 text-center border-b-8 border-slate-900 pb-4">
                Empire Assets
              </h3>
              <div className="space-y-6">
                {/* Capital */}
                <div className="bg-[#F5F2EB] p-8 rounded-[1.5rem] border-[6px] border-slate-900 shadow-[8px_8px_0px_#0f172a]">
                  <div className="flex justify-between items-end mb-6">
                    <span className="font-headline font-black text-slate-500 text-sm uppercase tracking-widest">Capital</span>
                    <span className={`font-headline font-black text-4xl uppercase tracking-tighter ${capitalTextClass}`}>
                      GHS {capitalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-8 w-full rounded-full bg-white border-[4px] border-slate-900 overflow-hidden shadow-inner p-1">
                    <div
                      className={`h-full rounded-full border-r-[4px] border-slate-900 ${capitalFillClass}`}
                      style={{ width: `${capitalBarWidth}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Reputation */}
                  <div className="bg-[#F5F2EB] p-8 rounded-[1.5rem] border-[6px] border-slate-900 shadow-[8px_8px_0px_#0f172a]">
                    <div className="flex justify-between items-end mb-6">
                      <span className="font-headline font-black text-slate-500 text-sm uppercase tracking-widest">Rep</span>
                      <span className="font-headline font-black text-4xl text-hot-pink uppercase tracking-tighter">
                        {clientState?.reputation ?? 0}
                      </span>
                    </div>
                    <div className="h-8 w-full rounded-full bg-white border-[4px] border-slate-900 overflow-hidden shadow-inner p-1">
                      <div
                        className="h-full bg-hot-pink border-r-[4px] border-slate-900 rounded-full"
                        style={{ width: `${Math.min(100, ((clientState?.reputation ?? 0) / 80) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Network */}
                  <div className="bg-[#F5F2EB] p-8 rounded-[1.5rem] border-[6px] border-slate-900 shadow-[8px_8px_0px_#0f172a]">
                    <div className="flex justify-between items-end mb-6">
                      <span className="font-headline font-black text-slate-500 text-sm uppercase tracking-widest">Network</span>
                      <span className="font-headline font-black text-4xl text-pill-blue uppercase tracking-tighter">
                        {clientState?.networkStrength ?? 0}
                      </span>
                    </div>
                    <div className="h-8 w-full rounded-full bg-white border-[4px] border-slate-900 overflow-hidden shadow-inner p-1">
                      <div
                        className="h-full bg-pill-blue border-r-[4px] border-slate-900 rounded-full"
                        style={{ width: `${Math.min(100, ((clientState?.networkStrength ?? 0) / 80) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-6 pt-8 pb-10">
              <button
                onClick={handlePlayAgain}
                className="flex-1 py-6 bg-lime text-slate-900 rounded-full font-headline font-black text-2xl uppercase tracking-widest shadow-[8px_8px_0px_#0f172a] border-[6px] border-slate-900 hover:-translate-y-1 hover:shadow-[12px_12px_0px_#0f172a] active:translate-y-1 active:shadow-[2px_2px_0px_#0f172a] transition-all"
              >
                Play Again
              </button>
              <button
                onClick={handleShare}
                className="md:w-64 py-6 bg-white text-slate-900 rounded-full font-headline font-black text-lg uppercase tracking-widest border-[6px] border-slate-900 shadow-[8px_8px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[12px_12px_0px_#0f172a] active:translate-y-1 active:shadow-[2px_2px_0px_#0f172a] transition-all"
              >
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
