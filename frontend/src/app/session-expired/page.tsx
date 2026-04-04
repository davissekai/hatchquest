"use client";

import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import BreathingGrid from "@/components/BreathingGrid";

const SessionExpired = () => {
  const router = useRouter();
  const { clearSession } = useGame();

  const handleNewGame = () => {
    clearSession();
    router.push("/");
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      <BreathingGrid />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 animate-fade-in border-[3px] border-primary bg-card px-5 py-2 shadow-brutal-sm">
          <span className="font-display text-xs tracking-[0.3em] text-muted-foreground uppercase">
            Session Lost
          </span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl leading-none tracking-tight text-primary animate-slide-up mb-4">
          SESSION
          <br />
          <span className="text-accent">EXPIRED</span>
        </h1>

        <p className="mt-2 mb-10 max-w-xs text-base font-body text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Your previous session expired. Every empire has its setbacks — time to build a new one.
        </p>

        <div className="w-full max-w-xs animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <button
            onClick={handleNewGame}
            className="w-full border-[3px] border-primary bg-accent py-4 font-display text-xl tracking-wider text-accent-foreground shadow-brutal transition-transform hover:-translate-y-[1px] active:translate-y-[2px] active:shadow-brutal-sm"
          >
            START NEW GAME &#8594;
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpired;
