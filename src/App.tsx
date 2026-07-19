import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import WhatsAppSimulator from "./components/WhatsAppSimulator";
import Dashboard from "./components/Dashboard";
import AuthPage from "./components/AuthPage";
import { AnimatePresence, motion } from "motion/react";
import { Toast, ToastType } from "./utils/toast";
import { CheckCircle2, AlertTriangle, Info, AlertCircle, X } from "lucide-react";

type View = "landing" | "whatsapp" | "lender";

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: "LENDER_OFFICER" | "ADMIN";
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>("landing");
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Check session persistence on load
  useEffect(() => {
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => {
        if (data && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(err => console.error("Session fetch failed:", err))
      .finally(() => setLoadingSession(false));
  }, []);

  // Listen for global kisan-toast custom events
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: ToastType }>;
      if (!customEvent.detail) return;

      const { message, type } = customEvent.detail;
      const id = `${Date.now()}-${Math.random()}`;
      
      const newToast: Toast = { id, message, type };
      
      setToasts(prev => [...prev, newToast]);

      // Auto clear after 4.5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4500);
    };

    window.addEventListener("kisan-toast", handleGlobalToast);
    return () => {
      window.removeEventListener("kisan-toast", handleGlobalToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleNavigate = (view: View) => {
    setCurrentView(view);
  };

  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-950/95 border-emerald-500/30 text-emerald-300",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        };
      case "error":
        return {
          bg: "bg-rose-950/95 border-rose-500/30 text-rose-300",
          icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        };
      case "warning":
        return {
          bg: "bg-amber-950/95 border-amber-500/30 text-amber-300",
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        };
      case "info":
      default:
        return {
          bg: "bg-slate-950/95 border-sky-500/30 text-sky-300",
          icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 select-none overflow-x-hidden relative">
      <AnimatePresence mode="wait">
        {currentView === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <LandingPage onNavigate={handleNavigate} />
          </motion.div>
        )}

        {currentView === "whatsapp" && (
          <motion.div
            key="whatsapp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <WhatsAppSimulator 
              onBack={() => handleNavigate("landing")} 
              onNavigateLender={() => handleNavigate("lender")}
            />
          </motion.div>
        )}

        {currentView === "lender" && (
          <motion.div
            key="lender animate"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="min-h-screen"
          >
            {loadingSession ? (
              <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto" />
                  <span className="text-xs text-slate-400">Restoring secure session...</span>
                </div>
              </div>
            ) : !currentUser ? (
              // Protected route gateway login
              <AuthPage onLoginSuccess={handleLoginSuccess} />
            ) : (
              // Authenticated Dashboard view
              <Dashboard 
                currentUser={currentUser}
                onLogout={handleLogout}
                onBack={() => handleNavigate("landing")} 
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Toast Notification Portal */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const styles = getToastStyles(toast.type);
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-sm ${styles.bg}`}
              >
                {styles.icon}
                <div className="flex-1 text-xs font-medium leading-relaxed">
                  {toast.message}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-white transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

