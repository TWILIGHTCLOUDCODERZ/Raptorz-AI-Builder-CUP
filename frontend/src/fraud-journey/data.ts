// Mock data for the demo. No real card numbers, no real contact details.
import type {
  AISignal, Customer, FraudInvestigation, RiskFactor, RuleCheck, Scenario, TransactionInfo,
} from './types';

// Configurable simulated OTP (never shown in production-style UI; dev panel only).
export const DEMO_OTP = '482913';
export const OTP_SECONDS = 120;

export const CUSTOMER: Customer = {
  name: 'Alex Morgan',
  cardMasked: '**** **** **** 1234',
  mobileMasked: '+60 ******935',
  emailMasked: 'd******@example.com',
};

export const TRANSACTION: TransactionInfo = {
  amount: 248.5,
  merchant: 'Global Electronics',
  channel: 'Online',
  currentLocation: 'Another Country',
  previousLocation: 'Dubai',
  timeDiffSeconds: 30,
  tapTime: '09:14:00',
  onlineTime: '09:14:30',
};

export const RULE_CHECKS: RuleCheck[] = [
  { label: 'Amount', value: 'NORMAL' },
  { label: 'Merchant', value: 'TRUSTED' },
  { label: 'Card', value: 'VALID' },
  { label: 'Country', value: 'NOT BLOCKED' },
  { label: 'Velocity', value: 'NORMAL' },
];

const HIGH_SIGNALS: AISignal[] = [
  { label: 'Location / Geo-Velocity', status: 'HIGH RISK', level: 'high', icon: 'MapPin' },
  { label: 'Device Intelligence', status: 'NEW DEVICE', level: 'high', icon: 'Smartphone' },
  { label: 'Behaviour Pattern', status: 'ANOMALY DETECTED', level: 'high', icon: 'Activity' },
  { label: 'Login History', status: 'MISMATCH', level: 'warn', icon: 'UserRound' },
  { label: 'Transaction History', status: 'UNUSUAL', level: 'warn', icon: 'CreditCard' },
  { label: 'Network Signal', status: 'NEW NETWORK', level: 'warn', icon: 'Wifi' },
];

const HIGH_FACTORS: RiskFactor[] = [
  { label: 'New device', positive: false },
  { label: 'New country', positive: false },
  { label: 'Geo-velocity anomaly', positive: false },
  { label: 'Behaviour mismatch', positive: false },
  { label: 'Login anomaly', positive: false },
  { label: 'Normal transaction amount', positive: true },
  { label: 'Trusted merchant', positive: true },
];

const MEDIUM_SIGNALS: AISignal[] = [
  { label: 'Location / Geo-Velocity', status: 'ELEVATED', level: 'warn', icon: 'MapPin' },
  { label: 'Device Intelligence', status: 'RECOGNISED', level: 'info', icon: 'Smartphone' },
  { label: 'Behaviour Pattern', status: 'SLIGHT DRIFT', level: 'warn', icon: 'Activity' },
  { label: 'Login History', status: 'MATCH', level: 'info', icon: 'UserRound' },
  { label: 'Transaction History', status: 'SLIGHTLY UNUSUAL', level: 'warn', icon: 'CreditCard' },
  { label: 'Network Signal', status: 'KNOWN NETWORK', level: 'info', icon: 'Wifi' },
];

const MEDIUM_FACTORS: RiskFactor[] = [
  { label: 'Higher-than-usual amount', positive: false },
  { label: 'Slight behaviour drift', positive: false },
  { label: 'Recognised device', positive: true },
  { label: 'Known network', positive: true },
  { label: 'Trusted merchant', positive: true },
];

const LOW_SIGNALS: AISignal[] = [
  { label: 'Location / Geo-Velocity', status: 'NORMAL', level: 'info', icon: 'MapPin' },
  { label: 'Device Intelligence', status: 'TRUSTED DEVICE', level: 'info', icon: 'Smartphone' },
  { label: 'Behaviour Pattern', status: 'CONSISTENT', level: 'info', icon: 'Activity' },
  { label: 'Login History', status: 'MATCH', level: 'info', icon: 'UserRound' },
  { label: 'Transaction History', status: 'TYPICAL', level: 'info', icon: 'CreditCard' },
  { label: 'Network Signal', status: 'HOME NETWORK', level: 'info', icon: 'Wifi' },
];

const LOW_FACTORS: RiskFactor[] = [
  { label: 'Trusted device', positive: true },
  { label: 'Home network', positive: true },
  { label: 'Consistent behaviour', positive: true },
  { label: 'Normal amount', positive: true },
];

export const SCENARIOS: Record<'low' | 'medium' | 'high', Scenario> = {
  high: {
    level: 'high', score: 87, requiresOtp: true,
    headline: 'ADDITIONAL VERIFICATION REQUIRED',
    signals: HIGH_SIGNALS, factors: HIGH_FACTORS,
  },
  medium: {
    level: 'medium', score: 58, requiresOtp: true,
    headline: 'ADDITIONAL VERIFICATION REQUIRED',
    signals: MEDIUM_SIGNALS, factors: MEDIUM_FACTORS,
  },
  low: {
    level: 'low', score: 18, requiresOtp: false,
    headline: 'TRANSACTION APPROVED',
    signals: LOW_SIGNALS, factors: LOW_FACTORS,
  },
};

export const INVESTIGATION: FraudInvestigation = {
  summary:
    "The transaction was flagged because the customer's current activity differs significantly from their historical behaviour.",
  evidence: [
    'Card used in Dubai 30 seconds earlier',
    'Current transaction originated from another country',
    'New device detected',
    'Login behaviour differs from historical profile',
    'Behavioural interaction pattern differs',
    'Network is unfamiliar',
    'Transaction amount itself is normal',
    'Merchant is trusted',
  ],
  recommendation:
    "Step-up authentication using the customer's registered mobile or email.",
};

export const ARCHITECTURE: string[] = [
  'Customer',
  'Mobile / Web / POS',
  'Transaction API',
  'Rule Engine',
  'AI / ML Risk Engine',
  'Risk Score',
  'Step-Up Authentication',
  'Mobile OTP / Email OTP',
  'Transaction Decision',
  'Fraud Investigation',
];

export const EXEC_SUMMARY = [
  { tag: 'DETECT', text: 'Identify suspicious activity in real time.' },
  { tag: 'VERIFY', text: 'Verify the customer instead of immediately blocking them.' },
  { tag: 'PREDICT', text: 'Identify behavioural anomalies before fraud occurs.' },
];
