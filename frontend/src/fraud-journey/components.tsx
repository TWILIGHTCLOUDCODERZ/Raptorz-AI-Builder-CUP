import { useEffect, useRef, useState } from 'react';
import {
  Activity, ArrowRight, Check, CreditCard, Cpu, Fingerprint, Globe2, Layers, Mail,
  MapPin, Radar, RefreshCw, Shield, ShieldAlert, ShieldCheck, Smartphone, Sparkles,
  UserRound, Wifi, X,
} from 'lucide-react';
import type { AISignal, Phase, RiskLevel, RuleCheck, Scenario } from './types';

const ICONS: Record<string, typeof MapPin> = {
  MapPin, Smartphone, Activity, UserRound, CreditCard, Wifi,
};

const levelStyles: Record<AISignal['level'], string> = {
  high: 'text-rose-600 bg-rose-50 ring-rose-200',
  warn: 'text-amber-600 bg-amber-50 ring-amber-200',
  info: 'text-emerald-600 bg-emerald-50 ring-emerald-200',
};

// ---------- small building blocks ----------
// Static class strings so Tailwind's JIT can see them (no dynamic interpolation).
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
        {Icon && (
          <span className={`grid place-items-center h-9 w-9 rounded-xl ring-1 ${ACCENT[accent] ?? ACCENT.indigo}`}>
            <Icon size={18} />
          </span>
        )}
        <div>
          {kicker && <div className="text-[11px] font-semibold tracking-widest text-indigo-500">{kicker}</div>}
          <h3 className="text-slate-900 font-semibold leading-tight">{title}</h3>
        </div>
      </div>
      {children}
    </section>
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
  const stateFor = (key: string): { label: string; cls: string } => {
    const stepIdx = ORDER.indexOf(key === 'decision' ? 'stepup' : (key as Phase));
    if (key === 'decision') {
      if (phase === 'approved') return { label: 'APPROVED', cls: 'text-emerald-600 bg-emerald-50 ring-emerald-200' };
      if (phase === 'blocked') return { label: 'BLOCKED', cls: 'text-rose-600 bg-rose-50 ring-rose-200' };
      return { label: 'PENDING', cls: 'text-slate-400 bg-slate-50 ring-slate-200' };
    }
    if (key === 'stepup') {
      if (phase === 'approved' && level === 'low') return { label: 'NOT REQUIRED', cls: 'text-emerald-600 bg-emerald-50 ring-emerald-200' };
      if (phase === 'stepup' || phase === 'otp') return { label: 'VERIFICATION REQUIRED', cls: 'text-violet-600 bg-violet-50 ring-violet-200' };
      if (idx > ORDER.indexOf('otp')) return { label: 'COMPLETED', cls: 'text-emerald-600 bg-emerald-50 ring-emerald-200' };
      return { label: 'PENDING', cls: 'text-slate-400 bg-slate-50 ring-slate-200' };
    }
    if (key === 'score' && (phase === 'score')) return { label: level === 'high' ? 'HIGH RISK' : level === 'medium' ? 'MEDIUM RISK' : 'LOW RISK', cls: level === 'high' ? 'text-rose-600 bg-rose-50 ring-rose-200' : level === 'medium' ? 'text-amber-600 bg-amber-50 ring-amber-200' : 'text-emerald-600 bg-emerald-50 ring-emerald-200' };
    if (key === 'ai' && phase === 'ai') return { label: 'ANALYZING', cls: 'text-indigo-600 bg-indigo-50 ring-indigo-200 animate-pulse' };
    if (stepIdx < idx) return { label: 'COMPLETED', cls: 'text-emerald-600 bg-emerald-50 ring-emerald-200' };
    if (stepIdx === idx) return { label: 'IN PROGRESS', cls: 'text-indigo-600 bg-indigo-50 ring-indigo-200 animate-pulse' };
    return { label: 'PENDING', cls: 'text-slate-400 bg-slate-50 ring-slate-200' };
  };

  return (
    <ol className="relative">
      {TIMELINE.map((step, i) => {
        const st = stateFor(step.key);
        const done = st.label === 'COMPLETED' || st.label === 'APPROVED';
        const active = st.label.includes('PROGRESS') || st.label === 'ANALYZING' || st.label.includes('RISK') || st.label.includes('REQUIRED');
        return (
          <li key={step.key} className="flex gap-4 pb-5 last:pb-0 relative">
            {i < TIMELINE.length - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200" />}
            <span className={`z-10 grid place-items-center h-8 w-8 rounded-full text-white text-xs font-bold shrink-0 transition-colors ${done ? 'bg-emerald-500' : active ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              {done ? <Check size={15} /> : i + 1}
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
  return (
    <SectionCard title="Traditional Rule Engine" kicker="LEGACY CHECK" icon={Layers} accent="slate">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {RULE_CHECKS_LOCAL.map((r, i) => (
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
const RULE_CHECKS_LOCAL: RuleCheck[] = [
  { label: 'Amount', value: 'NORMAL' }, { label: 'Merchant', value: 'TRUSTED' }, { label: 'Card', value: 'VALID' },
  { label: 'Country', value: 'NOT BLOCKED' }, { label: 'Velocity', value: 'NORMAL' },
];

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
              <span className={`grid place-items-center h-8 w-8 rounded-lg ring-1 ${levelStyles[s.level]}`}><Icon size={16} /></span>
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

// ---------- risk gauge ----------
export function RiskGauge({ score, level }: { score: number; level: RiskLevel }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0; const start = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - start) / 900); setShown(Math.round(score * p)); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [score]);
  const color = level === 'high' ? '#e11d48' : level === 'medium' ? '#d97706' : '#059669';
  const R = 52, C = 2 * Math.PI * R, off = C * (1 - shown / 100);
  const label = level === 'high' ? 'HIGH RISK' : level === 'medium' ? 'MEDIUM RISK' : 'LOW RISK';
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke="#eef2f7" strokeWidth="12" />
          <circle cx="60" cy="60" r={R} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .1s linear' }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{shown}</div>
            <div className="text-[11px] text-slate-400 font-medium">/ 100</div>
          </div>
        </div>
      </div>
      <span className="mt-2 text-xs font-bold tracking-wider px-3 py-1 rounded-full ring-1" style={{ color, background: color + '14', borderColor: color + '33' }}>{label}</span>
    </div>
  );
}

// ---------- step-up ----------
export function StepUpCard({ mobile, email, onChoose }: { mobile: string; email: string; onChoose: (c: 'mobile' | 'email') => void }) {
  return (
    <SectionCard title="Additional Verification Required" kicker="STEP-UP AUTHENTICATION" icon={ShieldAlert} accent="violet">
      <p className="text-sm text-slate-600 -mt-1 mb-4">We detected unusual activity. Please verify your identity to continue.</p>
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

// ---------- OTP screen ----------
export function OtpScreen({ channel, target, secondsLeft, attempts, maxAttempts, error, demoMode, demoOtp, onVerify, onResend }: {
  channel: 'mobile' | 'email'; target: string; secondsLeft: number; attempts: number; maxAttempts: number;
  error: string; demoMode: boolean; demoOtp: string; onVerify: (code: string) => void; onResend: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { setDigits(Array(6).fill('')); refs.current[0]?.focus(); }, [channel]);
  useEffect(() => { if (error) { setDigits(Array(6).fill('')); refs.current[0]?.focus(); } }, [error]);

  const set = (i: number, v: string) => {
    const c = v.replace(/\D/g, '').slice(-1);
    const next = [...digits]; next[i] = c; setDigits(next);
    if (c && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const onPaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    if (p.length) { const n = Array(6).fill('').map((_, i) => p[i] ?? ''); setDigits(n); refs.current[Math.min(p.length, 5)]?.focus(); }
  };
  const code = digits.join('');
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
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
        <button disabled={code.length !== 6 || expired} onClick={() => onVerify(code)}
          className="flex-1 inline-flex justify-center items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 enabled:hover:bg-indigo-700 disabled:opacity-40 rounded-xl px-4 py-2.5 transition"><ShieldCheck size={16} /> Verify OTP</button>
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

// ---------- success / failure ----------
export function ResultCard({ approved, amount, score, channelLabel, onInvestigate }: {
  approved: boolean; amount: number; score: number; channelLabel: string; onInvestigate: () => void;
}) {
  return (
    <div className={`rounded-2xl p-6 text-white shadow-lg ${approved ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-200' : 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-200'}`}>
      <div className="grid place-items-center h-14 w-14 rounded-full bg-white/20 mb-4">
        {approved ? <Check size={30} /> : <X size={30} />}
      </div>
      <h3 className="text-2xl font-extrabold">{approved ? 'Identity Verified' : 'Verification Failed'}</h3>
      <p className="text-white/90 font-medium">{approved ? 'Transaction Approved' : 'Transaction Blocked'}</p>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Stat k="Transaction" v={`$${amount.toFixed(2)}`} />
        <Stat k="Risk Score" v={`${score}/100`} />
        <Stat k={approved ? 'Verification' : 'Attempts'} v={approved ? channelLabel : '3 / 3'} />
        <Stat k="Status" v={approved ? 'APPROVED' : 'BLOCKED'} />
      </div>
      <p className="text-sm text-white/90 mt-4">{approved ? 'Customer successfully verified their identity.' : 'Incorrect OTP — routed to fraud investigation.'}</p>
      <button onClick={onInvestigate} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold bg-white/15 hover:bg-white/25 rounded-xl px-4 py-2.5 transition">
        {approved ? 'View Investigation' : 'Send to Fraud Investigation'} <ArrowRight size={15} />
      </button>
    </div>
  );
}
function Stat({ k, v }: { k: string; v: string }) {
  return <div className="rounded-xl bg-white/10 px-3 py-2"><div className="text-[11px] text-white/70">{k}</div><div className="font-bold">{v}</div></div>;
}

// ---------- investigation ----------
export function InvestigationView({ score, level, summary, evidence, recommendation }: {
  score: number; level: RiskLevel; summary: string; evidence: string[]; recommendation: string;
}) {
  return (
    <SectionCard title="AI Fraud Investigation" kicker="ANALYST ASSIST · GENERATIVE AI" icon={Fingerprint} accent="violet">
      <div className="flex items-center gap-4 mb-4">
        <div className="text-2xl font-extrabold text-slate-900">{score}<span className="text-slate-400 text-base"> / 100</span></div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ring-1 ${level === 'high' ? 'text-rose-600 bg-rose-50 ring-rose-200' : level === 'medium' ? 'text-amber-600 bg-amber-50 ring-amber-200' : 'text-emerald-600 bg-emerald-50 ring-emerald-200'}`}>{level.toUpperCase()}</span>
      </div>
      <p className="text-sm text-slate-700 bg-violet-50 ring-1 ring-violet-100 rounded-xl px-4 py-3">{summary}</p>
      <div className="text-[11px] font-semibold tracking-widest text-slate-400 mt-5 mb-2">EVIDENCE</div>
      <ol className="space-y-1.5">
        {evidence.map((e, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-slate-700"><span className="shrink-0 grid place-items-center h-5 w-5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold">{i + 1}</span>{e}</li>
        ))}
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
        <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="text-xs font-semibold text-slate-500 mb-1">Traditional Rules</div>
          <div className="text-slate-800 font-medium">"Transaction looks normal."</div>
        </div>
        <div className="rounded-xl bg-violet-50 ring-1 ring-violet-200 p-4">
          <div className="text-xs font-semibold text-violet-500 mb-1">AI</div>
          <div className="text-slate-800 font-medium">"Customer behaviour looks abnormal."</div>
        </div>
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
        {items.map((it, i) => {
          const Icon = icons[i];
          return (
            <div key={it.tag}>
              <span className="grid place-items-center h-10 w-10 rounded-xl bg-white/10 text-indigo-300 mb-3"><Icon size={19} /></span>
              <div className="text-sm font-bold tracking-widest text-indigo-300">{it.tag}</div>
              <div className="text-sm text-white/80 mt-1">{it.text}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-7 pt-6 border-t border-white/10 text-lg sm:text-xl font-semibold leading-snug">
        AI doesn't just detect fraud. <span className="text-indigo-300">It verifies the customer before approving the transaction.</span>
      </div>
    </div>
  );
}

// ---------- architecture ----------
export function ArchitectureView({ steps }: { steps: string[] }) {
  const decisioning = new Set(['Transaction API', 'Rule Engine', 'AI / ML Risk Engine', 'Risk Score', 'Step-Up Authentication', 'Mobile OTP / Email OTP', 'Transaction Decision']);
  return (
    <SectionCard title="Reference Architecture" kicker="SYSTEM VIEW" icon={Layers} accent="slate">
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-3 py-2 rounded-lg ring-1 ${s === 'Fraud Investigation' ? 'bg-violet-50 text-violet-700 ring-violet-200' : decisioning.has(s) ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' : 'bg-slate-50 text-slate-700 ring-slate-200'}`}>{s}</span>
            {i < steps.length - 1 && <ArrowRight size={14} className="text-slate-300" />}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-indigo-200 ring-1 ring-indigo-300 inline-block" /> Real-time transaction decisioning</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-violet-200 ring-1 ring-violet-300 inline-block" /> AI investigation / explanation (generative)</span>
      </div>
      <p className="text-xs text-slate-500 mt-3">The <b>risk engine</b> makes the transaction decision. Generative AI is used only for investigation summaries and analyst assistance — never to authorize the payment.</p>
    </SectionCard>
  );
}

// ---------- demo controls ----------
export function DemoControls({ onStart, onRisk, onChannel, onApprove, onBlock, phase }: {
  onStart: () => void; onRisk: (l: RiskLevel) => void; onChannel: (c: 'mobile' | 'email') => void;
  onApprove: () => void; onBlock: () => void; phase: Phase;
}) {
  const Btn = ({ children, onClick, tone = 'ghost' }: { children: React.ReactNode; onClick: () => void; tone?: string }) => (
    <button onClick={onClick} className={`text-xs font-semibold rounded-lg px-3 py-2 transition whitespace-nowrap ${tone === 'primary' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : tone === 'green' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100' : tone === 'red' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{children}</button>
  );
  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur ring-1 ring-slate-200 p-3 flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-bold tracking-widest text-slate-400 mr-1 flex items-center gap-1.5"><Sparkles size={13} className="text-indigo-500" /> DEMO CONTROLS</span>
      <Btn onClick={onStart} tone="primary">▶ Start Transaction</Btn>
      <Btn onClick={() => onRisk('low')}>Low Risk</Btn>
      <Btn onClick={() => onRisk('medium')}>Medium Risk</Btn>
      <Btn onClick={() => onRisk('high')}>High Risk</Btn>
      <Btn onClick={() => onChannel('mobile')}>Send Mobile OTP</Btn>
      <Btn onClick={() => onChannel('email')}>Send Email OTP</Btn>
      <Btn onClick={onApprove} tone="green">Approve</Btn>
      <Btn onClick={onBlock} tone="red">Block</Btn>
    </div>
  );
}
