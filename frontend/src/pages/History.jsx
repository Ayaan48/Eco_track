import { useEffect, useMemo, useState } from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import api from '../api';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Tooltip, Legend, Filler,
);

const dayLabel = (iso) => iso.slice(5); // MM-DD

function heatColor(total, budget) {
  if (total == null) return 'bg-slate-100';
  if (total <= budget * 0.7) return 'bg-eco-400';
  if (total <= budget) return 'bg-eco-200';
  if (total <= budget * 1.3) return 'bg-amber-300';
  return 'bg-red-400';
}

export default function History() {
  const [logs, setLogs] = useState([]);
  const [budget, setBudget] = useState(8.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getHistory(30)
      .then((res) => {
        setLogs(res.data.logs);
        setBudget(res.data.daily_budget);
      })
      .catch(() => setError('Could not load history from the backend.'))
      .finally(() => setLoading(false));
  }, []);

  // Build the last-30-days axis; missing days render as gaps.
  const days = useMemo(() => {
    const byDate = Object.fromEntries(logs.map((l) => [l.date, l]));
    const result = [];
    const today = new Date();
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      result.push({ date: iso, log: byDate[iso] || null });
    }
    return result;
  }, [logs]);

  const stats = useMemo(() => {
    if (!logs.length) return null;
    const last7 = days.slice(-7).map((d) => d.log).filter(Boolean);
    const avg7 = last7.length
      ? last7.reduce((s, l) => s + l.total_kg, 0) / last7.length
      : 0;
    const best = logs.reduce((a, b) => (a.total_kg <= b.total_kg ? a : b));
    const worst = logs.reduce((a, b) => (a.total_kg >= b.total_kg ? a : b));
    const monthTotal = logs.reduce((s, l) => s + l.total_kg, 0);
    return { avg7, best, worst, monthTotal };
  }, [logs, days]);

  if (loading) return <p className="mt-10 text-center text-slate-500">Loading history…</p>;
  if (error) return <p className="mt-10 text-center text-red-600">{error}</p>;

  if (!logs.length) {
    return (
      <div className="card mx-auto mt-10 max-w-md text-center">
        <span className="text-5xl">📈</span>
        <h2 className="mt-3 text-xl font-semibold text-slate-700">No history yet</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Log your habits for a few days and your trends will appear here.
        </p>
        <Link to="/log" className="btn-primary inline-block">Log today&apos;s habits</Link>
      </div>
    );
  }

  const lineData = {
    labels: days.map((d) => dayLabel(d.date)),
    datasets: [
      {
        label: 'Daily total (kg CO₂)',
        data: days.map((d) => d.log?.total_kg ?? null),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(34,197,94,0.15)',
        fill: true,
        tension: 0.35,
        spanGaps: true,
      },
      {
        label: `Budget (${budget} kg)`,
        data: days.map(() => budget),
        borderColor: '#f59e0b',
        borderDash: [6, 6],
        pointRadius: 0,
      },
    ],
  };

  const last14 = days.slice(-14);
  const barData = {
    labels: last14.map((d) => dayLabel(d.date)),
    datasets: [
      { label: 'Travel', data: last14.map((d) => d.log?.travel_kg ?? 0), backgroundColor: '#38bdf8', stack: 's' },
      { label: 'Food', data: last14.map((d) => d.log?.food_kg ?? 0), backgroundColor: '#84cc16', stack: 's' },
      { label: 'Energy', data: last14.map((d) => d.log?.energy_kg ?? 0), backgroundColor: '#f59e0b', stack: 's' },
    ],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Footprint History</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card !p-4 text-center">
          <p className="font-display text-xl font-bold text-eco-800">{stats.avg7.toFixed(1)} kg</p>
          <p className="text-xs text-slate-500">7-day average</p>
        </div>
        <div className="card !p-4 text-center">
          <p className="font-display text-xl font-bold text-eco-600">{stats.best.total_kg.toFixed(1)} kg</p>
          <p className="text-xs text-slate-500">Best day ({dayLabel(stats.best.date)})</p>
        </div>
        <div className="card !p-4 text-center">
          <p className="font-display text-xl font-bold text-red-500">{stats.worst.total_kg.toFixed(1)} kg</p>
          <p className="text-xs text-slate-500">Worst day ({dayLabel(stats.worst.date)})</p>
        </div>
        <div className="card !p-4 text-center">
          <p className="font-display text-xl font-bold text-slate-700">{stats.monthTotal.toFixed(1)} kg</p>
          <p className="text-xs text-slate-500">30-day total</p>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold text-slate-700">30-day trend vs budget</h2>
        <Line data={lineData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold text-slate-700">Last 14 days by category</h2>
        <Bar
          data={barData}
          options={{
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: { x: { stacked: true }, y: { stacked: true } },
          }}
        />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold text-slate-700">30-day heatmap</h2>
        <div className="grid grid-cols-10 gap-1.5">
          {days.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.log ? `${d.log.total_kg} kg CO₂` : 'no log'}`}
              className={`aspect-square rounded ${heatColor(d.log?.total_kg ?? null, budget)}`}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-eco-400" /> well under budget</span>
          <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-eco-200" /> under budget</span>
          <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-amber-300" /> slightly over</span>
          <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-red-400" /> well over</span>
          <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-slate-100" /> no log</span>
        </div>
      </div>
    </div>
  );
}
