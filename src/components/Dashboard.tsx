import { useState, useEffect } from "react";
import { 
  Users, Search, Filter, CheckCircle, AlertTriangle, Clock, Landmark, 
  BarChart2, ShieldAlert, ArrowUpRight, ArrowDownRight, ClipboardList,
  ChevronRight, ThumbsUp, ThumbsDown, Info, Shield, Check, X, RefreshCw, FileText, Download
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { Applicant, Transaction, Loan, AuditLog, ShapFactor } from "../types";
import D3RegionalRisk from "./D3RegionalRisk";
import AdminBlock from "./AdminBlock";
import LoanCalculator from "./LoanCalculator";
import { showToast } from "../utils/toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "./ui/AlertDialog";

interface DashboardProps {
  currentUser: {
    id: string;
    email: string;
    fullName: string;
    role: "LENDER_OFFICER" | "ADMIN";
  };
  onLogout: () => void;
  onBack: () => void;
}

export default function Dashboard({ currentUser, onLogout, onBack }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"applicants" | "queue" | "portfolio" | "analytics" | "calculator" | "admin" | "audit">("applicants");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Filtering and Searching State
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("ALL");
  const [scoreFilter, setScoreFilter] = useState("ALL");

  // Selected Applicant State for Detail Panel
  const [selectedAppId, setSelectedAppId] = useState<string | null>("app_1");
  const [shapFactors, setShapFactors] = useState<ShapFactor[]>([]);
  const [cashflows, setCashflows] = useState<any[]>([]);

  // Loan decision form state
  const [decisionAmount, setDecisionAmount] = useState<number>(50000);
  const [decisionTerm, setDecisionTerm] = useState<number>(12);
  const [decisionRate, setDecisionRate] = useState<number>(11.5);
  const [decisionComments, setDecisionComments] = useState("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Confirmation Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    actionText: string;
    actionClass: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirmation = (config: {
    title: string;
    description: string;
    actionText: string;
    actionClass: string;
    onConfirm: () => void;
  }) => {
    setConfirmConfig(config);
    setConfirmOpen(true);
  };

  // Fetch data from local Express APIs
  const fetchData = async () => {
    try {
      const [resApps, resTxs, resLoans, resLogs] = await Promise.all([
        fetch("/api/applicants"),
        fetch("/api/transactions"),
        fetch("/api/loans"),
        fetch("/api/audit-logs")
      ]);

      const [apps, txs, lns, logs] = await Promise.all([
        resApps.json(),
        resTxs.json(),
        resLoans.json(),
        resLogs.json()
      ]);

      setApplicants(apps);
      setTransactions(txs);
      setLoans(lns);
      setAuditLogs(logs);
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch selected applicant SHAP and Cashflows
  useEffect(() => {
    if (selectedAppId) {
      fetch(`/api/explanations/${selectedAppId}`).then(res => res.json()).then(data => setShapFactors(data));
      fetch(`/api/cashflows/${selectedAppId}`).then(res => res.json()).then(data => setCashflows(data));
      
      const appLoan = loans.find(l => l.applicantId === selectedAppId && l.status === "SUBMITTED");
      if (appLoan) {
        setDecisionAmount(appLoan.amount);
        setDecisionTerm(appLoan.termMonths);
        setDecisionRate(appLoan.interestRate);
      }
    }
  }, [selectedAppId, loans]);

  // Handle single transaction status action (Auto verify or flag)
  const handleUpdateTxStatus = async (txId: string, status: "AUTO_VERIFIED" | "FLAGGED") => {
    try {
      const res = await fetch(`/api/transactions/${txId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(
          status === "AUTO_VERIFIED" 
            ? "✅ Transaction verified successfully and added to applicant's credit ledger." 
            : "⚠️ Transaction flagged for physical verification and audit review.",
          status === "AUTO_VERIFIED" ? "success" : "warning"
        );
        fetchData();
      } else {
        showToast("Failed to update transaction status.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Network error occurred while updating transaction status.", "error");
    }
  };

  // Handle Loan Application decision trigger
  const handleLoanDecision = async (loanId: string, status: "APPROVED" | "REJECTED" | "REQUESTED_MORE") => {
    setIsSubmittingDecision(true);
    try {
      const res = await fetch(`/api/loans/${loanId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          interestRate: decisionRate,
          comments: decisionComments
        })
      });

      if (res.ok) {
        setDecisionComments("");
        if (status === "APPROVED") {
          showToast("🎉 Loan approved! Capital scheduled for immediate electronic co-op disbursement.", "success");
        } else if (status === "REJECTED") {
          showToast("🛑 Loan application declined. System notified borrower channel with notes.", "info");
        } else if (status === "REQUESTED_MORE") {
          showToast("✉️ Loan deferred. Additional character/yield documentation requested.", "info");
        }
        fetchData();
      } else {
        showToast("Failed to record loan decision.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Network error occurred while recording loan decision.", "error");
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleExportApplicantsCSV = () => {
    if (filteredApplicants.length === 0) {
      showToast("No applicant data available in the current view to export.", "warning");
      return;
    }

    const headers = [
      "ID",
      "Name",
      "Business Type",
      "Location",
      "State",
      "Phone",
      "Secondary Phone",
      "Trust Score",
      "Monthly Income (INR)",
      "Monthly Expenses (INR)",
      "Registration Date",
      "Status"
    ];

    const csvRows = [headers.join(",")];

    filteredApplicants.forEach((app) => {
      const row = [
        `"${app.id}"`,
        `"${app.name.replace(/"/g, '""')}"`,
        `"${app.businessType.replace(/"/g, '""')}"`,
        `"${app.location.replace(/"/g, '""')}"`,
        `"${app.state.replace(/"/g, '""')}"`,
        `"${app.phone}"`,
        `"${app.secondaryPhone || ""}"`,
        app.trustScore,
        app.incomeMonthly,
        app.expensesMonthly,
        `"${app.registrationDate}"`,
        `"${app.status}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const filterInfo = `_Search_${searchTerm ? searchTerm.trim().replace(/\s+/g, '_') : 'All'}_State_${stateFilter}_Score_${scoreFilter}`;
    const filename = `Kisan_Credit_Applicants_${filterInfo}_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`📊 Current view of ${filteredApplicants.length} applicants exported successfully as "${filename}".`, "success");
  };

  // Processing metrics for aggregate KPIs
  const totalDisbursed = loans
    .filter(l => l.status === "APPROVED")
    .reduce((sum, l) => sum + l.amount, 0);

  const averageScore = applicants.length 
    ? Math.round(applicants.reduce((sum, a) => sum + a.trustScore, 0) / applicants.length)
    : 0;

  const totalPendingLoansCount = loans.filter(l => l.status === "SUBMITTED").length;
  const flaggedTransactionsCount = transactions.filter(t => t.status === "FLAGGED").length;

  const selectedApp = applicants.find(a => a.id === selectedAppId);
  const selectedAppTransactions = transactions.filter(t => t.applicantId === selectedAppId);
  const selectedAppActiveLoan = loans.find(l => l.applicantId === selectedAppId && l.status === "SUBMITTED");

  // Filtering candidates
  const filteredApplicants = applicants.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.businessType.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = stateFilter === "ALL" || a.state === stateFilter;
    
    const matchesScore = scoreFilter === "ALL" || 
      (scoreFilter === "HIGH" && a.trustScore >= 80) || 
      (scoreFilter === "MEDIUM" && a.trustScore >= 60 && a.trustScore < 80) ||
      (scoreFilter === "LOW" && a.trustScore < 60);

    return matchesSearch && matchesState && matchesScore;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      
      {/* Upper Navigation Bar */}
      <header className="bg-slate-950 border-b border-slate-850 h-16 px-6 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-display font-bold text-base">
            KC
          </div>
          <div>
            <h1 className="font-display font-bold text-md text-white tracking-tight leading-none">Kisan-Credit Lender</h1>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Cooperative Risk &amp; Underwriting Dashboard</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            {(["applicants", "queue", "portfolio", "analytics", "calculator", "admin", "audit"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-medium uppercase tracking-wider transition-all ${
                  activeTab === tab 
                    ? tab === "admin"
                      ? "bg-amber-600 text-white shadow-sm font-bold"
                      : "bg-emerald-600 text-white shadow-sm"
                    : tab === "admin"
                      ? "text-amber-400 hover:text-amber-300 hover:bg-slate-850"
                      : "text-slate-400 hover:text-white hover:bg-slate-850"
                }`}
              >
                {tab === "applicants" 
                  ? "Applicants" 
                  : tab === "queue" 
                    ? `Review Queue (${flaggedTransactionsCount})` 
                    : tab === "portfolio" 
                      ? "Portfolio" 
                      : tab === "analytics"
                        ? "D3 Analytics"
                        : tab === "calculator"
                          ? "Calculator"
                          : tab === "admin"
                            ? "Admin Override"
                            : "Audit Trails"}
              </button>
            ))}
          </div>

          {/* User Session Profile Badge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl">
            <div className={`w-2 h-2 rounded-full ${currentUser.role === "ADMIN" ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
            <div className="text-left leading-none">
              <span className="text-[10px] text-white font-bold block">{currentUser.fullName}</span>
              <span className="text-[8px] text-slate-400 font-mono block mt-0.5">{currentUser.role}</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="text-xs bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30 px-3 py-1.5 rounded-lg font-medium transition-all"
          >
            Logout
          </button>

          <a
            href="/api/download/documentation"
            download="DOCUMENTATION.md"
            className="text-xs bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-slate-800 px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Docs
          </a>

          <button 
            onClick={onBack}
            className="text-xs bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg font-medium transition-all"
          >
            Leave Panel
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        
        {/* Aggregate KPIs Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-1">Active Disbursements</span>
              <span className="text-xl font-display font-extrabold text-white">₹{(totalDisbursed).toLocaleString()}</span>
              <span className="text-[9px] text-emerald-400 block mt-1">✓ 100% Repaid this cycle</span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Landmark className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-1">Average Trust Rating</span>
              <span className="text-xl font-display font-extrabold text-white">{averageScore} / 100</span>
              <span className="text-[9px] text-teal-400 block mt-1">✓ Alternative SHAP audited</span>
            </div>
            <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-1">Submitted Loan Requests</span>
              <span className="text-xl font-display font-extrabold text-amber-400">{totalPendingLoansCount} Applications</span>
              <span className="text-[9px] text-slate-400 block mt-1">Awaiting credit decision</span>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-1">Irregular Ledger Flags</span>
              <span className="text-xl font-display font-extrabold text-rose-400">{flaggedTransactionsCount} Triggers</span>
              <span className="text-[9px] text-rose-400 block mt-1">Require physical verification</span>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Dynamic Views Switcher */}
        {activeTab === "applicants" && (
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Col: Applicant Finder (5 cols) */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                <h3 className="font-display font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-500" />
                  Rural Applicant Directory
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleExportApplicantsCSV}
                    className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all border border-slate-800 flex items-center gap-1 px-2 text-xs font-semibold"
                    title="Export Current Directory View to CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>
                  <button 
                    onClick={fetchData}
                    className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all border border-slate-800"
                    title="Reload data"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name, ID, location, crop..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* State Filter */}
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">State Region</label>
                    <select
                      value={stateFilter}
                      onChange={(e) => setStateFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 outline-none"
                    >
                      <option value="ALL">All States</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Bihar">Bihar</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Jharkhand">Jharkhand</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                    </select>
                  </div>

                  {/* Score band Filter */}
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Score Band</label>
                    <select
                      value={scoreFilter}
                      onChange={(e) => setScoreFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 outline-none"
                    >
                      <option value="ALL">All Bands</option>
                      <option value="HIGH">High (80+)</option>
                      <option value="MEDIUM">Medium (60-79)</option>
                      <option value="LOW">Low (&lt;60)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Applicants List Grid */}
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {filteredApplicants.length > 0 ? (
                  filteredApplicants.map((app) => {
                    const scoreColor = app.trustScore >= 80 
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : app.trustScore >= 60 
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : "text-rose-400 bg-rose-500/10 border-rose-500/20";

                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedAppId(app.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          selectedAppId === app.id
                            ? "bg-slate-900 border-emerald-600 shadow-md shadow-emerald-900/10"
                            : "bg-slate-900/50 hover:bg-slate-900 border-slate-850 hover:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={app.avatar}
                            alt={app.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-800"
                          />
                          <div className="space-y-0.5">
                            <h4 className="font-semibold text-xs text-white">{app.name}</h4>
                            <span className="text-[10px] text-slate-400 block font-medium">{app.businessType}</span>
                            <span className="text-[9px] text-slate-500 block">{app.location}</span>
                          </div>
                        </div>

                        <div className="text-right space-y-1.5">
                          <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono tracking-wider ${scoreColor}`}>
                            TS {app.trustScore}
                          </div>
                          <span className={`text-[9px] uppercase font-mono tracking-widest font-bold block ${
                            app.status === "PENDING" ? "text-amber-400" : app.status === "APPROVED" || app.status === "ACTIVE_LOAN" ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-slate-900/20 rounded-xl border border-dashed border-slate-850 text-slate-500 text-xs">
                    No matching rural applicants found.
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Applicant Deep Dive & Underwriter Actions (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {selectedApp ? (
                <>
                  {/* Selected Profile Card */}
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-850">
                      <div className="flex items-center gap-4">
                        <img
                          src={selectedApp.avatar}
                          alt={selectedApp.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-display font-bold text-lg text-white">{selectedApp.name}</h2>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] uppercase tracking-wider font-bold">
                              {selectedApp.businessType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{selectedApp.location}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">Ph: {selectedApp.phone} | Secondary: {selectedApp.secondaryPhone}</p>
                        </div>
                      </div>

                      {/* Visual Trust score gauge */}
                      <div className="text-center bg-slate-900 border border-slate-850 px-5 py-3 rounded-2xl min-w-[130px] flex flex-col justify-center">
                        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono">Trust Gauge</span>
                        <span className="text-4xl font-display font-extrabold text-emerald-400 mt-1">{selectedApp.trustScore}</span>
                        <div className="h-1 bg-slate-800 w-full rounded-full overflow-hidden mt-1.5">
                          <div className="h-full bg-emerald-500" style={{ width: `${selectedApp.trustScore}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Quick profile metadata block */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Estimated Monthly Income</span>
                        <span className="font-bold text-emerald-400 text-sm">₹{selectedApp.incomeMonthly.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Estimated Monthly Expenses</span>
                        <span className="font-bold text-slate-300 text-sm">₹{selectedApp.expensesMonthly.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Trust Registration Date</span>
                        <span className="font-bold text-slate-300 text-sm">{selectedApp.registrationDate}</span>
                      </div>
                    </div>

                    {/* References Subgrid */}
                    <div className="mt-5 p-3.5 bg-slate-900/60 rounded-xl border border-slate-850 space-y-2">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Verified Co-op &amp; Peer References</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedApp.references.map((ref, idx) => (
                          <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                            <span className="font-semibold block text-slate-300">{ref.name}</span>
                            <span className="text-[10px] text-slate-500 block">{ref.relationship}</span>
                            <span className="text-[10px] text-emerald-400 font-mono block mt-1">✓ Verified • {ref.phone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cash Flow & SHAP Analysis Tabs */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Recharts Cashflow Card */}
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col h-[280px]">
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-3 font-mono">Verified Weekly Cash Flow (INR)</span>
                      <div className="flex-1 w-full text-xs">
                        {cashflows.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cashflows} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                              <Legend wrapperStyle={{ fontSize: 10 }} />
                              <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
                              <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-500">Loading charts...</div>
                        )}
                      </div>
                    </div>

                    {/* SHAP Explainability Panel */}
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-3 font-mono flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-teal-400" />
                          SHAP Model Contributions
                        </span>
                        
                        <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                          {shapFactors.map((factor, idx) => {
                            const isPositive = factor.impact >= 0;
                            const barWidth = Math.min(Math.abs(factor.impact) * 1.5, 100);

                            return (
                              <div key={idx} className="text-[11px] space-y-1">
                                <div className="flex justify-between font-medium">
                                  <span className="text-slate-300 truncate max-w-[200px]">{factor.factor}</span>
                                  <span className={isPositive ? "text-emerald-400" : "text-rose-400"}>
                                    {isPositive ? `+${factor.impact}` : factor.impact}
                                  </span>
                                </div>
                                <div className="h-1.5 bg-slate-900 rounded-full flex overflow-hidden">
                                  {isPositive ? (
                                    <div 
                                      className="bg-emerald-500 rounded-full h-full"
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  ) : (
                                    <div 
                                      className="bg-rose-500 rounded-full h-full"
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-500 leading-tight pt-2 border-t border-slate-850">
                        * SHAP (Shapley Additive exPlanations) values outline positive and negative drivers relative to the baseline state.
                      </div>
                    </div>
                  </div>

                  {/* Transactions Ledger Panel */}
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono">Applicant Transactions Ledger</span>
                      <span className="text-[9px] text-slate-400">Total logged: {selectedAppTransactions.length}</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-850 text-slate-500 uppercase font-mono text-[9px] font-bold">
                            <th className="pb-2">Date</th>
                            <th className="pb-2">Description</th>
                            <th className="pb-2 text-right">Amount</th>
                            <th className="pb-2">Source</th>
                            <th className="pb-2">Verification Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850/60 text-slate-300">
                          {selectedAppTransactions.length > 0 ? (
                            selectedAppTransactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-900/50">
                                <td className="py-2.5 font-mono text-[10px]">{tx.date}</td>
                                <td className="py-2.5">
                                  <div className="font-semibold text-white">{tx.description}</div>
                                  {tx.transcriptRef && (
                                    <span className="block text-[9px] italic text-slate-500 mt-0.5">"{tx.transcriptRef}"</span>
                                  )}
                                </td>
                                <td className={`py-2.5 text-right font-extrabold ${tx.type === "INCOME" ? "text-emerald-400" : "text-slate-400"}`}>
                                  {tx.type === "INCOME" ? "+" : "-"} ₹{tx.amount.toLocaleString()}
                                </td>
                                <td className="py-2.5 font-mono text-[9px] text-slate-400">{tx.addedVia}</td>
                                <td className="py-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                                    tx.status === "AUTO_VERIFIED" 
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                      : tx.status === "FLAGGED"
                                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  }`}>
                                    {tx.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="text-center py-6 text-slate-500 text-xs">No transactions recorded for this applicant.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Underwriter micro-lending Decision Section */}
                  {selectedAppActiveLoan ? (
                    <div className="bg-slate-950 border-2 border-emerald-500/20 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                        <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <Landmark className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-sm text-white">Active Loan Decision Pipeline</h4>
                          <span className="text-[10px] text-slate-400">Request ID: {selectedAppActiveLoan.id} • Submitted on {selectedAppActiveLoan.requestDate}</span>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-6 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold uppercase mb-1">Requested Capital</span>
                          <span className="text-lg font-extrabold text-white">₹{selectedAppActiveLoan.amount.toLocaleString()}</span>
                          <span className="block text-[9px] text-slate-500 mt-1">Suggested repayment limit matches</span>
                        </div>
                        
                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold uppercase mb-1">Repayment Term</span>
                          <span className="text-lg font-extrabold text-white">{selectedAppActiveLoan.termMonths} Months</span>
                          <span className="block text-[9px] text-slate-400 mt-1">Monthly: ₹{selectedAppActiveLoan.monthlyRepayment}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold uppercase mb-1">Risk Weight Analysis</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block mt-0.5 ${
                            selectedAppActiveLoan.riskBucket === "LOW" ? "bg-emerald-500/10 text-emerald-400" : selectedAppActiveLoan.riskBucket === "MEDIUM" ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                          }`}>
                            {selectedAppActiveLoan.riskBucket} Risk Index
                          </span>
                        </div>
                      </div>

                      {/* Underwriter Slider / inputs to adjust conditions */}
                      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 space-y-4">
                        <div>
                          <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                            <span>Adjust Approved Interest Rate (%)</span>
                            <span className="text-emerald-400 font-bold">{decisionRate}% p.a.</span>
                          </div>
                          <input
                            type="range"
                            min="8.0"
                            max="18.0"
                            step="0.5"
                            value={decisionRate}
                            onChange={(e) => setDecisionRate(Number(e.target.value))}
                            className="w-full accent-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Underwriter Decision Memo</label>
                          <textarea
                            placeholder="Add loan approval, deferral, or rejection notes..."
                            value={decisionComments}
                            onChange={(e) => setDecisionComments(e.target.value)}
                            className="w-full h-16 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 outline-none focus:border-emerald-600 transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => {
                            if (currentUser.role !== "ADMIN") {
                              triggerConfirmation({
                                title: "Access Restricted",
                                description: "Your account is assigned the LENDER_OFFICER role. Direct loan disbursement authorization and rejection actions are strictly reserved for UNDERWRITERS and ADMIN roles.",
                                actionText: "Acknowledge",
                                actionClass: "bg-slate-800 hover:bg-slate-700 text-white",
                                onConfirm: () => {}
                              });
                              return;
                            }
                            if (selectedAppActiveLoan && selectedApp) {
                              triggerConfirmation({
                                title: "Confirm Loan Approval & Disbursement",
                                description: `Are you sure you want to approve this loan of ₹${selectedAppActiveLoan.amount.toLocaleString()} at ${decisionRate}% p.a. interest? Underwriting terms will be finalized and capital scheduled for immediate electronic transfer to ${selectedApp.name}.`,
                                actionText: "Approve & Disburse",
                                actionClass: "bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white",
                                onConfirm: () => handleLoanDecision(selectedAppActiveLoan.id, "APPROVED")
                              });
                            }
                          }}
                          disabled={isSubmittingDecision}
                          className="flex-1 min-w-[130px] h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Approve & Disburse
                        </button>
                        <button
                          onClick={() => {
                            if (selectedAppActiveLoan) {
                              handleLoanDecision(selectedAppActiveLoan.id, "REQUESTED_MORE");
                            }
                          }}
                          disabled={isSubmittingDecision}
                          className="flex-1 min-w-[130px] h-11 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                        >
                          <Info className="w-4 h-4" /> Request Info
                        </button>
                        <button
                          onClick={() => {
                            if (currentUser.role !== "ADMIN") {
                              triggerConfirmation({
                                title: "Access Restricted",
                                description: "Your account is assigned the LENDER_OFFICER role. Rejecting loan files and final decisions require high-level ADMIN verification credentials.",
                                actionText: "Acknowledge",
                                actionClass: "bg-slate-800 hover:bg-slate-700 text-white",
                                onConfirm: () => {}
                              });
                              return;
                            }
                            if (selectedAppActiveLoan && selectedApp) {
                              triggerConfirmation({
                                title: "Confirm Loan Application Rejection",
                                description: `Are you sure you want to decline this loan application for ${selectedApp.name}? This action is permanent and will notify the rural borrower via integrated channel with underwriter comments.`,
                                actionText: "Decline Loan",
                                actionClass: "bg-rose-600 hover:bg-rose-700 active:scale-95 text-white",
                                onConfirm: () => handleLoanDecision(selectedAppActiveLoan.id, "REJECTED")
                              });
                            }
                          }}
                          disabled={isSubmittingDecision}
                          className="flex-1 min-w-[130px] h-11 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                        >
                          <X className="w-4 h-4" /> Decline Loan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 text-center text-xs text-slate-400">
                      👍 No pending loan application files for {selectedApp.name}. Current status is: <strong>{selectedApp.status}</strong>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-24 bg-slate-950 rounded-2xl border border-slate-850 text-slate-500 text-sm">
                  Select an applicant on the directory to launch risk deep dive.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Review Queue */}
        {activeTab === "queue" && (
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="font-display font-bold text-lg text-white">Review &amp; Verification Queue</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl mt-1">
                Kisan-Credit flagging algorithms triggered reviews for transaction logs with low OCR confidence, lack of paperwork, or anomalous cash flow patterns. Field officers should cross-verify these entries.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 uppercase font-mono text-[9px] font-bold">
                    <th className="pb-3">Applicant Name</th>
                    <th className="pb-3">Transaction details</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3">Log Source</th>
                    <th className="pb-3">Trigger Score</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {transactions.filter(t => t.status === "FLAGGED" || t.status === "PENDING").length > 0 ? (
                    transactions
                      .filter(t => t.status === "FLAGGED" || t.status === "PENDING")
                      .map((tx) => {
                        const app = applicants.find(a => a.id === tx.applicantId);
                        return (
                          <tr key={tx.id} className="hover:bg-slate-900/40">
                            <td className="py-4">
                              {app ? (
                                <div className="flex items-center gap-3">
                                  <img src={app.avatar} className="w-8 h-8 rounded-full object-cover" />
                                  <div>
                                    <span className="font-semibold block text-white">{app.name}</span>
                                    <span className="text-[10px] text-slate-500 block">{app.businessType}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="font-semibold text-slate-400">{tx.applicantId}</span>
                              )}
                            </td>
                            <td className="py-4">
                              <span className="font-semibold block text-slate-200">{tx.description}</span>
                              {tx.transcriptRef && (
                                <span className="block text-[10px] italic text-slate-500 mt-1 bg-slate-900/50 p-1 rounded border border-slate-850">
                                  Transcript: "{tx.transcriptRef}"
                                </span>
                              )}
                            </td>
                            <td className={`py-4 text-right font-extrabold ${tx.type === "INCOME" ? "text-emerald-400" : "text-slate-400"}`}>
                              ₹{tx.amount.toLocaleString()}
                            </td>
                            <td className="py-4 font-mono text-[9px] text-slate-400">{tx.addedVia}</td>
                            <td className="py-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold font-mono text-slate-300">{Math.round(tx.confidenceScore * 100)}%</span>
                                <span className="text-[10px] text-slate-500">confidence</span>
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              <div className="inline-flex gap-2">
                                <button
                                  onClick={() => {
                                    if (currentUser.role !== "ADMIN") {
                                      triggerConfirmation({
                                        title: "Access Restricted",
                                        description: "Your account is assigned the LENDER_OFFICER role. Transaction verification and flagging require ADMIN credentials.",
                                        actionText: "Acknowledge",
                                        actionClass: "bg-slate-800 hover:bg-slate-750 text-white",
                                        onConfirm: () => {}
                                      });
                                      return;
                                    }
                                    handleUpdateTxStatus(tx.id, "AUTO_VERIFIED");
                                  }}
                                  className="h-8 px-3 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" /> Verify
                                </button>
                                <button
                                  onClick={() => {
                                    if (currentUser.role !== "ADMIN") {
                                      triggerConfirmation({
                                        title: "Access Restricted",
                                        description: "Your account is assigned the LENDER_OFFICER role. Flagging ledger transactions requires high-level ADMIN credentials.",
                                        actionText: "Acknowledge",
                                        actionClass: "bg-slate-800 hover:bg-slate-750 text-white",
                                        onConfirm: () => {}
                                      });
                                      return;
                                    }
                                    const borrowerName = app ? app.name : "borrower";
                                    triggerConfirmation({
                                      title: "Confirm Transaction Flagging",
                                      description: `Are you sure you want to flag this transaction of ₹${tx.amount.toLocaleString()} ("${tx.description}") for ${borrowerName}? This is a sensitive action that requires immediate on-site verification by field cooperatives.`,
                                      actionText: "Flag Transaction",
                                      actionClass: "bg-rose-600 hover:bg-rose-700 active:scale-95 text-white",
                                      onConfirm: () => handleUpdateTxStatus(tx.id, "FLAGGED")
                                    });
                                  }}
                                  className="h-8 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all flex items-center gap-1"
                                  disabled={tx.status === "FLAGGED"}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" /> Flag Anomalous
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                        🎉 Splendid! No transactions waiting in the validation queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Portfolio View */}
        {activeTab === "portfolio" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-4">
              <h3 className="font-display font-bold text-base text-white">Active Micro-loan Portfolio</h3>
              <p className="text-xs text-slate-400">List of approved microcredit allocations with real-time repayment tracks.</p>

              <div className="space-y-3">
                {loans.filter(l => l.status === "APPROVED").map((loan) => {
                  const app = applicants.find(a => a.id === loan.applicantId);
                  return (
                    <div key={loan.id} className="p-3.5 bg-slate-900/60 border border-slate-850 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={app?.avatar} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <span className="font-semibold block text-white">{app?.name || "Rural Borrower"}</span>
                          <span className="text-[10px] text-slate-400 block">{app?.businessType}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-white block">₹{loan.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-emerald-400 block font-semibold font-mono">Interest: {loan.interestRate}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-4">
              <h3 className="font-display font-bold text-base text-white">Active Portfolio Risk Allocation</h3>
              <p className="text-xs text-slate-400">Calculated based on alternate trust score classification parameters.</p>

              <div className="space-y-4 pt-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>Low Risk Bucket (Trust Score 80+)</span>
                    <span>3 Accounts</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[60%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>Medium Risk Bucket (Trust Score 60-79)</span>
                    <span>1 Account</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[20%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>High Risk Bucket (Trust Score &lt;60)</span>
                    <span>1 Account</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 w-[20%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Audit Logs */}
        {activeTab === "audit" && (
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="font-display font-bold text-lg text-white">Audit Trail Logging</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                A cryptographically signed timeline of all user access, automatic ledger ingestion parses, and loan underwriting decisions.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 uppercase font-mono text-[9px] font-bold">
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Action Triggered</th>
                    <th className="pb-3">Actor / Agent ID</th>
                    <th className="pb-3">Trail Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="py-3 text-slate-400 text-[10px]">{log.timestamp}</td>
                      <td className="py-3 font-semibold text-teal-400">{log.action}</td>
                      <td className="py-3 text-slate-300">{log.actor}</td>
                      <td className="py-3 text-slate-400 font-sans text-xs">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: D3 Analytics */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-200">
                Regional Underwriting Analytics (D3 Core Engine)
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Advanced agricultural credit portfolio tracking compiled natively in D3 vector layers. This dashboard monitors live risk indexes and multi-month cooperative repayment trajectories.
              </p>
            </div>
            <D3RegionalRisk applicants={applicants} loans={loans} />
          </div>
        )}

        {/* Tab 6: Admin Override Block */}
        {activeTab === "admin" && (
          <AdminBlock currentUser={currentUser} onSuccessTrigger={fetchData} />
        )}

        {/* Tab 7: Loan Calculator Block */}
        {activeTab === "calculator" && (
          <LoanCalculator />
        )}
      </main>

      {/* Confirmation Dialog Component */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        {confirmConfig && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                {confirmConfig.title}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmConfig.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmConfig.onConfirm}
                className={confirmConfig.actionClass}
              >
                {confirmConfig.actionText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
