import { useState, useEffect } from 'react';

type Svc = { id: string; name: string; tag: string; detail: string; x: number; y: number; w: number; h: number };

// Hotspot rects are % of the 1536×1024 Raptorz Banking Earth architecture diagram,
// positioned over each box in the diagram. The chips below drive the same
// zoom/highlight regardless of exact pixel alignment.
const SERVICES: Svc[] = [
  { id: 'ingress',   name: 'Client Channels',              tag: '1 · Ingress',   detail: 'Payments from mobile app, web portal, POS and online checkout — including the Earth Mart / Mars Mart merchant — enter the real-time flow here over HTTPS.', x: 2.0,  y: 14.5, w: 14.5, h: 26.5 },
  { id: 'txapi',     name: 'Transaction API · Cloud Run',  tag: '2 · Compute',   detail: 'Cloud Run service that validates, enriches and security-checks every incoming transaction, then publishes it as an event. Scales to zero; built from source.', x: 19.0, y: 14.5, w: 12.5, h: 26.5 },
  { id: 'pubsub',    name: 'Pub/Sub · Event Stream',       tag: '3 · Events',    detail: 'Event backbone — transaction events, user activity and device signals stream in and wake the router (event-driven autonomous routing).', x: 34.0, y: 14.5, w: 12.5, h: 26.5 },
  { id: 'fastpath',  name: 'Fast Path · Router + Gemini Flash', tag: '4 · Fast Path', detail: 'Millisecond fast path on Cloud Run: rules/policies plus a Gemini Flash pre-filter (behaviour, anomaly, device/geo) score risk and decide Low-risk auto-approve vs. escalate medium/high risk to the deep path.', x: 48.0, y: 14.5, w: 15.5, h: 26.5 },
  { id: 'decision',  name: 'Adaptive Decision',            tag: '6 · Policy',    detail: 'Risk-banded outcome — 0-30 Auto-approve · 31-70 Step-up (OTP) · 71-90 Manual review · 91-100 Block. Enforces the home-country geo gate, stolen-card hard block and auto-pay/OTP step-up, with reason codes, confidence and evidence.', x: 77.0, y: 14.5, w: 21.0, h: 27.0 },
  { id: 'auth',      name: 'Identity Platform · Firebase Auth', tag: 'Auth',      detail: 'Cloud IAM / Workforce Identity and Firebase Authentication — sign-in & security rules, MFA/OTP and guest mode — supplying the auth context to the pipeline.', x: 2.0,  y: 43.5, w: 14.5, h: 27.0 },
  { id: 'deeppath',  name: 'Deep Path · Multi-Agent (ADK + Gemini 3.5)', tag: '5 · Agents', detail: 'The async multi-agent investigation on Google ADK + Gemini 3.5 — an Orchestrator delegates to Card Status, Step-Up Control, Investigator, Network, Intel, Compliance and Critic agents that reason over the evidence in parallel and synthesise an explanation.', x: 19.0, y: 43.5, w: 56.0, h: 38.5 },
  { id: 'memory',    name: 'Agent Memory & Knowledge',     tag: 'Memory',        detail: 'Firestore (session memory & agent state), Vertex AI Search (fraud patterns & knowledge base) and Cloud Storage (documents & reference data) that ground the agents.', x: 21.0, y: 72.0, w: 52.0, h: 8.5 },
  { id: 'twilio',    name: 'Twilio · OTP & Voice',         tag: 'Step-Up',       detail: 'Twilio Verify sends the step-up one-time passcode by SMS and validates it; Twilio Programmable Voice powers the RM call that recovers a blocked card only on validated customer approval.', x: 87.3, y: 44.0, w: 11.5, h: 11.5 },
  { id: 'corebank',  name: 'Core Banking Systems',         tag: 'Core',          detail: 'Payments, account management, customer profiles and fraud management — the system of record the decision acts on.', x: 85.0, y: 56.5, w: 14.0, h: 13.0 },
  { id: 'notif',     name: 'Notifications',                tag: 'Notify',        detail: 'Twilio SMS (OTP), email, mobile push and analyst console alerts triggered by the decision.', x: 85.0, y: 71.0, w: 14.0, h: 13.5 },
  { id: 'monitoring', name: 'Monitoring & Analytics',      tag: '7 · Observe',   detail: 'Cloud Logging (audit logs), Cloud Monitoring (system health) and Looker (dashboards & insights) for observability across the platform.', x: 2.0,  y: 83.0, w: 62.0, h: 10.0 },
  { id: 'frontend',  name: 'Frontend Console · Cloud Run', tag: '8 · Console',   detail: 'Analyst console on Cloud Run — case management, live investigations, agent reasoning & explanation and approve / decline actions, fed by Firestore / SSE.', x: 65.0, y: 83.0, w: 33.5, h: 10.0 },
];

const AUTO_CLOSE_MS = 10000;
const ZOOM = 1.9;

