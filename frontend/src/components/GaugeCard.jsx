// Animated SVG doughnut gauge showing today's total CO2 against the daily
// budget. Colour shifts green -> amber -> red as usage approaches/exceeds it.
const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function GaugeCard({ totalKg = 0, budgetKg = 8 }) {
  const ratio = budgetKg > 0 ? totalKg / budgetKg : 0;
  const fill = Math.min(ratio, 1);
  const color = ratio < 0.7 ? '#22c55e' : ratio <= 1 ? '#f59e0b' : '#ef4444';
  const remaining = budgetKg - totalKg;

  return (
    <div className="card flex flex-col items-center">
      <h2 className="mb-3 text-lg font-semibold text-slate-700">Today&apos;s Footprint</h2>
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="Carbon gauge">
          <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#e2e8f0" strokeWidth="16" />
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - fill)}
            transform="rotate(-90 100 100)"
            style={{
              transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease',
              '--gauge-circumference': CIRCUMFERENCE,
              animation: 'gauge-fill 1s ease',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold" style={{ color }}>
            {totalKg.toFixed(1)}
          </span>
          <span className="text-xs text-slate-500">kg CO₂ today</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium" style={{ color }}>
        {remaining >= 0
          ? `${remaining.toFixed(1)} kg left of your ${budgetKg.toFixed(1)} kg budget`
          : `${Math.abs(remaining).toFixed(1)} kg over your ${budgetKg.toFixed(1)} kg budget`}
      </p>
    </div>
  );
}
