import {
  ArrowDown, Bell, Bot, BrainCircuit, Check, Cloud, CreditCard, Database, Fingerprint, FolderOpen,
  Gauge, Globe2, Layers, Lock, Mail, Network, Radio, Scale, ShieldAlert, ShieldCheck, Smartphone,
  Sparkles, UserRound, Zap,
} from 'lucide-react';

type Tone = { border: string; bg: string; head: string };
const T: Record<string, Tone> = {
  blue: { border: 'rgba(66,133,244,.42)', bg: 'rgba(66,133,244,.06)', head: '#7fb0ff' },
  violet: { border: 'rgba(139,92,246,.44)', bg: 'rgba(139,92,246,.06)', head: '#b79cf7' },
  green: { border: 'rgba(52,168,83,.44)', bg: 'rgba(52,168,83,.06)', head: '#6dc489' },
  amber: { border: 'rgba(251,188,5,.44)', bg: 'rgba(251,188,5,.06)', head: '#f2c34e' },
  slate: { border: 'rgba(90,130,170,.3)', bg: 'rgba(20,48,79,.25)', head: '#9fb6cd' },
};
const SUB = { background: 'rgba(9,26,47,.55)', border: '1px solid rgba(90,130,170,.2)', borderRadius: 10 } as React.CSSProperties;

