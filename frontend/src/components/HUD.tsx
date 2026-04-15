"use client";

// HUD — two-zone navy header bar showing layer progress and world-state stats.
// GSAP animates the capital counter on each update; laterite color signals crisis.

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

/** Clamp a value between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function HUD({ clientState, layer }: HUDProps): React.ReactElement {
  const capitalRef = useRef<HTMLSpanElement>(null);
  // Store previous capital value so GSAP can count from it.
  const prevCapitalRef = useRef<number>(clientState.capital);

  const isCrisis = clientState.capital < 1500;
  const barWidth = clamp((clientState.capital / 10000) * 100, 0, 100);

  useEffect(() => {
    // Lazily import GSAP to avoid SSR issues — this component is client-only.
    void import("gsap").then(({ gsap }) => {
      if (!capitalRef.current) return;

      const counter = { value: prevCapitalRef.current };
      gsap.to(counter, {
        value: clientState.capital,
        duration: 0.6,
        ease: "power2.out",
        onUpdate() {
          if (capitalRef.current) {
            capitalRef.current.textContent = formatCapital(counter.value);
          }
        },
        onComplete() {
          prevCapitalRef.current = clientState.capital;
        },
      });
    });
  }, [clientState.capital]);

  return (
    <div
      style={{
        background: "var(--c-navy)",
        padding: "16px 20px 28px",
        position: "relative",
      }}
    >
      {/* Layer progress dots */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        {[1, 2, 3, 4, 5].map((l) => {
          const isCurrent = l === layer;
          const isPast = l < layer;
          return (
            <span
              key={l}
              style={{
                display: "inline-block",
                width: isCurrent ? "16px" : "10px",
                height: isCurrent ? "16px" : "10px",
                borderRadius: "50%",
                background: isCurrent
                  ? "var(--c-amber)"
                  : isPast
                  ? "#ffffff"
                  : "transparent",
                border: isCurrent || isPast ? "none" : "2px solid #ffffff",
                transition: "all 0.3s ease",
              }}
              aria-label={`Layer ${l}${isCurrent ? " (current)" : isPast ? " (complete)" : ""}`}
            />
          );
        })}
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "24px",
        }}
      >
        {/* Capital — large, animated, crisis-aware */}
        <div style={{ flex: 1 }}>
          <span
            ref={capitalRef}
            style={{
              fontFamily: "var(--font-outfit), serif",
              fontSize: "20px",
              fontWeight: 600,
              color: isCrisis ? "var(--c-laterite)" : "#ffffff",
              display: "block",
              animation: isCrisis
                ? "crisis-pulse 1.2s ease-in-out infinite"
                : "none",
              transition: "color 0.4s ease",
            }}
          >
            {formatCapital(clientState.capital)}
          </span>
          {/* Capital progress bar */}
          <div
            style={{
              marginTop: "4px",
              height: "4px",
              borderRadius: "2px",
              background: "rgba(255,255,255,0.15)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${barWidth}%`,
                background: isCrisis ? "var(--c-laterite)" : "var(--c-amber)",
                borderRadius: "2px",
                transition: "width 0.6s ease, background 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Reputation */}
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              fontFamily: "var(--font-press-start), sans-serif",
              fontSize: "11px",
              color: "rgba(255,255,255,0.5)",
              display: "block",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            REP
          </span>
          <span
            style={{
              fontFamily: "var(--font-press-start), sans-serif",
              fontSize: "13px",
              color: "rgba(255,255,255,0.7)",
              fontWeight: 600,
            }}
          >
            {clientState.reputation}
          </span>
        </div>

        {/* Network */}
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              fontFamily: "var(--font-press-start), sans-serif",
              fontSize: "11px",
              color: "rgba(255,255,255,0.5)",
              display: "block",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            NET
          </span>
          <span
            style={{
              fontFamily: "var(--font-press-start), sans-serif",
              fontSize: "13px",
              color: "rgba(255,255,255,0.7)",
              fontWeight: 600,
            }}
          >
            {clientState.networkStrength}
          </span>
        </div>
      </div>

      {/* Curve separator — canvas-colored pill that overlaps the bottom edge */}
      <div className="hud-curve" />
    </div>
  );
}
