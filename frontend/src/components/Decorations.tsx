import React from "react";

export const Starburst = ({ className, fill }: { className?: string; fill: string }) => (
  <svg
    viewBox="0 0 200 200"
    className={`absolute pointer-events-none ${className}`}
    style={{ filter: "drop-shadow(6px 6px 0px #0f172a)" }}
  >
    <path
      d="M100 0L122.451 61.8034L187.633 34.5492L150 90.4508L200 138.197L134.549 143.267L150 200L100 150L50 200L65.4508 143.267L0 138.197L50 90.4508L12.3667 34.5492L77.5492 61.8034L100 0Z"
      fill={fill}
      stroke="#0f172a"
      strokeWidth="6"
      strokeLinejoin="round"
    />
  </svg>
);

export const Sparkle = ({ className, fill }: { className?: string; fill: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={`absolute pointer-events-none ${className}`}
  >
    <path
      d="M50 0C50 0 50 40 100 50C100 50 60 50 50 100C50 100 50 60 0 50C0 50 40 50 50 0Z"
      fill={fill}
      stroke="#0f172a"
      strokeWidth="4"
      strokeLinejoin="round"
    />
  </svg>
);
