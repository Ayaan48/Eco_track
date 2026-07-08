import { CATEGORY_META } from '../badges';

export default function SuggestionCard({ suggestion }) {
  const meta = CATEGORY_META[suggestion.category] || CATEGORY_META.energy;
  return (
    <div className={`card border-l-4 ${meta.color}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">{meta.icon}</span>
        <h3 className="font-semibold text-slate-800">{suggestion.title}</h3>
      </div>
      <p className="mb-3 text-sm text-slate-600">{suggestion.description}</p>
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}>
          {meta.label}
        </span>
        {suggestion.estimated_saving_kg > 0 && (
          <span className="rounded-full bg-eco-100 px-2.5 py-1 text-xs font-semibold text-eco-700">
            Saves ~{suggestion.estimated_saving_kg} kg CO₂
          </span>
        )}
      </div>
    </div>
  );
}
