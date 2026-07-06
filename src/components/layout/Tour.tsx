"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ArrowLeft, ArrowRight, Check, MapPin } from "lucide-react";

export interface TourStep {
  /** CSS selector của phần tử cần khoanh sáng. Bỏ trống = bước giới thiệu ở giữa màn hình. */
  selector?: string;
  title: string;
  desc?: string;
}

interface Rect { top: number; left: number; width: number; height: number }

const CARD_W = 340;
const PAD = 8;

export default function Tour({
  steps,
  open,
  onClose,
  title,
}: {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
  title?: string;
}) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(190);

  useEffect(() => setMounted(true), []);
  useEffect(() => { if (open) setI(0); }, [open]);

  const step = steps[i];

  const measure = useCallback(() => {
    const sel = step?.selector;
    if (!sel) { setRect(null); return; }
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) { setRect(null); return; }
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // Cuộn phần tử vào giữa màn hình rồi đo lại
  useEffect(() => {
    if (!open || !step) return;
    const sel = step.selector;
    const el = sel ? (document.querySelector(sel) as HTMLElement | null) : null;
    if (el) el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    measure();
    const t1 = setTimeout(measure, 120);
    const t2 = setTimeout(measure, 360);
    const onWin = () => measure();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open, i, step, measure]);

  useEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [i, rect]);

  const next = useCallback(() => { if (i < steps.length - 1) setI(i + 1); else onClose(); }, [i, steps.length, onClose]);
  const prev = useCallback(() => { if (i > 0) setI(i - 1); }, [i]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev, onClose]);

  if (!open || !mounted || !step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Vị trí hộp thoại
  let cardStyle: React.CSSProperties;
  if (rect) {
    const spotTop = rect.top - PAD;
    const spotBottom = rect.top + rect.height + PAD;
    const roomBelow = vh - spotBottom;
    let top: number;
    if (roomBelow > cardH + 16) top = spotBottom + 12;
    else if (rect.top - PAD > cardH + 16) top = rect.top - PAD - cardH - 12;
    else top = Math.max(12, vh - cardH - 12);
    let left = rect.left + rect.width / 2 - CARD_W / 2;
    left = Math.min(Math.max(12, left), vw - CARD_W - 12);
    cardStyle = { position: "fixed", top, left, width: CARD_W };
  } else {
    cardStyle = { position: "fixed", top: "50%", left: "50%", width: CARD_W, transform: "translate(-50%,-50%)" };
  }

  const isLast = i === steps.length - 1;

  return createPortal(
    <div className="tour-root">
      {/* Lớp chặn tương tác + làm mờ nền khi không có mục tiêu */}
      <div
        className="fixed inset-0 z-[9997]"
        style={{ background: rect ? "transparent" : "rgba(2,6,23,0.55)" }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Khoanh sáng mục tiêu */}
      {rect && (
        <div
          className="fixed z-[9998] pointer-events-none rounded-[10px] transition-all duration-200"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(2,6,23,0.55), 0 0 0 2px var(--teal)",
          }}
        />
      )}

      {/* Hộp thoại */}
      <div
        ref={cardRef}
        style={cardStyle}
        className="z-[9999] max-w-[calc(100vw-1.5rem)] bg-white border border-[var(--line)] rounded-[var(--r-lg)] shadow-[var(--shadow-lg)] overflow-hidden animate-fade-in"
      >
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--navy)]">
            <MapPin className="w-3.5 h-3.5 text-[var(--teal-deep)]" /> {title || "Hướng dẫn"}
          </span>
          <button onClick={onClose} className="p-1 rounded-[var(--r-sm)] text-[var(--mute)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]" title="Đóng hướng dẫn">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 w-[22px] h-[22px] rounded-full bg-[var(--navy)] text-white flex items-center justify-center shrink-0 font-mono text-[11px] font-bold shadow-2xs">
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-[var(--ink)] leading-snug">{step.title}</div>
              {step.desc && <div className="text-[12.5px] font-medium text-[var(--mute)] mt-1 leading-relaxed">{step.desc}</div>}
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="px-4 flex items-center gap-1">
          {steps.map((_, idx) => (
            <span key={idx} className={`h-1 rounded-full transition-all ${idx === i ? "w-4 bg-[var(--navy)]" : "w-1.5 bg-[var(--line-strong)]"}`} />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3 mt-2 border-t border-[var(--line-soft)] bg-[var(--surface-soft)]">
          <span className="text-[11.5px] font-semibold text-[var(--mute)] font-mono">{i + 1} / {steps.length}</span>
          <div className="flex items-center gap-2">
            {i > 0 && (
              <button onClick={prev} className="btn btn-secondary px-3 py-1.5 text-[12.5px] font-bold h-8 rounded-[var(--r-sm)] border border-[var(--line)]">
                <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
              </button>
            )}
            <button onClick={next} className="btn btn-primary px-4 py-1.5 text-[12.5px] font-bold h-8 rounded-[var(--r-sm)]">
              {isLast ? <><Check className="w-3.5 h-3.5 text-[var(--teal)]" /> Xong</> : <>Tiếp <ArrowRight className="w-3.5 h-3.5 text-[var(--teal)]" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
