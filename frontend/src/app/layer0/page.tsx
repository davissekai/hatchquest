"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { TopAppBar } from "@/components/TopAppBar";

type Step = "preamble" | "q1" | "q2";

/**
 * Layer 0 — three-step path-defining moment.
 * Step 1: Preamble — world introduction, fills the viewport.
 * Step 2: Q1 — free-text business description + motivation.
 * Step 3: Q2 — AI-generated personalised follow-up challenge.
 */
const Layer0Page = () => {
  const router = useRouter();
  const { state, phase, hasActiveSession, resumeSession, isLoading, error, submitQ1, submitQ2 } = useGame();

  const [step, setStep] = useState<Step>("preamble");
  const [q1Response, setQ1Response] = useState("");
  const [q2Prompt, setQ2Prompt] = useState<string | null>(null);
  const [q2Response, setQ2Response] = useState("");

  useEffect(() => {
    if (phase === "idle" && !isLoading) {
      if (hasActiveSession()) {
        void resumeSession();
      } else {
        router.replace("/create");
      }
    } else if (phase === "active") {
      router.replace("/play");
    } else if (phase === "complete") {
      router.replace("/results");
    }
  }, [phase, isLoading, hasActiveSession, resumeSession, router]);

  const handleQ1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prompt = await submitQ1(q1Response.trim());
      setQ2Prompt(prompt);
      setStep("q2");
    } catch {
      // error surfaced via context
    }
  };

  const handleQ2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitQ2(q2Response.trim());
      router.push("/play");
    } catch {
      // error surfaced via context
    }
  };

  const preambleText = state.preamble ?? `The economy is recovering. Inflation is down and the cedi is holding, and there is a quiet optimism in the air that the city has not felt in a while. Business is moving and new money is circulating. Mobile money is everywhere — no longer just a feature but the system through which Accra runs. The city is expanding physically as infrastructure is built, and the energy around entrepreneurship is steadily growing.

But the fundamentals have not changed. Capital is still hard to access without the right connections or collateral, and the informal economy remains enormous, setting the price floor for everything. Power is unreliable, and competition is stiff across local, informal, and foreign players. Survival in the first year is not guaranteed, and most do not make it.

You have GHS 10,000 and an idea. That is where your story starts.`;

  return (
    <div className="bg-cream text-navy min-h-screen relative overflow-hidden">
      <TopAppBar />

      {/* Bright patterned background */}
      <div className="fixed inset-0 z-0">
        <div className="w-full h-full bg-cream" />
        <div className="absolute inset-0 adinkra-pattern" />
      </div>

      {/* Colorful glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] opacity-20 pointer-events-none z-0">
        <div className="absolute inset-0 bg-hot-pink rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
      </div>
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] opacity-20 pointer-events-none z-0">
        <div className="absolute inset-0 bg-electric-cyan rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* ── Step 1: Preamble ──────────────────────────────────────────────────── */}
      {step === "preamble" && (
        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-28 pb-12">
          <div className="max-w-3xl w-full flex flex-col gap-8 bg-white/60 backdrop-blur-xl p-10 rounded-[3rem] shadow-[0_20px_60px_rgba(30,58,138,0.1)] border-4 border-white">
            <div className="inline-flex items-center px-6 py-3 bg-bubblegum text-white rounded-full w-fit shadow-md">
              <span
                className="material-symbols-outlined text-sm mr-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                public
              </span>
              <span className="font-label text-xs font-bold tracking-widest uppercase drop-shadow-sm">
                Accra, Ghana — 2026
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-headline font-extrabold text-navy leading-tight tracking-tighter">
              The{" "}
              <span className="text-electric-cyan italic drop-shadow-md">World</span>
            </h1>

            <div className="space-y-5">
              {preambleText.split("\n\n").map((para, i) => (
                <p key={i} className="text-lg md:text-xl font-body text-navy/80 leading-relaxed font-medium">
                  {para}
                </p>
              ))}
            </div>

            <button
              onClick={() => setStep("q1")}
              className="mt-4 w-full md:w-auto px-10 py-5 bg-lime text-navy rounded-full font-headline font-extrabold text-xl shadow-[0_10px_30px_rgba(57,255,20,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 group border-4 border-white"
            >
              Begin
              <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">
                east
              </span>
            </button>
          </div>
        </main>
      )}

      {/* ── Step 2: Q1 ───────────────────────────────────────────────────────── */}
      {step === "q1" && (
        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-28 pb-12">
          <div className="max-w-2xl w-full bg-white/60 backdrop-blur-xl p-10 rounded-[3rem] shadow-[0_20px_60px_rgba(30,58,138,0.1)] border-4 border-white">
            <form onSubmit={handleQ1Submit} className="flex flex-col gap-6">
              <label
                htmlFor="q1-response"
                className="text-navy font-headline font-bold text-lg tracking-tight"
              >
                {state.layer0Question ?? "What is the business, and what is it really about for you?"}
              </label>
              <textarea
                id="q1-response"
                value={q1Response}
                onChange={(e) => setQ1Response(e.target.value)}
                placeholder="Write freely — there are no right answers."
                disabled={isLoading}
                rows={6}
                className="w-full bg-cream border-2 border-transparent focus:border-electric-cyan focus:ring-4 focus:ring-electric-cyan/20 rounded-3xl text-navy font-body text-base p-5 placeholder:text-navy/40 transition-all resize-none outline-none disabled:opacity-50"
              />
              <div className="flex justify-between items-center px-2">
                <span className="font-label text-xs text-navy/60 font-medium">
                  {q1Response.trim().length === 0 ? "Start typing to proceed" : "✓ Ready to submit"}
                </span>
                <span className="font-label text-xs text-navy/60 font-medium">{q1Response.length} chars</span>
              </div>

              {error && (
                <p className="font-body text-sm text-hot-pink bg-hot-pink/10 rounded-2xl px-5 py-3 border border-hot-pink/20">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={q1Response.trim().length === 0 || isLoading}
                className="w-full py-5 bg-navy text-white rounded-full font-headline font-extrabold text-lg shadow-[0_10px_30px_rgba(30,58,138,0.3)] hover:bg-navy/90 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-navy"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Reading instincts...
                  </>
                ) : (
                  <>
                    Continue
                    <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">east</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      )}

      {/* ── Step 3: Q2 ───────────────────────────────────────────────────────── */}
      {step === "q2" && (
        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-28 pb-12">
          <div className="max-w-2xl w-full bg-white/60 backdrop-blur-xl p-10 rounded-[3rem] shadow-[0_20px_60px_rgba(30,58,138,0.1)] border-4 border-white">
            <form onSubmit={handleQ2Submit} className="flex flex-col gap-6">
              <p className="text-navy/90 font-body text-lg leading-relaxed italic bg-cream rounded-2xl p-5 border-2 border-white">
                {q2Prompt}
              </p>
              <textarea
                id="q2-response"
                value={q2Response}
                onChange={(e) => setQ2Response(e.target.value)}
                placeholder="What do you do?"
                disabled={isLoading}
                rows={5}
                className="w-full bg-cream border-2 border-transparent focus:border-bubblegum focus:ring-4 focus:ring-bubblegum/20 rounded-3xl text-navy font-body text-base p-5 placeholder:text-navy/40 transition-all resize-none outline-none disabled:opacity-50"
              />
              <div className="flex justify-between items-center px-2">
                <span className="font-label text-xs text-navy/60 font-medium">
                  {q2Response.trim().length === 0 ? "Start typing to proceed" : "✓ Ready to submit"}
                </span>
                <span className="font-label text-xs text-navy/60 font-medium">{q2Response.length} chars</span>
              </div>

              {error && (
                <p className="font-body text-sm text-hot-pink bg-hot-pink/10 rounded-2xl px-5 py-3 border border-hot-pink/20">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={q2Response.trim().length === 0 || isLoading}
                className="w-full py-5 bg-navy text-white rounded-full font-headline font-extrabold text-lg shadow-[0_10px_30px_rgba(30,58,138,0.3)] hover:bg-navy/90 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-navy"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Deciding path...
                  </>
                ) : (
                  <>
                    Decide
                    <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">east</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      )}

      {/* Left district pill */}
      <div className="fixed left-0 bottom-12 hidden lg:flex flex-col gap-4 z-20">
        <div className="bg-navy text-white py-4 pl-8 pr-12 rounded-r-[2rem] shadow-[0_10px_30px_rgba(30,58,138,0.3)] border-y-4 border-r-4 border-white flex items-center gap-4 hover:translate-x-2 transition-transform">
          <span className="material-symbols-outlined text-electric-cyan">location_on</span>
          <div>
            <p className="font-headline font-bold text-xs tracking-tighter opacity-70 uppercase">
              Current District
            </p>
            <p className="font-body italic text-lg leading-none">Accra Central</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layer0Page;
