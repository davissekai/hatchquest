"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUp() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    // Mock successful signup -> redirect to verification page with email
    router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-primary text-light flex flex-col items-center justify-center p-6 selection:bg-accent selection:text-primary">
      {/* Subtle background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-tealAccent blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-mutedBlue blur-[100px] rounded-full"></div>
      </div>

      <div className="mb-6 text-center">
        <Link href="/" className="inline-block">
          <h1 className="text-4xl font-extrabold tracking-tight text-light hover:text-accent transition-colors drop-shadow-sm">
            HatchQuest
          </h1>
        </Link>
      </div>

      <div className="bg-light text-primary w-full max-w-md rounded-2xl shadow-2xl p-8 sm:p-10 border-t-4 border-tealAccent">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Create your account</h2>
          <p className="text-primary/70 text-sm sm:text-base">
            Join the simulation and build your venture.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary/90" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Founder Name"
              className="w-full px-4 py-2.5 rounded-xl border border-mutedBlue/30 bg-primary/5 text-primary placeholder-primary/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary/90" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="founder@startup.com"
              className="w-full px-4 py-2.5 rounded-xl border border-mutedBlue/30 bg-primary/5 text-primary placeholder-primary/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary/90" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-mutedBlue/30 bg-primary/5 text-primary placeholder-primary/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary/90" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-mutedBlue/30 bg-primary/5 text-primary placeholder-primary/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-accent text-primary font-bold text-lg py-3.5 mt-2 rounded-xl shadow-[0_4px_14px_0_rgba(217,155,0,0.39)] hover:shadow-[0_6px_20px_rgba(217,155,0,0.23)] hover:bg-[#ffb600] transition-all transform hover:-translate-y-0.5"
          >
            Create Account
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-mutedBlue/20 text-center">
          <p className="text-primary/70 text-sm">
            Already have an account?{" "}
            <Link href="/auth/signin" className="font-bold text-tealAccent hover:text-primary transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
