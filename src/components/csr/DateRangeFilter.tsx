"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarRange, ChevronDown, Check, RotateCcw } from "lucide-react";
import { DateField, usePortalPosition } from "@/components/csr/fields";

export type RangePreset =
  | "today"
  | "yesterday"
  | "7days"
  | "thisWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisQuarter"
  | "thisYear"
  | "all"
  | "custom";

export interface DateRange {
  /** YYYY-MM-DD — rỗng nghĩa là không giới hạn. */
  from: string;
  to: string;
  preset: RangePreset;
}

/* ── Tiện ích ngày theo giờ địa phương (không dùng toISOString để tránh lệch múi giờ) ── */
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const fmtDmy = (s: string) => {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

/** Tính khoảng ngày cho một lựa chọn nhanh. */
export function resolvePreset(preset: Exclude<RangePreset, "custom">): DateRange {
  const now = new Date();
  const today = iso(now);

  switch (preset) {
    case "today":
      return { from: today, to: today, preset };
    case "yesterday": {
      const y = iso(addDays(now, -1));
      return { from: y, to: y, preset };
    }
    case "7days":
      return { from: iso(addDays(now, -6)), to: today, preset };
    case "thisWeek": {
      // Tuần bắt đầu từ Thứ 2
      const dow = (now.getDay() + 6) % 7;
      return { from: iso(addDays(now, -dow)), to: today, preset };
    }
    case "thisMonth":
      return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: today, preset };
    case "lastMonth": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: iso(first), to: iso(last), preset };
    }
    case "thisQuarter": {
      const q = Math.floor(now.getMonth() / 3);
      return { from: iso(new Date(now.getFullYear(), q * 3, 1)), to: today, preset };
    }
    case "thisYear":
      return { from: iso(new Date(now.getFullYear(), 0, 1)), to: today, preset };
    case "all":
    default:
      return { from: "", to: "", preset: "all" };
  }
}

const PRESETS: { key: Exclude<RangePreset, "custom">; label: string; group: "ngay" | "tuan" | "thang" }[] = [
  { key: "today", label: "Hôm nay", group: "ngay" },
  { key: "yesterday", label: "Hôm qua", group: "ngay" },
  { key: "7days", label: "7 ngày qua", group: "ngay" },
  { key: "thisWeek", label: "Tuần này", group: "tuan" },
  { key: "thisMonth", label: "Tháng này", group: "thang" },
  { key: "lastMonth", label: "Tháng trước", group: "thang" },
  { key: "thisQuarter", label: "Quý này", group: "thang" },
  { key: "thisYear", label: "Năm nay", group: "thang" },
  { key: "all", label: "Tất cả", group: "thang" },
];

/** Nhãn hiển thị gọn trên nút. */
export function rangeLabel(r: DateRange): string {
  if (r.preset === "all" || (!r.from && !r.to)) return "Tất cả thời gian";
  if (r.from && r.to && r.from === r.to) return fmtDmy(r.from);
  return `${fmtDmy(r.from) || "…"} → ${fmtDmy(r.to) || "…"}`;
}

/** Tên lựa chọn nhanh đang áp dụng (dùng cho tooltip / nhãn phụ). */
export function presetLabel(r: DateRange): string {
  return PRESETS.find((x) => x.key === r.preset)?.label ?? "Tuỳ chọn";
}

/**
 * Bộ lọc khoảng thời gian: nút pill hiển thị khoảng đang chọn, mở ra popover
 * gồm các lựa chọn nhanh (ngày / tuần / tháng) và 2 ô chọn ngày tuỳ ý.
 */
