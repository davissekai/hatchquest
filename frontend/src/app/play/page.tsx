"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { HUD } from "@/components/HUD";
import RetroTransition from "@/components/RetroTransition";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingOverlay from "@/components/LoadingOverlay";
import { WorldHUD } from "@/components/WorldHUD";
import RadarChart from "@/components/RadarChart";
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

/** Core game loop — Desktop-First Vibrant UI */
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
      <div className="min-h-screen bg-vivid-blue bg-gradient-to-b from-sky-blue to-vivid-blue flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-white">
          {error ? (
            <ErrorBanner message={error} onRetry={() => router.replace("/resume")} />
          ) : (
            <p className="font-headline font-bold text-2xl text-slate-900">
              No active session found.
            </p>
          )}
          <button
            onClick={() => { resetGame(); router.replace("/"); }}
            className="px-8 py-4 bg-pill-blue text-white rounded-full font-headline font-black uppercase tracking-widest hover:scale-105 transition-all duration-300 shadow-xl border-4 border-transparent hover:border-white"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Fallback for Radar chart if the engine doesn't expose it yet
  const dummyEo = {
    autonomy: 60,
    innovativeness: 40,
    proactiveness: 80,
    riskTaking: 50,
    competitiveAggressiveness: 70
  };

  return (
    <div className="bg-vivid-blue bg-gradient-to-br from-sky-blue to-vivid-blue text-slate-900 min-h-screen h-screen overflow-hidden relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
        <div className="absolute top-[-5%] right-[-5%] w-[40vw] h-[40vw] bg-white rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-lime rounded-full blur-[120px] opacity-40" />
      </div>

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

      <main className="relative z-10 w-full h-full max-w-[1600px] mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-6 overflow-hidden">
        
        {/* ── Left Pane (HUD & Navigation) ── */}
        <aside className="hidden lg:flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-10 custom-scrollbar">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-xl border-4 border-white/50">
            <h2 className="font-headline font-black text-pill-blue text-xl mb-4">World Status</h2>
            <HUD
              clientState={clientState || { capital: 0, reputation: 0, networkStrength: 0, layer: 0, turnsElapsed: 0 } as ClientWorldState}
              layer={layer}
            />
          </div>
          <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-xl border-4 border-white/50 flex-1">
            <h2 className="font-headline font-black text-grass-green text-xl mb-4">Inventory & Logs</h2>
            <div className="h-48 flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-slate-100">
               <p className="font-body text-slate-400 font-bold">No active items.</p>
            </div>
          </div>
        </aside>

        {/* ── Center Pane (Narrative & Choices) ── */}
        <section className="flex flex-col h-full overflow-y-auto pb-32 pt-2 lg:pt-0 hide-scrollbar">
          {currentNode && (
            <div className="max-w-2xl w-full mx-auto flex flex-col gap-8 pb-10">
              
              {/* Turn & Status Ribbon */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 border-4 border-white bg-grass-green text-white px-8 py-3 rounded-full font-headline font-black uppercase tracking-widest text-sm shadow-xl">
                  <span>Turn {turns}</span>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>Layer {layer}</span>
                </div>
              </div>

              {/* Mobile Only: Top stats (Hidden on Desktop since Left Pane handles it) */}
              <div className="lg:hidden">
                 <HUD
                  clientState={clientState || { capital: 0, reputation: 0, networkStrength: 0, layer: 0, turnsElapsed: 0 } as ClientWorldState}
                  layer={layer}
                />
              </div>

              {/* Narrative Bubble */}
              <div className="bg-white border-4 border-white p-10 rounded-[3rem] shadow-2xl relative">
                {/* Speech bubble tail */}
                <div className="absolute -bottom-6 left-12 w-10 h-10 bg-white border-b-4 border-l-4 border-white rotate-[-45deg] shadow-lg rounded-bl-xl z-0 hidden lg:block" />
                
                <p className="relative z-10 font-body font-bold text-lg md:text-xl text-slate-800 leading-relaxed tracking-tight whitespace-pre-line">
                  {currentNode.narrative}
                </p>
              </div>

              {/* Choices */}
              <div className="flex flex-col gap-4 mt-6 z-10">
                {currentNode.choices.map((choice, i: number) => {
                  const letterLabel = String.fromCharCode(65 + i);
                  
                  // Vivid App Colors
                  const colors = [
                    "bg-pill-blue hover:bg-sky-blue text-white border-white",
                    "bg-hot-pink hover:bg-hot-pink/80 text-white border-white",
                    "bg-lime hover:bg-grass-green text-slate-900 border-white",
                  ];
                  const buttonColor = colors[i % colors.length];

                  return (
                    <button
                      key={choice.index}
                      onClick={() => handleChoice(choice.index)}
                      disabled={isTransitioning || choiceDisabled}
                      className={`group relative flex items-center w-full rounded-[2.5rem] border-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-xl overflow-hidden ${buttonColor}`}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:animate-shine" />

                      <span className={`flex-shrink-0 w-16 h-16 rounded-full m-3 flex items-center justify-center text-3xl font-headline font-black bg-white/20 backdrop-blur-sm group-hover:bg-white/40 transition-colors shadow-inner`}>
                        {letterLabel}
                      </span>
                      <span className="flex-1 flex flex-col items-start px-2 py-4 text-left">
                        <span className="font-headline font-bold text-lg leading-tight">{choice.text}</span>
                      </span>
                      <span className="material-symbols-outlined text-4xl pr-6 font-black group-hover:translate-x-2 transition-transform drop-shadow-sm">arrow_forward_ios</span>
                    </button>
                  );
                })}
              </div>

              {/* Free-text choice */}
              <div className="mt-4 flex flex-col gap-3 z-10">
                <p className="font-headline font-bold text-sm uppercase tracking-widest text-white/80 text-center drop-shadow-md">
                  Or write your own approach
                </p>
                <div className="flex gap-3 bg-white p-2 rounded-full shadow-2xl border-4 border-white/50">
                  <input
                    type="text"
                    placeholder="Describe your move..."
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && freeText.trim() && void handleFreeTextChoice()}
                    className="flex-1 bg-slate-50 border-none rounded-full px-6 py-4 font-body font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-blue/30 transition-all"
                    disabled={isTransitioning || choiceDisabled}
                  />
                  <button
                    onClick={() => void handleFreeTextChoice()}
                    disabled={!freeText.trim() || isTransitioning || choiceDisabled}
                    className="px-8 py-4 bg-pill-red text-white rounded-full font-headline font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed border-4 border-white shadow-lg flex items-center gap-2"
                  >
                    <span>Execute</span>
                    <span className="material-symbols-outlined text-xl">send</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </section>

        {/* ── Right Pane (Contextual Data) ── */}
        <aside className="hidden lg:flex flex-col gap-6 h-full overflow-y-auto pl-2 pb-10 custom-scrollbar">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-xl border-4 border-white/50">
            <WorldHUD clientState={clientState!} />
          </div>
          
          <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-xl border-4 border-white/50 flex flex-col items-center">
            <h2 className="font-headline font-black text-pill-red text-lg uppercase tracking-widest mb-2 text-center">EO Profile</h2>
            <RadarChart dimensions={dummyEo} maxValue={100} />
          </div>
        </aside>

      </main>

      {/* Inline styles for custom scrollbars and shine animation */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.4); border-radius: 10px; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes shine {
          100% { transform: translateX(200%); }
        }
        .animate-shine { animation: shine 1.5s ease-in-out infinite; }
      `}} />
    </div>
  );
}