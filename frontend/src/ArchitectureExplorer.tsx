import { useState, useEffect } from 'react';

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

const AUTO_CLOSE_MS = 10000;

export default function ArchitectureExplorer() {
  const [active, setActive] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [paused, setPaused] = useState(false); // pointer resting on the popup

  const sel = SERVICES.find((s) => s.id === active) || null;
  const focus = SERVICES.find((s) => s.id === (active ?? hover)) || null;
  const zoom = active ? 1.9 : 1;
  const origin = focus ? `${focus.x + focus.w / 2}% ${focus.y + focus.h / 2}%` : '50% 50%';
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
        @keyframes aegisPopIn { from { opacity:0; transform:scale(.9) translateY(8px) } to { opacity:1; transform:none } }
        @keyframes aegisCountdown { from { width:100% } to { width:0% } }
      `}</style>

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

        {/* in-frame popup — gradient title border, close ✕, 10s auto-close */}
        {sel && (
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            style={{ position: 'absolute', [popTop ? 'top' : 'bottom']: 14, [popLeft ? 'left' : 'right']: 14, width: 'min(340px, 56%)', zIndex: 5,
              padding: 1.5, borderRadius: 14, animation: 'aegisPopIn .28s cubic-bezier(.2,.8,.2,1)',
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
                  animation: `aegisCountdown ${AUTO_CLOSE_MS}ms linear forwards`,
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
