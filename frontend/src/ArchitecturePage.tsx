import {
  ArrowDown, Bot, BrainCircuit, Cloud, CreditCard, Database, Fingerprint, Gauge, Globe2,
  Layers, Lock, Network, Radio, ShieldAlert, ShieldCheck, Smartphone, Zap,
} from 'lucide-react';

const CARD = 'rounded-xl px-4 py-3 ring-1 text-center';
const blue = { background: 'rgba(66,133,244,.1)', borderColor: 'rgba(66,133,244,.35)', color: '#bcd6ff' };
const violet = { background: 'rgba(139,92,246,.1)', borderColor: 'rgba(139,92,246,.35)', color: '#d3c4fb' };
const slate = { background: 'rgba(90,130,170,.1)', borderColor: 'rgba(90,130,170,.28)', color: '#c7d7e6' };

function Node({ icon: Icon, label, sub, tone = slate }: { icon: typeof Bot; label: string; sub?: string; tone?: React.CSSProperties }) {
  return (
    <div className={CARD} style={{ ...tone, border: `1px solid ${tone.borderColor as string}` }}>
      <div className="flex items-center justify-center gap-2 font-semibold text-[13px]"><Icon size={15} /> {label}</div>
      {sub && <div className="text-[10px] opacity-70 mt-0.5">{sub}</div>}
    </div>
  );
}
const Down = () => <div className="flex justify-center py-1.5"><ArrowDown size={16} style={{ color: '#54708c' }} /></div>;

const SERVICES = [
  { icon: BrainCircuit, name: 'Vertex AI — Gemini 3.5 Flash', role: 'Reasoning for the specialist agents + the investigation/RM summaries. Served from the global endpoint.', tag: 'AI' },
  { icon: Bot, name: 'Google GenAI SDK', role: 'The agent framework — orchestrator + specialist agents, structured decision output.', tag: 'AI' },
  { icon: Cloud, name: 'Cloud Run', role: 'Hosts the backend agent service and the static frontend. Scales to zero; built from source via Cloud Build.', tag: 'Compute' },
  { icon: Radio, name: 'Pub/Sub', role: 'Event backbone — transactions stream in and wake the router (Taskmaster event-driven routing).', tag: 'Events' },
  { icon: Database, name: 'Firestore', role: 'Customer memory (confirmed-legit, tier), cases and live agent-step streaming.', tag: 'State' },
  { icon: Layers, name: 'Cloud Build + Artifact Registry', role: 'Builds and stores the container images on every deploy.', tag: 'CI' },
  { icon: Lock, name: 'Secret Manager', role: 'Holds any credentials; the app uses Application Default Credentials (no keys in code).', tag: 'Security' },
  { icon: ShieldAlert, name: 'Model Armor', role: 'Prompt-injection / PII guardrails around the Gemini calls.', tag: 'Security' },
  { icon: Database, name: 'Cloud Storage', role: 'Receipt/evidence uploads for multimodal verification.', tag: 'State' },
];

const DEPLOY = [
  { s: 'Provision', c: 'PROJECT_ID=… bash infra/setup.sh', d: 'Enables APIs, creates Firestore, Pub/Sub topics, a Storage bucket, Artifact Registry and least-privilege service accounts.' },
  { s: 'Deploy backend', c: 'PROJECT_ID=… bash infra/deploy.sh', d: 'Cloud Build builds backend/ and deploys the agent service to Cloud Run (Gemini 3.5-flash, global endpoint, min-instances 0 / max 3).' },
  { s: 'Deploy frontend', c: 'PROJECT_ID=… bash infra/deploy-frontend.sh', d: 'Builds the Vite SPA and serves it from Cloud Run via nginx — one HTTPS URL for the console + the demo.' },
  { s: 'Verify', c: 'curl $URL/investigate -d @backend/sample_vip_stolen.json', d: 'Confirms the live agents return real Gemini decisions on Cloud Run.' },
];

