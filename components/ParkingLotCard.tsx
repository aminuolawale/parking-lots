"use client";

import { useState } from "react";
import ScoreRing from "./ScoreRing";
import ScoreBar from "./ScoreBar";
import type { ScoredParkingLot } from "@/types";

interface Props {
  lot: ScoredParkingLot;
  index: number;
}

const LABEL_COLOR: Record<string, string> = {
  "Excellent Condition": "#22c55e",
  "Good Condition": "#84cc16",
  "Moderate Wear": "#eab308",
  "Significant Deterioration": "#f97316",
  "Critical Rehabilitation Needed": "#ef4444",
};

export default function ParkingLotCard({ lot, index }: Props) {
  const [imgError, setImgError] = useState(false);

  const mapsUrl = `https://www.google.com/maps?q=${lot.lat},${lot.lon}&z=18&t=k`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-[#111] border border-[#1c1c1c] rounded-lg overflow-hidden hover:border-[#2e2e2e] transition-colors duration-200"
    >
      {/* Satellite image */}
      <div className="relative aspect-[16/10] bg-[#0d0d0d] overflow-hidden">
        {!imgError ? (
          <img
            src={lot.imageUrl}
            alt={lot.name ?? `Parking lot ${index + 1}`}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[#333] text-xs">Image unavailable</span>
          </div>
        )}

        {/* Score badge */}
        {lot.scoreStatus === "done" && lot.score && (
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full p-1">
            <ScoreRing score={lot.score.overall} size={52} />
          </div>
        )}
        {lot.scoreStatus === "loading" && (
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full w-[52px] h-[52px] flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Index */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-[#555] text-[11px] px-2 py-0.5 rounded font-mono">
          {String(index + 1).padStart(2, "0")}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-[#f0ece6] text-sm font-medium leading-snug">
            {lot.name ?? "Unnamed Parking Lot"}
          </p>
          <p className="text-[#444] text-[11px] mt-0.5 font-mono">
            {lot.lat.toFixed(5)}, {lot.lon.toFixed(5)}
          </p>
        </div>

        {/* Meta tags */}
        <div className="flex gap-1.5 flex-wrap">
          {lot.surface && (
            <span className="text-[10px] px-2 py-0.5 bg-[#1a1a1a] border border-[#252525] text-[#555] rounded uppercase tracking-wider">
              {lot.surface}
            </span>
          )}
          {lot.capacity && (
            <span className="text-[10px] px-2 py-0.5 bg-[#1a1a1a] border border-[#252525] text-[#555] rounded uppercase tracking-wider">
              {lot.capacity} spaces
            </span>
          )}
        </div>

        {/* Score breakdown */}
        {lot.scoreStatus === "done" && lot.score && (
          <div className="space-y-2 pt-1 border-t border-[#1a1a1a]">
            <p
              className="text-[11px] font-medium"
              style={{ color: LABEL_COLOR[lot.score.label] ?? "#888" }}
            >
              {lot.score.label}
            </p>
            <ScoreBar label="Surface" value={lot.score.surface} />
            <ScoreBar label="Markings" value={lot.score.markings} />
            <ScoreBar label="Drainage" value={lot.score.drainage} />
            <ScoreBar label="Vegetation" value={lot.score.vegetation} />
            <p className="text-[#444] text-[11px] leading-relaxed pt-1">{lot.score.summary}</p>
          </div>
        )}

        {lot.scoreStatus === "loading" && (
          <div className="pt-1 border-t border-[#1a1a1a] space-y-2">
            {[20, 28, 24, 20].map((w, i) => (
              <div key={i} className={`h-[3px] bg-[#1a1a1a] rounded animate-pulse`} style={{ width: `${w + Math.random() * 40}%` }} />
            ))}
          </div>
        )}

        {lot.scoreStatus === "error" && (
          <p className="text-[#333] text-[11px] pt-1 border-t border-[#1a1a1a]">
            Score unavailable
          </p>
        )}
      </div>
    </a>
  );
}
