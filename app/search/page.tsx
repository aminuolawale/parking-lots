"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import SearchForm from "@/components/SearchForm";
import ParkingLotCard from "@/components/ParkingLotCard";
import type {
  LotsResponse,
  ParkingLotScore,
  ScoredParkingLot,
  LimitOption,
} from "@/types";
import { DEFAULT_LIMIT, LIMIT_OPTIONS } from "@/types";

type Status = "idle" | "searching" | "scoring" | "done" | "error";

function SearchContent() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const limitParam = parseInt(params.get("limit") ?? String(DEFAULT_LIMIT), 10);
  const limit = (LIMIT_OPTIONS.includes(limitParam as LimitOption)
    ? limitParam
    : DEFAULT_LIMIT) as LimitOption;

  const [status, setStatus] = useState<Status>("idle");
  const [regionLabel, setRegionLabel] = useState("");
  const [storedTotal, setStoredTotal] = useState(0);
  const [fromCache, setFromCache] = useState(false);
  const [lots, setLots] = useState<ScoredParkingLot[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const prevQRef = useRef("");

  useEffect(() => {
    if (!q) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const isNewCity = q !== prevQRef.current;
    prevQRef.current = q;

    // Clear lots only when the city changes, not just the limit.
    if (isNewCity) setLots([]);
    setStatus("searching");
    setErrorMsg("");

    async function run() {
      try {
        const res = await fetch(
          `/api/lots?q=${encodeURIComponent(q)}&limit=${limit}`,
          { signal: ctrl.signal }
        );
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? "Failed to fetch lots");
        }
        const data = (await res.json()) as LotsResponse;
        if (ctrl.signal.aborted) return;

        setRegionLabel(data.region);
        setStoredTotal(data.storedTotal);
        setFromCache(data.fromCache);

        // Seed UI state — pre-populate cached scores immediately.
        const initial: ScoredParkingLot[] = data.lots.map((l) => ({
          ...l,
          score: l.cachedScore ?? undefined,
          scoreStatus: l.cachedScore ? "done" : "loading",
        }));
        setLots(initial);

        // Determine which lots still need scoring.
        const needScore = data.lots.filter((l) => !l.cachedScore);

        if (needScore.length === 0) {
          setStatus("done");
          return;
        }

        setStatus("scoring");

        // Score only the uncached lots, in parallel.
        await Promise.all(
          needScore.map(async (lot) => {
            const lotIndex = data.lots.findIndex((l) => l.id === lot.id);
            try {
              const sr = await fetch("/api/score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: lot.imageUrl, lotId: lot.id }),
                signal: ctrl.signal,
              });
              if (!sr.ok) throw new Error("score failed");
              const score = (await sr.json()) as ParkingLotScore;
              if (ctrl.signal.aborted) return;
              setLots((prev) => {
                const next = [...prev];
                next[lotIndex] = { ...next[lotIndex], score, scoreStatus: "done" };
                return next;
              });
            } catch {
              if (ctrl.signal.aborted) return;
              setLots((prev) => {
                const next = [...prev];
                next[lotIndex] = { ...next[lotIndex], scoreStatus: "error" };
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
  }, [q, limit]);

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
      <header className="sticky top-0 z-20 px-6 py-4 bg-[#090909]/90 backdrop-blur-md border-b border-[#1c1c1c] flex items-center gap-4">
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
          <SearchForm initialValue={q} initialLimit={limit} compact />
        </div>
      </header>

      <main className="flex-1 px-6 py-10 max-w-7xl mx-auto w-full">
        {/* Loading state */}
        {status === "searching" && lots.length === 0 && (
          <div className="flex items-center gap-3 mb-10">
            <div className="w-4 h-4 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
            <span className="text-[#555] text-sm">
              Locating parking lots in {q}…
            </span>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="mb-10 p-4 border border-[#2a1a1a] bg-[#1a0a0a] rounded-lg">
            <p className="text-[#ef4444] text-sm">{errorMsg}</p>
          </div>
        )}

        {lots.length > 0 && (
          <>
            {/* Stats row */}
            <div className="mb-8 flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <h1 className="text-[#f0ece6] text-xl font-semibold">
                {regionLabel.split(",")[0]}
              </h1>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[#555] text-xs font-mono">
                  showing {lots.length}
                  {storedTotal > lots.length && (
                    <span className="text-[#333]"> of {storedTotal} stored</span>
                  )}
                </span>

                {fromCache && status !== "scoring" && (
                  <span className="text-[10px] px-2 py-0.5 border border-[#1e1e1e] text-[#444] rounded font-mono uppercase tracking-wider">
                    cached
                  </span>
                )}

                {status === "scoring" && (
                  <span className="text-[#c9a84c] text-xs font-mono">
                    scoring {scored}/{lots.length}…
                  </span>
                )}

                {status === "done" && (
                  <span className="text-[#22c55e] text-xs font-mono">
                    ✓ analysis complete
                  </span>
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
            <p className="text-[#222] text-xs">
              Try a different city or a larger area
            </p>
          </div>
        )}
      </main>

      <footer className="px-8 py-4 border-t border-[#1c1c1c] flex items-center justify-between">
        <span className="text-[11px] text-[#2a2a2a] font-mono">
          Powered by OpenStreetMap · ArcGIS · Claude
        </span>
        <span className="text-[11px] text-[#2a2a2a] font-mono">
          {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
