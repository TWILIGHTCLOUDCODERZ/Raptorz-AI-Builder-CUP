import { useEffect, useState } from 'react';
import {
  AlertTriangle, BrainCircuit, Check, ChevronDown, Clock, CreditCard, Eye, EyeOff, Fingerprint, Globe2, Laptop,
  Lock, Mail, MapPin, Network, Phone, PhoneCall, RefreshCw, ShieldCheck, Smartphone, Sparkles, Unlock, UserRound, XCircle,
} from 'lucide-react';

const card: React.CSSProperties = { background: 'rgba(20,48,79,.4)', border: '1px solid rgba(90,130,170,.2)', borderRadius: 12 };

const RM_API = (import.meta.env as any).VITE_API_URL || 'https://raptorz-bfsi-backend-282323062361.us-central1.run.app';

// ---------------- Relationship Manager · Voice Call Workbench ----------------
type RMLog = { time: string; event: string; detail: string; outcome: string };
type RMData = {
  name: string; tier: string; card_last4: string; home: string; phone_masked: string; email_masked: string;
  rm_name: string; autopay: string; last_block_reason: string; card_status: string; card_status_raw: string;
  script: string; logs: RMLog[];
};

const OUT = {
  approved: { c: '#69c382', bg: 'rgba(105,195,130,.12)', Icon: Check },
  declined: { c: '#f27b70', bg: 'rgba(242,123,112,.12)', Icon: XCircle },
  error: { c: '#f27b70', bg: 'rgba(242,123,112,.12)', Icon: XCircle },
  warn: { c: '#f2c34e', bg: 'rgba(242,195,78,.12)', Icon: AlertTriangle },
  info: { c: '#7fb0e8', bg: 'rgba(66,133,244,.12)', Icon: PhoneCall },
} as Record<string, { c: string; bg: string; Icon: typeof Check }>;

