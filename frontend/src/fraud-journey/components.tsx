import { useEffect, useRef, useState } from 'react';
import {
  Activity, ArrowRight, Bell, Check, Clock, CreditCard, Cpu, Fingerprint, Globe2, Layers, Mail,
  MapPin, Power, PowerOff, Radar, RefreshCw, ShieldAlert, ShieldCheck, Smartphone, Sparkles,
  Store, UserRound, Wifi, X,
} from 'lucide-react';
import type {
  AISignal, Phase, RiskBreakdownItem, RiskFactor, RiskLevel, RiskMatrixRow, TransactionInfo,
} from './types';

const ICONS: Record<string, typeof MapPin> = {
  MapPin, Smartphone, Activity, UserRound, CreditCard, Wifi, Store, ShieldAlert,
};

const signalStyles: Record<AISignal['level'], string> = {
  high: 'text-rose-600 bg-rose-50 ring-rose-200',
  warn: 'text-amber-600 bg-amber-50 ring-amber-200',
  info: 'text-emerald-600 bg-emerald-50 ring-emerald-200',
};

export const LEVEL_CHIP: Record<RiskLevel, string> = {
  low: 'text-emerald-600 bg-emerald-50 ring-emerald-200',
  medium: 'text-amber-600 bg-amber-50 ring-amber-200',
  high: 'text-orange-600 bg-orange-50 ring-orange-200',
  critical: 'text-rose-600 bg-rose-50 ring-rose-200',
};
const LEVEL_HEX: Record<RiskLevel, string> = { low: '#059669', medium: '#d97706', high: '#ea580c', critical: '#e11d48' };
const LEVEL_LABEL: Record<RiskLevel, string> = { low: 'LOW RISK', medium: 'MEDIUM RISK', high: 'HIGH RISK', critical: 'CRITICAL' };

