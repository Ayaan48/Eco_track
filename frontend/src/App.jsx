import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';
import Achievements from './pages/Achievements';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Login from './pages/Login';
import LogToday from './pages/LogToday';
import Profile from './pages/Profile';
import Suggestions from './pages/Suggestions';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-eco-700">
        Loading…
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen">
      {isAuthenticated && <Navbar />}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/log" element={<ProtectedRoute><LogToday /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/suggestions" element={<ProtectedRoute><Suggestions /></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
