import { Applicant, Transaction, Loan, AuditLog, ShapFactor } from "./types";

export const SEED_APPLICANTS: Applicant[] = [
  {
    id: "app_1",
    name: "Lakshmi Devi",
    businessType: "Dairy & Milk Vendor",
    location: "Chittoor Rural, Andhra Pradesh",
    state: "Andhra Pradesh",
    phone: "+91 94402 12345",
    secondaryPhone: "+91 85722 54321",
    references: [
      { name: "Suresh Reddy", relationship: "Dairy Co-op President", phone: "+91 94405 99887" },
      { name: "Anitha Rao", relationship: "Self-Help Group Leader", phone: "+91 94411 22334" }
    ],
    trustScore: 82,
    avatar: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=256&h=256",
    incomeMonthly: 24500,
    expensesMonthly: 12000,
    registrationDate: "2026-02-15",
    status: "PENDING"
  },
  {
    id: "app_2",
    name: "Rajesh Kumar",
    businessType: "Kirana Shop Owner",
    location: "Samastipur, Bihar",
    state: "Bihar",
    phone: "+91 98350 98765",
    secondaryPhone: "+91 62021 11223",
    references: [
      { name: "Mahesh Prasad", relationship: "Wholesale Grocery Supplier", phone: "+91 98352 44332" },
      { name: "Ramesh Singh", relationship: "Village Mukhiya (Head)", phone: "+91 98355 66778" }
    ],
    trustScore: 68,
    avatar: "https://images.unsplash.com/photo-1566305977877-21104093587a?auto=format&fit=crop&q=80&w=256&h=256",
    incomeMonthly: 32000,
    expensesMonthly: 21000,
    registrationDate: "2026-03-10",
    status: "PENDING"
  },
  {
    id: "app_3",
    name: "Savita Patil",
    businessType: "Organic Vegetable Farming",
    location: "Satara District, Maharashtra",
    state: "Maharashtra",
    phone: "+91 94220 55667",
    secondaryPhone: "+91 21622 44556",
    references: [
      { name: "Vikas Patil", relationship: "Local Ag-Agency Partner", phone: "+91 94221 88990" },
      { name: "Sunita Deshmukh", relationship: "Neighbouring Farmer", phone: "+91 94223 77665" }
    ],
    trustScore: 78,
    avatar: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=256&h=256",
    incomeMonthly: 18500,
    expensesMonthly: 8000,
    registrationDate: "2026-01-20",
    status: "ACTIVE_LOAN"
  },
  {
    id: "app_4",
    name: "Anil Soren",
    businessType: "Bamboo Handicrafts Workshop",
    location: "Dumka, Jharkhand",
    state: "Jharkhand",
    phone: "+91 91555 44321",
    secondaryPhone: "+91 64342 99887",
    references: [
      { name: "Birsa Soren", relationship: "Artisan Co-op Organizer", phone: "+91 91556 00998" },
      { name: "Suman Murmu", relationship: "Local Merchant", phone: "+91 91558 77665" }
    ],
    trustScore: 59,
    avatar: "https://images.unsplash.com/photo-1600486913747-55e5470d6f40?auto=format&fit=crop&q=80&w=256&h=256",
    incomeMonthly: 15000,
    expensesMonthly: 9500,
    registrationDate: "2026-04-05",
    status: "PENDING"
  },
  {
    id: "app_5",
    name: "Kamla Bai",
    businessType: "Chanderi Handloom Saree Weaver",
    location: "Chanderi, Madhya Pradesh",
    state: "Madhya Pradesh",
    phone: "+91 96172 88877",
    secondaryPhone: "+91 75472 44332",
    references: [
      { name: "Gopal Chand", relationship: "Yarn Merchant", phone: "+91 96175 55443" },
      { name: "Leela Devi", relationship: "Weavers Association Lead", phone: "+91 96177 33221" }
    ],
    trustScore: 85,
    avatar: "https://images.unsplash.com/photo-1610030470298-349f7cf54286?auto=format&fit=crop&q=80&w=256&h=256",
    incomeMonthly: 21000,
    expensesMonthly: 11500,
    registrationDate: "2025-12-01",
    status: "APPROVED"
  }
];

