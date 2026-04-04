"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import BreathingGrid from "@/components/BreathingGrid";
import RetroTransition from "@/components/RetroTransition";

const beatMessages = [
  "PROCESSING DECISION...",
  "UPDATING MARKET...",
  "RIVALS ARE WATCHING...",
  "DEAL IN PROGRESS...",
  "SHIFTING ALLIANCES...",
  "RECALCULATING ODDS...",
  "SUPPLY CHAIN ALERT...",
  "PIVOTING STRATEGY...",
  "ENDGAME APPROACHING...",
];

const finalMessages = [
  "CALCULATING YOUR ACUMEN...",
  "TALLYING RESULTS...",
  "MEASURING YOUR EMPIRE...",
  "FINAL VERDICT INCOMING...",
];

const formatDelta = (val: number) => {
  if (val > 0) return `+${val.toLocaleString()}`;
  return `${val.toLocaleString()}`;
};

const Gameplay = () => {
  const router = useRouter();
  const { state, makeChoice, isLoading } = useGame();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFinalTransition, setIsFinalTransition] = useState(false);
  const [choiceDisabled, setChoiceDisabled] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    text: string;
    deltas: { capital: number; reputation: number; network: number };
  } | null>(null);

  const previousRoundRef = useRef<number>(state.currentRound);
  const wasCompleteRef = useRef<boolean>(state.isComplete);

  useEffect(() => {
    if (!state.currentBeat && !isLoading) {
      router.replace("/session-expired");
    }
  }, [state.currentBeat, isLoading, router]);

  if (!state.currentBeat) {
    return null;
  }

  const beat = state.currentBeat;
  const transitionMessages = isFinalTransition ? finalMessages : beatMessages.slice(0, 3);

  const handleChoice = useCallback(
    async (index: number) => {
      if (isTransitioning || showFeedback || choiceDisabled) return;

      const choice = beat.choices[index];
      if (!choice) return;

      setChoiceDisabled(true);
      previousRoundRef.current = state.currentRound;
      wasCompleteRef.current = state.isComplete;
      setIsTransitioning(true);

      try {
        const result = await makeChoice(choice.id);
        setFeedbackData({ text: result.feedback, deltas: result.deltas });
        if (state.isComplete || wasCompleteRef.current) {
          setIsFinalTransition(true);
        }
      } catch {
        setChoiceDisabled(false);
        setIsTransitioning(false);
      }
    },
    [isTransitioning, showFeedback, choiceDisabled, beat, state.currentRound, state.isComplete, makeChoice]
  );

  const handleTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
    setShowFeedback(true);
  }, []);

  const handleFeedbackContinue = useCallback(() => {
    setShowFeedback(false);
    setFeedbackData(null);
    setChoiceDisabled(false);

    if (state.isComplete) {
      router.push("/results");
    } else if (previousRoundRef.current > 0 && state.currentRound > previousRoundRef.current) {
      router.push("/round-summary");
    }
  }, [router, state.isComplete, state.currentRound]);

  return (
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      <BreathingGrid />

      {isTransitioning && (
        <RetroTransition
          messages={transitionMessages}
          duration={isFinalTransition ? 2500 : 1500}
          onComplete={handleTransitionComplete}
        />
      )}

      {/* Feedback overlay */}
      {showFeedback && feedbackData && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95">
          <div className="scanlines pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-sm w-full">
            <div className="border-[3px] border-primary bg-card px-5 py-2 shadow-brutal-sm animate-fade-in">
              <span className="font-display text-xs tracking-[0.3em] text-muted-foreground uppercase">
                Consequence
              </span>
            </div>

            <p
              className="font-body text-base text-foreground/90 text-center leading-relaxed animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              {feedbackData.text}
            </p>

            <div
              className="w-full border-[3px] border-primary bg-card shadow-brutal-sm animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex divide-x-[2px] divide-primary">
                {[
                  { label: "Capital", delta: feedbackData.deltas.capital },
                  { label: "Rep", delta: feedbackData.deltas.reputation },
                  { label: "Network", delta: feedbackData.deltas.network },
                ].map((item) => (
                  <div key={item.label} className="flex-1 py-4 flex flex-col items-center">
                    <span className="font-display text-[9px] tracking-[0.15em] text-muted-foreground uppercase mb-1">
                      {item.label}
                    </span>
                    <span
                      className={`font-display text-sm font-bold ${
                        item.delta >= 0 ? "text-accent" : "text-destructive"
                      }`}
                    >
                      {formatDelta(item.delta)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleFeedbackContinue}
              className="w-full border-[3px] border-primary bg-accent py-3.5 font-display text-base tracking-wider text-accent-foreground shadow-brutal transition-transform hover:-translate-y-[1px] active:translate-y-[2px] active:shadow-brutal-sm animate-slide-up"
              style={{ animationDelay: "0.4s" }}
            >
              CONTINUE &#8594;
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-1 flex-col px-5 py-6 max-w-2xl mx-auto w-full">
        {/* Beat / Round indicator */}
        <div className="mb-3 flex items-center justify-center">
          <span className="font-display text-xs tracking-[0.3em] text-muted-foreground uppercase">
            Decision {state.choices.length + 1} &middot; Round {beat.round}/3
          </span>
        </div>

        {/* Resource HUD */}
        <div className="mt-2 mb-4 flex border-[3px] border-primary bg-card shadow-brutal-sm">
          {[
            { label: "Capital", value: `GHS ${state.resources.capital.toLocaleString()}` },
            { label: "Rep", value: `${state.resources.reputation}` },
            { label: "Network", value: `${state.resources.network}` },
            { label: "Momentum", value: `x${state.resources.momentumMultiplier.toFixed(1)}` },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`flex flex-1 flex-col items-center justify-center text-center py-2.5 ${
                i < 3 ? "border-r-[2px] border-primary" : ""
              }`}
            >
              <span className="font-display text-[8px] tracking-[0.2em] text-muted-foreground uppercase mb-1">
                {stat.label}
              </span>
              <span className="font-display text-[10px] text-accent font-bold">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Narrative */}
        <div className="mb-6 flex-1 flex flex-col justify-center">
          <h3 className="mb-3 font-display text-xl text-primary">{beat.title}</h3>
          <p className="font-body text-base leading-relaxed text-foreground/90">{beat.storyText}</p>
        </div>

        {/* Choices */}
        <div className="space-y-3 pb-4">
          {beat.choices.map((choice, i) => {
            const label = String.fromCharCode(65 + i);
            return (
              <button
                key={choice.id}
                onClick={() => handleChoice(i)}
                disabled={isTransitioning || showFeedback || choiceDisabled}
                className="flex w-full items-start gap-3 border-[3px] border-primary bg-card px-4 py-3.5 text-left shadow-brutal-sm transition-all active:translate-y-[2px] active:shadow-none hover:border-accent group disabled:opacity-50"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center border-[2px] border-primary bg-accent font-display text-sm text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {label}
                </span>
                <span className="font-body text-sm leading-snug text-foreground/90 pt-1">
                  {choice.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Gameplay;