function Zone({ title, sub, tone, children }: { title: string; sub?: string; tone: Tone; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${tone.border}`, background: tone.bg, borderRadius: 16, padding: 16 }}>
      <div style={{ color: tone.head, fontSize: 12, fontWeight: 800, letterSpacing: '.06em' }}>{title}</div>
      {sub && <div style={{ color: '#7f99b3', fontSize: 11, marginTop: 2, marginBottom: 12 }}>{sub}</div>}
      {!sub && <div style={{ height: 12 }} />}
      {children}
    </div>
  );
}
function Box({ icon: Icon, title, lines, tone }: { icon: typeof Bot; title: string; lines?: string[]; tone?: Tone }) {
  return (
    <div style={{ ...SUB, padding: '10px 12px' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#dce9f4', fontSize: 12, fontWeight: 700 }}>
        <Icon size={14} style={{ color: tone?.head ?? '#7fb0ff', flex: '0 0 auto' }} /> {title}
      </div>
      {lines && <div style={{ marginTop: 6, display: 'grid', gap: 3 }}>{lines.map((l) => <div key={l} style={{ color: '#8ba3bb', fontSize: 10.5, lineHeight: 1.4 }}>{l}</div>)}</div>}
    </div>
  );
}
const Down = () => <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}><ArrowDown size={16} style={{ color: '#54708c' }} /></div>;

const AGENTS = [
  { i: CreditCard, t: 'Card Status', d: 'Card health, limits, status, recent activity' },
  { i: Lock, t: 'Step-Up Control', d: 'Decides step-up method & channels' },
  { i: Fingerprint, t: 'Investigator', d: 'Deep behavior analysis & pattern match' },
  { i: Network, t: 'Network', d: 'IP/device intel, proxies, VPN, geo' },
  { i: ShieldAlert, t: 'Intel', d: 'Threat intel, fraud patterns, watchlists' },
  { i: Scale, t: 'Compliance', d: 'Policy engine, regulations, risk rules' },
  { i: BrainCircuit, t: 'Critic', d: 'Validates findings, challenges bias, scores' },
];
const SERVICES = [
  { icon: BrainCircuit, name: 'Vertex AI — Gemini 3.5 Flash', role: 'Reasoning for the specialist agents + investigation/RM summaries. Global endpoint.' },
  { icon: Sparkles, name: 'Google GenAI SDK', role: 'Agent framework — orchestrator + specialists, structured decision output.' },
  { icon: Cloud, name: 'Cloud Run', role: 'Hosts the backend agent service + static frontend. Scales to zero; built from source.' },
  { icon: Radio, name: 'Pub/Sub', role: 'Event backbone — transactions stream in and wake the router (event-driven routing).' },
  { icon: Database, name: 'Firestore', role: 'Customer memory (confirmed-legit, tier), cases and live agent-step streaming.' },
  { icon: Layers, name: 'Cloud Build + Artifact Registry', role: 'Builds and stores the container images on every deploy.' },
  { icon: Lock, name: 'Secret Manager', role: 'Holds any credentials; the app uses Application Default Credentials (no keys in code).' },
  { icon: ShieldAlert, name: 'Model Armor', role: 'Prompt-injection / PII guardrails around the Gemini calls.' },
  { icon: Database, name: 'Cloud Storage', role: 'Receipt / evidence uploads for multimodal verification.' },
];
const DEPLOY = [
  { s: 'Provision', c: 'PROJECT_ID=… bash infra/setup.sh', d: 'Enables APIs; creates Firestore, Pub/Sub topics, Storage bucket, Artifact Registry, least-privilege service accounts.' },
  { s: 'Deploy backend', c: 'PROJECT_ID=… bash infra/deploy.sh', d: 'Cloud Build builds backend/ → Cloud Run (Gemini 3.5-flash, global endpoint, min 0 / max 3).' },
  { s: 'Deploy frontend', c: 'PROJECT_ID=… bash infra/deploy-frontend.sh', d: 'Builds the Vite SPA and serves it from Cloud Run via nginx — one HTTPS URL.' },
];

export default function ArchitecturePage() {
  return (
    <section className="placeholder-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="pulse-small" /> SYSTEM VIEW</div>
          <h1>Architecture</h1>
          <p>Two-speed decisioning, the multi-agent fleet, step-up + RM, and the hosted apps — end to end on Google Cloud.</p>
        </div>
      </div>

      <div className="panel" style={{ padding: 20 }}>
        <div className="flex flex-wrap gap-4 mb-4 text-[11px]" style={{ color: '#8ba3bb' }}>
          <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded" style={{ background: 'rgba(66,133,244,.5)' }} /> Real-time decisioning</span>
          <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded" style={{ background: 'rgba(139,92,246,.5)' }} /> AI investigation (generative)</span>
          <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded" style={{ background: 'rgba(52,168,83,.5)' }} /> Decision</span>
          <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded" style={{ background: 'rgba(251,188,5,.5)' }} /> Step-up</span>
        </div>

        {/* A · client + ingress */}
        <Zone title="CLIENT → INGRESS" tone={T.blue}>
          <div className="grid sm:grid-cols-3 gap-2 items-stretch">
            <Box icon={Smartphone} title="Client" lines={['Mobile App · Web · POS', 'Customer initiates a transaction']} tone={T.blue} />
            <Box icon={Zap} title="Transaction API · Cloud Run" lines={['Validates & enriches the request']} tone={T.blue} />
            <Box icon={Radio} title="Pub/Sub · Events Stream" lines={['Event backbone (transaction stream)']} tone={T.blue} />
          </div>
        </Zone>
        <Down />

        {/* B · fast path */}
        <Zone title="ROUTER · CLOUD RUN — FAST PATH (ms)" sub="Rules + Gemini Flash pre-filter" tone={T.blue}>
          <div className="grid sm:grid-cols-2 gap-2">
            <Box icon={ShieldCheck} title="Rule Engine" lines={['Amount · Velocity · Country', 'Device · Merchant · Blacklist / Watchlist']} tone={T.blue} />
            <Box icon={Sparkles} title="Gemini Flash Pre-Filter" lines={['Lightweight ML anomaly detection', 'Customer behaviour snapshot', 'Immediate scoring']} tone={T.blue} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Chip label="ALLOW" sub="approve" tone={T.green} />
            <Chip label="DECLINE" sub="block" tone={{ border: 'rgba(234,67,53,.5)', bg: 'rgba(234,67,53,.1)', head: '#f27b70' }} />
            <Chip label="STEP-UP" sub="verify" tone={T.blue} />
          </div>
        </Zone>
        <Down />

        {/* C · deep path */}
        <Zone title="DEEP PATH · MULTI-AGENT INVESTIGATION" sub="async · Gemini 3.5" tone={T.violet}>
          <Box icon={Bot} title="Orchestrator" lines={['Plans the investigation, delegates to specialist agents,', 'aggregates results and builds decision context.']} tone={T.violet} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {AGENTS.map((a) => <Box key={a.t} icon={a.i} title={`${a.t} Agent`} lines={[a.d]} tone={T.violet} />)}
            <Box icon={Database} title="Memory · Firestore" lines={['Customer memory (confirmed-legit, tier)', 'Cases, agent steps, audit trail, live state']} tone={T.violet} />
          </div>
        </Zone>
        <Down />

        {/* D · adaptive decision */}
        <Zone title="ADAPTIVE DECISION" sub="Orchestrator output" tone={T.green}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Chip label="APPROVE" sub="allow" tone={T.green} />
            <Chip label="STEP-UP" sub="verify customer" tone={T.blue} />
            <Chip label="HOLD" sub="pending review" tone={T.amber} />
            <Chip label="BLOCK" sub="decline" tone={{ border: 'rgba(234,67,53,.5)', bg: 'rgba(234,67,53,.1)', head: '#f27b70' }} />
          </div>
          <div className="mt-2 text-[11px]" style={{ color: '#8ba3bb' }}>+ Reason codes &nbsp;·&nbsp; + Confidence score &nbsp;·&nbsp; + Evidence summary</div>
        </Zone>
        <Down />

        {/* E · step-up */}
        <Zone title="STEP-UP — MOBILE / EMAIL OTP" sub="Auto-pay disabled → verify → approve / block" tone={T.amber}>
          <div className="grid sm:grid-cols-4 gap-2">
            <Box icon={Lock} title="Auto-Pay: DISABLED" lines={['Recurring payments off for this activity']} tone={T.amber} />
            <Box icon={Smartphone} title="Mobile OTP" lines={['Send to +XX ******935']} tone={T.amber} />
            <Box icon={Mail} title="Email OTP" lines={['Send to t******@email.com']} tone={T.amber} />
            <Box icon={Check} title="Verification" lines={['VERIFIED → approve', 'FAILED → block']} tone={T.amber} />
          </div>
        </Zone>
        <Down />

        {/* F · RM + investigation */}
        <Zone title="RM ALERT + FRAUD INVESTIGATION" sub="AI explanation for the relationship manager" tone={T.violet}>
          <div className="grid sm:grid-cols-2 gap-2">
            <Box icon={Bell} title="Alert to RM — Tessa" lines={['Customer: Tyson · Risk 96/100', 'Action: Blocked · Auto-pay disabled · no OTP']} tone={T.violet} />
            <Box icon={Sparkles} title="AI Generated Explanation" lines={['Card used in Italy 2h after Dubai from a new', 'device/network — high probability of compromise']} tone={T.violet} />
          </div>
          <div style={{ ...SUB, padding: '10px 12px', marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#dce9f4', fontSize: 12, fontWeight: 700 }}><FolderOpen size={14} style={{ color: '#b79cf7' }} /> Fraud Investigation Case Created</div>
            <div style={{ color: '#8ba3bb', fontSize: 10.5, marginTop: 5 }}>Case ID: AEGIS-2026-00421 · Status: Open · Priority: Critical · Evidence: cross-country 2h, new device/network, behaviour mismatch, new merchant</div>
          </div>
        </Zone>
        <Down />

        {/* G · frontend */}
        <Zone title="FRONTEND · CLOUD RUN (NGINX)" sub="Analyst console + executive step-up demo" tone={T.slate}>
          <div className="grid sm:grid-cols-2 gap-2">
            <Box icon={Gauge} title="Analyst Console" lines={['Live cases · risk dashboard', 'Investigation workspace · agent step trace']} tone={T.blue} />
            <Box icon={Smartphone} title="Executive Step-Up Demo" lines={['Real-time simulation · decision journey', 'Risk visualization · business impact']} tone={T.blue} />
          </div>
          <div className="mt-2 text-[11px]" style={{ color: '#8ba3bb' }}>Live data via <b style={{ color: '#7fb0ff' }}>Firestore</b> (live state) &nbsp;·&nbsp; <b style={{ color: '#7fb0ff' }}>SSE</b> streaming</div>
        </Zone>

        <p className="text-[11px] mt-5 text-center" style={{ color: '#6d87a0' }}>
          The <b style={{ color: '#bcd6ff' }}>risk engine / policy</b> makes the transaction decision. Generative AI produces investigation summaries and RM explanations — it never authorizes the payment.
        </p>
      </div>

      {/* services */}
      <div className="panel" style={{ padding: 24, marginTop: 16 }}>
        <div className="section-kicker" style={{ marginBottom: 6 }}>GOOGLE CLOUD SERVICES USED</div>
        <h2 style={{ color: '#e1edf8', fontSize: 15, marginBottom: 16 }}>Services</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {SERVICES.map((s) => (
            <div key={s.name} className="flex gap-3 rounded-xl p-3" style={{ background: 'rgba(20,48,79,.4)', border: '1px solid rgba(90,130,170,.2)' }}>
              <span className="grid place-items-center h-9 w-9 rounded-lg shrink-0" style={{ background: 'rgba(66,133,244,.13)', color: '#5da0ff' }}><s.icon size={17} /></span>
              <div>
                <div style={{ color: '#dce9f4', fontSize: 13, fontWeight: 600 }}>{s.name}</div>
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
      </div>
    </section>
  );
}

function Chip({ label, sub, tone }: { label: string; sub: string; tone: Tone }) {
  return (
    <div style={{ border: `1px solid ${tone.border}`, background: tone.bg, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ color: tone.head, fontWeight: 800, fontSize: 12, letterSpacing: '.04em' }}>{label}</div>
      <div style={{ color: '#8ba3bb', fontSize: 9.5, marginTop: 2 }}>{sub}</div>
    </div>
  );
}
