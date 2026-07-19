import { useState } from "react";
import { 
  Sliders, UserPlus, Play, RotateCcw, Trash2, ShieldAlert, CheckCircle2, AlertCircle, Info, Sparkles 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { showToast } from "../utils/toast";

interface AdminBlockProps {
  currentUser: {
    id: string;
    email: string;
    fullName: string;
    role: "LENDER_OFFICER" | "ADMIN";
  };
  onSuccessTrigger: () => void; // call parent's fetchData to reload states
}

export default function AdminBlock({ currentUser, onSuccessTrigger }: AdminBlockProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Model weight states
  const [milkYieldWeight, setMilkYieldWeight] = useState(35);
  const [shgWeight, setShgWeight] = useState(25);
  const [villagePanchayatWeight, setVillagePanchayatWeight] = useState(20);
  const [peerVouchWeight, setPeerVouchWeight] = useState(20);

  const isAdmin = currentUser.role === "ADMIN";

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      showToast(msg, "error");
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      showToast(msg, "success");
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleSimulateApplicant = async () => {
    setLoadingAction("simulate");
    try {
      const res = await fetch("/api/admin/simulate-applicant", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`🎉 Simulated applicant successfully! ${data.applicant.name} from ${data.applicant.location} has been added to the queue with a ₹${data.loan.amount.toLocaleString()} loan request.`);
        onSuccessTrigger();
      } else {
        showNotification(data.error || "Failed to simulate applicant", true);
      }
    } catch (e) {
      showNotification("Network error during simulation", true);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAutoApprove = async () => {
    setLoadingAction("approve");
    try {
      const res = await fetch("/api/admin/auto-approve", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(data.message || "High-trust loans batch-approved!");
        onSuccessTrigger();
      } else {
        showNotification(data.error || "Failed batch auto-approve", true);
      }
    } catch (e) {
      showNotification("Network error during auto-approve", true);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetData = async () => {
    if (!confirm("Are you sure you want to reset all database tables to seed presets? This clears all simulated changes.")) return;
    setLoadingAction("reset");
    try {
      const res = await fetch("/api/admin/reset-data", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("🔄 System databases restored to pristine seed presets.");
        onSuccessTrigger();
      } else {
        showNotification(data.error || "Failed to reset database", true);
      }
    } catch (e) {
      showNotification("Network error during database reset", true);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClearAuditLogs = async () => {
    if (!confirm("Clear audit logs trail? This re-initializes log tables.")) return;
    setLoadingAction("clear-logs");
    try {
      const res = await fetch("/api/admin/clear-audit-logs", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("🗑️ Audit trail re-initialized successfully.");
        onSuccessTrigger();
      } else {
        showNotification(data.error || "Failed to clear audit logs", true);
      }
    } catch (e) {
      showNotification("Network error during audit log clearing", true);
    } finally {
      setLoadingAction(null);
    }
  };

  const totalWeights = milkYieldWeight + shgWeight + villagePanchayatWeight + peerVouchWeight;

  return (
    <div id="admin-block-root" className="bg-slate-950 border-2 border-amber-500/20 rounded-2xl p-6 space-y-6">
      
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-850 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="font-display font-extrabold text-base text-white tracking-tight">
              Platform Admin Control Block
            </h3>
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Executive underwriter override center. System variables, simulation managers, and automated batch procedures.
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] text-amber-300 uppercase tracking-widest font-mono font-bold">
            Administrator Privileges Active
          </span>
        </div>
      </div>

      {/* Success/Error Alerts overlay */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-start gap-2 shadow-md"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-start gap-2 shadow-md"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!isAdmin ? (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h4 className="font-bold text-white text-sm">Access Strictly Restricted</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Your logged-in role is <strong className="text-emerald-400">LENDER_OFFICER</strong>. System configuration updates, batch loan underwriting overrides, and database simulation tools are disabled to enforce banking-grade cooperative separation of concerns.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Section 1: Tuning Alternative Credit scoring parameters */}
          <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-850/80">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
                Alternative Weighting Matrix (%)
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-normal">
              Dynamically calibrate the importance of alternative datasets within the automated underwriter engine. Weights must total exactly 100%.
            </p>

            <div className="space-y-3.5 pt-2">
              {/* Factor 1 */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                  <span>Alternate Milk Yield Records</span>
                  <span className="text-emerald-400 font-mono font-bold">{milkYieldWeight}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={milkYieldWeight} 
                  onChange={(e) => setMilkYieldWeight(Number(e.target.value))}
                  className="w-full accent-emerald-500" 
                />
              </div>

              {/* Factor 2 */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                  <span>Self-Help Group (SHG) Standing</span>
                  <span className="text-emerald-400 font-mono font-bold">{shgWeight}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={shgWeight} 
                  onChange={(e) => setShgWeight(Number(e.target.value))}
                  className="w-full accent-emerald-500" 
                />
              </div>

              {/* Factor 3 */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                  <span>Gram Panchayat Endorsement</span>
                  <span className="text-emerald-400 font-mono font-bold">{villagePanchayatWeight}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={villagePanchayatWeight} 
                  onChange={(e) => setVillagePanchayatWeight(Number(e.target.value))}
                  className="w-full accent-emerald-500" 
                />
              </div>

              {/* Factor 4 */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                  <span>Peer-to-Peer Vouch Integrity</span>
                  <span className="text-emerald-400 font-mono font-bold">{peerVouchWeight}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={peerVouchWeight} 
                  onChange={(e) => setPeerVouchWeight(Number(e.target.value))}
                  className="w-full accent-emerald-500" 
                />
              </div>

              {/* Sum integrity display */}
              <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Total Allocated Weights:</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                  totalWeights === 100 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {totalWeights}% {totalWeights === 100 ? "• Standardized" : "• Needs Adjustment"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Underwriter Batch Procedures & Simulation seeding */}
          <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-850/80 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
                  Simulation &amp; Underwriting Core Actions
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-normal">
                Directly manipulate the simulated platform database, seed conversational farmer intakes, and run batched automation tasks.
              </p>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Simulated Applicant button */}
                <button
                  onClick={handleSimulateApplicant}
                  disabled={loadingAction !== null}
                  className="p-3 bg-slate-950 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-800 rounded-xl text-left transition-all space-y-1.5 flex flex-col justify-between active:scale-95 group"
                >
                  <UserPlus className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-bold text-xs block">Simulate Intake</span>
                    <span className="text-[9px] text-slate-500 leading-none">Seed 1 New Applicant</span>
                  </div>
                </button>

                {/* Batch Auto approve */}
                <button
                  onClick={handleAutoApprove}
                  disabled={loadingAction !== null}
                  className="p-3 bg-slate-950 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-800 rounded-xl text-left transition-all space-y-1.5 flex flex-col justify-between active:scale-95 group"
                >
                  <Play className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-bold text-xs block">Auto-Underwrite</span>
                    <span className="text-[9px] text-slate-500 leading-none">Approve clean profiles</span>
                  </div>
                </button>

                {/* Clear Audit Logs */}
                <button
                  onClick={handleClearAuditLogs}
                  disabled={loadingAction !== null}
                  className="p-3 bg-slate-950 hover:bg-rose-950/20 text-slate-200 hover:text-rose-400 border border-slate-800 hover:border-rose-900/30 rounded-xl text-left transition-all space-y-1.5 flex flex-col justify-between active:scale-95 group"
                >
                  <Trash2 className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-bold text-xs block">Clear Audit Trail</span>
                    <span className="text-[9px] text-slate-500 leading-none">Flush system trail logs</span>
                  </div>
                </button>

                {/* Re-seed databases */}
                <button
                  onClick={handleResetData}
                  disabled={loadingAction !== null}
                  className="p-3 bg-slate-950 hover:bg-amber-950/20 text-slate-200 hover:text-amber-400 border border-slate-800 hover:border-amber-900/30 rounded-xl text-left transition-all space-y-1.5 flex flex-col justify-between active:scale-95 group"
                >
                  <RotateCcw className="w-5 h-5 text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
                  <div>
                    <span className="font-bold text-xs block">Reset Presets</span>
                    <span className="text-[9px] text-slate-500 leading-none">Restore database seeds</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-850 text-[9px] text-slate-500 leading-relaxed flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                All transactions triggered inside the Admin override core instantly update the centralized micro-lending databases in-memory.
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
