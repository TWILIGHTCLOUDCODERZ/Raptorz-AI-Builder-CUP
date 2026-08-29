import { useState } from 'react';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile,
} from 'firebase/auth';
import { Activity, ArrowRight, BrainCircuit, Fingerprint, Loader2, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { auth, googleProvider } from './firebase';

const NAVY = '#081727';

function friendlyError(code: string, message: string): string {
  switch (code) {
    case 'auth/invalid-email': return 'Enter a valid email address.';
    case 'auth/missing-password':
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/email-already-in-use': return 'That email is already registered — sign in instead.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'Incorrect email or password.';
    case 'auth/operation-not-allowed': return 'This sign-in method is not enabled in Firebase yet (Authentication → Sign-in method).';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request': return '';
    case 'auth/unauthorized-domain': return 'This domain is not authorized in Firebase Auth (add it under Authentication → Settings → Authorized domains).';
    default: return message || 'Something went wrong. Please try again.';
  }
}

export default function AuthGate({ onGuest }: { onGuest: (name: string) => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [guestName, setGuestName] = useState('');

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await fn(); } // onAuthStateChanged in main.tsx handles the redirect
    catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      setError(friendlyError(err.code ?? '', err.message ?? ''));
    } finally { setBusy(false); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    });
  };
  const google = () => run(() => signInWithPopup(auth, googleProvider));

  return (
    <div className="min-h-screen w-full flex text-[#e7eef8]"
      style={{ background: `radial-gradient(circle at 78% -12%, rgba(30,81,139,.28), transparent 34%), ${NAVY}`, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* left — brand */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] p-14 border-r border-white/10 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(66,133,244,.18)' }} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <img src="/Aegis_Logo.png" alt="Aegis" className="h-10 w-10 rounded-xl" style={{ filter: 'drop-shadow(0 0 12px rgba(130,211,255,.3))' }} />
            <div><div className="font-bold tracking-[.18em] text-[15px]">AEGIS</div><div className="text-[10px] text-[#7591ae] tracking-wide">AI INTELLIGENCE</div></div>
          </div>
          <h1 className="mt-16 text-4xl font-extrabold leading-tight tracking-tight">Autonomous defense<br />for every transaction.</h1>
          <p className="mt-4 text-[#8fa8c1] max-w-md leading-relaxed">Real-time, multi-agent fraud intelligence on Gemini — it investigates, verifies the customer, and blocks only when it must.</p>
          <div className="mt-10 space-y-4 max-w-md">
            {[
              { icon: BrainCircuit, t: 'Multi-agent investigation', d: 'Seven specialist agents reason over each anomaly on Gemini 3.5.' },
              { icon: Fingerprint, t: 'Memory that stops false declines', d: 'Recalls confirmed behaviour so it never re-challenges the same pattern.' },
              { icon: ShieldCheck, t: 'Step-up, not block', d: 'Disables auto-pay, verifies via OTP, and alerts the relationship manager.' },
            ].map((f) => (
              <div key={f.t} className="flex gap-3">
                <span className="grid place-items-center h-10 w-10 rounded-xl shrink-0" style={{ background: 'rgba(66,133,244,.12)', color: '#5da0ff' }}><f.icon size={18} /></span>
                <div><div className="font-semibold text-[14px]">{f.t}</div><div className="text-[12px] text-[#7f99b3]">{f.d}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-[11px] text-[#63809d]">
          <Activity size={13} className="text-[#34a853]" /> Live on Google Cloud Run · Gemini 3.5 · Firebase Auth
        </div>
      </div>

      {/* right — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <img src="/Aegis_Logo.png" alt="Aegis" className="h-9 w-9 rounded-lg" />
            <span className="font-bold tracking-[.18em]">AEGIS</span>
          </div>

          <div className="rounded-2xl p-7 sm:p-8" style={{ background: 'linear-gradient(150deg, rgba(20,48,79,.75), rgba(13,34,58,.85))', border: '1px solid rgba(90,130,170,.22)', boxShadow: '0 20px 60px rgba(0,0,0,.35)' }}>
            <h2 className="text-xl font-bold">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
            <p className="text-[12px] text-[#7f99b3] mt-1">{mode === 'signin' ? 'Sign in to the Aegis analyst console.' : 'Set up access to the Aegis console.'}</p>

            <div className="mt-5 grid grid-cols-2 gap-1 p-1 rounded-xl" style={{ background: 'rgba(3,14,28,.4)' }}>
              {(['signin', 'signup'] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setError(''); }}
                  className="text-[13px] font-medium py-2 rounded-lg transition"
                  style={m === mode ? { background: 'rgba(66,133,244,.16)', color: '#dbe9f8' } : { color: '#7f99b3' }}>
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-5 space-y-3.5">
              {mode === 'signup' && (
                <Field icon={User} label="Full name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" className="w-full bg-transparent outline-none text-[14px] placeholder:text-[#5b7591]" /></Field>
              )}
              <Field icon={Mail} label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@bank.com" required className="w-full bg-transparent outline-none text-[14px] placeholder:text-[#5b7591]" /></Field>
              <Field icon={Lock} label="Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full bg-transparent outline-none text-[14px] placeholder:text-[#5b7591]" /></Field>

              {error && <div className="text-[12px] rounded-lg px-3 py-2" style={{ background: 'rgba(234,67,53,.12)', color: '#f2a49d', border: '1px solid rgba(234,67,53,.3)' }}>{error}</div>}

              <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition disabled:opacity-60" style={{ background: '#4285f4' }}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <>{mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={16} /></>}
              </button>
            </form>

            <div className="flex items-center gap-3 my-4 text-[11px] text-[#5b7591]"><div className="flex-1 h-px bg-white/10" /> OR <div className="flex-1 h-px bg-white/10" /></div>

            <button onClick={google} disabled={busy} className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium transition disabled:opacity-60" style={{ background: '#fff', color: '#1f2937' }}>
              <GoogleG /> Continue with Google
            </button>

            <div className="mt-5 pt-4 border-t border-white/10">
              <span className="text-[11px] text-[#7f99b3]">Or continue as guest</span>
              <form onSubmit={(e) => { e.preventDefault(); if (guestName.trim()) onGuest(guestName.trim()); }} className="flex gap-2 mt-2">
                <span className="flex-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: 'rgba(20,49,80,.4)', border: '1px solid rgba(104,142,180,.25)' }}>
                  <User size={16} className="text-[#5b7591] shrink-0" />
                  <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Your name" className="w-full bg-transparent outline-none text-[14px] placeholder:text-[#5b7591]" />
                </span>
                <button type="submit" disabled={!guestName.trim()} className="rounded-xl px-4 text-[13px] font-semibold text-white transition disabled:opacity-40" style={{ background: 'rgba(66,133,244,.28)', border: '1px solid rgba(66,133,244,.45)' }}>Enter</button>
              </form>
            </div>

            <div className="mt-4 text-center text-[12px]">
              <a href="#fraud-journey" className="text-[#5da0ff]">View executive demo →</a>
            </div>
          </div>

          <p className="text-center text-[11px] text-[#5b7591] mt-4">Secured by Firebase Authentication.</p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] text-[#7f99b3]">{label}</span>
      <span className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: 'rgba(20,49,80,.4)', border: '1px solid rgba(104,142,180,.25)' }}>
        <Icon size={16} className="text-[#5b7591] shrink-0" />
        {children}
      </span>
    </label>
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
  );
}
