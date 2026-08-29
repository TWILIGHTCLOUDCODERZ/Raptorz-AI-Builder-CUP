// Mock data for the Tyson demo. No real card numbers or contact details.
import type {
  AISignal, Customer, FraudInvestigation, RiskBreakdownItem, RiskFactor, RiskMatrixRow,
  RuleCheck, Scenario, TransactionInfo,
} from './types';

export const DEMO_OTP = '482913';
export const OTP_SECONDS = 120;

export const CUSTOMER: Customer = {
  name: 'Tyson',
  cardMasked: '**** **** **** 1234',
  mobileMasked: '+60 ******935',
  emailMasked: 't******@email.com',
  normalLocation: 'Dubai, UAE',
};

export const RM = { name: 'Tessa', role: 'Relationship Manager' };

// Transaction 1 — the benign Dubai purchase (context, auto-approved).
export const TX_DUBAI: TransactionInfo = {
  id: 'TXN-1', time: '10:00 AM', amount: 250, merchant: 'Trusted Merchant',
  channel: 'Online', location: 'Dubai, UAE', device: 'Known', network: 'Known',
};

// Transaction 2 — the anomalous Italy purchase (the one under investigation).
export const TX_ITALY: TransactionInfo = {
  id: 'TXN-2', time: '12:00 PM', amount: 480, merchant: 'Italy Online Store',
  channel: 'Online', location: 'Italy', device: 'New', network: 'New',
};

export const RULE_CHECKS: RuleCheck[] = [
  { label: 'Amount', value: 'NORMAL' },
  { label: 'Merchant', value: 'ALLOWED' },
  { label: 'Card', value: 'VALID' },
  { label: 'Country', value: 'NOT BLOCKED' },
  { label: 'Velocity', value: 'WITHIN LIMITS' },
];

const ITALY_SIGNALS: AISignal[] = [
  { label: 'Location / Geo-Velocity', status: 'DUBAI → ITALY IN 2H', level: 'high', icon: 'MapPin' },
  { label: 'Device Intelligence', status: 'NEW DEVICE', level: 'high', icon: 'Smartphone' },
  { label: 'Network Signal', status: 'NEW NETWORK', level: 'warn', icon: 'Wifi' },
  { label: 'Merchant', status: 'NEW MERCHANT', level: 'warn', icon: 'Store' },
  { label: 'Behaviour Pattern', status: 'MISMATCH', level: 'high', icon: 'Activity' },
  { label: 'Transaction History', status: 'DEVIATION', level: 'warn', icon: 'CreditCard' },
];

const ITALY_BREAKDOWN: RiskBreakdownItem[] = [
  { label: 'Location anomaly', points: 20 },
  { label: 'New device', points: 15 },
  { label: 'New network', points: 10 },
  { label: 'New merchant', points: 10 },
  { label: 'Behaviour mismatch', points: 12 },
  { label: 'Transaction deviation', points: 10 },
];

const ITALY_FACTORS: RiskFactor[] = [
  { label: 'New country (Italy vs. Dubai)', positive: false },
  { label: 'New device', positive: false },
  { label: 'New network / IP', positive: false },
  { label: 'New merchant', positive: false },
  { label: 'Behaviour mismatch', positive: false },
  { label: 'Amount within normal range', positive: true },
];

const STOLEN_SIGNALS: AISignal[] = [
  { label: 'Card Status', status: 'REPORTED STOLEN', level: 'high', icon: 'ShieldAlert' },
  { label: 'Location / Geo-Velocity', status: 'NEW COUNTRY', level: 'high', icon: 'MapPin' },
  { label: 'Device Intelligence', status: 'NEW DEVICE', level: 'high', icon: 'Smartphone' },
  { label: 'Network Signal', status: 'NEW NETWORK', level: 'high', icon: 'Wifi' },
  { label: 'Behaviour Pattern', status: 'SUSPICIOUS', level: 'high', icon: 'Activity' },
];

const STOLEN_BREAKDOWN: RiskBreakdownItem[] = [
  { label: 'Card reported stolen', points: 40 },
  { label: 'New country', points: 20 },
  { label: 'New device', points: 15 },
  { label: 'New network', points: 12 },
  { label: 'Suspicious transaction', points: 10 },
];

const STOLEN_FACTORS: RiskFactor[] = [
  { label: 'Card reported STOLEN by customer', positive: false },
  { label: 'New country', positive: false },
  { label: 'New device & network', positive: false },
  { label: 'Suspicious purchase pattern', positive: false },
];

const MEDIUM_SIGNALS: AISignal[] = [
  { label: 'Location / Geo-Velocity', status: 'ELEVATED', level: 'warn', icon: 'MapPin' },
  { label: 'Device Intelligence', status: 'RECOGNISED', level: 'info', icon: 'Smartphone' },
  { label: 'Network Signal', status: 'KNOWN', level: 'info', icon: 'Wifi' },
  { label: 'Merchant', status: 'OCCASIONAL', level: 'warn', icon: 'Store' },
  { label: 'Behaviour Pattern', status: 'SLIGHT DRIFT', level: 'warn', icon: 'Activity' },
  { label: 'Transaction History', status: 'SLIGHTLY UNUSUAL', level: 'warn', icon: 'CreditCard' },
];
const MEDIUM_BREAKDOWN: RiskBreakdownItem[] = [
  { label: 'Higher-than-usual amount', points: 20 },
  { label: 'Occasional merchant', points: 15 },
  { label: 'Slight behaviour drift', points: 13 },
  { label: 'Elevated geo distance', points: 10 },
];
const MEDIUM_FACTORS: RiskFactor[] = [
  { label: 'Higher-than-usual amount', positive: false },
  { label: 'Slight behaviour drift', positive: false },
  { label: 'Recognised device', positive: true },
  { label: 'Known network', positive: true },
];

