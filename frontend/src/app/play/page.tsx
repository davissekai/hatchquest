"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { HUD } from "@/components/HUD";
import RetroTransition from "@/components/RetroTransition";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingOverlay from "@/components/LoadingOverlay";
import { WorldHUD } from "@/components/WorldHUD";
import type { ClientWorldState } from "@hatchquest/shared";

const transitionMessages = [
  "Processing your decision...",
  "Updating the market...",
  "Rivals are watching...",
  "Deal in progress...",
  "Shifting alliances...",
];

const finalMessages = [
  "Calculating your acumen...",
  "Tallying your results...",
  "Measuring your empire...",
  "Final verdict incoming...",
];

/** Core game loop — High-Contrast Minimalist (Swiss-Graffiti) aesthetic */
const Gameplay = () => {
  const router = useRouter();
  const { state, phase, hasActiveSession, makeChoice, isLoading, error, resetGame, resumeSession } = useGame();
  const currentNode = state.currentNode;
  const clientState = state.clientState;

  const layer = clientState?.layer ?? 0;
  const turns = clientState?.turnsElapsed ?? 0;

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFinalTransition, setIsFinalTransition] = useState(false);
  const [choiceDisabled, setChoiceDisabled] = useState(false);
  const [freeText, setFreeText] = useState("");

  useEffect(() => {
    if (isTransitioning) return;
    if (phase === "idle" && !isLoading) {
      if (hasActiveSession()) {
        void resumeSession();
      } else {
        router.replace("/create");
      }
    } else if (phase === "layer0") {
      router.replace("/layer0");
    } else if (phase === "complete") {
      router.replace("/results");
    } else if (phase === "active" && !currentNode && !isLoading && hasActiveSession()) {
      void resumeSession();
    }
  }, [
    phase,
    isLoading,
    hasActiveSession,
    resumeSession,
    router,
    isTransitioning,
    currentNode,
  ]);

  const handleChoice = useCallback(
    async (index: number) => {
      if (isTransitioning || choiceDisabled || !currentNode) return;
      const choice = currentNode.choices.find(c => c.index === index);
      if (!choice) return;

      setChoiceDisabled(true);
      setIsTransitioning(true);

      try {
        const complete = await makeChoice(currentNode.id, index as 0 | 1 | 2);
        setIsFinalTransition(complete);
      } catch {
        setChoiceDisabled(false);
        setIsTransitioning(false);
      }
    },
    [isTransitioning, choiceDisabled, currentNode, makeChoice]
  );

  const handleTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
    setChoiceDisabled(false);
    if (isFinalTransition) {
      router.push("/results");
    }
  }, [router, isFinalTransition]);

  // Free-text choice uses choice 0 as a fallback for demo purposes.
  // The text is discarded server-side; the intent is to keep the demo moving.
  const handleFreeTextChoice = useCallback(async (): Promise<void> => {
    if (!freeText.trim() || isTransitioning || choiceDisabled || !currentNode) return;
    setFreeText("");
    await handleChoice(0);
  }, [freeText, isTransitioning, choiceDisabled, currentNode, handleChoice]);

  // No session + not transitioning — show empty state
  if (!currentNode && !isTransitioning && phase !== "complete") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          {error ? (
            <ErrorBanner message={error} onRetry={() => router.replace("/resume")} />
          ) : (
            <p className="font-body italic text-xl text-navy">
              No active session found.
            </p>
          )}
          <button
            onClick={() => { resetGame(); router.replace("/"); }}
            className="px-8 py-4 bg-navy text-white rounded-full font-headline font-black uppercase tracking-widest hover:bg-lime hover:text-navy transition-all duration-300 shadow-[0_10px_30px_rgba(30,58,138,0.2)] hover:scale-105 active:scale-95 border-4 border-transparent hover:border-white"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream text-navy min-h-screen relative overflow-hidden">
      {/* ── Adinkra Pattern Background ─────────────────────────────── */}
      <div className="fixed inset-0 z-0 bg-cream">
        <div className="absolute inset-0 adinkra-pattern" />
      </div>

      {/* ── Top HUD ─────────────────────────────────────── */}
      <div className="relative z-20">
        <HUD
          clientState={clientState || { capital: 0, reputation: 0, networkStrength: 0, layer: 0, turnsElapsed: 0 } as ClientWorldState}
          layer={layer}
        />
      </div>

      {/* ── Overlays ───────────────────────────────────────────────────── */}
      {isLoading && !isTransitioning && <LoadingOverlay message="Loading..." />}

      {isTransitioning && (
        <RetroTransition
          messages={isFinalTransition ? finalMessages : transitionMessages}
          duration={isFinalTransition ? 2500 : 1500}
          onComplete={handleTransitionComplete}
        />
      )}

      {/* Error banner */}
      {error && !isTransitioning && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-6">
          <ErrorBanner message={error} onRetry={() => router.replace("/resume")} />
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-12">
        {currentNode && (
        <div className="max-w-2xl w-full flex flex-col gap-6">

          {/* Turn badge */}
          <div className="inline-block self-start border-4 border-white bg-lime text-navy px-6 py-2 rounded-full font-headline font-black uppercase tracking-widest text-sm shadow-[0_5px_15px_rgba(57,255,20,0.3)]">
            Turn {turns}
          </div>

          {/* World signals */}
          {clientState && (
            <WorldHUD clientState={clientState} />
          )}

          {/* Narrative flat card */}
          <div className="bg-white/80 backdrop-blur-xl border-4 border-white p-10 rounded-[3rem] shadow-[0_20px_60px_rgba(30,58,138,0.1)]">
            <p className="font-headline font-extrabold text-base md:text-lg text-navy leading-tight whitespace-pre-line tracking-tight drop-shadow-sm">
              {currentNode.narrative}
            </p>
          </div>

          {/* Choices */}
          <div className="flex flex-col gap-5 mt-4">
            {currentNode.choices.map((choice, i: number) => {
              const letterLabel = String.fromCharCode(65 + i);
              
              // Color code the buttons: A = Cyan, B = Pink, C = Yellow/Orange
              const colors = [
                "bg-electric-cyan hover:bg-electric-cyan/90 text-navy shadow-[0_10px_30px_rgba(0,240,255,0.3)]",
                "bg-hot-pink hover:bg-hot-pink/90 text-white shadow-[0_10px_30px_rgba(255,42,133,0.3)]",
                "bg-electric-yellow hover:bg-electric-yellow/90 text-navy shadow-[0_10px_30px_rgba(255,234,0,0.3)]",
              ];
              const buttonColor = colors[i % colors.length];

              return (
                <button
                  key={choice.index}
                  onClick={() => handleChoice(choice.index)}
                  disabled={isTransitioning || choiceDisabled}
                  className={`group flex items-center w-full rounded-full border-4 border-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${buttonColor}`}
                >
                  <span className={`flex-shrink-0 w-16 h-16 rounded-full m-2 flex items-center justify-center text-2xl font-black bg-white/20 backdrop-blur-sm group-hover:bg-white/40 transition-colors`}>
                    {letterLabel}
                  </span>
                  <span className="flex-1 flex flex-col items-start px-4 py-4 text-left">
                    <span className="font-headline font-extrabold text-lg drop-shadow-sm">{choice.text}</span>
                  </span>
                  <span className="material-symbols-outlined text-3xl pr-6 font-bold group-hover:translate-x-2 transition-transform drop-shadow-sm">arrow_forward</span>
                </button>
              );
            })}
          </div>

          {/* Free-text choice */}
          <div className="mt-2 flex flex-col gap-3">
            <p className="font-headline font-bold text-xs uppercase tracking-widest text-navy/50 px-2">
              Or write your own approach
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Describe your move..."
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && freeText.trim() && void handleFreeTextChoice()}
                className="flex-1 bg-white/80 border-4 border-white rounded-full px-6 py-3 font-body text-navy placeholder:text-navy/30 focus:outline-none focus:border-lime transition-colors"
                disabled={isTransitioning || choiceDisabled}
              />
              <button
                onClick={() => void handleFreeTextChoice()}
                disabled={!freeText.trim() || isTransitioning || choiceDisabled}
                className="px-6 py-3 bg-navy text-white rounded-full font-headline font-black uppercase tracking-widest text-sm hover:bg-lime hover:text-navy transition-all disabled:opacity-40 disabled:cursor-not-allowed border-4 border-white"
              >
                Send
              </button>
            </div>
          </div>

          {/* Bottom market tension indicator */}
          <div className="flex items-center gap-4 border-4 border-white bg-white/80 backdrop-blur-md rounded-full p-3 self-start shadow-[0_10px_30px_rgba(30,58,138,0.08)] mt-4">
            <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center text-electric-cyan flex-shrink-0 shadow-inner">
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                trending_up
              </span>
            </div>
            <div className="pr-4">
              <p className="text-navy font-headline font-black text-xs tracking-widest uppercase">
                Market Tension
              </p>
              <p className="text-navy/70 font-headline font-bold text-[10px] uppercase tracking-wider">Active · Accra Central</p>
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
};

export default Gameplay;