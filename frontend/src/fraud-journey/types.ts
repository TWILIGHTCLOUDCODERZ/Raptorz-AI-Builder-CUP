// Data models for the AI Fraud Detection + Step-Up demo (Tyson scenario).
// Kept separate so the UI can later be wired to real risk/OTP APIs.

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type OtpChannel = 'mobile' | 'email';
export type Phase =
  | 'idle'
  | 'received'
  | 'rules'
  | 'ai'
  | 'score'
  | 'stepup'
  | 'otp'
  | 'approved'
  | 'blocked';

export interface Customer {
  name: string;
  cardMasked: string;
  mobileMasked: string;
  emailMasked: string;
  normalLocation: string;
}

export interface TransactionInfo {
  id: string;
  time: string;
  amount: number;
  merchant: string;
  channel: string;
  location: string;
  device: string;
  network: string;
}

export interface RuleCheck {
  label: string;
  value: string;
}

export interface AISignal {
  label: string;
  status: string;
  level: 'high' | 'warn' | 'info';
  icon: string;
}

export interface RiskFactor {
  label: string;
  positive: boolean;
}

export interface RiskBreakdownItem {
  label: string;
  points: number;
}

export interface Scenario {
  level: RiskLevel;
  score: number;
  requiresOtp: boolean;
  blocks: boolean;      // critical / stolen → hard block, OTP cannot override
  notifyRm: boolean;
  headline: string;
  reason?: string;      // e.g. card_reported_stolen
  signals: AISignal[];
  factors: RiskFactor[];
  breakdown: RiskBreakdownItem[];
}

export interface RiskMatrixRow {
  range: string;
  level: string;
  decision: string;
  cx: string;
  rm: string;
  tone: RiskLevel;
}

export interface FraudInvestigation {
  summary: string;
  evidence: string[];
  recommendation: string;
}
