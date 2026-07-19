import { ArrowRight, MessageSquare, ShieldCheck, TrendingUp, Users, Zap, Landmark, Award, FileText, Download } from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  onNavigate: (view: "landing" | "whatsapp" | "lender") => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-800">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-display font-bold text-lg shadow-sm">
              KC
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-800">Kisan-Credit</span>
              <span className="block text-[10px] uppercase tracking-widest text-emerald-600 font-bold -mt-1 font-mono">Rural Micro-Lending</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</a>
            <a href="#trust-scoring" className="hover:text-emerald-600 transition-colors">Alternative Trust Score</a>
            <a href="#impact" className="hover:text-emerald-600 transition-colors">Impact &amp; Personas</a>
            <a href="#security" className="hover:text-emerald-600 transition-colors">Security</a>
            <a 
              href="/api/download/documentation" 
              download="DOCUMENTATION.md"
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 transition-colors font-semibold"
            >
              <FileText className="w-4 h-4" /> Documentation
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("lender")}
              className="px-4 h-10 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200"
              id="btn-nav-lender"
            >
              Lender Portal
            </button>
            <button
              onClick={() => onNavigate("whatsapp")}
              className="px-4 h-10 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-200"
              id="btn-nav-whatsapp"
            >
              <MessageSquare className="w-4 h-4" />
              Try Demo Chat
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-emerald-50),transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/50 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" />
                RBI Compliant Micro-Finance Innovation
              </div>

              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-slate-900 leading-none">
                Empowering Rural Women Entrepreneurs with <span className="text-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Alternative Trust Scores</span>
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0">
                Skip the complex collateral. Log your daily sales, milk deliveries, and business expenses directly on WhatsApp via text or voice. We turn your daily trade ledger into a certified alternative credit rating.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => onNavigate("whatsapp")}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <MessageSquare className="w-5 h-5" />
                  Try Applicant Chat Demo
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
                <button
                  onClick={() => onNavigate("lender")}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 transition-all font-medium flex items-center justify-center gap-2 shadow-sm"
                >
                  <Landmark className="w-5 h-5 text-slate-500" />
                  Lender Underwriter Dashboard
                </button>
              </div>

              {/* Badges */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-200 max-w-md mx-auto lg:mx-0">
                <div>
                  <span className="block font-display font-bold text-2xl text-slate-800">12,400+</span>
                  <span className="text-xs text-slate-500 font-medium">Borrowers Funded</span>
                </div>
                <div>
                  <span className="block font-display font-bold text-2xl text-slate-800">₹18.4 Cr</span>
                  <span className="text-xs text-slate-500 font-medium">Disbursed</span>
                </div>
                <div>
                  <span className="block font-display font-bold text-2xl text-slate-800">98.6%</span>
                  <span className="text-xs text-slate-500 font-medium">Repayment Rate</span>
                </div>
              </div>
            </div>

            {/* Hero Right: Mock Preview Grid */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm">
                {/* Visual Glow */}
                <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-tr from-emerald-400 to-teal-400 opacity-20 blur-xl" />
                
                {/* Floating Widget 1 */}
                <motion.div 
                  initial={{ x: -20, y: 30, opacity: 0 }}
                  animate={{ x: 0, y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute -left-8 top-16 bg-white p-4 rounded-xl shadow-lg border border-slate-100 z-10 max-w-[200px]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Live AI Stream</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">"Sold 45 liters milk to Co-Op for ₹1,800 today."</p>
                  <div className="mt-2 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">✓ AUTO-VERIFIED (98%)</div>
                </motion.div>

                {/* Floating Widget 2 */}
                <motion.div 
                  initial={{ x: 30, y: -20, opacity: 0 }}
                  animate={{ x: 0, y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -right-6 bottom-16 bg-slate-900 text-white p-4 rounded-xl shadow-lg border border-slate-800 z-10 max-w-[190px]"
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold block mb-1">Trust Score</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-display font-bold text-white">82</span>
                    <span className="text-xs text-slate-400 font-medium">/ 100</span>
                  </div>
                  <div className="mt-2 bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[82%]" />
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 block">A+ Ledger Consistency</span>
                </motion.div>

                {/* Main Mock Device View */}
                <div className="bg-white rounded-3xl border-8 border-slate-950 shadow-2xl overflow-hidden aspect-[9/16] relative flex flex-col">
                  {/* Status Bar */}
                  <div className="bg-slate-950 text-white h-7 px-5 flex items-center justify-between text-[11px] font-medium select-none">
                    <span>9:41 AM</span>
                    <div className="w-16 h-4 bg-black rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0" />
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Kisan-Credit</span>
                    </div>
                  </div>

                  {/* App Header */}
                  <div className="bg-emerald-600 text-white px-4 py-3 flex items-center gap-3 shadow-md">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-display font-bold text-sm">
                      LD
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-none">Lakshmi Devi</h4>
                      <span className="text-[10px] opacity-90">Active Dairy Onboarding</span>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="flex-1 bg-[#efeae2] p-3 space-y-3 overflow-y-auto text-xs">
                    <div className="bg-white rounded-lg p-2.5 max-w-[85%] shadow-sm self-start">
                      <p className="text-slate-800 font-medium">Record dairy sales today. Click Mic to send a voice note.</p>
                      <span className="block text-[9px] text-slate-400 text-right mt-1">9:38 AM</span>
                    </div>

                    <div className="bg-emerald-100 rounded-lg p-2.5 max-w-[85%] shadow-sm self-end ml-auto">
                      <div className="flex items-center gap-2 text-slate-800 font-semibold mb-1">
                        <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-800 rounded text-[9px] uppercase tracking-wider font-mono">Voice</span>
                        <span>0:12</span>
                      </div>
                      <p className="text-slate-600 italic">"Sent 45 liters of milk to Co-Op today at 40rs rate."</p>
                      <span className="block text-[9px] text-emerald-600 text-right mt-1 font-medium">Sent • Delivered</span>
                    </div>

                    <div className="bg-white rounded-lg p-2.5 max-w-[85%] shadow-sm self-start border-l-4 border-emerald-500">
                      <p className="text-slate-800 font-medium">Excellent Lakshmi ji! I have logged ₹1,800 dairy income to your ledger. Trust score updated.</p>
                      <div className="mt-2 bg-slate-50 border border-slate-100 rounded p-1.5 flex items-center justify-between">
                        <div>
                          <span className="block font-bold text-slate-700">₹1,800 Income</span>
                          <span className="text-[8px] text-slate-400">Milk Union Co-Op</span>
                        </div>
                        <span className="text-[9px] px-1 bg-emerald-100 text-emerald-800 rounded font-semibold font-mono">98% Auto</span>
                      </div>
                    </div>
                  </div>

                  {/* App Footer */}
                  <div className="bg-slate-50 p-2 border-t border-slate-200 flex items-center gap-2">
                    <div className="flex-1 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-[10px] text-slate-400">
                      Type ledger entry...
                    </div>
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      🎤
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight">
              An Alternative Trust Pipeline for Financial Inclusion
            </h2>
            <p className="text-slate-600">
              Kisan-Credit replaces traditional collateral with real-time, explainable ledger health built using natural language and automated underwriter audits.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="space-y-4 relative">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-display font-bold text-lg shadow-sm">
                01
              </div>
              <h3 className="font-display font-semibold text-lg text-slate-900">1. Daily WhatsApp Logs</h3>
              <p className="text-slate-600 text-sm">
                Borrowers send daily text records or voice notes on WhatsApp in local languages describing sales, feed acquisitions, or payments.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 relative">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-display font-bold text-lg shadow-sm">
                02
              </div>
              <h3 className="font-display font-semibold text-lg text-slate-900">2. Explainable AI Parsing</h3>
              <p className="text-slate-600 text-sm">
                Kisan-Credit server-side AI extracts transactions, classifies income vs. expense, and maps details into a cryptographically signed ledger.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 relative">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-display font-bold text-lg shadow-sm">
                03
              </div>
              <h3 className="font-display font-semibold text-lg text-slate-900">3. Collaborative Audits</h3>
              <p className="text-slate-600 text-sm">
                Irregular or ambiguous transactions are flagged for human field officers to verify, assuring high-fidelity ledger data and robust model guardrails.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-4 relative">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-display font-bold text-lg shadow-sm">
                04
              </div>
              <h3 className="font-display font-semibold text-lg text-slate-900">4. Explainable Score &amp; Loan</h3>
              <p className="text-slate-600 text-sm">
                Lenders evaluate the trust score and review the SHAP feature contributions to instantly approve transparent micro-loans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Scoring Explainers */}
      <section id="trust-scoring" className="py-20 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs uppercase font-mono tracking-widest text-emerald-600 font-bold">Behind the Algorithms</span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight">
                Say Goodbye to Collateral. Say Hello to Alternative Trust.
              </h2>
              <p className="text-slate-600 text-base">
                Traditional credit bureaus ignore rural cash transactions, locking out 70% of marginal micro-entrepreneurs. Our model tracks trade rhythm, peer endorsements, and ledger health metrics.
              </p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">✓</div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Weekly Consistency Scoring</h4>
                    <p className="text-slate-500 text-xs">Tracks the frequency and consistency of trade logs, heavily weighting active regular traders over seasonal spike users.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">✓</div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Peer-to-Peer SHG Endorsements</h4>
                    <p className="text-slate-500 text-xs">Incorporates endorsements from registered Self-Help Group (SHG) leads and wholesale trade suppliers.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">✓</div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Explainable AI (SHAP Parameters)</h4>
                    <p className="text-slate-500 text-xs">No black-box decisions. Lenders review transparent, audit-ready SHAP score contributions directly on the dashboard screen.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Comparison Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h3 className="font-display font-semibold text-slate-900">Score Parameter Weights</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Daily Ledger Consistency &amp; Cash Flow</span>
                    <span>40%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[40%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>SHG &amp; Co-op Supplier Endorsements</span>
                    <span>25%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full w-[25%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Business Asset Valuation (Loom, Cattle, Store stock)</span>
                    <span>20%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full w-[20%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Bureau History (If available)</span>
                    <span>15%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-indigo-400 h-full w-[15%]" />
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Compliant &amp; Secure:</strong> Kisan-Credit strictly complies with RBI's digital lending guidelines. Daily records are stored locally with AES-256 standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact & Testimonials */}
      <section id="impact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="font-display font-bold text-3xl text-slate-900">Transforming Rural Micro-Enterprise</h2>
            <p className="text-slate-600">See how alternative scoring alters lives at the grassroots level.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
              <div className="flex items-center gap-4">
                <img 
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=256&h=256" 
                  alt="Lakshmi Devi" 
                />
                <div>
                  <h4 className="font-display font-bold text-slate-900">Lakshmi Devi</h4>
                  <span className="text-xs text-emerald-600 font-semibold">Dairy Farmer, Chittoor Rural, AP</span>
                </div>
              </div>
              <p className="text-slate-600 italic text-sm leading-relaxed">
                "No bank was ready to loan me ₹50,000 for a second automated milking pump because I had no formal land lease papers. I logged my milk collection deliveries on WhatsApp for 3 weeks, built a credit score of 82, and secured my loan in 2 days. My daily income is now doubled."
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
              <div className="flex items-center gap-4">
                <img 
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                  src="https://images.unsplash.com/photo-1566305977877-21104093587a?auto=format&fit=crop&q=80&w=256&h=256" 
                  alt="Rajesh Kumar" 
                />
                <div>
                  <h4 className="font-display font-bold text-slate-900">Rajesh Kumar</h4>
                  <span className="text-xs text-emerald-600 font-semibold">Kirana Store, Samastipur, Bihar</span>
                </div>
              </div>
              <p className="text-slate-600 italic text-sm leading-relaxed">
                "When the local floods hit, my stock was damaged. Formal banks wanted multi-year income tax filings. Kisan-Credit analyzed my daily cash books logged on WhatsApp chat. Even with a trust score of 68, they understood my risk and gave me monsoon stock-up cash."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Highlights Section */}
      <section id="security" className="py-16 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-lg">Bank-Grade AES-256</h4>
                <p className="text-slate-400 text-sm">Ledgers and voice telemetry are signed with AES-256 bit public-key cryptography prior to lender sync.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-lg">Explainable AI Scoring</h4>
                <p className="text-slate-400 text-sm">Underwriters access visual SHAP parameters showing exactly why each score is credited or debited.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-lg">SHG Multi-Peer Validation</h4>
                <p className="text-slate-400 text-sm">Fuses self-help group peer scores, milk co-op balances, and trade loops for holistic validation.</p>
              </div>
            </div>
          </div>

          {/* Platform Documentation Download Block */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto shadow-xl">
            <div className="flex items-start gap-4 text-left">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white tracking-tight">Kisan-Credit Technical Documentation</h4>
                <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                  Download the complete system manual detailing the platform's backend services, alternative credit scoring engine, database schema, Supabase RLS migrations, and role-based access levels.
                </p>
              </div>
            </div>
            <a 
              href="/api/download/documentation" 
              download="DOCUMENTATION.md"
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 shadow-md shadow-emerald-950/40"
            >
              <Download className="w-4 h-4" /> Download Manual
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-12 border-t border-slate-900 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">KC</div>
            <span className="font-display font-bold text-slate-300">Kisan-Credit Platforms Pvt. Ltd.</span>
          </div>
          <p>
            An inclusive financial inclusion micro-lending model compliant with Reserve Bank of India (RBI) Digital Lending Guidelines 2026.
          </p>
          <p>© 2026 Kisan-Credit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
