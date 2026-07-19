import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { SEED_APPLICANTS, SEED_TRANSACTIONS, SEED_LOANS, SEED_AUDIT_LOGS, SHAP_EXPLANATIONS, CASH_FLOWS } from "./src/data";
import { Applicant, Transaction, Loan, AuditLog, ChatMessage } from "./src/types";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Server In-Memory State
let applicants: Applicant[] = [...SEED_APPLICANTS];
let transactions: Transaction[] = [...SEED_TRANSACTIONS];
let loans: Loan[] = [...SEED_LOANS];
let auditLogs: AuditLog[] = [...SEED_AUDIT_LOGS];

// Initialize Gemini Client safely
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Helper to generate IDs
const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

// ==========================================
// SIMULATED AUTH DATA & STORE
// ==========================================
interface SimulatedProfile {
  id: string;
  email: string;
  fullName: string;
  role: "LENDER_OFFICER" | "ADMIN";
  passwordHash: string;
}

interface LoginAttempt {
  email: string;
  timestamp: number;
}

let userProfiles: SimulatedProfile[] = [
  {
    id: "user_admin",
    email: "admin@kisan-credit.org",
    fullName: "Lakshmi Devi Admin",
    role: "ADMIN",
    passwordHash: "Password123!"
  },
  {
    id: "user_officer",
    email: "officer@kisan-credit.org",
    fullName: "officer@kisan-credit.org", // Keep as email or human name
    role: "LENDER_OFFICER",
    passwordHash: "Password123!"
  }
];

let failedLoginAttempts: LoginAttempt[] = [];
let activeSession: { user: Omit<SimulatedProfile, "passwordHash"> } | null = null;

// ==========================================
// API AUTH ENDPOINTS
// ==========================================

// Get current active session
app.get("/api/auth/session", (req, res) => {
  res.json(activeSession);
});

// User sign up endpoint
app.post("/api/auth/signup", (req, res) => {
  const { email, password, fullName, role } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email address format." });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long." });
  }

  const existing = userProfiles.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "An account with this email already exists." });
  }

  const newProfile: SimulatedProfile = {
    id: generateId("user"),
    email: email.toLowerCase(),
    fullName,
    role: role === "ADMIN" ? "ADMIN" : "LENDER_OFFICER",
    passwordHash: password
  };

  userProfiles.push(newProfile);

  // Auto sign in on sign up
  activeSession = {
    user: {
      id: newProfile.id,
      email: newProfile.email,
      fullName: newProfile.fullName,
      role: newProfile.role
    }
  };

  // Audit Log
  auditLogs.unshift({
    id: generateId("log"),
    timestamp: new Date().toISOString(),
    action: "USER_SIGNUP",
    actor: newProfile.fullName,
    details: `New account registered as ${newProfile.role}: ${newProfile.email}`,
  });

  res.status(201).json(activeSession);
});

// User login endpoint with lockout
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const emailLower = email.toLowerCase();

  // Rate limit check: 3 attempts rolling 24 hours (for visual demo, 1 minute rolling lock makes it testable!)
  // Let's implement full 24-hour logic as requested, but also support a fast testing simulation!
  // We'll calculate rolling 24 hour lockout.
  const now = Date.now();
  const rollingWindow = 24 * 60 * 60 * 1000; // 24 hours
  const cutoff = now - rollingWindow;

  // Filter and keep only attempts within rolling window
  failedLoginAttempts = failedLoginAttempts.filter(attempt => attempt.timestamp > cutoff);

  const emailFailedAttempts = failedLoginAttempts.filter(attempt => attempt.email === emailLower);

  if (emailFailedAttempts.length >= 3) {
    // Locked out! Find remaining time
    const oldestAttempt = emailFailedAttempts[0].timestamp;
    const cooldownEnd = oldestAttempt + rollingWindow;
    const remainingMs = cooldownEnd - now;

    const hours = Math.floor(remainingMs / (3600 * 1000));
    const minutes = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

    const timeStr = hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;

    return res.status(429).json({ 
      error: `You've reached the maximum of 3 login attempts today. Please try again tomorrow or reset your password.`,
      remainingSeconds: Math.ceil(remainingMs / 1000),
      timeString: timeStr
    });
  }

  // Find user
  const user = userProfiles.find(u => u.email.toLowerCase() === emailLower);

  if (!user || user.passwordHash !== password) {
    // Record failed attempt
    failedLoginAttempts.push({ email: emailLower, timestamp: now });
    const attemptsLeft = 3 - (emailFailedAttempts.length + 1);
    
    // Audit log
    auditLogs.unshift({
      id: generateId("log"),
      timestamp: new Date().toISOString(),
      action: "LOGIN_FAILED",
      actor: emailLower,
      details: `Failed login attempt. Attempts left: ${attemptsLeft}`,
    });

    return res.status(401).json({ 
      error: "Invalid email or password.",
      attemptsRemaining: attemptsLeft
    });
  }

  // Success! Clear failed attempts for this email on success
  failedLoginAttempts = failedLoginAttempts.filter(attempt => attempt.email !== emailLower);

  activeSession = {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    }
  };

  // Audit Log
  auditLogs.unshift({
    id: generateId("log"),
    timestamp: new Date().toISOString(),
    action: "USER_LOGIN",
    actor: user.fullName,
    details: `User successfully logged in with role ${user.role}`,
  });

  res.json(activeSession);
});

