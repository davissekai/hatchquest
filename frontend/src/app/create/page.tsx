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
      router.push("/layer0");
    } catch {
      // error is set in context
    }
  };

  return (
    <div className="bg-cream text-navy min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Background — vibrant glows and patterns */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 adinkra-pattern opacity-10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-bubblegum rounded-full blur-[150px] opacity-20 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-electric-cyan rounded-full blur-[150px] opacity-20 translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Main card */}
      <main className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 bg-hot-pink rounded-[2.5rem] mb-6 shadow-[0_15px_45px_rgba(255,42,133,0.3)] flex items-center justify-center border-4 border-white rotate-3">
            <span
              className="material-symbols-outlined text-white text-5xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              rocket_launch
            </span>
          </div>
          <h1 className="font-headline font-black text-5xl text-navy tracking-tighter italic drop-shadow-sm">
            HatchQuest
          </h1>
          <p className="font-body italic text-xl text-navy/70 mt-2 font-medium">
            The Streetwise Pulse of Accra
          </p>
        </div>

        {/* Auth card — Tactile Graffiti */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-10 shadow-[0_20px_60px_rgba(30,58,138,0.1)] border-4 border-white">
          <div className="mb-8">
            <h2 className="font-headline text-3xl font-extrabold text-navy tracking-tight leading-none">
              Welcome, <span className="text-hot-pink italic">Founder</span>
            </h2>
            <p className="font-body text-navy/70 mt-3 font-medium text-lg leading-relaxed">
              Begin your journey through the electric rhythm of Accra.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label
                htmlFor="founder-name"
                className="font-headline font-bold text-xs tracking-widest text-navy/60 uppercase ml-5 block"
              >
                Preferred Name
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-navy/40 group-focus-within:text-hot-pink transition-colors">
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
                  className="w-full pl-16 pr-8 py-5 bg-cream border-4 border-transparent focus:border-hot-pink/20 rounded-full text-navy font-headline font-bold text-lg transition-all placeholder:text-navy/30 disabled:opacity-50 outline-none shadow-inner"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="font-headline font-bold text-xs tracking-widest text-navy/60 uppercase ml-5 block"
              >
                Academic Email
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-navy/40 group-focus-within:text-hot-pink transition-colors">
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
                  className="w-full pl-16 pr-8 py-5 bg-cream border-4 border-transparent focus:border-hot-pink/20 rounded-full text-navy font-headline font-bold text-lg transition-all placeholder:text-navy/30 disabled:opacity-50 outline-none shadow-inner"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="font-headline font-bold text-xs tracking-widest text-navy/60 uppercase ml-5 block"
              >
                Access Key
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-navy/40 group-focus-within:text-hot-pink transition-colors">
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
                  className="w-full pl-16 pr-8 py-5 bg-cream border-4 border-transparent focus:border-hot-pink/20 rounded-full text-navy font-headline font-bold text-lg transition-all placeholder:text-navy/30 disabled:opacity-50 outline-none shadow-inner"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-[2rem] bg-hot-pink/10 border-2 border-hot-pink/20 px-6 py-4 flex items-center gap-3 animate-shake">
                <span className="material-symbols-outlined text-hot-pink">error</span>
                <p className="font-headline font-bold text-sm text-navy">{error}</p>
              </div>
            )}

            {/* CTA */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !name.trim() || !email.trim() || !password.trim()}
                className="w-full py-6 bg-lime text-navy font-headline font-black text-xl rounded-full shadow-[0_12px_40px_rgba(57,255,20,0.4)] border-4 border-white hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
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
          <div className="mt-10 flex items-center gap-4">
            <div className="h-1 flex-1 bg-cream rounded-full" />
            <span className="font-headline font-black text-[10px] text-navy/40 uppercase tracking-[0.2em]">
              OR
            </span>
            <div className="h-1 flex-1 bg-cream rounded-full" />
          </div>

          <div className="mt-6">
            <button
              onClick={() => router.push("/resume")}
              className="w-full py-4 bg-white text-navy/60 rounded-full font-headline font-bold text-sm hover:text-navy border-4 border-transparent hover:border-cream transition-all uppercase tracking-widest shadow-sm"
            >
              Resume Existing Session
            </button>
          </div>
        </div>

        {/* Footer links */}
        <footer className="mt-12 text-center">
          <div className="flex justify-center gap-8 text-navy/40 font-headline font-bold text-xs uppercase tracking-widest">
            <a href="#" className="hover:text-hot-pink transition-colors">Lore</a>
            <a href="#" className="hover:text-hot-pink transition-colors">Compact</a>
          </div>
          <p className="mt-6 font-body italic text-navy/50 text-sm font-medium">
            Soulfully crafted in Accra, 2026.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default PlayerCreate;
