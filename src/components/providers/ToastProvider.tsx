"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
}

const ToastCtx = createContext<{ addToast: (t: Omit<Toast, "id">) => void }>({ addToast: () => {} });
export const useToast = () => useContext(ToastCtx);

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info };
const ACCENT: Record<ToastType, { iconCls: string; borderCls: string; bgGlow: string }> = {
  success: {
    iconCls: "text-[var(--teal-deep)]",
    borderCls: "border-l-4 border-l-[var(--teal)]",
    bgGlow: "bg-[var(--teal-soft)]/50",
  },
  error: {
    iconCls: "text-[var(--rose)]",
    borderCls: "border-l-4 border-l-[var(--rose)]",
    bgGlow: "bg-[var(--rose-soft)]/50",
  },
  info: {
    iconCls: "text-[var(--navy)]",
    borderCls: "border-l-4 border-l-[var(--navy)]",
    bgGlow: "bg-[var(--navy-50)]/50",
  },
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastCtx.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 w-[360px] max-w-[calc(100vw-2.5rem)] pointer-events-none" suppressHydrationWarning>
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const Icon = ICON[t.type];
            const conf = ACCENT[t.type];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 40, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-[var(--line-strong)] ${conf.borderCls} rounded-xl shadow-xl p-3.5 flex items-start gap-3 relative overflow-hidden`}
              >
                <div className={`p-1.5 rounded-lg ${conf.bgGlow} shrink-0`}>
                  <Icon className={`w-4 h-4 ${conf.iconCls} stroke-[2.5]`} />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  {t.title && <div className="text-[13px] font-bold text-[var(--ink)] leading-snug">{t.title}</div>}
                  <div className="text-[12px] text-[var(--ink-soft)] leading-snug mt-0.5">{t.message}</div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="text-[var(--mute)] hover:text-[var(--ink)] p-1 rounded-md hover:bg-[var(--surface-hover)] transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

