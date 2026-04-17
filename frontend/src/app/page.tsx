import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-vivid-blue bg-gradient-to-b from-sky-blue to-vivid-blue font-body text-slate-900 overflow-x-hidden">
      {/* Abstract Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-white rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-lime rounded-full blur-[120px] opacity-40" />
      </div>

      <main className="relative z-10 pt-24 pb-16 px-6 lg:px-12 max-w-screen-2xl mx-auto flex flex-col items-center justify-center min-h-[90vh]">
        
        {/* ── Hero Content ──────────────────────────────────────────────────────── */}
        <div className="text-center space-y-10 max-w-5xl mx-auto w-full">
          
          {/* Logo container */}
          <div className="mx-auto w-64 md:w-96 relative hover:scale-105 transition-transform duration-500 ease-out drop-shadow-2xl">
            <Image 
              src="/assets/logo.jpg" 
              alt="UGBS NEST Logo" 
              width={800} 
              height={400} 
              className="rounded-3xl border-4 border-white shadow-xl object-contain bg-white"
              priority
            />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline font-black text-white drop-shadow-lg tracking-tight leading-tight">
            Build Your Legacy <br/>
            <span className="text-lime bg-slate-900/10 px-4 rounded-3xl inline-block mt-2 shadow-inner">In Accra</span>
          </h1>

          <p className="text-xl md:text-3xl text-white/90 max-w-3xl mx-auto leading-relaxed font-body font-bold drop-shadow-md">
            HatchQuest bridges the prestigious halls of Legon with the
            electric rhythm of Makola. The ultimate desktop simulation experience.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <Link
              href="/create"
              className="group px-12 py-6 bg-grass-green text-white rounded-full font-headline font-black text-2xl shadow-[0_15px_30px_rgba(50,205,50,0.5)] hover:scale-110 hover:-translate-y-2 transition-all duration-300 active:scale-95 border-4 border-white flex items-center gap-3"
            >
              <span>Start Your Quest</span>
              <span className="material-symbols-outlined text-3xl group-hover:translate-x-2 transition-transform">
                arrow_forward
              </span>
            </Link>
            <Link
              href="/resume"
              className="px-12 py-6 bg-white text-slate-900 rounded-full font-headline font-bold text-2xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:scale-105 transition-all duration-300 active:scale-95 border-4 border-transparent hover:border-slate-900"
            >
              Resume Session
            </Link>
          </div>
        </div>

        {/* ── Visual Showcase (Cropped LinkedIn Cover) ────────────────────── */}
        <div className="mt-20 w-full max-w-6xl mx-auto perspective-1000">
          <div className="relative w-full aspect-[21/9] rounded-[3rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)] border-8 border-white hover:scale-[1.02] hover:-rotate-1 transition-all duration-700 ease-out bg-white">
            {/* Using object-cover to clip off top/bottom black bars implicitly by zooming the image in slightly */}
            <Image 
              src="/assets/nest_cover.jpg" 
              alt="UGBS Nest Cover" 
              fill
              className="object-cover scale-110 object-center" 
              priority
            />
            {/* Overlay Gradient for polish */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
          </div>
        </div>

      </main>
    </div>
  );
}
