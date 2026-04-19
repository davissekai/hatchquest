import React from "react";

interface RadarChartProps {
  dimensions: {
    autonomy: number;
    innovativeness: number;
    riskTaking: number;
    proactiveness: number;
    competitiveAggressiveness: number;
  };
  maxValue?: number;
  size?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({
  dimensions,
  maxValue = 100,
  size = 320,
}) => {
  const labels = [
    { key: "autonomy", label: "AUTONOMY" },
    { key: "innovativeness", label: "INNOVATION" },
    { key: "riskTaking", label: "RISK" },
    { key: "proactiveness", label: "PROACTIVE" },
    { key: "competitiveAggressiveness", label: "COMPETE" },
  ];

  const numAxes = labels.length;
  const center = size / 2;
  const radius = size / 2 - 55;
  const angleStep = (Math.PI * 2) / numAxes;

  const getPoint = (value: number, index: number, offset = 0) => {
    const r = (value / maxValue) * radius;
    const angle = index * angleStep - Math.PI / 2 + offset;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const dataPoints = labels.map((dim, i) =>
    getPoint(dimensions[dim.key as keyof typeof dimensions] ?? 0, i)
  );

  const dataPath =
    dataPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ") + " Z";

  const shadowPath =
    dataPoints.map((p, i) => (i === 0 ? `M ${p.x + 6} ${p.y + 6}` : `L ${p.x + 6} ${p.y + 6}`)).join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible font-headline font-black">
      
      {/* Background Web */}
      {[1, 0.75, 0.5, 0.25].map((scale) => {
        const polyPoints = labels
          .map((_, i) => getPoint(maxValue * scale, i))
          .map((p) => `${p.x},${p.y}`)
          .join(" ");
        return (
          <polygon
            key={scale}
            points={polyPoints}
            fill={scale === 1 ? "#F5F2EB" : "none"}
            stroke="#0f172a"
            strokeWidth="4"
            strokeDasharray={scale === 1 ? "none" : "6 6"}
          />
        );
      })}

      {/* Axes */}
      {labels.map((_, i) => {
        const p = getPoint(maxValue, i);
        return (
          <line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="#0f172a"
            strokeWidth="4"
          />
        );
      })}

      {/* Shadow layer for the data polygon (Neo-brutalist pop) */}
      <path d={shadowPath} fill="#0f172a" />

      {/* Actual Data Polygon */}
      <path
        d={dataPath}
        fill="var(--color-pill-blue)"
        stroke="#0f172a"
        strokeWidth="6"
        strokeLinejoin="miter"
      />

      {/* Labels */}
      {labels.map((dim, i) => {
        // Push labels ~15% beyond the max radius. Must scale proportionally to
        // maxValue — an additive offset breaks at low maxValue (e.g. 10) because
        // getPoint scales r by (value / maxValue).
        const p = getPoint(maxValue * 1.18, i);
        return (
          <text
            key={`label-${i}`}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            alignmentBaseline="middle"
            fill="#0f172a"
            className="text-[10px] tracking-widest uppercase drop-shadow-[2px_2px_0px_white]"
          >
            {dim.label}
          </text>
        );
      })}

      {/* Data Points */}
      {dataPoints.map((p, i) => (
        <circle
          key={`point-${i}`}
          cx={p.x}
          cy={p.y}
          r="6"
          fill="#FFC107"
          stroke="#0f172a"
          strokeWidth="4"
        />
      ))}
    </svg>
  );
};

export default RadarChart;