// Pick the zoom focal point (transform-origin) on one axis so the box stays in
// frame after scaling — clamped to keep its edges (and its title) visible rather
// than centering, which would push a tall box's header off the top edge.
function axisOrigin(start: number, len: number, z: number, margin = 5): number {
  const oMax = (z * start - margin) / (z - 1);              // keeps the start edge visible
  const oMin = (z * (start + len) - (100 - margin)) / (z - 1); // keeps the end edge visible
  const center = start + len / 2;
  // if the box fits, center it within the allowed range; if it's larger than the
  // viewport, favour the start edge (top / left) where the title sits
  return oMin <= oMax ? Math.min(Math.max(center, oMin), oMax) : oMax;
}

export default function ArchitectureExplorer() {
  const [active, setActive] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [paused, setPaused] = useState(false); // pointer resting on the popup

  const sel = SERVICES.find((s) => s.id === active) || null;
  const focus = SERVICES.find((s) => s.id === (active ?? hover)) || null;
  const zoom = active ? ZOOM : 1;
  const origin = focus ? `${axisOrigin(focus.x, focus.w, ZOOM)}% ${axisOrigin(focus.y, focus.h, ZOOM)}%` : '50% 50%';
  const anim = 'transform .5s cubic-bezier(.2,.8,.2,1)';

  // place the popup in the opposite quadrant from the focused box, so the
  // zoomed-in service (and its name) stays visible instead of being covered
  const popTop = sel ? sel.y + sel.h / 2 >= 48 : false;
  const popLeft = sel ? sel.x + sel.w / 2 >= 50 : true;

  // auto-dismiss the popup after 10s of no action; hovering the popup pauses it
  useEffect(() => {
    if (!active || paused) return;
    const t = window.setTimeout(() => setActive(null), AUTO_CLOSE_MS);
    return () => window.clearTimeout(t);
  }, [active, paused]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
        <div className="section-kicker" style={{ color: '#5da0ff' }}><span className="blue-dot" /> INTERACTIVE — HOVER OR CLICK A SERVICE</div>
        {active && <button onClick={() => setActive(null)} className="stream-button">Reset view</button>}
      </div>

      <style>{`
        @keyframes raptorzPopIn { from { opacity:0; transform:scale(.9) translateY(8px) } to { opacity:1; transform:none } }
        @keyframes raptorzCountdown { from { width:100% } to { width:0% } }
      `}</style>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '1536 / 1024', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(90,130,170,.25)', background: '#0a1526' }}>
        <img src="/raptorz-architecture.png" alt="Raptorz architecture" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', transformOrigin: origin, transform: `scale(${zoom})`, transition: anim }} />
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

        {/* in-frame popup — gradient title border, close ✕, 10s auto-close */}
        {sel && (
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            style={{ position: 'absolute', [popTop ? 'top' : 'bottom']: 14, [popLeft ? 'left' : 'right']: 14, width: 'min(340px, 56%)', zIndex: 5,
              padding: 1.5, borderRadius: 14, animation: 'raptorzPopIn .28s cubic-bezier(.2,.8,.2,1)',
              background: 'linear-gradient(135deg, rgba(66,133,244,.9), rgba(167,139,250,.7) 52%, rgba(66,133,244,.15))',
              boxShadow: '0 24px 60px rgba(0,0,0,.6), 0 0 34px rgba(66,133,244,.28)' }}>
            <div style={{ borderRadius: 12.5, overflow: 'hidden', background: '#0b1a2e', border: '1px solid rgba(255,255,255,.05)' }}>
              {/* title bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px 11px 14px', background: 'linear-gradient(90deg, rgba(66,133,244,.16), rgba(167,139,250,.06))', borderBottom: '1px solid rgba(120,160,200,.18)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5da0ff', boxShadow: '0 0 10px #5da0ff', flex: 'none' }} />
                <strong style={{ color: '#eaf2fb', fontSize: 14, letterSpacing: '-.01em', flex: 1, lineHeight: 1.2 }}>{sel.name}</strong>
                <span style={{ fontSize: 10, color: '#7fb0ff', border: '1px solid rgba(66,133,244,.35)', borderRadius: 6, padding: '2px 7px', flex: 'none', fontFamily: "'Space Mono', monospace" }}>{sel.tag}</span>
                <button onClick={() => setActive(null)} aria-label="Close" title="Close"
                  style={{ flex: 'none', width: 24, height: 24, display: 'grid', placeItems: 'center', cursor: 'pointer', borderRadius: 7, marginLeft: 2, color: '#9fb6cd', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(120,160,200,.22)', lineHeight: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
                </button>
              </div>
              {/* body */}
              <p style={{ color: '#a9c0d6', fontSize: 12.5, lineHeight: 1.55, margin: 0, padding: '12px 14px 14px' }}>{sel.detail}</p>
              {/* countdown bar */}
              <div style={{ height: 3, background: 'rgba(255,255,255,.05)' }}>
                <div key={sel.id + (paused ? ':p' : ':r')} style={{ height: '100%', background: 'linear-gradient(90deg,#4285f4,#a78bfa)',
                  animation: `raptorzCountdown ${AUTO_CLOSE_MS}ms linear forwards`,
                  animationPlayState: paused ? 'paused' : 'running' }} />
              </div>
            </div>
          </div>
        )}
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

    </div>
  );
}
