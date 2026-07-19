import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const AlertDialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

export function useAlertDialog() {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error("AlertDialog components must be rendered within an AlertDialog");
  }
  return context;
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Background Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => onOpenChange(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            {children}
          </div>
        )}
      </AnimatePresence>
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { onOpenChange } = useAlertDialog();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`relative z-50 w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl ${className}`}
    >
      <button
        onClick={() => onOpenChange(false)}
        className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
      >
        <X className="w-4 h-4" />
      </button>
      {children}
    </motion.div>
  );
}

export function AlertDialogHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`space-y-2 text-left ${className}`}>{children}</div>;
}

export function AlertDialogTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-base font-semibold tracking-tight text-white flex items-center gap-2 ${className}`}>
      {children}
    </h3>
  );
}

export function AlertDialogDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs text-slate-400 leading-relaxed ${className}`}>{children}</p>;
}

export function AlertDialogFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 ${className}`}>
      {children}
    </div>
  );
}

export function AlertDialogCancel({ 
  children, 
  onClick,
  className = "" 
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
}) {
  const { onOpenChange } = useAlertDialog();
  const handleCancel = () => {
    if (onClick) onClick();
    onOpenChange(false);
  };
  return (
    <button
      type="button"
      onClick={handleCancel}
      className={`h-9 px-4 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition-all ${className}`}
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({ 
  children, 
  onClick,
  className = "" 
}: { 
  children: React.ReactNode; 
  onClick: () => void;
  className?: string;
}) {
  const { onOpenChange } = useAlertDialog();
  const handleAction = () => {
    onClick();
    onOpenChange(false);
  };
  return (
    <button
      type="button"
      onClick={handleAction}
      className={`h-9 px-4 rounded-xl text-xs font-semibold text-white shadow-sm transition-all ${className}`}
    >
      {children}
    </button>
  );
}
