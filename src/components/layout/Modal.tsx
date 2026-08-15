"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

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

  if (!mounted || !open) return null;

  const root = document.getElementById("modal-root");
  const target = root || document.body;

  const content = (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-[var(--navy-ink)]/50 backdrop-blur-md p-3 sm:p-6 pointer-events-auto animate-fade-in ${className}`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl border border-[var(--line-strong)] shadow-[var(--shadow-xl)] w-full ${maxWidth} flex flex-col max-h-[92vh] overflow-hidden animate-scale-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Editorial Header */}
        {(title || Icon) && (
          <div className={`px-5 sm:px-6 py-4 sm:py-4.5 border-b border-[var(--line)] flex items-center justify-between shrink-0 ${headerStyle || "bg-white"}`}>
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 pr-2">
              {Icon && (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-white shadow-[var(--navy-shadow)] flex items-center justify-center shrink-0 border border-white/20">
                  <Icon className="w-5 h-5 text-[var(--teal)] stroke-[2.5]" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-serif text-[18px] sm:text-[21px] font-bold text-[var(--ink)] leading-tight truncate">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-[12.5px] text-[var(--mute)] mt-0.5 font-medium truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--mute)] hover:text-[var(--ink)] active:scale-95 transition-all shrink-0 cursor-pointer"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={`flex-1 overflow-y-auto ${noPadding ? "" : "p-5 sm:p-6"} bg-white`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-[var(--line)] bg-[var(--surface-soft)] flex items-center justify-end gap-2.5 shrink-0 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, target);
}
