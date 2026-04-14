import React from "react";

interface HUDStat {
  label: string;
  value: string | number;
}

export const StitchResourceHUD = ({ stats }: { stats: HUDStat[] }) => {
  return (
    <div className="flex border-4 border-primary bg-white shadow-[8px_8px_0px_0px_rgba(82,79,178,0.2)]">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={`flex flex-1 flex-col items-center justify-center py-4 px-2 ${
            i < stats.length - 1 ? "border-r-2 border-surface-container-high" : ""
          }`}
        >
          <span className="font-headline text-[10px] tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {stat.label}
          </span>
          <span className="font-headline text-lg text-primary font-bold">{stat.value}</span>
        </div>
      ))}
    </div>
  );
};
