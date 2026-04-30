"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame, SessionPhase } from "@/context/GameContext";

// Resume — hydrates an in-progress session from localStorage.
const ResumeSession = () => {
  const router = useRouter();
  const { resumeSession, resetGame, state, isLoading } = useGame();
  const [resumeAttempted, setResumeAttempted] = useState(false);
  const [canResume, setCanResume] = useState(false);
  const [phase, setPhase] = useState<SessionPhase>("idle");

  useEffect(() => {
    resumeSession().then((phase) => {
      setResumeAttempted(true);
      setCanResume(phase !== "idle");
      setPhase(phase);
      if (phase === "idle") {
        router.replace("/create");
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const capital = state.clientState?.capital ?? 0;
  const layer = state.clientState?.layer ?? 1;
  const turns = state.clientState?.turnsElapsed ?? 0;

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading || !resumeAttempted) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-lime animate-spin shadow-[0_0_20px_rgba(57,255,20,0.3)]" />
          <span className="font-headline font-black text-lime tracking-[0.3em] uppercase italic drop-shadow-sm">
            RECONNECTING...
          </span>
        </div>
      </div>
    );
  }

  // ── Expired ──────────────────────────────────────────────────────────────────
  if (!canResume) {
    return (
      <div className="min-h-screen bg-cream flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 adinkra-pattern opacity-10 z-0" />
        
        <div className="bg-navy flex flex-col justify-center px-8 pt-24 pb-16 flex-[0_0_45%] relative z-10 rounded-b-[4rem] shadow-[0_20px_60px_rgba(30,58,138,0.3)]">
          <span className="font-headline font-black text-hot-pink tracking-[0.3em] mb-6 uppercase text-sm drop-shadow-sm">
            SESSION EXPIRED
          </span>
          <h1 className="font-headline font-black text-white italic leading-none tracking-tighter text-6xl md:text-8xl drop-shadow-md">
            Your journey<br />was lost.
          </h1>
          <p className="font-body text-xl text-white/70 mt-6 max-w-md font-medium leading-relaxed">
            Every founder faces setbacks. The question is whether you rebuild.
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-end px-8 pb-12 relative z-10">
          <button
            onClick={() => { resetGame(); router.push("/create"); }}
            className="w-full py-6 bg-lime text-navy font-headline font-black text-xl rounded-full shadow-[0_12px_40px_rgba(57,255,20,0.4)] border-4 border-white hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
          >
            START FRESH
            <span className="material-symbols-outlined font-black">refresh</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Active session ────────────────────────────────────────────────────────────
  const isCompleted = phase === "complete";
  
  return (
    <div className="min-h-screen bg-cream flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 adinkra-pattern opacity-10 z-0" />

      {/* Zone 1 — navy */}
      <div className="bg-navy flex flex-col justify-center px-8 pt-24 pb-16 flex-[0_0_45%] relative z-10 rounded-b-[4rem] shadow-[0_20px_60px_rgba(30,58,138,0.3)]">
        <span className="font-headline font-black text-electric-cyan tracking-[0.3em] mb-6 uppercase text-sm drop-shadow-sm">
          {isCompleted ? "JOURNEY COMPLETE" : "JOURNEY IN PROGRESS"}
        </span>
        <h1 className="font-headline font-black text-white italic leading-none tracking-tighter text-6xl md:text-8xl drop-shadow-md">
          {isCompleted ? "The results are in." : "Still in the game."}
        </h1>
      </div>

      {/* Zone 2 — stats + actions */}
      <div className="flex-1 flex flex-col px-8 pt-10 pb-12 relative z-10">
        
        {/* Stats card */}
        <div className="bg-white/80 backdrop-blur-xl border-4 border-white rounded-[3rem] p-8 shadow-[0_20px_60px_rgba(30,58,138,0.1)] mb-10">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "LAYER", value: layer, color: "text-hot-pink" },
              { label: "DECISIONS", value: turns, color: "text-electric-cyan" },
              { label: "CAPITAL", value: `₵${(capital / 1000).toFixed(1)}k`, color: "text-lime" },
            ].map((s, i) => (
              <div
                key={s.label}
                className={`flex flex-col items-center gap-2 ${i < 2 ? "border-r-2 border-cream" : ""}`}
              >
                <span className="font-headline font-black text-[10px] tracking-widest text-navy/40 uppercase">
                  {s.label}
                </span>
                <span className={`font-headline font-black text-2xl md:text-3xl ${s.color} drop-shadow-sm`}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 mt-auto">
          <button
            onClick={() => {
              if (phase === "layer0") router.push("/layer0");
              else if (phase === "complete") router.push("/results");
              else router.push("/play");
            }}
            className="w-full py-6 bg-lime text-navy font-headline font-black text-xl rounded-full shadow-[0_12px_40px_rgba(57,255,20,0.4)] border-4 border-white hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
          >
            {isCompleted ? "VIEW RESULTS" : "CONTINUE JOURNEY"}
            <span className="material-symbols-outlined font-black">east</span>
          </button>
          
          <button
            onClick={() => { resetGame(); router.push("/create"); }}
            className="w-full py-4 bg-white text-navy/40 rounded-full font-headline font-bold text-sm hover:text-navy border-4 border-transparent hover:border-cream transition-all uppercase tracking-widest shadow-sm"
          >
            Abandon & Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeSession;
