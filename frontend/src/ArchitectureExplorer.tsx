import { useState } from 'react';

type Svc = { id: string; name: string; tag: string; detail: string; x: number; y: number; w: number; h: number };

// Hotspot rects are % of the 1536×1024 diagram, positioned over each service's
// box in the numbered flow. Estimated — nudge x/y/w/h to match your exact PNG;
// the chips below drive the same zoom/highlight regardless of exact alignment.
const SERVICES: Svc[] = [
  { id: 'run', name: 'Cloud Run', tag: 'Compute', detail: 'Hosts the transaction API, the multi-agent backend and the static frontend. Scales to zero; built from source.', x: 20, y: 33, w: 10, h: 14 },
  { id: 'pubsub', name: 'Pub/Sub', tag: 'Events', detail: 'Event backbone — transactions stream in and wake the router (event-driven autonomous routing).', x: 30.5, y: 33, w: 9, h: 14 },
  { id: 'vertex', name: 'Vertex AI · Gemini 3.5', tag: 'AI', detail: 'The deep-path multi-agent investigation — seven specialist agents reason over the evidence on Gemini 3.5.', x: 52, y: 27, w: 21, h: 18 },
  { id: 'firestore', name: 'Firestore', tag: 'Memory', detail: 'Customer memory (confirmed-legit, tier), cases, agent steps and live streaming to the console.', x: 52, y: 47, w: 21, h: 11 },
  { id: 'decision', name: 'Adaptive Decision', tag: 'Policy', detail: 'Orchestrator output: Approve / Step-up / Hold / Block — with reason codes, confidence and an evidence summary.', x: 82, y: 29, w: 15, h: 24 },
  { id: 'firebase', name: 'Firebase Authentication', tag: 'Auth', detail: 'Sign-in / sign-up (email-password + Google) and security rules; a guest mode needs no account.', x: 7, y: 58, w: 15, h: 20 },
  { id: 'stepup', name: 'Step-Up · Mobile / Email OTP', tag: 'Verify', detail: 'Auto-pay disabled → Mobile/Email OTP → verify or block. Verify the customer instead of declining them.', x: 31, y: 58, w: 21, h: 18 },
  { id: 'rm', name: 'RM Alert + Investigation', tag: 'Analyst', detail: 'AI-generated explanation for the relationship manager: risk, evidence highlights and an auto-drafted case.', x: 54, y: 60, w: 19, h: 16 },
  { id: 'frontend', name: 'Frontend · Cloud Run', tag: 'Console', detail: 'Analyst console + executive demo — live cases, agent step trace and dashboards via Firestore / SSE.', x: 62, y: 74, w: 21, h: 18 },
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
        <img src="/architecture-diagram.png" alt="Aegis architecture" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', transformOrigin: origin, transform: `scale(${zoom})`, transition: anim }} />
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
