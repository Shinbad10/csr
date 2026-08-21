"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isCorporate as isCorporateRole } from "@/lib/permissions";

interface CoSo { id: string; ten: string }

function readCosoCookie(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.split("; ").find((r) => r.startsWith("selected_coso_id="));
  return m ? m.split("=")[1] : "";
}

interface FacilitySwitcherProps {
  className?: string;
  variant?: "dark" | "light";
}

/** Chọn cơ sở làm việc theo chuẩn VISIHUB org-switch */
export default function FacilitySwitcher({ className = "", variant = "dark" }: FacilitySwitcherProps) {
  const { data: session } = useSession();
  const [coSos, setCoSos] = useState<CoSo[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isCorporate = isCorporateRole(session?.user?.role || "");

  useEffect(() => {
    setIsMounted(true);
    setSelected(readCosoCookie());

    fetch("/api/csr/coso").then((r) => r.json()).then((data) => {
      if (!Array.isArray(data)) return;
      setCoSos(data);
      setSelected((cur) => {
        if (cur) return cur;
        const id = session?.user?.coSoId || data[0]?.id || "";
        if (id && typeof document !== "undefined") document.cookie = `selected_coso_id=${id}; path=/; max-age=31536000`;
        return id;
      });
    }).catch(() => {});
  }, [session]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", h);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("mousedown", h); window.removeEventListener("keydown", esc); };
  }, [open]);

  const onChange = (id: string) => {
    setSelected(id);
    document.cookie = `selected_coso_id=${id}; path=/; max-age=31536000`;
    window.location.reload();
  };

  const facilityName = isMounted
    ? (coSos.find((c) => c.id === (selected || session?.user?.coSoId))?.ten ?? (coSos.length > 0 ? coSos[0].ten : "Cơ sở làm việc"))
    : "Cơ sở làm việc";
  const isDark = variant === "dark";

  // Corporate: Có thể chuyển đổi cơ sở
  if (isCorporate && coSos.length > 0) {
    return (
      <div className={`relative ${className}`} ref={ref} suppressHydrationWarning>
        {/* Trigger Button - VISIHUB Style */}
        {isDark ? (
          /* Desktop Navy Topbar Style */
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            suppressHydrationWarning
            onClick={() => setOpen((v) => !v)}
            className={`w-full flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl border text-[12px] font-bold transition-all cursor-pointer select-none ${
              open
                ? "bg-white/20 border-white/35 text-white shadow-inner"
                : "bg-white/10 border-white/15 text-white hover:bg-white/15 hover:border-white/25"
            }`}
            title={facilityName}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1 text-left" suppressHydrationWarning>
              <div className="w-5.5 h-5.5 rounded-lg bg-[var(--teal)]/20 text-[var(--teal)] flex items-center justify-center shrink-0">
                <Building2 className="w-3 h-3" />
              </div>
              <span className="truncate text-white font-bold" suppressHydrationWarning>{facilityName}</span>
            </div>
            <div className="w-4.5 h-4.5 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <ChevronDown className={`w-3 h-3 text-white/80 transition-transform duration-200 ${open ? "rotate-180 text-white" : ""}`} />
            </div>
          </motion.button>
        ) : (
          /* Drawer Light Mobile Style - VISIHUB Org-switch */
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setOpen((v) => !v)}
            className={`w-full p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2.5 ${
              open
                ? "bg-white dark:bg-slate-800 border-[var(--teal)] shadow-sm ring-2 ring-[var(--teal)]/15"
                : "bg-white dark:bg-slate-800 border-[var(--line-strong)] dark:border-white/10 hover:border-[var(--teal)] shadow-2xs"
            }`}
            title={facilityName}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left" suppressHydrationWarning>
              <div className="w-7 h-7 rounded-lg bg-[var(--navy-50)] text-[var(--navy)] dark:text-[var(--teal)] flex items-center justify-center shrink-0 border border-[var(--navy-100)]">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0" suppressHydrationWarning>
                <div className="text-[12.5px] font-bold text-[var(--ink)] dark:text-white truncate leading-tight" suppressHydrationWarning>{facilityName}</div>
                <div className="text-[9.5px] font-mono font-bold text-[var(--teal-deep)] dark:text-[var(--teal)] uppercase tracking-wider mt-0.5">
                  Đang hoạt động
                </div>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-[var(--surface-soft)] dark:bg-slate-700 border border-[var(--line)] dark:border-white/10 flex items-center justify-center shrink-0">
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--mute)] transition-transform duration-200 ${open ? "rotate-180 text-[var(--teal-deep)]" : ""}`} />
            </div>
          </button>
        )}

        {/* Drawer Mobile: Inline Accordion Expansion */}
        <AnimatePresence>
          {!isDark && open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              suppressHydrationWarning
              className="mt-2 bg-white dark:bg-slate-800 border border-[var(--line-strong)] dark:border-white/10 rounded-2xl shadow-xs p-1.5 text-[var(--ink)] overflow-hidden"
            >
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--mute)] font-mono border-b border-[var(--line-soft)] dark:border-white/5 mb-1 flex items-center justify-between">
                <span>Đổi cơ sở làm việc</span>
                <span className="text-[9px] font-bold text-[var(--teal-deep)] dark:text-[var(--teal)] font-sans">{coSos.length} cơ sở</span>
              </div>
              <div className="space-y-1">
                {coSos.map((c) => {
                  const active = c.id === selected;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setOpen(false); onChange(c.id); }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-[12px] font-bold transition-all text-left cursor-pointer ${
                        active
                          ? "bg-gradient-to-r from-[var(--navy)] to-[var(--navy-deep)] text-white shadow-xs"
                          : "text-[var(--ink)] dark:text-slate-200 hover:bg-[var(--navy-50)] dark:hover:bg-slate-700 hover:text-[var(--navy)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                            active ? "bg-white/20 text-[var(--teal)]" : "bg-[var(--surface-soft)] dark:bg-slate-700 text-[var(--mute)]"
                          }`}
                        >
                          <Building2 className="w-3 h-3" />
                        </div>
                        <span className="truncate leading-snug">{c.ten}</span>
                      </div>
                      {active && <Check className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Topbar: Floating Popover */}
        <AnimatePresence>
          {isDark && open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 6 }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              suppressHydrationWarning
              className="absolute left-0 top-full mt-2 w-[290px] z-50 bg-white dark:bg-slate-900 border border-[var(--line-strong)] rounded-2xl shadow-2xl p-2 text-[var(--ink)]"
            >
              <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--mute)] font-mono border-b border-[var(--line-soft)] dark:border-white/5 mb-1.5 flex items-center justify-between">
                <span>Danh sách cơ sở</span>
                <span className="text-[9px] font-bold text-[var(--teal-deep)] font-sans">{coSos.length} cơ sở</span>
              </div>
              <div className="max-h-[240px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {coSos.map((c) => {
                  const active = c.id === selected;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setOpen(false); onChange(c.id); }}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] font-bold transition-all text-left cursor-pointer ${
                        active
                          ? "bg-gradient-to-r from-[var(--navy)] to-[var(--navy-deep)] text-white shadow-xs"
                          : "text-[var(--ink)] dark:text-slate-200 hover:bg-[var(--navy-50)] dark:hover:bg-slate-800 hover:text-[var(--navy)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                            active ? "bg-white/20 text-[var(--teal)]" : "bg-[var(--surface-soft)] dark:bg-slate-800 text-[var(--mute)] border border-[var(--line)] dark:border-white/10"
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{c.ten}</span>
                      </div>
                      {active && <Check className="w-4 h-4 text-[var(--teal)] shrink-0" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Non-corporate (chỉ xem)
  return isDark ? (
    <div
      suppressHydrationWarning
      className={`flex items-center gap-2 bg-white/10 text-white border border-white/15 rounded-xl px-3 py-1.5 text-[12.5px] font-bold shadow-xs ${className}`}
      title={facilityName}
    >
      <div className="w-6 h-6 rounded-lg bg-[var(--teal)]/20 text-[var(--teal)] flex items-center justify-center shrink-0">
        <Building2 className="w-3.5 h-3.5" />
      </div>
      <span className="truncate text-white" suppressHydrationWarning>{facilityName}</span>
    </div>
  ) : (
    <div
      suppressHydrationWarning
      className={`p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[var(--line-strong)] dark:border-white/10 shadow-2xs flex items-center gap-2.5 ${className}`}
      title={facilityName}
    >
      <div className="w-7 h-7 rounded-lg bg-[var(--navy-50)] text-[var(--navy)] dark:text-[var(--teal)] flex items-center justify-center shrink-0 border border-[var(--navy-100)]">
        <Building2 className="w-4 h-4" />
      </div>
      <div className="min-w-0" suppressHydrationWarning>
        <div className="text-[12.5px] font-bold text-[var(--ink)] dark:text-white truncate leading-tight" suppressHydrationWarning>{facilityName}</div>
        <div className="text-[9.5px] font-mono font-bold text-[var(--teal-deep)] dark:text-[var(--teal)] uppercase tracking-wider mt-0.5">
          Cơ sở trực thuộc
        </div>
      </div>
    </div>
  );
}

