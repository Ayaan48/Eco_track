import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const TRANSPORT_MODES = [
  { value: 'car', label: '🚗 Car' },
  { value: 'motorcycle', label: '🏍️ Motorcycle' },
  { value: 'bus', label: '🚌 Bus' },
  { value: 'train', label: '🚆 Train' },
  { value: 'metro', label: '🚇 Metro' },
  { value: 'bicycle', label: '🚲 Bicycle' },
  { value: 'walk', label: '🚶 Walk' },
  { value: 'none', label: '🏠 No travel' },
];

const DIETS = [
  { value: 'vegan', label: '🥦 Vegan' },
  { value: 'vegetarian', label: '🥗 Vegetarian' },
  { value: 'mixed', label: '🍛 Mixed' },
  { value: 'heavy_meat', label: '🥩 Heavy meat' },
];

const STEPS = ['Travel', 'Food', 'Energy'];

export default function LogToday() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [travel, setTravel] = useState({ mode: 'car', distance_km: 10, passengers: 1 });
  const [food, setFood] = useState({ diet: 'mixed', meals: 3, food_waste: false });
  const [energy, setEnergy] = useState({ electricity_kwh: 6, heating: false, ac: false });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  // Real-time emission preview, refreshed whenever any step's inputs change.
  useEffect(() => {
    const timer = setTimeout(() => {
      api.calculateFootprint({ travel, food, energy })
        .then((res) => { setPreview(res.data); setError(''); })
        .catch((err) => setError(err.response?.data?.error || 'Preview unavailable.'));
    }, 300);
    return () => clearTimeout(timer);
  }, [travel, food, energy]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.logHabits({ travel, food, energy });
      sessionStorage.setItem('ecotrack-last-log', JSON.stringify(res.data.log));
      setToast('Saved! Your footprint has been logged. 🎉');
      setTimeout(() => navigate('/suggestions'), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save your log. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Log Today&apos;s Habits</h1>

      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => setStep(i)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                i <= step ? 'bg-eco-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {i + 1}
            </button>
            <span className={`text-sm font-medium ${i === step ? 'text-eco-800' : 'text-slate-400'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-slate-200" />}
          </div>
        ))}
      </div>

      <div className="card space-y-4">
        {step === 0 && (
          <>
            <h2 className="text-lg font-semibold text-slate-700">🚗 How did you travel today?</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TRANSPORT_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setTravel({ ...travel, mode: m.value })}
                  className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                    travel.mode === m.value
                      ? 'border-eco-500 bg-eco-50 font-semibold text-eco-800'
                      : 'border-slate-200 hover:border-eco-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <label className="block text-sm font-medium text-slate-600">
              Distance: {travel.distance_km} km
              <input
                type="range"
                min="0"
                max="200"
                value={travel.distance_km}
                onChange={(e) => setTravel({ ...travel, distance_km: Number(e.target.value) })}
                className="mt-1 w-full accent-eco-600"
              />
            </label>
            {travel.mode === 'car' && (
              <label className="block text-sm font-medium text-slate-600">
                Passengers (sharing the ride)
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={travel.passengers}
                  onChange={(e) => setTravel({ ...travel, passengers: Number(e.target.value) })}
                  className="input mt-1"
                />
              </label>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-slate-700">🍽️ What did you eat today?</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DIETS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setFood({ ...food, diet: d.value })}
                  className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                    food.diet === d.value
                      ? 'border-eco-500 bg-eco-50 font-semibold text-eco-800'
                      : 'border-slate-200 hover:border-eco-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <label className="block text-sm font-medium text-slate-600">
              Meals eaten: {food.meals}
              <input
                type="range"
                min="1"
                max="6"
                value={food.meals}
                onChange={(e) => setFood({ ...food, meals: Number(e.target.value) })}
                className="mt-1 w-full accent-eco-600"
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                checked={food.food_waste}
                onChange={(e) => setFood({ ...food, food_waste: e.target.checked })}
                className="h-4 w-4 accent-eco-600"
              />
              I threw away food today
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-slate-700">⚡ Home energy today</h2>
            <label className="block text-sm font-medium text-slate-600">
              Electricity used: {energy.electricity_kwh} kWh
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={energy.electricity_kwh}
                onChange={(e) => setEnergy({ ...energy, electricity_kwh: Number(e.target.value) })}
                className="mt-1 w-full accent-eco-600"
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                checked={energy.heating}
                onChange={(e) => setEnergy({ ...energy, heating: e.target.checked })}
                className="h-4 w-4 accent-eco-600"
              />
              🔥 Used heating
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                checked={energy.ac}
                onChange={(e) => setEnergy({ ...energy, ac: e.target.checked })}
                className="h-4 w-4 accent-eco-600"
              />
              ❄️ Used air conditioning
            </label>
          </>
        )}

        {preview && (
          <div className="rounded-xl bg-eco-50 p-3 text-sm text-eco-800">
            Live preview — travel <b>{preview.travel_kg} kg</b> · food <b>{preview.food_kg} kg</b> ·
            energy <b>{preview.energy_kg} kg</b> · total <b>{preview.total_kg} kg CO₂</b>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {toast && <p className="text-sm font-medium text-eco-700">{toast}</p>}

        <div className="flex justify-between pt-2">
          <button
            className="btn-secondary"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Back
          </button>
          {step < 2 ? (
            <button className="btn-primary" onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : (
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Save today’s log'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
