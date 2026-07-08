import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import SuggestionCard from '../components/SuggestionCard';
import SuggestionSkeleton from '../components/SuggestionSkeleton';

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noLog, setNoLog] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError('');
    setNoLog(false);
    try {
      // Prefer the log just submitted (passed via sessionStorage), otherwise
      // fall back to today's stored log from the backend.
      let log = null;
      const cached = sessionStorage.getItem('ecotrack-last-log');
      if (cached) log = JSON.parse(cached);
      if (!log) {
        const todayRes = await api.getToday();
        log = todayRes.data.log;
      }
      if (!log) {
        setNoLog(true);
        return;
      }
      const settings = await api.getSettings();
      const res = await api.generateSuggestions({
        breakdown: {
          travel_kg: log.travel_kg,
          food_kg: log.food_kg,
          energy_kg: log.energy_kg,
          total_kg: log.total_kg,
        },
        details: { travel: log.travel, food: log.food, energy: log.energy },
        daily_budget: settings.data.daily_budget,
      });
      setSuggestions(res.data.suggestions);
      setSource(res.data.source);
    } catch {
      setError('Could not generate suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { generate(); }, [generate]);

  if (noLog) {
    return (
      <div className="card mx-auto mt-10 max-w-md text-center">
        <span className="text-5xl">💡</span>
        <h2 className="mt-3 text-xl font-semibold text-slate-700">Log your day first</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Suggestions are personalised from today&apos;s habits, so log them first.
        </p>
        <Link to="/log" className="btn-primary inline-block">Log today&apos;s habits</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Eco-Friendly Swaps</h1>
          <p className="text-sm text-slate-500">
            {source === 'groq'
              ? 'AI suggestions personalised from today’s footprint (powered by Groq).'
              : source === 'fallback'
                ? 'Curated eco tips (configure GROQ_API_KEY for AI-personalised suggestions).'
                : 'Personalised ideas to shrink your footprint.'}
          </p>
        </div>
        <button className="btn-secondary" onClick={generate} disabled={loading}>
          🔄 Regenerate
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {loading
          ? [0, 1, 2].map((i) => <SuggestionSkeleton key={i} />)
          : suggestions.map((s, i) => <SuggestionCard key={i} suggestion={s} />)}
      </div>
    </div>
  );
}