export const SEED_TRANSACTIONS: Transaction[] = [
  // app_1 - Lakshmi Devi
  {
    id: "tx_1",
    applicantId: "app_1",
    date: "2026-07-15",
    description: "Sold 45 liters milk to Dairy Union Co-op",
    type: "INCOME",
    amount: 1800,
    status: "AUTO_VERIFIED",
    confidenceScore: 0.98,
    addedVia: "WHATSAPP_TEXT"
  },
  {
    id: "tx_2",
    applicantId: "app_1",
    date: "2026-07-14",
    description: "Bought cattle feed from Agro-Agency (Invoice #322)",
    type: "EXPENSE",
    amount: 2500,
    status: "AUTO_VERIFIED",
    confidenceScore: 0.94,
    addedVia: "WHATSAPP_VOICE",
    transcriptRef: "Voice note: Cattle feed stock worth ₹2,500 purchased today."
  },
  {
    id: "tx_3",
    applicantId: "app_1",
    date: "2026-07-12",
    description: "Received payment from local sweet shop",
    type: "INCOME",
    amount: 4200,
    status: "AUTO_VERIFIED",
    confidenceScore: 0.97,
    addedVia: "WHATSAPP_TEXT"
  },
  {
    id: "tx_4",
    applicantId: "app_1",
    date: "2026-07-10",
    description: "Sold milk to residential block A",
    type: "INCOME",
    amount: 1200,
    status: "AUTO_VERIFIED",
    confidenceScore: 0.92,
    addedVia: "WHATSAPP_TEXT"
  },
  {
    id: "tx_5",
    applicantId: "app_1",
    date: "2026-07-08",
    description: "Veterinary doctor visit & medicines",
    type: "EXPENSE",
    amount: 800,
    status: "PENDING",
    confidenceScore: 0.85,
    addedVia: "WHATSAPP_VOICE",
    transcriptRef: "Voice note: Paid Doctor Sunil ₹800 for cow health check and medicine booster."
  },
  {
    id: "tx_6",
    applicantId: "app_1",
    date: "2026-07-05",
    description: "Weekly savings group contribution",
    type: "EXPENSE",
    amount: 500,
    status: "AUTO_VERIFIED",
    confidenceScore: 0.99,
    addedVia: "WHATSAPP_TEXT"
  },

  // app_2 - Rajesh Kumar
  {
    id: "tx_7",
    applicantId: "app_2",
    date: "2026-07-16",
    description: "Daily Kirana counter sales",
    type: "INCOME",
    amount: 3800,
    status: "AUTO_VERIFIED",
    confidenceScore: 0.91,
    addedVia: "WHATSAPP_TEXT"
  },
  {
    id: "tx_8",
    applicantId: "app_2",
    date: "2026-07-15",
    description: "Bought wholesale spices & pulses",
    type: "EXPENSE",
    amount: 4500,
    status: "AUTO_VERIFIED",
    confidenceScore: 0.96,
    addedVia: "WHATSAPP_TEXT"
  },
  {
    id: "tx_9",
    applicantId: "app_2",
    date: "2026-07-13",
    description: "Received refund from supplier",
    type: "INCOME",
    amount: 1500,
    status: "FLAGGED",
    confidenceScore: 0.65,
    addedVia: "WHATSAPP_VOICE",
    transcriptRef: "Voice note: Supplier returned 1500 rupees cash for damaged grain sacks."
  },
  {
    id: "tx_10",
    applicantId: "app_2",
    date: "2026-07-11",
    description: "Paid electricity bill for Kirana freezer",
    type: "EXPENSE",
    amount: 1200,
    status: "AUTO_VERIFIED",
    confidenceScore: 0.95,
    addedVia: "MANUAL_ENTRY"
  },
  {
    id: "tx_11",
    applicantId: "app_2",
    date: "2026-07-09",
    description: "Daily Kirana counter sales",
    type: "INCOME",
    amount: 4100,
    status: "AUTO_VERIFIED",
    confidenceScore: 0.93,
    addedVia: "WHATSAPP_TEXT"
  },

  // app_4 - Anil Soren
  {
    id: "tx_12",
    applicantId: "app_4",
    date: "2026-07-14",
    description: "Bulk sale of 25 bamboo fruit baskets",
    type: "INCOME",
    amount: 2500,
    status: "AUTO_VERIFIED",
    confidenceScore: 0.90,
    addedVia: "WHATSAPP_TEXT"
  },
  {
    id: "tx_13",
    applicantId: "app_4",
    date: "2026-07-12",
    description: "Purchased raw thick bamboo stems (100 units)",
    type: "EXPENSE",
    amount: 5000,
    status: "FLAGGED",
    confidenceScore: 0.55,
    addedVia: "WHATSAPP_VOICE",
    transcriptRef: "Voice note: Bamboo logs purchased from Forest Depot for five thousand rupees. No paper bill given."
  },
  {
    id: "tx_14",
    applicantId: "app_4",
    date: "2026-07-08",
    description: "Local weekly market counter sales",
    type: "INCOME",
    amount: 1800,
    status: "PENDING",
    confidenceScore: 0.78,
    addedVia: "WHATSAPP_TEXT"
  }
];

