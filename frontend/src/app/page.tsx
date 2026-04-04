"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import BreathingGrid from "@/components/BreathingGrid";

const Landing = () => {
  const router = useRouter();
  const { hasActiveSession } = useGame();

  useEffect(() => {
    if (hasActiveSession()) {
      router.replace("/resume");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      <BreathingGrid />

      <div className="relative z-10 flex flex-1 flex-col md:flex-row">

        {/* Left panel — massive title */}
        <div className="flex flex-1 flex-col justify-center px-8 sm:px-12 pt-20 pb-6 md:pl-16 md:pr-14 md:pt-0 md:pb-0 md:border-r-[2px] md:border-primary">
          {/* UGBS Nest logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://static.wixstatic.com/media/92d5b3_0b1534c57ece4fb1b164d83e0285f0c4~mv2.jpg/v1/fit/w_2500,h_1330,al_c/92d5b3_0b1534c57ece4fb1b164d83e0285f0c4~mv2.jpg"
            alt="UGBS Nest"
            className="w-20 h-20 rounded-full object-cover mb-5 animate-fade-in self-start shadow-brutal"
          />

          <div className="mb-6 animate-fade-in border-[3px] border-primary bg-card px-4 py-1.5 shadow-brutal-sm self-start">
            <span className="font-display text-xs tracking-widest text-primary uppercase">
              Entrepreneurship Simulator
            </span>
          </div>
          <h1
            className="font-display leading-[0.9] tracking-tight text-foreground animate-slide-up [text-shadow:4px_4px_0px_var(--color-primary)]"
            style={{ fontSize: "clamp(4rem, 9vw, 10rem)" }}
          >
            HATCH
            <br />
            <span className="text-accent">QUEST</span>
          </h1>
        </div>

        {/* Right panel — tagline + CTA */}
        <div className="md:w-[40%] flex flex-col justify-end md:justify-center px-8 sm:px-12 pb-10 md:pl-14 md:pr-16 md:pb-0">
          <p
            className="mb-8 text-lg font-body text-muted-foreground animate-fade-in max-w-xs"
            style={{ animationDelay: "0.3s" }}
          >
            Build your empire in <strong className="text-primary">Accra</strong>. Make bold decisions. Prove your entrepreneurial acumen.
          </p>
          <button
            onClick={() => router.push("/create")}
            className="w-full border-[3px] border-primary bg-accent py-4 font-display text-xl tracking-wider text-accent-foreground shadow-brutal transition-transform hover:-translate-y-[1px] active:translate-y-[2px] active:shadow-brutal-sm animate-slide-up"
            style={{ animationDelay: "0.6s" }}
          >
            BEGIN JOURNEY →
          </button>
        </div>

      </div>
    </div>
  );
};

export default Landing;
