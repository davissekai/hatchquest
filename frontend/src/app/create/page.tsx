"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { Starburst, Sparkle } from "@/components/Decorations";

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
      router.push("/layer0");
    } catch {
      // error is set in context
    }
  };

  return (
    <div className="bg-[#F5F2EB] text-slate-900 min-h-screen relative flex items-center justify-center py-8 overflow-hidden selection:bg-hot-pink selection:text-white">
      
      {/* ── Decorative Background Elements ── */}
      <Starburst className="w-48 h-48 -top-10 -left-10 rotate-12" fill="var(--color-pill-blue)" />
      <Starburst className="w-32 h-32 bottom-[10%] right-[5%] -rotate-12" fill="var(--color-pill-red)" />
      <Sparkle className="w-16 h-16 top-[20%] right-[15%]" fill="var(--color-grass-green)" />
      <Sparkle className="w-12 h-12 bottom-[20%] left-[10%]" fill="#FFC107" />

      {/* Main card */}
      <main className="relative z-10 w-full max-w-md px-6 py-12">

        {/* Auth card — Neo-Brutalist Pop-Art */}
        <div className="bg-white rounded-[2rem] p-10 shadow-[12px_12px_0px_#0f172a] border-[6px] border-slate-900 relative">
          <div className="absolute -top-6 -right-6 w-12 h-12 bg-[#FFC107] border-[4px] border-slate-900 rounded-full shadow-[4px_4px_0px_#0f172a]" />
          
          <div className="mb-8">
            <h2 className="font-headline text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              Welcome, <br/><span className="text-pill-red">Founder</span>
            </h2>
            <p className="font-body text-slate-700 mt-3 font-bold text-lg leading-relaxed">
              Begin your journey through the electric rhythm of Accra.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label
                htmlFor="founder-name"
                className="font-headline font-black text-xs tracking-widest text-slate-900 uppercase ml-2 block"
              >
                Name
              </label>
              <div className="relative group mt-1">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
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
                  className="w-full pl-16 pr-8 py-5 bg-[#F5F2EB] border-4 border-slate-900 focus:border-pill-red rounded-full text-slate-900 font-headline font-bold text-lg transition-all placeholder:text-slate-400 disabled:opacity-50 outline-none shadow-none focus:shadow-[4px_4px_0px_#0f172a] focus:-translate-y-1"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="font-headline font-black text-xs tracking-widest text-slate-900 uppercase ml-2 block"
              >
                Email
              </label>
              <div className="relative group mt-1">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                  alternate_email
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ama@hatchquest.com"
                  required
                  disabled={isLoading}
                  className="w-full pl-16 pr-8 py-5 bg-[#F5F2EB] border-4 border-slate-900 focus:border-pill-blue rounded-full text-slate-900 font-headline font-bold text-lg transition-all placeholder:text-slate-400 disabled:opacity-50 outline-none shadow-none focus:shadow-[4px_4px_0px_#0f172a] focus:-translate-y-1"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="font-headline font-black text-xs tracking-widest text-slate-900 uppercase ml-2 block"
              >
                Password
              </label>
              <div className="relative group mt-1">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
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
                  className="w-full pl-16 pr-8 py-5 bg-[#F5F2EB] border-4 border-slate-900 focus:border-grass-green rounded-full text-slate-900 font-headline font-bold text-lg transition-all placeholder:text-slate-400 disabled:opacity-50 outline-none shadow-none focus:shadow-[4px_4px_0px_#0f172a] focus:-translate-y-1"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-[1rem] bg-pill-red text-white border-4 border-slate-900 px-6 py-4 flex items-center gap-3 animate-shake shadow-[4px_4px_0px_#0f172a]">
                <span className="material-symbols-outlined font-black">error</span>
                <p className="font-headline font-bold text-sm uppercase tracking-wide">{error}</p>
              </div>
            )}

            {/* CTA */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading || !name.trim() || !email.trim() || !password.trim()}
                className="w-full py-5 bg-lime text-slate-900 font-headline font-black text-xl uppercase tracking-widest rounded-full shadow-[6px_6px_0px_#0f172a] border-4 border-slate-900 hover:-translate-y-1 hover:shadow-[10px_10px_0px_#0f172a] active:translate-y-1 active:shadow-[2px_2px_0px_#0f172a] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[6px_6px_0px_#0f172a]"
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 rounded-full border-4 border-navy/30 border-t-navy animate-spin" />
                    Igniting...
                  </>
                ) : (
                  <>
                    Start Your Quest
                    <span className="material-symbols-outlined font-black">east</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-8 flex items-center gap-4">
            <div className="h-1 flex-1 bg-slate-200" />
            <span className="font-headline font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">
              OR
            </span>
            <div className="h-1 flex-1 bg-slate-200" />
          </div>

          <div className="mt-6">
            <button
              onClick={() => router.push("/resume")}
              className="w-full py-4 bg-[#F5F2EB] text-slate-900 rounded-full font-headline font-black text-sm uppercase tracking-widest border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] active:translate-y-1 active:shadow-[2px_2px_0px_#0f172a] transition-all"
            >
              Resume Existing Session
            </button>
          </div>
        </div>

        {/* Footer links */}
        <footer className="mt-12 text-center">
          <div className="flex justify-center gap-8 text-slate-500 font-headline font-black text-xs uppercase tracking-widest">
            <a href="#" className="hover:text-pill-red transition-colors">Lore</a>
            <a href="#" className="hover:text-pill-red transition-colors">Compact</a>
          </div>
          <p className="mt-6 font-body font-bold text-slate-400 text-sm">
            Crafted in Accra, 2026.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default PlayerCreate;
