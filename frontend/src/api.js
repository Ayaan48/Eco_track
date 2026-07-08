import axios from 'axios';
import mockApi from './mockApi';

// VITE_MOCK_API=1 builds a serverless demo: the Flask API is replaced by an
// in-browser mock (see mockApi.js) so the app runs as a static page.
const USE_MOCK = import.meta.env.VITE_MOCK_API === '1';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const client = axios.create({ baseURL: BASE_URL, timeout: 30000 });

// The logged-in user's id (Firebase uid or "demo") is attached to every call.
let currentUserId = 'demo';
export const setUserId = (uid) => { currentUserId = uid || 'demo'; };

client.interceptors.request.use((config) => {
  if (config.method === 'get' || config.method === 'delete') {
    config.params = { ...config.params, user_id: currentUserId };
  } else {
    config.data = { ...(config.data || {}), user_id: currentUserId };
  }
  return config;
});

const realApi = {
  health: () => client.get('/api/health'),
  calculateFootprint: (habits) => client.post('/api/calculate/footprint', habits),
  logHabits: (habits) => client.post('/api/habits/log', habits),
  getHistory: (days = 30) => client.get('/api/habits/history', { params: { days } }),
  getToday: () => client.get('/api/habits/today'),
  getSettings: () => client.get('/api/habits/settings'),
  updateSettings: (updates) => client.patch('/api/habits/settings', updates),
  generateSuggestions: (payload) => client.post('/api/suggestions/generate', payload),
  getBadges: () => client.get('/api/habits/badges'),
  evaluateBadges: () => client.post('/api/habits/badges'),
  electricityEstimate: (payload) => client.post('/api/carbon/electricity', payload),
};

export const api = USE_MOCK ? mockApi : realApi;

export default api;
