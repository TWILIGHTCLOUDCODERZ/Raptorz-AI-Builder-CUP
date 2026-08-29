import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertCircle, ArrowDownRight, ArrowUpRight, Bell, Bot, BrainCircuit, BriefcaseBusiness,
  Check, ChevronRight, CircleHelp, Clock3, CreditCard, Database, FileSearch, Fingerprint, Globe2,
  LayoutDashboard, LineChart, ListFilter, MapPin, Menu, Network, PanelLeftClose, Search, Shield,
  ShieldAlert, Sparkles, Target, UserRound, Users, X, Zap, Layers, LogOut, Lock, RefreshCw,
} from 'lucide-react';
import ArchitecturePage from './ArchitecturePage';
import FraudJourney from './fraud-journey/FraudJourney';
import { Customer360, ComplianceSAR, NetworkGraph } from './ConsolePages';

type Decision = 'Approved' | 'Step-up' | 'Held' | 'Blocked';
type Transaction = { id: string; time: string; customer: string; card: string; amount: number; merchant: string; city: string; country: string; channel: string; risk: number; decision: Decision; reason: string; autoPay?: boolean; otpVerified?: boolean; };
type NavItem = { label: string; icon: typeof LayoutDashboard };

const API_BASE = (import.meta.env as any).VITE_API_URL || 'https://aegis-backend-282323062361.us-central1.run.app';

type LiveStep = { agent: string; thought: string; evidence: string[]; status: string };
type LiveResult = { decision: string; confidence: number; reason_codes: string[]; rationale: string };

const AGENT_ICON: Record<string, typeof Bot> = {
  Orchestrator: Bot, 'Card Status': CreditCard, 'Step-Up Control': ShieldAlert, Investigator: Fingerprint,
  'Network Analyst': Network, Intel: Globe2, Compliance: Shield, Critic: BrainCircuit,
};

const navItems: NavItem[] = [
  { label: 'Aegis AI Intelligence', icon: LayoutDashboard }, { label: 'Investigations', icon: FileSearch },
  { label: 'Network Graph', icon: Network }, { label: 'Customer 360', icon: UserRound },
  { label: 'Compliance / SAR', icon: BriefcaseBusiness }, { label: 'Architecture', icon: Layers },
  { label: 'Customer App', icon: CreditCard },
];

const initialTransactions: Transaction[] = [
  { id: 'TX-9F24A8', time: '14:32:08', customer: 'Maya Patel', card: '4821', amount: 840, merchant: 'TechWorld', city: 'Dubai, AE', country: 'AE', channel: 'Card', risk: 28, decision: 'Approved', reason: 'Confirmed travel memory' },
  { id: 'TX-VIP-STLN', time: '14:33:20', customer: 'Eleanor Whitfield', card: '8899', amount: 15200, merchant: 'Genève Horlogerie', city: 'Geneva, CH', country: 'CH', channel: 'Card', risk: 88, decision: 'Blocked', reason: 'VIP card reported stolen' },
  { id: 'TX-VIP-MC', time: '14:33:05', customer: 'Eleanor Whitfield', card: '8891', amount: 48000, merchant: 'Maison Watches', city: 'Monaco, MC', country: 'MC', channel: 'Card', risk: 74, decision: 'Approved', reason: 'VIP travel memory' },
  { id: 'TX-TYSON-BLK', time: '12:00:00', customer: 'Tyson', card: '1234', amount: 480, merchant: 'Italy Online Store', city: 'Milan, IT', country: 'IT', channel: 'Web', risk: 82, decision: 'Blocked', reason: 'Auto-pay off · no OTP received', autoPay: true, otpVerified: false },
  { id: 'TX-TYSON-OK', time: '12:04:00', customer: 'Tyson', card: '1234', amount: 480, merchant: 'Italy Online Store', city: 'Milan, IT', country: 'IT', channel: 'Web', risk: 82, decision: 'Approved', reason: 'OTP verified', autoPay: true, otpVerified: true },
  { id: 'TX-9F24A7', time: '14:31:54', customer: 'Ethan Brooks', card: '1190', amount: 12400, merchant: 'Wire Transfer', city: 'Austin, US', country: 'US', channel: 'Wire', risk: 94, decision: 'Blocked', reason: 'New device + new payee' },
  { id: 'TX-9F24A6', time: '14:31:41', customer: 'Sofia Andersson', card: '7734', amount: 64.28, merchant: 'Nordic Market', city: 'Stockholm, SE', country: 'SE', channel: 'Card', risk: 9, decision: 'Approved', reason: 'Known pattern' },
  { id: 'TX-9F24A5', time: '14:31:26', customer: 'Marcus Lee', card: '3402', amount: 2180, merchant: 'Luxe Electronics', city: 'San Francisco, US', country: 'US', channel: 'Card', risk: 67, decision: 'Step-up', reason: 'Velocity threshold' },
  { id: 'TX-9F24A4', time: '14:31:09', customer: 'Amelia Carter', card: '6088', amount: 36.5, merchant: 'The Daily Grind', city: 'London, UK', country: 'GB', channel: 'Mobile', risk: 4, decision: 'Approved', reason: 'Biometric match' },
  { id: 'TX-9F24A3', time: '14:30:52', customer: 'Jon Bell', card: '9201', amount: 3200, merchant: 'Coinbase', city: 'Miami, US', country: 'US', channel: 'Web', risk: 81, decision: 'Held', reason: 'Unusual asset transfer' },
  { id: 'TX-9F24A2', time: '14:30:37', customer: 'Priya Shah', card: '5567', amount: 128.12, merchant: 'Air France', city: 'Paris, FR', country: 'FR', channel: 'Card', risk: 18, decision: 'Approved', reason: 'Travel profile match' },
  { id: 'TX-9F24A1', time: '14:30:11', customer: 'Noah Williams', card: '0418', amount: 920, merchant: 'Harbor Supply', city: 'Chicago, US', country: 'US', channel: 'ACH', risk: 55, decision: 'Step-up', reason: 'First-time merchant' },
];

