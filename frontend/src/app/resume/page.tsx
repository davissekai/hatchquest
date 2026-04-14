"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame, SessionPhase } from "@/context/GameContext";

// Resume — hydrates an in-progress session from localStorage.
const ResumeSession = () => {
  const router = useRouter();
  const { resumeSession, resetGame, state, isLoading } = useGame();
  const [resumeAttempted, setResumeAttempted] = useState(false);
  const [canResume, setCanResume] = useState(false);
  const [phase, setPhase] = useState<SessionPhase>("idle");

  useEffect(() => {
    resumeSession().then((phase) => {
      setResumeAttempted(true);
      setCanResume(phase !== "idle");
      setPhase(phase);
      if (phase === "idle") {
        router.replace("/create");
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const capital = state.clientState?.capital ?? 0;
  const layer = state.clientState?.layer ?? 1;
  const turns = state.clientState?.turnsElapsed ?? 0;

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading || !resumeAttempted) {
    return (
      <div
        className="min-h-[100dvh] flex items-center justify-center"
        style={{ background: "var(--c-navy)" }}
      >
        <span
          className="font-display uppercase animate-pulse"
          style={{ fontSize: "10px", letterSpacing: "0.3em", color: "var(--c-amber)" }}
        >
          RECONNECTING...
        </span>
      </div>
    );
  }

  // ── Expired ──────────────────────────────────────────────────────────────────
  if (!canResume) {
    return (
      <div className="min-h-[100dvh] flex flex-col" style={{ background: "var(--c-canvas)" }}>
        <div
          style={{ background: "var(--c-laterite)" }}
          className="flex flex-col justify-end px-6 pt-14 pb-10 flex-[0_0_42%]"
        >
          <span
            className="font-display uppercase mb-4"
            style={{ fontSize: "9px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.6)" }}
          >
            SESSION EXPIRED
          </span>
          <h1
            className="font-body italic"
            style={{ fontSize: "clamp(2.2rem, 9vw, 3.5rem)", color: "#fff", lineHeight: 1.05 }}
          >
            Your journey
            <br />
            was lost.
          </h1>
          <p
            className="font-body mt-3"
            style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}
          >
            Every founder faces setbacks. The question is whether you rebuild.
          </p>
        </div>
        <div className="hud-curve" style={{ background: "var(--c-canvas)" }} />
        <div className="flex-1 flex flex-col justify-end px-6 pb-10">
          <button
            onClick={() => { resetGame(); router.push("/create"); }}
            className="font-display uppercase w-full"
            style={{
              background: "var(--c-navy)",
              color: "var(--c-amber)",
              fontSize: "12px",
              letterSpacing: "0.2em",
              padding: "16px",
              border: "none",
              cursor: "pointer",
            }}
          >
            START FRESH →
          </button>
        </div>
      </div>
    );
  }

  // ── Active session ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "var(--c-canvas)" }}>

      {/* Zone 1 — navy */}
      <div
        style={{ background: "var(--c-navy)" }}
        className="flex flex-col justify-end px-6 pt-14 pb-10 flex-[0_0_42%]"
      >
        <span
          className="font-display uppercase mb-4"
          style={{ fontSize: "9px", letterSpacing: "0.3em", color: "var(--c-amber)" }}
        >
          JOURNEY IN PROGRESS
        </span>
        <h1
          className="font-body italic"
          style={{ fontSize: "clamp(2.2rem, 9vw, 3.5rem)", color: "#fff", lineHeight: 1.05 }}
        >
          Still in the
          <br />
          game.
        </h1>
      </div>

      {/* Curve */}
      <div className="hud-curve" />

      {/* Zone 2 — stats + actions */}
      <div className="flex-1 flex flex-col px-6 pt-6 pb-10">

        {/* Stats strip */}
        <div
          className="grid grid-cols-3 mb-8"
          style={{ borderTop: "1px solid rgba(21,5,120,0.15)", borderBottom: "1px solid rgba(21,5,120,0.15)" }}
        >
          {[
            { label: "LAYER", value: layer },
            { label: "DECISIONS", value: turns },
            { label: "CAPITAL", value: `₵${(capital / 1000).toFixed(1)}k` },
          ].map((s, i) => (
            <div
              key={s.label}
              className="flex flex-col items-center py-5"
              style={{ borderRight: i < 2 ? "1px solid rgba(21,5,120,0.15)" : "none" }}
            >
              <span
                className="font-display uppercase mb-1"
                style={{ fontSize: "8px", letterSpacing: "0.2em", color: "rgba(21,5,120,0.45)" }}
              >
                {s.label}
              </span>
              <span
                className="font-body"
                style={{ fontSize: "22px", color: "var(--c-navy)", fontWeight: 500 }}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-3 mt-auto">
          <button
            onClick={() => {
              if (phase === "layer0") router.push("/layer0");
              else if (phase === "complete") router.push("/results");
              else router.push("/play");
            }}
            className="font-display uppercase w-full"
            style={{
              background: "var(--c-navy)",
              color: "var(--c-amber)",
              fontSize: "12px",
              letterSpacing: "0.2em",
              padding: "16px",
              border: "none",
              cursor: "pointer",
            }}
          >
            CONTINUE JOURNEY →
          </button>
          <button
            onClick={() => { resetGame(); router.push("/create"); }}
            className="font-display uppercase w-full"
            style={{
              background: "transparent",
              color: "var(--c-navy)",
              fontSize: "11px",
              letterSpacing: "0.2em",
              padding: "14px",
              border: "1.5px solid rgba(21,5,120,0.25)",
              cursor: "pointer",
              opacity: 0.7,
            }}
          >
            START FRESH
          </button>
        </div>
      </div>

    </div>
  );
};

export default ResumeSession;
