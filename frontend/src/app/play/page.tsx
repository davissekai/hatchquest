"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { HUD } from "@/components/HUD";
import RetroTransition from "@/components/RetroTransition";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingOverlay from "@/components/LoadingOverlay";
import { WorldHUD } from "@/components/WorldHUD";
import { Starburst, Sparkle } from "@/components/Decorations";
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

export default function Gameplay() {
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

  const handleFreeTextChoice = useCallback(async (): Promise<void> => {
    if (!freeText.trim() || isTransitioning || choiceDisabled || !currentNode) return;
    setFreeText("");
    await handleChoice(0);
  }, [freeText, isTransitioning, choiceDisabled, currentNode, handleChoice]);

  if (!currentNode && !isTransitioning && phase !== "complete") {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center px-6 selection:bg-hot-pink selection:text-white">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center bg-white p-10 rounded-[2rem] shadow-[12px_12px_0px_#0f172a] border-[6px] border-slate-900">
          {error ? (
            <ErrorBanner message={error} onRetry={() => router.replace("/resume")} />
          ) : (
            <p className="font-headline font-black text-3xl text-slate-900 uppercase">
              No active session
            </p>
          )}
          <button
            onClick={() => { resetGame(); router.replace("/"); }}
            className="px-10 py-5 bg-pill-blue text-white rounded-full font-headline font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[8px_8px_0px_#0f172a] active:translate-y-1 active:shadow-[2px_2px_0px_#0f172a] transition-all duration-200 shadow-[6px_6px_0px_#0f172a] border-4 border-slate-900"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F2EB] text-slate-900 min-h-screen h-screen overflow-hidden relative selection:bg-hot-pink selection:text-white">
      
      {/* Decorative Background Elements */}
      <Starburst className="w-64 h-64 -top-20 -left-20 rotate-45" fill="var(--color-pill-blue)" />
      <Starburst className="w-48 h-48 bottom-[-5%] -right-10 -rotate-12 opacity-50" fill="var(--color-lime)" />
      <Sparkle className="w-20 h-20 top-[15%] right-[25%]" fill="var(--color-hot-pink)" />
      <Sparkle className="w-16 h-16 bottom-[10%] left-[20%]" fill="#FFC107" />

      {isLoading && !isTransitioning && <LoadingOverlay message="Loading..." />}

      {isTransitioning && (
        <RetroTransition
          messages={isFinalTransition ? finalMessages : transitionMessages}
          duration={isFinalTransition ? 2500 : 1500}
          onComplete={handleTransitionComplete}
        />
      )}

      {error && !isTransitioning && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-6">
          <ErrorBanner message={error} onRetry={() => router.replace("/resume")} />
        </div>
      )}

      {/* Header Bar */}
      <header className="relative z-20 w-full px-6 py-4 flex justify-between items-center border-b-8 border-slate-900 bg-white">
        <div className="font-headline font-black text-2xl uppercase tracking-tighter">HatchQuest</div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-pill-blue text-white border-4 border-slate-900 rounded-full font-headline font-black text-xs uppercase shadow-[4px_4px_0px_#0f172a]">
            Layer {layer}
          </div>
          <div className="px-4 py-2 bg-[#FFC107] border-4 border-slate-900 rounded-full font-headline font-black text-xs uppercase shadow-[4px_4px_0px_#0f172a]">
            Turn {turns}
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full h-[calc(100vh-80px)] max-w-[1800px] mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-[340px_1fr_340px] gap-8 overflow-hidden">
        
        {/* ── Left Pane (HUD) ── */}
        <aside className="hidden lg:flex flex-col gap-8 h-full overflow-y-auto pr-2 pb-10 custom-scrollbar">
          <div className="bg-white rounded-[2rem] p-6 shadow-[12px_12px_0px_#0f172a] border-[6px] border-slate-900">
            <h2 className="font-headline font-black text-slate-900 text-2xl uppercase tracking-tighter mb-6 border-b-8 border-slate-900 pb-2">Status</h2>
            <HUD
              clientState={clientState || { capital: 0, reputation: 0, networkStrength: 0, layer: 0, turnsElapsed: 0 } as ClientWorldState}
              layer={layer}
            />
          </div>
          <div className="bg-white rounded-[2rem] p-6 shadow-[12px_12px_0px_#0f172a] border-[6px] border-slate-900 flex-1 flex flex-col">
            <h2 className="font-headline font-black text-slate-900 text-2xl uppercase tracking-tighter mb-4 border-b-8 border-slate-900 pb-2">Inventory</h2>
            <div className="flex-1 flex items-center justify-center bg-[#F5F2EB] rounded-2xl border-4 border-slate-900 border-dashed">
               <p className="font-headline font-black text-slate-400 uppercase tracking-widest text-sm">Empty</p>
            </div>
          </div>
        </aside>

        {/* ── Center Pane (Narrative & Choices) ── */}
        <section className="flex flex-col h-full overflow-y-auto pb-32 pt-2 lg:pt-0 hide-scrollbar">
          {currentNode && (
            <div className="max-w-3xl w-full mx-auto flex flex-col gap-10 pb-10">
              
              {/* Mobile Only Stats */}
              <div className="lg:hidden mt-4">
                 <HUD
                  clientState={clientState || { capital: 0, reputation: 0, networkStrength: 0, layer: 0, turnsElapsed: 0 } as ClientWorldState}
                  layer={layer}
                />
              </div>

              {/* Narrative Bubble */}
              <div className="bg-white border-[6px] border-slate-900 p-8 md:p-12 rounded-[2rem] shadow-[16px_16px_0px_#0f172a] relative">
                {/* Decorative Pin */}
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-hot-pink border-4 border-slate-900 rounded-full shadow-[4px_4px_0px_#0f172a] z-10" />
                <p className="relative z-10 font-body font-bold text-lg md:text-xl text-slate-900 leading-relaxed whitespace-pre-line">
                  {currentNode.narrative}
                </p>
              </div>

              {/* Choices */}
              <div className="flex flex-col gap-6 mt-4 z-10">
                {currentNode.choices.map((choice, i: number) => {
                  const letterLabel = String.fromCharCode(65 + i);
                  
                  const colors = [
                    "bg-pill-blue text-white",
                    "bg-hot-pink text-white",
                    "bg-lime text-slate-900",
                  ];
                  const buttonColor = colors[i % colors.length];

                  return (
                    <button
                      key={choice.index}
                      onClick={() => handleChoice(choice.index)}
                      disabled={isTransitioning || choiceDisabled}
                      className={`group relative flex items-center w-full rounded-[2rem] border-[6px] border-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-2 hover:shadow-[12px_12px_0px_#0f172a] active:translate-y-1 active:shadow-[2px_2px_0px_#0f172a] shadow-[8px_8px_0px_#0f172a] overflow-hidden ${buttonColor}`}
                    >
                      <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:animate-shine" />

                      <span className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 border-r-[6px] border-slate-900 flex items-center justify-center text-4xl font-headline font-black bg-white/20`}>
                        {letterLabel}
                      </span>
                      <span className="flex-1 flex flex-col items-start px-6 py-6 text-left">
                        <span className="font-headline font-black text-xl md:text-2xl leading-tight uppercase tracking-tight">{choice.text}</span>
                      </span>
                      <span className="material-symbols-outlined text-4xl md:text-5xl pr-6 font-black group-hover:translate-x-2 transition-transform">east</span>
                    </button>
                  );
                })}
              </div>

              {/* Free-text choice */}
              <div className="mt-8 flex flex-col gap-4 z-10">
                <p className="font-headline font-black text-sm uppercase tracking-widest text-slate-500 text-center">
                  Or execute a custom approach
                </p>
                <div className="flex gap-4 bg-white p-4 rounded-[2rem] shadow-[12px_12px_0px_#0f172a] border-[6px] border-slate-900">
                  <input
                    type="text"
                    placeholder="Describe your move..."
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && freeText.trim() && void handleFreeTextChoice()}
                    className="flex-1 bg-[#F5F2EB] border-[4px] border-slate-900 rounded-[1.5rem] px-6 py-4 font-headline font-bold text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-pill-blue focus:-translate-y-1 focus:shadow-[6px_6px_0px_#0f172a] transition-all"
                    disabled={isTransitioning || choiceDisabled}
                  />
                  <button
                    onClick={() => void handleFreeTextChoice()}
                    disabled={!freeText.trim() || isTransitioning || choiceDisabled}
                    className="px-8 py-4 bg-pill-red text-white rounded-[1.5rem] font-headline font-black text-xl uppercase tracking-widest hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] active:translate-y-1 active:shadow-[0px_0px_0px_#0f172a] transition-all disabled:opacity-40 disabled:cursor-not-allowed border-[4px] border-slate-900 flex items-center gap-2"
                  >
                    <span>Execute</span>
                    <span className="material-symbols-outlined font-black">send</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </section>

        {/* ── Right Pane (World only — EO Profile is results-only) ── */}
        <aside className="hidden lg:flex flex-col gap-8 h-full overflow-y-auto pl-2 pb-10 custom-scrollbar">
          <div className="bg-white rounded-[2rem] p-6 shadow-[12px_12px_0px_#0f172a] border-[6px] border-slate-900">
            <WorldHUD clientState={clientState!} />
          </div>
        </aside>

      </main>
    </div>
  );
}