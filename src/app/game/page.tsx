"use client";

import { useGameSession } from "../../hooks/useGameSession";
import NarrativeBeat from "../../components/NarrativeBeat";
import ChoicePanel from "../../components/ChoicePanel";
import { ResourceBar } from "../../components/ResourceBar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GameScreen() {
  const router = useRouter();
  const { 
    sessionId, 
    state, 
    narrative, 
    feedback, 
    isLoading, 
    isSubmitting, 
    error, 
    startSession, 
    submitChoice 
  } = useGameSession();

  useEffect(() => {
    if (state?.session?.isStoryComplete && sessionId) {
      router.push(`/results?sessionId=${sessionId}`);
    }
  }, [state?.session?.isStoryComplete, sessionId, router]);

  const handleOptionSelect = async (choiceId: string) => {
    if (isSubmitting) return;
    await submitChoice(choiceId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-light selection:bg-accent selection:text-primary">
        <div className="animate-pulse flex items-center space-x-2 bg-tealAccent/20 px-6 py-2 rounded-full border border-tealAccent/30 backdrop-blur-sm z-30">
          <div className="w-2 h-2 bg-tealAccent rounded-full"></div>
          <span className="text-tealAccent font-bold text-xs sm:text-sm tracking-widest uppercase">Loading Active Session...</span>
        </div>
      </div>
    );
  }

  // --- NO ACTIVE SESSION (START SCREEN) ---
  if (!sessionId || !state || !narrative) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-light selection:bg-accent selection:text-primary relative overflow-hidden">
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 text-red-100 px-6 py-3 rounded-xl max-w-md w-full text-center">
             An error occurred: {error}
          </div>
        )}
        <div className="bg-light text-primary p-8 rounded-xl text-center shadow-2xl max-w-md w-full border-t-8 border-accent z-10">
          <h2 className="text-3xl font-black mb-4">Welcome to HatchQuest</h2>
          <p className="mb-6 opacity-80 font-medium">Ready to start your startup journey?</p>
          <button 
            type="button"
            disabled={isSubmitting}
            onClick={() => void startSession()}
            className="w-full bg-accent text-primary font-extrabold text-xl py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-[#ffb600] transition-all transform hover:-translate-y-1 disabled:opacity-50"
          >
            {isSubmitting ? "Starting..." : "Start Journey"}
          </button>
        </div>
      </div>
    );
  }

  // --- GAME LOOP SCREEN ---
  return (
    <div className="min-h-screen bg-primary font-sans text-light flex flex-col relative overflow-hidden selection:bg-accent selection:text-primary">
      
      {/* Immersive Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-30">
        <div className="w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] bg-tealAccent/20 blur-[150px] rounded-full absolute -top-[10%] -left-[10%]"></div>
        <div className="w-[60vw] h-[60vw] md:w-[30vw] md:h-[30vw] bg-accent/10 blur-[120px] rounded-full absolute top-[20%] right-[10%]"></div>
      </div>

      {/* Top Banner / Navigation */}
      <header className="w-full flex justify-between items-center px-6 md:px-10 py-5 z-20 border-b border-light/5 bg-primary/40 backdrop-blur-md">
        <div className="text-2xl font-black tracking-tighter text-light drop-shadow-md">
          HatchQuest
        </div>
        {error && (
          <div className="text-red-400 font-bold text-sm bg-red-400/10 px-4 py-2 border border-red-400/20 rounded-full">
            {error}
          </div>
        )}
      </header>

      {/* Main Responsive Grid Layout */}
      <div className="flex-1 w-full flex flex-col lg:flex-row relative z-10">
        
        {/* SIDEBAR: Stats */}
        <div className="w-full lg:w-72 xl:w-80 lg:border-r border-light/10 bg-primary/40 backdrop-blur-xl flex flex-col order-2 lg:order-1 flex-shrink-0 lg:h-[calc(100vh-81px)] lg:sticky top-[81px] lg:overflow-y-auto">
          <ResourceBar resources={state.resources} flags={state.flags} />
        </div>

        {/* MAIN GAME AREA */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 order-1 lg:order-2 overflow-y-auto w-full max-w-5xl mx-auto min-h-[70vh]">
          <div className="lg:hidden mb-6 bg-accent/20 border border-accent/40 text-accent font-bold px-4 py-1.5 rounded-full text-sm">
            {narrative.title}
          </div>

          <NarrativeBeat 
            title={narrative.title} 
            storyText={narrative.storyText} 
            feedback={feedback} 
          />

          <ChoicePanel 
            choices={narrative.choices} 
            disabled={isSubmitting} 
            onChoice={(choiceId) => void handleOptionSelect(choiceId)} 
          />
        </div>
      </div>
    </div>
  );
}