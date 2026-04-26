"use client";

interface Props {
  score: number; // 1–10
  size?: number;
}

function scoreColor(s: number) {
  if (s <= 2) return "#22c55e";
  if (s <= 4) return "#84cc16";
  if (s <= 6) return "#eab308";
  if (s <= 8) return "#f97316";
  return "#ef4444";
}

export default function ScoreRing({ score, size = 56 }: Props) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = ((score - 1) / 9) * circ;
  const color = scoreColor(score);

  return (
    <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e1e1e" strokeWidth={5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="relative text-sm font-semibold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}
