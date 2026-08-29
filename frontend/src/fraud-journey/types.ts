// Data models for the AI Fraud Detection + Step-Up demo.
// Kept separate so the UI can later be wired to real risk/OTP APIs.

export type RiskLevel = 'low' | 'medium' | 'high';
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
}

export interface TransactionInfo {
  amount: number;
  merchant: string;
  channel: string;
  currentLocation: string;
  previousLocation: string;
  timeDiffSeconds: number;
  tapTime: string;
  onlineTime: string;
}

export interface RuleCheck {
  label: string;
  value: string;
}

export interface AISignal {
  label: string;
  status: string;
  level: 'high' | 'warn' | 'info';
  icon: string; // lucide icon name resolved in the component
}

export interface RiskFactor {
  label: string;
  positive: boolean;
}

export interface Scenario {
  level: RiskLevel;
  score: number;
  requiresOtp: boolean;
  headline: string;
  signals: AISignal[];
  factors: RiskFactor[];
}

export interface FraudInvestigation {
  summary: string;
  evidence: string[];
  recommendation: string;
}

export interface OTPVerification {
  channel: OtpChannel;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
}
