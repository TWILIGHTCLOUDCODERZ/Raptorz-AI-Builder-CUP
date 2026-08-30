import { useState } from 'react';

type Svc = { id: string; name: string; tag: string; detail: string; x: number; y: number; w: number; h: number };

// Hotspot rects are % of the 1536×1024 diagram, positioned over the bottom
// "Google Cloud services used" row. Nudge x/y/w/h if they don't line up with
// your exact PNG — the chips below drive the same zoom/highlight regardless.
const SERVICES: Svc[] = [
  { id: 'vertex', name: 'Vertex AI · Gemini 3.5', tag: 'AI', detail: 'Reasoning for the specialist agents and the investigation / RM summaries. Served from the global endpoint.', x: 1.0, y: 85, w: 10.2, h: 13 },
  { id: 'genai', name: 'Google GenAI SDK', tag: 'Agent framework', detail: 'The orchestrator + specialist agents and the structured decision output.', x: 11.9, y: 85, w: 10.2, h: 13 },
  { id: 'run', name: 'Cloud Run', tag: 'Compute', detail: 'Hosts the backend agent service and the static frontend. Scales to zero; built from source via Cloud Build.', x: 22.8, y: 85, w: 10.2, h: 13 },
  { id: 'pubsub', name: 'Pub/Sub', tag: 'Events', detail: 'Event backbone — transactions stream in and wake the router (event-driven autonomous routing).', x: 33.7, y: 85, w: 10.2, h: 13 },
  { id: 'firestore', name: 'Firestore', tag: 'State + memory', detail: 'Customer memory (confirmed-legit, tier), cases, and live agent-step streaming to the console.', x: 44.6, y: 85, w: 10.2, h: 13 },
  { id: 'build', name: 'Cloud Build + Artifact Registry', tag: 'CI', detail: 'Builds and stores the container images on every deploy.', x: 55.5, y: 85, w: 10.2, h: 13 },
  { id: 'secret', name: 'Secret Manager', tag: 'Secrets', detail: 'Holds the frontend build config (Firebase web keys) as the single source of truth — no keys in code.', x: 66.4, y: 85, w: 10.2, h: 13 },
  { id: 'armor', name: 'Model Armor', tag: 'AI security', detail: 'Prompt-injection / PII guardrails wrapped around the Gemini calls.', x: 77.3, y: 85, w: 10.2, h: 13 },
  { id: 'storage', name: 'Cloud Storage', tag: 'Objects', detail: 'Receipt / evidence uploads for multimodal verification.', x: 88.2, y: 85, w: 10.2, h: 13 },
  { id: 'firebase', name: 'Firebase Authentication', tag: 'Auth', detail: 'Sign-in / sign-up (email-password + Google) for the analyst console; a guest mode needs no account.', x: 22.8, y: 85, w: 10.2, h: 13 },
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
          {SERVICES.filter((s) => s.id !== 'firebase').map((s) => {
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
