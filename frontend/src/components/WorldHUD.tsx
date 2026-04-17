"use client";

import { useMemo } from "react";
import type { ClientWorldState } from "@hatchquest/shared";

interface WorldHUDProps {
  clientState: ClientWorldState;
}

export function WorldHUD({ clientState }: WorldHUDProps) {
  const { worldSignals, playerBusinessName } = clientState;

  const currentBusiness = useMemo(() => {
    return playerBusinessName || "Local Commerce";
  }, [playerBusinessName]);

  const activeCrisis = useMemo(() => {
    return worldSignals?.lastEventLabel || null;
  }, [worldSignals]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="font-headline font-black text-2xl uppercase tracking-tighter text-slate-900 border-b-8 border-slate-900 pb-2">
        World Data
      </h2>

      {/* Sector Panel */}
      <div className="bg-lime border-4 border-slate-900 rounded-[1.5rem] p-5 shadow-[4px_4px_0px_#0f172a] relative overflow-hidden">
        <div className="absolute -top-3 -right-3 w-16 h-16 bg-[#FFC107] border-4 border-slate-900 rounded-full opacity-50" />
        <div className="relative z-10 flex flex-col gap-1">
          <span className="font-headline font-black text-xs uppercase tracking-widest text-slate-800">
            Current Business
          </span>
          <span className="font-headline font-black text-2xl text-slate-900 drop-shadow-sm leading-none mt-1">
            {currentBusiness}
          </span>
        </div>
      </div>

      {/* Crisis Panel */}
      <div className={`border-4 border-slate-900 rounded-[1.5rem] p-5 shadow-[4px_4px_0px_#0f172a] relative overflow-hidden ${activeCrisis ? 'bg-pill-red' : 'bg-white'}`}>
        <div className="relative z-10 flex flex-col gap-1">
          <span className={`font-headline font-black text-xs uppercase tracking-widest ${activeCrisis ? 'text-white/80' : 'text-slate-500'}`}>
            Global Status
          </span>
          <span className={`font-headline font-black text-xl leading-tight mt-1 ${activeCrisis ? 'text-white' : 'text-slate-900'}`}>
            {activeCrisis ? activeCrisis : "Market Stable"}
          </span>
        </div>
        {activeCrisis && (
           <span className="material-symbols-outlined absolute -bottom-4 -right-2 text-7xl text-slate-900/20 rotate-12">
             warning
           </span>
        )}
      </div>

    </div>
  );
}
