import { BADGE_META } from '../badges';

export default function BadgeCard({ badge, earnedDate }) {
  const meta = BADGE_META[badge.id] || { icon: '🏅', color: 'bg-slate-100 text-slate-700' };
  const earned = Boolean(earnedDate);
  return (
    <div className={`card text-center transition ${earned ? '' : 'opacity-60 grayscale'}`}>
      <div className={`mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full text-3xl ${meta.color}`}>
        {meta.icon}
      </div>
      <h3 className="font-semibold text-slate-800">{badge.name}</h3>
      <p className="mt-1 text-xs text-slate-500">{badge.description}</p>
      <p className={`mt-2 text-xs font-medium ${earned ? 'text-eco-600' : 'text-slate-400'}`}>
        {earned ? `Earned ${earnedDate}` : '🔒 Locked'}
      </p>
    </div>
  );
}
