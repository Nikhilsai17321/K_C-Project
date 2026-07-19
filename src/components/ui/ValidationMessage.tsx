import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface ValidationMessageProps {
  message: string;
  type?: "error" | "success" | "info";
  className?: string;
}

export function ValidationMessage({ message, type = "error", className = "" }: ValidationMessageProps) {
  if (!message) return null;

  const config = {
    error: {
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
      textColor: "text-rose-400",
      icon: <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
    },
    success: {
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      textColor: "text-emerald-400",
      icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
    },
    info: {
      bgColor: "bg-sky-500/10",
      borderColor: "border-sky-500/20",
      textColor: "text-sky-400",
      icon: <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
    }
  }[type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor} ${config.textColor} text-[11px] font-medium leading-normal mt-1.5 shadow-sm ${className}`}
      >
        {config.icon}
        <span className="flex-1">{message}</span>
      </motion.div>
    </AnimatePresence>
  );
}
