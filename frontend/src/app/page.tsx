import React from "react";
import Link from "next/link";
import { TopAppBar } from "@/components/stitch/TopAppBar";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background font-body text-on-surface">
      <TopAppBar />

      <main className="pt-28">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative min-h-[90vh] flex items-center px-6 lg:px-12 overflow-hidden mb-16">
          {/* Background — UG Great Hall photograph */}
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-gradient-to-br from-primary/5 to-secondary-container/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tertiary-container/20 text-tertiary font-label font-bold text-sm">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                New District Opening: Accra Central
              </div>

              <h2 className="text-6xl md:text-8xl font-headline font-extrabold text-on-surface tracking-tighter leading-[0.9]">
                Your Legacy Awaits in the{" "}
                <span className="text-primary italic">Heart</span> of Accra.
              </h2>

              <p className="text-xl md:text-2xl text-on-surface-variant max-w-2xl leading-relaxed font-body">
                HatchQuest bridges the prestigious halls of Legon with the
                electric rhythm of Makola. Build your venture where tradition
                meets the street.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/create"
                  className="px-10 py-5 bg-secondary-container text-on-secondary-container rounded-xl font-headline font-bold text-xl shadow-[0_12px_40px_rgba(109,90,0,0.15)] hover:scale-105 transition-transform active:scale-95 text-center"
                >
                  Start Your Quest
                </Link>
                <Link
                  href="/resume"
                  className="px-10 py-5 bg-surface-container-low text-primary rounded-xl font-headline font-bold text-xl hover:bg-surface-container transition-colors active:scale-95 text-center"
                >
                  Resume Session
                </Link>
              </div>
            </div>

            {/* Right card — visual accent */}
            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="aspect-square rounded-xl overflow-hidden shadow-2xl rotate-3 relative z-20 border-8 border-white bg-surface-container-high flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <span className="material-symbols-outlined text-8xl text-primary/30" style={{ fontVariationSettings: "'FILL' 1" }}>
                    rocket_launch
                  </span>
                  <p className="font-headline font-extrabold text-primary text-2xl italic">HatchQuest</p>
                </div>
              </div>
              <div className="absolute -top-8 -right-8 w-48 h-48 rounded-xl bg-primary-container/20 backdrop-blur-xl z-10 rotate-12 flex items-center justify-center p-6 text-center border border-primary/10">
                <p className="font-body italic text-primary text-base leading-snug">
                  &ldquo;The soul of entrepreneurship is on the street.&rdquo;
                </p>
              </div>
              <div className="absolute -bottom-12 -left-12 w-64 h-64 kente-pattern rounded-full opacity-40 -z-10" />
            </div>
          </div>
        </section>

        {/* ── Districts Grid ─────────────────────────────────────────────── */}
        <section className="px-6 lg:px-12 py-16 max-w-screen-2xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-4">
              <h3 className="text-primary font-headline font-bold text-lg tracking-widest uppercase">
                The Map
              </h3>
              <p className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface">
                Active Districts
              </p>
            </div>
            <p className="font-body text-xl text-on-surface-variant max-w-md italic">
              Each district offers unique quests, networking nodes, and capital pools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:h-[500px]">
            {/* The Great Hall */}
            <div className="md:col-span-2 bg-surface-container-low rounded-xl p-8 flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-[120px] text-primary">school</span>
              </div>
              <div className="relative z-10 space-y-4">
                <span className="material-symbols-outlined text-4xl text-primary">school</span>
                <h4 className="text-3xl font-headline font-bold text-on-surface">The Great Hall</h4>
                <p className="text-lg text-on-surface-variant max-w-xs font-body">
                  Master the fundamental theories of market expansion in the halls of prestige.
                </p>
              </div>
              <div className="relative z-10 pt-8">
                <span className="inline-block px-4 py-2 bg-white rounded-full text-sm font-label font-bold shadow-sm text-on-surface">
                  Layer 1 – 5 Required
                </span>
              </div>
            </div>

            {/* Makola Market */}
            <div className="md:col-span-2 bg-secondary-container rounded-xl p-8 flex flex-col justify-between text-on-secondary-container group overflow-hidden relative">
              <div className="absolute bottom-0 right-0 p-4 w-1/2 h-full opacity-10 kente-pattern" />
              <div className="relative z-10 space-y-4">
                <span className="material-symbols-outlined text-4xl">storefront</span>
                <h4 className="text-3xl font-headline font-bold">Makola Market</h4>
                <p className="text-lg text-on-secondary-container/80 max-w-xs font-body">
                  Real-world hustle. Test your product-market fit against the busiest pulse in West Africa.
                </p>
              </div>
              <Link
                href="/create"
                className="relative z-10 w-fit px-6 py-3 bg-on-secondary-container text-white rounded-full font-label font-bold hover:opacity-90 transition-opacity"
              >
                Enter Market
              </Link>
            </div>

            {/* Venture Lab */}
            <div className="bg-primary text-on-primary rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 group">
              <span className="material-symbols-outlined text-5xl transition-transform group-hover:scale-110" style={{ fontVariationSettings: "'FILL' 1" }}>
                rocket_launch
              </span>
              <h4 className="text-xl font-headline font-bold">Venture Lab</h4>
              <p className="text-sm opacity-80 font-body">Incubate your ideas with tech pioneers.</p>
            </div>

            {/* Global Network */}
            <div className="bg-surface-container-highest rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 group">
              <span className="material-symbols-outlined text-5xl text-primary transition-transform group-hover:rotate-12">
                public
              </span>
              <h4 className="text-xl font-headline font-bold text-on-surface">Global Network</h4>
              <p className="text-sm text-on-surface-variant font-body">
                Connect your Accra legacy to the world.
              </p>
            </div>
          </div>
        </section>

        {/* ── Quote ──────────────────────────────────────────────────────── */}
        <section className="py-24 bg-surface-container-lowest">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
            <span className="material-symbols-outlined text-6xl text-primary-container">format_quote</span>
            <blockquote className="text-4xl md:text-5xl font-body italic leading-tight text-on-surface">
              &ldquo;Intelligence is not found only in books, but in the sweat of the
              trader and the vision of the founder.&rdquo;
            </blockquote>
            <cite className="block font-headline font-bold text-xl text-primary not-italic">
              — Nana Kwesi, Level 12 Entrepreneur
            </cite>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────────────── */}
        <section className="m-6 lg:m-12 rounded-xl hero-gradient py-24 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 kente-pattern opacity-10" />
          <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
            <h3 className="text-4xl md:text-6xl font-headline font-extrabold text-on-primary">
              Ready to write your Accra story?
            </h3>
            <p className="text-xl text-on-primary/80 font-body">
              Join founders questing across the districts today.
            </p>
            <div className="pt-4">
              <Link
                href="/create"
                className="inline-block px-12 py-6 bg-secondary-container text-on-secondary-container rounded-full font-headline font-extrabold text-2xl shadow-2xl hover:scale-105 transition-transform active:scale-95"
              >
                Start Your Quest
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-surface-container-lowest pt-24 pb-12 px-6 lg:px-12">
        <div className="max-w-screen-2xl mx-auto">
          <div className="pt-12 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-on-surface-variant font-body">
              © 2026 HatchQuest. Built with soul in Accra.
            </p>
            <h2 className="text-3xl font-extrabold text-primary italic font-headline">HatchQuest</h2>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