export const SEED_LOANS: Loan[] = [
  {
    id: "loan_1",
    applicantId: "app_1",
    amount: 50000,
    termMonths: 12,
    status: "SUBMITTED",
    requestDate: "2026-07-12",
    interestRate: 11.5,
    monthlyRepayment: 4430,
    riskBucket: "LOW"
  },
  {
    id: "loan_2",
    applicantId: "app_2",
    amount: 35000,
    termMonths: 9,
    status: "SUBMITTED",
    requestDate: "2026-07-14",
    interestRate: 13.0,
    monthlyRepayment: 4100,
    riskBucket: "MEDIUM"
  },
  {
    id: "loan_3",
    applicantId: "app_3",
    amount: 40000,
    termMonths: 12,
    status: "APPROVED",
    requestDate: "2026-01-22",
    decisionDate: "2026-01-25",
    interestRate: 12.0,
    monthlyRepayment: 3550,
    riskBucket: "LOW"
  },
  {
    id: "loan_4",
    applicantId: "app_4",
    amount: 20000,
    termMonths: 6,
    status: "SUBMITTED",
    requestDate: "2026-07-15",
    interestRate: 14.5,
    monthlyRepayment: 3480,
    riskBucket: "HIGH"
  },
  {
    id: "loan_5",
    applicantId: "app_5",
    amount: 60000,
    termMonths: 12,
    status: "APPROVED",
    requestDate: "2026-04-10",
    decisionDate: "2026-04-12",
    interestRate: 11.0,
    monthlyRepayment: 5300,
    riskBucket: "LOW"
  }
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log_1",
    timestamp: "2026-07-15T10:30:22Z",
    action: "LOAN_DECISION_APPROVED",
    actor: "Underwriter (underwriter1@kisan.org)",
    details: "Approved Chanderi Loom loan of ₹60,000 for Kamla Bai. High credit rating & active co-op references."
  },
  {
    id: "log_2",
    timestamp: "2026-07-14T14:15:00Z",
    action: "TRANSACTION_VERIFICATION_AUTO",
    actor: "Kisan-Credit AI Engine",
    details: "Auto-verified transaction tx_1: Sold milk 45L. Text matching confidence: 98%."
  },
  {
    id: "log_3",
    timestamp: "2026-07-13T09:44:11Z",
    action: "USER_LOGIN_SUCCESS",
    actor: "Field Officer (field_officer_south@kisan.org)",
    details: "Logged into Chittoor field branch via mobile client."
  },
  {
    id: "log_4",
    timestamp: "2026-07-12T16:20:00Z",
    action: "LOAN_APPLICATION_SUBMITTED",
    actor: "System (via WhatsApp Flow)",
    details: "New loan request for ₹50,000 submitted on behalf of Lakshmi Devi. Initial computed trust score: 82."
  }
];

