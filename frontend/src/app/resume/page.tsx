"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import BreathingGrid from "@/components/BreathingGrid";

const ResumeSession = () => {
  const router = useRouter();
  const { state, clearSession } = useGame();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      router.replace("/create");
    }
  }, []);

  const playerName = state.player?.name || "Entrepreneur";
  const beat = state.currentScene;
  const round = state.currentRound;

  const handleContinue = () => router.push("/play");

  const handleStartFresh = () => {
    clearSession();
    router.push("/create");
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      <BreathingGrid />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 animate-fade-in border-[3px] border-primary bg-card px-5 py-2 shadow-brutal-sm">
          <span className="font-display text-xs tracking-[0.3em] text-muted-foreground uppercase">
            Journey In Progress
          </span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl leading-none tracking-tight text-primary animate-slide-up mb-4">
          WELCOME
          <br />
          <span className="text-accent">BACK</span>
        </h1>

        <p
          className="mt-2 mb-8 max-w-xs text-lg font-body text-muted-foreground animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <strong className="text-primary">{playerName}</strong>, your empire is waiting.
        </p>

        {/* Progress card */}
        <div
          className="mb-10 w-full max-w-xs sm:max-w-sm border-[3px] border-primary bg-card shadow-brutal-sm animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="flex divide-x-[2px] divide-primary">
            {[
              { label: "Scene", value: beat },
              { label: "Round", value: round },
              { label: "Moves", value: state.choices.length },
            ].map((item) => (
              <div key={item.label} className="flex-1 py-4 flex flex-col items-center">
                <span className="font-display text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-1">
                  {item.label}
                </span>
                <span className="font-display text-2xl text-accent font-bold">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="border-t-[2px] border-primary px-4 py-3 flex justify-between text-[10px] font-display tracking-wider text-muted-foreground uppercase">
            <span>GHS {state.resources.capital.toLocaleString()}</span>
            <span>Rep {state.resources.reputation}</span>
            <span>Network {state.resources.network}</span>
          </div>
        </div>

        <div className="w-full max-w-xs sm:max-w-sm space-y-3 animate-slide-up" style={{ animationDelay: "0.6s" }}>
          <button
            onClick={handleContinue}
            className="w-full border-[3px] border-primary bg-accent py-4 font-display text-xl tracking-wider text-accent-foreground shadow-brutal transition-transform hover:-translate-y-[1px] active:translate-y-[2px] active:shadow-brutal-sm"
          >
            CONTINUE JOURNEY &#8594;
          </button>
          <button
            onClick={handleStartFresh}
            className="w-full border-[3px] border-primary bg-card py-3.5 font-display text-base tracking-wider text-primary shadow-brutal-sm transition-transform hover:border-accent hover:text-foreground active:translate-y-[2px] active:shadow-none"
          >
            START FRESH
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeSession;
