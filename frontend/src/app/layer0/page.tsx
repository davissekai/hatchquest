"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { TopAppBar } from "@/components/stitch/TopAppBar";

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
      router.push("/layer0/loading");
    } catch {
      // error surfaced via context
    }
  };

  const preambleText = state.preamble ?? `The economy is recovering. Inflation is down and the cedi is holding, and there is a quiet optimism in the air that the city has not felt in a while. Business is moving and new money is circulating. Mobile money is everywhere — no longer just a feature but the system through which Accra runs. The city is expanding physically as infrastructure is built, and the energy around entrepreneurship is steadily growing.

But the fundamentals have not changed. Capital is still hard to access without the right connections or collateral, and the informal economy remains enormous, setting the price floor for everything. Power is unreliable, and competition is stiff across local, informal, and foreign players. Survival in the first year is not guaranteed, and most do not make it.

You have GHS 10,000 and an idea. That is where your story starts.`;

  return (
    <div className="bg-background text-on-surface min-h-screen relative overflow-hidden">
      <TopAppBar />

      {/* Cinematic background */}
      <div className="fixed inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-primary/90 via-primary-dim/80 to-on-surface/95" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 via-transparent to-tertiary/20 mix-blend-multiply" />
      </div>

      {/* Top-right glow */}
      <div className="fixed top-0 right-0 w-64 h-64 opacity-20 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-bl from-tertiary to-transparent rounded-full blur-[100px]" />
      </div>

      {/* ── Step 1: Preamble ──────────────────────────────────────────────────── */}
      {step === "preamble" && (
        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-28 pb-12">
          <div className="max-w-3xl w-full flex flex-col gap-8">
            <div className="inline-flex items-center px-4 py-2 bg-tertiary/20 text-tertiary-container rounded-full w-fit border border-tertiary/30">
              <span
                className="material-symbols-outlined text-sm mr-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                public
              </span>
              <span className="font-label text-xs font-bold tracking-widest uppercase">
                Accra, Ghana — 2026
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-headline font-extrabold text-white leading-tight tracking-tighter">
              The{" "}
              <span className="text-secondary-fixed italic">World</span>
            </h1>

            <div className="space-y-5">
              {preambleText.split("\n\n").map((para, i) => (
                <p key={i} className="text-lg md:text-xl font-body text-stone-200 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>

            <button
              onClick={() => setStep("q1")}
              className="mt-4 w-full md:w-auto px-10 py-5 bg-primary text-on-primary rounded-xl font-headline font-extrabold text-lg shadow-lg hover:bg-primary-dim hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
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
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

            {/* Left — context */}
            <div className="md:col-span-7 flex flex-col gap-6">
              <div className="inline-flex items-center px-4 py-2 bg-tertiary/20 text-tertiary-container rounded-full w-fit border border-tertiary/30">
                <span
                  className="material-symbols-outlined text-sm mr-2"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  emergency
                </span>
                <span className="font-label text-xs font-bold tracking-widest uppercase">
                  Chapter 0: The Incubation
                </span>
              </div>

              <h2 className="text-5xl md:text-7xl font-headline font-extrabold text-white leading-tight tracking-tighter">
                Accra{" "}
                <span className="text-secondary-fixed italic">Pulse</span>
              </h2>

              <div className="space-y-4">
                <p className="text-2xl md:text-3xl font-body italic text-stone-200 leading-relaxed">
                  &ldquo;The deal is laid bare — equity, influence, and the keys to the
                  District. Before the game begins, we read you.&rdquo;
                </p>
                <p className="text-lg font-body text-stone-300/90 leading-relaxed max-w-xl">
                  There are no right answers. Your instinct is the data.
                </p>
              </div>
            </div>

            {/* Right — Q1 input panel */}
            <div className="md:col-span-5 w-full">
              <div className="glass-panel-dark p-8 rounded-xl shadow-2xl border border-white/10 flex flex-col gap-6">
                <form onSubmit={handleQ1Submit} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="q1-response"
                      className="text-white font-headline font-bold text-sm tracking-widest uppercase opacity-80"
                    >
                      {state.layer0Question ?? "What is the business, and what is it really about for you?"}
                    </label>
                    <textarea
                      id="q1-response"
                      value={q1Response}
                      onChange={(e) => setQ1Response(e.target.value)}
                      placeholder="Write freely — there are no right answers."
                      disabled={isLoading}
                      rows={5}
                      className="w-full bg-white/5 border-none focus:ring-2 focus:ring-primary-container rounded-xl text-white font-body text-base p-5 placeholder:text-stone-500 transition-all resize-none outline-none disabled:opacity-50"
                    />
                    <div className="flex justify-between items-center px-1">
                      <span className="font-label text-xs text-stone-400">
                        {q1Response.trim().length === 0
                          ? "Start typing to proceed"
                          : "✓ Ready to submit"}
                      </span>
                      <span className="font-label text-xs text-stone-500">
                        {q1Response.length} chars
                      </span>
                    </div>
                  </div>

                  {error && (
                    <p className="font-body text-sm text-tertiary-container bg-tertiary/20 rounded-lg px-4 py-2">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={q1Response.trim().length === 0 || isLoading}
                    className="w-full py-5 bg-primary text-on-primary rounded-xl font-headline font-extrabold text-lg shadow-lg hover:bg-primary-dim hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />
                        Reading your instincts...
                      </>
                    ) : (
                      <>
                        Continue
                        <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">
                          east
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="mt-6 flex items-center gap-4 bg-surface-container-lowest/10 backdrop-blur-md p-4 rounded-full border border-white/5">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container flex-shrink-0">
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    trending_up
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-headline font-bold text-xs tracking-wide uppercase">
                    Market Tension
                  </span>
                  <span className="text-secondary-fixed text-xs font-bold">
                    Critical · 88%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ── Step 3: Q2 ───────────────────────────────────────────────────────── */}
      {step === "q2" && (
        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-28 pb-12">
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

            {/* Left — context */}
            <div className="md:col-span-7 flex flex-col gap-6">
              <div className="inline-flex items-center px-4 py-2 bg-secondary/20 text-secondary-container rounded-full w-fit border border-secondary/30">
                <span
                  className="material-symbols-outlined text-sm mr-2"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  psychology
                </span>
                <span className="font-label text-xs font-bold tracking-widest uppercase">
                  Week One Challenge
                </span>
              </div>

              <h2 className="text-5xl md:text-7xl font-headline font-extrabold text-white leading-tight tracking-tighter">
                First{" "}
                <span className="text-secondary-fixed italic">Test</span>
              </h2>

              <div className="space-y-4">
                <p className="text-lg font-body text-stone-300/90 leading-relaxed max-w-xl">
                  Before the game begins, one final question — grounded in your specific situation.
                </p>
              </div>
            </div>

            {/* Right — Q2 input panel */}
            <div className="md:col-span-5 w-full">
              <div className="glass-panel-dark p-8 rounded-xl shadow-2xl border border-white/10 flex flex-col gap-6">
                <form onSubmit={handleQ2Submit} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="q2-response"
                      className="text-white font-headline font-bold text-sm tracking-widest uppercase opacity-80"
                    >
                      Your First Challenge
                    </label>
                    {/* AI-generated Q2 prompt */}
                    <p className="text-stone-200 font-body text-base leading-relaxed italic bg-white/5 rounded-xl p-4">
                      {q2Prompt}
                    </p>
                    <textarea
                      id="q2-response"
                      value={q2Response}
                      onChange={(e) => setQ2Response(e.target.value)}
                      placeholder="What do you do?"
                      disabled={isLoading}
                      rows={4}
                      className="w-full bg-white/5 border-none focus:ring-2 focus:ring-primary-container rounded-xl text-white font-body text-base p-5 placeholder:text-stone-500 transition-all resize-none outline-none disabled:opacity-50"
                    />
                    <div className="flex justify-between items-center px-1">
                      <span className="font-label text-xs text-stone-400">
                        {q2Response.trim().length === 0
                          ? "Start typing to proceed"
                          : "✓ Ready to submit"}
                      </span>
                      <span className="font-label text-xs text-stone-500">
                        {q2Response.length} chars
                      </span>
                    </div>
                  </div>

                  {error && (
                    <p className="font-body text-sm text-tertiary-container bg-tertiary/20 rounded-lg px-4 py-2">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={q2Response.trim().length === 0 || isLoading}
                    className="w-full py-5 bg-primary text-on-primary rounded-xl font-headline font-extrabold text-lg shadow-lg hover:bg-primary-dim hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />
                        Deciding your path...
                      </>
                    ) : (
                      <>
                        Decide
                        <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">
                          east
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Step indicator */}
              <div className="mt-6 flex items-center justify-center gap-3">
                <div className="w-2 h-2 rounded-full bg-stone-600" />
                <div className="w-2 h-2 rounded-full bg-stone-600" />
                <div className="w-3 h-3 rounded-full bg-secondary-container" />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Left district pill */}
      <div className="fixed left-0 bottom-12 hidden lg:flex flex-col gap-4 z-20">
        <div className="bg-primary/90 text-on-primary py-4 pl-8 pr-12 rounded-r-full shadow-xl flex items-center gap-4 hover:translate-x-2 transition-transform">
          <span className="material-symbols-outlined">location_on</span>
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
