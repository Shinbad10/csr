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
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-[var(--navy-ink)]/45 backdrop-blur-sm p-4 sm:p-6 pointer-events-auto animate-fade-in ${className}`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-[var(--r-xl)] border border-[var(--line)] shadow-[var(--shadow-lg)] w-full ${maxWidth} flex flex-col max-h-[86vh] overflow-hidden animate-scale-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Editorial Header */}
        {(title || Icon) && (
          <div className={`px-6 py-5 border-b border-[var(--line-soft)] flex items-center justify-between shrink-0 ${headerStyle || "bg-white"}`}>
            <div className="flex items-center gap-4 min-w-0 pr-4">
              {Icon && (
                <div className="w-11 h-11 rounded-[var(--r-md)] bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-white shadow-[var(--navy-shadow)] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[var(--teal)]" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-serif text-[22px] font-bold text-[var(--ink)] leading-tight truncate">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-[13px] text-[var(--mute)] mt-0.5 font-medium truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-[var(--r-md)] hover:bg-[var(--surface-hover)] text-[var(--mute)] hover:text-[var(--ink)] active:scale-95 transition-colors shrink-0"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={`flex-1 overflow-y-auto ${noPadding ? "" : "p-6"} bg-[var(--surface-bg)]`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[var(--line-soft)] bg-white flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, target);
}