// User logout endpoint
app.post("/api/auth/logout", (req, res) => {
  if (activeSession) {
    auditLogs.unshift({
      id: generateId("log"),
      timestamp: new Date().toISOString(),
      action: "USER_LOGOUT",
      actor: activeSession.user.fullName,
      details: `User logged out`,
    });
  }
  activeSession = null;
  res.json({ success: true });
});

// Bypass/Reset failed attempts for simulation purposes (handy!)
app.post("/api/auth/reset-lockout", (req, res) => {
  const { email } = req.body;
  if (email) {
    failedLoginAttempts = failedLoginAttempts.filter(attempt => attempt.email !== email.toLowerCase());
  } else {
    failedLoginAttempts = [];
  }
  res.json({ success: true, message: "Login attempts cleared successfully." });
});

// Download full platform documentation
app.get("/api/download/documentation", (req, res) => {
  const docPath = path.join(process.cwd(), "DOCUMENTATION.md");
  res.download(docPath, "DOCUMENTATION.md", (err) => {
    if (err) {
      res.status(404).json({ error: "Documentation file not found." });
    }
  });
});

// ==========================================
// ADMIN CONTROL ENDPOINTS
// ==========================================

// Reset all simulation databases
app.post("/api/admin/reset-data", (req, res) => {
  applicants = [...SEED_APPLICANTS];
  transactions = [...SEED_TRANSACTIONS];
  loans = [...SEED_LOANS];
  auditLogs = [...SEED_AUDIT_LOGS];

  auditLogs.unshift({
    id: generateId("log"),
    timestamp: new Date().toISOString(),
    action: "ADMIN_SYSTEM_RESET",
    actor: activeSession?.user?.fullName || "Senior Underwriter (Admin)",
    details: "Restored all database tables (Applicants, Loans, Ledger) to original seed presets.",
  });

  res.json({ success: true, message: "System databases reset successfully." });
});

// Clear audit logs
app.post("/api/admin/clear-audit-logs", (req, res) => {
  auditLogs = [{
    id: generateId("log"),
    timestamp: new Date().toISOString(),
    action: "ADMIN_LOG_CLEAR",
    actor: activeSession?.user?.fullName || "Senior Underwriter (Admin)",
    details: "Audit logs history table cleared and re-initialized by underwriter administrator.",
  }];
  res.json({ success: true, message: "Audit logs re-initialized successfully." });
});

// Auto-Approve High Trust Loans (Batch)
app.post("/api/admin/auto-approve", (req, res) => {
  let approvedCount = 0;
  loans.forEach((loan) => {
    if (loan.status === "SUBMITTED") {
      const applicant = applicants.find((a) => a.id === loan.applicantId);
      if (applicant && applicant.trustScore >= 70) {
        loan.status = "APPROVED";
        loan.decisionDate = new Date().toISOString().split("T")[0];
        approvedCount++;

        auditLogs.unshift({
          id: generateId("log"),
          timestamp: new Date().toISOString(),
          action: "LOAN_AUTO_APPROVE",
          actor: "System Auto-Underwriter (Admin Triggered)",
          details: `Batch-approved ₹${loan.amount.toLocaleString()} loan for ${applicant.name} (Trust Score: ${applicant.trustScore})`,
        });
      }
    }
  });

  res.json({ 
    success: true, 
    message: `Batch approved ${approvedCount} loans for applicants with Trust Score ≥ 70.` 
  });
});

