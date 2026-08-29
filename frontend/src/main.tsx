import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AuthGate from './AuthGate.tsx';
import FraudJourney from './fraud-journey/FraudJourney.tsx';
import './index.css';

function Root() {
  const [hash, setHash] = useState(window.location.hash);
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('aegis_authed') === '1');

  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const signIn = () => { sessionStorage.setItem('aegis_authed', '1'); setAuthed(true); };
  const signOut = () => { sessionStorage.removeItem('aegis_authed'); setAuthed(false); };

  if (hash === '#fraud-journey') return <FraudJourney />;
  if (!authed) return <AuthGate onAuthed={signIn} />;
  return <App onSignOut={signOut} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
