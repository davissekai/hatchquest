import type { ClientWorldState } from "@hatchquest/shared";

interface HUDProps {
  clientState: ClientWorldState;
  layer: number;
}

export function HUD({ clientState, layer }: HUDProps) {
  const { capital, reputation, networkStrength, turnsElapsed } = clientState;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Turn & Layer */}
      <div className="flex justify-between items-center bg-[#FFC107] border-4 border-slate-900 rounded-[1.5rem] px-5 py-3 shadow-[4px_4px_0px_#0f172a]">
        <div className="flex flex-col">
          <span className="font-headline font-black text-[10px] uppercase tracking-widest text-slate-800">Turn</span>
          <span className="font-headline font-black text-2xl leading-none text-slate-900">{turnsElapsed}</span>
        </div>
        <div className="h-8 w-1 bg-slate-900 rounded-full" />
        <div className="flex flex-col text-right">
          <span className="font-headline font-black text-[10px] uppercase tracking-widest text-slate-800">Layer</span>
          <span className="font-headline font-black text-2xl leading-none text-slate-900">{layer}</span>
        </div>
      </div>

      {/* Capital */}
      <div className="bg-white border-4 border-slate-900 rounded-[1.5rem] p-4 shadow-[4px_4px_0px_#0f172a] flex items-center justify-between group hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all cursor-default">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-lime border-4 border-slate-900 rounded-full flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
            <span className="material-symbols-outlined text-slate-900 font-black text-sm">payments</span>
          </div>
          <span className="font-headline font-black text-xs uppercase tracking-widest text-slate-500">Capital</span>
        </div>
        <span className="font-headline font-black text-xl text-slate-900">
          GHS {capital.toLocaleString()}
        </span>
      </div>

      {/* Reputation */}
      <div className="bg-white border-4 border-slate-900 rounded-[1.5rem] p-4 shadow-[4px_4px_0px_#0f172a] flex items-center justify-between group hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all cursor-default">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-hot-pink border-4 border-slate-900 rounded-full flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
            <span className="material-symbols-outlined text-white font-black text-sm">star</span>
          </div>
          <span className="font-headline font-black text-xs uppercase tracking-widest text-slate-500">Rep</span>
        </div>
        <span className="font-headline font-black text-xl text-slate-900">
          {reputation}
        </span>
      </div>

      {/* Network */}
      <div className="bg-white border-4 border-slate-900 rounded-[1.5rem] p-4 shadow-[4px_4px_0px_#0f172a] flex items-center justify-between group hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] transition-all cursor-default">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pill-blue border-4 border-slate-900 rounded-full flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
            <span className="material-symbols-outlined text-white font-black text-sm">hub</span>
          </div>
          <span className="font-headline font-black text-xs uppercase tracking-widest text-slate-500">Network</span>
        </div>
        <span className="font-headline font-black text-xl text-slate-900">
          {networkStrength}
        </span>
      </div>

    </div>
  );
}