const customers = ['Olivia Martin', 'Liam Chen', 'Maya Patel', 'Ethan Brooks', 'Sofia Andersson', 'Marcus Lee'];
const merchants = ['TechWorld', 'Blue Bottle', 'Luxe Electronics', 'Metro Rail', 'Coinbase', 'Amazon Business'];
const locations = ['Dubai, AE', 'Austin, US', 'London, UK', 'Singapore, SG', 'Toronto, CA', 'New York, US'];
const number = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: value < 100 ? 2 : 0 }).format(value);
function initialsOf(name: string) { const p = name.trim().split(/\s+/); if (p.length >= 2 && p[0] && p[1]) return (p[0][0] + p[1][0]).toUpperCase(); return (name.split('@')[0] || 'U').slice(0, 2).toUpperCase(); }

function App({ user, onSignOut }: { user: { name: string; email: string }; onSignOut: () => void }) {
  const initials = initialsOf(user.name);
  const [activeNav, setActiveNav] = useState('Aegis AI Intelligence');
  const [transactions, setTransactions] = useState(initialTransactions);
  const [selected, setSelected] = useState<Transaction>(initialTransactions[1]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [streaming, setStreaming] = useState(true);

  useEffect(() => {
    const clockTimer = window.setInterval(() => setClock(new Date()), 1000);
    const streamTimer = window.setInterval(() => {
      if (!streaming) return;
      const risk = Math.floor(Math.random() * 90) + 5;
      const decision: Decision = risk > 87 ? 'Blocked' : risk > 62 ? 'Step-up' : 'Approved';
      const transaction: Transaction = {
        id: `TX-${Math.random().toString(16).slice(2, 8).toUpperCase()}`, time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        customer: customers[Math.floor(Math.random() * customers.length)], card: String(Math.floor(1000 + Math.random() * 8999)), amount: Math.floor(24 + Math.random() * 4800),
        merchant: merchants[Math.floor(Math.random() * merchants.length)], city: locations[Math.floor(Math.random() * locations.length)], country: 'US', channel: ['Card', 'Mobile', 'ACH'][Math.floor(Math.random() * 3)], risk, decision, reason: risk > 62 ? 'Behavioral anomaly detected' : 'Baseline behavior match',
      };
      setTransactions((current) => [transaction, ...current].slice(0, 10));
    }, 4800);
    return () => { window.clearInterval(clockTimer); window.clearInterval(streamTimer); };
  }, [streaming]);

  const blocked = useMemo(() => transactions.filter((transaction) => transaction.decision === 'Blocked'), [transactions]);
  const investigated = useMemo(() => transactions.filter((transaction) => transaction.risk > 60), [transactions]);

  return (
    <div className="app-shell">
      <div className={`mobile-scrim ${sidebarOpen ? 'is-visible' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="brand"><img src="/Aegis_Logo.png" alt="Aegis" /><div><strong>AEGIS</strong><span>Autonomous Defense</span></div><button className="sidebar-close" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
        <div className="workspace-label">SECURITY OPERATIONS</div>
        <nav>{navItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => { setActiveNav(label); setSidebarOpen(false); }}><Icon size={18} /><span>{label}</span>{label === 'Investigations' && <b>{investigated.length}</b>}</button>)}</nav>
        <div className="sidebar-bottom"><button className="nav-item"><CircleHelp size={18} /><span>Help center</span></button><div className="user-card" onClick={onSignOut} title="Sign out" style={{ cursor: 'pointer' }}><div className="avatar">{initials}</div><div><strong>{user.name}</strong><span>Sign out</span></div><LogOut size={15} /></div></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{activeNav}</strong></div><div className="top-actions"><div className="search-box"><Search size={16} /><input placeholder="Search transactions, customers..." /></div><div className="live-status"><span className="live-dot" /> LIVE <span className="throughput">1,284 txns/s</span></div><span className="demo-badge">DEMO</span><button className="icon-button" onClick={() => setShowNotifications(!showNotifications)}><Bell size={18} /><i /></button><div className="top-avatar" title={user.email}>{initials}</div></div>{showNotifications && <div className="notification-pop"><div className="pop-title">Notifications <span>3 new</span></div><p><ShieldAlert size={15} /> High-risk wire transfer blocked</p><p><BrainCircuit size={15} /> Memory recall resolved false positive</p><p><Activity size={15} /> Stream health is nominal</p></div>}</header>
        <div className="page-wrap">
          {activeNav === 'Aegis AI Intelligence' ? <CommandCenter transactions={transactions} blocked={blocked} selected={selected} onSelect={setSelected} streaming={streaming} onToggle={() => setStreaming(!streaming)} /> : activeNav === 'Architecture' ? <ArchitecturePage /> : activeNav === 'Customer App' ? <FraudJourney embedded /> : activeNav === 'Customer 360' ? <Customer360 /> : activeNav === 'Compliance / SAR' ? <ComplianceSAR /> : activeNav === 'Network Graph' ? <NetworkGraph /> : <PlaceholderPage activeNav={activeNav} transactions={transactions} selected={selected} onSelect={setSelected} />}
        </div>
      </main>
    </div>
  );
}

function CommandCenter({ transactions, blocked, selected, onSelect, streaming, onToggle }: { transactions: Transaction[]; blocked: Transaction[]; selected: Transaction; onSelect: (transaction: Transaction) => void; streaming: boolean; onToggle: () => void }) {
  return <>
    <section className="page-heading"><div><div className="eyebrow"><span className="pulse-small" /> REAL-TIME OVERVIEW</div><h1>Aegis AI Intelligence</h1><p>Autonomous defense for every transaction.</p></div><div className="heading-actions"><span className="last-updated"><Clock3 size={14} /> Updated just now</span><button className={`stream-button ${streaming ? 'on' : ''}`} onClick={onToggle}><Activity size={16} /> {streaming ? 'Stream active' : 'Stream paused'}</button></div></section>
    <section className="kpi-grid"><Kpi icon={Activity} label="Transactions monitored" value="2,481,905" delta="+12.8%" positive accent="blue" /><Kpi icon={ShieldAlert} label="Fraud blocked" value={number(184290)} meta="21 incidents" accent="red" /><Kpi icon={Target} label="False declines prevented" value="68.4%" delta="+62% vs rules-only" positive accent="green" /><Kpi icon={Clock3} label="Avg. resolution time" value="18s" delta="down from 12m" positive accent="amber" /><Kpi icon={Users} label="Analyst hours saved" value="1,248h" meta="this week" accent="blue" /><Kpi icon={Shield} label="Money protected" value="$4.82M" delta="+18.6%" positive accent="green" /></section>
    <div className="dashboard-grid"><section className="panel feed-panel"><div className="panel-heading"><div><div className="section-kicker"><span className="green-dot" /> LIVE FEED</div><h2>Transaction activity</h2></div><button className="filter-button"><ListFilter size={15} /> Filter</button></div><div className="feed-table-head"><span>Transaction</span><span>Customer</span><span>Merchant</span><span>Location</span><span>Decision</span></div><div className="feed-list">{transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} onClick={() => onSelect(transaction)} />)}</div><button className="view-all">View all activity <ArrowUpRight size={15} /></button></section><aside className="panel alert-panel"><div className="panel-heading"><div><div className="section-kicker red-kicker"><span className="red-dot" /> NEEDS ATTENTION</div><h2>Alert queue <span className="count-pill">{Math.max(3, blocked.length + 2)}</span></h2></div><button className="more-button">•••</button></div><div className="alert-list">{[selected, ...blocked, transactions[3]].filter((value, index, array) => value && array.findIndex((item) => item.id === value.id) === index).slice(0, 4).map((transaction) => <button className="alert-item" key={transaction.id} onClick={() => onSelect(transaction)}><div className={`risk-score ${transaction.risk > 85 ? 'critical' : 'high'}`}>{transaction.risk}</div><div className="alert-copy"><strong>{transaction.customer}</strong><span>{transaction.id} · {transaction.city}</span></div><div className="alert-value">{number(transaction.amount)}<small>{transaction.decision}</small></div><ChevronRight size={15} /></button>)}</div><button className="view-all">Open investigation queue <ArrowUpRight size={15} /></button></aside></div>
    <div className="lower-grid"><section className="panel chart-panel"><div className="panel-heading"><div><div className="section-kicker">PERFORMANCE</div><h2>Defense activity <span className="muted-inline">/ last 24 hours</span></h2></div><div className="legend"><span><i className="legend-blue" /> Fraud caught</span><span><i className="legend-line" /> False positives</span></div></div><ActivityChart /></section><section className="panel chart-panel distribution-panel"><div className="panel-heading"><div><div className="section-kicker">DECISIONS</div><h2>Decision distribution</h2></div><span className="chart-period">Today <ChevronRight size={14} /></span></div><DecisionChart /></section></div>
    <section className="memory-strip"><div className="memory-icon"><BrainCircuit size={22} /></div><div><span className="section-kicker blue-kicker">Aegis memory active</span><p><strong>Recalled:</strong> Maya Patel confirmed Dubai travel on Mar 3. Pattern matches — customer was not re-challenged.</p></div><button onClick={() => onSelect(initialTransactions[0])}>View evidence <ArrowUpRight size={15} /></button></section>
  </>;
}

function Kpi({ icon: Icon, label, value, delta, meta, positive, accent }: { icon: typeof Activity; label: string; value: string; delta?: string; meta?: string; positive?: boolean; accent: string }) { return <div className={`kpi-card ${accent}`}><div className="kpi-top"><span className="kpi-icon"><Icon size={16} /></span><span className="kpi-label">{label}</span><ArrowUpRight size={15} className="kpi-arrow" /></div><div className="kpi-value">{value}</div><div className={`kpi-meta ${positive ? 'positive' : ''}`}>{positive && <ArrowUpRight size={13} />}{delta || meta}</div></div>; }

function TransactionRow({ transaction, onClick }: { transaction: Transaction; onClick: () => void }) { return <button className={`transaction-row ${transaction.risk > 60 ? 'suspicious' : ''}`} onClick={onClick}><div className="tx-id"><span className="channel-icon"><CreditCard size={14} /></span><div><strong>{transaction.id}</strong><span>{transaction.time}</span></div></div><div className="customer-cell"><div className="mini-avatar">{transaction.customer.split(' ').map((word) => word[0]).join('')}</div><div><strong>{transaction.customer}</strong><span>•••• {transaction.card}</span></div></div><div className="merchant-cell"><strong>{transaction.merchant}</strong><span>{transaction.channel}</span></div><div className="location-cell"><Globe2 size={14} /><span>{transaction.city}</span></div><div className="decision-cell"><span className={`decision ${transaction.decision.toLowerCase().replace('-', '')}`}>{transaction.decision}</span><span className="amount">{number(transaction.amount)}</span></div></button>; }

function ActivityChart() { return <div className="activity-chart"><div className="chart-y"><span>$120k</span><span>$80k</span><span>$40k</span><span>$0</span></div><svg viewBox="0 0 720 230" preserveAspectRatio="none" role="img" aria-label="Fraud caught and false positives chart"><defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4285f4" stopOpacity=".35" /><stop offset="100%" stopColor="#4285f4" stopOpacity="0" /></linearGradient></defs><path d="M0 188 C45 176 56 138 92 154 S148 126 183 142 S238 98 273 126 S329 82 365 110 S423 75 455 94 S500 49 540 76 S586 43 620 61 S677 28 720 42 V230 H0Z" fill="url(#areaFill)" /><path d="M0 188 C45 176 56 138 92 154 S148 126 183 142 S238 98 273 126 S329 82 365 110 S423 75 455 94 S500 49 540 76 S586 43 620 61 S677 28 720 42" fill="none" stroke="#4285F4" strokeWidth="3" /><path d="M0 211 C46 207 67 201 100 205 S157 195 190 202 S245 187 281 198 S343 183 378 190 S433 178 470 186 S528 169 558 180 S622 164 650 172 S691 160 720 165" fill="none" stroke="#FBBC05" strokeWidth="2" strokeDasharray="5 6" /><g className="chart-grid"><line x1="0" y1="54" x2="720" y2="54" /><line x1="0" y1="112" x2="720" y2="112" /><line x1="0" y1="170" x2="720" y2="170" /></g></svg><div className="chart-x"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>Now</span></div></div>; }

function DecisionChart() { return <div className="decision-chart"><div className="donut"><div><strong>2.48M</strong><span>Total</span></div></div><div className="decision-legend"><div><i className="d-green" /><span>Approved</span><strong>92.4%</strong></div><div><i className="d-amber" /><span>Step-up</span><strong>4.8%</strong></div><div><i className="d-orange" /><span>Held</span><strong>1.7%</strong></div><div><i className="d-red" /><span>Blocked</span><strong>1.1%</strong></div></div></div>; }

function PlaceholderPage({ activeNav, transactions, selected, onSelect }: { activeNav: string; transactions: Transaction[]; selected: Transaction; onSelect: (transaction: Transaction) => void }) { const isInvestigation = activeNav === 'Investigations'; return <section className="placeholder-page"><div className="page-heading"><div><div className="eyebrow"><span className="pulse-small" /> AEGIS MODULE</div><h1>{activeNav}</h1><p>{isInvestigation ? 'Multi-agent investigations, live reasoning, and human decisions.' : 'Explore intelligence across your entire defense network.'}</p></div><button className="stream-button on"><Sparkles size={16} /> AI active</button></div>{isInvestigation ? <div className="investigation-layout"><div className="case-list panel"><div className="panel-heading"><div><div className="section-kicker red-kicker">ACTIVE CASES</div><h2>Investigation queue</h2></div><span className="count-pill">{transactions.filter((t) => t.risk > 55).length}</span></div>{transactions.filter((t) => t.risk > 55).map((transaction) => <button className={`case-item ${selected.id === transaction.id ? 'selected' : ''}`} key={transaction.id} onClick={() => onSelect(transaction)}><div className={`risk-score ${transaction.risk > 85 ? 'critical' : 'high'}`}>{transaction.risk}</div><div><strong>{transaction.customer}</strong><span>{transaction.merchant} · {number(transaction.amount)}</span><small>{transaction.id}</small></div><ChevronRight size={15} /></button>)}</div><InvestigationPanel transaction={selected} /></div> : <div className="module-card panel"><div className="module-graphic"><Network size={42} /></div><h2>{activeNav} is ready</h2><p>This workspace is connected to the live defense stream. Select an alert or investigation to explore the intelligence behind each decision.</p><button className="stream-button on" onClick={() => onSelect(transactions[0])}>Open latest activity <ArrowUpRight size={16} /></button></div>}</section>; }

function InvestigationPanel({ transaction }: { transaction: Transaction }) {
  const [steps, setSteps] = useState<LiveStep[]>([]);
  const [result, setResult] = useState<LiveResult | null>(null);
  const [memory, setMemory] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const startedRef = useRef('');
  useEffect(() => {
    // Aegis auto-launches the investigation the moment a case is selected.
    if (startedRef.current === transaction.id) return;
    startedRef.current = transaction.id;
    runInvestigation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction.id]);

  async function runInvestigation() {
    setStatus('running'); setSteps([]); setResult(null); setMemory([]); setError('');
    try {
      const payload = { id: transaction.id, customer: transaction.customer, card: transaction.card, amount: transaction.amount, currency: 'USD', merchant: transaction.merchant, city: transaction.city, country: transaction.country, channel: transaction.channel, risk: transaction.risk, auto_pay: transaction.autoPay ?? false, otp_verified: transaction.otpVerified ?? null };
      const res = await fetch(`${API_BASE}/investigate/stream`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok || !res.body) throw new Error(`Backend responded ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const evt of events) {
          const evName = evt.match(/^event:\s*(.*)$/m)?.[1]?.trim();
          const dataMatch = evt.match(/^data:\s*([\s\S]*)$/m);
          if (!dataMatch) continue;
          const obj = JSON.parse(dataMatch[1]);
          if (evName === 'case') { setResult(obj.result); setMemory(obj.memory_hits || []); }
          else { setSteps((current) => [...current, obj as LiveStep]); }
        }
      }
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }

  const codes = result?.reason_codes ?? [];
  const isBlocked = result?.decision === 'Blocked';
  const nonApprove = !!result && result.decision !== 'Approved';
  const tier: 'low' | 'medium' | 'high' | 'critical' = transaction.risk <= 30 ? 'low' : transaction.risk <= 70 ? 'medium' : transaction.risk <= 90 ? 'high' : 'critical';
  const decisionClass = result ? (result.decision === 'Blocked' ? 'blocked' : result.decision === 'Step-up' ? 'stepup' : result.decision === 'Held' ? 'held' : '') : '';
  const decisionHead = result ? (result.decision === 'Approved' ? 'Approve with confidence' : result.decision === 'Blocked' ? 'Block — protect customer' : result.decision === 'Step-up' ? 'Step-up verification' : 'Hold for review') : '';
  const otpStatus = codes.includes('otp_not_received') ? 'NOT SENT' : (codes.includes('otp_verified') || codes.includes('step_up_completed')) ? 'VERIFIED' : result?.decision === 'Step-up' ? 'REQUESTED' : '—';
  const RISK_TIERS = [
    { range: '0–30', label: 'Low', action: 'Auto-approve', tone: 'low' },
    { range: '31–70', label: 'Medium', action: 'OTP verify', tone: 'medium' },
    { range: '71–90', label: 'High', action: 'Strong step-up', tone: 'high' },
    { range: '91–100', label: 'Critical', action: 'Block + case', tone: 'critical' },
  ];
  const actionItems: [string, string, boolean][] = result ? [
    ['Card Status', isBlocked ? 'BLOCKED' : 'ACTIVE', isBlocked],
    ['Auto-Pay', nonApprove ? 'DISABLED' : 'ON', nonApprove],
    ['OTP', otpStatus, otpStatus === 'NOT SENT'],
    ['Fraud Case', isBlocked ? 'CREATED' : 'NONE', isBlocked],
    ['Customer Notified', nonApprove ? 'YES' : 'NO', false],
    ['RM Notification', tier === 'high' || tier === 'critical' ? 'SENT' : 'NONE', false],
  ] : [];

  return (
    <div className="investigation-panel panel">
      <div className="investigation-top">
        <div>
          <div className="section-kicker blue-kicker"><span className="blue-dot" /> LIVE INVESTIGATION</div>
          <h2>{transaction.customer}</h2>
          <span className="case-reference">{transaction.id} · {transaction.merchant}</span>
        </div>
        <div className="risk-gauge">
          <div className={`gauge-ring gauge-${tier}`} style={{ '--risk': `${transaction.risk * 3.6}deg` } as React.CSSProperties}><strong>{transaction.risk}</strong></div>
          <span>risk score</span>
        </div>
      </div>

      <div className="risk-strip">
        {RISK_TIERS.map((t) => <div key={t.range} className={`risk-tier ${t.tone} ${tier === t.tone ? 'on' : ''}`}><span className="rt-range">{t.range}</span><span className="rt-label">{t.label}</span><span className="rt-action">{t.action}</span></div>)}
      </div>

      <div className="transaction-detail">
        <div><span>Amount</span><strong>{number(transaction.amount)}</strong></div>
        <div><span>Merchant</span><strong>{transaction.merchant}</strong></div>
        <div><span>Location</span><strong><MapPin size={14} /> {transaction.city}</strong></div>
        <div><span>Channel</span><strong>{transaction.channel}</strong></div>
      </div>

      <div className="inv-run">
        {status === 'running' || status === 'idle'
          ? <button className="blue running" disabled><span className="inv-live-dot" /> LIVE INVESTIGATION · GEMINI 3.5 LLM — RUNNING</button>
          : <button className="blue" onClick={runInvestigation}><RefreshCw size={15} /> Re-run Investigation</button>}
      </div>
      {status === 'error' && <div className="inv-error">Investigation failed: {error}. Confirm the backend is live and reachable.</div>}
      {memory.length > 0 && <div className="memory-callout"><BrainCircuit size={20} /><div><span>MEMORY RECALL</span>{memory.map((m, i) => <p key={i}>{m}</p>)}</div><Check size={18} /></div>}

      {steps.length > 0 && <div className="agent-track">
        <div className="track-head">MULTI-AGENT INVESTIGATION <span>{steps.length} agents · Gemini 3.5</span></div>
        <div className="agent-timeline">
          {steps.map((step, index) => { const Icon = AGENT_ICON[step.agent] || Bot; return (
            <div className="agent-step" key={`${step.agent}-${index}`}>
              <div className="agent-icon"><Icon size={16} /></div>
              <div className="agent-content">
                <div><strong><b className="agent-num">{index + 1}</b> {step.agent}</strong><span>done</span></div>
                <p>{step.thought}</p>
                {step.evidence && step.evidence.length > 0 && <div className="evidence-list">{step.evidence.map((e, i) => <span key={i}><Check size={10} /> {e}</span>)}</div>}
              </div>
            </div>
          ); })}
          {status === 'running' && <div className="agent-step"><div className="agent-icon working"><Bot size={16} /></div><div className="agent-content"><div><strong>Agents</strong><span className="working">analyzing…</span></div><p>Gemini 3.5 is reasoning over the evidence…</p></div></div>}
        </div>
      </div>}

      {isBlocked && <div className="block-banner"><Lock size={22} /><div><strong>CARD BLOCKED</strong><span>{tier === 'critical' ? 'No OTP sent — customer protected · fraud case opened' : 'High risk — step-up not completed'}</span></div></div>}

      {result && <div className={`decision-box ${decisionClass}`}><div><span className="section-kicker green-kicker">AEGIS DECISION</span><h3>{decisionHead}</h3><p>Reason codes: {result.reason_codes.map((c, i) => <strong key={i}>{c}{i < result.reason_codes.length - 1 ? ' · ' : ''}</strong>)}</p><p className="decision-rationale">{result.rationale}</p></div><div className="confidence">{Math.round(result.confidence * 100)}%<span>confidence</span></div></div>}

      {result && <div className="action-taken">
        <div className="at-head">ACTION TAKEN BY AEGIS</div>
        {actionItems.map(([k, v, danger]) => <div className="at-row" key={k}><Check size={13} /><span>{k}</span><b className={danger ? 'danger' : ''}>{v}</b></div>)}
      </div>}

      {result && (tier === 'high' || tier === 'critical') && <div className="rm-summary"><div className="rm-head"><Bell size={13} /> RM ALERT · AI SUMMARY FOR TESSA</div><p>{result.rationale}</p></div>}

      {status === 'done' && <div className="analyst-actions"><button className="action-primary"><Check size={16} /> Approve</button><button><ShieldAlert size={16} /> Override</button><button><ArrowUpRight size={16} /> Escalate</button><button><BrainCircuit size={16} /> Add to memory</button></div>}
    </div>
  );
}

export default App;