export function RMWorkbench() {
  const [data, setData] = useState<RMData | null>(null);
  const [calling, setCalling] = useState(false);
  const [open, setOpen] = useState(true);
  const [msg, setMsg] = useState('');

  const load = async () => { try { const r = await fetch(`${RM_API}/rm/customer`); setData(await r.json()); } catch { /* keep last */ } };
  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, []);

  const call = async () => {
    setCalling(true); setMsg('Placing the automated AI voice call to the customer…');
    try {
      const r = await fetch(`${RM_API}/rm/call`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
      const d = await r.json();
      setMsg(d.ok ? `Call placed (status: ${d.status}). Answer the phone and respond to the agent — the card updates here automatically.` : `Could not place the call: ${d.reason || 'unknown error'}.`);
    } catch { setMsg('Could not reach the server to place the call.'); }
    finally { setCalling(false); setTimeout(load, 1500); }
  };
  const reset = async () => { setMsg(''); try { await fetch(`${RM_API}/rm/reset`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }); } catch {} load(); };
  const simulate = async (choice: string) => {
    setMsg(choice === 'yes' ? 'Simulating: customer approved on the call…' : choice === 'no' ? 'Simulating: customer declined on the call…' : 'Simulating: customer did not answer…');
    try { await fetch(`${RM_API}/rm/simulate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ choice }) }); } catch {}
    setTimeout(load, 400);
  };

  const blocked = (data?.card_status_raw || 'blocked') === 'blocked';
  const logs = data?.logs || [];
  const fmtTime = (iso: string) => { try { return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch { return iso; } };
  const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, padding: '9px 0', borderBottom: '1px solid rgba(90,130,170,.12)' };
  const lbl: React.CSSProperties = { color: '#7f99b3', fontSize: 12 };
  const val: React.CSSProperties = { color: '#dceaf8', fontSize: 13, fontWeight: 600, textAlign: 'right' };

  return (
    <section className="placeholder-page">
      <div className="page-heading"><div><div className="eyebrow"><span className="pulse-small" /> RELATIONSHIP MANAGER</div><h1>RM Voice Workbench</h1><p>Recover a blocked card over an AI voice call — unblock only on validated customer approval.</p></div>
        <div className="heading-actions"><button className="stream-button" onClick={reset} title="Reset to Blocked"><RefreshCw size={15} /> Reset demo</button></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,1.1fr) minmax(300px,1fr)', gap: 16, alignItems: 'start' }}>
        {/* Customer + card status */}
        <div className="panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#265a9a', color: '#cfe5ff', font: "700 17px 'Space Mono'" }}>DP</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}><h2 style={{ color: '#eaf2fb', fontSize: 19, margin: 0 }}>{data?.name || 'Deepan'}</h2><span style={{ font: "9px 'Space Mono'", color: '#f2c34e', border: '1px solid rgba(251,188,5,.4)', borderRadius: 6, padding: '3px 7px' }}>{data?.tier || 'VIP · PRIVATE BANK'}</span></div>
              <div style={{ color: '#8fa7c0', fontSize: 12, marginTop: 3 }}>RM: {data?.rm_name || 'Priya Nair'}</div>
            </div>
          </div>

          {/* Card status banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12,
            background: blocked ? 'rgba(242,123,112,.1)' : 'rgba(105,195,130,.1)',
            border: `1px solid ${blocked ? 'rgba(242,123,112,.45)' : 'rgba(105,195,130,.45)'}`, marginBottom: 16 }}>
            {blocked ? <Lock size={22} color="#f27b70" /> : <Unlock size={22} color="#69c382" />}
            <div style={{ flex: 1 }}>
              <div style={{ color: '#7f99b3', fontSize: 10.5, letterSpacing: '.08em' }}>CARD •••• {data?.card_last4 || '1234'} · STATUS</div>
              <div style={{ color: blocked ? '#f49a91' : '#8bd6a4', fontSize: 18, fontWeight: 800, letterSpacing: '.02em' }}>{data?.card_status || 'Blocked'}</div>
            </div>
            <span style={{ font: "10px 'Space Mono'", color: '#9fb6cf', border: '1px solid rgba(90,130,170,.3)', borderRadius: 6, padding: '4px 8px' }}>AutoPay {data?.autopay || 'Disabled'}</span>
          </div>

          <div style={{ ...row, borderTop: '1px solid rgba(90,130,170,.12)' }}><span style={lbl}><MapPin size={12} style={{ verticalAlign: -1 }} /> Home</span><span style={val}>{data?.home || 'Kuala Lumpur, Malaysia'}</span></div>
          <div style={row}><span style={lbl}><Phone size={12} style={{ verticalAlign: -1 }} /> Mobile</span><span style={val}>{data?.phone_masked || '+96 •••• 18'}</span></div>
          <div style={row}><span style={lbl}><Mail size={12} style={{ verticalAlign: -1 }} /> Email</span><span style={val}>{data?.email_masked || 'd•••••••@gmail.com'}</span></div>
          <div style={{ ...row, borderBottom: 'none' }}><span style={lbl}><AlertTriangle size={12} style={{ verticalAlign: -1 }} /> Block reason</span><span style={{ ...val, color: '#f2b0a8', maxWidth: 230 }}>{data?.last_block_reason || 'Suspicious transaction from Singapore'}</span></div>
        </div>

        {/* Voice call action */}
        <div className="panel" style={{ padding: 20 }}>
          {kick('AI VOICE AGENT · TWILIO')}
          <p style={{ color: '#9fb6cf', fontSize: 12.5, margin: '2px 0 12px' }}>The agent will call the customer and read:</p>
          <div style={{ ...card, padding: '13px 15px', position: 'relative', background: 'rgba(66,133,244,.07)', borderColor: 'rgba(66,133,244,.3)' }}>
            <PhoneCall size={15} color="#7fb0e8" style={{ position: 'absolute', top: 12, right: 12 }} />
            <p style={{ color: '#cfe0f2', fontSize: 13, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>“{data?.script || 'There has been a suspicious transaction originating from Singapore…'}”</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, margin: '14px 0 4px' }}>
            {[['Customer says YES', 'Approval recorded → card unblocked (AutoPay stays off)', '#69c382'],
              ['Customer says NO', 'Decision recorded → card stays blocked', '#f2c34e'],
              ['No answer / call fails', 'Outcome recorded → card stays blocked', '#8fa7c0']].map(([t, d, c]) => (
              <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: c as string, marginTop: 6, flexShrink: 0 }} />
                <div><div style={{ color: '#dceaf8', fontSize: 12.5, fontWeight: 600 }}>{t}</div><div style={{ color: '#8299b2', fontSize: 11.5 }}>{d}</div></div>
              </div>
            ))}
          </div>

          <button onClick={call} disabled={calling || !blocked}
            style={{ width: '100%', marginTop: 14, padding: '13px', borderRadius: 11, border: 'none', cursor: calling || !blocked ? 'not-allowed' : 'pointer',
              background: !blocked ? 'rgba(105,195,130,.18)' : 'linear-gradient(135deg,#2f6bff,#1e4fd6)', color: !blocked ? '#8bd6a4' : '#fff',
              fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, opacity: calling ? .7 : 1 }}>
            {!blocked ? <><Unlock size={17} /> Card already unblocked</> : calling ? <><PhoneCall size={17} /> Calling customer…</> : <><PhoneCall size={17} /> Initiate AI voice call</>}
          </button>
          {msg && <p style={{ color: '#9fb6cf', fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>{msg}</p>}

          {/* Demo controls — trial Twilio cannot ring a live number; drive the real state machine */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed rgba(90,130,170,.28)' }}>
            <div style={{ color: '#6f87a0', fontSize: 10.5, letterSpacing: '.07em', marginBottom: 9 }}>DEMO CONTROLS · SIMULATE CALL OUTCOME</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => simulate('yes')} disabled={!blocked} style={{ flex: '1 1 120px', padding: '10px', borderRadius: 9, cursor: blocked ? 'pointer' : 'not-allowed', border: '1px solid rgba(105,195,130,.4)', background: 'rgba(105,195,130,.12)', color: '#8bd6a4', fontSize: 12.5, fontWeight: 700, opacity: blocked ? 1 : .5 }}>✓ Answers YES</button>
              <button onClick={() => simulate('no')} disabled={!blocked} style={{ flex: '1 1 120px', padding: '10px', borderRadius: 9, cursor: blocked ? 'pointer' : 'not-allowed', border: '1px solid rgba(242,123,112,.4)', background: 'rgba(242,123,112,.12)', color: '#f49a91', fontSize: 12.5, fontWeight: 700, opacity: blocked ? 1 : .5 }}>✗ Answers NO</button>
              <button onClick={() => simulate('noanswer')} disabled={!blocked} style={{ flex: '1 1 120px', padding: '10px', borderRadius: 9, cursor: blocked ? 'pointer' : 'not-allowed', border: '1px solid rgba(90,130,170,.35)', background: 'rgba(90,130,170,.1)', color: '#9fb6cf', fontSize: 12.5, fontWeight: 700, opacity: blocked ? 1 : .5 }}>☎ No answer</button>
            </div>
            <p style={{ color: '#6f87a0', fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>Twilio trial can't ring a live number — these drive the same backend logic (card unblocks only on YES). The real voice call above works once the account is upgraded.</p>
          </div>
        </div>
      </div>

      {/* Activity logs dropdown */}
      <div className="panel" style={{ padding: 0, marginTop: 16, overflow: 'hidden' }}>
        <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '15px 18px', background: 'none', border: 'none', cursor: 'pointer', color: '#eaf2fb' }}>
          <Clock size={16} color="#7fb0e8" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Voice-call activity log</span>
          <span style={{ font: "10px 'Space Mono'", color: '#9fb6cf', border: '1px solid rgba(90,130,170,.3)', borderRadius: 6, padding: '2px 7px' }}>{logs.length}</span>
          <ChevronDown size={18} color="#8fa7c0" style={{ marginLeft: 'auto', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
        </button>
        {open && (
          <div style={{ padding: '0 18px 10px' }}>
            {logs.length === 0 && <p style={{ color: '#7f99b3', fontSize: 13, padding: '6px 0 16px' }}>No activity yet. Initiate the AI voice call to begin.</p>}
            {[...logs].reverse().map((l, i) => {
              const o = OUT[l.outcome] || OUT.info; const Icon = o.Icon;
              return (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: i ? '1px solid rgba(90,130,170,.12)' : 'none' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'grid', placeItems: 'center', background: o.bg, color: o.c }}><Icon size={15} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <strong style={{ color: '#eaf2fb', fontSize: 13 }}>{l.event}</strong>
                      <span style={{ color: '#6f87a0', font: "11px 'Space Mono'" }}>{fmtTime(l.time)}</span>
                    </div>
                    {l.detail && <p style={{ color: '#8fa7c0', fontSize: 12, margin: '3px 0 0', lineHeight: 1.5 }}>{l.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
const kick = (t: string) => <div className="section-kicker" style={{ marginBottom: 6 }}>{t}</div>;

// ---------------- Customer 360 ----------------
export function Customer360() {
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const PHONE = '+9629096218';
  const EMAIL = 'deepanrey@gmail.com';
  const maskPhone = PHONE.slice(0, 4) + ' •••• ' + PHONE.slice(-2);
  const maskEmail = EMAIL[0] + '•••••••' + EMAIL.slice(EMAIL.indexOf('@'));
  const revealBtn: React.CSSProperties = { background: 'none', border: 0, cursor: 'pointer', color: '#7f99b3', display: 'grid', placeItems: 'center', padding: 2 };

  const merchants = [['Shopee Malaysia', 46], ['Lazada', 29], ['Grab', 16], ['Apple', 9]];
  const txns: [string, string, string, string, number, string, string][] = [
    ['Today · 12:04', 'Earth Mart', 'Sydney, Australia', 'A$ 1,799.00', 82, 'Web', 'Blocked'],
    ['Today · 10:00', 'Shopee', 'Kuala Lumpur, MY', 'RM 450.00', 18, 'Web', 'Approved'],
    ['Yesterday · 19:22', 'Grab', 'Kuala Lumpur, MY', 'RM 38.00', 9, 'App', 'Approved'],
    ['Yesterday · 13:10', 'Lazada', 'Kuala Lumpur, MY', 'RM 1,290.00', 24, 'Web', 'Approved'],
    ['2 days ago · 20:40', 'Changi Duty Free', 'Singapore, SG', 'S$ 320.00', 54, 'POS', 'Step-up'],
    ['3 days ago · 08:15', 'Petronas', 'Petaling Jaya, MY', 'RM 150.00', 12, 'Card', 'Approved'],
  ];
  const decColor = (d: string) => (d === 'Blocked' ? '#f27b70' : d === 'Step-up' ? '#f2c34e' : '#69c382');
  const riskColor = (r: number) => (r > 70 ? '#f27b70' : r > 40 ? '#f2c34e' : '#69c382');
  return (
    <section className="placeholder-page">
      <div className="page-heading"><div><div className="eyebrow"><span className="pulse-small" /> RELATIONSHIP</div><h1>Customer 360</h1><p>Everything Raptorz knows and remembers about this customer.</p></div></div>

      <div className="panel" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 340px', minWidth: 280 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#265a9a', color: '#cfe5ff', font: "700 18px 'Space Mono'" }}>DP</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><h2 style={{ color: '#eaf2fb', fontSize: 20, margin: 0 }}>Deepan</h2><span style={{ font: "9px 'Space Mono'", color: '#f2c34e', border: '1px solid rgba(251,188,5,.4)', borderRadius: 6, padding: '3px 7px' }}>VIP · PRIVATE BANK</span></div>
              <div style={{ color: '#8ba3bb', fontSize: 12, marginTop: 4 }}>Customer since 2021 · Home: Kuala Lumpur, Malaysia · **** 1234</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                <div style={{ ...card, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={13} style={{ color: '#6ba9ff' }} />
                  <span style={{ font: "12px 'Space Mono'", color: '#cfe0ef', letterSpacing: .5 }}>{showPhone ? PHONE : maskPhone}</span>
                  <button style={revealBtn} onClick={() => setShowPhone((s) => !s)} title={showPhone ? 'Hide number' : 'Show number'}>{showPhone ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                </div>
                <div style={{ ...card, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={13} style={{ color: '#6ba9ff' }} />
                  <span style={{ font: "12px 'Space Mono'", color: '#cfe0ef' }}>{showEmail ? EMAIL : maskEmail}</span>
                  <button style={revealBtn} onClick={() => setShowEmail((s) => !s)} title={showEmail ? 'Hide email' : 'Show email'}>{showEmail ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ width: 330, height: 200, borderRadius: 18, padding: '18px 22px', position: 'relative', overflow: 'hidden', flex: '0 0 auto', background: 'radial-gradient(130% 130% at 100% 0%, #1c3e72 0%, #0d2142 42%, #070f1c 100%)', border: '1px solid rgba(245,181,61,.4)', boxShadow: '0 22px 48px rgba(0,0,0,.55), inset 0 0 50px rgba(47,107,255,.07)' }}>
            <div style={{ position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,181,61,.16), transparent 70%)' }} />
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ font: "800 16px 'Space Grotesk',sans-serif", letterSpacing: 1, background: 'linear-gradient(90deg,#f5b53d,#ffe6ad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RAPTORZ</div>
                <div style={{ fontSize: 8, letterSpacing: 2.5, color: '#9fb6cd', marginTop: 1 }}>BANKING EARTH</div>
              </div>
              <span style={{ font: "700 10px 'Space Mono'", color: '#1a1200', background: 'linear-gradient(135deg,#f5b53d,#e0a62e)', borderRadius: 6, padding: '4px 9px', letterSpacing: 1 }}>VIP</span>
            </div>
            <div style={{ position: 'relative', width: 42, height: 31, borderRadius: 7, marginTop: 16, background: 'linear-gradient(135deg,#f5d98a,#c9a23f)', border: '1px solid rgba(255,255,255,.25)' }} />
            <div style={{ position: 'relative', font: "600 18px 'Space Mono',monospace", color: '#eaf2fb', letterSpacing: 2, marginTop: 13 }}>5412&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;1234</div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 }}>
              <div><div style={{ fontSize: 7.5, letterSpacing: 1.5, color: '#7f99b3' }}>CARDHOLDER</div><div style={{ font: "600 13px 'Space Mono'", color: '#dce9f4', letterSpacing: 1 }}>DEEPAN</div></div>
              <div><div style={{ fontSize: 7.5, letterSpacing: 1.5, color: '#7f99b3' }}>VALID THRU</div><div style={{ font: "600 13px 'Space Mono'", color: '#dce9f4' }}>09/28</div></div>
              <div style={{ display: 'flex', alignItems: 'center' }}><div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(245,181,61,.85)' }} /><div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(47,107,255,.75)', marginLeft: -9 }} /></div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {[['Lifetime value', 'RM 1.8M'], ['Avg ticket', 'RM 620'], ['Risk profile', 'Low'], ['Tier', 'VIP · Private']].map(([k, v]) => <div key={k} style={{ ...card, padding: '10px 16px', textAlign: 'center' }}><div style={{ color: '#7f99b3', fontSize: 10 }}>{k}</div><div style={{ color: '#e1edf8', font: "700 15px 'Space Mono'" }}>{v}</div></div>)}
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
            <div style={{ ...card, padding: '10px 12px' }}><div style={{ color: '#7f99b3', fontSize: 10 }}><MapPin size={11} /> Typical geo</div><div style={{ color: '#dce9f4', fontSize: 12, marginTop: 3 }}>Kuala Lumpur · Penang · Singapore</div></div>
            <div style={{ ...card, padding: '10px 12px' }}><div style={{ color: '#7f99b3', fontSize: 10 }}>Active hours</div><div style={{ color: '#dce9f4', fontSize: 12, marginTop: 3 }}>08:00–23:00 MYT</div></div>
          </div>
        </div>

        <div className="panel" style={{ padding: 20 }}>
          {kick('RAPTORZ MEMORY')}
          <h2 style={{ color: '#e1edf8', fontSize: 14, margin: '0 0 12px' }}>Confirmed-legit</h2>
          {['Resident in Kuala Lumpur — usual card activity is local', 'Recurring electronics & grocery purchases confirmed legit', 'Occasional travel to Singapore confirmed'].map((m) => (
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
        {kick('RECENT ACTIVITY · AGENT-SCORED')}
        <h2 style={{ color: '#e1edf8', fontSize: 14, margin: '0 0 12px' }}>Last 6 transactions</h2>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 640 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr 1.5fr 1fr .55fr .9fr', gap: 10, padding: '0 0 8px', fontSize: 9.5, letterSpacing: 1, color: '#6d87a0', borderBottom: '1px solid rgba(90,130,170,.18)' }}>
              <span>TIME</span><span>MERCHANT</span><span>LOCATION</span><span>AMOUNT</span><span>RISK</span><span>DECISION</span>
            </div>
            {txns.map(([t, m, loc, amt, risk, ch, dec]) => (
              <div key={t + m} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr 1.5fr 1fr .55fr .9fr', gap: 10, alignItems: 'center', padding: '11px 0', borderTop: '1px solid rgba(90,130,170,.1)' }}>
                <span style={{ fontSize: 11, color: '#8ba3bb' }}>{t}</span>
                <span style={{ fontSize: 12, color: '#c7d7e6' }}>{m} <span style={{ color: '#6d87a0', fontSize: 10 }}>· {ch}</span></span>
                <span style={{ fontSize: 12, color: '#a9c0d6', display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={11} style={{ color: '#6ba9ff', flex: '0 0 auto' }} /> {loc}</span>
                <span style={{ font: "11px 'Space Mono'", color: '#cfe0ef' }}>{amt}</span>
                <span style={{ font: "700 11px 'Space Mono'", color: riskColor(risk) }}>{risk}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: decColor(dec) }}>{dec}</span>
              </div>
            ))}
          </div>
        </div>
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
          {kick('SAR NARRATIVE · RAPTORZ-2026-00421')}
          <h2 style={{ color: '#e1edf8', fontSize: 15, margin: '0 0 12px' }}>Suspicious Activity Report</h2>
          <div style={{ ...card, padding: 16 }}>
            <p style={{ color: '#b6cae0', fontSize: 12.5, lineHeight: 1.7, margin: 0 }}>
              On 2026-03-12, customer <b style={{ color: '#dce9f4' }}>Deepan</b> (card **** 1234) executed a $480 online purchase in <b style={{ color: '#dce9f4' }}>Sydney</b> two hours after a $250 purchase in <b style={{ color: '#dce9f4' }}>Kuala Lumpur</b>. The Sydney transaction originated from a new device and network and deviated materially from the customer's historical behaviour. Auto-approval was disabled and step-up authentication requested; no OTP verification was received and the transaction was blocked. The pattern is consistent with potential card compromise. A fraud investigation case has been opened and the relationship manager notified.
            </p>
          </div>
          <div style={{ marginTop: 16 }}>{kick('EVIDENCE CHAIN')}</div>
          {['Card used in Kuala Lumpur 10:00 (risk 18, auto-approved)', 'Same card in Sydney 12:00 — 2-hour gap', 'New device + unfamiliar network', 'Behaviour mismatch vs. 90-day baseline', 'Auto-pay disabled · OTP not received · blocked'].map((e, i) => (
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
          {[['Case ID', 'RAPTORZ-2026-00421'], ['Subject', 'Deepan'], ['Risk score', '82 / 100'], ['Priority', 'High'], ['Status', 'Draft — pending sign-off'], ['Regulator', 'FIU (auto-format)'], ['Assigned', 'Tessa (RM)']].map(([k, v]) => (
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
