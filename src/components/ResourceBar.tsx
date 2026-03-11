import React from "react";
import { GlobalState } from "../types/game";

const CurrencyDollarIcon = () => (
  <svg className="w-4 h-4 text-accent inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const UserGroupIcon = () => (
  <svg className="w-4 h-4 text-accent inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const ChartBarIcon = () => (
  <svg className="w-4 h-4 text-accent inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const TagIcon = () => (
  <svg className="w-4 h-4 text-accent inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);
const SparklesIcon = () => (
  <svg className="w-4 h-4 text-accent inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

interface ResourceBarProps {
  resources: GlobalState["resources"];
  flags: GlobalState["flags"];
}

export function ResourceBar({ resources, flags }: ResourceBarProps) {
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="p-6 border-b border-light/10">
      <h3 className="text-xs font-black text-tealAccent uppercase tracking-widest mb-4 flex items-center">
        <SparklesIcon /> Engine Resources
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center bg-light/5 rounded-lg p-2.5 outline outline-1 outline-light/10 shadow-inner">
          <span className="text-light/60 text-sm flex items-center"><CurrencyDollarIcon /> Capital</span>
          <span className="font-bold text-accent">{formatMoney(resources.v_capital)}</span>
        </div>
        <div className="flex justify-between items-center bg-light/5 rounded-lg p-2.5 outline outline-1 outline-light/10 shadow-inner">
          <span className="text-light/60 text-sm flex items-center"><UserGroupIcon /> Reputation</span>
          <span className="font-bold text-tealAccent">{resources.reputation}</span>
        </div>
        <div className="flex justify-between items-center bg-light/5 rounded-lg p-2.5 outline outline-1 outline-light/10 shadow-inner">
          <span className="text-light/60 text-sm flex items-center"><TagIcon /> Network</span>
          <span className="font-bold text-tealAccent">{resources.network}</span>
        </div>
        <div className="flex justify-between items-center bg-light/5 rounded-lg p-2.5 outline outline-1 outline-light/10 shadow-inner">
          <span className="text-light/60 text-sm flex items-center"><ChartBarIcon /> Momentum</span>
          <span className="font-bold text-light">{resources.momentumMultiplier}x</span>
        </div>
      </div>
      
      <h3 className="text-xs font-black text-tealAccent uppercase tracking-widest mt-8 mb-4 flex items-center">
         Flags
      </h3>
      <div className="space-y-2 text-sm text-light/70">
         {Object.entries(flags).map(([key, val]) => (
           <div key={key} className="flex justify-between bg-light/5 p-2 rounded-lg">
             <span>{key}</span>
             <span className={val ? "text-accent font-bold" : "text-light/30"}>{val ? "Yes" : "No"}</span>
           </div>
         ))}
      </div>
    </div>
  );
}
