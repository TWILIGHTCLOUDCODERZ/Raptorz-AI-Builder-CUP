import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CreditCard, Clock, Layers, MapPin, Plane, ShieldCheck, UserRound,
} from 'lucide-react';
import type { OtpChannel, Phase, RiskLevel } from './types';
import {
  ARCHITECTURE, CUSTOMER, DEMO_OTP, EXEC_SUMMARY, INVESTIGATION, OTP_SECONDS, SCENARIOS, TRANSACTION,
} from './data';
import {
  AISignalsCard, ArchitectureView, DemoControls, ExecutiveSummary, ExplainCard, InvestigationView,
  OtpScreen, ResultCard, RiskGauge, RuleEngineCard, SectionCard, StepUpCard, Timeline,
} from './components';

const PHASE_ORDER: Phase[] = ['idle', 'received', 'rules', 'ai', 'score', 'stepup', 'otp', 'approved', 'blocked'];
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function FraudJourney() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [level, setLevel] = useState<RiskLevel | null>(null);
  const [channel, setChannel] = useState<OtpChannel | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(OTP_SECONDS);
  const [showInv, setShowInv] = useState(false);
  const [showArch, setShowArch] = useState(false);
  const runId = useRef(0);

  const scenario = level ? SCENARIOS[level] : null;
  const reached = (p: Phase) => PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(p);

  async function startTransaction(lvl: RiskLevel = 'high') {
    const id = ++runId.current;
    setLevel(lvl); setChannel(null); setAttempts(0); setOtpError(''); setSecondsLeft(OTP_SECONDS); setShowInv(false);
    setPhase('received'); await delay(1200); if (runId.current !== id) return;
    setPhase('rules'); await delay(1600); if (runId.current !== id) return;
    setPhase('ai'); await delay(1900); if (runId.current !== id) return;
    setPhase('score'); await delay(1500); if (runId.current !== id) return;
    setPhase(SCENARIOS[lvl].requiresOtp ? 'stepup' : 'approved');
  }

  // OTP countdown
  useEffect(() => {
    if (phase !== 'otp' || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secondsLeft]);

  const chooseChannel = (c: OtpChannel) => {
    runId.current++; // stop any running auto-sequence
    setChannel(c); setOtpError(''); setSecondsLeft(OTP_SECONDS); setAttempts(0);
    setLevel((l) => l ?? 'high'); setPhase('otp');
  };
  const verifyOtp = (code: string) => {
    if (code === DEMO_OTP && secondsLeft > 0) { setOtpError(''); setPhase('approved'); return; }
    const a = attempts + 1; setAttempts(a);
    setOtpError(secondsLeft <= 0 ? 'Code expired — please resend.' : 'Incorrect code — please try again.');
    if (a >= 3) setPhase('blocked');
  };
  const resendOtp = () => { setSecondsLeft(OTP_SECONDS); setOtpError(''); };
  const approve = () => { runId.current++; setLevel((l) => l ?? 'high'); setPhase('approved'); };
  const block = () => { runId.current++; setLevel((l) => l ?? 'high'); setPhase('blocked'); };
  const reset = () => { runId.current++; setPhase('idle'); setLevel(null); setChannel(null); setAttempts(0); setOtpError(''); setShowInv(false); };

  const channelLabel = channel === 'mobile' ? 'Mobile OTP' : 'Email OTP';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-violet-50/40 to-indigo-50/60 text-slate-800">
      {/* top bar */}
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <button onClick={() => { location.hash = ''; }} className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1.5"><ArrowLeft size={15} /> Aegis</button>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-8 w-8 rounded-lg bg-indigo-600 text-white"><ShieldCheck size={17} /></span>
            <div className="leading-tight">
              <div className="font-bold text-slate-900 text-[15px]">AI Fraud Detection</div>
              <div className="text-[11px] text-slate-500">AI spots what rules can't.</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setShowArch((v) => !v)} className="text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 rounded-lg px-3 py-1.5 flex items-center gap-1.5"><Layers size={14} /> Architecture</button>
            <button onClick={reset} className="text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 rounded-lg px-3 py-1.5">Reset</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* demo controls */}
        <DemoControls phase={phase} onStart={() => startTransaction('high')} onRisk={startTransaction} onChannel={chooseChannel} onApprove={approve} onBlock={block} />

        {showArch && <ArchitectureView steps={ARCHITECTURE} />}

        {/* impossible-travel banner */}
        <div className="rounded-2xl bg-white ring-1 ring-slate-200/70 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <LocationChip city="Dubai" sub="In-store tap" time={TRANSACTION.tapTime} tone="ok" />
            <div className="flex-1 flex items-center gap-2 px-2">
              <div className="flex-1 border-t-2 border-dashed border-rose-300 relative">
                <Plane size={18} className="text-rose-500 absolute -top-2.5 left-1/2 -translate-x-1/2 rotate-45" />
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 ring-1 ring-rose-200 rounded-full px-2.5 py-1 whitespace-nowrap">{TRANSACTION.timeDiffSeconds}s · impossible travel</span>
              <div className="flex-1 border-t-2 border-dashed border-rose-300" />
            </div>
            <LocationChip city="Another Country" sub="Online purchase" time={TRANSACTION.onlineTime} tone="risk" />
          </div>
        </div>

        {/* main two-column */}
        <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
          {/* left */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <SectionCard title="Customer & Transaction" kicker="REAL-TIME" icon={UserRound}>
              <div className="space-y-3">
                <Row label="Customer" value={CUSTOMER.name} />
                <Row label="Card" value={CUSTOMER.cardMasked} mono />
                <Row label="Transaction" value={`$${TRANSACTION.amount.toFixed(2)}`} strong />
                <Row label="Merchant" value={TRANSACTION.merchant} />
                <Row label="Channel" value={TRANSACTION.channel} />
                <div className="h-px bg-slate-100" />
                <Row label="Current location" value={TRANSACTION.currentLocation} danger />
                <Row label="Previous location" value={TRANSACTION.previousLocation} />
                <Row label="Time difference" value={`${TRANSACTION.timeDiffSeconds} seconds`} danger />
              </div>
            </SectionCard>

            <SectionCard title="Transaction Timeline" kicker="JOURNEY" icon={Clock}>
              <Timeline phase={phase} level={level} />
            </SectionCard>
          </div>

          {/* right */}
          <div className="space-y-6">
            {phase === 'idle' && (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-10 text-center">
                <span className="grid place-items-center h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto mb-3"><CreditCard size={22} /></span>
                <div className="font-semibold text-slate-800">Ready to demonstrate</div>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">Press <b>Start Transaction</b> (or pick a risk level) to watch the full journey — rules pass, AI flags anomalies, and the customer is verified instead of blocked.</p>
                <button onClick={() => startTransaction('high')} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl px-5 py-2.5">▶ Start Transaction <ArrowRight size={15} /></button>
              </div>
            )}

            {reached('rules') && phase !== 'idle' && <RuleEngineCard key="rules" />}
            {reached('ai') && scenario && <AISignalsCard key="ai" signals={scenario.signals} />}

            {reached('score') && scenario && (
              <SectionCard title="Risk Score" kicker="AI RISK ENGINE" icon={ShieldCheck} accent="violet">
                <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center">
                  <RiskGauge score={scenario.score} level={scenario.level} />
                  <div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {scenario.factors.map((f) => (
                        <div key={f.label} className={`text-sm flex items-center gap-1.5 ${f.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          <span className="font-bold">{f.positive ? '✓' : '+'}</span>{f.label}
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3">Risk score is illustrative and simulated for this demo.</p>
                  </div>
                </div>
              </SectionCard>
            )}

            {phase === 'stepup' && <StepUpCard mobile={CUSTOMER.mobileMasked} email={CUSTOMER.emailMasked} onChoose={chooseChannel} />}

            {phase === 'otp' && channel && (
              <OtpScreen channel={channel} target={channel === 'mobile' ? CUSTOMER.mobileMasked : CUSTOMER.emailMasked}
                secondsLeft={secondsLeft} attempts={attempts} maxAttempts={3} error={otpError}
                demoMode demoOtp={DEMO_OTP} onVerify={verifyOtp} onResend={resendOtp} />
            )}

            {(phase === 'approved' || phase === 'blocked') && scenario && (
              <ResultCard approved={phase === 'approved'} amount={TRANSACTION.amount} score={scenario.score}
                channelLabel={channelLabel} onInvestigate={() => setShowInv(true)} />
            )}

            {(showInv || phase === 'blocked') && scenario && level !== 'low' && (
              <InvestigationView score={scenario.score} level={scenario.level} summary={INVESTIGATION.summary}
                evidence={INVESTIGATION.evidence} recommendation={INVESTIGATION.recommendation} />
            )}

            {reached('score') && level !== 'low' && <ExplainCard />}
          </div>
        </div>

        <ExecutiveSummary items={EXEC_SUMMARY} />

        <footer className="text-center text-xs text-slate-400 pt-2 pb-6">
          Demo / POC · simulated transaction, risk scoring &amp; OTP · no real payments or messages sent.
        </footer>
      </main>
    </div>
  );
}

function Row({ label, value, mono, strong, danger }: { label: string; value: string; mono?: boolean; strong?: boolean; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-right ${mono ? 'font-mono text-[13px]' : ''} ${strong ? 'text-lg font-bold text-slate-900' : 'text-sm font-medium'} ${danger ? 'text-rose-600' : 'text-slate-800'}`}>{value}</span>
    </div>
  );
}

function LocationChip({ city, sub, time, tone }: { city: string; sub: string; time: string; tone: 'ok' | 'risk' }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ${tone === 'risk' ? 'bg-rose-50 ring-rose-200' : 'bg-slate-50 ring-slate-200'}`}>
      <span className={`grid place-items-center h-9 w-9 rounded-lg ${tone === 'risk' ? 'bg-rose-100 text-rose-600' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}><MapPin size={17} /></span>
      <div>
        <div className="font-semibold text-slate-900 text-sm">{city}</div>
        <div className="text-[11px] text-slate-500">{sub} · <span className="font-mono">{time}</span></div>
      </div>
    </div>
  );
}
