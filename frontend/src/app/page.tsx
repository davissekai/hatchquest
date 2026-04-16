import React from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/TopAppBar";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-cream font-body text-navy">
      <TopAppBar />

      <main className="pt-28">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative min-h-[90vh] flex items-center px-6 lg:px-12 overflow-hidden mb-16">
          {/* Background — Vibrant Glows */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 adinkra-pattern opacity-10" />
            <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-bubblegum rounded-full blur-[120px] opacity-20 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-electric-cyan rounded-full blur-[120px] opacity-15 -translate-x-1/4" />
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-navy text-white font-headline font-bold text-sm shadow-lg border-2 border-white">
                <span className="w-2.5 h-2.5 rounded-full bg-lime animate-pulse shadow-[0_0_8px_#39FF14]" />
                New District Opening: Accra Central
              </div>

              <h2 className="text-6xl md:text-8xl font-headline font-black text-navy tracking-tighter leading-[0.9]">
                Your Legacy Awaits in the{" "}
                <span className="text-hot-pink italic drop-shadow-sm">Heart</span> of Accra.
              </h2>

              <p className="text-xl md:text-2xl text-navy/70 max-w-2xl leading-relaxed font-body font-medium">
                HatchQuest bridges the prestigious halls of Legon with the
                electric rhythm of Makola. Build your venture where tradition
                meets the street.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <Link
                  href="/create"
                  className="px-10 py-5 bg-lime text-navy rounded-full font-headline font-black text-xl shadow-[0_10px_30px_rgba(57,255,20,0.3)] hover:scale-105 transition-all duration-300 active:scale-95 text-center border-4 border-white"
                >
                  Start Your Quest
                </Link>
                <Link
                  href="/resume"
                  className="px-10 py-5 bg-white text-navy/60 rounded-full font-headline font-bold text-xl shadow-sm hover:text-navy hover:scale-105 transition-all duration-300 active:scale-95 text-center border-4 border-transparent hover:border-cream"
                >
                  Resume Session
                </Link>
              </div>
            </div>

            {/* Right card — visual accent */}
            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="aspect-square rounded-[4rem] overflow-hidden shadow-[0_30px_80px_rgba(30,58,138,0.15)] rotate-3 relative z-20 border-8 border-white bg-bubblegum flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <span className="material-symbols-outlined text-[120px] text-white drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    rocket_launch
                  </span>
                  <p className="font-headline font-black text-white text-4xl italic drop-shadow-lg">HatchQuest</p>
                </div>
              </div>
              <div className="absolute -top-10 -right-10 w-56 h-56 rounded-[3rem] bg-electric-cyan shadow-2xl backdrop-blur-xl z-30 -rotate-6 flex items-center justify-center p-8 text-center border-4 border-white">
                <p className="font-body italic text-navy font-bold text-xl leading-snug">
                  &ldquo;The soul of entrepreneurship is on the street.&rdquo;
                </p>
              </div>
              <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-vibrant-orange rounded-full opacity-40 blur-[80px] -z-10" />
            </div>
          </div>
        </section>

        {/* ── Districts Grid ─────────────────────────────────────────────── */}
        <section className="px-6 lg:px-12 py-24 max-w-screen-2xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="space-y-4">
              <h3 className="text-hot-pink font-headline font-black text-sm tracking-[0.3em] uppercase">
                The Map
              </h3>
              <p className="text-5xl md:text-7xl font-headline font-black tracking-tighter text-navy leading-none">
                Active Districts
              </p>
            </div>
            <p className="font-body text-2xl text-navy/60 max-w-md italic font-medium">
              Each district offers unique quests, networking nodes, and capital pools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:h-[550px]">
            {/* The Great Hall */}
            <div className="md:col-span-2 bg-white rounded-[3.5rem] p-10 flex flex-col justify-between group overflow-hidden relative shadow-[0_15px_50px_rgba(30,58,138,0.06)] border-4 border-cream">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-[160px] text-navy">school</span>
              </div>
              <div className="relative z-10 space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-electric-cyan flex items-center justify-center shadow-lg border-4 border-white -rotate-3 group-hover:rotate-0 transition-transform">
                  <span className="material-symbols-outlined text-4xl text-navy">school</span>
                </div>
                <h4 className="text-4xl font-headline font-black text-navy italic">The Great Hall</h4>
                <p className="text-xl text-navy/60 max-w-xs font-body font-medium leading-relaxed">
                  Master the fundamental theories of market expansion in the halls of prestige.
                </p>
              </div>
              <div className="relative z-10 pt-8">
                <span className="inline-block px-8 py-4 bg-cream rounded-full text-xs font-headline font-black tracking-widest uppercase shadow-sm text-navy/40 border-2 border-white">
                  Layer 1 – 5 Required
                </span>
              </div>
            </div>

            {/* Makola Market */}
            <div className="md:col-span-2 bg-navy rounded-[3.5rem] p-10 flex flex-col justify-between text-white group overflow-hidden relative shadow-[0_20px_60px_rgba(30,58,138,0.25)] border-4 border-white">
              <div className="absolute bottom-0 right-0 p-6 w-1/2 h-full opacity-10 kente-pattern" />
              <div className="relative z-10 space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-lime flex items-center justify-center shadow-lg border-4 border-white rotate-6 group-hover:rotate-0 transition-transform">
                  <span className="material-symbols-outlined text-4xl text-navy">storefront</span>
                </div>
                <h4 className="text-4xl font-headline font-black italic">Makola Market</h4>
                <p className="text-xl text-white/70 max-w-sm font-body font-medium leading-relaxed">
                  Real-world hustle. Test your product-market fit against the busiest pulse in West Africa.
                </p>
              </div>
              <Link
                href="/create"
                className="relative z-10 w-fit px-10 py-5 bg-hot-pink text-white rounded-full font-headline font-black text-xl shadow-[0_10px_30px_rgba(255,42,133,0.4)] hover:scale-105 transition-all border-4 border-white"
              >
                Enter Market
              </Link>
            </div>

            {/* Venture Lab */}
            <div className="bg-electric-cyan text-navy rounded-[3.5rem] p-10 flex flex-col items-center justify-center text-center gap-6 group shadow-[0_15px_40px_rgba(0,240,255,0.2)] border-4 border-white hover:scale-[1.02] transition-transform">
              <span className="material-symbols-outlined text-6xl transition-transform group-hover:scale-110 drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>
                rocket_launch
              </span>
              <h4 className="text-3xl font-headline font-black italic">Venture Lab</h4>
              <p className="text-lg font-body font-bold opacity-60">Incubate your ideas.</p>
            </div>

            {/* Global Network */}
            <div className="bg-vibrant-orange text-white rounded-[3.5rem] p-10 flex flex-col items-center justify-center text-center gap-6 group shadow-[0_15px_40px_rgba(255,94,0,0.25)] border-4 border-white hover:scale-[1.02] transition-transform">
              <span className="material-symbols-outlined text-6xl transition-transform group-hover:rotate-12 drop-shadow-md">
                public
              </span>
              <h4 className="text-3xl font-headline font-black italic">Global Network</h4>
              <p className="text-lg font-body font-bold opacity-80">
                Connect your legacy.
              </p>
            </div>
          </div>
        </section>

        {/* ── Quote ──────────────────────────────────────────────────────── */}
        <section className="py-32 bg-white border-y-4 border-cream relative overflow-hidden">
          <div className="absolute inset-0 adinkra-pattern opacity-5" />
          <div className="max-w-4xl mx-auto px-6 text-center space-y-10 relative z-10">
            <span className="material-symbols-outlined text-8xl text-hot-pink opacity-20">format_quote</span>
            <blockquote className="text-4xl md:text-6xl font-body italic leading-tight text-navy font-medium tracking-tight">
              &ldquo;Intelligence is not found only in books, but in the sweat of the
              trader and the vision of the founder.&rdquo;
            </blockquote>
            <cite className="block font-headline font-black text-2xl text-hot-pink not-italic uppercase tracking-[0.2em]">
              — Nana Kwesi, Level 12 Entrepreneur
            </cite>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────────────── */}
        <section className="m-6 lg:m-12 rounded-[5rem] bg-navy py-32 px-6 text-center relative overflow-hidden shadow-[0_30px_80px_rgba(30,58,138,0.35)] border-8 border-white">
          <div className="absolute inset-0 kente-pattern opacity-10" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-bubblegum rounded-full opacity-20 blur-[150px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-electric-cyan rounded-full opacity-15 blur-[150px] translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 space-y-10 max-w-4xl mx-auto">
            <h3 className="text-5xl md:text-8xl font-headline font-black text-white drop-shadow-lg leading-none tracking-tighter">
              Ready to write your <br /><span className="text-lime italic">Accra story?</span>
            </h3>
            <p className="text-2xl text-white/70 font-body font-medium max-w-2xl mx-auto leading-relaxed">
              Join the next wave of visionary founders questing across the districts today.
            </p>
            <div className="pt-6">
              <Link
                href="/create"
                className="inline-block px-14 py-7 bg-lime text-navy rounded-full font-headline font-black text-2xl shadow-[0_15px_45px_rgba(57,255,20,0.4)] hover:scale-105 transition-all duration-300 active:scale-95 border-4 border-white"
              >
                Start Your Quest
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-cream pt-32 pb-16 px-6 lg:px-12">
        <div className="max-w-screen-2xl mx-auto">
          <div className="pt-12 border-t-4 border-white flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-navy/40 font-headline font-bold text-sm uppercase tracking-widest">
              © 2026 HatchQuest. Built with soul in Accra.
            </p>
            <h2 className="text-4xl font-black text-hot-pink italic font-headline tracking-tighter drop-shadow-sm">HatchQuest</h2>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
