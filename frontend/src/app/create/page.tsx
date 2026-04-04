"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import BreathingGrid from "@/components/BreathingGrid";

const PlayerCreate = () => {
  const router = useRouter();
  const { startGame, isLoading, error } = useGame();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    try {
      await startGame({ name: name.trim(), email: email.trim() });
      router.push("/loading");
    } catch {
      // error is already set in context
    }
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      <BreathingGrid />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <h2 className="mb-2 font-display text-3xl sm:text-4xl text-primary text-center tracking-wide">
          CREATE YOUR FOUNDER
        </h2>
        <p className="mb-10 text-sm text-muted-foreground font-body text-center">
          Every empire starts with a name.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <label htmlFor="founder-name" className="mb-1.5 block font-display text-xs tracking-widest text-primary uppercase">
              Founder Name
            </label>
            <input
              id="founder-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ama Mensah"
              required
              autoFocus
              disabled={isLoading}
              className="w-full border-[3px] border-primary bg-card px-4 py-3.5 font-body text-base text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block font-display text-xs tracking-widest text-primary uppercase">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ama@example.com"
              required
              disabled={isLoading}
              className="w-full border-[3px] border-primary bg-card px-4 py-3.5 font-body text-base text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="font-body text-sm text-destructive border-[2px] border-destructive px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full border-[3px] border-primary bg-accent py-4 font-display text-lg tracking-wider text-accent-foreground shadow-brutal transition-transform hover:-translate-y-[1px] active:translate-y-[2px] active:shadow-brutal-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "STARTING..." : "START GAME"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlayerCreate;
