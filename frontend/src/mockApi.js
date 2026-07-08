// In-browser mock of the Flask backend, used for the static demo build
// (VITE_MOCK_API=1, `npm run build:demo`). Mirrors the backend's emission
// coefficients, streak and badge logic so the UI behaves like the real app
// without a server. State persists in localStorage.

const TRANSPORT_FACTORS = {
  car: 0.192, motorcycle: 0.103, bus: 0.105, train: 0.041,
  metro: 0.035, bicycle: 0, walk: 0, none: 0,
};
const DIET_FACTORS = { vegan: 0.7, vegetarian: 1.2, mixed: 2.0, heavy_meat: 3.3 };
const ELECTRICITY_FACTOR = 0.82;
const FOOD_WASTE_KG = 0.5;
const HEATING_FLAT_KG = 1.2;
const AC_FLAT_KG = 2.0;

const BADGES = [
  { id: 'first_step', name: 'First Step', description: 'Log your first day of habits.' },
  { id: 'green_day', name: 'Green Day', description: 'Finish a day under your carbon budget.' },
  { id: 'streak_3', name: '3-Day Streak', description: 'Log habits 3 days in a row.' },
  { id: 'week_warrior', name: 'Week Warrior', description: 'Log habits 7 days in a row.' },
  { id: 'pedal_power', name: 'Pedal Power', description: 'Travel by bicycle or on foot for a day.' },
  { id: 'plant_day', name: 'Plant Day', description: 'Log a fully vegan day.' },
  { id: 'low_energy', name: 'Low Energy', description: 'Use less than 5 kWh of electricity in a day.' },
  { id: 'monthly_hero', name: 'Monthly Hero', description: 'Log 15 days within 30 days.' },
  { id: 'monthly_master', name: 'Monthly Master', description: 'Log 30 days within 30 days.' },
  { id: 'zero_waster', name: 'Zero Waster', description: 'Log a day with no food waste.' },
];

const FALLBACK_SUGGESTIONS = [
  {
    title: 'Swap short car trips for cycling',
    description: 'Trips under 5 km are perfect for a bicycle. Replacing one daily short car trip saves roughly 1 kg of CO2 and adds healthy exercise.',
    category: 'travel',
    estimated_saving_kg: 1.0,
  },
  {
    title: 'Try one plant-based meal today',
    description: 'Swapping a single meat-based meal for a vegetarian or vegan option cuts food emissions by up to 60% for that meal.',
    category: 'food',
    estimated_saving_kg: 1.3,
  },
  {
    title: 'Raise your AC setpoint by 2°C',
    description: 'Setting air conditioning to 26°C instead of 24°C reduces cooling energy use by around 12% with barely any comfort loss.',
    category: 'energy',
    estimated_saving_kg: 0.8,
  },
];

const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

function compute({ travel = {}, food = {}, energy = {} }) {
  const mode = travel.mode || 'none';
  let travelKg = (TRANSPORT_FACTORS[mode] ?? 0) * (Number(travel.distance_km) || 0);
  if (mode === 'car') travelKg /= Math.max(1, Number(travel.passengers) || 1);
  let foodKg = (DIET_FACTORS[food.diet] ?? 2.0) * (Number(food.meals) || 0);
  if (food.food_waste) foodKg += FOOD_WASTE_KG;
  let energyKg = (Number(energy.electricity_kwh) || 0) * ELECTRICITY_FACTOR;
  if (energy.heating) energyKg += HEATING_FLAT_KG;
  if (energy.ac) energyKg += AC_FLAT_KG;
  const r = (x) => Math.round(x * 100) / 100;
  return {
    travel_kg: r(travelKg),
    food_kg: r(foodKg),
    energy_kg: r(energyKg),
    total_kg: r(travelKg + foodKg + energyKg),
  };
}

// Sample month of habits so charts, streaks and badges have data on first visit.
function seedState() {
  const modes = ['car', 'bus', 'bicycle', 'metro', 'car', 'walk', 'train'];
  const diets = ['mixed', 'vegetarian', 'mixed', 'vegan', 'mixed'];
  const logs = {};
  for (let i = 1; i <= 24; i += 1) {
    if (i % 9 === 5) continue; // a few missed days for a realistic heatmap
    const date = iso(daysAgo(i));
    const travel = {
      mode: modes[i % modes.length],
      distance_km: 4 + ((i * 7) % 26),
      passengers: 1 + (i % 2),
    };
    const food = { diet: diets[i % diets.length], meals: 3, food_waste: i % 6 === 0 };
    const energy = {
      electricity_kwh: 3 + ((i * 3) % 8),
      heating: false,
      ac: i % 4 === 0,
    };
    logs[date] = {
      date, travel, food, energy,
      ...compute({ travel, food, energy }),
      logged_at: new Date(daysAgo(i)).toISOString(),
    };
  }
  return {
    logs,
    settings: {
      name: 'Demo User', email: 'demo@ecotrack.app',
      daily_budget: 8.0, country: 'in', weekly_goal: 5,
    },
    badges: {},
  };
}

