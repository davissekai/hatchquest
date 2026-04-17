"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Starburst, Sparkle } from "@/components/Decorations";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EB] font-body text-slate-900 overflow-hidden relative selection:bg-hot-pink selection:text-white">
      
      {/* ── Decorative Background Elements ── */}
      <Starburst className="w-32 h-32 -top-10 left-1/4 rotate-12" fill="var(--color-pill-red)" />
      <Starburst className="w-48 h-48 bottom-[-5%] left-[25%] -rotate-12" fill="#FFC107" />
      <Starburst className="w-24 h-24 top-[30%] right-[5%] rotate-45 z-20" fill="var(--color-hot-pink)" />
      
      <Sparkle className="w-12 h-12 top-[15%] left-[10%]" fill="var(--color-pill-red)" />
      <Sparkle className="w-16 h-16 bottom-[30%] right-[10%]" fill="#FFC107" />
      <Sparkle className="w-8 h-8 top-[40%] left-[45%]" fill="var(--color-sky-blue)" />

      {/* A solid circle decoration */}
      <div className="absolute bottom-[10%] right-[30%] w-8 h-8 bg-pill-red rounded-full border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a]" />
      <div className="absolute top-[20%] right-[40%] w-4 h-4 bg-grass-green rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]" />

      {/* ── Navigation Header ── */}
      <header className="relative z-20 w-full px-6 py-6 lg:px-12 flex items-center justify-between">
        
        {/* Left: Logo + Text */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full border-4 border-slate-900 overflow-hidden relative shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all bg-white">
            <Image
              src="/assets/logo.jpg"
              alt="HatchQuest Logo"
              fill
              className="object-cover -translate-x-1" // Slight offset to the right visually, but actually the image shifts left so the logo is right-heavy? Let's center it normally and let the user see.
            />
          </div>
          <span className="font-headline font-black text-2xl tracking-tight uppercase">
            HatchQuest
          </span>
        </div>

        {/* Middle: Links */}
        <nav className="hidden lg:flex items-center gap-10 font-headline font-black uppercase tracking-widest text-sm">
          <Link href="/" className="hover:text-pill-red transition-colors">Home</Link>
          <Link href="/lore" className="hover:text-pill-red transition-colors">Lore</Link>
          <Link href="/market" className="hover:text-pill-red transition-colors">Market</Link>
          <Link href="/about" className="hover:text-pill-red transition-colors">About</Link>
        </nav>

        {/* Right: Search / Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-white border-4 border-slate-900 rounded-full px-4 py-2 shadow-[4px_4px_0px_#0f172a] w-64">
            <span className="material-symbols-outlined text-slate-900 mr-2 font-bold">search</span>
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none outline-none font-body font-bold w-full placeholder:text-slate-400"
            />
          </div>
        </div>
      </header>

      {/* ── Main Hero Section ── */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 pt-10 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 min-h-[80vh] items-center">
        
        {/* Left: Typography & CTAs */}
        <div className="flex flex-col items-start z-20">
          <h1 className="font-headline font-black text-7xl md:text-8xl lg:text-[110px] leading-[0.9] uppercase tracking-tighter mb-8 drop-shadow-sm">
            <span className="block text-slate-900">Hatch <span className="text-pill-red">Bold,</span></span>
            <span className="block text-slate-900">Grow Smart</span>
          </h1>

          <h2 className="font-headline font-black text-2xl md:text-3xl uppercase tracking-wider mb-6">
            Grow your startup <br /> and rise with us
          </h2>

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

          {/* Social Icons Placeholder */}
          <div className="mt-16 flex gap-4">
            {["twitter", "discord", "reddit", "instagram"].map(social => (
              <a 
                key={social} 
                href="#" 
                className="w-12 h-12 bg-pill-red rounded-full border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] flex items-center justify-center hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all"
              >
                {/* Dummy icon text for now */}
                <span className="font-headline font-black text-white text-xs uppercase">{social[0]}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Right: Massive Pill Mask Image */}
        <div className="relative w-full h-[600px] md:h-[700px] flex items-center justify-center lg:justify-end z-10 perspective-1000">
          
          {/* Background Yellow Offset Circle (Like the reference) */}
          <div className="absolute top-1/2 -translate-y-1/2 left-[10%] w-[400px] h-[400px] bg-[#FFC107] rounded-full border-4 border-slate-900 shadow-[8px_8px_0px_#0f172a] -z-10 hidden md:block" />

          {/* The Main Pill Container */}
          <div className="relative w-[90%] md:w-[80%] max-w-[450px] h-full rounded-t-full rounded-b-full border-[8px] border-slate-900 shadow-[16px_16px_0px_#0f172a] overflow-hidden bg-white transform-gpu rotate-2 hover:rotate-0 transition-transform duration-500">
            <Image
              src="/assets/nest_cover.jpg"
              alt="HatchQuest Cover"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 450px"
              priority
            />
          </div>
        </div>

      </main>
    </div>
  );
}
