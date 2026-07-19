export type UserRole = "FIELD_OFFICER" | "UNDERWRITER" | "ADMIN";

export interface Reference {
  name: string;
  relationship: string;
  phone: string;
}

export interface Applicant {
  id: string;
  name: string;
  businessType: string;
  location: string;
  state: string;
  phone: string;
  secondaryPhone: string;
  references: Reference[];
  trustScore: number;
  avatar: string;
  incomeMonthly: number;
  expensesMonthly: number;
  registrationDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE_LOAN";
}

export type TransactionStatus = "PENDING" | "AUTO_VERIFIED" | "FLAGGED";

export interface Transaction {
  id: string;
  applicantId: string;
  date: string;
  description: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  status: TransactionStatus;
  confidenceScore: number; // e.g. 0.95
  addedVia: "WHATSAPP_TEXT" | "WHATSAPP_VOICE" | "MANUAL_ENTRY";
  transcriptRef?: string;
}

export type LoanStatus = "SUBMITTED" | "APPROVED" | "REJECTED" | "REQUESTED_MORE";
export type RiskBucket = "LOW" | "MEDIUM" | "HIGH";

export interface Loan {
  id: string;
  applicantId: string;
  amount: number;
  termMonths: number;
  status: LoanStatus;
  requestDate: string;
  decisionDate?: string;
  interestRate: number;
  monthlyRepayment: number;
  riskBucket: RiskBucket;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
}

export interface ChatMessage {
  id: string;
  sender: "APPLICANT" | "SYSTEM" | "AI";
  text: string;
  timestamp: string;
  isVoice?: boolean;
  duration?: string;
  transcript?: string;
  status?: "sent" | "received" | "read";
  parsedTransactions?: Omit<Transaction, "id" | "applicantId">[];
}

export interface ShapFactor {
  factor: string;
  impact: number; // positive or negative number
}
