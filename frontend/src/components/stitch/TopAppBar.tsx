import React from "react";

interface TopAppBarProps {
  title?: string;
  /** When provided, shows the wallet balance on the right side */
  walletBalance?: number;
  /** When provided, shows layer + turn info in center */
  gameInfo?: { layer: number; turn: number };
}

/**
 * Stitch TopAppBar — fixed, frosted-glass header used across all screens.
 * Matches the "rounded-b-[3rem] bg-stone-50/80 backdrop-blur-xl" spec from mockups.
 */
export const TopAppBar = ({ title, walletBalance, gameInfo }: TopAppBarProps) => {
  return (
    <header className="fixed top-0 w-full z-50 rounded-b-[3rem] bg-stone-50/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(21,5,120,0.08)]">
      <div className="flex justify-between items-center px-8 py-5 w-full max-w-screen-2xl mx-auto">
        {/* Branding */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border-2 border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              rocket_launch
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-primary italic font-headline tracking-tight">
            {title ?? "HatchQuest"}
          </h1>
        </div>

        {/* Center — game context (layer, turn) */}
        {gameInfo && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-low">
            <span className="material-symbols-outlined text-primary text-base">layers</span>
            <span className="font-label text-xs font-bold text-on-surface-variant">
              Layer {gameInfo.layer} · Turn {gameInfo.turn}
            </span>
          </div>
        )}

        {/* Right — wallet / capital */}
        {walletBalance !== undefined && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low text-primary hover:bg-surface-container transition-all font-label font-bold text-sm">
            <span className="material-symbols-outlined text-base">account_balance_wallet</span>
            GHS {walletBalance.toLocaleString()}
          </button>
        )}

        {/* Right — nav placeholder when no game info */}
        {!walletBalance && !gameInfo && (
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-primary hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-base">account_balance_wallet</span>
          </button>
        )}
      </div>
    </header>
  );
};
