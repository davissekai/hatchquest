"use client";

import type { ClientWorldState } from "@hatchquest/shared";

interface WorldHUDProps {
  clientState: ClientWorldState;
}

interface BarProps {
  label: string;
  value: number; // [0-100]
  color: string;
}

/** Single signal bar — label, value badge, and a coloured fill bar. */
const SignalBar = ({ label, value, color }: BarProps) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-center">
      <span className="font-headline font-black text-[10px] uppercase tracking-widest text-navy/50">
        {label}
      </span>
      <span className="font-headline font-black text-xs text-navy/70">
        {Math.round(value)}
      </span>
    </div>
    <div className="h-2 w-full rounded-full bg-white/40 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.max(2, Math.round(value))}%` }}
      />
    </div>
  </div>
);

/**
 * WorldHUD — displays live Accra market signals derived from clientState.worldSignals.
 * Renders demand, competition, and infrastructure bars plus the most recent world event label.
 */
export const WorldHUD = ({ clientState }: WorldHUDProps) => {
  const signals = clientState.worldSignals;
  const lastEvent = signals.lastEventLabel;

  return (
    <div className="bg-white/80 backdrop-blur-md border-4 border-white rounded-[2rem] p-4 space-y-3 shadow-[0_8px_24px_rgba(30,58,138,0.08)]">
      <p className="font-headline font-black text-[10px] uppercase tracking-[0.25em] text-navy/40 text-center">
        Accra Markets
      </p>
      <SignalBar
        label="Demand"
        value={signals.marketHeat}
        color="bg-lime"
      />
      <SignalBar
        label="Competition"
        value={signals.competitorThreat}
        color="bg-hot-pink"
      />
      <SignalBar
        label="Infrastructure"
        value={signals.infrastructureStability}
        color="bg-electric-cyan"
      />
      {lastEvent && (
        <p className="font-headline font-bold text-[10px] text-navy/60 uppercase tracking-wider pt-1 border-t-2 border-white/60 truncate">
          ⚡ {lastEvent}
        </p>
      )}
      {signals.secondarySignals.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1 border-t-2 border-white/60">
          {signals.secondarySignals.map((signal) => (
            <span
              key={signal}
              className="font-headline font-bold text-[9px] uppercase tracking-wider text-navy/70 bg-white/60 rounded-full px-2 py-0.5"
            >
              {signal}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorldHUD;
