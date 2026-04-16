"use client";

import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";

const SessionExpired = () => {
  const router = useRouter();
  const { resetGame } = useGame();

  return (
    <div className="min-h-screen bg-cream flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 adinkra-pattern opacity-10 z-0" />
      
      {/* Zone 1 — navy */}
      <div className="bg-navy flex flex-col justify-center px-8 pt-24 pb-16 flex-[0_0_45%] relative z-10 rounded-b-[4rem] shadow-[0_20px_60px_rgba(30,58,138,0.3)] border-b-8 border-white">
        <span className="font-headline font-black text-hot-pink tracking-[0.3em] mb-6 uppercase text-sm drop-shadow-sm">
          SESSION TERMINATED
        </span>
        <h1 className="font-headline font-black text-white italic leading-none tracking-tighter text-6xl md:text-8xl drop-shadow-md">
          The market<br />didn&apos;t wait.
        </h1>
        <p className="font-body text-xl text-white/70 mt-6 max-w-md font-medium leading-relaxed">
          Your session expired. Accra pulsates at its own rhythm, and sometimes we fall behind.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-end px-8 pb-12 relative z-10">
        <button
          onClick={() => { resetGame(); router.push("/"); }}
          className="w-full py-6 bg-lime text-navy font-headline font-black text-xl rounded-full shadow-[0_12px_40px_rgba(57,255,20,0.4)] border-4 border-white hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
        >
          START NEW GAME
          <span className="material-symbols-outlined font-black">add</span>
        </button>
      </div>
    </div>
  );
};

export default SessionExpired;
