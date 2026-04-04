"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import BreathingGrid from "@/components/BreathingGrid";
import AnimatedScore from "@/components/AnimatedScore";
import RadarChart from "@/components/RadarChart";

const getVerdict = (score: number) => {
  if (score >= 85) return { text: "Visionary Founder", desc: "You balance ambition with wisdom. Accra's next big thing." };
  if (score >= 68) return { text: "Sharp Operator", desc: "Calculated, resourceful, consistent. You know how to play the game." };
  if (score >= 52) return { text: "Promising Entrepreneur", desc: "Strong instincts. A few more lessons and you'll be unstoppable." };
  return { text: "Emerging Hustler", desc: "You've got the spirit. Keep learning, keep building." };
};

const Results = () => {
  const router = useRouter();
  const { state, loadResults, resetGame } = useGame();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadResults().catch(() => {});
  }, []);

  const [copied, setCopied] = useState(false);

  const score = state.score;
  const verdict = getVerdict(score);
  const capitalBarWidth = Math.min(100, (state.resources.capital / 50000) * 100);

  const handlePlayAgain = () => {
    resetGame();
    router.push("/");
  };

  const handleShare = () => {
    const text = `I scored ${score.toFixed(1)} on HatchQuest! I'm a "${verdict.text}". Can you beat me?`;
    if (navigator.share) {
      navigator.share({ title: "HatchQuest Results", text });
    } else {
      navigator.clipboard?.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      <BreathingGrid />

      <div className="relative z-10 flex flex-1 flex-col items-center px-6 pt-16 pb-8">
        {/* Header */}
        <span className="mb-2 font-display text-xs tracking-[0.3em] text-muted-foreground uppercase animate-fade-in">
          Your Results
        </span>

        {/* Score */}
        <div className="mb-2 animate-count-up">
          <AnimatedScore target={score} />
        </div>
        <span className="font-display text-sm tracking-widest text-primary uppercase">
          Acumen Score
        </span>

        {/* Verdict */}
        <div
          className="mt-5 mb-8 border-[3px] border-primary bg-card px-6 py-4 shadow-brutal text-center animate-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          <h2 className="font-display text-2xl text-accent mb-1">{verdict.text}</h2>
          <p className="font-body text-sm text-muted-foreground">{verdict.desc}</p>
        </div>

        {/* Radar + Resources: stack on mobile, side-by-side on sm+ */}
        <div className="w-full max-w-xs sm:max-w-2xl sm:grid sm:grid-cols-2 sm:gap-8 sm:items-start mb-8">

        {/* Radar Chart */}
        <div className="mb-6 sm:mb-0 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <h3 className="font-display text-xs tracking-[0.2em] text-primary text-center uppercase mb-3">
            Entrepreneurial Profile
          </h3>
          <div className="border-[3px] border-primary bg-card p-4 shadow-brutal-sm">
            <RadarChart dimensions={state.dimensions} />
          </div>
        </div>

        {/* Resources */}
        <div className="sm:mb-0 animate-fade-in" style={{ animationDelay: "0.8s" }}>
          <h3 className="font-display text-xs tracking-[0.2em] text-primary text-center uppercase mb-3">
            Final Resources
          </h3>
          <div className="space-y-3">
            {/* Capital */}
            <div className="border-[3px] border-primary bg-card px-4 py-3 shadow-brutal-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-display text-sm text-primary uppercase">Capital</span>
                <span className="font-display text-lg text-accent whitespace-nowrap">
                  GHS {state.resources.capital.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full border-[2px] border-primary bg-muted overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-1000"
                  style={{ width: `${capitalBarWidth}%` }}
                />
              </div>
            </div>

            {/* Reputation */}
            <div className="border-[3px] border-primary bg-card px-4 py-3 shadow-brutal-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-display text-sm text-primary uppercase">Reputation</span>
                <span className="font-display text-lg text-accent">{state.resources.reputation}</span>
              </div>
              <div className="h-2 w-full border-[2px] border-primary bg-muted overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-1000"
                  style={{ width: `${Math.min(100, (state.resources.reputation / 80) * 100)}%` }}
                />
              </div>
            </div>

            {/* Network */}
            <div className="border-[3px] border-primary bg-card px-4 py-3 shadow-brutal-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-display text-sm text-primary uppercase">Network</span>
                <span className="font-display text-lg text-accent">{state.resources.network}</span>
              </div>
              <div className="h-2 w-full border-[2px] border-primary bg-muted overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-1000"
                  style={{ width: `${Math.min(100, (state.resources.network / 80) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        </div>{/* end radar+resources grid */}

        {/* Actions */}
        <div className="w-full max-w-xs sm:max-w-sm space-y-3 pb-8 animate-slide-up" style={{ animationDelay: "1s" }}>
          <button
            onClick={handlePlayAgain}
            className="w-full border-[3px] border-primary bg-accent py-3.5 font-display text-base tracking-wider text-accent-foreground shadow-brutal transition-transform hover:-translate-y-[1px] active:translate-y-[2px] active:shadow-brutal-sm"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={handleShare}
            className="w-full border-[3px] border-primary bg-card py-3 font-display text-sm tracking-wider text-muted-foreground transition-transform hover:border-accent hover:text-foreground active:translate-y-[2px]"
          >
            {copied ? "COPIED!" : "SHARE RESULTS"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