const STORAGE_KEY = 'ecotrack-mock-state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through to fresh seed */ }
  return seedState();
}

const state = loadState();
const persist = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
};

function sortedLogs(days = 30) {
  const cutoff = iso(daysAgo(days - 1));
  return Object.values(state.logs)
    .filter((l) => l.date >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function currentStreak() {
  let day = new Date();
  if (!state.logs[iso(day)]) day = daysAgo(1);
  let streak = 0;
  while (state.logs[iso(day)]) {
    streak += 1;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

function evaluateBadges() {
  const logs = sortedLogs(30);
  const budget = state.settings.daily_budget;
  const streak = currentStreak();
  const conditions = {
    first_step: logs.length >= 1,
    green_day: logs.some((l) => l.total_kg <= budget),
    streak_3: streak >= 3,
    week_warrior: streak >= 7,
    pedal_power: logs.some((l) => ['bicycle', 'walk'].includes(l.travel?.mode) && (l.travel?.distance_km || 0) > 0),
    plant_day: logs.some((l) => l.food?.diet === 'vegan'),
    low_energy: logs.some((l) => (l.energy?.electricity_kwh ?? 99) < 5),
    monthly_hero: logs.length >= 15,
    monthly_master: logs.length >= 30,
    zero_waster: logs.some((l) => !l.food?.food_waste),
  };
  const newlyAwarded = [];
  const today = iso(new Date());
  BADGES.forEach((b) => {
    if (conditions[b.id] && !state.badges[b.id]) {
      state.badges[b.id] = today;
      newlyAwarded.push(b.id);
    }
  });
  if (newlyAwarded.length) persist();
  return newlyAwarded;
}

// Personalise the static tips a little from the actual breakdown, since the
// real Groq call isn't reachable from a static page.
function mockSuggestions(breakdown = {}) {
  const ranked = [...FALLBACK_SUGGESTIONS].sort((a, b) => {
    const kg = (c) => breakdown[`${c.category}_kg`] || 0;
    return kg(b) - kg(a);
  });
  return ranked;
}

const respond = (data, delay = 350) =>
  new Promise((resolve) => setTimeout(() => resolve({ data }), delay));

const api = {
  health: () => respond({ status: 'ok', firebase: false, groq: false, carbon_interface: false }),
  calculateFootprint: (habits) => respond(compute(habits), 120),
  logHabits: (habits) => {
    const log = {
      date: iso(new Date()),
      travel: habits.travel || {},
      food: habits.food || {},
      energy: habits.energy || {},
      ...compute(habits),
      logged_at: new Date().toISOString(),
    };
    state.logs[log.date] = log;
    persist();
    const newlyAwarded = evaluateBadges();
    return respond({ ok: true, log, streak: currentStreak(), newly_awarded: newlyAwarded });
  },
  getHistory: (days = 30) => respond({
    logs: sortedLogs(days),
    streak: currentStreak(),
    daily_budget: state.settings.daily_budget,
  }),
  getToday: () => respond({ log: state.logs[iso(new Date())] || null, streak: currentStreak() }),
  getSettings: () => respond({ ...state.settings }),
  updateSettings: (updates) => {
    Object.assign(state.settings, updates);
    persist();
    return respond({ ...state.settings });
  },
  generateSuggestions: (payload) =>
    respond({ suggestions: mockSuggestions(payload.breakdown), source: 'fallback' }, 900),
  getBadges: () => respond({
    catalog: BADGES, earned: { ...state.badges }, newly_awarded: [], streak: currentStreak(),
  }),
  evaluateBadges: () => {
    const newlyAwarded = evaluateBadges();
    return respond({
      catalog: BADGES, earned: { ...state.badges }, newly_awarded: newlyAwarded, streak: currentStreak(),
    });
  },
  electricityEstimate: ({ electricity_value = 0 }) =>
    respond({ carbon_kg: Math.round(electricity_value * ELECTRICITY_FACTOR * 100) / 100, source: 'local_fallback' }),
};

export default api;
