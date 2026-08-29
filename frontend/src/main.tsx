import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import App from './App.tsx';
import AuthGate from './AuthGate.tsx';
import FraudJourney from './fraud-journey/FraudJourney.tsx';
import { auth } from './firebase';
import './index.css';

function Root() {
  const [hash, setHash] = useState(window.location.hash);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); }), []);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  if (hash === '#fraud-journey') return <FraudJourney />;
  if (!ready) {
    return <div style={{ minHeight: '100vh', background: '#081727', display: 'grid', placeItems: 'center', color: '#5da0ff', fontFamily: "'DM Sans', sans-serif" }}>Loading…</div>;
  }
  if (!user) return <AuthGate />;
  return <App user={{ name: user.displayName || user.email || 'Analyst', email: user.email || '' }} onSignOut={() => signOut(auth)} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