// ---------- shell ----------
const ACCENT: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function SectionCard({ title, kicker, icon: Icon, children, accent = 'indigo' }: {
  title: string; kicker?: string; icon?: typeof MapPin; children: React.ReactNode; accent?: string;
}) {
  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-200/70 shadow-sm shadow-slate-200/40 p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        {Icon && <span className={`grid place-items-center h-9 w-9 rounded-xl ring-1 ${ACCENT[accent] ?? ACCENT.indigo}`}><Icon size={18} /></span>}
        <div>
          {kicker && <div className="text-[11px] font-semibold tracking-widest text-indigo-500">{kicker}</div>}
          <h3 className="text-slate-900 font-semibold leading-tight">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

// ---------- auto-approval status ----------
export function AutoApprovalStatus({ disabled }: { disabled: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 ring-1 transition-colors ${disabled ? 'bg-amber-50 ring-amber-200' : 'bg-emerald-50 ring-emerald-200'}`}>
      <div className="flex items-center gap-2.5">
        <span className={`grid place-items-center h-8 w-8 rounded-lg ${disabled ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {disabled ? <PowerOff size={16} /> : <Power size={16} />}
        </span>
        <div>
          <div className="text-[11px] text-slate-500">Auto-Payment / Auto-Approval</div>
          <div className={`text-sm font-bold ${disabled ? 'text-amber-700' : 'text-emerald-700'}`}>{disabled ? 'TEMPORARILY DISABLED' : 'ON'}</div>
        </div>
      </div>
      {disabled && <span className="text-[10px] text-amber-600 text-right max-w-[130px]">for this transaction / card activity</span>}
    </div>
  );
}

// ---------- transaction context (Dubai txn 1) ----------
export function TxContextCard({ tx, approved }: { tx: TransactionInfo; approved: boolean }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200/70 shadow-sm p-4 flex items-center gap-4">
      <span className="grid place-items-center h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><MapPin size={20} /></span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold tracking-widest text-slate-400">TRANSACTION 1 · {tx.time}</div>
        <div className="text-sm font-semibold text-slate-900">${tx.amount} · {tx.location} · {tx.channel}</div>
        <div className="text-xs text-slate-500">Known device · known network · risk 18/100</div>
      </div>
      {approved && <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 rounded-full px-3 py-1 flex items-center gap-1"><Check size={12} /> AUTO-APPROVED</span>}
    </div>
  );
}

// ---------- timeline ----------
const TIMELINE = [
  { key: 'received', label: 'Transaction initiated' },
  { key: 'rules', label: 'Rule engine checks transaction' },
  { key: 'ai', label: 'AI analyses behavioural signals' },
  { key: 'score', label: 'Risk score generated' },
  { key: 'stepup', label: 'Step-up authentication' },
  { key: 'decision', label: 'Transaction decision' },
] as const;
const ORDER: Phase[] = ['idle', 'received', 'rules', 'ai', 'score', 'stepup', 'otp', 'approved', 'blocked'];

export function Timeline({ phase, level }: { phase: Phase; level: RiskLevel | null }) {
  const idx = ORDER.indexOf(phase);
  const chip = (label: string, cls: string) => ({ label, cls });
  const stateFor = (key: string) => {
    if (key === 'decision') {
      if (phase === 'approved') return chip('APPROVED', LEVEL_CHIP.low);
      if (phase === 'blocked') return chip('BLOCKED', LEVEL_CHIP.critical);
      return chip('PENDING', 'text-slate-400 bg-slate-50 ring-slate-200');
    }
    if (key === 'stepup') {
      if (level === 'critical' && (phase === 'blocked' || idx >= ORDER.indexOf('score'))) return chip('SKIPPED — STOLEN CARD', LEVEL_CHIP.critical);
      if (level === 'low' && phase === 'approved') return chip('NOT REQUIRED', LEVEL_CHIP.low);
      if (phase === 'stepup' || phase === 'otp') return chip('VERIFICATION REQUIRED', 'text-violet-600 bg-violet-50 ring-violet-200');
      if (phase === 'approved') return chip('COMPLETED', LEVEL_CHIP.low);
      return chip('PENDING', 'text-slate-400 bg-slate-50 ring-slate-200');
    }
    if (key === 'score' && phase === 'score' && level) return chip(LEVEL_LABEL[level], LEVEL_CHIP[level]);
    if (key === 'ai' && phase === 'ai') return chip('ANALYZING', 'text-indigo-600 bg-indigo-50 ring-indigo-200 animate-pulse');
    const stepIdx = ORDER.indexOf(key as Phase);
    if (stepIdx < idx) return chip('COMPLETED', LEVEL_CHIP.low);
    if (stepIdx === idx) return chip('IN PROGRESS', 'text-indigo-600 bg-indigo-50 ring-indigo-200 animate-pulse');
    return chip('PENDING', 'text-slate-400 bg-slate-50 ring-slate-200');
  };
  return (
    <ol className="relative">
      {TIMELINE.map((step, i) => {
        const st = stateFor(step.key);
        const done = st.label === 'COMPLETED' || st.label === 'APPROVED';
        const blocked = st.label.includes('BLOCK') || st.label.includes('STOLEN');
        const active = /PROGRESS|ANALYZING|RISK|REQUIRED|CRITICAL/.test(st.label);
        return (
          <li key={step.key} className="flex gap-4 pb-5 last:pb-0 relative">
            {i < TIMELINE.length - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200" />}
            <span className={`z-10 grid place-items-center h-8 w-8 rounded-full text-white text-xs font-bold shrink-0 ${done ? 'bg-emerald-500' : blocked ? 'bg-rose-500' : active ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              {done ? <Check size={15} /> : blocked ? <X size={15} /> : i + 1}
            </span>
            <div className="flex-1 min-w-0 pt-1">
              <div className="text-sm font-medium text-slate-800">{step.label}</div>
              <span className={`inline-block mt-1.5 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full ring-1 ${st.cls}`}>{st.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ---------- rule engine ----------
export function RuleEngineCard() {
  const [active, setActive] = useState(false);
  useEffect(() => { const t = setTimeout(() => setActive(true), 30); return () => clearTimeout(t); }, []);
  const rules = [
    { label: 'Amount', value: 'NORMAL' }, { label: 'Merchant', value: 'ALLOWED' }, { label: 'Card', value: 'VALID' },
    { label: 'Country', value: 'NOT BLOCKED' }, { label: 'Velocity', value: 'WITHIN LIMITS' },
  ];
  return (
    <SectionCard title="Traditional Rule Engine" kicker="LEGACY CHECK" icon={Layers} accent="slate">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {rules.map((r, i) => (
          <div key={r.label} className={`rounded-xl bg-slate-50 ring-1 ring-slate-200 px-3 py-2.5 transition-all duration-500 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`} style={{ transitionDelay: `${i * 90}ms` }}>
            <div className="text-[11px] text-slate-500">{r.label}</div>
            <div className="text-sm font-semibold text-emerald-600 flex items-center gap-1"><Check size={13} /> {r.value}</div>
          </div>
        ))}
      </div>
      <div className={`mt-4 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '540ms' }}>
        <div className="text-sm font-bold text-emerald-700">NO OBVIOUS FRAUD DETECTED</div>
        <div className="text-xs text-emerald-600/80 mt-0.5">Traditional rules allow the transaction.</div>
      </div>
    </SectionCard>
  );
}

// ---------- AI analysis ----------
export function AISignalsCard({ signals }: { signals: AISignal[] }) {
  const [active, setActive] = useState(false);
  useEffect(() => { const t = setTimeout(() => setActive(true), 30); return () => clearTimeout(t); }, []);
  return (
    <SectionCard title="AI Behavioural Analysis" kicker="AI ENGINE" icon={Cpu} accent="violet">
      <div className="grid sm:grid-cols-2 gap-2.5">
        {signals.map((s, i) => {
          const Icon = ICONS[s.icon] ?? Activity;
          return (
            <div key={s.label} className={`flex items-center gap-3 rounded-xl bg-white ring-1 ring-slate-200 px-3 py-2.5 transition-all duration-500 ${active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} style={{ transitionDelay: `${i * 140}ms` }}>
              <span className={`grid place-items-center h-8 w-8 rounded-lg ring-1 ${signalStyles[s.level]}`}><Icon size={16} /></span>
              <div className="min-w-0">
                <div className="text-[12px] text-slate-500 truncate">{s.label}</div>
                <div className={`text-sm font-semibold ${s.level === 'high' ? 'text-rose-600' : s.level === 'warn' ? 'text-amber-600' : 'text-emerald-600'}`}>{s.status}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className={`mt-4 flex items-center gap-2 text-sm font-semibold text-violet-700 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '900ms' }}>
        <Sparkles size={15} /> AI detected anomalies that rules missed.
      </div>
    </SectionCard>
  );
}

// ---------- risk gauge + breakdown ----------
export function RiskGauge({ score, level }: { score: number; level: RiskLevel }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0; const start = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - start) / 900); setShown(Math.round(score * p)); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [score]);
  const color = LEVEL_HEX[level];
  const R = 52, C = 2 * Math.PI * R, off = C * (1 - shown / 100);
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke="#eef2f7" strokeWidth="12" />
          <circle cx="60" cy="60" r={R} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .1s linear' }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center"><div className="text-3xl font-extrabold text-slate-900 tabular-nums">{shown}</div><div className="text-[11px] text-slate-400 font-medium">/ 100</div></div>
        </div>
      </div>
      <span className="mt-2 text-xs font-bold tracking-wider px-3 py-1 rounded-full ring-1" style={{ color, background: color + '14', borderColor: color + '33' }}>{LEVEL_LABEL[level]}</span>
    </div>
  );
}

export function RiskBreakdown({ items, score }: { items: RiskBreakdownItem[]; score: number }) {
  if (!items.length) return null;
  return (
    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-3">
      <div className="text-[11px] font-semibold tracking-widest text-slate-400 mb-1.5">SCORE BREAKDOWN</div>
      <div className="space-y-1">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{it.label}</span>
            <span className="font-mono font-semibold text-rose-600">+{it.points}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">Risk Score</span>
        <span className="font-mono font-bold text-slate-900">{score}</span>
      </div>
    </div>
  );
}

export function RiskFactors({ factors }: { factors: RiskFactor[] }) {
  return (
    <div className="grid grid-cols-1 gap-1.5">
      {factors.map((f) => (
        <div key={f.label} className={`text-sm flex items-center gap-1.5 ${f.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
          <span className="font-bold">{f.positive ? '✓' : '+'}</span>{f.label}
        </div>
      ))}
    </div>
  );
}

// ---------- step-up ----------
export function StepUpCard({ mobile, email, amount, location, time, onChoose }: {
  mobile: string; email: string; amount: number; location: string; time: string; onChoose: (c: 'mobile' | 'email') => void;
}) {
  return (
    <SectionCard title="Additional Verification Required" kicker="STEP-UP AUTHENTICATION" icon={ShieldAlert} accent="violet">
      <p className="text-sm text-slate-600 -mt-1 mb-3">We detected unusual activity on your card. Please verify your identity to continue.</p>
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        {[['Amount', `$${amount}`], ['Location', location], ['Time', time]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-slate-50 ring-1 ring-slate-200 px-2 py-2"><div className="text-[10px] text-slate-500">{k}</div><div className="text-sm font-semibold text-slate-800">{v}</div></div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <button onClick={() => onChoose('mobile')} className="group text-left rounded-xl ring-1 ring-slate-200 hover:ring-indigo-400 hover:bg-indigo-50/50 p-4 transition">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold"><Smartphone size={18} /> Mobile OTP</div>
          <div className="text-xs text-slate-500 mt-2">Send OTP to</div>
          <div className="font-mono text-sm text-slate-800">{mobile}</div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 group-hover:bg-indigo-700 rounded-lg px-3 py-2 transition">Send Mobile OTP <ArrowRight size={15} /></div>
        </button>
        <button onClick={() => onChoose('email')} className="group text-left rounded-xl ring-1 ring-slate-200 hover:ring-violet-400 hover:bg-violet-50/50 p-4 transition">
          <div className="flex items-center gap-2 text-violet-600 font-semibold"><Mail size={18} /> Email OTP</div>
          <div className="text-xs text-slate-500 mt-2">Send OTP to</div>
          <div className="font-mono text-sm text-slate-800">{email}</div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-violet-600 group-hover:bg-violet-700 rounded-lg px-3 py-2 transition">Send Email OTP <ArrowRight size={15} /></div>
        </button>
      </div>
    </SectionCard>
  );
}

// ---------- OTP ----------
export function OtpScreen({ channel, target, secondsLeft, attempts, maxAttempts, error, demoMode, demoOtp, onVerify, onResend }: {
  channel: 'mobile' | 'email'; target: string; secondsLeft: number; attempts: number; maxAttempts: number;
  error: string; demoMode: boolean; demoOtp: string; onVerify: (code: string) => void; onResend: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { setDigits(Array(6).fill('')); refs.current[0]?.focus(); }, [channel]);
  useEffect(() => { if (error) { setDigits(Array(6).fill('')); refs.current[0]?.focus(); } }, [error]);
  const set = (i: number, v: string) => { const c = v.replace(/\D/g, '').slice(-1); const n = [...digits]; n[i] = c; setDigits(n); if (c && i < 5) refs.current[i + 1]?.focus(); };
  const onKey = (i: number, e: React.KeyboardEvent) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus(); };
  const onPaste = (e: React.ClipboardEvent) => { const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split(''); if (p.length) { setDigits(Array(6).fill('').map((_, i) => p[i] ?? '')); refs.current[Math.min(p.length, 5)]?.focus(); } };
  const code = digits.join('');
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0'), ss = String(secondsLeft % 60).padStart(2, '0');
  const expired = secondsLeft <= 0;
  return (
    <SectionCard title={channel === 'mobile' ? 'Verify Mobile Number' : 'Verify Email'} kicker="ONE-TIME PASSCODE" icon={channel === 'mobile' ? Smartphone : Mail} accent="indigo">
      <p className="text-sm text-slate-600 -mt-1">We sent a 6-digit verification code to your registered {channel === 'mobile' ? 'mobile number' : 'email address'}.</p>
      <div className="font-mono text-sm text-slate-800 mt-1 mb-4">{target}</div>
      <div className="flex gap-2 sm:gap-2.5" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input key={i} ref={(el) => (refs.current[i] = el)} value={d} inputMode="numeric" maxLength={1}
            onChange={(e) => set(i, e.target.value)} onKeyDown={(e) => onKey(i, e)}
            className={`h-12 w-11 sm:h-14 sm:w-12 text-center text-xl font-bold rounded-xl bg-white ring-2 outline-none transition ${error ? 'ring-rose-300 text-rose-600' : d ? 'ring-indigo-400 text-slate-900' : 'ring-slate-200 text-slate-900 focus:ring-indigo-400'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 text-xs">
        <span className={`font-mono ${expired ? 'text-rose-500' : 'text-slate-500'}`}>OTP expires in {mm}:{ss}</span>
        <span className="text-slate-400">Attempts {attempts}/{maxAttempts}</span>
      </div>
      {error && <div className="mt-2 text-sm text-rose-600 flex items-center gap-1.5"><X size={14} /> {error}</div>}
      <div className="flex gap-2.5 mt-4">
        <button disabled={code.length !== 6 || expired} onClick={() => onVerify(code)} className="flex-1 inline-flex justify-center items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 enabled:hover:bg-indigo-700 disabled:opacity-40 rounded-xl px-4 py-2.5 transition"><ShieldCheck size={16} /> Verify OTP</button>
        <button onClick={onResend} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 rounded-xl px-4 py-2.5 transition"><RefreshCw size={15} /> Resend</button>
      </div>
      {demoMode && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-900 text-slate-300 px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5"><Radar size={13} className="text-emerald-400" /> Demo Mode — simulated OTP</span>
          <code className="font-mono text-emerald-300 tracking-widest">{demoOtp}</code>
        </div>
      )}
    </SectionCard>
  );
}

// ---------- result ----------
export function ResultCard({ approved, critical, autoApproved, amount, score, channelLabel, onInvestigate }: {
  approved: boolean; critical?: boolean; autoApproved?: boolean; amount: number; score: number; channelLabel: string; onInvestigate: () => void;
}) {
  return (
    <div className={`rounded-2xl p-6 text-white shadow-lg ${approved ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-200' : 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-200'}`}>
      <div className="grid place-items-center h-14 w-14 rounded-full bg-white/20 mb-4">{approved ? <Check size={30} /> : <X size={30} />}</div>
      <h3 className="text-2xl font-extrabold">{approved ? (autoApproved ? 'Payment Auto-Approved' : 'Identity Verified') : critical ? 'Card Reported Stolen' : 'Verification Failed'}</h3>
      <p className="text-white/90 font-medium">{approved ? 'Transaction Approved' : 'Transaction Blocked'}</p>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Stat k="Transaction" v={`$${amount.toFixed(2)}`} />
        <Stat k="Risk Score" v={`${score}/100`} />
        <Stat k={approved ? 'Verification' : 'Reason'} v={approved ? (autoApproved ? 'No OTP needed' : channelLabel) : critical ? 'Stolen card' : '3 / 3 attempts'} />
        <Stat k="Status" v={approved ? 'APPROVED' : 'BLOCKED'} />
      </div>
      <p className="text-sm text-white/90 mt-4">{approved ? (autoApproved ? 'Trusted Dubai pattern with ~5 months of history — approved instantly, no step-up needed.' : 'Customer successfully verified their identity — payment continues.') : critical ? 'A stolen-card status cannot be overridden by OTP — routed to fraud investigation.' : 'Incorrect OTP — routed to fraud investigation.'}</p>
      <button onClick={onInvestigate} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold bg-white/15 hover:bg-white/25 rounded-xl px-4 py-2.5 transition">{approved ? 'View Investigation' : 'Send to Fraud Investigation'} <ArrowRight size={15} /></button>
    </div>
  );
}
function Stat({ k, v }: { k: string; v: string }) {
  return <div className="rounded-xl bg-white/10 px-3 py-2"><div className="text-[11px] text-white/70">{k}</div><div className="font-bold">{v}</div></div>;
}

// ---------- RM alert ----------
export function RmAlertCard({ rmName, level, score, amount, location, previous, timeGap, channel, explanation, outcome }: {
  rmName: string; level: RiskLevel; score: number; amount: number; location: string; previous: string;
  timeGap: string; channel: string; explanation: string; outcome: 'pending' | 'approved' | 'blocked';
}) {
  const actions = [
    ['Auto-approval', 'Disabled'],
    ['Customer OTP', outcome === 'blocked' ? 'Not offered (stolen card)' : 'Requested'],
    ['Customer verified', outcome === 'approved' ? 'YES' : outcome === 'blocked' ? 'N/A' : 'Pending'],
    ['Transaction', outcome === 'approved' ? 'APPROVED' : outcome === 'blocked' ? 'BLOCKED' : 'Pending'],
    ['RM notification', 'SENT'],
  ];
  return (
    <div className="rounded-2xl bg-white ring-1 ring-amber-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 bg-amber-50 px-5 py-3 border-b border-amber-100">
        <span className="grid place-items-center h-8 w-8 rounded-lg bg-amber-100 text-amber-600"><Bell size={16} /></span>
        <div className="flex-1">
          <div className="text-[11px] font-semibold tracking-widest text-amber-600">FRAUD RISK ALERT → RM {rmName.toUpperCase()}</div>
          <div className="text-sm font-semibold text-slate-900">Customer: Tyson · Risk {level.toUpperCase()} · {score}/100</div>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
          {[['Transaction', `$${amount}`], ['Location', location], ['Previous', previous], ['Time gap', timeGap], ['Channel', channel], ['Risk', `${score}/100`]].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-slate-50 ring-1 ring-slate-200 px-3 py-2"><div className="text-[10px] text-slate-500">{k}</div><div className="text-sm font-semibold text-slate-800">{v}</div></div>
          ))}
        </div>
        <div className="rounded-xl bg-violet-50 ring-1 ring-violet-100 px-4 py-3 mb-4">
          <div className="text-[11px] font-semibold tracking-widest text-violet-500 mb-1">AI EXPLANATION</div>
          <p className="text-sm text-slate-700">{explanation}</p>
        </div>
        <div className="text-[11px] font-semibold tracking-widest text-slate-400 mb-1.5">ACTION TAKEN</div>
        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
          {actions.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-sm border-b border-slate-100 py-1"><span className="text-slate-600">{k}</span><span className="font-semibold text-slate-800">{v}</span></div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">{rmName} can review the transaction without unnecessarily blocking a legitimate customer.</p>
      </div>
    </div>
  );
}

// ---------- risk matrix ----------
export function RiskMatrix({ rows, current }: { rows: RiskMatrixRow[]; current: RiskLevel | null }) {
  return (
    <SectionCard title="Risk Matrix" kicker="POLICY" icon={Layers} accent="indigo">
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm border-separate border-spacing-y-1.5 px-2">
          <thead>
            <tr className="text-left text-[11px] tracking-widest text-slate-400">
              <th className="font-semibold px-3">SCORE</th><th className="font-semibold px-3">LEVEL</th><th className="font-semibold px-3">AI DECISION</th><th className="font-semibold px-3">CUSTOMER</th><th className="font-semibold px-3">RM</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const on = current === r.tone;
              return (
                <tr key={r.range} className={on ? 'ring-2 ring-indigo-300' : ''}>
                  <td className={`px-3 py-2.5 font-mono rounded-l-xl ${on ? 'bg-indigo-50' : 'bg-slate-50'}`}>{r.range}</td>
                  <td className={`px-3 py-2.5 ${on ? 'bg-indigo-50' : 'bg-slate-50'}`}><span className={`text-xs font-bold px-2.5 py-1 rounded-full ring-1 ${LEVEL_CHIP[r.tone]}`}>{r.level}</span></td>
                  <td className={`px-3 py-2.5 font-medium text-slate-700 ${on ? 'bg-indigo-50' : 'bg-slate-50'}`}>{r.decision}</td>
                  <td className={`px-3 py-2.5 text-slate-600 ${on ? 'bg-indigo-50' : 'bg-slate-50'}`}>{r.cx}</td>
                  <td className={`px-3 py-2.5 text-slate-600 rounded-r-xl ${on ? 'bg-indigo-50' : 'bg-slate-50'}`}>{r.rm}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ---------- investigation ----------
export function InvestigationView({ score, level, summary, evidence, recommendation }: {
  score: number; level: RiskLevel; summary: string; evidence: string[]; recommendation: string;
}) {
  return (
    <SectionCard title="AI Fraud Investigation" kicker="ANALYST ASSIST · GENERATIVE AI" icon={Fingerprint} accent="violet">
      <div className="flex items-center gap-4 mb-4">
        <div className="text-2xl font-extrabold text-slate-900">{score}<span className="text-slate-400 text-base"> / 100</span></div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ring-1 ${LEVEL_CHIP[level]}`}>{level.toUpperCase()}</span>
      </div>
      <p className="text-sm text-slate-700 bg-violet-50 ring-1 ring-violet-100 rounded-xl px-4 py-3">{summary}</p>
      <div className="text-[11px] font-semibold tracking-widest text-slate-400 mt-5 mb-2">EVIDENCE</div>
      <ol className="space-y-1.5">
        {evidence.map((e, i) => (<li key={i} className="flex gap-2.5 text-sm text-slate-700"><span className="shrink-0 grid place-items-center h-5 w-5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold">{i + 1}</span>{e}</li>))}
      </ol>
      <div className="mt-5 rounded-xl bg-indigo-50 ring-1 ring-indigo-100 px-4 py-3">
        <div className="text-[11px] font-semibold tracking-widest text-indigo-500 mb-1">AI RECOMMENDATION</div>
        <div className="text-sm text-slate-800">{recommendation}</div>
      </div>
    </SectionCard>
  );
}

// ---------- explainability ----------
export function ExplainCard() {
  return (
    <SectionCard title="Why was this transaction flagged?" kicker="EXPLAINABILITY" icon={Globe2} accent="indigo">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-4"><div className="text-xs font-semibold text-slate-500 mb-1">Traditional Rules</div><div className="text-slate-800 font-medium">"Transaction looks normal."</div></div>
        <div className="rounded-xl bg-violet-50 ring-1 ring-violet-200 p-4"><div className="text-xs font-semibold text-violet-500 mb-1">AI</div><div className="text-slate-800 font-medium">"Customer behaviour looks abnormal."</div></div>
      </div>
      <div className="mt-3 text-sm text-center text-slate-600">Multiple weak signals combined to create a <span className="font-semibold text-slate-900">strong fraud indicator</span>.</div>
    </SectionCard>
  );
}

// ---------- executive summary ----------
export function ExecutiveSummary({ items }: { items: { tag: string; text: string }[] }) {
  const icons = [Radar, ShieldCheck, Sparkles];
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 sm:p-8">
      <div className="grid sm:grid-cols-3 gap-5">
        {items.map((it, i) => { const Icon = icons[i]; return (
          <div key={it.tag}>
            <span className="grid place-items-center h-10 w-10 rounded-xl bg-white/10 text-indigo-300 mb-3"><Icon size={19} /></span>
            <div className="text-sm font-bold tracking-widest text-indigo-300">{it.tag}</div>
            <div className="text-sm text-white/80 mt-1">{it.text}</div>
          </div>
        ); })}
      </div>
      <div className="mt-7 pt-6 border-t border-white/10 text-lg sm:text-xl font-semibold leading-snug">
        AI detects → risk engine scores → policy decides → OTP verifies → RM is informed. <span className="text-indigo-300">AI verifies the customer before approving — instead of immediately blocking.</span>
      </div>
    </div>
  );
}

// ---------- architecture ----------
export function ArchitectureView({ steps }: { steps: string[] }) {
  const decisioning = new Set(['Transaction API', 'Rule Engine', 'AI / ML Risk Engine', 'Risk Score', 'Policy Engine', 'Step-Up Authentication', 'Mobile / Email OTP', 'Transaction Decision']);
  const investigation = new Set(['RM Alert', 'Fraud Investigation']);
  return (
    <SectionCard title="Reference Architecture" kicker="SYSTEM VIEW" icon={Layers} accent="slate">
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-3 py-2 rounded-lg ring-1 ${investigation.has(s) ? 'bg-violet-50 text-violet-700 ring-violet-200' : decisioning.has(s) ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' : 'bg-slate-50 text-slate-700 ring-slate-200'}`}>{s}</span>
            {i < steps.length - 1 && <ArrowRight size={14} className="text-slate-300" />}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-indigo-200 ring-1 ring-indigo-300 inline-block" /> Real-time transaction decisioning</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-violet-200 ring-1 ring-violet-300 inline-block" /> AI investigation / RM assist (generative)</span>
      </div>
      <p className="text-xs text-slate-500 mt-3">The <b>risk engine</b> makes the transaction decision. Generative AI produces investigation summaries and RM explanations — never authorizing the payment.</p>
    </SectionCard>
  );
}

// ---------- demo controls ----------
export function DemoControls({ onStart, onRisk, onChannel, onApprove, onBlock }: {
  onStart: () => void; onRisk: (l: RiskLevel) => void; onChannel: (c: 'mobile' | 'email') => void; onApprove: () => void; onBlock: () => void;
}) {
  const Btn = ({ children, onClick, tone = 'ghost' }: { children: React.ReactNode; onClick: () => void; tone?: string }) => (
    <button onClick={onClick} className={`text-xs font-semibold rounded-lg px-3 py-2 transition whitespace-nowrap ${tone === 'primary' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : tone === 'green' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100' : tone === 'red' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{children}</button>
  );
  void onStart;
  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur ring-1 ring-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="grid place-items-center h-6 w-6 rounded-md bg-violet-100 text-violet-700 text-[13px] leading-none">★</span>
        <span className="text-[12px] font-bold tracking-widest text-slate-600">TYSON · VIP MEMBER</span>
        <span className="text-[11px] text-slate-400 ml-1">pick a scenario</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {/* Section 1 — normal Dubai payment (auto-approve, no OTP) */}
        <button onClick={() => onRisk('low')} className="text-left rounded-xl ring-1 ring-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 hover:ring-emerald-300 p-4 transition group">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold tracking-wider text-emerald-800 bg-emerald-100 rounded-full px-2 py-0.5">1 · NORMAL</span>
            <span className="text-[11px] font-semibold text-emerald-700 ml-auto flex items-center gap-1"><Check size={12} /> Auto-approve · no OTP</span>
          </div>
          <div className="font-bold text-slate-900 text-[15px]">Everyday payment · Dubai</div>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">Where Tyson lives. Same city, known device, ~5 months of regular history — approved instantly, no step-up.</p>
          <span className="inline-flex items-center gap-1.5 mt-2.5 text-[12.5px] font-semibold text-emerald-700 group-hover:gap-2 transition-all">▶ Run normal payment <ArrowRight size={14} /></span>
        </button>

        {/* Section 2 — suspicious Italy payment (full step-up flow) */}
        <button onClick={() => onRisk('high')} className="text-left rounded-xl ring-1 ring-rose-200 bg-rose-50/60 hover:bg-rose-50 hover:ring-rose-300 p-4 transition group">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold tracking-wider text-rose-800 bg-rose-100 rounded-full px-2 py-0.5">2 · SUSPICIOUS</span>
            <span className="text-[11px] font-semibold text-rose-700 ml-auto flex items-center gap-1"><ShieldAlert size={12} /> Step-up OTP → approve / block</span>
          </div>
          <div className="font-bold text-slate-900 text-[15px]">VIP card in Italy · 2h later</div>
          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">Same day, same card — used in Italy 2 hours after Dubai. Impossible travel, so auto-pay is suspended and Aegis runs the full check.</p>
          <span className="inline-flex items-center gap-1.5 mt-2.5 text-[12.5px] font-semibold text-rose-700 group-hover:gap-2 transition-all">▶ Run suspicious payment <ArrowRight size={14} /></span>
        </button>
      </div>

      {/* manual / advanced controls */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 mr-0.5">MANUAL</span>
        <Btn onClick={() => onChannel('mobile')}>Send Mobile OTP</Btn>
        <Btn onClick={() => onChannel('email')}>Send Email OTP</Btn>
        <Btn onClick={onApprove} tone="green">Approve</Btn>
        <Btn onClick={onBlock} tone="red">Block</Btn>
        <Btn onClick={() => onRisk('critical')} tone="red">Critical · Stolen</Btn>
      </div>
    </div>
  );
}
