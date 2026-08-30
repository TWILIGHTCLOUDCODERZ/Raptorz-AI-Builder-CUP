import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, CreditCard, Layers, MapPin, Plane, ShieldCheck, UserRound } from 'lucide-react';
import type { OtpChannel, Phase, RiskLevel } from './types';
import {
  ARCHITECTURE, CRITICAL_INVESTIGATION, CUSTOMER, DEMO_OTP, EXEC_SUMMARY, INVESTIGATION, OTP_SECONDS,
  RISK_MATRIX, RM, SCENARIOS, TX_DUBAI, TX_ITALY,
} from './data';
import {
  AISignalsCard, ArchitectureView, AutoApprovalStatus, DemoControls, ExecutiveSummary, ExplainCard,
  InvestigationView, OtpScreen, ResultCard, RiskBreakdown, RiskFactors, RiskGauge, RiskMatrix,
  RmAlertCard, RuleEngineCard, SectionCard, StepUpCard, Timeline, TxContextCard,
} from './components';

const PHASE_ORDER: Phase[] = ['idle', 'received', 'rules', 'ai', 'score', 'stepup', 'otp', 'approved', 'blocked'];
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function FraudJourney({ embedded = false }: { embedded?: boolean }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [level, setLevel] = useState<RiskLevel | null>(null);
  const [channel, setChannel] = useState<OtpChannel | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(OTP_SECONDS);
  const [showInv, setShowInv] = useState(false);
  const [showArch, setShowArch] = useState(false);
  const [blockReason, setBlockReason] = useState<'otp_timeout' | 'otp_failed' | 'manual' | null>(null);
  const runId = useRef(0);

  const scenario = level ? SCENARIOS[level] : null;
  const reached = (p: Phase) => PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(p);
  const crossCountry = !!level && level !== 'low';
  const mainTx = level === 'low' ? TX_DUBAI : TX_ITALY;
  const autoDisabled = !!level && level !== 'low' && reached('score');

  async function startTransaction(lvl: RiskLevel = 'high') {
    const id = ++runId.current;
    setLevel(lvl); setChannel(null); setAttempts(0); setOtpError(''); setSecondsLeft(OTP_SECONDS); setShowInv(false); setBlockReason(null);
    setPhase('received'); await delay(1100); if (runId.current !== id) return;
    setPhase('rules'); await delay(1500); if (runId.current !== id) return;
    setPhase('ai'); await delay(1900); if (runId.current !== id) return;
    setPhase('score'); await delay(1500); if (runId.current !== id) return;
    const sc = SCENARIOS[lvl];
    setPhase(sc.blocks ? 'blocked' : sc.requiresOtp ? 'stepup' : 'approved');
  }

  // OTP countdown — if the customer does not share the code within 2 minutes,
  // Aegis blocks the transaction (verify the customer, otherwise protect them).
  useEffect(() => {
    if (phase !== 'otp') return;
    if (secondsLeft <= 0) { runId.current++; setBlockReason('otp_timeout'); setPhase('blocked'); return; }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secondsLeft]);

  const chooseChannel = (c: OtpChannel) => {
    runId.current++; setChannel(c); setOtpError(''); setSecondsLeft(OTP_SECONDS); setAttempts(0); setBlockReason(null);
    setLevel((l) => (l && l !== 'low' ? l : 'high')); setPhase('otp');
  };
  const verifyOtp = (code: string) => {
    // OTP shared correctly (within the 2-minute window) → transaction passes
    if (code === DEMO_OTP && secondsLeft > 0) { setOtpError(''); setPhase('approved'); return; }
    const a = attempts + 1; setAttempts(a);
    setOtpError(secondsLeft <= 0 ? 'Code expired — please resend.' : 'Incorrect code — please try again.');
    if (a >= 3) { setBlockReason('otp_failed'); setPhase('blocked'); }
  };
  const resendOtp = () => { setSecondsLeft(OTP_SECONDS); setOtpError(''); };
  const approve = () => { runId.current++; setLevel((l) => l ?? 'high'); setPhase('approved'); };
  const block = () => { runId.current++; setBlockReason('manual'); setLevel((l) => l ?? 'critical'); setPhase('blocked'); };
  const reset = () => { runId.current++; setPhase('idle'); setLevel(null); setChannel(null); setAttempts(0); setOtpError(''); setShowInv(false); setBlockReason(null); };

  const channelLabel = channel === 'mobile' ? 'Mobile OTP' : channel === 'email' ? 'Email OTP' : 'No OTP · auto-approved';
  const outcome: 'pending' | 'approved' | 'blocked' = phase === 'approved' ? 'approved' : phase === 'blocked' ? 'blocked' : 'pending';
  const investigation = level === 'critical' ? CRITICAL_INVESTIGATION : INVESTIGATION;

  return (
    <div className="fj-dark" style={{ minHeight: embedded ? undefined : '100vh', background: embedded ? 'transparent' : '#081727' }}>
      {!embedded && <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-slate-200/70">
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
      </header>}

      <main className={embedded ? 'space-y-6' : 'max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6'}>
        <DemoControls onStart={() => startTransaction('high')} onRisk={startTransaction} onChannel={chooseChannel} onApprove={approve} onBlock={block} />
        {showArch && <ArchitectureView steps={ARCHITECTURE} />}

        {/* impossible-travel banner (cross-country scenarios) */}
        {crossCountry && phase !== 'idle' && (
          <div className="rounded-2xl bg-white ring-1 ring-slate-200/70 shadow-sm p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <LocationChip city="Dubai, UAE" sub="Online purchase" time={TX_DUBAI.time} tone="ok" />
              <div className="flex-1 flex items-center gap-2 px-2">
                <div className="flex-1 border-t-2 border-dashed border-rose-300 relative"><Plane size={18} className="text-rose-500 absolute -top-2.5 left-1/2 -translate-x-1/2 rotate-45" /></div>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 ring-1 ring-rose-200 rounded-full px-2.5 py-1 whitespace-nowrap">2 hours · cross-country</span>
                <div className="flex-1 border-t-2 border-dashed border-rose-300" />
              </div>
              <LocationChip city={mainTx.location} sub="Online purchase" time={mainTx.time} tone="risk" />
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
          {/* left */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <SectionCard title="Customer & Transaction" kicker="REAL-TIME" icon={UserRound}>
              <div className="space-y-3">
                <Row label="Customer" value={CUSTOMER.name} />
                <Row label="Card" value={CUSTOMER.cardMasked} mono />
                <Row label="Card tier" value={CUSTOMER.cardTier} accent />
                <Row label="Card status" value={level === 'critical' ? 'REPORTED STOLEN' : 'Active'} danger={level === 'critical'} />
                <Row label="Auto-pay" value={autoDisabled ? 'Suspended · verify customer' : CUSTOMER.autoPay ? 'Enabled' : 'Off'} danger={autoDisabled} />
                <Row label="Normal location" value={CUSTOMER.normalLocation} />
                <div className="h-px bg-slate-100" />
                <Row label={`Transaction (${mainTx.time})`} value={`$${mainTx.amount.toFixed(2)}`} strong />
                <Row label="Merchant" value={mainTx.merchant} />
                <Row label="Channel" value={mainTx.channel} />
                <Row label="Location" value={mainTx.location} danger={crossCountry} />
                <Row label="Device" value={mainTx.device} danger={mainTx.device === 'New'} />
                <Row label="Network" value={mainTx.network} danger={mainTx.network === 'New'} />
                {crossCountry && <Row label="Previous / gap" value="Dubai · 2 hours" danger />}
              </div>
            </SectionCard>

            {phase !== 'idle' && <AutoApprovalStatus disabled={autoDisabled} />}

            <SectionCard title="Transaction Timeline" kicker="JOURNEY" icon={Clock}>
              <Timeline phase={phase} level={level} />
            </SectionCard>
          </div>

          {/* right */}
          <div className="space-y-6">
            {phase === 'idle' && (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-10 text-center">
                <span className="grid place-items-center h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto mb-3"><CreditCard size={22} /></span>
                <div className="font-semibold text-slate-800">Tyson · VIP card · auto-pay enabled</div>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">His normal <b>Dubai</b> purchase <b>auto-approves</b> on the VIP card. Two hours later the same card is used in <b>Italy</b> — <b>Dubai → Italy in 2h</b> is impossible travel, so auto-pay is suspended and Aegis asks for an OTP: <b>share it → approved</b>; <b>not shared in 2 min → blocked</b>.</p>
                <button onClick={() => startTransaction('high')} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl px-5 py-2.5">▶ Start Transaction <ArrowRight size={15} /></button>
              </div>
            )}

            {crossCountry && phase !== 'idle' && <TxContextCard tx={TX_DUBAI} approved />}

            {reached('rules') && phase !== 'idle' && <RuleEngineCard key="rules" />}
            {reached('ai') && scenario && <AISignalsCard key="ai" signals={scenario.signals} />}

            {reached('score') && scenario && (
              <SectionCard title="Risk Score" kicker="AI RISK ENGINE" icon={ShieldCheck} accent="violet">
                <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-start">
                  <RiskGauge score={scenario.score} level={scenario.level} />
                  <div className="space-y-3">
                    <RiskBreakdown items={scenario.breakdown} score={scenario.score} />
                    <RiskFactors factors={scenario.factors} />
                    <p className="text-[11px] text-slate-400">The numbers are illustrative; in production the bank calibrates these thresholds using historical fraud / false-positive data.</p>
                  </div>
                </div>
              </SectionCard>
            )}

            {scenario?.notifyRm && reached('score') && (
              <RmAlertCard rmName={RM.name} level={scenario.level} score={scenario.score} amount={mainTx.amount}
                location={mainTx.location} previous="Dubai, UAE" timeGap="2 hours" channel={mainTx.channel}
                explanation={investigation.summary} outcome={outcome} />
            )}

            {phase === 'stepup' && <StepUpCard mobile={CUSTOMER.mobileMasked} email={CUSTOMER.emailMasked} amount={mainTx.amount} location={mainTx.location} time={mainTx.time} onChoose={chooseChannel} />}

            {phase === 'otp' && channel && (
              <>
                <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3 text-[13px] text-amber-800 flex items-start gap-2">
                  <Clock size={16} className="mt-0.5 shrink-0 text-amber-600" />
                  <span><b>Share the OTP to approve.</b> Enter the code sent to your {channelLabel} to pass this payment. If it is <b>not shared within 2 minutes</b>, the transaction is automatically <b>blocked</b> to protect the customer.</span>
                </div>
                <OtpScreen channel={channel} target={channel === 'mobile' ? CUSTOMER.mobileMasked : CUSTOMER.emailMasked}
                  secondsLeft={secondsLeft} attempts={attempts} maxAttempts={3} error={otpError} demoMode demoOtp={DEMO_OTP}
                  onVerify={verifyOtp} onResend={resendOtp} />
              </>
            )}

            {phase === 'blocked' && level !== 'critical' && (
              <div className="rounded-xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-[13px] text-rose-700 flex items-start gap-2">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-rose-600" />
                <span><b>Transaction blocked.</b> {blockReason === 'otp_timeout'
                  ? 'The one-time passcode was not shared within 2 minutes, so Aegis blocked the payment and protected the customer.'
                  : blockReason === 'otp_failed'
                  ? 'The one-time passcode could not be verified, so the payment was blocked.'
                  : 'Step-up verification was not completed.'}</span>
              </div>
            )}

            {(phase === 'approved' || phase === 'blocked') && scenario && (
              <ResultCard approved={phase === 'approved'} critical={level === 'critical'} autoApproved={level === 'low'} amount={mainTx.amount}
                score={scenario.score} channelLabel={channelLabel} onInvestigate={() => setShowInv(true)} />
            )}

            {(showInv || phase === 'blocked') && scenario && level !== 'low' && (
              <InvestigationView score={scenario.score} level={scenario.level} summary={investigation.summary}
                evidence={investigation.evidence} recommendation={investigation.recommendation} />
            )}

            {reached('score') && level !== 'low' && <ExplainCard />}
          </div>
        </div>

        <RiskMatrix rows={RISK_MATRIX} current={level} />
        <ExecutiveSummary items={EXEC_SUMMARY} />
        <footer className="text-center text-xs text-slate-400 pt-2 pb-6">Demo / POC · simulated transaction, risk scoring &amp; OTP · no real payments or messages sent.</footer>
      </main>
    </div>
  );
}

function Row({ label, value, mono, strong, danger, accent }: { label: string; value: string; mono?: boolean; strong?: boolean; danger?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-500">{label}</span>
      {accent ? (
        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-violet-700 bg-violet-50 ring-1 ring-violet-200 rounded-full px-2.5 py-0.5">★ {value}</span>
      ) : (
        <span className={`text-right ${mono ? 'font-mono text-[13px]' : ''} ${strong ? 'text-lg font-bold text-slate-900' : 'text-sm font-medium'} ${danger ? 'text-rose-600' : 'text-slate-800'}`}>{value}</span>
      )}
    </div>
  );
}

function LocationChip({ city, sub, time, tone }: { city: string; sub: string; time: string; tone: 'ok' | 'risk' }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ${tone === 'risk' ? 'bg-rose-50 ring-rose-200' : 'bg-slate-50 ring-slate-200'}`}>
      <span className={`grid place-items-center h-9 w-9 rounded-lg ${tone === 'risk' ? 'bg-rose-100 text-rose-600' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}><MapPin size={17} /></span>
      <div><div className="font-semibold text-slate-900 text-sm">{city}</div><div className="text-[11px] text-slate-500">{sub} · <span className="font-mono">{time}</span></div></div>
    </div>
  );
}
