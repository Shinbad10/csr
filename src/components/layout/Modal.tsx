"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: any;
  maxWidth?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  headerStyle?: string;
  className?: string;
  bodyClassName?: string;
  closeOnOutsideClick?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  maxWidth = "max-w-[560px]",
  children,
  footer,
  noPadding = false,
  headerStyle,
  className = "",
  bodyClassName,
  closeOnOutsideClick = false,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!mounted) return null;

  const root = typeof document !== "undefined" ? document.getElementById("modal-root") : null;
  const target = root || (typeof document !== "undefined" ? document.body : null);

  if (!target) return null;

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={`fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-2 sm:p-3 md:p-4 pointer-events-auto ${className}`}
          onClick={closeOnOutsideClick ? onClose : undefined}
        >
          <motion.div
            key="modal-content"
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl w-full ${maxWidth} flex flex-col max-h-[92vh] overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Editorial Header */}
            {(title || Icon) && (
              <div className={`px-5 sm:px-6 py-4 sm:py-4.5 border-b border-[var(--line)] flex items-center justify-between shrink-0 ${headerStyle || "bg-white dark:bg-slate-900"}`}>
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 pr-2">
                  {Icon && (
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 3 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-white shadow-[var(--navy-shadow)] flex items-center justify-center shrink-0 border border-white/20"
                    >
                      <Icon className="w-5 h-5 text-[var(--teal)] stroke-[2.5]" />
                    </motion.div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-serif text-[18px] sm:text-[21px] font-bold text-[var(--ink)] leading-tight truncate">
                      {title}
                    </h2>
                    {subtitle && (
                      <div className="text-[12.5px] text-[var(--mute)] mt-0.5 font-medium">
                        {subtitle}
                      </div>
                    )}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--mute)] hover:text-[var(--ink)] transition-colors shrink-0 cursor-pointer"
                  title="Đóng (Esc)"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            )}

            {/* Body */}
            <div className={`flex-1 min-w-0 max-w-full ${bodyClassName || `${noPadding ? "" : "p-5 sm:p-6"} overflow-y-auto overflow-x-hidden`} bg-white dark:bg-slate-900`}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-[var(--line)] bg-[var(--surface-soft)] dark:bg-slate-950 flex items-center justify-end gap-2.5 shrink-0 flex-wrap">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, target);
}

