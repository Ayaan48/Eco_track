// Badge metadata used to render the achievement grid. Ids must match the
// backend catalog in backend/routes/habits.py.
export const BADGE_META = {
  first_step: { icon: '👣', color: 'bg-emerald-100 text-emerald-700' },
  green_day: { icon: '🌱', color: 'bg-green-100 text-green-700' },
  streak_3: { icon: '🔥', color: 'bg-orange-100 text-orange-700' },
  week_warrior: { icon: '🗓️', color: 'bg-amber-100 text-amber-700' },
  pedal_power: { icon: '🚲', color: 'bg-sky-100 text-sky-700' },
  plant_day: { icon: '🥦', color: 'bg-lime-100 text-lime-700' },
  low_energy: { icon: '💡', color: 'bg-yellow-100 text-yellow-700' },
  monthly_hero: { icon: '🦸', color: 'bg-violet-100 text-violet-700' },
  monthly_master: { icon: '🏆', color: 'bg-indigo-100 text-indigo-700' },
  zero_waster: { icon: '♻️', color: 'bg-teal-100 text-teal-700' },
};

export const CATEGORY_META = {
  travel: { icon: '🚗', label: 'Travel', color: 'border-sky-300 bg-sky-50', badge: 'bg-sky-100 text-sky-700' },
  food: { icon: '🍽️', label: 'Food', color: 'border-lime-300 bg-lime-50', badge: 'bg-lime-100 text-lime-700' },
  energy: { icon: '⚡', label: 'Energy', color: 'border-amber-300 bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
};
