"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { TopAppBar } from "@/components/stitch/TopAppBar";
import RetroTransition from "@/components/RetroTransition";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingOverlay from "@/components/LoadingOverlay";

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

/** Core game loop — dark cinematic hero + glass narrative + rounded pill choices. */
const Gameplay = () => {
  const router = useRouter();
  const { state, phase, hasActiveSession, makeChoice, isLoading, error, resetGame, resumeSession } = useGame();
  const currentNode = state.currentNode;
  const clientState = state.clientState;

  const capital = clientState?.capital ?? 0;
  const reputation = clientState?.reputation ?? 0;
  const network = clientState?.networkStrength ?? 0;
  const layer = clientState?.layer ?? 0;
  const turns = clientState?.turnsElapsed ?? 0;

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFinalTransition, setIsFinalTransition] = useState(false);
  const [choiceDisabled, setChoiceDisabled] = useState(false);

  useEffect(() => {
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
    }
  }, [phase, isLoading, hasActiveSession, resumeSession, router]);

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

  // No session + not transitioning — show empty state
  if (!currentNode && !isTransitioning) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          {error ? (
            <ErrorBanner message={error} onRetry={() => router.replace("/resume")} />
          ) : (
            <p className="font-body italic text-xl text-on-surface-variant">
              No active session found.
            </p>
          )}
          <button
            onClick={() => { resetGame(); router.replace("/"); }}
            className="px-8 py-4 bg-primary text-on-primary rounded-xl font-headline font-bold hover:bg-primary-dim transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!currentNode) return null;

  return (
    <div className="bg-background text-on-surface min-h-screen relative overflow-hidden">
      {/* ── Dark cinematic hero background ─────────────────────────────── */}
      <div className="fixed inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-primary/90 via-primary-dim/85 to-on-surface/95" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-transparent to-tertiary/15 mix-blend-multiply" />
        <div className="absolute inset-0 kente-pattern opacity-5" />
      </div>

      {/* ── TopAppBar with game HUD ─────────────────────────────────────── */}
      <TopAppBar
        walletBalance={capital}
        gameInfo={{ layer, turn: turns }}
      />

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
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-28 pb-12">
        <div className="max-w-2xl w-full flex flex-col gap-6">

          {/* Chapter badge */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center px-4 py-2 bg-tertiary/20 text-tertiary-container rounded-full border border-tertiary/30">
              <span
                className="material-symbols-outlined text-sm mr-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                emergency
              </span>
              <span className="font-label text-xs font-bold tracking-widest uppercase">
                Layer {layer} · Turn {turns}
              </span>
            </div>

            {/* Reputation + Network pills */}
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                <span className="material-symbols-outlined text-secondary-fixed text-sm">star</span>
                <span className="font-label text-xs font-bold text-stone-200">{reputation}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                <span className="material-symbols-outlined text-secondary-fixed text-sm">group</span>
                <span className="font-label text-xs font-bold text-stone-200">{network}</span>
              </div>
            </div>
          </div>

          {/* Narrative glass card */}
          <div className="glass-panel-dark rounded-xl p-8 shadow-2xl border border-white/10">
            <p className="font-body italic text-xl md:text-2xl text-stone-100 leading-relaxed">
              {currentNode.narrative}
            </p>
          </div>

          {/* Choices */}
          <div className="flex flex-col gap-3">
            {currentNode.choices.map((choice, i: number) => {
              const letterLabel = String.fromCharCode(65 + i);
              // A = primary (bold/energy), B = secondary-container (measured), C = surface (cautious)
              const variants = [
                "bg-primary text-on-primary hover:bg-primary-dim shadow-[0_8px_30px_rgba(82,79,178,0.3)]",
                "bg-secondary-container text-on-secondary-container hover:opacity-90",
                "bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm border border-white/20",
              ] as const;

              return (
                <button
                  key={choice.index}
                  onClick={() => handleChoice(choice.index)}
                  disabled={isTransitioning || choiceDisabled}
                  className={`flex items-center gap-4 w-full px-6 py-5 rounded-xl font-headline font-bold text-base text-left transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variants[i]}`}
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-extrabold">
                    {letterLabel}
                  </span>
                  <span className="flex-1 flex flex-col">
                    <span>{choice.text}</span>
                    {choice.tensionHint && (
                      <span className="text-xs font-normal opacity-70 mt-1">{choice.tensionHint}</span>
                    )}
                  </span>
                  <span className="material-symbols-outlined text-lg opacity-60">arrow_forward</span>
                </button>
              );
            })}
          </div>

          {/* Bottom market tension indicator */}
          <div className="flex items-center gap-4 bg-surface-container-lowest/10 backdrop-blur-md p-4 rounded-full border border-white/5 self-start">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container flex-shrink-0">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                trending_up
              </span>
            </div>
            <div>
              <p className="text-white font-headline font-bold text-xs tracking-wide uppercase">
                Market Tension
              </p>
              <p className="text-secondary-fixed text-xs font-bold">Active · Accra Central</p>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative corner glows */}
      <div className="fixed top-0 right-0 w-64 h-64 opacity-20 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-bl from-tertiary to-transparent rounded-full blur-[100px]" />
      </div>
      <div className="fixed bottom-0 left-0 w-48 h-48 opacity-15 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-secondary-container to-transparent rounded-full blur-[80px]" />
      </div>
    </div>
  );
};

export default Gameplay;
