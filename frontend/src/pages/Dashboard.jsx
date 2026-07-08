import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import GaugeCard from '../components/GaugeCard';
import { CATEGORY_META } from '../badges';

export default function Dashboard() {
  const [todayLog, setTodayLog] = useState(null);
  const [streak, setStreak] = useState(0);
  const [budget, setBudget] = useState(8.0);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getToday(), api.getSettings()])
      .then(([todayRes, settingsRes]) => {
        setTodayLog(todayRes.data.log);
        setStreak(todayRes.data.streak);
        setBudget(settingsRes.data.daily_budget);
        setName(settingsRes.data.name);
      })
      .catch(() => setError('Could not reach the EcoTrack backend. Is Flask running on port 5000?'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="mt-10 text-center text-slate-500">Loading dashboard…</p>;
  if (error) return <p className="mt-10 text-center text-red-600">{error}</p>;

  const categories = [
    { key: 'travel', value: todayLog?.travel_kg ?? 0 },
    { key: 'food', value: todayLog?.food_kg ?? 0 },
    { key: 'energy', value: todayLog?.energy_kg ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hello, {name} 👋</h1>
          <p className="text-sm text-slate-500">Here&apos;s your carbon picture for today.</p>
        </div>
        <div className="card flex items-center gap-2 !p-3">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-display text-xl font-bold text-eco-800">{streak} day{streak === 1 ? '' : 's'}</p>
            <p className="text-xs text-slate-500">logging streak</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <GaugeCard totalKg={todayLog?.total_kg ?? 0} budgetKg={budget} />

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {categories.map(({ key, value }) => {
              const meta = CATEGORY_META[key];
              return (
                <div key={key} className={`card border ${meta.color} !p-4 text-center`}>
                  <span className="text-2xl">{meta.icon}</span>
                  <p className="mt-1 font-display text-lg font-bold text-slate-800">
                    {value.toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-500">kg · {meta.label}</p>
                </div>
              );
            })}
          </div>

          {todayLog ? (
            <div className="card">
              <h3 className="mb-1 font-semibold text-slate-700">✅ Today is logged</h3>
              <p className="text-sm text-slate-500">
                You can update your log any time — the latest entry replaces today&apos;s record.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/log" className="btn-secondary">Update log</Link>
                <Link to="/suggestions" className="btn-primary">Get eco suggestions</Link>
              </div>
            </div>
          ) : (
            <div className="card text-center">
              <span className="text-4xl">📋</span>
              <h3 className="mt-2 font-semibold text-slate-700">No log yet today</h3>
              <p className="mb-3 text-sm text-slate-500">
                Record your travel, food and energy habits to see your footprint.
              </p>
              <Link to="/log" className="btn-primary inline-block">Log today&apos;s habits</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
