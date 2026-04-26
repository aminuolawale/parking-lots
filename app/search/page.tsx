"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SearchForm from "@/components/SearchForm";
import ParkingLotCard from "@/components/ParkingLotCard";
import type { ParkingLot, ParkingLotScore, ScoredParkingLot } from "@/types";

type Status = "idle" | "searching" | "scoring" | "done" | "error";

export default function SearchPage() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const [status, setStatus] = useState<Status>("idle");
  const [regionLabel, setRegionLabel] = useState("");
  const [lots, setLots] = useState<ScoredParkingLot[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!q) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setStatus("searching");
    setLots([]);
    setErrorMsg("");
    setRegionLabel("");

    async function run() {
      try {
        // 1. Fetch parking lots
        const res = await fetch(`/api/lots?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? "Failed to fetch lots");
        }
        const data = await res.json() as { lots: ParkingLot[]; region: string; total: number };
        if (ctrl.signal.aborted) return;

        setRegionLabel(data.region);

        const initial: ScoredParkingLot[] = data.lots.map((l) => ({
          ...l,
          scoreStatus: "loading",
        }));
        setLots(initial);
        setStatus("scoring");

        // 2. Score each lot in parallel
        await Promise.all(
          data.lots.map(async (lot, i) => {
            try {
              const sr = await fetch("/api/score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: lot.imageUrl, lat: lot.lat, lon: lot.lon }),
                signal: ctrl.signal,
              });
              if (!sr.ok) throw new Error("score failed");
              const score = await sr.json() as ParkingLotScore;
              if (ctrl.signal.aborted) return;
              setLots((prev) => {
                const next = [...prev];
                next[i] = { ...next[i], score, scoreStatus: "done" };
                return next;
              });
            } catch {
              if (ctrl.signal.aborted) return;
              setLots((prev) => {
                const next = [...prev];
                next[i] = { ...next[i], scoreStatus: "error" };
                return next;
              });
            }
          })
        );

        if (!ctrl.signal.aborted) setStatus("done");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setErrorMsg(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    }

    run();
    return () => ctrl.abort();
  }, [q]);

  const scored = lots.filter((l) => l.scoreStatus === "done").length;
  const sortedLots = [...lots].sort((a, b) => {
    if (a.scoreStatus === "done" && b.scoreStatus === "done") {
      return (b.score?.overall ?? 0) - (a.score?.overall ?? 0);
    }
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 px-6 py-4 bg-[#090909]/90 backdrop-blur-md border-b border-[#1c1c1c] flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 hover:opacity-70 transition-opacity"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
          <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#555]">
            ParkingScan
          </span>
        </Link>
        <div className="flex-1 max-w-sm">
          <SearchForm initialValue={q} compact />
        </div>
      </header>

      <main className="flex-1 px-6 py-10 max-w-7xl mx-auto w-full">
        {/* Status bar */}
        {status === "searching" && (
          <div className="flex items-center gap-3 mb-10">
            <div className="w-4 h-4 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
            <span className="text-[#555] text-sm">Locating parking lots in {q}…</span>
          </div>
        )}

        {status === "error" && (
          <div className="mb-10 p-4 border border-[#2a1a1a] bg-[#1a0a0a] rounded-lg">
            <p className="text-[#ef4444] text-sm">{errorMsg}</p>
          </div>
        )}

        {lots.length > 0 && (
          <>
            {/* Stats row */}
            <div className="mb-8 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <h1 className="text-[#f0ece6] text-xl font-semibold">
                {regionLabel.split(",")[0]}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-[#555] text-xs font-mono">
                  {lots.length} lots found
                </span>
                {status === "scoring" && (
                  <span className="text-[#c9a84c] text-xs font-mono">
                    {scored}/{lots.length} scored
                  </span>
                )}
                {status === "done" && (
                  <span className="text-[#22c55e] text-xs font-mono">Analysis complete</span>
                )}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedLots.map((lot, i) => (
                <ParkingLotCard key={lot.id} lot={lot} index={i} />
              ))}
            </div>
          </>
        )}

        {status === "done" && lots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-[#333] text-sm mb-2">No parking lots found</p>
            <p className="text-[#222] text-xs">Try a different city or a larger area</p>
          </div>
        )}
      </main>

      <footer className="px-8 py-4 border-t border-[#1c1c1c] flex items-center justify-between">
        <span className="text-[11px] text-[#2a2a2a] font-mono">
          Powered by OpenStreetMap · Mapbox · Claude
        </span>
        <span className="text-[11px] text-[#2a2a2a] font-mono">
          {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
