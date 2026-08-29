import {
  AlertTriangle, BrainCircuit, Check, CreditCard, Fingerprint, Globe2, Laptop, MapPin, Network,
  ShieldCheck, Smartphone, Sparkles, UserRound,
} from 'lucide-react';

const card: React.CSSProperties = { background: 'rgba(20,48,79,.4)', border: '1px solid rgba(90,130,170,.2)', borderRadius: 12 };
const kick = (t: string) => <div className="section-kicker" style={{ marginBottom: 6 }}>{t}</div>;

// ---------------- Customer 360 ----------------
export function Customer360() {
  const merchants = [['Maison Watches', 88], ['Emirates', 62], ['Harrods', 47], ['Apple', 31]];
  const txns = [
    ['TX-9F24A8', 'TechWorld · Dubai', '$840', 'Approved', '#69c382'],
    ['TX-77F1C2', 'Emirates · Online', '$2,150', 'Approved', '#69c382'],
    ['TX-VIP-STLN', 'Genève Horlogerie · Geneva', '$15,200', 'Blocked', '#f27b70'],
    ['TX-3B0A11', 'Harrods · London', '$4,900', 'Step-up', '#f2c34e'],
  ];
  return (
    <section className="placeholder-page">
      <div className="page-heading"><div><div className="eyebrow"><span className="pulse-small" /> RELATIONSHIP</div><h1>Customer 360</h1><p>Everything Aegis knows and remembers about this customer.</p></div></div>

      <div className="panel" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#265a9a', color: '#cfe5ff', font: "700 18px 'Space Mono'" }}>EW</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><h2 style={{ color: '#eaf2fb', fontSize: 20, margin: 0 }}>Eleanor Whitfield</h2><span style={{ font: "9px 'Space Mono'", color: '#f2c34e', border: '1px solid rgba(251,188,5,.4)', borderRadius: 6, padding: '3px 7px' }}>VIP · PRIVATE BANK</span></div>
            <div style={{ color: '#8ba3bb', fontSize: 12, marginTop: 4 }}>Customer since 2016 · Home: Dubai, UAE · **** 8891</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['Lifetime value', '$4.2M'], ['Avg ticket', '$2,480'], ['Risk profile', 'Low']].map(([k, v]) => <div key={k} style={{ ...card, padding: '10px 14px', textAlign: 'center' }}><div style={{ color: '#7f99b3', fontSize: 10 }}>{k}</div><div style={{ color: '#e1edf8', font: "700 15px 'Space Mono'" }}>{v}</div></div>)}
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 16 }}>
        <div className="panel" style={{ padding: 20 }}>
          {kick('BEHAVIOURAL FINGERPRINT')}
          <h2 style={{ color: '#e1edf8', fontSize: 14, margin: '0 0 14px' }}>Spending pattern</h2>
          {merchants.map(([m, pct]) => (
            <div key={m as string} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a9c0d6', marginBottom: 4 }}><span>{m}</span><span style={{ color: '#7f99b3' }}>{pct}%</span></div>
              <div style={{ height: 6, borderRadius: 4, background: 'rgba(90,130,170,.15)' }}><div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: 'linear-gradient(90deg,#4285f4,#5da0ff)' }} /></div>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            <div style={{ ...card, padding: '10px 12px' }}><div style={{ color: '#7f99b3', fontSize: 10 }}><MapPin size={11} /> Typical geo</div><div style={{ color: '#dce9f4', fontSize: 12, marginTop: 3 }}>Dubai · London · Monaco</div></div>
            <div style={{ ...card, padding: '10px 12px' }}><div style={{ color: '#7f99b3', fontSize: 10 }}>Active hours</div><div style={{ color: '#dce9f4', fontSize: 12, marginTop: 3 }}>08:00–23:00 GST</div></div>
          </div>
        </div>

        <div className="panel" style={{ padding: 20 }}>
          {kick('AEGIS MEMORY')}
          <h2 style={{ color: '#e1edf8', fontSize: 14, margin: '0 0 12px' }}>Confirmed-legit</h2>
          {['Confirmed annual travel to Monaco each May', 'Recurring luxury watch & boutique purchases confirmed legit', 'Reported card **** 8899 stolen (Mar 2026)'].map((m) => (
            <div key={m} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, color: '#b6cae0', fontSize: 12 }}><BrainCircuit size={14} style={{ color: '#6ba9ff', flex: '0 0 auto', marginTop: 1 }} /> {m}</div>
          ))}
          <div style={{ marginTop: 14 }}>{kick('DEVICES')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ ...card, padding: '8px 10px', display: 'flex', gap: 6, alignItems: 'center', color: '#a9c0d6', fontSize: 11 }}><Smartphone size={13} /> iPhone 15 · trusted</div>
            <div style={{ ...card, padding: '8px 10px', display: 'flex', gap: 6, alignItems: 'center', color: '#a9c0d6', fontSize: 11 }}><Laptop size={13} /> MacBook · trusted</div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 20, marginTop: 16 }}>
        {kick('RECENT ACTIVITY')}
        <h2 style={{ color: '#e1edf8', fontSize: 14, margin: '0 0 12px' }}>Transactions</h2>
        {txns.map(([id, m, amt, dec, col]) => (
          <div key={id as string} style={{ display: 'grid', gridTemplateColumns: '1.1fr 2fr 1fr auto', gap: 10, alignItems: 'center', padding: '10px 0', borderTop: '1px solid rgba(90,130,170,.1)' }}>
            <span style={{ font: "10px 'Space Mono'", color: '#acc5dc' }}>{id}</span>
            <span style={{ color: '#c7d7e6', fontSize: 12 }}>{m}</span>
            <span style={{ font: "11px 'Space Mono'", color: '#cfe0ef' }}>{amt}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: col as string }}>{dec}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------- Compliance / SAR ----------------
export function ComplianceSAR() {
  return (
    <section className="placeholder-page">
      <div className="page-heading"><div><div className="eyebrow"><span className="pulse-small" /> REGULATORY</div><h1>Compliance / SAR</h1><p>AI-drafted Suspicious Activity Report — ready for analyst sign-off.</p></div><button className="stream-button on"><Sparkles size={16} /> AI drafted</button></div>

      <div className="dashboard-grid">
        <div className="panel" style={{ padding: 22 }}>
          {kick('SAR NARRATIVE · AEGIS-2026-00421')}
          <h2 style={{ color: '#e1edf8', fontSize: 15, margin: '0 0 12px' }}>Suspicious Activity Report</h2>
          <div style={{ ...card, padding: 16 }}>
            <p style={{ color: '#b6cae0', fontSize: 12.5, lineHeight: 1.7, margin: 0 }}>
              On 2026-03-12, customer <b style={{ color: '#dce9f4' }}>Tyson</b> (card **** 1234) executed a $480 online purchase in <b style={{ color: '#dce9f4' }}>Italy</b> two hours after a $250 purchase in <b style={{ color: '#dce9f4' }}>Dubai</b>. The Italy transaction originated from a new device and network and deviated materially from the customer's historical behaviour. Auto-approval was disabled and step-up authentication requested; no OTP verification was received and the transaction was blocked. The pattern is consistent with potential card compromise. A fraud investigation case has been opened and the relationship manager notified.
            </p>
          </div>
          <div style={{ marginTop: 16 }}>{kick('EVIDENCE CHAIN')}</div>
          {['Card used in Dubai 10:00 (risk 18, auto-approved)', 'Same card in Italy 12:00 — 2-hour gap', 'New device + unfamiliar network', 'Behaviour mismatch vs. 90-day baseline', 'Auto-pay disabled · OTP not received · blocked'].map((e, i) => (
            <div key={e} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12, color: '#a9c0d6', padding: '6px 0' }}><span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(90,130,170,.16)', color: '#8ba3bb', display: 'grid', placeItems: 'center', font: "10px 'Space Mono'", flex: '0 0 auto' }}>{i + 1}</span>{e}</div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="stream-button on" style={{ color: '#071c13', background: '#55bb78', borderColor: '#55bb78' }}><Check size={15} /> Review &amp; Sign</button>
            <button className="stream-button"><Sparkles size={15} /> Regenerate</button>
          </div>
        </div>

        <aside className="panel" style={{ padding: 20 }}>
          {kick('FILING')}
          <h2 style={{ color: '#e1edf8', fontSize: 14, margin: '0 0 12px' }}>Case details</h2>
          {[['Case ID', 'AEGIS-2026-00421'], ['Subject', 'Tyson'], ['Risk score', '96 / 100'], ['Priority', 'Critical'], ['Status', 'Draft — pending sign-off'], ['Regulator', 'FIU (auto-format)'], ['Assigned', 'Tessa (RM)']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: '1px solid rgba(90,130,170,.1)', fontSize: 12 }}><span style={{ color: '#7f99b3' }}>{k}</span><span style={{ color: '#dce9f4', fontWeight: 600 }}>{v}</span></div>
          ))}
          <div style={{ ...card, padding: 12, marginTop: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <ShieldCheck size={15} style={{ color: '#6dc489', flex: '0 0 auto', marginTop: 1 }} />
            <span style={{ color: '#8ba3bb', fontSize: 11, lineHeight: 1.5 }}>Every field is traceable to the agent evidence — full audit trail attached for the regulator.</span>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ---------------- Network Graph ----------------
export function NetworkGraph() {
  const nodes = [
    { id: 'A1', x: 90, y: 70, label: 'Acct A', tone: '#f27b70' },
    { id: 'A2', x: 90, y: 190, label: 'Acct B', tone: '#f27b70' },
    { id: 'A3', x: 90, y: 310, label: 'Acct C', tone: '#f27b70' },
    { id: 'D1', x: 300, y: 190, label: 'Shared device', tone: '#f2c34e' },
    { id: 'P1', x: 520, y: 190, label: 'Payout mule', tone: '#f27b70' },
    { id: 'C1', x: 300, y: 60, label: 'Clean acct', tone: '#69c382' },
  ];
  const edges = [['A1', 'D1'], ['A2', 'D1'], ['A3', 'D1'], ['D1', 'P1'], ['C1', 'D1']];
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return (
    <section className="placeholder-page">
      <div className="page-heading"><div><div className="eyebrow"><span className="pulse-small" /> FINANCIAL CRIME</div><h1>Network Graph</h1><p>Entity resolution across accounts, devices and payouts — mule rings surfaced.</p></div></div>

      <div className="dashboard-grid">
        <div className="panel" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="section-kicker red-kicker"><span className="red-dot" /> MULE RING DETECTED</div>
            <span className="count-pill">4 accounts</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <svg viewBox="0 0 620 380" style={{ width: '100%', minWidth: 560, height: 340 }}>
              {edges.map(([a, b]) => <line key={a + b} x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} stroke="rgba(120,160,200,.35)" strokeWidth="1.5" strokeDasharray={a === 'C1' ? '4 5' : ''} />)}
              {nodes.map((n) => (
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r="26" fill="rgba(20,48,79,.9)" stroke={n.tone} strokeWidth="2" />
                  <text x={n.x} y={n.y + 4} textAnchor="middle" fill="#dce9f4" style={{ font: "9px 'Space Mono'" }}>{n.id}</text>
                  <text x={n.x} y={n.y + 44} textAnchor="middle" fill="#8ba3bb" style={{ fontSize: 10 }}>{n.label}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <aside className="panel" style={{ padding: 20 }}>
          {kick('RING ANALYSIS')}
          <h2 style={{ color: '#e1edf8', fontSize: 14, margin: '0 0 12px' }}>Findings</h2>
          {[
            [Network, '3 accounts funnel to 1 payout account via a shared device'],
            [Fingerprint, 'Same device fingerprint across A, B, C — synthetic-identity pattern'],
            [Globe2, 'Logins from a common VPN exit node'],
            [CreditCard, 'Rapid small deposits → single large withdrawal (structuring)'],
          ].map(([Icon, t], i) => (
            <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '8px 0', borderTop: i ? '1px solid rgba(90,130,170,.1)' : 'none', color: '#a9c0d6', fontSize: 12 }}>
              {/* @ts-expect-error dynamic icon */}
              <Icon size={15} style={{ color: '#f0a35a', flex: '0 0 auto', marginTop: 1 }} /> {t}
            </div>
          ))}
          <div style={{ ...card, padding: 12, marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start', borderColor: 'rgba(234,67,53,.3)', background: 'rgba(234,67,53,.08)' }}>
            <AlertTriangle size={15} style={{ color: '#f27b70', flex: '0 0 auto', marginTop: 1 }} />
            <span style={{ color: '#e2b3ad', fontSize: 11, lineHeight: 1.5 }}>Recommended: freeze the payout account and file a SAR for the ring.</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
