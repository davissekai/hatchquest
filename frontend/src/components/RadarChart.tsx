import { useMemo } from "react";

interface RadarChartProps {
  dimensions: {
    autonomy: number;
    innovativeness: number;
    proactiveness: number;
    riskTaking: number;
    competitiveAggressiveness: number;
  };
  maxValue?: number;
}

const labels = ["Autonomy", "Innovative", "Proactiveness", "Risk-Taking", "Comp.\nAggressive"];

// Re-themed for Vivid Desktop aesthetic
const primary = "#FF3B30"; // pill-red
const primaryFill = "rgba(255, 59, 48, 0.35)";
const cardBg = "#FFFFFF";
const fgColor = "#0f172a"; // slate-900

const RadarChart = ({ dimensions, maxValue }: RadarChartProps) => {
  const cx = 200, cy = 190, r = 110;
  const values = [
    dimensions.autonomy,
    dimensions.innovativeness,
    dimensions.proactiveness,
    dimensions.riskTaking,
    dimensions.competitiveAggressiveness,
  ];
  const effectiveMax = maxValue ?? Math.max(...values, 1);

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    const ratio = Math.min(value / effectiveMax, 1);
    return {
      x: cx + r * ratio * Math.cos(angle),
      y: cy + r * ratio * Math.sin(angle),
    };
  };

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const dataPoints = useMemo(
    () => values.map((v, i) => getPoint(i, v)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dimensions, effectiveMax]
  );

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg
      viewBox="-20 0 440 390"
      className="w-full max-w-[320px] mx-auto"
      role="img"
      aria-label="Entrepreneurial profile radar chart"
    >
      <title>Entrepreneurial Profile</title>
      {gridLevels.map((level) => {
        const pts = Array.from({ length: 5 }, (_, i) => getPoint(i, effectiveMax * level));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
        return (
          <path key={level} d={path} fill="none" stroke={fgColor} strokeWidth="1" opacity={0.1} />
        );
      })}

      {Array.from({ length: 5 }, (_, i) => {
        const p = getPoint(i, effectiveMax);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={fgColor} strokeWidth="1" opacity={0.1} />;
      })}

      <path d={dataPath} fill={primaryFill} stroke={primary} strokeWidth="4" />

      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="6" fill={primary} stroke={cardBg} strokeWidth="3" shadow-sm="true" />
      ))}

      {Array.from({ length: 5 }, (_, i) => {
        const p = getPoint(i, effectiveMax * 1.3);
        const anchor = i === 4 ? "end" : i === 1 ? "start" : "middle";
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fill={fgColor}
            fontSize="11"
            fontWeight="900"
            fontFamily="var(--font-headline), 'Fredoka', sans-serif"
            className="uppercase tracking-tighter"
          >
            {labels[i].split("\n").map((line, li) => (
              <tspan key={li} x={p.x} dy={li === 0 ? 0 : 13}>
                {line}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
};

export default RadarChart;
