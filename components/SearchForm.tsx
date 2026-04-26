"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  initialValue?: string;
  compact?: boolean;
}

const EXAMPLES = ["Zurich", "New York", "London", "Tokyo", "Berlin", "Sydney"];

export default function SearchForm({ initialValue = "", compact = false }: Props) {
  const [value, setValue] = useState(initialValue);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className={compact ? "w-full" : "w-full max-w-xl"}>
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

      {!compact && (
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setValue(ex);
                router.push(`/search?q=${encodeURIComponent(ex)}`);
              }}
              className="text-[11px] px-3 py-1.5 bg-[#111] border border-[#1e1e1e] text-[#555] hover:text-[#c9a84c] hover:border-[#c9a84c]/30 rounded-full transition-colors uppercase tracking-wider"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
