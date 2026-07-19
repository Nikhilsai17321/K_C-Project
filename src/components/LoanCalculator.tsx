import React, { useState, useMemo } from "react";
import { 
  Calculator, DollarSign, Calendar, Percent, RefreshCw, Download, 
  HelpCircle, Info, ChevronRight, Bookmark, Trash2, ArrowUpRight 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { showToast } from "../utils/toast";

interface AmortizationRow {
  month: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

interface SavedSimulation {
  id: string;
  name: string;
  principal: number;
  interestRate: number;
  months: number;
  monthlyRepayment: number;
  totalInterest: number;
}

export default function LoanCalculator() {
  const [principal, setPrincipal] = useState<number>(50000);
  const [interestRate, setInterestRate] = useState<number>(11.5);
  const [months, setMonths] = useState<number>(12);
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
  const [simulationName, setSimulationName] = useState<string>("");

  // Calculate repayment metrics
  const calculations = useMemo(() => {
    const monthlyRate = (interestRate / 100) / 12;
    let monthlyRepayment = 0;
    
    if (monthlyRate === 0) {
      monthlyRepayment = principal / months;
    } else {
      monthlyRepayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                         (Math.pow(1 + monthlyRate, months) - 1);
    }

    const totalRepayment = monthlyRepayment * months;
    const totalInterest = totalRepayment - principal;

    // Amortization Schedule
    const schedule: AmortizationRow[] = [];
    let remainingBalance = principal;

    for (let i = 1; i <= months; i++) {
      const interestPaid = remainingBalance * monthlyRate;
      const principalPaid = monthlyRepayment - interestPaid;
      remainingBalance = Math.max(remainingBalance - principalPaid, 0);

      schedule.push({
        month: i,
        payment: monthlyRepayment,
        principalPaid,
        interestPaid,
        remainingBalance
      });
    }

    return {
      monthlyRepayment: Math.round(monthlyRepayment),
      totalRepayment: Math.round(totalRepayment),
      totalInterest: Math.round(totalInterest),
      schedule
    };
  }, [principal, interestRate, months]);

  // Handle Preset Clicks
  const applyPreset = (p: number, r: number, m: number) => {
    setPrincipal(p);
    setInterestRate(r);
    setMonths(m);
    showToast(`Applied preset: ₹${p.toLocaleString()} for ${m} months @ ${r}%`, "info");
  };

  // Export Amortization Schedule to CSV
  const exportScheduleToCSV = () => {
    const csvRows = [
      ["Month", "Scheduled Monthly Repayment (INR)", "Principal Paid (INR)", "Interest Paid (INR)", "Remaining Balance (INR)"].join(",")
    ];

    calculations.schedule.forEach(row => {
      csvRows.push([
        row.month,
        Math.round(row.payment),
        Math.round(row.principalPaid),
        Math.round(row.interestPaid),
        Math.round(row.remainingBalance)
      ].join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = `Amortization_Schedule_P${principal}_R${interestRate}_M${months}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`📝 Exported amortization schedule for ₹${principal.toLocaleString()} loan to CSV!`, "success");
  };

  // Save Simulation Scenario
  const handleSaveSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    const name = simulationName.trim() || `Option ${savedSimulations.length + 1} (₹${principal / 1000}K)`;
    
    if (savedSimulations.length >= 4) {
      showToast("Maximum of 4 simulations compared. Please remove an existing offer to save a new one.", "warning");
      return;
    }

    const newSim: SavedSimulation = {
      id: `${Date.now()}`,
      name,
      principal,
      interestRate,
      months,
      monthlyRepayment: calculations.monthlyRepayment,
      totalInterest: calculations.totalInterest
    };

    setSavedSimulations(prev => [...prev, newSim]);
    setSimulationName("");
    showToast(`💾 Saved simulation "${name}" to comparative layout.`, "success");
  };

  const removeSimulation = (id: string) => {
    setSavedSimulations(prev => prev.filter(s => s.id !== id));
    showToast("Simulation scenario removed.", "info");
  };

  const interestPercentage = Math.round((calculations.totalInterest / calculations.totalRepayment) * 100) || 0;
  const principalPercentage = 100 - interestPercentage;

  return (
    <div id="loan-calculator-root" className="space-y-6">
      
      {/* Overview Block */}
      <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-200">
            Interactive Loan &amp; Repayment Calculator
          </h3>
        </div>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Simulate micro-lending amortizations, adjust agricultural yields interest weights, compare distinct debt profiles, and generate compliant payment schedules instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Inputs and Presets */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300 pb-2 border-b border-slate-850">
              Calibrate Parameters
            </h4>

            {/* Principal Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Principal Amount (₹)</span>
                <input 
                  type="number" 
                  value={principal} 
                  onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                  className="w-28 bg-slate-900 border border-slate-800 text-right text-emerald-400 font-bold font-mono px-2 py-1 rounded text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <input 
                type="range" 
                min="5000" 
                max="250000" 
                step="5000"
                value={principal} 
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>₹5K</span>
                <span>₹100K</span>
                <span>₹250K</span>
              </div>
            </div>

            {/* Interest Rate Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Annual Interest Rate (%)</span>
                <input 
                  type="number" 
                  step="0.1"
                  value={interestRate} 
                  onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                  className="w-20 bg-slate-900 border border-slate-800 text-right text-teal-400 font-bold font-mono px-2 py-1 rounded text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
              <input 
                type="range" 
                min="1" 
                max="30" 
                step="0.5"
                value={interestRate} 
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1%</span>
                <span>15%</span>
                <span>30%</span>
              </div>
            </div>

            {/* Tenure Select */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium block">
                Repayment Tenure (Months)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 6, 12, 18, 24].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMonths(m)}
                    className={`py-2 rounded-lg text-xs font-semibold font-mono border transition-all ${
                      months === m
                        ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/50"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-750 hover:text-white"
                    }`}
                  >
                    {m} M
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-2">
                Standard Agri-Credit Presets
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => applyPreset(15000, 8.5, 6)}
                  className="px-3 py-2 bg-slate-900/60 hover:bg-slate-900 text-left rounded-xl border border-slate-850 hover:border-slate-750 text-xs flex justify-between items-center transition-all group"
                >
                  <span className="text-slate-300 group-hover:text-white font-medium">Crop Input Mini-Loan</span>
                  <span className="font-mono text-emerald-400">₹15K @ 8.5% (6M)</span>
                </button>
                <button
                  onClick={() => applyPreset(60000, 11.5, 12)}
                  className="px-3 py-2 bg-slate-900/60 hover:bg-slate-900 text-left rounded-xl border border-slate-850 hover:border-slate-750 text-xs flex justify-between items-center transition-all group"
                >
                  <span className="text-slate-300 group-hover:text-white font-medium">Standard Dairy Yield Plan</span>
                  <span className="font-mono text-emerald-400">₹60K @ 11.5% (12M)</span>
                </button>
                <button
                  onClick={() => applyPreset(150000, 14.0, 24)}
                  className="px-3 py-2 bg-slate-900/60 hover:bg-slate-900 text-left rounded-xl border border-slate-850 hover:border-slate-750 text-xs flex justify-between items-center transition-all group"
                >
                  <span className="text-slate-300 group-hover:text-white font-medium">Solar Irrigation Capital</span>
                  <span className="font-mono text-emerald-400">₹1.5L @ 14.0% (24M)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Comparative Workspace */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300">
              Save to Compare Scenarios
            </h4>
            <form onSubmit={handleSaveSimulation} className="flex gap-2">
              <input
                type="text"
                placeholder="Scenario description (e.g. Offer A)"
                value={simulationName}
                onChange={(e) => setSimulationName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center gap-1 shrink-0 active:scale-95"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </form>

            <AnimatePresence>
              {savedSimulations.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-850">
                  {savedSimulations.map((sim) => (
                    <motion.div
                      key={sim.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl flex items-center justify-between text-xs gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-200">{sim.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono leading-none">
                          ₹{sim.principal.toLocaleString()} @ {sim.interestRate}% over {sim.months}M •{" "}
                          <span className="text-emerald-400 font-bold">₹{sim.monthlyRepayment}/mo</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeSimulation(sim.id)}
                        className="p-1.5 bg-slate-950 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Projections and Schedule */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Key Metrics Output */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-850 gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300">
                  Monthly Installment Plan
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Reducing balance calculation standard</p>
              </div>
              <button
                onClick={exportScheduleToCSV}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Schedule</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1 */}
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Monthly Payment</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono tracking-tight">
                  ₹{calculations.monthlyRepayment.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 leading-none">For {months} billing intervals</span>
              </div>

              {/* Card 2 */}
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Total Interest</span>
                <span className="text-2xl font-extrabold text-teal-400 font-mono tracking-tight">
                  ₹{calculations.totalInterest.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 leading-none">At {interestRate}% rate per annum</span>
              </div>

              {/* Card 3 */}
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Total Repayment</span>
                <span className="text-2xl font-extrabold text-indigo-400 font-mono tracking-tight">
                  ₹{calculations.totalRepayment.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 leading-none">Principal + Interest sum</span>
              </div>
            </div>

            {/* Graphic Proportion Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-indigo-400">Principal Contribution: {principalPercentage}%</span>
                <span className="text-teal-400">Interest Share: {interestPercentage}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-850">
                <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${principalPercentage}%` }} />
                <div className="bg-teal-400 h-full transition-all duration-300" style={{ width: `${interestPercentage}%` }} />
              </div>
            </div>
          </div>

          {/* Amortization Table */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300">
              Amortization Breakdown Table
            </h4>
            <div className="max-h-[220px] overflow-y-auto border border-slate-850 rounded-xl scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900/80 sticky top-0 border-b border-slate-850">
                  <tr className="font-mono text-slate-400">
                    <th className="p-2.5 pl-3">Month</th>
                    <th className="p-2.5">Repayment</th>
                    <th className="p-2.5">Principal</th>
                    <th className="p-2.5">Interest</th>
                    <th className="p-2.5 pr-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {calculations.schedule.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-2.5 pl-3 font-mono text-slate-400 font-bold">M{row.month}</td>
                      <td className="p-2.5 font-mono">₹{Math.round(row.payment).toLocaleString()}</td>
                      <td className="p-2.5 font-mono text-indigo-400">₹{Math.round(row.principalPaid).toLocaleString()}</td>
                      <td className="p-2.5 font-mono text-teal-400">₹{Math.round(row.interestPaid).toLocaleString()}</td>
                      <td className="p-2.5 pr-3 font-mono text-right font-medium">₹{Math.round(row.remainingBalance).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
