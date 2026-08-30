import { useState } from 'react';

type Svc = { id: string; name: string; tag: string; detail: string; x: number; y: number; w: number; h: number };

// Hotspot rects are % of the 1536×1024 "Aegis ARC" diagram, positioned over each
// numbered box. Estimated from the artwork — nudge x/y/w/h to fine-tune; the chips
// below drive the same zoom/highlight regardless of exact pixel alignment.
const SERVICES: Svc[] = [
  { id: 'client',    name: 'Client · Mobile / Web / POS',   tag: '1 · Ingress',  detail: 'A customer initiates a transaction from mobile, web or POS — the entry point of the real-time flow.', x: 2,    y: 12,   w: 11.5, h: 32 },
  { id: 'txapi',     name: 'Transaction API · Cloud Run',   tag: '2 · Compute',  detail: 'Cloud Run service that validates and enriches every incoming transaction. Scales to zero; built from source.', x: 15,   y: 12,   w: 12,   h: 32 },
  { id: 'pubsub',    name: 'Pub/Sub · Events Stream',       tag: '3 · Events',   detail: 'Event backbone — the transaction stream that wakes the router (event-driven autonomous routing).', x: 28,   y: 12,   w: 10.5, h: 32 },
  { id: 'router',    name: 'Router · Cloud Run (Fast Path)', tag: '4 · Fast Path', detail: 'Millisecond fast path: rules + a Gemini Flash pre-filter decide Approve / Step-up / Decline, and escalate high-risk cases async.', x: 39,   y: 12,   w: 14,   h: 32 },
  { id: 'vertex',    name: 'Vertex AI · Gemini 3.5',        tag: '5 · Deep Path', detail: 'The async deep path — six specialist agents (Card Status, Investigator, Network, Intel, Compliance, Critic) reason over the evidence on Gemini 3.5.', x: 56,   y: 12,   w: 26.5, h: 39 },
  { id: 'firestore', name: 'Firestore · Memory',           tag: 'Memory',       detail: 'Customer memory (confirmed-legit, tier), cases, agent steps, intermediate findings and the live audit trail streamed to the console.', x: 57,   y: 36,   w: 24,   h: 15 },
  { id: 'decision',  name: 'Adaptive Decision',            tag: '6 · Policy',   detail: 'Orchestrator output — Approve / Step-up / Hold / Block, with reason codes, a confidence score and an evidence summary.', x: 83.5, y: 12,   w: 14,   h: 39 },
  { id: 'firebase',  name: 'Firebase Authentication',      tag: 'Auth',         detail: 'Sign-in / sign-up (email-password + Google), security rules and App Check protecting the backend; guest mode needs no account.', x: 2,    y: 53,   w: 15,   h: 29 },
  { id: 'stepup',    name: 'Step-Up · Mobile / Email OTP',  tag: '7 · Verify',   detail: 'Auto-pay disabled → Mobile or Email OTP → verify or block. Verify the customer instead of declining them.', x: 29,   y: 51.5, w: 22.5, h: 20.5 },
  { id: 'rm',        name: 'RM Alert + Investigation',     tag: 'Analyst',      detail: 'AI explanation for the relationship manager: real-time notification, risk score & reasons, and case creation when required.', x: 60.5, y: 54,   w: 21,   h: 16 },
  { id: 'outcome',   name: 'Final Outcome',               tag: '8 · Result',   detail: 'Approve / Step-up Verified / Hold / Block — the resolved decision with reason codes.', x: 29,   y: 73,   w: 22.5, h: 13.5 },
  { id: 'frontend',  name: 'Frontend · Cloud Run (NGINX)', tag: '9 · Console',  detail: 'Analyst console + executive demo — live cases & dashboard, real-time agent step trace and the step-up demo via Firestore / SSE.', x: 71,   y: 70.5, w: 27,   h: 17 },
];

export default function ArchitectureExplorer() {
  const [active, setActive] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const sel = SERVICES.find((s) => s.id === active) || null;
  const focus = SERVICES.find((s) => s.id === (active ?? hover)) || null;
  const zoom = active ? 1.9 : 1;
  const origin = focus ? `${focus.x + focus.w / 2}% ${focus.y + focus.h / 2}%` : '50% 50%';
  const anim = 'transform .5s cubic-bezier(.2,.8,.2,1)';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
        <div className="section-kicker" style={{ color: '#5da0ff' }}><span className="blue-dot" /> INTERACTIVE — HOVER OR CLICK A SERVICE</div>
        {active && <button onClick={() => setActive(null)} className="stream-button">Reset view</button>}
      </div>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '1536 / 1024', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(90,130,170,.25)', background: '#0a1526' }}>
        <img src="/Aegis-ARC.png" alt="Aegis architecture" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', transformOrigin: origin, transform: `scale(${zoom})`, transition: anim }} />
        <div style={{ position: 'absolute', inset: 0, transformOrigin: origin, transform: `scale(${zoom})`, transition: anim, pointerEvents: 'none' }}>
          {SERVICES.map((s) => {
            const on = active === s.id || hover === s.id;
            return (
              <button key={s.id} title={s.name}
                onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)}
                onClick={() => setActive((a) => (a === s.id ? null : s.id))}
                style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%`, pointerEvents: 'auto', cursor: 'pointer', borderRadius: 8, background: on ? 'rgba(66,133,244,.18)' : 'transparent', border: on ? '2px solid #5da0ff' : '2px solid transparent', boxShadow: on ? '0 0 22px rgba(66,133,244,.6)' : 'none', transition: 'background .15s, border-color .15s, box-shadow .15s' }} />
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {SERVICES.map((s) => {
          const on = active === s.id;
          return (
            <button key={s.id} onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)} onClick={() => setActive((a) => (a === s.id ? null : s.id))}
              style={{ fontSize: 11, fontWeight: 600, padding: '6px 11px', borderRadius: 20, cursor: 'pointer', transition: 'all .15s', background: on ? 'rgba(66,133,244,.2)' : 'rgba(20,48,79,.5)', color: on ? '#bcd6ff' : '#9fb6cd', border: `1px solid ${on ? 'rgba(66,133,244,.55)' : 'rgba(90,130,170,.25)'}` }}>{s.name}</button>
          );
        })}
      </div>

      {sel && (
        <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: 'rgba(66,133,244,.07)', border: '1px solid rgba(66,133,244,.3)', boxShadow: '0 0 26px rgba(66,133,244,.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5da0ff', boxShadow: '0 0 10px #5da0ff', display: 'inline-block' }} />
            <strong style={{ color: '#eaf2fb', fontSize: 15 }}>{sel.name}</strong>
            <span style={{ fontSize: 10, color: '#7fb0ff', border: '1px solid rgba(66,133,244,.3)', borderRadius: 6, padding: '2px 7px' }}>{sel.tag}</span>
          </div>
          <p style={{ color: '#a9c0d6', fontSize: 13, lineHeight: 1.6, margin: '8px 0 0' }}>{sel.detail}</p>
        </div>
      )}
    </div>
  );
}
