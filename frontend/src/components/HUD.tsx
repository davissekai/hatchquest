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
    <div className="bg-navy text-white px-6 py-4 border-b-4 border-electric-yellow relative flex items-center justify-between">
      {/* Layer progress dots */}
      <div className="flex items-center gap-2">
        <span className="font-headline font-extrabold uppercase tracking-widest text-electric-yellow mr-2">Layer {layer}</span>
        {[1, 2, 3, 4, 5].map((l) => {
          const isCurrent = l === layer;
          const isPast = l < layer;
          return (
            <span
              key={l}
              className={`inline-block w-3 h-3 border-2 ${
                isCurrent
                  ? "bg-electric-yellow border-electric-yellow"
                  : isPast
                  ? "bg-white border-white"
                  : "bg-transparent border-white"
              }`}
              aria-label={`Layer ${l}${isCurrent ? " (current)" : isPast ? " (complete)" : ""}`}
            />
          );
        })}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-8">
        {/* Capital */}
        <div className="flex flex-col items-end">
          <span className="font-headline text-xs font-bold uppercase tracking-widest text-electric-yellow/80">Capital</span>
          <span
            ref={capitalRef}
            className="font-headline text-2xl font-black tracking-tight"
          >
            {formatCapital(capital)}
          </span>
        </div>

        {/* Reputation */}
        <div className="flex flex-col items-end">
          <span className="font-headline text-xs font-bold uppercase tracking-widest text-electric-yellow/80">Rep</span>
          <span className="font-headline text-2xl font-black tracking-tight">
            {reputation}
          </span>
        </div>

        {/* Network */}
        <div className="flex flex-col items-end">
          <span className="font-headline text-xs font-bold uppercase tracking-widest text-electric-yellow/80">Net</span>
          <span className="font-headline text-2xl font-black tracking-tight">
            {network}
          </span>
        </div>
      </div>
    </div>
  );
}
