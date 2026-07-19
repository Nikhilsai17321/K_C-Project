import * as React from "react";
import { useState, useEffect } from "react";
import { 
  Lock, Mail, User, ShieldCheck, AlertCircle, Eye, EyeOff, Loader2, ArrowRight, ShieldAlert, CheckCircle, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ValidationMessage } from "./ui/ValidationMessage";
import { showToast } from "../utils/toast";

interface AuthPageProps {
  onLoginSuccess: (user: { id: string; email: string; fullName: string; role: "LENDER_OFFICER" | "ADMIN" }) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"LENDER_OFFICER" | "ADMIN">("LENDER_OFFICER");

  // Show/hide password
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation States
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [generalError, setGeneralError] = useState("");

  // Lockout State
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMessage, setLockoutMessage] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Form Fields Blur Validation
  const validateEmail = (val: string) => {
    if (!val.trim()) {
      setEmailError("Email address is required");
      return false;
    }
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(val)) {
      setEmailError("Please enter a valid email format (e.g. name@domain.com)");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (val: string) => {
    if (!val) {
      setPasswordError("Password is required");
      return false;
    }
    if (val.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateFullName = (val: string) => {
    if (!isLogin && !val.trim()) {
      setFullNameError("Full name is required for registration");
      return false;
    }
    setFullNameError("");
    return true;
  };

  // Lockout Countdown Effect
  useEffect(() => {
    if (remainingSeconds <= 0) {
      if (isLocked) {
        setIsLocked(false);
        setGeneralError("");
      }
      return;
    }
    const timer = setInterval(() => {
      setRemainingSeconds(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds, isLocked]);

  const formatCountdown = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return hours > 0 
      ? `${hours}h ${minutes}m ${seconds}s` 
      : `${minutes}m ${seconds}s`;
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isNameValid = isLogin ? true : validateFullName(fullName);

    if (!isEmailValid || !isPasswordValid || !isNameValid) {
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const payload = isLogin 
        ? { email, password }
        : { email, password, fullName, role };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          // Lockout payload triggered
          setIsLocked(true);
          setLockoutMessage(data.error);
          setRemainingSeconds(data.remainingSeconds || 86400); // fallback 24 hours
        } else {
          setGeneralError(data.error || "Authentication failed. Please verify credentials.");
        }
      } else {
        // Auth Success!
        showToast(
          isLogin 
            ? `🔐 Welcome back, ${data.user.fullName}! Session initialized securely.` 
            : `✨ Account created successfully! Welcome to Kisan Credit, ${data.user.fullName}.`,
          "success"
        );
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setGeneralError("An unexpected connection error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Quick fill logins helper for testing
  const handleQuickFill = (emailStr: string) => {
    setEmail(emailStr);
    setPassword("Password123!");
    setEmailError("");
    setPasswordError("");
    setGeneralError("");
  };

  // Clear server lock bypass
  const handleResetLockout = async () => {
    try {
      await fetch("/api/auth/reset-lockout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      setIsLocked(false);
      setRemainingSeconds(0);
      setGeneralError("Lockout cleared. You can try logging in again!");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 bg-radial from-slate-900 via-slate-950 to-slate-950 text-slate-100 font-sans relative overflow-hidden">
      
      {/* Decorative dynamic ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-950 border border-slate-850 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 relative z-10 transition-all">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 items-center justify-center text-white shadow-lg shadow-emerald-950/20 mb-1">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-white leading-none">
            Kisan-Credit Auth Gate
          </h2>
          <p className="text-xs text-slate-400">
            Internal Risk Management &amp; Underwriting Dashboard
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => {
              setIsLogin(true);
              setGeneralError("");
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              isLogin 
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Lender Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setGeneralError("");
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              !isLogin 
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Co-op Signup
          </button>
        </div>

        {/* General Error/Validation Alert Banner */}
        {generalError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{generalError}</span>
          </div>
        )}

        {/* Auth Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Signup Only Fields: Full Name */}
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fullNameError) setFullNameError("");
                  }}
                  onBlur={() => validateFullName(fullName)}
                  className={`w-full h-10 bg-slate-900 border ${
                    fullNameError ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-800 focus:border-emerald-600 focus:ring-emerald-600/20"
                  } rounded-xl pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 outline-none focus:ring-2 transition-all`}
                />
              </div>
              <ValidationMessage message={fullNameError} />
            </div>
          )}

          {/* Email input (Both flows) */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cooperative Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="officer@kisan-credit.org"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                onBlur={() => validateEmail(email)}
                className={`w-full h-10 bg-slate-900 border ${
                  emailError ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-800 focus:border-emerald-600 focus:ring-emerald-600/20"
                } rounded-xl pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 outline-none focus:ring-2 transition-all`}
              />
            </div>
            <ValidationMessage message={emailError} />
          </div>

          {/* Password Input (Both flows) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Security Password</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setGeneralError("For demo, use the reset options or preset quick-logins.")}
                  className="text-[9px] text-emerald-400 hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                onBlur={() => validatePassword(password)}
                className={`w-full h-10 bg-slate-900 border ${
                  passwordError ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-800 focus:border-emerald-600 focus:ring-emerald-600/20"
                } rounded-xl pl-9 pr-10 text-xs text-slate-100 placeholder-slate-500 outline-none focus:ring-2 transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-all"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <ValidationMessage message={passwordError} />
          </div>

          {/* Signup Only Fields: Role Choice */}
          {!isLogin && (
            <div className="space-y-1 pt-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Designated Authorization Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("LENDER_OFFICER")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    role === "LENDER_OFFICER"
                      ? "bg-slate-900 border-emerald-500 text-emerald-400"
                      : "bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  Lender Officer
                </button>
                <button
                  type="button"
                  onClick={() => setRole("ADMIN")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    role === "ADMIN"
                      ? "bg-slate-900 border-emerald-500 text-emerald-400"
                      : "bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  Administrator
                </button>
              </div>
            </div>
          )}

          {/* Submit Trigger */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1.5 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isLogin ? "Authenticate Account" : "Create New Profile"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Testing Seeding Assist */}
        {isLogin && (
          <div className="pt-4 border-t border-slate-850 space-y-2.5">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Developer Presets (Quick Access)</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("officer@kisan-credit.org")}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-850 text-[10px] text-slate-300 border border-slate-800 rounded-lg text-left truncate flex flex-col justify-center"
              >
                <span className="font-bold text-white block">Field Officer</span>
                <span>officer@kisan-credit.org</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("admin@kisan-credit.org")}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-850 text-[10px] text-slate-300 border border-slate-800 rounded-lg text-left truncate flex flex-col justify-center"
              >
                <span className="font-bold text-white block">Administrator</span>
                <span>admin@kisan-credit.org</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lockout Attempt Limits Modal Overlay */}
      <AnimatePresence>
        {isLocked && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative z-50 w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-center"
            >
              <div className="inline-flex w-12 h-12 rounded-full bg-rose-500/10 items-center justify-center text-rose-500 mb-1">
                <ShieldAlert className="w-6 h-6" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-base text-white">Login Block Active</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lockoutMessage}
                </p>
              </div>

              {/* Live countdown timer */}
              <div className="bg-slate-900/80 border border-slate-850 rounded-xl p-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Time Remaining Until Retry</span>
                <span className="text-lg font-mono font-bold text-rose-400">
                  {formatCountdown(remainingSeconds)}
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetLockout}
                  className="h-9 w-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  title="Testing bypass for developers to reset lockout immediately"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Bypass / Reset Lockout (Sim)
                </button>
                <button
                  type="button"
                  onClick={() => setIsLocked(false)}
                  className="h-9 w-full bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold transition-all"
                >
                  Close Message
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
