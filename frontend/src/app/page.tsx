"use client";

import { useState, useEffect, useRef, FormEvent, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Briefcase,
  Users,
  Shield,
  ChevronRight,
  ArrowUp,
  Globe,
  X,
} from "lucide-react";
import { GameButton } from "@/components/UI";
import { useGame } from "@/context/GameContext";
import type { EOProfile } from "@hatchquest/shared";

function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
}

type Screen =
  | "splash"
  | "setup"
  | "prologue"
  | "interview"
  | "main"
  | "summary"
  | "calculating";

interface InterviewMsg {
  id: string;
  sender: "system" | "player";
  text: string;
}

const EO_AXES: { key: keyof EOProfile; label: string }[] = [
  { key: "autonomy", label: "Autonomy" },
  { key: "innovativeness", label: "Innovativeness" },
  { key: "riskTaking", label: "Risk-Taking" },
  { key: "proactiveness", label: "Proactiveness" },
  { key: "competitiveAggressiveness", label: "Aggressiveness" },
];

const StreetArtBackground = ({ isSplash }: { isSplash?: boolean }) => {
  if (isSplash) {
    return (
      <div
        className="fixed inset-0 pointer-events-none z-[-1] bg-cover bg-center"
        style={{
          backgroundImage:
            'url("/backdrop.jpg"), url("/backdrop.png"), url("/backdrop.jpeg")',
          backgroundColor: "var(--color-game-yellow)",
        }}
      >
        <div className="absolute inset-0 bg-game-yellow/20 mix-blend-multiply" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-game-yellow">
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(#0F172A 3px, transparent 3px)",
          backgroundSize: "24px 24px",
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polyline
          points="0,100 150,250 200,50 400,300 500,100"
          fill="none"
          stroke="#0F172A"
          strokeWidth="12"
        />
        <circle
          cx="80%"
          cy="20%"
          r="50"
          fill="none"
          stroke="#0F172A"
          strokeWidth="10"
          strokeDasharray="20 10"
        />
        <circle
          cx="15%"
          cy="70%"
          r="80"
          fill="none"
          stroke="#EF233C"
          strokeWidth="15"
        />
        <rect
          x="70%"
          y="60%"
          width="120"
          height="120"
          fill="none"
          stroke="#33CA7F"
          strokeWidth="10"
          transform="rotate(15 800 600)"
        />
        <path
          d="M 300 500 Q 500 300 700 500"
          fill="none"
          stroke="#1BE7FF"
          strokeWidth="15"
        />
      </svg>
    </div>
  );
};

function useStatFlicker(value: number) {
  const [flicker, setFlicker] = useState<"up" | "down" | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    const next =
      value > prevRef.current ? "up" : value < prevRef.current ? "down" : null;
    prevRef.current = value;
    if (!next) return;
    const t1 = setTimeout(() => setFlicker(next), 0);
    const t2 = setTimeout(() => setFlicker(null), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [value]);

  return flicker;
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    let startTimestamp: number;
    const duration = 800;
    const startValue = prevValue.current;
    const change = value - startValue;

    if (change === 0) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress =
        progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.round(startValue + change * easeProgress));

      if (progress < 1) window.requestAnimationFrame(step);
      else prevValue.current = value;
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <>{displayValue.toLocaleString()}</>;
}

const FlickerOverlay = ({ status }: { status: "up" | "down" | null }) => (
  <AnimatePresence>
    {status && (
      <motion.div
        initial={{ opacity: 0.8, scale: 0.9, filter: "brightness(2)" }}
        animate={{ opacity: 0, scale: 1.15, filter: "brightness(1)" }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`absolute -inset-3 z-0 rounded-xl pointer-events-none blur-[6px] ${
          status === "up" ? "bg-[#33ca7f]/60" : "bg-[#ef233c]/60"
        }`}
      />
    )}
  </AnimatePresence>
);

const ReactiveBlock = ({
  value,
  children,
  className = "",
}: {
  value: number;
  children: ReactNode;
  className?: string;
}) => {
  const flicker = useStatFlicker(value);
  return (
    <div className={`relative ${className}`}>
      <FlickerOverlay status={flicker} />
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};

const WorldSignalBar = ({
  label,
  value,
  baseClass,
}: {
  label: string;
  value: number;
  baseClass: string;
}) => {
  const prev = useRef(value);
  const [pulseType, setPulseType] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    const diff = value - prev.current;
    prev.current = value;
    if (Math.abs(diff) < 5) return;
    const t1 = setTimeout(() => setPulseType(diff > 0 ? "up" : "down"), 0);
    const t2 = setTimeout(() => setPulseType(null), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [value]);

  return (
    <div className="flex items-center gap-2 relative">
      <span className="text-[10px] font-black w-8 tracking-wider">{label}</span>
      <div className="flex-1 h-3 bg-slate-200 border-2 border-game-dark rounded-sm overflow-hidden relative shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${value}%`,
            filter: pulseType
              ? [
                  "brightness(2) drop-shadow(0 0 6px white)",
                  "brightness(1) drop-shadow(0 0 0px white)",
                ]
              : "brightness(1)",
          }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className={`absolute inset-y-0 left-0 ${baseClass}`}
        />
      </div>
      <AnimatePresence>
        {pulseType && (
          <motion.div
            initial={{ opacity: 0.8, scaleX: 1, filter: "brightness(2)" }}
            animate={{ opacity: 0, scaleX: 1.1, filter: "brightness(1)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className={`absolute left-10 right-0 top-0 bottom-0 z-0 rounded pointer-events-none blur-[4px] mix-blend-screen ${
              pulseType === "up" ? "bg-[#33ca7f]/80" : "bg-[#ef233c]/80"
            }`}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default function HatchQuestApp() {
  const {
    state,
    phase,
    isLoading,
    error,
    startGame,
    submitQ1,
    submitQ2,
    makeChoice,
    resumeSession,
    loadResults,
    resetGame,
    hasActiveSession,
  } = useGame();

  const [screen, setScreen] = useState<Screen>("splash");
  const [interviewMsgs, setInterviewMsgs] = useState<InterviewMsg[]>([]);
  const [interviewStage, setInterviewStage] = useState(0);
  const [interviewInput, setInterviewInput] = useState("");
  const [isTypingChoice, setIsTypingChoice] = useState(false);
  const [customChoiceInput, setCustomChoiceInput] = useState("");
  const [metroBulletin, setMetroBulletin] = useState<string | null>(null);
  const [playerNameLocal, setPlayerNameLocal] = useState("");
  const [hasSavedSession, setHasSavedSession] = useState(false);

  const prevEventRef = useRef<string | null>(null);
  const bulletinCountRef = useRef(0);

  // ── Session resume on mount ───────────────────────────────────────────────
  // On mount: only check for saved session — never auto-navigate.
  // User chooses Resume or New Game from the splash.
  useEffect(() => {
    setHasSavedSession(hasActiveSession());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Layer0 question hydration — seed interview once we have Q1 prompt ─────
  useEffect(() => {
    if (screen === "interview" && state.layer0Question && interviewMsgs.length === 0) {
      setInterviewMsgs([
        { id: "q1-sys", sender: "system", text: state.layer0Question },
      ]);
      setInterviewStage(0);
    }
  }, [screen, state.layer0Question, interviewMsgs.length]);

  // ── Metro Bulletin — fires on lastEventLabel change ───────────────────────
  useEffect(() => {
    const label = state.clientState?.worldSignals?.lastEventLabel ?? null;
    if (label && label !== prevEventRef.current) {
      prevEventRef.current = label;
      bulletinCountRef.current += 1;
      if (bulletinCountRef.current % 2 === 0) {
        setMetroBulletin(label);
        const t = setTimeout(() => setMetroBulletin(null), 10000);
        return () => clearTimeout(t);
      }
    }
  }, [state.clientState?.worldSignals?.lastEventLabel]);

  // ── Completion flow — load results then show summary ──────────────────────
  useEffect(() => {
    if (phase === "complete" && state.results && screen !== "summary") {
      setScreen("summary");
    }
  }, [phase, state.results, screen]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStart = () => {
    resetGame();
    setHasSavedSession(false);
    setScreen("setup");
  };

  const handleResume = async () => {
    const next = await resumeSession();
    if (next === "layer0") { setInterviewStage(0); setScreen("interview"); }
    else if (next === "active") setScreen("main");
    else if (next === "complete") { resetGame(); setScreen("setup"); }
    else setScreen("setup");
  };

  const handleSetupSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    setPlayerNameLocal(name);
    try {
      await startGame(name, email, password);
      setScreen("prologue");
    } catch {
      /* error via context */
    }
  };

  const startInterview = () => {
    setInterviewMsgs([]);
    setInterviewStage(0);
    setScreen("interview");
  };

  const handleInterviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!interviewInput.trim()) return;
    const playerText = interviewInput.trim();
    setInterviewMsgs((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "player", text: playerText },
    ]);
    setInterviewInput("");

    if (interviewStage === 0) {
      // Q1 submit → get Q2 prompt
      setInterviewStage(1);
      try {
        const q2 = await submitQ1(playerText);
        setInterviewMsgs((prev) => [
          ...prev,
          { id: Date.now().toString() + "q2", sender: "system", text: q2 },
        ]);
        setInterviewStage(2);
      } catch {
        setInterviewStage(0);
      }
    } else if (interviewStage === 2) {
      // Q2 submit → advance to main
      setInterviewStage(3);
      try {
        await submitQ2(playerText);
        setInterviewMsgs((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "go",
            sender: "system",
            text: "The Metro District awaits.",
          },
        ]);
        setTimeout(() => setScreen("main"), 1400);
      } catch {
        setInterviewStage(2);
      }
    }
  };

  const handleDecision = async (choiceIndex: 0 | 1 | 2, chosenText: string) => {
    if (!state.currentNode) return;
    try {
      const complete = await makeChoice(
        state.currentNode.id,
        choiceIndex,
        chosenText
      );
      if (complete) {
        setScreen("calculating");
        loadResults(state.sessionId!)
          .then(() => { setTimeout(() => setScreen("summary"), 3500); })
          .catch(() => { /* error via context */ });
      }
    } catch {
      /* error via context */
    }
  };

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customChoiceInput.trim() || !state.currentNode) return;
    handleDecision(0, customChoiceInput.trim());
    setIsTypingChoice(false);
    setCustomChoiceInput("");
  };

  const handlePlayAgain = () => {
    resetGame();
    setScreen("splash");
    setInterviewMsgs([]);
    setInterviewStage(0);
    setPlayerNameLocal("");
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const capital = state.clientState?.capital ?? 10000;
  const reputation = state.clientState?.reputation ?? 0;
  const network = state.clientState?.networkStrength ?? 0;
  const layer = state.clientState?.layer ?? 1;
  const turn = state.clientState?.turnsElapsed ?? 0;
  const marketHeat = state.clientState?.worldSignals?.marketHeat ?? 50;
  const competitorThreat =
    state.clientState?.worldSignals?.competitorThreat ?? 50;
  const infraStability =
    state.clientState?.worldSignals?.infrastructureStability ?? 50;

  const eoProfile = state.results?.eoProfile ?? state.eoProfile;
  const radarData = EO_AXES.map((axis) => ({
    subject: axis.label,
    A: eoProfile ? Math.min(100, Math.round(eoProfile[axis.key] * 10)) : 0,
  }));
  const acumenScore = eoProfile
    ? Math.round(
        ((eoProfile.autonomy +
          eoProfile.innovativeness +
          eoProfile.riskTaking +
          eoProfile.proactiveness +
          eoProfile.competitiveAggressiveness) /
          5) *
          100
      )
    : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {isLoading && screen === "main" && (
          <motion.div
            key="ai-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-game-dark flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 border-[8px] border-game-dark border-t-game-aqua border-r-game-yellow rounded-full animate-spin shadow-[0_0_40px_rgba(27,231,255,0.4)] mb-8 bg-white/5" />
            <h2 className="text-3xl md:text-5xl font-display font-black italic -skew-x-6 text-white text-stroke-heavy drop-shadow-[4px_4px_0_#ef233c] uppercase">
              Synthesizing Strategy...
            </h2>
          </motion.div>
        )}

        {/* ── Splash ─────────────────────────────────────────────────────── */}
        {screen === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center gap-8 md:gap-12 text-center max-w-xl relative z-10 w-full"
          >
            <div className="bg-white border-[6px] border-game-dark p-8 md:p-12 shadow-[16px_16px_0_#623cea] -rotate-3 w-[90%] md:w-full max-w-md mx-auto">
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-game-blue font-display font-black text-2xl md:text-3xl uppercase tracking-[0.3em] text-stroke-heavy italic mb-4"
              >
                Accra 2026
              </motion.h2>
              <motion.h1
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="text-6xl md:text-9xl font-display font-black leading-[0.85] text-stroke-heavy italic -skew-x-6 text-game-yellow drop-shadow-[5px_5px_0_#623cea]"
              >
                HATCH
                <br />
                BUILD
                <br />
                GROW.
              </motion.h1>
            </div>

            {hasSavedSession ? (
              <div className="flex flex-col items-center gap-4 mt-8">
                <GameButton
                  size="lg"
                  onClick={handleResume}
                  variant="aqua"
                  className="scale-110 shadow-[8px_8px_0_#0F172A]"
                  disabled={isLoading}
                >
                  {isLoading ? "LOADING..." : "RESUME GAME"}
                </GameButton>
                <button
                  onClick={handleStart}
                  className="text-game-dark/60 hover:text-game-dark font-display font-black uppercase italic tracking-widest text-sm transition-colors flex items-center gap-2 group"
                >
                  Start new game <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <GameButton
                size="lg"
                onClick={handleStart}
                variant="aqua"
                className="mt-8 scale-110 shadow-[8px_8px_0_#0F172A]"
              >
                START GAME
              </GameButton>
            )}

            <p className="bg-game-dark text-white px-4 py-1 text-[10px] mt-8 uppercase font-black tracking-[0.4em] italic shadow-[4px_4px_0_#33ca7f] border-[3px] border-game-dark -rotate-2">
              BUILD V2.0
            </p>
          </motion.div>
        )}

        {/* ── Setup ──────────────────────────────────────────────────────── */}
        {screen === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-row bg-white overflow-hidden"
          >
            <div className="w-full md:w-1/2 h-full flex items-center justify-center p-6 bg-white overflow-y-auto md:border-r-[8px] border-game-dark">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="game-panel w-full max-w-md flex flex-col gap-8 bg-white rotate-2 my-auto"
              >
                <h2 className="text-4xl font-display font-black text-game-red text-stroke-heavy italic -skew-x-6 text-center drop-shadow-[3px_3px_0_#FFF94F]">
                  SIGN UP
                </h2>
                <form onSubmit={handleSetupSubmit} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2 relative">
                    <label className="absolute -top-3 left-4 bg-game-aqua text-game-dark border-2 border-game-dark px-2 py-0.5 text-[10px] font-black uppercase italic tracking-widest z-10">
                      Full Name
                    </label>
                    <input
                      required
                      name="name"
                      className="bg-white border-4 border-game-dark font-black italic rounded-xl px-5 py-4 outline-none focus:bg-game-yellow transition-all text-game-dark placeholder:text-game-dark/20 shadow-[4px_4px_0_#0F172A]"
                      placeholder="e.g. Kofi Kingston"
                    />
                  </div>
                  <div className="flex flex-col gap-2 relative mt-4">
                    <label className="absolute -top-3 left-4 bg-game-emerald text-game-dark border-2 border-game-dark px-2 py-0.5 text-[10px] font-black uppercase italic tracking-widest z-10">
                      Email Address
                    </label>
                    <input
                      required
                      type="email"
                      name="email"
                      className="bg-white border-4 border-game-dark font-black italic rounded-xl px-5 py-4 outline-none focus:bg-game-yellow transition-all text-game-dark placeholder:text-game-dark/20 shadow-[4px_4px_0_#0F172A]"
                      placeholder="kofi@accra.com"
                    />
                  </div>
                  <div className="flex flex-col gap-2 relative mt-4">
                    <label className="absolute -top-3 left-4 bg-game-red text-white border-2 border-game-dark px-2 py-0.5 text-[10px] font-black uppercase italic tracking-widest z-10">
                      Password
                    </label>
                    <input
                      required
                      type="password"
                      name="password"
                      minLength={6}
                      className="bg-white border-4 border-game-dark font-black italic rounded-xl px-5 py-4 outline-none focus:bg-game-yellow transition-all text-game-dark placeholder:text-game-dark/20 shadow-[4px_4px_0_#0F172A]"
                      placeholder="••••••••"
                    />
                  </div>
                  {error && (
                    <p className="text-game-red font-black italic text-sm">
                      {error}
                    </p>
                  )}
                  <GameButton
                    type="submit"
                    className="mt-8 shadow-[8px_8px_0_#0F172A]"
                    variant="blue"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating..." : "Create account"}
                  </GameButton>
                </form>
              </motion.div>
            </div>

            <div
              className="hidden md:block md:w-1/2 h-full"
              style={{
                backgroundImage: "url('/yard.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </motion.div>
        )}

        {/* ── Prologue ──────────────────────────────────────────────────── */}
        {screen === "prologue" && (
          <motion.div
            key="prologue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6 max-w-2xl text-center relative z-10 p-4"
          >
            <div className="bg-white p-8 md:p-10 border-8 border-game-yellow rounded-3xl shadow-[12px_12px_0_#0F172A] -rotate-2 overflow-hidden relative">
              <h1 className="text-5xl md:text-6xl font-display font-black uppercase text-game-aqua text-stroke-heavy italic -skew-x-6 mb-6 drop-shadow-[4px_4px_0_#FFF94F]">
                THE WORLD
              </h1>
              <div className="text-lg md:text-xl text-game-dark leading-relaxed font-black italic space-y-4 whitespace-pre-line">
                {state.preamble ??
                  "The year is 2026. Accra is the digital capital of West Africa."}
              </div>
            </div>
            <GameButton
              size="lg"
              variant="yellow"
              onClick={startInterview}
              className="mt-2"
              disabled={!state.layer0Question}
            >
              NEXT <ChevronRight className="inline ml-2" />
            </GameButton>
          </motion.div>
        )}

        {/* ── Interview ─────────────────────────────────────────────────── */}
        {screen === "interview" && (
          <motion.div
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-40 p-4"
            style={{ backgroundImage: "url('/wo.png')", backgroundSize: "cover", backgroundPosition: "center" }}
          >
          <div className="w-full max-w-2xl h-[75vh] flex flex-col bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-200 p-0 overflow-hidden relative z-10">
            <div className="flex justify-center items-center px-6 py-3 bg-[#F5F5F7]/90 backdrop-blur-md border-b border-gray-300/80 z-10">
              <span className="text-[14px] font-semibold tracking-wide text-gray-800">
                Are you Ready for the City?
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-hide bg-white">
              <AnimatePresence>
                {interviewMsgs.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`flex ${
                      msg.sender === "player" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2.5 max-w-[70%] font-sans text-[15px] leading-relaxed shadow-sm ${
                        msg.sender === "player"
                          ? "bg-[#007AFF] text-white rounded-3xl rounded-br-sm"
                          : "bg-[#E9E9EB] text-black rounded-3xl rounded-bl-sm"
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="px-4 py-2.5 bg-[#E9E9EB] text-black rounded-3xl rounded-bl-sm text-[15px] italic">
                      typing…
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-4 bg-white border-t border-gray-200 z-10">
              <form
                onSubmit={handleInterviewSubmit}
                className="flex items-center gap-3 relative"
              >
                <div className="flex-1 bg-white border border-gray-300 rounded-full flex items-center shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <input
                    value={interviewInput}
                    onChange={(e) => setInterviewInput(e.target.value)}
                    disabled={
                      interviewStage === 1 || interviewStage === 3 || isLoading
                    }
                    className="w-full bg-transparent px-5 py-2 outline-none text-[15px] text-gray-900 disabled:opacity-50 placeholder:text-gray-400 font-sans"
                    placeholder="iMessage"
                  />
                  <div className="pr-2 py-1">
                    <button
                      type="submit"
                      disabled={
                        !interviewInput.trim() ||
                        interviewStage === 1 ||
                        interviewStage === 3 ||
                        isLoading
                      }
                      className="bg-[#007AFF] text-white rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 transition-all hover:bg-blue-600 focus:outline-none"
                    >
                      <ArrowUp size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          </motion.div>
        )}

        {/* ── Main ──────────────────────────────────────────────────────── */}
        {screen === "main" && state.currentNode && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 w-full h-[100dvh] flex flex-col bg-game-muted z-50 overflow-hidden"
          >
            {/* Metro Bulletin */}
            <AnimatePresence>
              {metroBulletin && (
                <motion.div
                  initial={{ opacity: 0, x: 100, y: -20, rotate: 5 }}
                  animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    rotate: -5,
                    transition: { duration: 0.2 },
                  }}
                  className="absolute top-24 right-4 md:right-8 z-[100] w-[320px] bg-white border-[4px] border-game-dark shadow-[8px_8px_0_#ef233c] rounded-2xl overflow-hidden"
                >
                  <div className="bg-game-blue text-game-yellow px-4 py-2 flex justify-between items-center border-b-[4px] border-game-dark">
                    <span className="font-black italic text-sm flex items-center gap-2 uppercase tracking-widest text-stroke-heavy">
                      <Globe size={16} className="animate-spin-slow" /> Metro
                      Bulletin
                    </span>
                    <button
                      onClick={() => setMetroBulletin(null)}
                      className="hover:scale-110 active:scale-90 transition-transform"
                    >
                      <X
                        size={20}
                        className="text-white drop-shadow-md"
                        strokeWidth={3}
                      />
                    </button>
                  </div>
                  <div className="p-5 flex flex-col gap-3">
                    <h4 className="font-display font-black text-xl italic leading-tight text-game-dark uppercase">
                      {metroBulletin}
                    </h4>
                    {state.clientState?.worldSignals?.secondarySignals?.length
                      ? state.clientState.worldSignals.secondarySignals.map(
                          (sig) => (
                            <div
                              key={sig}
                              className="mt-1 text-xs font-black uppercase px-3 py-1.5 bg-game-yellow border-2 border-game-dark inline-block w-max rounded-md shadow-[4px_4px_0_#33ca7f] rotate-1"
                            >
                              {sig}
                            </div>
                          )
                        )
                      : null}
                  </div>
                  <div className="w-full h-1.5 bg-game-muted relative overflow-hidden">
                    <motion.div
                      key={metroBulletin}
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 10, ease: "linear" }}
                      className="absolute inset-y-0 left-0 bg-game-red"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Top Bar */}
            <div className="h-[12%] min-h-[70px] w-full bg-white border-b-[6px] border-game-dark flex justify-between items-center px-4 md:px-8 shrink-0 relative shadow-[0_8px_0_rgba(15,23,42,0.1)] z-20">
              <div className="flex items-center gap-4 h-full py-2">
                <ReactiveBlock
                  value={capital}
                  className="border-r-2 border-game-dark/10 pr-6 mr-2"
                >
                  <div className="flex flex-col justify-center gap-1 h-full">
                    <span className="text-[10px] uppercase font-black text-game-dark/50 italic tracking-widest leading-none">
                      Capital
                    </span>
                    <span
                      className={`font-display font-black text-2xl md:text-3xl text-stroke-heavy italic leading-none ${
                        capital < 0
                          ? "text-game-red"
                          : capital < 10000
                            ? "text-game-yellow"
                            : "text-game-emerald"
                      }`}
                    >
                      GHS <AnimatedNumber value={capital} />
                    </span>
                  </div>
                </ReactiveBlock>

                <div className="hidden sm:flex items-center gap-6 h-full px-2 border-r-2 border-game-dark/10 mr-2">
                  <ReactiveBlock value={reputation}>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black tracking-widest text-game-dark/50 italic">
                        Reputation
                      </span>
                      <div className="flex items-center gap-1">
                        <Shield size={14} className="text-game-aqua" />
                        <span className="font-black text-lg italic">
                          <AnimatedNumber value={reputation} />
                        </span>
                      </div>
                    </div>
                  </ReactiveBlock>
                  <ReactiveBlock value={network}>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black tracking-widest text-game-dark/50 italic">
                        Network
                      </span>
                      <div className="flex items-center gap-1">
                        <Users size={14} className="text-game-blue" />
                        <span className="font-black text-lg italic">
                          <AnimatedNumber value={network} />
                        </span>
                      </div>
                    </div>
                  </ReactiveBlock>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-game-dark text-white px-3 py-1 rounded-full text-xs font-black italic border-2 border-game-yellow shadow-inner">
                    LAYER {layer}
                  </div>
                  <div className="bg-game-dark text-white px-3 py-1 rounded-full text-xs font-black italic border-2 border-game-aqua shadow-inner">
                    TURN {turn + 1}/10
                  </div>
                </div>
              </div>

              <div className="hidden md:flex flex-col gap-1.5 w-48 justify-center">
                <WorldSignalBar
                  label="MKT"
                  value={marketHeat}
                  baseClass="bg-game-aqua"
                />
                <WorldSignalBar
                  label="COMP"
                  value={competitorThreat}
                  baseClass="bg-game-red"
                />
                <WorldSignalBar
                  label="INFRA"
                  value={infraStability}
                  baseClass="bg-game-emerald"
                />
              </div>
            </div>

            {/* Narrative */}
            <div className="h-[42%] w-full flex items-center justify-center px-8 md:px-16 py-6 shrink-0 relative overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] scrollbar-hide">
              <div className="w-full max-w-5xl text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={state.currentNode.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="w-full flex justify-center"
                  >
                    <h2 className="text-base md:text-lg lg:text-xl font-black italic text-game-dark leading-snug drop-shadow-sm">
                      {state.currentNode.narrative}
                    </h2>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Choices */}
            <div className="flex-1 w-full bg-game-dark border-t-[6px] border-game-yellow p-4 md:p-6 flex flex-col items-center justify-center shrink-0 overflow-y-auto scrollbar-hide relative">
              <AnimatePresence mode="wait">
                {!isTypingChoice ? (
                  <motion.div
                    key="cards-view"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 1.1,
                      filter: "blur(10px)",
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-6xl flex flex-col items-center"
                  >
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pb-2">
                      {state.currentNode.choices.map((opt, i) => {
                        const letters = ["A", "B", "C"];
                        const colors = [
                          "bg-game-red",
                          "bg-game-blue",
                          "bg-game-emerald",
                        ];
                        return (
                          <motion.button
                            key={opt.index}
                            whileHover={{ scale: 1.02, rotate: -2 }}
                            whileTap={{ scale: 0.95 }}
                            exit={{
                              opacity: 0,
                              x: i === 0 ? -100 : i === 2 ? 100 : 0,
                              y: i === 1 ? -100 : 50,
                            }}
                            onClick={() =>
                              handleDecision(opt.index, opt.text)
                            }
                            disabled={isLoading}
                            className={`relative w-full min-h-[90px] flex flex-col justify-between p-4 bg-white border-[6px] border-game-dark shadow-[8px_8px_0_#FFF94F] rounded-2xl transform rotate-${
                              i === 1 ? "2" : "-1"
                            } transition-transform disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            <div
                              className={`absolute -top-4 -left-4 w-12 h-12 ${
                                colors[i % 3]
                              } border-4 border-game-dark rounded-xl flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)] -rotate-6 z-10`}
                            >
                              <span className="font-display font-black text-2xl text-white text-stroke-heavy italic">
                                {letters[i]}
                              </span>
                            </div>
                            <div className="flex-1 flex items-center justify-center w-full px-2 pt-4">
                              <span className="font-black text-lg md:text-xl text-game-dark italic text-center leading-tight">
                                {truncateWords(opt.text, 35)}
                              </span>
                            </div>

                          </motion.button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setIsTypingChoice(true)}
                      className="mt-6 text-game-yellow/70 hover:text-game-yellow uppercase italic font-black font-display tracking-widest transition-colors flex items-center gap-2 group"
                    >
                      Or type your own strategy{" "}
                      <ChevronRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="text-input-view"
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-2xl bg-white border-[6px] border-game-dark shadow-[12px_12px_0_#1be7ff] rounded-3xl p-6 md:p-8 flex flex-col gap-4 z-10"
                  >
                    <h3 className="font-display font-black text-2xl text-game-dark uppercase italic text-stroke-heavy">
                      Executive Action
                    </h3>
                    <form
                      onSubmit={handleCustomSubmit}
                      className="flex flex-col gap-6"
                    >
                      <textarea
                        value={customChoiceInput}
                        onChange={(e) => setCustomChoiceInput(e.target.value)}
                        autoFocus
                        placeholder="What is your strategy?"
                        className="w-full h-32 bg-game-muted border-4 border-game-dark rounded-xl p-4 font-black italic text-lg text-game-dark placeholder:text-game-dark/30 outline-none focus:bg-game-yellow transition-colors resize-none shadow-inner"
                      />
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => setIsTypingChoice(false)}
                          className="text-game-dark/60 hover:text-game-dark font-black tracking-widest uppercase italic transition-colors"
                        >
                          Cancel
                        </button>
                        <GameButton
                          type="submit"
                          variant="aqua"
                          size="md"
                          disabled={!customChoiceInput.trim() || isLoading}
                        >
                          EXECUTE{" "}
                          <ArrowUp className="inline ml-2" size={20} />
                        </GameButton>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── Calculating ──────────────────────────────────────────────── */}
        {screen === "calculating" && (
          <motion.div
            key="calculating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-game-dark flex flex-col items-center justify-center z-50 text-white"
          >
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "radial-gradient(#ffffff 3px, transparent 3px)",
                backgroundSize: "32px 32px",
              }}
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
              className="mb-8 relative"
            >
              <div className="w-24 h-24 border-[6px] border-game-aqua border-t-game-yellow rounded-full shadow-[0_0_20px_#1BE7FF]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Briefcase size={32} className="text-game-yellow animate-pulse" />
              </div>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-display font-black italic -skew-x-6 text-stroke-heavy drop-shadow-[5px_5px_0_#EF233C] tracking-widest text-center uppercase">
              Calculating
              <br />
              Founder DNA
            </h2>
            <div className="mt-8 flex gap-2">
              <motion.div
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                className="w-4 h-4 bg-game-yellow border-2 border-game-dark shadow-[2px_2px_0_#1BE7FF]"
              />
              <motion.div
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="w-4 h-4 bg-game-aqua border-2 border-game-dark shadow-[2px_2px_0_#FFF94F]"
              />
              <motion.div
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                className="w-4 h-4 bg-game-red border-2 border-game-dark shadow-[2px_2px_0_#33CA7F]"
              />
            </div>
          </motion.div>
        )}

        {/* ── Summary ──────────────────────────────────────────────────── */}
        {screen === "summary" && (
          <div
            key="summary"
            className="absolute inset-0 bg-white overflow-y-auto overflow-x-hidden text-game-dark z-50"
          >
            <div className="h-screen flex flex-col relative bg-white overflow-hidden text-game-dark">
              <div className="w-full py-4 px-6 md:px-8 border-b-4 border-game-dark bg-white z-10 flex-shrink-0 flex items-center justify-between">
                <h1 className="text-xl md:text-2xl font-display font-black italic -skew-x-6 text-game-dark tracking-widest">
                  RESULTS
                </h1>
                <div className="w-8 h-8 rounded-full border-4 border-game-dark bg-game-red"></div>
              </div>

              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "radial-gradient(#0F172A 3px, transparent 3px)",
                  backgroundSize: "32px 32px",
                }}
              />

              <div className="flex-1 w-full flex flex-col md:flex-row relative min-h-0 z-10">
                <div className="w-full md:w-[55%] h-[45vh] md:h-full relative flex items-center justify-center p-4 md:p-8 overflow-hidden">
                  <div className="w-full h-full max-w-xl flex items-center justify-center opacity-95">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                        data={radarData}
                      >
                        <PolarGrid stroke="#0F172A" strokeWidth={2} />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{
                            fill: "#0F172A",
                            fontSize: 13,
                            fontWeight: 900,
                            textAnchor: "middle",
                          }}
                        />
                        <Radar
                          name="DNA"
                          dataKey="A"
                          stroke="#1BE7FF"
                          strokeWidth={4}
                          fill="#1BE7FF"
                          fillOpacity={0.6}
                          dot={{
                            fill: "#1BE7FF",
                            r: 5,
                            strokeWidth: 3,
                            stroke: "#0F172A",
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="w-full md:w-[45%] flex flex-col items-center justify-center p-6 md:p-8 h-[50vh] md:h-full text-center relative border-t-4 md:border-t-0 md:border-l-4 border-game-dark">
                  <h2 className="text-7xl md:text-8xl lg:text-9xl font-display font-black text-game-yellow text-stroke-heavy italic -skew-x-6 mb-2 tracking-tighter drop-shadow-[8px_8px_0_#EF233C]">
                    {acumenScore}
                  </h2>
                  <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-widest text-game-dark/60 mb-8">
                    ACUMEN SCORE
                  </h3>
                  <div className="w-32 h-1.5 bg-game-dark mb-8 transform -skew-x-6" />
                  <p className="text-sm md:text-lg font-bold uppercase text-game-dark/80 italic tracking-widest mb-1">
                    Capital Generated
                  </p>
                  <p
                    className={`text-4xl md:text-5xl font-display font-black italic -skew-x-6 drop-shadow-[4px_4px_0_#0F172A] text-stroke-heavy ${
                      capital < 0
                        ? "text-game-red"
                        : capital < 10000
                          ? "text-game-yellow"
                          : "text-game-emerald"
                    }`}
                  >
                    GHS {capital.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="min-h-screen flex flex-col items-center justify-center bg-game-muted border-y-[6px] border-game-dark p-6 md:p-16 relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(#0F172A 3px, transparent 3px)",
                  backgroundSize: "32px 32px",
                }}
              />
              <div className="max-w-4xl w-full z-10 flex flex-col items-center text-center relative">
                <div className="bg-game-dark text-white px-4 py-1.5 font-black text-sm uppercase tracking-widest italic -skew-x-6 mb-6 inline-block shadow-[4px_4px_0_#1BE7FF]">
                  Founder DNA
                </div>
                <h2 className="text-4xl md:text-6xl text-center font-display font-black text-game-dark italic -skew-x-6 drop-shadow-[6px_6px_0_#FFF94F] mb-6 uppercase">
                  {state.playerName ?? playerNameLocal ?? "Founder"}
                </h2>
                <p className="text-lg md:text-xl font-bold italic text-game-dark/80 leading-relaxed mb-16 max-w-2xl bg-white p-6 border-4 border-game-dark shadow-[8px_8px_0_#0F172A] -rotate-1 rounded-xl whitespace-pre-line">
                  {state.results?.summary ??
                    "Your journey through Accra is complete."}
                </p>

                <div className="w-full flex flex-col gap-5 max-w-2xl">
                  {radarData.map((d) => (
                    <div
                      key={d.subject}
                      className="flex items-center bg-white border-[4px] border-game-dark py-4 px-5 md:py-5 md:px-6 rounded-xl shadow-[8px_8px_0_#0F172A] hover:-translate-y-1 transition-transform"
                    >
                      <span className="w-1/3 text-left font-black italic uppercase tracking-wider text-xs md:text-lg pr-4 border-r-2 border-game-muted truncate">
                        {d.subject}
                      </span>
                      <div className="flex-1 h-3.5 bg-white rounded-full border-2 border-game-dark overflow-hidden relative mx-4 shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${d.A}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="absolute inset-y-0 left-0 bg-game-aqua border-r-2 border-game-dark"
                        />
                      </div>
                      <span className="w-16 text-right font-black italic text-sm md:text-2xl text-game-dark">
                        {Math.round(d.A)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 md:p-16 bg-white border-b-[6px] border-game-dark relative overflow-hidden">
              <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 z-10">
                <div className="flex flex-col gap-6 bg-game-yellow border-[6px] border-game-dark p-8 md:p-12 shadow-[12px_12px_0_#0F172A] rounded-3xl lg:rotate-1">
                  <h3 className="text-4xl md:text-5xl font-display font-black text-game-dark uppercase italic -skew-x-6 mb-4">
                    Financials
                  </h3>

                  <div className="flex justify-between items-center border-b-[4px] border-game-dark/20 pb-5">
                    <span className="text-sm md:text-xl font-bold italic text-game-dark/80 uppercase tracking-wider">
                      Revenue
                    </span>
                    <span className="text-3xl md:text-4xl font-display font-black text-game-dark text-stroke-heavy italic">
                      GHS {(state.clientState?.revenue ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b-[4px] border-game-dark/20 pb-5">
                    <span className="text-sm md:text-xl font-bold italic text-game-dark/80 uppercase tracking-wider">
                      Debt
                    </span>
                    <span className="text-3xl md:text-4xl font-display font-black text-game-red text-stroke-heavy italic">
                      GHS {(state.clientState?.debt ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm md:text-xl font-black italic text-game-dark uppercase tracking-wider">
                      Net Capital
                    </span>
                    <span
                      className={`text-4xl md:text-5xl font-display font-black text-stroke-heavy italic drop-shadow-[2px_2px_0_#FFF94F] ${
                        capital < 0 ? "text-game-red" : "text-game-blue"
                      }`}
                    >
                      GHS {capital.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-6 bg-[#1e293b] border-[6px] border-game-dark p-8 md:p-12 shadow-[12px_12px_0_#EF233C] rounded-3xl lg:-rotate-1 justify-center text-white z-10">
                  <h3 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic -skew-x-6 mb-4">
                    Influence
                  </h3>

                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                      <span className="text-sm md:text-xl font-bold italic text-white/80 uppercase tracking-wider">
                        Reputation
                      </span>
                      <span className="text-3xl md:text-4xl font-black italic">
                        {reputation}/100
                      </span>
                    </div>
                    <div className="w-full h-8 bg-game-dark border-4 border-game-dark rounded-full overflow-hidden relative shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{
                          width: `${Math.min(100, reputation)}%`,
                        }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute inset-y-0 left-0 bg-game-yellow border-r-4 border-game-dark"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 mt-6">
                    <div className="flex justify-between items-end">
                      <span className="text-sm md:text-xl font-bold italic text-white/80 uppercase tracking-wider">
                        Network
                      </span>
                      <span className="text-3xl md:text-4xl font-black italic">
                        {network}/100
                      </span>
                    </div>
                    <div className="w-full h-8 bg-game-dark border-4 border-game-dark rounded-full overflow-hidden relative shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{
                          width: `${Math.min(100, network)}%`,
                        }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 1.5,
                          delay: 0.2,
                          ease: "easeOut",
                        }}
                        className="absolute inset-y-0 left-0 bg-game-aqua border-r-4 border-game-dark"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full mt-24 mb-12 flex justify-center z-20">
                <GameButton
                  size="lg"
                  variant="blue"
                  onClick={handlePlayAgain}
                  className="scale-125 hover:scale-[1.35] shadow-[12px_12px_0_#33ca7f] border-[6px]"
                >
                  PLAY AGAIN <Globe className="inline ml-2 text-white" />
                </GameButton>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <StreetArtBackground isSplash={screen === "splash"} />
    </div>
  );
}
