// Firebase Web SDK initialisation. When the env vars are not provided the
// app runs in Demo Mode: no cloud auth, data stored via the backend's
// in-memory store under the "demo" user.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId);

let auth = null;
if (firebaseConfigured) {
  const app = initializeApp(config);
  auth = getAuth(app);
}

export { auth };
