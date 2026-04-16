"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { TopAppBar } from "@/components/stitch/TopAppBar";

/** Layer 0 — free-text path-defining moment. Matches the layer_0_pulse mockup. */
const Layer0Page = () => {
  const router = useRouter();
  const { state, phase, hasActiveSession, resumeSession, isLoading, error, classifyLayer0 } = useGame();
  const [response, setResponse] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await classifyLayer0(response.trim());
      router.push("/layer0/loading");
    } catch {
      // error shown below textarea
    }
  };

  const charCount = response.length;
  const canSubmit = response.trim().length > 0 && !isLoading;
  const layer0Prompt =
    state.layer0Question ?? "Describe the business you want to build.";

  return (
    <div className="bg-background text-on-surface min-h-screen relative overflow-hidden">
      {/* TopAppBar */}
      <TopAppBar />

      {/* Hero background — dark cinematic overlay (matches layer_0_pulse mockup) */}
      <div className="fixed inset-0 z-0">
        {/* Gradient stand-in for the boardroom photograph */}
        <div className="w-full h-full bg-gradient-to-br from-primary/90 via-primary-dim/80 to-on-surface/95" />
        {/* Atmospheric colour overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 via-transparent to-tertiary/20 mix-blend-multiply" />
      </div>

      {/* Side decoration — district intel pills */}
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

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-28 pb-12">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

          {/* Left — narrative & context */}
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
                &ldquo;The humidity in Accra is thick tonight... The city lights below
                hum with the restless energy of ten million dreams, but in this
                room, only one matters.&rdquo;
              </p>
              <p className="text-lg font-body text-stone-300/90 leading-relaxed max-w-xl">
                The deal is laid bare — equity, influence, and the keys to the
                District. Before the game begins, we read you.
              </p>
            </div>
          </div>

          {/* Right — interactive glass panel */}
          <div className="md:col-span-5 w-full">
            <div className="glass-panel-dark p-8 rounded-xl shadow-2xl border border-white/10 flex flex-col gap-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <p className="text-white font-headline font-bold text-sm tracking-widest uppercase opacity-80 mb-3">
                    Assessment Brief
                  </p>
                  <p className="whitespace-pre-line text-sm leading-7 text-stone-200 font-body">
                    {layer0Prompt}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="layer0-response"
                    className="text-white font-headline font-bold text-sm tracking-widest uppercase opacity-80"
                  >
                    Your response
                  </label>
                  <textarea
                    id="layer0-response"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Answer in the same 4 parts if you want — what you build, why now, what you do under pressure, and how you react to competition."
                    disabled={isLoading}
                    rows={8}
                    className="w-full bg-white/5 border-none focus:ring-2 focus:ring-primary-container rounded-xl text-white font-body text-base p-5 placeholder:text-stone-500 transition-all resize-none outline-none disabled:opacity-50 whitespace-pre-wrap"
                  />
                  <div className="flex justify-between items-center px-1">
                    <span className="font-label text-xs text-stone-400">
                      {charCount === 0
                        ? "Start typing to proceed"
                        : "✓ Ready to submit"}
                    </span>
                    <span className="font-label text-xs text-stone-500">
                      {charCount} chars
                    </span>
                  </div>
                </div>

                {error && (
                  <p className="font-body text-sm text-tertiary-container bg-tertiary/20 rounded-lg px-4 py-2">
                    {error}
                  </p>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full py-5 bg-primary text-on-primary rounded-xl font-headline font-extrabold text-lg shadow-lg hover:bg-primary-dim hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />
                        Reading your instincts...
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

                  <div className="flex justify-between items-center px-2">
                    <span className="text-stone-400 font-label text-xs">
                      There are no right answers
                    </span>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-secondary-container" />
                      <div className="w-2 h-2 rounded-full bg-stone-600" />
                      <div className="w-2 h-2 rounded-full bg-stone-600" />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Market tension badge */}
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

      {/* Top-right decorative glow */}
      <div className="fixed top-0 right-0 w-64 h-64 opacity-20 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-bl from-tertiary to-transparent rounded-full blur-[100px]" />
      </div>
    </div>
  );
};

export default Layer0Page;