export default function ArchitecturePage() {
  return (
    <section className="placeholder-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="pulse-small" /> SYSTEM VIEW</div>
          <h1>Architecture</h1>
          <p>Two-speed decisioning, the agent fleet, and the step-up flow — end to end on Google Cloud.</p>
        </div>
      </div>

      <div className="panel" style={{ padding: 24 }}>
        {/* legend */}
        <div className="flex flex-wrap gap-4 mb-5 text-[11px]" style={{ color: '#8ba3bb' }}>
          <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded" style={{ background: 'rgba(66,133,244,.5)' }} /> Real-time transaction decisioning (rules + ML/policy)</span>
          <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded" style={{ background: 'rgba(139,92,246,.5)' }} /> AI investigation &amp; explanation (generative)</span>
        </div>

        <div className="max-w-2xl mx-auto">
          <Node icon={Smartphone} label="Client — Mobile / Web / POS" sub="customer initiates a transaction" />
          <Down />
          <Node icon={Zap} label="Transaction API → Pub/Sub" sub="events stream in" tone={blue} />
          <Down />
          <Node icon={Gauge} label="Router · Cloud Run — fast path (ms)" sub="rules + Gemini Flash pre-filter → allow / decline / step-up" tone={blue} />
          <Down />

          {/* deep path */}
          <div className="rounded-2xl p-4 mt-1" style={{ border: '1px dashed rgba(139,92,246,.4)', background: 'rgba(139,92,246,.05)' }}>
            <div className="text-[10px] font-bold tracking-widest mb-3 text-center" style={{ color: '#b79cf7' }}>DEEP PATH · MULTI-AGENT INVESTIGATION (async · Gemini 3.5)</div>
            <Node icon={Bot} label="Orchestrator" tone={violet} />
            <Down />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { i: CreditCard, l: 'Card Status' }, { i: ShieldAlert, l: 'Step-Up Control' }, { i: Fingerprint, l: 'Investigator' }, { i: Network, l: 'Network' },
                { i: Globe2, l: 'Intel' }, { i: ShieldCheck, l: 'Compliance' }, { i: BrainCircuit, l: 'Critic' }, { i: Database, l: 'Memory (Firestore)' },
              ].map((a) => <Node key={a.l} icon={a.i} label={a.l} tone={violet} />)}
            </div>
          </div>
          <Down />
          <Node icon={Gauge} label="Adaptive decision" sub="approve · step-up · hold · block  (+ reason codes)" tone={blue} />
          <Down />

          {/* step-up branch */}
          <div className="grid sm:grid-cols-2 gap-2">
            <Node icon={Smartphone} label="Step-Up — Mobile / Email OTP" sub="auto-pay disabled → verify → approve / block" tone={blue} />
            <Node icon={ShieldAlert} label="RM Alert + Fraud Investigation" sub="AI explanation for the relationship manager" tone={violet} />
          </div>
          <Down />
          <Node icon={Cloud} label="Frontend · Cloud Run (nginx)" sub="analyst console + executive step-up demo — live via Firestore/SSE" tone={slate} />
        </div>

        <p className="text-[11px] mt-6 text-center" style={{ color: '#6d87a0' }}>
          The <b style={{ color: '#bcd6ff' }}>risk engine / policy</b> makes the transaction decision. Generative AI produces investigation summaries and RM explanations — it never authorizes the payment.
        </p>
      </div>

      {/* services */}
      <div className="panel" style={{ padding: 24, marginTop: 16 }}>
        <div className="section-kicker" style={{ marginBottom: 6 }}>GOOGLE CLOUD SERVICES</div>
        <h2 style={{ color: '#e1edf8', fontSize: 15, marginBottom: 16 }}>Services used</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {SERVICES.map((s) => (
            <div key={s.name} className="flex gap-3 rounded-xl p-3" style={{ background: 'rgba(20,48,79,.4)', border: '1px solid rgba(90,130,170,.2)' }}>
              <span className="grid place-items-center h-9 w-9 rounded-lg shrink-0" style={{ background: 'rgba(66,133,244,.13)', color: '#5da0ff' }}><s.icon size={17} /></span>
              <div>
                <div className="flex items-center gap-2"><span style={{ color: '#dce9f4', fontSize: 13, fontWeight: 600 }}>{s.name}</span><span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(66,133,244,.14)', color: '#7fb0ff' }}>{s.tag}</span></div>
                <div style={{ color: '#8ba3bb', fontSize: 11.5, marginTop: 2, lineHeight: 1.5 }}>{s.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* deployment */}
      <div className="panel" style={{ padding: 24, marginTop: 16 }}>
        <div className="section-kicker" style={{ marginBottom: 6 }}>SHIP IT</div>
        <h2 style={{ color: '#e1edf8', fontSize: 15, marginBottom: 16 }}>Deployment</h2>
        <ol className="space-y-3">
          {DEPLOY.map((d, i) => (
            <li key={d.s} className="flex gap-3">
              <span className="grid place-items-center h-7 w-7 rounded-full shrink-0 text-white text-xs font-bold" style={{ background: '#4285f4' }}>{i + 1}</span>
              <div className="flex-1">
                <div style={{ color: '#dce9f4', fontSize: 13, fontWeight: 600 }}>{d.s}</div>
                <code className="block my-1 px-3 py-1.5 rounded-lg text-[11px]" style={{ background: '#050f1d', color: '#8fd3a6', fontFamily: "'Space Mono', monospace" }}>{d.c}</code>
                <div style={{ color: '#8ba3bb', fontSize: 11.5, lineHeight: 1.5 }}>{d.d}</div>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-[11px] mt-4" style={{ color: '#6d87a0' }}>All services scale to zero at rest; the pre-filter keeps Gemini spend low. Built from source via Cloud Build — no local Docker required.</p>
      </div>
    </section>
  );
}
