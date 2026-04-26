"use client";

interface Props {
  label: string;
  value: number; // 1–10
}

function barColor(v: number) {
  if (v <= 2) return "#22c55e";
  if (v <= 4) return "#84cc16";
  if (v <= 6) return "#eab308";
  if (v <= 8) return "#f97316";
  return "#ef4444";
}

export default function ScoreBar({ label, value }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-[11px] text-[#555] uppercase tracking-wider shrink-0">{label}</span>
      <div className="flex-1 h-[3px] bg-[#1e1e1e] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${((value - 1) / 9) * 100}%`, backgroundColor: barColor(value) }}
        />
      </div>
      <span className="text-[11px] tabular-nums" style={{ color: barColor(value) }}>
        {value}
      </span>
    </div>
  );
}
