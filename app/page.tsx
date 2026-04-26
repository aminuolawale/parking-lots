import SearchForm from "@/components/SearchForm";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-[#1c1c1c]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#c9a84c]" />
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#555]">
            ParkingScan
          </span>
        </div>
        <span className="text-[11px] text-[#333] font-mono hidden sm:block">
          Satellite · AI · Rehabilitation
        </span>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-px w-8 bg-[#c9a84c]" />
          <span className="text-[11px] text-[#c9a84c] tracking-[0.25em] uppercase font-medium">
            Infrastructure Intelligence
          </span>
          <div className="h-px w-8 bg-[#c9a84c]" />
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-[#f0ece6] leading-[1.1] tracking-tight mb-4 max-w-2xl">
          Parking Rehabilitation
          <br />
          <span className="text-[#333]">at a glance.</span>
        </h1>

        <p className="text-[#555] text-base max-w-md mb-12 leading-relaxed">
          Enter any city or region. We find every parking lot, pull satellite
          imagery, and score its condition using AI.
        </p>

        <SearchForm />

        {/* Steps */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-0 max-w-2xl w-full border border-[#1c1c1c] rounded-lg overflow-hidden">
          {[
            {
              n: "01",
              title: "Find",
              desc: "Locate every parking lot within 4 km of your chosen city center using OpenStreetMap.",
            },
            {
              n: "02",
              title: "Scan",
              desc: "Pull high-resolution satellite imagery for each site via the Mapbox satellite layer.",
            },
            {
              n: "03",
              title: "Score",
              desc: "Claude AI analyzes surface condition, markings, drainage, and vegetation to rate each lot 1–10.",
            },
          ].map((step, i) => (
            <div
              key={step.n}
              className={`px-6 py-6 ${i < 2 ? "sm:border-r border-[#1c1c1c]" : ""} ${i > 0 ? "border-t sm:border-t-0 border-[#1c1c1c]" : ""}`}
            >
              <p className="text-[10px] font-mono text-[#c9a84c] tracking-widest mb-3">
                {step.n} — {step.title.toUpperCase()}
              </p>
              <p className="text-[#f0ece6] text-sm font-medium mb-1">{step.title}</p>
              <p className="text-[#444] text-xs leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-4 border-t border-[#1c1c1c] flex items-center justify-between">
        <span className="text-[11px] text-[#2a2a2a] font-mono">
          Powered by OpenStreetMap · Mapbox · Claude
        </span>
        <span className="text-[11px] text-[#2a2a2a] font-mono">
          {new Date().getFullYear()}
        </span>
      </footer>
    </main>
  );
}
