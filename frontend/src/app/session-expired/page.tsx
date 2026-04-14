"use client";

import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";

const SessionExpired = () => {
  const router = useRouter();
  const { resetGame } = useGame();

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "var(--c-canvas)" }}>

      {/* Zone 1 — laterite crisis */}
      <div
        style={{ background: "var(--c-laterite)" }}
        className="flex flex-col justify-end px-6 pt-14 pb-10 flex-[0_0_45%]"
      >
        <span
          className="font-display uppercase mb-4"
          style={{ fontSize: "9px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.6)" }}
        >
          SESSION TERMINATED
        </span>
        <h1
          className="font-body italic"
          style={{ fontSize: "clamp(2.4rem, 10vw, 4rem)", color: "#fff", lineHeight: 1.0 }}
        >
          The market
          <br />
          didn&apos;t wait.
        </h1>
        <p
          className="font-body mt-3"
          style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, maxWidth: "34ch" }}
        >
          Your session expired. Every founder faces setbacks — the question is
          what you do next.
        </p>
      </div>

      {/* Curve */}
      <div className="hud-curve" />

      {/* Zone 2 */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-10">
        <button
          onClick={() => { resetGame(); router.push("/"); }}
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
          START NEW GAME →
        </button>
      </div>

    </div>
  );
};

export default SessionExpired;
