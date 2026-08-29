import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase web apiKey is NOT a secret — it identifies the project; security is
// enforced by Firebase Auth + rules. Safe to ship in client code.
const firebaseConfig = {
  apiKey: 'REDACTED_FIREBASE_WEB_KEY',
  authDomain: 'deepan-gemini-xprize.firebaseapp.com',
  projectId: 'deepan-gemini-xprize',
  storageBucket: 'deepan-gemini-xprize.firebasestorage.app',
  messagingSenderId: '807655655153',
  appId: '1:807655655153:web:8dde92ee27c6ef614b0b50',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
