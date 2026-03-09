"use client"

import { useState } from "react"
import Link from "next/link"

const LightbulbIcon = () => (
  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const ChartBarIcon = () => (
  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const OfficeBuildingIcon = () => (
  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

export default function Home() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleStart() {
    if (!name || !email) {
      setError("Please enter your name and email to continue.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError("Something went wrong. Please try again.")
        setLoading(false)
        return
      }
      localStorage.setItem("sessionId", data.sessionId)
      window.location.href = "/game"
    } catch (err) {
      setError("Could not connect. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary text-light font-sans flex flex-col">

      {/* Navigation Bar */}
      <nav className="w-full py-5 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 bg-primary border-b border-mutedBlue/30">
        <div className="text-2xl font-bold tracking-tight text-light hover:text-accent transition-colors">
          <Link href="/">HatchQuest</Link>
        </div>
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          Accra · GHS 10,000 · Your Move
        </p>
      </nav>

      <main className="flex-grow">

        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 px-6 flex flex-col items-center text-center bg-primary">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-light">
            HatchQuest
          </h1>
          <p className="text-2xl md:text-3xl text-accent font-semibold mb-6 max-w-3xl">
            A startup simulation where every decision shapes your venture.
          </p>
          <p className="text-lg text-light/70 max-w-2xl mb-12 leading-relaxed">
            You have GHS 10,000 and a dream. 30 decisions stand between
            you and finding out what kind of entrepreneur you really are.
          </p>

          {/* Form */}
          <div className="flex flex-col gap-4 w-full max-w-md text-left">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-light/80">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kofi Mensah"
                className="rounded-lg border border-mutedBlue/50 bg-primary px-4 py-3 text-light placeholder-mutedBlue outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-light/80">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. kofi@gmail.com"
                className="rounded-lg border border-mutedBlue/50 bg-primary px-4 py-3 text-light placeholder-mutedBlue outline-none focus:border-accent"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleStart}
              disabled={loading}
              className="mt-2 rounded-xl bg-accent px-6 py-4 font-bold text-lg text-primary transition-all hover:brightness-110 hover:-translate-y-1 disabled:opacity-50"
            >
              {loading ? "Starting..." : "Begin Your Journey →"}
            </button>
            <p className="text-xs text-mutedBlue text-center">
              Your results are private. No spam — just your entrepreneurial profile at the end.
            </p>
          </div>
        </section>

        {/* How the Game Works */}
        <section className="py-24 px-6 md:px-12 bg-primary w-full flex flex-col items-center border-t border-mutedBlue/30">
          <h2 className="text-3xl md:text-5xl font-bold mb-16 text-light text-center">
            How the Game Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
            <div className="bg-light rounded-2xl p-8 shadow-xl flex flex-col items-start border-t-4 border-tealAccent hover:-translate-y-1 transition-all">
              <div className="p-3 bg-primary/10 rounded-xl mb-6">
                <LightbulbIcon />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-3">Make Strategic Decisions</h3>
              <p className="text-primary/70 text-lg leading-relaxed">
                Face real startup challenges and choose your path forward.
              </p>
            </div>
            <div className="bg-light rounded-2xl p-8 shadow-xl flex flex-col items-start border-t-4 border-tealAccent hover:-translate-y-1 transition-all">
              <div className="p-3 bg-primary/10 rounded-xl mb-6">
                <ChartBarIcon />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-3">Experience Consequences</h3>
              <p className="text-primary/70 text-lg leading-relaxed">
                Your choices impact capital, reputation, and growth.
              </p>
            </div>
            <div className="bg-light rounded-2xl p-8 shadow-xl flex flex-col items-start border-t-4 border-tealAccent hover:-translate-y-1 transition-all">
              <div className="p-3 bg-primary/10 rounded-xl mb-6">
                <OfficeBuildingIcon />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-3">Build Your Venture</h3>
              <p className="text-primary/70 text-lg leading-relaxed">
                Smart founders scale. Poor choices cost you everything.
              </p>
            </div>
          </div>
        </section>

        {/* Game Features */}
        <section className="py-24 px-6 md:px-12 bg-primary w-full flex flex-col items-center border-t border-mutedBlue/30">
          <h2 className="text-3xl md:text-5xl font-bold mb-16 text-light text-center">
            Game Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-4xl w-full">
            {[
              "Startup scenario simulation",
              "Venture strategy decisions",
              "Resource management",
              "Entrepreneurship mindset challenges",
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-mutedBlue/10 p-6 rounded-2xl border border-mutedBlue/30 hover:bg-mutedBlue/20 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-tealAccent/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-lg text-light/90 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-6 flex flex-col items-center text-center bg-primary border-t border-mutedBlue/30">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-light">
            Ready to Build Your Startup?
          </h2>
          <p className="text-mutedBlue mb-10 text-lg">
            Scroll back up and enter your details to begin.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center justify-center bg-accent text-primary font-bold text-xl py-5 px-14 rounded-xl hover:brightness-110 hover:-translate-y-1 transition-all"
          >
            Get Started
          </button>
        </section>

      </main>
    </div>
  )
}