import React from "react";

interface TopAppBarProps {
  title?: string;
  /** When provided, shows the wallet balance on the right side */
  walletBalance?: number;
  /** When provided, shows layer + turn info in center */
  gameInfo?: { layer: number; turn: number };
}

/**
 * TopAppBar — fixed, frosted-glass header used across all screens.
 * Refined for the "Vibrant Rounded Graffiti" aesthetic.
 */
export const TopAppBar = ({ title, walletBalance, gameInfo }: TopAppBarProps) => {
  return (
    <header className="fixed top-0 w-full z-50 rounded-b-[3rem] bg-cream/90 backdrop-blur-xl shadow-[0_12px_40px_rgba(30,58,138,0.1)] border-b-4 border-white">
      <div className="flex justify-between items-center px-8 py-5 w-full max-w-screen-2xl mx-auto">
        {/* Branding */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-hot-pink/20 flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-hot-pink text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              rocket_launch
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-navy italic font-headline tracking-tight">
            {title ?? "HatchQuest"}
          </h1>
        </div>

        {/* Center — game context (layer, turn) */}
        {gameInfo && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-cream shadow-sm">
            <span className="material-symbols-outlined text-hot-pink text-base">layers</span>
            <span className="font-label text-xs font-bold text-navy/70">
              Layer {gameInfo.layer} · Turn {gameInfo.turn}
            </span>
          </div>
        )}

        {/* Right — wallet / capital */}
        {walletBalance !== undefined && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-lime text-navy hover:scale-105 transition-all font-label font-bold text-sm shadow-sm border-2 border-white">
            <span className="material-symbols-outlined text-base">account_balance_wallet</span>
            GHS {walletBalance.toLocaleString()}
          </button>
        )}

        {/* Right — nav placeholder when no game info */}
        {walletBalance === undefined && !gameInfo && (
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-navy hover:bg-cream transition-all border-2 border-cream shadow-sm">
            <span className="material-symbols-outlined text-base">account_balance_wallet</span>
          </button>
        )}
      </div>
    </header>
  );
};