// Simulate a brand new rural applicant intake
app.post("/api/admin/simulate-applicant", (req, res) => {
  const seedNames = [
    { name: "Sanjay Patel", crop: "Organic Groundnut", loc: "Anantapur Rural", state: "Andhra Pradesh", avatar: "https://images.unsplash.com/photo-1500486913747-55e5470d6f40?auto=format&fit=crop&q=80&w=256&h=256" },
    { name: "Meenakshiamma", crop: "Turmeric Cultivation", loc: "Khammam Sector", state: "Telangana", avatar: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=256&h=256" },
    { name: "Baldev Singh", crop: "Sugarcane Mill Operations", loc: "Medak District", state: "Telangana", avatar: "https://images.unsplash.com/photo-1566305977877-21104093587a?auto=format&fit=crop&q=80&w=256&h=256" },
    { name: "Radha Bai", crop: "Kora Cotton Handloom", loc: "Warangal Handloom", state: "Telangana", avatar: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=256&h=256" }
  ];

  const template = seedNames[Math.floor(Math.random() * seedNames.length)];
  const newId = generateId("app");
  const trustScore = Math.floor(Math.random() * 35) + 60; // 60 to 95
  const income = Math.floor(Math.random() * 15000) + 15000; // 15000 to 30000
  const expenses = Math.floor(income * 0.45);

  const newApp: Applicant = {
    id: newId,
    name: template.name,
    businessType: template.crop,
    location: template.loc,
    state: template.state,
    phone: `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`,
    secondaryPhone: `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`,
    references: [
      { name: "Gram Panchayat Lead", relationship: "Village Elder Witness", phone: "+91 94405 88991" }
    ],
    trustScore,
    avatar: template.avatar,
    incomeMonthly: income,
    expensesMonthly: expenses,
    registrationDate: new Date().toISOString().split("T")[0],
    status: "PENDING"
  };

  applicants.push(newApp);

  // Add initial loan request for this simulated applicant
  const loanAmount = Math.floor(Math.random() * 4) * 15000 + 45000; // 45000, 60000, 75000, 90000
  const newLoan: Loan = {
    id: generateId("ln"),
    applicantId: newId,
    amount: loanAmount,
    termMonths: 12,
    status: "SUBMITTED",
    requestDate: new Date().toISOString().split("T")[0],
    interestRate: 11.5,
    monthlyRepayment: Math.round(loanAmount * 1.115 / 12),
    riskBucket: trustScore >= 80 ? "LOW" : trustScore >= 65 ? "MEDIUM" : "HIGH"
  };

  loans.push(newLoan);

  // Initialize SHAP and Cash Flow mock details
  SHAP_EXPLANATIONS[newId] = [
    { factor: "Alternate Milk Yield Consistency", impact: Math.floor(Math.random() * 15) + 5 },
    { factor: "Cooperative Dairy Society Standing", impact: Math.floor(Math.random() * 10) + 2 },
    { factor: "Gram Panchayat Character Reference", impact: Math.floor(Math.random() * 8) },
    { factor: "Repayment Term Alignment (12M)", impact: -Math.floor(Math.random() * 4) }
  ];

  CASH_FLOWS[newId] = [
    { name: "W1", income: Math.round(income / 4), expenses: Math.round(expenses / 4) },
    { name: "W2", income: Math.round(income / 4 + 1000), expenses: Math.round(expenses / 4 - 200) },
    { name: "W3", income: Math.round(income / 4 - 800), expenses: Math.round(expenses / 4 + 500) },
    { name: "W4", income: Math.round(income / 4 + 400), expenses: Math.round(expenses / 4) }
  ];

  auditLogs.unshift({
    id: generateId("log"),
    timestamp: new Date().toISOString(),
    action: "APPLICANT_SIMULATED",
    actor: "Admin Simulator",
    details: `Simulated conversational intake for ${newApp.name} (${newApp.businessType}). Added ₹${loanAmount.toLocaleString()} loan request.`,
  });

  res.status(201).json({ success: true, applicant: newApp, loan: newLoan });
});

// ==========================================
// API ENDPOINTS
// ==========================================

// Get all applicants
app.get("/api/applicants", (req, res) => {
  res.json(applicants);
});

// Update applicant details (trust score, profile, etc.)
app.patch("/api/applicants/:id", (req, res) => {
  const { id } = req.params;
  const index = applicants.findIndex((a) => a.id === id);
  if (index !== -1) {
    applicants[index] = { ...applicants[index], ...req.body };
    res.json(applicants[index]);
  } else {
    res.status(404).json({ error: "Applicant not found" });
  }
});

// Get all transactions
app.get("/api/transactions", (req, res) => {
  res.json(transactions);
});

// Add manual transaction
app.post("/api/transactions", (req, res) => {
  const newTx: Transaction = {
    id: generateId("tx"),
    applicantId: req.body.applicantId,
    date: req.body.date || new Date().toISOString().split("T")[0],
    description: req.body.description,
    type: req.body.type,
    amount: Number(req.body.amount),
    status: req.body.status || "AUTO_VERIFIED",
    confidenceScore: req.body.confidenceScore || 0.95,
    addedVia: req.body.addedVia || "MANUAL_ENTRY",
  };
  transactions.push(newTx);

  // Recalculate applicant monthly cash flows if needed
  const applicant = applicants.find((a) => a.id === newTx.applicantId);
  if (applicant) {
    if (newTx.type === "INCOME") {
      applicant.incomeMonthly += newTx.amount;
    } else {
      applicant.expensesMonthly += newTx.amount;
    }
  }

  // Log action
  auditLogs.unshift({
    id: generateId("log"),
    timestamp: new Date().toISOString(),
    action: "TRANSACTION_MANUAL_ADD",
    actor: "Underwriter / Field Officer",
    details: `Added manual ${newTx.type} transaction of ₹${newTx.amount} for applicant ${newTx.applicantId}`,
  });

  res.status(201).json(newTx);
});

// Update transaction status (e.g. verify/flag)
app.patch("/api/transactions/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const index = transactions.findIndex((t) => t.id === id);
  if (index !== -1) {
    const oldStatus = transactions[index].status;
    transactions[index].status = status;

    auditLogs.unshift({
      id: generateId("log"),
      timestamp: new Date().toISOString(),
      action: "TRANSACTION_STATUS_UPDATE",
      actor: "Underwriter Review",
      details: `Updated transaction ${id} status from ${oldStatus} to ${status}`,
    });

    res.json(transactions[index]);
  } else {
    res.status(404).json({ error: "Transaction not found" });
  }
});

// Get all loans
app.get("/api/loans", (req, res) => {
  res.json(loans);
});

// Update loan status (Approve/Reject/Request More)
app.post("/api/loans/:id/decision", (req, res) => {
  const { id } = req.params;
  const { status, interestRate, comments } = req.body;
  const loanIndex = loans.findIndex((l) => l.id === id);

  if (loanIndex !== -1) {
    const loan = loans[loanIndex];
    loan.status = status;
    loan.decisionDate = new Date().toISOString().split("T")[0];
    if (interestRate) loan.interestRate = Number(interestRate);

    // Update Applicant Status as well
    const appIndex = applicants.findIndex((a) => a.id === loan.applicantId);
    if (appIndex !== -1) {
      if (status === "APPROVED") {
        applicants[appIndex].status = "APPROVED";
      } else if (status === "REJECTED") {
        applicants[appIndex].status = "REJECTED";
      }
    }

    auditLogs.unshift({
      id: generateId("log"),
      timestamp: new Date().toISOString(),
      action: `LOAN_DECISION_${status}`,
      actor: "Underwriter Review Panel",
      details: `Loan ID ${id} decision changed to ${status}. Notes: ${comments || "None"}`,
    });

    res.json({ loan, applicant: applicants[appIndex] });
  } else {
    res.status(404).json({ error: "Loan application not found" });
  }
});

// Get all audit logs
app.get("/api/audit-logs", (req, res) => {
  res.json(auditLogs);
});

// Add audit log
app.post("/api/audit-logs", (req, res) => {
  const log: AuditLog = {
    id: generateId("log"),
    timestamp: new Date().toISOString(),
    action: req.body.action,
    actor: req.body.actor || "System",
    details: req.body.details,
  };
  auditLogs.unshift(log);
  res.status(201).json(log);
});

// Get SHAP explanations
app.get("/api/explanations/:applicantId", (req, res) => {
  const { applicantId } = req.params;
  const explanation = SHAP_EXPLANATIONS[applicantId] || [
    { factor: "Recent business onboarding", impact: 10 },
    { factor: "Peer validation checks pending", impact: -5 },
  ];
  res.json(explanation);
});

// Get weekly cash flows
app.get("/api/cashflows/:applicantId", (req, res) => {
  const { applicantId } = req.params;
  const flows = CASH_FLOWS[applicantId] || [
    { name: "Week 1", income: 3000, expenses: 1500 },
    { name: "Week 2", income: 3200, expenses: 1600 },
    { name: "Week 3", income: 2800, expenses: 1400 },
    { name: "Week 4", income: 3100, expenses: 1500 },
  ];
  res.json(flows);
});

// WhatsApp AI Parsing & Response Generation
app.post("/api/chat/parse", async (req, res) => {
  const { text, language, isVoice, duration } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text message provided." });
  }

  // Formulate fallback mock parsing (Rule-based)
  let fallbackTransactions: any[] = [];
  let aiReply = "";

  // English & Hinglish & Hindi Keyword matching for high-fidelity offline simulation
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("milk") || lowerText.includes("doodh") || lowerText.includes("दूध")) {
    // Dairy related
    let liters = 10;
    let rate = 40;
    if (lowerText.match(/(\d+)\s*(liter|litres|ltr|l|लीटर)/i)) {
      liters = parseInt(lowerText.match(/(\d+)\s*(liter|litres|ltr|l|लीटर)/i)![1]);
    }
    fallbackTransactions.push({
      description: `Sold ${liters} liters of milk`,
      type: "INCOME",
      amount: liters * rate,
      status: "AUTO_VERIFIED",
      confidenceScore: 0.94,
      addedVia: isVoice ? "WHATSAPP_VOICE" : "WHATSAPP_TEXT",
    });
    aiReply = `धन्यवाद! 👍 I have recorded your milk sale of ${liters} liters (₹${liters * rate}). Your alternative trust score has improved!`;
  } else if (lowerText.includes("feed") || lowerText.includes("chara") || lowerText.includes("चारा") || lowerText.includes("khad")) {
    let amt = 800;
    const match = lowerText.match(/(rs|rupees|rs\.|₹|\b)\s*(\d{3,5})/i);
    if (match) {
      amt = parseInt(match[2]);
    }
    fallbackTransactions.push({
      description: "Cattle feed / fodder purchase",
      type: "EXPENSE",
      amount: amt,
      status: "AUTO_VERIFIED",
      confidenceScore: 0.89,
      addedVia: isVoice ? "WHATSAPP_VOICE" : "WHATSAPP_TEXT",
    });
    aiReply = `Noted the feed expense of ₹${amt}. Your ledger shows great compliance and real-time transaction recording!`;
  } else if (lowerText.includes("kirana") || lowerText.includes("sale") || lowerText.includes("bikri") || lowerText.includes("बिक्री")) {
    let amt = 2500;
    const match = lowerText.match(/(rs|rupees|rs\.|₹|\b)\s*(\d{3,5})/i);
    if (match) {
      amt = parseInt(match[2]);
    }
    fallbackTransactions.push({
      description: "Daily Kirana counter sales",
      type: "INCOME",
      amount: amt,
      status: "AUTO_VERIFIED",
      confidenceScore: 0.92,
      addedVia: isVoice ? "WHATSAPP_VOICE" : "WHATSAPP_TEXT",
    });
    aiReply = `बढ़िया! 👍 Recorded Kirana counter sales of ₹${amt}. High daily consistency builds a strong credit score!`;
  } else if (lowerText.includes("fertilizer") || lowerText.includes("seed") || lowerText.includes("beej") || lowerText.includes("बीज")) {
    let amt = 1200;
    const match = lowerText.match(/(rs|rupees|rs\.|₹|\b)\s*(\d{3,5})/i);
    if (match) {
      amt = parseInt(match[2]);
    }
    fallbackTransactions.push({
      description: "Purchase of organic seeds / fertilizer",
      type: "EXPENSE",
      amount: amt,
      status: "AUTO_VERIFIED",
      confidenceScore: 0.95,
      addedVia: isVoice ? "WHATSAPP_VOICE" : "WHATSAPP_TEXT",
    });
    aiReply = `Recorded input purchase of ₹${amt}. Your farming cash flow remains stable. Keep logging transactions!`;
  } else if (lowerText.includes("bamboo") || lowerText.includes("basket") || lowerText.includes("tokri")) {
    let amt = 1500;
    const match = lowerText.match(/(rs|rupees|rs\.|₹|\b)\s*(\d{3,5})/i);
    if (match) {
      amt = parseInt(match[2]);
    }
    fallbackTransactions.push({
      description: "Handicrafts sales transaction",
      type: "INCOME",
      amount: amt,
      status: "AUTO_VERIFIED",
      confidenceScore: 0.91,
      addedVia: isVoice ? "WHATSAPP_VOICE" : "WHATSAPP_TEXT",
    });
    aiReply = `Great! Your basket weaving sales of ₹${amt} have been recorded. This helps prove your regular trade income.`;
  } else {
    // General parser fallback
    const match = lowerText.match(/(rs|rupees|rs\.|₹|\b)\s*(\d{3,5})/i);
    if (match) {
      const amt = parseInt(match[2]);
      const type = lowerText.includes("received") || lowerText.includes("mila") || lowerText.includes("sale") || lowerText.includes("sell") ? "INCOME" : "EXPENSE";
      fallbackTransactions.push({
        description: type === "INCOME" ? "Recorded business income" : "Recorded business operating expense",
        type: type,
        amount: amt,
        status: "PENDING",
        confidenceScore: 0.82,
        addedVia: isVoice ? "WHATSAPP_VOICE" : "WHATSAPP_TEXT",
      });
      aiReply = `I have logged a ${type.toLowerCase()} of ₹${amt}. Our underwriter will verify this shortly. Your ledger history is growing strong!`;
    } else {
      aiReply = `नमस्ते! I received your message: "${text}". Please send ledger entries like "Sold milk ₹400" or "Bought seeds for ₹120" to build your trust score!`;
    }
  }

  // Attempt real Gemini API parsing if key exists
  if (ai) {
    try {
      const systemPrompt = `You are the Kisan-Credit AI Agent processing WhatsApp messages from rural Indian women entrepreneurs.
Analyze the message text or transcripts and extract a structured array of ledger transactions.
Also, generate an empathetic, supportive, and localized response in Hinglish/Hindi or English (matching user language preference: ${language || "English"}).
For language Hinglish, write Hindi in Latin script, e.g. "Aapka sale ₹400 register ho gaya hai. Keep it up!"
For Hindi, write in Devanagari script.

You must extract items matching these properties:
- description: Concise English description of the transaction (e.g. "Sold 15L Milk", "Purchased fertilizer")
- type: "INCOME" or "EXPENSE"
- amount: Numeric value in Indian Rupees (INR)
- confidenceScore: Your confidence score from 0.0 to 1.0 based on clarity
- status: "AUTO_VERIFIED" if details are extremely clear, or "PENDING" if some details require verification.

Respond STRICTLY with a JSON object of this structure:
{
  "transactions": [
    {
      "description": "string",
      "type": "INCOME" | "EXPENSE",
      "amount": number,
      "confidenceScore": number,
      "status": "AUTO_VERIFIED" | "PENDING"
    }
  ],
  "replyText": "empatheric, localized chat reply here"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: text,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transactions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    type: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    confidenceScore: { type: Type.NUMBER },
                    status: { type: Type.STRING },
                  },
                  required: ["description", "type", "amount", "confidenceScore", "status"],
                },
              },
              replyText: { type: Type.STRING },
            },
            required: ["transactions", "replyText"],
          },
        },
      });

      const parsedResult = JSON.parse(response.text || "{}");
      if (parsedResult.replyText) {
        // Log transaction adds
        if (parsedResult.transactions && parsedResult.transactions.length > 0) {
          const formattedTxs = parsedResult.transactions.map((t: any) => ({
            ...t,
            id: generateId("tx"),
            applicantId: "app_1", // Default to Lakshmi Devi for simulation demo
            date: new Date().toISOString().split("T")[0],
            addedVia: isVoice ? "WHATSAPP_VOICE" : "WHATSAPP_TEXT",
          }));
          transactions.push(...formattedTxs);
        }

        return res.json({
          transactions: parsedResult.transactions,
          replyText: parsedResult.replyText,
          usedAI: true,
        });
      }
    } catch (e: any) {
      console.error("Gemini Parsing error, falling back to local rule-based parser:", e.message);
    }
  }

  // Return the local rule-based parsing outputs if Gemini key is missing or errored
  if (fallbackTransactions.length > 0) {
    const formattedTxs = fallbackTransactions.map((t) => ({
      ...t,
      id: generateId("tx"),
      applicantId: "app_1", // Lakshmi Devi demo
      date: new Date().toISOString().split("T")[0],
    }));
    transactions.push(...formattedTxs);
  }

  return res.json({
    transactions: fallbackTransactions,
    replyText: aiReply,
    usedAI: false,
  });
});

// ==========================================
// VITE DEV MIDDLEWARE / STATIC SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Kisan-Credit] Full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
