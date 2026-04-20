"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";

interface GameButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "yellow" | "green" | "blue" | "red" | "aqua" | "royal";
  className?: string;
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export function GameButton({
  children,
  onClick,
  variant = "yellow",
  className = "",
  size = "md",
  type = "button",
  disabled = false,
}: GameButtonProps) {
  const variants = {
    yellow: "btn-3d-yellow text-black",
    green: "btn-3d-green text-white",
    blue: "btn-3d-blue text-white",
    aqua: "btn-3d-aqua text-white",
    royal: "btn-3d-royal-blue text-white",
    red: "bg-game-red text-white shadow-[0_8px_0_#9D1626,0_12px_0_#0F172A] border-[4px] border-game-dark",
  };

  const sizes = {
    sm: "px-6 py-3 text-lg",
    md: "px-8 py-3 text-xl leading-none",
    lg: "px-12 py-5 text-3xl leading-none",
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95, y: 4 } : {}}
      onClick={!disabled ? onClick : undefined}
      type={type}
      disabled={disabled}
      className={`
        game-button rounded-xl ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      style={{ transform: "skewX(-10deg)" }}
    >
      <div style={{ transform: "skewX(10deg)" }}>
        <span className="relative z-10 text-stroke-heavy">{children}</span>
      </div>
    </motion.button>
  );
}

interface StatPillProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
}

export function StatPill({ label, value, icon, color = "text-white" }: StatPillProps) {
  return (
    <div className="slanted-pill" aria-label={label}>
      <div className={color}>{icon}</div>
      <div className="flex items-baseline gap-2 leading-none">
        <span className="text-[14px] font-display font-black text-stroke-heavy italic">{value}</span>
      </div>
    </div>
  );
}

export function ProgressBar({
  label,
  value,
  max,
  colorClass,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1 px-2">
        <span className="text-sm font-black uppercase text-stroke-heavy italic opacity-95">{label}</span>
      </div>
      <div className="slanted-progress-container bg-slate-100 border border-slate-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`slanted-progress-fill rounded-r-lg ${colorClass}`}
        />
      </div>
    </div>
  );
}
