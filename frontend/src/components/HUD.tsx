"use client";

import { useEffect, useRef } from "react";
import type { ClientWorldState } from "@hatchquest/shared";

interface HUDProps {
  clientState: ClientWorldState;
  layer: number;
}

/** Format a number as "GHS X,XXX" with comma-separated thousands. */
function formatCapital(value: number): string {
  return `GHS ${Math.round(value).toLocaleString("en-GH")}`;
}

export function HUD({ clientState, layer }: HUDProps): React.ReactElement {
  const capitalRef = useRef<HTMLSpanElement>(null);
  const prevCapitalRef = useRef<number>(clientState?.capital || 0);

  const capital = clientState?.capital ?? 0;
  const reputation = clientState?.reputation ?? 0;
  const network = clientState?.networkStrength ?? 0;

  useEffect(() => {
    void import("gsap").then(({ gsap }) => {
      if (!capitalRef.current) return;
      const counter = { value: prevCapitalRef.current };
      gsap.to(counter, {
        value: capital,
        duration: 0.6,
        ease: "power2.out",
        onUpdate() {
          if (capitalRef.current) {
            capitalRef.current.textContent = formatCapital(counter.value);
          }
        },
        onComplete() {
          prevCapitalRef.current = capital;
        },
      });
    });
  }, [capital]);

  return (
    <div className="m-4 bg-navy/95 backdrop-blur-xl text-white px-10 py-5 rounded-full shadow-[0_20px_60px_rgba(30,58,138,0.3)] border-4 border-white flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Layer progress dots */}
      <div className="flex items-center gap-2">
        <span className="font-headline font-extrabold uppercase tracking-widest text-lime mr-2">Layer {layer}</span>
        {[1, 2, 3, 4, 5].map((l) => {
          const isCurrent = l === layer;
          const isPast = l < layer;
          return (
            <span
              key={l}
              className={`inline-block w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                isCurrent
                  ? "bg-lime border-lime scale-110 shadow-[0_0_10px_rgba(57,255,20,0.5)]"
                  : isPast
                  ? "bg-electric-cyan border-electric-cyan"
                  : "bg-transparent border-white/50"
              }`}
              aria-label={`Layer ${l}${isCurrent ? " (current)" : isPast ? " (complete)" : ""}`}
            />
          );
        })}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6 md:gap-10 bg-white/10 px-6 py-2 rounded-full border border-white/20">
        {/* Capital */}
        <div className="flex flex-col items-center">
          <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-lime">Capital</span>
          <span
            ref={capitalRef}
            className="font-headline text-xl font-black tracking-tight drop-shadow-sm"
          >
            {formatCapital(capital)}
          </span>
        </div>

        <div className="w-px h-8 bg-white/20" />

        {/* Reputation */}
        <div className="flex flex-col items-center">
          <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-hot-pink">Rep</span>
          <span className="font-headline text-xl font-black tracking-tight drop-shadow-sm">
            {reputation}
          </span>
        </div>

        <div className="w-px h-8 bg-white/20" />

        {/* Network */}
        <div className="flex flex-col items-center">
          <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-electric-cyan">Net</span>
          <span className="font-headline text-xl font-black tracking-tight drop-shadow-sm">
            {network}
          </span>
        </div>
      </div>
    </div>
  );
}
