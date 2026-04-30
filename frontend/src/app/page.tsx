"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Starburst, Sparkle } from "@/components/Decorations";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EB] font-body text-slate-900 overflow-hidden relative selection:bg-hot-pink selection:text-white">
      
      {/* ── Decorative Background Elements (kept deliberately sparse) ── */}
      <Starburst className="w-32 h-32 -top-10 left-1/4 rotate-12" fill="var(--color-pill-red)" />
      <Starburst className="w-48 h-48 bottom-[-5%] left-[25%] -rotate-12" fill="#FFC107" />
      <Sparkle className="w-16 h-16 bottom-[30%] right-[10%]" fill="#FFC107" />

      {/* ── Navigation Header ── */}
      <header className="relative z-20 w-full px-6 py-6 lg:px-12 flex items-center justify-between">
        
        {/* Left: Logo + Text */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full border-4 border-slate-900 overflow-hidden relative shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all bg-white">
            <Image
              src="/assets/ugbs-nest.png"
              alt="UGBS Nest"
              fill
              sizes="56px"
              className="object-contain p-1"
            />
          </div>
          <span className="font-headline font-black text-2xl tracking-tight uppercase">
            HatchQuest
          </span>
        </div>

        <Link
          href="/play"
          className="hidden md:inline-flex font-headline font-black uppercase tracking-widest text-sm hover:text-pill-red transition-colors"
        >
          Play
        </Link>
      </header>

      {/* ── Main Hero Section ── */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 pt-10 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 min-h-[80vh] items-center">
        
        {/* Left: Typography & CTAs */}
        <div className="flex flex-col items-start z-20">
          <h1 className="font-headline font-black text-7xl md:text-8xl lg:text-[110px] leading-[0.9] uppercase tracking-tighter mb-8 drop-shadow-sm">
            <span className="block text-slate-900">Hatch <span className="text-pill-red">Bold,</span></span>
            <span className="block text-slate-900">Grow Smart</span>
          </h1>

          <p className="font-headline font-black text-2xl md:text-3xl uppercase tracking-wider mb-6">
            Grow your startup <br /> and rise with us
          </p>

          <p className="font-body font-bold text-lg text-slate-700 mb-10 max-w-lg leading-relaxed">
            Dive into the bustling markets of Accra. Trade, negotiate, and build your business empire in the ultimate street-smart entrepreneurship simulation.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <Link 
              href="/play" 
              className="px-8 py-4 bg-white border-4 border-slate-900 rounded-full font-headline font-black text-xl uppercase tracking-widest shadow-[6px_6px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[10px_10px_0px_#0f172a] active:translate-y-1 active:shadow-[2px_2px_0px_#0f172a] transition-all flex items-center gap-3"
            >
              Start Playing
            </Link>
            
            <Link 
              href="/create" 
              className="px-8 py-4 bg-transparent border-4 border-transparent rounded-full font-headline font-black text-xl uppercase tracking-widest hover:text-pill-red transition-colors underline decoration-4 underline-offset-8"
            >
              Sign Up
            </Link>
          </div>

        </div>

        {/* Right: Landscape market panel */}
        <div className="relative w-full flex items-center justify-center lg:justify-end z-10">

          {/* Background offset block for neo-brutalist depth */}
          <div className="absolute -bottom-6 -left-6 w-[75%] h-[60%] bg-[#FFC107] rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] -z-10 hidden md:block" />

          {/* Landscape picture frame — portrait stays tall on narrow screens, goes landscape on md+ */}
          <div className="relative w-full max-w-[640px] aspect-[4/5] md:aspect-[16/10] rounded-[2.5rem] border-[8px] border-slate-900 shadow-[16px_16px_0px_#0f172a] overflow-hidden bg-white transform-gpu rotate-1 hover:rotate-0 transition-transform duration-500">
            <Image
              src="/assets/accra-market.png"
              alt="Accra street market — trotros, traders, stalls"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 640px"
              priority
            />
          </div>
        </div>

      </main>
    </div>
  );
}
