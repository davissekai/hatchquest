"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock successful login -> redirect to game
    router.push("/game");
  };

  return (
    <div className="min-h-screen bg-primary text-light flex flex-col items-center justify-center p-6 selection:bg-accent selection:text-primary">
      {/* Subtle background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-tealAccent blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-mutedBlue blur-[100px] rounded-full"></div>
      </div>

      <div className="mb-8 text-center">
        <Link href="/" className="inline-block">
          <h1 className="text-4xl font-extrabold tracking-tight text-light hover:text-accent transition-colors drop-shadow-sm">
            HatchQuest
          </h1>
        </Link>
      </div>

      <div className="bg-light text-primary w-full max-w-md rounded-2xl shadow-2xl p-8 sm:p-10 border-t-4 border-tealAccent">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-primary/70 text-sm sm:text-base">
            Sign in to begin your founder journey and continue the simulation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-primary/90" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="founder@startup.com"
              className="w-full px-4 py-3 rounded-xl border border-mutedBlue/30 bg-primary/5 text-primary placeholder-primary/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-primary/90" htmlFor="password">
                Password
              </label>
              <Link href="#" className="text-sm font-medium text-tealAccent hover:text-primary transition-colors">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-mutedBlue/30 bg-primary/5 text-primary placeholder-primary/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-accent text-primary font-bold text-lg py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(217,155,0,0.39)] hover:shadow-[0_6px_20px_rgba(217,155,0,0.23)] hover:bg-[#ffb600] transition-all transform hover:-translate-y-0.5"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-mutedBlue/20 text-center">
          <p className="text-primary/70 text-sm">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="font-bold text-tealAccent hover:text-primary transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
