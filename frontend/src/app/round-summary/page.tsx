"use client";

import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import BreathingGrid from "@/components/BreathingGrid";

const RoundSummary = () => {
  const router = useRouter();
  const { state } = useGame();

  const round = state.currentRound - 1;
  const isLastRound = round >= 3;
  const capitalBarWidth = Math.min(100, (state.resources.capital / 50000) * 100);

  return (
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      <BreathingGrid />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 animate-fade-in border-[3px] border-primary bg-card px-5 py-2 shadow-brutal-sm">
          <span className="font-display text-xs tracking-[0.3em] text-muted-foreground uppercase">
            Round Complete
          </span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl leading-none tracking-tight text-primary animate-slide-up mb-2">
          ROUND
          <br />
          <span className="text-accent">{round}</span>
        </h1>

        <p
          className="mt-4 mb-8 max-w-xs text-base font-body text-muted-foreground animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          {round === 1
            ? "You've survived the first test. The market is watching."
            : `Round ${round} complete. Your empire grows stronger.`}
        </p>

        {/* Resource snapshot */}
        <div
          className="mb-10 w-full max-w-xs sm:max-w-sm border-[3px] border-primary bg-card shadow-brutal-sm animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="px-4 py-3 border-b-[2px] border-primary">
            <span className="font-display text-xs tracking-[0.2em] text-primary uppercase">
              Resource Snapshot
            </span>
          </div>
          <div className="space-y-0">
            <div className="flex flex-col px-4 py-3 border-b-[2px] border-primary gap-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm text-primary uppercase">Capital</span>
                <span className="font-display text-xs text-accent whitespace-nowrap">
                  GHS {state.resources.capital.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 border-[2px] border-primary bg-muted">
                <div
                  className="h-full bg-accent transition-all duration-700"
                  style={{ width: `${capitalBarWidth}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-b-[2px] border-primary">
              <span className="font-display text-sm text-primary uppercase">Reputation</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 border-[2px] border-primary bg-muted">
                  <div
                    className="h-full bg-accent transition-all duration-700"
                    style={{ width: `${Math.min(100, (state.resources.reputation / 80) * 100)}%` }}
                  />
                </div>
                <span className="font-display text-sm text-accent w-8 text-right">
                  {state.resources.reputation}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-display text-sm text-primary uppercase">Network</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 border-[2px] border-primary bg-muted">
                  <div
                    className="h-full bg-accent transition-all duration-700"
                    style={{ width: `${Math.min(100, (state.resources.network / 80) * 100)}%` }}
                  />
                </div>
                <span className="font-display text-sm text-accent w-8 text-right">
                  {state.resources.network}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-xs sm:max-w-sm animate-slide-up" style={{ animationDelay: "0.6s" }}>
          <button
            onClick={() => router.push(isLastRound ? "/results" : "/play")}
            className="w-full border-[3px] border-primary bg-accent py-4 font-display text-xl tracking-wider text-accent-foreground shadow-brutal transition-transform hover:-translate-y-[1px] active:translate-y-[2px] active:shadow-brutal-sm"
          >
            {isLastRound ? "VIEW RESULTS →" : "NEXT ROUND →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoundSummary;
