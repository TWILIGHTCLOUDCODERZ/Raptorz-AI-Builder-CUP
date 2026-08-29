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
  const [guest, setGuest] = useState<string>(() => sessionStorage.getItem('aegis_guest') || '');
  const [ready, setReady] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); }), []);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const signInGuest = (name: string) => { sessionStorage.setItem('aegis_guest', name); setGuest(name); };
  const doSignOut = () => {
    sessionStorage.removeItem('aegis_guest'); setGuest('');
    if (auth.currentUser) signOut(auth);
  };

  if (hash === '#fraud-journey') return <FraudJourney />;

  const active = user
    ? { name: user.displayName || user.email || 'Analyst', email: user.email || '' }
    : guest
      ? { name: guest, email: 'Guest' }
      : null;

  if (active) return <App user={active} onSignOut={doSignOut} />;
  if (!ready) {
    return <div style={{ minHeight: '100vh', background: '#081727', display: 'grid', placeItems: 'center', color: '#5da0ff', fontFamily: "'DM Sans', sans-serif" }}>Loading…</div>;
  }
  return <AuthGate onGuest={signInGuest} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