const LOW_SIGNALS: AISignal[] = [
  { label: 'Location / Geo-Velocity', status: 'NORMAL', level: 'info', icon: 'MapPin' },
  { label: 'Device Intelligence', status: 'KNOWN DEVICE', level: 'info', icon: 'Smartphone' },
  { label: 'Network Signal', status: 'KNOWN NETWORK', level: 'info', icon: 'Wifi' },
  { label: 'Merchant', status: 'KNOWN MERCHANT', level: 'info', icon: 'Store' },
  { label: 'Behaviour Pattern', status: 'CONSISTENT', level: 'info', icon: 'Activity' },
  { label: 'Transaction History', status: 'TYPICAL', level: 'info', icon: 'CreditCard' },
];
const LOW_FACTORS: RiskFactor[] = [
  { label: 'Known device', positive: true },
  { label: 'Known location (Dubai)', positive: true },
  { label: 'Normal transaction amount', positive: true },
  { label: 'Known merchant', positive: true },
  { label: 'Normal customer behaviour', positive: true },
];

export const SCENARIOS: Record<RiskLevel, Scenario> = {
  low: {
    level: 'low', score: 18, requiresOtp: false, blocks: false, notifyRm: false,
    headline: 'TRANSACTION AUTO-APPROVED',
    signals: LOW_SIGNALS, factors: LOW_FACTORS, breakdown: [],
  },
  medium: {
    level: 'medium', score: 58, requiresOtp: true, blocks: false, notifyRm: false,
    headline: 'ADDITIONAL VERIFICATION REQUIRED',
    signals: MEDIUM_SIGNALS, factors: MEDIUM_FACTORS, breakdown: MEDIUM_BREAKDOWN,
  },
  high: {
    level: 'high', score: 82, requiresOtp: true, blocks: false, notifyRm: true,
    headline: 'ADDITIONAL VERIFICATION REQUIRED',
    signals: ITALY_SIGNALS, factors: ITALY_FACTORS, breakdown: ITALY_BREAKDOWN,
  },
  critical: {
    level: 'critical', score: 97, requiresOtp: false, blocks: true, notifyRm: true,
    reason: 'card_reported_stolen',
    headline: 'TRANSACTION BLOCKED — CARD REPORTED STOLEN',
    signals: STOLEN_SIGNALS, factors: STOLEN_FACTORS, breakdown: STOLEN_BREAKDOWN,
  },
};

export const RISK_MATRIX: RiskMatrixRow[] = [
  { range: '0–30', level: 'Low', decision: 'Auto-approve', cx: 'No OTP', rm: 'No alert', tone: 'low' },
  { range: '31–70', level: 'Medium', decision: 'OTP verification', cx: 'Mobile / Email OTP', rm: 'Optional', tone: 'medium' },
  { range: '71–90', level: 'High', decision: 'Strong step-up auth', cx: 'OTP + review', rm: 'Notify RM', tone: 'high' },
  { range: '91–100', level: 'Critical', decision: 'Block + investigation', cx: 'Transaction blocked', rm: 'Immediate RM alert', tone: 'critical' },
];

export const INVESTIGATION: FraudInvestigation = {
  summary:
    "Tyson's card was used for an online purchase in Italy two hours after an online purchase in Dubai. The transaction originated from a new device and network and differs from the customer's historical behaviour.",
  evidence: [
    'Online purchase in Dubai at 10:00 AM (risk 18 — auto-approved)',
    'Same card used in Italy at 12:00 PM — a 2-hour gap',
    'New device not previously seen on this account',
    'Unfamiliar network / IP address',
    'New merchant, outside normal purchasing pattern',
    'Interaction pattern differs from historical behaviour',
    'Amount is within a normal range on its own',
  ],
  recommendation:
    "Temporarily disable auto-approval and step-up authenticate with the customer's registered mobile or email OTP; notify RM Tessa.",
};

export const CRITICAL_INVESTIGATION: FraudInvestigation = {
  summary:
    'The card was previously reported stolen by the customer. A new-country, new-device transaction on a stolen card is treated as confirmed fraud — OTP cannot override a stolen-card status.',
  evidence: [
    'Card status: REPORTED STOLEN by the customer',
    'Transaction from a new country (Italy)',
    'New device and unfamiliar network',
    'Purchase pattern inconsistent with the customer',
    'Step-up authentication intentionally NOT offered on a stolen card',
  ],
  recommendation:
    'Block the transaction, open a fraud investigation, and raise an immediate RM alert for priority reissue.',
};

export const EXEC_SUMMARY = [
  { tag: 'DETECT', text: 'Identify suspicious activity in real time.' },
  { tag: 'VERIFY', text: 'Verify the customer instead of immediately blocking them.' },
  { tag: 'PREDICT', text: 'Identify behavioural anomalies before fraud occurs.' },
];

export const ARCHITECTURE: string[] = [
  'Customer', 'Mobile / Web / POS', 'Transaction API', 'Rule Engine', 'AI / ML Risk Engine',
  'Risk Score', 'Policy Engine', 'Step-Up Authentication', 'Mobile / Email OTP',
  'Transaction Decision', 'RM Alert', 'Fraud Investigation',
];
