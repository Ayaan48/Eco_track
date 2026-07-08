import { useEffect, useState } from 'react';
import api from '../api';
import BadgeCard from '../components/BadgeCard';

const STREAK_TARGETS = [
  { id: 'streak_3', label: '3-Day Streak', target: 3 },
  { id: 'week_warrior', label: 'Week Warrior', target: 7 },
];

export default function Achievements() {
  const [catalog, setCatalog] = useState([]);
  const [earned, setEarned] = useState({});
  const [streak, setStreak] = useState(0);
  const [newlyAwarded, setNewlyAwarded] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // POST re-evaluates conditions so freshly earned badges appear immediately.
    api.evaluateBadges()
      .then((res) => {
        setCatalog(res.data.catalog);
        setEarned(res.data.earned);
        setStreak(res.data.streak);
        setNewlyAwarded(res.data.newly_awarded);
      })
      .catch(() => setError('Could not load achievements from the backend.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="mt-10 text-center text-slate-500">Loading achievements…</p>;
  if (error) return <p className="mt-10 text-center text-red-600">{error}</p>;

  const earnedCount = Object.keys(earned).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Achievements</h1>
          <p className="text-sm text-slate-500">
            {earnedCount} of {catalog.length} badges earned
          </p>
        </div>
        <div className="card flex items-center gap-2 !p-3">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-display text-xl font-bold text-eco-800">{streak} day{streak === 1 ? '' : 's'}</p>
            <p className="text-xs text-slate-500">current streak</p>
          </div>
        </div>
      </div>

      {newlyAwarded.length > 0 && (
        <div className="rounded-2xl bg-eco-100 p-4 text-eco-800">
          🎉 New badge{newlyAwarded.length > 1 ? 's' : ''} unlocked:{' '}
          <b>{newlyAwarded.map((id) => catalog.find((b) => b.id === id)?.name).join(', ')}</b>
        </div>
      )}

      <div className="card space-y-3">
        <h2 className="font-semibold text-slate-700">Streak progress</h2>
        {STREAK_TARGETS.map(({ id, label, target }) => {
          const pct = Math.min(100, (streak / target) * 100);
          return (
            <div key={id}>
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>{label}</span>
                <span>{Math.min(streak, target)}/{target} days</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${earned[id] ? 'bg-eco-500' : 'bg-eco-300'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {catalog.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} earnedDate={earned[badge.id]} />
        ))}
      </div>
    </div>
  );
}
