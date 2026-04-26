"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LIMIT_OPTIONS, DEFAULT_LIMIT } from "@/types";
import type { LimitOption } from "@/types";

interface Props {
  initialValue?: string;
  initialLimit?: LimitOption;
  compact?: boolean;
}

const EXAMPLES = ["Zurich", "New York", "London", "Tokyo", "Berlin", "Sydney"];

export default function SearchForm({
  initialValue = "",
  initialLimit = DEFAULT_LIMIT,
  compact = false,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [limit, setLimit] = useState<LimitOption>(initialLimit);
  const router = useRouter();

  function navigate(q: string, l: LimitOption) {
    if (!q.trim()) return;
    router.push(`/search?q=${encodeURIComponent(q.trim())}&limit=${l}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate(value, limit);
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search a city…"
          className="flex-1 min-w-0 bg-[#111] border border-[#1e1e1e] text-[#f0ece6] placeholder-[#333] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/20 transition-colors"
        />
        {/* Limit selector */}
        <select
          value={limit}
          onChange={(e) => {
            const l = parseInt(e.target.value, 10) as LimitOption;
            setLimit(l);
            if (value.trim()) navigate(value, l);
          }}
          className="bg-[#111] border border-[#1e1e1e] text-[#555] rounded-lg px-2 py-2 text-xs outline-none focus:border-[#c9a84c] transition-colors cursor-pointer appearance-none w-14 text-center"
          title="Number of results"
        >
          {LIMIT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-[#c9a84c] hover:bg-[#d4b558] text-black font-medium text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          Go
        </button>
      </form>
    );
  }

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search a city or region…"
          className="flex-1 bg-[#111] border border-[#1e1e1e] text-[#f0ece6] placeholder-[#333] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/20 transition-colors"
        />
        <button
          type="submit"
          className="bg-[#c9a84c] hover:bg-[#d4b558] text-black font-medium text-sm px-5 py-3 rounded-lg transition-colors whitespace-nowrap"
        >
          Analyze
        </button>
      </form>

      {/* Limit pills */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-[11px] text-[#333] uppercase tracking-wider">Results</span>
        <div className="flex gap-1.5">
          {LIMIT_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setLimit(n)}
              className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
                limit === n
                  ? "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10"
                  : "border-[#1e1e1e] text-[#444] hover:border-[#333] hover:text-[#555]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Example regions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setValue(ex);
              navigate(ex, limit);
            }}
            className="text-[11px] px-3 py-1.5 bg-[#111] border border-[#1e1e1e] text-[#555] hover:text-[#c9a84c] hover:border-[#c9a84c]/30 rounded-full transition-colors uppercase tracking-wider"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
