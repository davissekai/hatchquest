"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { Starburst, Sparkle } from "@/components/Decorations";

type Step = "preamble" | "q1" | "q2";

export default function Layer0Page() {
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
    <div className="bg-[#F5F2EB] text-slate-900 min-h-screen relative overflow-hidden selection:bg-hot-pink selection:text-white">
      
      {/* ── Decorative Background Elements ── */}
      <Starburst className="w-64 h-64 -top-20 -left-20 rotate-45" fill="var(--color-pill-blue)" />
      <Starburst className="w-48 h-48 bottom-[5%] -right-10 -rotate-12" fill="var(--color-lime)" />
      <Sparkle className="w-20 h-20 top-[15%] right-[20%]" fill="var(--color-hot-pink)" />
      <Sparkle className="w-16 h-16 bottom-[30%] left-[10%]" fill="#FFC107" />

      {/* Header Bar */}
      <header className="relative z-20 w-full px-6 py-6 lg:px-12 flex justify-between items-center border-b-8 border-slate-900 bg-white">
        <div className="font-headline font-black text-2xl uppercase tracking-tighter">HatchQuest</div>
        <div className="px-4 py-2 bg-[#FFC107] border-4 border-slate-900 rounded-full font-headline font-black text-xs uppercase shadow-[4px_4px_0px_#0f172a]">
          Layer 0
        </div>
      </header>

      {/* ── Step 1: Preamble ── */}
      {step === "preamble" && (
        <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 pb-20 min-h-[90vh]">
          <div className="max-w-4xl w-full bg-white p-10 md:p-16 rounded-[2rem] shadow-[16px_16px_0px_#0f172a] border-[8px] border-slate-900 relative">
            <div className="absolute -top-6 -left-6 bg-hot-pink text-white px-6 py-2 border-4 border-slate-900 rounded-full font-headline font-black text-sm uppercase shadow-[4px_4px_0px_#0f172a] rotate-[-5deg]">
              Accra, Ghana — 2026
            </div>

            <h1 className="text-6xl md:text-8xl font-headline font-black text-slate-900 leading-none tracking-tighter uppercase mb-8">
              The <br/><span className="text-pill-blue">World</span>
            </h1>

            <div className="space-y-6">
              {preambleText.split("\n\n").map((para, i) => (
                <p key={i} className="text-lg md:text-xl font-body text-slate-800 leading-relaxed font-bold">
                  {para}
                </p>
              ))}
            </div>

            <button
              onClick={() => setStep("q1")}
              className="mt-12 w-full md:w-auto px-12 py-6 bg-lime text-slate-900 rounded-full font-headline font-black text-2xl uppercase tracking-widest shadow-[8px_8px_0px_#0f172a] border-[6px] border-slate-900 hover:-translate-y-1 hover:shadow-[12px_12px_0px_#0f172a] active:translate-y-1 active:shadow-[2px_2px_0px_#0f172a] transition-all flex items-center justify-center gap-4"
            >
              Enter Market
              <span className="material-symbols-outlined font-black text-3xl">east</span>
            </button>
          </div>
        </main>
      )}

      {/* ── Step 2: Q1 ── */}
      {step === "q1" && (
        <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 pb-20 min-h-[90vh]">
          <div className="max-w-3xl w-full bg-white p-10 md:p-14 rounded-[2rem] shadow-[16px_16px_0px_#0f172a] border-[8px] border-slate-900 relative">
            <form onSubmit={handleQ1Submit} className="flex flex-col gap-8">
              <label htmlFor="q1-response" className="text-slate-900 font-headline font-black text-2xl md:text-3xl uppercase tracking-tighter">
                {state.layer0Question ?? "What is the business, and what is it really about for you?"}
              </label>
              <textarea
                id="q1-response"
                value={q1Response}
                onChange={(e) => setQ1Response(e.target.value)}
                placeholder="Write freely — there are no right answers."
                disabled={isLoading}
                rows={6}
                className="w-full bg-[#F5F2EB] border-[6px] border-slate-900 focus:border-pill-blue rounded-3xl text-slate-900 font-body text-lg p-6 placeholder:text-slate-400 transition-all resize-none outline-none disabled:opacity-50 shadow-inner focus:shadow-[6px_6px_0px_#0f172a] focus:-translate-y-1"
              />
              <div className="flex justify-between items-center px-2">
                <span className="font-headline font-black text-xs text-slate-500 uppercase tracking-widest">
                  {q1Response.trim().length === 0 ? "Start typing to proceed" : "Ready to submit"}
                </span>
                <span className="font-headline font-black text-xs text-slate-500 uppercase">{q1Response.length} chars</span>
              </div>

              {error && (
                <p className="font-headline font-bold text-sm text-white uppercase bg-pill-red rounded-xl px-6 py-4 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] animate-shake">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={q1Response.trim().length === 0 || isLoading}
                className="w-full py-6 bg-slate-900 text-white rounded-full font-headline font-black text-xl uppercase tracking-widest shadow-[8px_8px_0px_var(--color-pill-blue)] border-4 border-slate-900 hover:-translate-y-1 hover:shadow-[12px_12px_0px_var(--color-pill-blue)] active:translate-y-1 active:shadow-[2px_2px_0px_var(--color-pill-blue)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                    Reading instincts...
                  </>
                ) : (
                  <>
                    Continue
                    <span className="material-symbols-outlined font-black">east</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      )}

      {/* ── Step 3: Q2 ── */}
      {step === "q2" && (
        <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 pb-20 min-h-[90vh]">
          <div className="max-w-3xl w-full bg-white p-10 md:p-14 rounded-[2rem] shadow-[16px_16px_0px_#0f172a] border-[8px] border-slate-900 relative">
            <form onSubmit={handleQ2Submit} className="flex flex-col gap-8">
              <p className="text-slate-900 font-headline font-black text-2xl uppercase tracking-tighter bg-[#FFC107] border-4 border-slate-900 rounded-[1.5rem] p-6 shadow-[6px_6px_0px_#0f172a]">
                {q2Prompt}
              </p>
              <textarea
                id="q2-response"
                value={q2Response}
                onChange={(e) => setQ2Response(e.target.value)}
                placeholder="What do you do?"
                disabled={isLoading}
                rows={5}
                className="w-full bg-[#F5F2EB] border-[6px] border-slate-900 focus:border-pill-red rounded-3xl text-slate-900 font-body text-lg p-6 placeholder:text-slate-400 transition-all resize-none outline-none disabled:opacity-50 shadow-inner focus:shadow-[6px_6px_0px_#0f172a] focus:-translate-y-1"
              />
              <div className="flex justify-between items-center px-2">
                <span className="font-headline font-black text-xs text-slate-500 uppercase tracking-widest">
                  {q2Response.trim().length === 0 ? "Start typing to proceed" : "Ready to submit"}
                </span>
                <span className="font-headline font-black text-xs text-slate-500 uppercase">{q2Response.length} chars</span>
              </div>

              {error && (
                <p className="font-headline font-bold text-sm text-white uppercase bg-pill-red rounded-xl px-6 py-4 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] animate-shake">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={q2Response.trim().length === 0 || isLoading}
                className="w-full py-6 bg-slate-900 text-white rounded-full font-headline font-black text-xl uppercase tracking-widest shadow-[8px_8px_0px_var(--color-pill-red)] border-4 border-slate-900 hover:-translate-y-1 hover:shadow-[12px_12px_0px_var(--color-pill-red)] active:translate-y-1 active:shadow-[2px_2px_0px_var(--color-pill-red)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                    Deciding path...
                  </>
                ) : (
                  <>
                    Decide
                    <span className="material-symbols-outlined font-black">east</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      )}

    </div>
  );
}
