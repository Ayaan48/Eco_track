import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/log', label: 'Log Today' },
  { to: '/history', label: 'History' },
  { to: '/suggestions', label: 'Suggestions' },
  { to: '/achievements', label: 'Achievements' },
  { to: '/profile', label: 'Profile' },
];

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
    isActive ? 'bg-eco-100 text-eco-800' : 'text-slate-600 hover:bg-eco-50'
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { demoMode, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="text-2xl">🌍</span>
          <span className="font-display text-xl font-bold text-eco-800">EcoTrack</span>
          {demoMode && (
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Demo Mode
            </span>
          )}
        </NavLink>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="ml-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            Log out
          </button>
        </nav>

        <button
          className="rounded-lg p-2 text-2xl leading-none md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-eco-100 px-4 py-3 md:hidden">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={linkClass}
              end={link.to === '/'}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Log out
          </button>
        </nav>
      )}
    </header>
  );
}
