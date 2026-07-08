import { useEffect, useState } from 'react';
import api from '../api';

const COUNTRIES = [
  { code: 'in', name: 'India' },
  { code: 'us', name: 'United States' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'de', name: 'Germany' },
  { code: 'fr', name: 'France' },
  { code: 'au', name: 'Australia' },
  { code: 'cn', name: 'China' },
  { code: 'ca', name: 'Canada' },
];

export default function Profile() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSettings()
      .then((res) => setSettings(res.data))
      .catch(() => setError('Could not load settings from the backend.'));
  }, []);

  if (error && !settings) return <p className="mt-10 text-center text-red-600">{error}</p>;
  if (!settings) return <p className="mt-10 text-center text-slate-500">Loading profile…</p>;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await api.updateSettings({
        name: settings.name,
        email: settings.email,
        daily_budget: Number(settings.daily_budget),
        country: settings.country,
        weekly_goal: Number(settings.weekly_goal),
      });
      setSettings(res.data);
      setMessage('Settings saved ✅');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Profile & Settings</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <label className="block text-sm font-medium text-slate-600">
          Display name
          <input
            className="input mt-1"
            value={settings.name}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            required
          />
        </label>

        <label className="block text-sm font-medium text-slate-600">
          Email
          <input
            className="input mt-1"
            type="email"
            value={settings.email}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
          />
        </label>

        <label className="block text-sm font-medium text-slate-600">
          Daily carbon budget: {Number(settings.daily_budget).toFixed(1)} kg CO₂
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={settings.daily_budget}
            onChange={(e) => setSettings({ ...settings, daily_budget: Number(e.target.value) })}
            className="mt-1 w-full accent-eco-600"
          />
          <span className="text-xs font-normal text-slate-400">
            The global sustainable target is about 8.0 kg per person per day.
          </span>
        </label>

        <label className="block text-sm font-medium text-slate-600">
          Country (for grid emission factors)
          <select
            className="input mt-1"
            value={settings.country}
            onChange={(e) => setSettings({ ...settings, country: e.target.value })}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-600">
          Weekly goal: {settings.weekly_goal} day{settings.weekly_goal === 1 ? '' : 's'} under budget
          <input
            type="range"
            min="1"
            max="7"
            value={settings.weekly_goal}
            onChange={(e) => setSettings({ ...settings, weekly_goal: Number(e.target.value) })}
            className="mt-1 w-full accent-eco-600"
          />
        </label>

        {message && <p className="text-sm font-medium text-eco-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="btn-primary w-full" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
