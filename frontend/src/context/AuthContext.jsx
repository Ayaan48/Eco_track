import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, firebaseConfigured } from '../firebase';
import { setUserId } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [demoMode, setDemoMode] = useState(
    () => sessionStorage.getItem('ecotrack-demo') === '1',
  );
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!firebaseConfigured) return undefined;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setUserId(firebaseUser ? firebaseUser.uid : 'demo');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const logout = async () => {
    if (firebaseConfigured && user) await signOut(auth);
    sessionStorage.removeItem('ecotrack-demo');
    setDemoMode(false);
    setUserId('demo');
  };
  const enterDemoMode = () => {
    sessionStorage.setItem('ecotrack-demo', '1');
    setUserId('demo');
    setDemoMode(true);
  };

  const value = {
    user,
    demoMode,
    loading,
    firebaseConfigured,
    isAuthenticated: Boolean(user) || demoMode,
    login,
    register,
    logout,
    enterDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
