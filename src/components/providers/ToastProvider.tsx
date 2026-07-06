"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface Toast { id: number; type: ToastType; title?: string; message: string }

const ToastCtx = createContext<{ addToast: (t: Omit<Toast, "id">) => void }>({ addToast: () => {} });
export const useToast = () => useContext(ToastCtx);

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info };
const ACCENT: Record<ToastType, string> = {
  success: "text-[var(--teal-deep)]",
  error: "text-[var(--rose)]",
  info: "text-[var(--navy)]",
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
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 w-[340px] max-w-[calc(100vw-2.5rem)]">
        {toasts.map((t) => {
          const Icon = ICON[t.type];
          return (
            <div key={t.id} className="animate-fade-in bg-white border border-[var(--line)] rounded-[var(--r-md)] shadow-[var(--shadow-lg)] p-3.5 flex items-start gap-3">
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ACCENT[t.type]}`} />
              <div className="flex-1 min-w-0">
                {t.title && <div className="text-[13px] font-bold text-[var(--ink)]">{t.title}</div>}
                <div className="text-[12.5px] text-[var(--text-muted)] leading-snug">{t.message}</div>
              </div>
              <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} className="text-[var(--mute-soft)] hover:text-[var(--ink)] shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
