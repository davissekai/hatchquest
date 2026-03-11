import React from "react";

export interface ChoiceButtonProps {
  label: string;
  text: string;
  disabled?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
}

export default function ChoiceButton({
  label,
  text,
  disabled = false,
  isSelected = false,
  onSelect,
}: ChoiceButtonProps) {
  const isDimmed = disabled && !isSelected;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`group relative flex items-center w-full px-5 py-5 sm:py-6 text-left rounded-full transition-all duration-300 outline-none
        ${isSelected 
          ? "bg-accent border border-accent text-primary shadow-[0_0_30px_rgba(247,184,1,0.5)] transform scale-[1.02] z-20" 
          : "bg-[#001733] border-2 border-mutedBlue/30 hover:border-accent/80 hover:bg-[#001A3A] hover:shadow-[0_0_20px_rgba(247,184,1,0.2)] text-light"
        }
        ${isDimmed ? "opacity-30 scale-95" : "opacity-100"}
        disabled:cursor-not-allowed
      `}
    >
      <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-black text-base md:text-lg mr-4 lg:mr-5 flex-shrink-0 transition-colors duration-300 shadow-inner
        ${isSelected 
          ? "bg-primary text-accent" 
          : "bg-mutedBlue/20 text-accent group-hover:bg-accent/20"
        }
      `}>
        {label}
      </div>
      <span className={`text-sm sm:text-base lg:text-lg font-semibold tracking-wide transition-colors ${isSelected ? "text-primary" : "text-light/90 group-hover:text-light"}`}>
        {text}
      </span>
      
      {/* Hex tails */}
      <div className={`hidden sm:block absolute -left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rotate-45 transition-colors duration-300 ${isSelected ? "bg-accent" : "bg-[#001733] border-b-2 border-l-2 border-mutedBlue/30 group-hover:border-accent/80"}`}></div>
      <div className={`hidden sm:block absolute -right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rotate-45 transition-colors duration-300 ${isSelected ? "bg-accent" : "bg-[#001733] border-t-2 border-r-2 border-mutedBlue/30 group-hover:border-accent/80"}`}></div>
    </button>
  );
}