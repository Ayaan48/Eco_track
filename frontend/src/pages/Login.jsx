import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { isAuthenticated, firebaseConfigured, login, register, enterDemoMode } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '') || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = () => {
    enterDemoMode();
    navigate('/');
  };

  return (
    <div className="mx-auto mt-12 max-w-md">
      <div className="mb-6 text-center">
        <span className="text-5xl">🌍</span>
        <h1 className="mt-2 text-3xl font-bold text-eco-800">EcoTrack</h1>
        <p className="mt-1 text-slate-500">Personal Carbon Footprint Tracker</p>
      </div>

      <div className="card">
        {firebaseConfigured ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-700">
              {mode === 'login' ? 'Log in' : 'Create an account'}
            </h2>
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password (6+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full" type="submit" disabled={submitting}>
              {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
            </button>
            <button
              type="button"
              className="w-full text-sm text-eco-700 hover:underline"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Log in'}
            </button>
          </form>
        ) : (
          <p className="mb-4 text-sm text-slate-600">
            Firebase is not configured, but you can explore every feature in Demo Mode.
            Data is stored in backend memory for this session.
          </p>
        )}

        <div className="mt-4 border-t border-slate-100 pt-4">
          <button className="btn-secondary w-full" onClick={handleDemo}>
            🚀 Try Demo Mode
          </button>
        </div>
      </div>
    </div>
  );
}