export default function DateRangeFilter({
  value,
  onChange,
  className = "",
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(value.from);
  const [draftTo, setDraftTo] = useState(value.to);
  const ref = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const { ready, style, update } = usePortalPosition(open, ref, 420, 340);

  const label = useMemo(() => rangeLabel(value), [value]);

  const openPanel = () => {
    setDraftFrom(value.from);
    setDraftTo(value.to);
    setOpen(true);
    update(); // đo vị trí ngay, không đợi layout effect
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || popRef.current?.contains(t)) return;
      /* Lịch của DateField render bằng portal ra thẳng <body>, nằm NGOÀI popRef.
         Không loại trừ thì bấm chọn ngày sẽ đóng luôn cả bộ lọc. */
      if (t instanceof Element && t.closest('[data-portal-popover]')) return;
      setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const pick = (key: Exclude<RangePreset, "custom">) => {
    onChange(resolvePreset(key));
    setOpen(false);
  };

  const applyCustom = () => {
    if (!draftFrom && !draftTo) {
      onChange(resolvePreset("all"));
    } else {
      // Đảo chiều nếu người dùng chọn ngược
      const [f, t] = draftFrom && draftTo && draftFrom > draftTo ? [draftTo, draftFrom] : [draftFrom, draftTo];
      onChange({ from: f, to: t, preset: "custom" });
    }
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        title={`${presetLabel(value)} · ${label}`}
        className={`inline-flex h-9 w-full items-center gap-2 whitespace-nowrap rounded-lg border px-3 transition-colors ${
          open
            ? "border-[var(--navy)] bg-[var(--surface)] ring-2 ring-[var(--navy-100)]"
            : "border-[var(--line-strong)] bg-[var(--surface)] hover:border-[var(--navy)]"
        }`}
      >
        <CalendarRange className="h-3.5 w-3.5 shrink-0 text-[var(--navy)]" />

        {value.from && value.to ? (
          <span className="flex items-center gap-1.5 font-mono text-[12px] font-semibold tabular-nums text-[var(--ink)]">
            {fmtDmy(value.from)}
            {value.from !== value.to && (
              <>
                <span className="text-[var(--mute-soft)]">→</span>
                {fmtDmy(value.to)}
              </>
            )}
          </span>
        ) : (
          <span className="text-[12px] font-semibold text-[var(--ink-soft)]">Tất cả thời gian</span>
        )}

        <ChevronDown
          className={`ml-auto h-3.5 w-3.5 shrink-0 text-[var(--mute)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* AnimatePresence phải nằm TRONG portal — nó lọc children bằng isValidElement,
          mà createPortal(...) có $$typeof = react.portal nên sẽ bị loại, không render gì. */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && ready && (
            <motion.div
              key="daterange-pop"
              ref={popRef}
              data-portal-popover
              style={{ ...style, width: 340 }}
              initial={{ opacity: 0, scale: 0.97, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 4 }}
              transition={{ duration: 0.13, ease: "easeOut" }}
              className="overflow-hidden rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] shadow-2xl"
            >
              <div className="border-b border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--mute)]">
                  Lọc nhanh
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 p-3">
                {PRESETS.map((p) => {
                  const on = value.preset === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => pick(p.key)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
                        on
                          ? "border-[var(--navy)] bg-[var(--navy)] text-white"
                          : "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--ink-soft)] hover:border-[var(--navy)]/40 hover:text-[var(--navy)]"
                      }`}
                    >
                      {on && <Check className="h-3 w-3" strokeWidth={3} />}
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-[var(--line-soft)] px-3 py-3">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--mute)]">
                  Khoảng tuỳ chọn
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold text-[var(--ink-soft)]">Từ ngày</span>
                    <DateField value={draftFrom} onChange={setDraftFrom} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold text-[var(--ink-soft)]">Đến ngày</span>
                    <DateField value={draftTo} onChange={setDraftTo} min={draftFrom || undefined} />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setDraftFrom("");
                    setDraftTo("");
                    onChange(resolvePreset("all"));
                    setOpen(false);
                  }}
                  className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[var(--rose)] hover:underline"
                >
                  <RotateCcw className="h-3 w-3" /> Đặt lại
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="btn btn-secondary h-8 px-3 text-[11.5px] font-bold"
                  >
                    Huỷ
                  </button>
                  <button
                    type="button"
                    onClick={applyCustom}
                    className="btn btn-primary h-8 px-3.5 text-[11.5px] font-bold"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