export const SHAP_EXPLANATIONS: Record<string, ShapFactor[]> = {
  app_1: [
    { factor: "Weekly Dairy Ledger Consistency", impact: 42 },
    { factor: "Cooperative Milk Sales Volume", impact: 25 },
    { factor: "Local Self-Help Group Validation", impact: 15 },
    { factor: "Family Cattle Livestock Value", impact: 10 },
    { factor: "Sparse Formal Banking History", impact: -8 },
    { factor: "Inflation Adjustment on Cattle Feed", impact: -2 }
  ],
  app_2: [
    { factor: "Counter Ledger Transaction Frequency", impact: 28 },
    { factor: "Supplier Trade Line Tenure", impact: 15 },
    { factor: "Mukhiya Peer Endorsement", impact: 12 },
    { factor: "Recent Samastipur Flood Crop Dips", impact: -18 },
    { factor: "High Wholesale Supplier Debt", impact: -12 },
    { factor: "Sparse Digital Wallet Adoption", impact: -7 }
  ],
  app_3: [
    { factor: "Seasonal Agricultural Yield", impact: 35 },
    { factor: "Drip Irrigation Asset Value", impact: 22 },
    { factor: "Active Repayment of SHG microloan", impact: 20 },
    { factor: "Rainfall Volatility Index", impact: -11 },
    { factor: "Distance to Regional Sabzi Mandi", impact: -5 }
  ],
  app_4: [
    { factor: "Artisan Guild Membership Tenure", impact: 18 },
    { factor: "Cash Book Frequency", impact: 12 },
    { factor: "Reference Check: Birsa Soren", impact: 10 },
    { factor: "No formal tax registration (GST)", impact: -15 },
    { factor: "Forest Depot Sourcing Fluctuations", impact: -12 },
    { factor: "Sparse Transaction Receipts (Cash-heavy)", impact: -14 }
  ],
  app_5: [
    { factor: "Excellent Self-Help Group Standing", impact: 45 },
    { factor: "Loom asset equity documentation", impact: 28 },
    { factor: "Regular textile sales ledger entries", impact: 18 },
    { factor: "Under-insured Handloom inventory", impact: -5 },
    { factor: "Weaving material supply bottlenecks", impact: -1 }
  ]
};

export const CASH_FLOWS: Record<string, { name: string; income: number; expenses: number }[]> = {
  app_1: [
    { name: "Week 1", income: 6200, expenses: 3100 },
    { name: "Week 2", income: 5800, expenses: 2900 },
    { name: "Week 3", income: 6400, expenses: 3200 },
    { name: "Week 4", income: 6100, expenses: 2800 }
  ],
  app_2: [
    { name: "Week 1", income: 8200, expenses: 5400 },
    { name: "Week 2", income: 7900, expenses: 5100 },
    { name: "Week 3", income: 8500, expenses: 6200 },
    { name: "Week 4", income: 7400, expenses: 4300 }
  ],
  app_3: [
    { name: "Week 1", income: 4500, expenses: 2000 },
    { name: "Week 2", income: 4800, expenses: 1800 },
    { name: "Week 3", income: 4600, expenses: 2100 },
    { name: "Week 4", income: 4600, expenses: 2100 }
  ],
  app_4: [
    { name: "Week 1", income: 3800, expenses: 2200 },
    { name: "Week 2", income: 3500, expenses: 2500 },
    { name: "Week 3", income: 3900, expenses: 2100 },
    { name: "Week 4", income: 3800, expenses: 2700 }
  ],
  app_5: [
    { name: "Week 1", income: 5100, expenses: 2800 },
    { name: "Week 2", income: 5300, expenses: 2900 },
    { name: "Week 3", income: 5200, expenses: 3000 },
    { name: "Week 4", income: 5400, expenses: 2800 }
  ]
};
