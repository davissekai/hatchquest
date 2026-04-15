"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";

const PlayerCreate = () => {
  const router = useRouter();
  const { startGame, isLoading, error } = useGame();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    try {
      await startGame(name.trim(), email.trim(), password.trim());
      router.push("/loading");
    } catch {
      // error is set in context
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Background — subtle gradient overlay on a warm canvas */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-primary/8 to-secondary-container/15" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(82, 79, 178, 0.4) 0%, rgba(109, 90, 0, 0.2) 100%)",
          }}
        />
      </div>

      {/* Decorative blobs */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary-container/30 rounded-full blur-[100px] z-0 pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-secondary-container/20 rounded-full blur-[100px] z-0 pointer-events-none" />

      {/* Main card */}
      <main className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-primary rounded-xl mb-6 shadow-[0_12px_40px_rgba(21,5,120,0.2)] flex items-center justify-center">
            <span
              className="material-symbols-outlined text-on-primary text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              rocket_launch
            </span>
          </div>
          <h1 className="font-headline font-extrabold text-4xl text-on-primary-container tracking-tighter italic">
            HatchQuest
          </h1>
          <p className="font-body italic text-lg text-on-surface-variant mt-2">
            The Scholarly Soul of the Streets
          </p>
        </div>

        {/* Auth card — glassmorphism */}
        <div className="glass-panel rounded-xl p-10 shadow-[0_12px_40px_rgba(21,5,120,0.08)]">
          <div className="mb-8">
            <h2 className="font-headline text-2xl font-bold text-primary tracking-tight">
              Welcome, Founder
            </h2>
            <p className="font-body text-on-surface-variant mt-1">
              Begin your journey through the academic chronicles of Accra.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <label
                htmlFor="founder-name"
                className="font-label text-sm font-semibold text-on-surface-variant ml-4 block"
              >
                Preferred Name
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  person
                </span>
                <input
                  id="founder-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ama Mensah"
                  required
                  autoFocus
                  disabled={isLoading}
                  className="w-full pl-14 pr-6 py-4 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface font-body text-lg transition-all placeholder:text-outline-variant disabled:opacity-50 outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="font-label text-sm font-semibold text-on-surface-variant ml-4 block"
              >
                Academic Email
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  alternate_email
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ama@hatchquest.edu"
                  required
                  disabled={isLoading}
                  className="w-full pl-14 pr-6 py-4 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface font-body text-lg transition-all placeholder:text-outline-variant disabled:opacity-50 outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="font-label text-sm font-semibold text-on-surface-variant ml-4 block"
              >
                Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="w-full pl-14 pr-6 py-4 bg-surface-container-high border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface font-body text-lg transition-all placeholder:text-outline-variant disabled:opacity-50 outline-none"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-error-container/10 border border-error/20 px-5 py-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-error text-sm">error</span>
                <p className="font-body text-sm text-on-error-container">{error}</p>
              </div>
            )}

            {/* CTA */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !name.trim() || !email.trim() || !password.trim()}
                className="w-full py-5 bg-primary text-on-primary font-headline font-extrabold text-lg rounded-xl shadow-[0_8px_30px_rgba(82,79,178,0.3)] hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />
                    Starting your journey...
                  </>
                ) : (
                  <>
                    Enter the Chronicles
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-outline-variant/30" />
            <span className="font-label text-xs font-bold text-outline uppercase tracking-widest">
              or continue as
            </span>
            <div className="h-px flex-1 bg-outline-variant/30" />
          </div>

          <div className="mt-4">
            <button
              onClick={() => router.push("/resume")}
              className="w-full py-4 bg-surface-container-high rounded-xl font-label font-bold text-on-surface-variant hover:bg-surface-container transition-colors text-sm"
            >
              Resume Existing Session
            </button>
          </div>
        </div>

        {/* Footer links */}
        <footer className="mt-10 text-center">
          <div className="flex justify-center gap-6 text-on-surface-variant font-label text-sm">
            <a href="#" className="hover:text-primary transition-colors">Terms of Lore</a>
            <span className="text-outline-variant">•</span>
            <a href="#" className="hover:text-primary transition-colors">Privacy Compact</a>
          </div>
          <p className="mt-4 font-body italic text-on-surface-variant/70 text-sm">
            Crafted for the next generation of academic pioneers in Accra.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default PlayerCreate;
