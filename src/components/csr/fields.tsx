"use client";

import { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Check, CalendarDays, X, ChevronLeft, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const labelCls = "block text-[11px] sm:text-[12px] font-bold text-[var(--ink-soft)] mb-1";

export interface PortalPos {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

/** Vị trí popup dạng portal: tự lật lên trên khi không đủ chỗ bên dưới,
 *  và tự canh lề ngang (left) để không bao giờ bị tràn khỏi màn hình. */
export function usePortalPosition(
  open: boolean, 
  ref: React.RefObject<HTMLElement | null>, 
  dropdownHeight: number = 280,
  minWidth?: number
) {
  const [pos, setPos] = useState<PortalPos | null>(null);

  const calculate = useCallback((): PortalPos | null => {
    if (!ref.current) return null;
    const rect = ref.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
    
    // Chiều rộng hiệu dụng
    const effectiveWidth = minWidth ? Math.max(rect.width, minWidth) : rect.width;
    
    // Canh lề ngang an toàn, tránh tràn mép phải hoặc trái màn hình
    const margin = 8;
    let left = rect.left;
    if (left + effectiveWidth > viewportWidth - margin) {
      left = Math.max(margin, viewportWidth - effectiveWidth - margin);
    }
    if (left < margin) {
      left = margin;
    }

    if (openUp) {
      const availableHeight = Math.max(140, Math.min(dropdownHeight, spaceAbove - 16));
      return { 
        bottom: viewportHeight - rect.top + 4, 
        left, 
        width: effectiveWidth,
        maxHeight: availableHeight,
      };
    } else {
      const availableHeight = Math.max(140, Math.min(dropdownHeight, spaceBelow - 16));
      return { 
        top: rect.bottom + 4, 
        left, 
        width: effectiveWidth,
        maxHeight: availableHeight,
      };
    }
  }, [dropdownHeight, minWidth, ref]);

  const update = useCallback(() => {
    const p = calculate();
    if (p) setPos(p);
  }, [calculate]);

  useLayoutEffect(() => {
    if (open) {
      update();
    }
  }, [open, update]);

  useEffect(() => {
    if (!open) return;
    const handleScrollOrResize = () => update();
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, update]);

  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: 99999,
    ...(pos?.top !== undefined ? { top: pos.top } : {}),
    ...(pos?.bottom !== undefined ? { bottom: pos.bottom } : {}),
    left: pos?.left ?? 0,
    width: pos?.width ?? "auto",
    maxHeight: pos?.maxHeight ?? dropdownHeight,
  };

  return {
    pos,
    style,
    ready: !!pos,
    update,
  };
}

export function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1">
        <span className="block text-[11.5px] font-semibold text-[var(--ink-soft)]">
          {label} {required && <span className="text-[var(--rose)] font-bold">*</span>}
        </span>
        {hint && <span className="text-[11px] text-[var(--mute)] font-normal">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export function SectionHeader({ n, accent }: { n: number; accent: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-[var(--line-soft)]">
      <span className="w-6 h-6 rounded-[7px] bg-[var(--navy-50)] text-[var(--navy)] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
        {String(n).padStart(2, "0")}
      </span>
      <h3 className="font-serif text-[14.5px] sm:text-[15.5px] font-semibold tracking-[-0.01em] text-[var(--ink)]">{accent}</h3>
    </div>
  );
}

export function Select({ label, value, onChange, opts, req, mono = true, placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void; opts: readonly string[]; req?: boolean; mono?: boolean; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-70 pointer-events-none" : ""}>
      <label className={labelCls}>{label} {req && <span className="text-[var(--rose)]">*</span>}</label>
      <Dropdown value={value} onChange={onChange} options={opts} mono={mono} placeholder={placeholder} disabled={disabled} />
    </div>
  );
}

// Dropdown tùy biến theo design system (thay <select> mặc định của trình duyệt).
export function Dropdown({ value, onChange, options, placeholder = "Chọn…", mono, labels, disabled }: {
  value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string; mono?: boolean; labels?: Record<string, string>; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const disp = (o: string) => (o ? labels?.[o] ?? o : placeholder);
  const { ready, style, update } = usePortalPosition(open, ref, 280);

  const toggle = () => {
    if (disabled) return;
    const next = !open;
    setOpen(next);
    if (next) update();
  };

  useEffect(() => {
    if (!open) { setSearch(""); return; }
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current && ref.current.contains(target)) return;
      if (popupRef.current && popupRef.current.contains(target)) return;
      setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", h);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", h);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const showSearch = options.length > 8;
  const filtered = showSearch && search.trim()
    ? options.filter((o) => (labels?.[o] ?? o).toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`input-field flex items-center justify-between gap-2 text-left w-full cursor-pointer select-none h-10 text-[13px] px-3 transition-colors ${open ? "border-[var(--navy)] ring-2 ring-[var(--navy-100)]" : ""} ${disabled ? "bg-[var(--surface-bg)] text-[var(--mute)] cursor-not-allowed" : ""}`}
      >
        <span className={`${value ? `text-[var(--ink)] font-medium ${mono && !labels ? "font-mono" : ""}` : "text-[var(--mute-soft)]"} truncate`}>
          {value ? disp(value) : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-[var(--mute)] transition-transform duration-200 ${open ? "rotate-180 text-[var(--navy)]" : ""}`} />
      </button>
      {/* AnimatePresence phải nằm TRONG portal: nó lọc children bằng isValidElement,
          mà createPortal(...) trả về $$typeof = react.portal nên bị loại sạch → không render gì. */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && ready && (
          <motion.div
            key="dropdown-pop"
            ref={popupRef} data-portal-popover
            style={style}
            initial={{ opacity: 0, scale: 0.98, y: 3 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 3 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-1 text-[12.5px] overflow-hidden"
          >
            {showSearch && (
              <div className="p-1.5 border-b border-[var(--line)] mb-1">
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm nhanh..."
                  className="w-full px-2.5 py-1 text-[12px] rounded-lg bg-[var(--surface-bg)] border border-transparent outline-none focus:bg-white focus:border-[var(--navy)] transition-all"
                />
              </div>
            )}
            <div className="overflow-y-auto flex-1 p-0.5 space-y-0.5 custom-scrollbar max-h-[240px]">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-center text-xs text-[var(--mute)]">Không tìm thấy kết quả</div>
              ) : (
                filtered.map((o) => {
                  const isSelected = value === o;
                  return (
                    <button 
                      key={o || "__empty"} 
                      type="button" 
                      onClick={() => { onChange(o); setOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected ? "bg-[var(--navy-50)] text-[var(--navy)] font-bold" : "text-[var(--ink-soft)] dark:text-slate-200 hover:bg-[var(--surface-hover)] dark:hover:bg-slate-800 hover:text-[var(--ink)]"} ${mono && o && !labels ? "font-mono" : ""}`}
                    >
                      <span className={o ? "truncate" : "text-[var(--mute-soft)]"}>{disp(o)}</span>
                      {isSelected && o && <Check className="w-4 h-4 shrink-0 text-[var(--teal-deep)] stroke-[2.5]" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}


const MONTH_SHORT = ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];

/**
 * Định dạng dd/mm/yyyy từ NỘI DUNG ô (không dựa vào từng phím): chạy đúng cả khi bật bộ gõ tiếng Việt
 * (Unikey/EVKey gửi phím "Process" thay vì chữ số), bàn phím điện thoại và khi dán.
 *  - Gõ liền chữ số: 06031952 → 06/03/1952 (tự chèn dấu /).
 *  - Gõ kèm dấu phân cách (/ - . khoảng trắng): 6/3/1952 → 06/03/1952 (tự thêm số 0).
 *  - Xoá lùi tự nhiên: dấu / chỉ hiện khi đã có chữ số phía sau (hoặc người dùng vừa gõ dấu phân cách).
 */
function formatDateText(raw: string): string {
  const segs: string[] = [""];
  for (const ch of raw) {
    const last = segs.length - 1;
    if (/\d/.test(ch)) {
      const limit = segs.length < 3 ? 2 : 4;
      if (segs[last].length < limit) segs[last] += ch;
      else if (segs.length < 3) segs.push(ch);
    } else if (segs[last].length > 0 && segs.length < 3) {
      if (segs[last].length === 1) segs[last] = "0" + segs[last];
      segs.push("");
    }
  }
  return segs.join("/");
}

/** Vị trí con trỏ sau khi định dạng: giữ sau đúng số chữ số đứng trước con trỏ cũ. */
function caretAfterFormat(raw: string, rawCaret: number, formatted: string): number {
  if (rawCaret >= raw.length) return formatted.length;
  const digitsBefore = raw.slice(0, rawCaret).replace(/\D/g, "").length;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (seen === digitsBefore) return formatted[i] === "/" && /\D/.test(raw[rawCaret - 1] || "") ? i + 1 : i;
    if (/\d/.test(formatted[i])) seen++;
  }
  return formatted.length;
}

function parseDateInput(str: string): { iso: string; dmy: string; date: Date } | null {
  const m = str.trim().match(/^(\d{1,2})\D+(\d{1,2})\D+(\d{4})$/) || str.trim().match(/^(\d{2})(\d{2})(\d{4})$/);
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const y = parseInt(m[3], 10);
  if (y < 1900 || y > 2100) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  const iso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { iso, dmy: `${String(d).padStart(2, "0")}/${String(mo).padStart(2, "0")}/${y}`, date: dt };
}

const isoOf = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const localTodayIso = () => {
  const d = new Date();
  return isoOf(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * Ô ngày dd/mm/yyyy: gõ trực tiếp (định dạng tự động) hoặc chọn qua lịch 3 cấp Ngày → Tháng → Năm
 * (bấm tiêu đề lịch để chuyển cấp). `birth`: ô ngày sinh — mở thẳng bảng năm, không cho chọn ngày tương lai.
 */
export function DateField({
  label,
  value,
  onChange,
  min,
  max,
  birth = false,
  placeholder = "dd/mm/yyyy",
  disabled,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  /** Ô ngày sinh: lịch mở ở bảng năm, chặn ngày tương lai, ẩn nút "Hôm nay" */
  birth?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  const todayStr = localTodayIso();
  const maxDate = max || (birth ? todayStr : undefined);

  const [open, setOpen] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const composing = useRef(false);

  const toDmy = useCallback((iso: string) => {
    if (!iso) return "";
    const p = iso.slice(0, 10).split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
  }, []);

  const [text, setText] = useState(() => (value ? toDmy(value) : ""));
  useEffect(() => {
    setText(value ? toDmy(value) : "");
    setIsInvalid(false);
  }, [value, toDmy]);

  /** Ngày hợp lệ và nằm trong [min, max]? */
  const inRange = useCallback((iso: string) => (!min || iso >= min) && (!maxDate || iso <= maxDate), [min, maxDate]);

  // Lịch: tháng/năm đang xem + cấp xem (ngày / tháng / năm)
  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  });
  const [view, setView] = useState<"day" | "month" | "year">("day");

  const { ready, style: portalStyle, update: updatePos } = usePortalPosition(open, ref, 340, 280);

  const openCalendar = () => {
    const d = value ? new Date(value) : null;
    if (d && !isNaN(d.getTime())) {
      setViewDate(d);
      setView("day");
    } else if (birth) {
      setViewDate(new Date(1960, 0, 1)); // phần lớn bệnh nhân tầm soát sinh khoảng 1940–1975
      setView("year");
    } else {
      setViewDate(new Date());
      setView("day");
    }
    setOpen(true);
    updatePos();
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && (!popupRef.current || !popupRef.current.contains(e.target as Node))) {
        setOpen(false);
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", h);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", h);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  /** Nhận nội dung ô (đã định dạng): đủ ngày thì kiểm tra & báo ra ngoài. */
  const applyText = (formatted: string) => {
    setText(formatted);
    const parsed = /^\d{2}\/\d{2}\/\d{4}$/.test(formatted) ? parseDateInput(formatted) : null;
    if (parsed && inRange(parsed.iso)) {
      setIsInvalid(false);
      setViewDate(parsed.date);
      if (parsed.iso !== value) onChange(parsed.iso);
    } else {
      // Đủ 8 số mà ngày không tồn tại / ngoài giới hạn → báo đỏ ngay; chưa đủ thì chờ gõ tiếp
      setIsInvalid(formatted.replace(/\D/g, "").length === 8);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (composing.current) {
      setText(raw); // đang soạn bằng bộ gõ — để yên, định dạng khi soạn xong
      return;
    }
    const caret = e.target.selectionStart ?? raw.length;
    const formatted = formatDateText(raw);
    applyText(formatted);
    const pos = caretAfterFormat(raw, caret, formatted);
    requestAnimationFrame(() => {
      if (document.activeElement === inputRef.current) inputRef.current?.setSelectionRange(pos, pos);
    });
  };

  const handleBlur = () => {
    const digits = text.replace(/\D/g, "");
    if (!digits) {
      setText("");
      setIsInvalid(false);
      if (value) onChange("");
      return;
    }
    const parsed = parseDateInput(text);
    if (parsed && inRange(parsed.iso)) {
      setText(parsed.dmy);
      setIsInvalid(false);
      if (parsed.iso !== value) onChange(parsed.iso);
      return;
    }
    // Chưa đủ / sai: giữ chữ để người dùng sửa, báo đỏ và KHÔNG giữ ngày cũ (tránh lưu nhầm ngày cũ)
    setIsInvalid(true);
    if (value) onChange("");
  };

  const selectDate = (iso: string) => {
    onChange(iso);
    setText(toDmy(iso));
    setIsInvalid(false);
    setOpen(false);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const yearPageStart = year - (year % 12);
  const minYear = min ? Number(min.slice(0, 4)) : 1900;
  const maxYear = maxDate ? Number(maxDate.slice(0, 4)) : 2100;

  const step = (delta: number) => {
    if (view === "day") setViewDate(new Date(year, month + delta, 1));
    else if (view === "month") setViewDate(new Date(year + delta, month, 1));
    else setViewDate(new Date(year + delta * 12, month, 1));
  };

  const headerLabel =
    view === "day" ? `Tháng ${month + 1}, ${year}` : view === "month" ? String(year) : `${yearPageStart} – ${yearPageStart + 11}`;
  const cellBase = "rounded-[8px] flex items-center justify-center font-mono transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30";
  const cellIdle = "text-[var(--ink)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)]";
  const cellOn = "bg-[var(--navy)] text-white font-bold shadow-[var(--navy-shadow)]";

  return (
    <div className={`relative ${disabled ? "opacity-70 pointer-events-none" : ""}`} ref={ref}>
      {label && <label className={labelCls}>{label}</label>}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={text}
          onChange={handleChange}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={(e) => {
            composing.current = false;
            applyText(formatDateText(e.currentTarget.value));
          }}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleBlur();
              setOpen(false);
            } else if (e.key === "ArrowDown" && !open) {
              e.preventDefault();
              openCalendar();
            }
          }}
          disabled={disabled}
          maxLength={10}
          placeholder={placeholder}
          title={isInvalid ? "Ngày không hợp lệ hoặc ngoài khoảng cho phép" : "Gõ liền ddmmyyyy (VD: 06031952) hoặc chọn trên lịch"}
          className={`input-field font-mono text-[12px] pr-8 h-8 w-full tracking-wider transition-colors ${
            isInvalid
              ? "border-[var(--rose)] text-[var(--rose)] ring-2 ring-[var(--rose)]/20 bg-[var(--rose-soft)]"
              : open
              ? "border-[var(--navy)] ring-2 ring-[var(--navy-100)]"
              : ""
          } ${disabled ? "bg-[var(--surface-soft)] text-[var(--mute)]" : "bg-[var(--surface)] text-[var(--ink)]"}`}
        />
        <button
          type="button"
          onClick={() => !disabled && (open ? setOpen(false) : openCalendar())}
          disabled={disabled}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-[6px] text-[var(--mute)] hover:text-[var(--navy)] hover:bg-[var(--navy-50)] transition-colors cursor-pointer"
          title="Mở lịch chọn ngày"
        >
          <CalendarDays className={`w-3.5 h-3.5 ${isInvalid ? "text-[var(--rose)]" : value ? "text-[var(--navy)]" : ""}`} />
        </button>
      </div>

      {open && ready && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popupRef}
            data-portal-popover
            style={{ ...portalStyle, width: 280 }}
            className="bg-[var(--surface)] border border-[var(--line-strong)] rounded-[14px] shadow-[var(--shadow-lg)] p-2.5 animate-dropdown select-none flex flex-col overflow-hidden"
          >
            {/* Tiêu đề: ‹  [Tháng 10, 2026 ▾]  › — bấm tiêu đề để lên cấp tháng / năm */}
            <div className="flex items-center justify-between gap-1 pb-2 mb-2 border-b border-[var(--line-soft)]">
              <button type="button" onClick={() => step(-1)} className="w-7 h-7 flex items-center justify-center rounded-[8px] text-[var(--ink-soft)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)] cursor-pointer" title="Trước">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setView(view === "day" ? "month" : "year")}
                disabled={view === "year"}
                className="inline-flex items-center gap-1 px-2.5 h-7 rounded-[8px] text-[12.5px] font-bold text-[var(--navy)] hover:bg-[var(--navy-50)] cursor-pointer disabled:cursor-default disabled:hover:bg-transparent"
                title={view === "year" ? undefined : view === "day" ? "Chọn tháng" : "Chọn năm"}
              >
                <span className="font-mono">{headerLabel}</span>
                {view !== "year" && <ChevronDown className="w-3.5 h-3.5 text-[var(--mute)]" />}
              </button>
              <button type="button" onClick={() => step(1)} className="w-7 h-7 flex items-center justify-center rounded-[8px] text-[var(--ink-soft)] hover:bg-[var(--navy-50)] hover:text-[var(--navy)] cursor-pointer" title="Sau">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {view === "year" && (
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 12 }).map((_, i) => {
                  const y = yearPageStart + i;
                  const on = value ? Number(value.slice(0, 4)) === y : false;
                  return (
                    <button
                      key={y}
                      type="button"
                      disabled={y < minYear || y > maxYear}
                      onClick={() => {
                        setViewDate(new Date(y, month, 1));
                        setView("month");
                      }}
                      className={`${cellBase} h-10 text-[13px] ${on ? cellOn : cellIdle}`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}

            {view === "month" && (
              <div className="grid grid-cols-3 gap-1.5">
                {MONTH_SHORT.map((name, i) => {
                  const on = value ? value.slice(0, 7) === `${year}-${String(i + 1).padStart(2, "0")}` : false;
                  const lastOfMonth = isoOf(year, i, new Date(year, i + 1, 0).getDate());
                  const out = (min && lastOfMonth < min) || (maxDate && isoOf(year, i, 1) > maxDate);
                  return (
                    <button
                      key={name}
                      type="button"
                      disabled={Boolean(out)}
                      onClick={() => {
                        setViewDate(new Date(year, i, 1));
                        setView("day");
                      }}
                      className={`${cellBase} h-10 text-[12.5px] font-sans font-semibold ${on ? cellOn : cellIdle}`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            )}

            {view === "day" && (
              <>
                <div className="grid grid-cols-7 gap-0.5 mb-1 text-center text-[10px] font-extrabold tracking-wider text-[var(--mute)]">
                  {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d, i) => (
                    <div key={d} className={`py-0.5 ${i === 0 ? "text-[var(--rose)]" : ""}`}>
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`p${i}`} className="h-7 flex items-center justify-center text-[11px] font-mono text-[var(--mute-soft)]">
                      {prevMonthDays - firstDay + i + 1}
                    </div>
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d = i + 1;
                    const iso = isoOf(year, month, d);
                    const on = value === iso;
                    const isToday = todayStr === iso;
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={!inRange(iso)}
                        onClick={() => selectDate(iso)}
                        className={`${cellBase} h-7 text-[12px] ${
                          on
                            ? cellOn
                            : isToday
                            ? "border border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--teal-deep)] font-bold"
                            : cellIdle
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Chân popup */}
            <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-[var(--line-soft)] -mx-2.5 -mb-2.5 px-2.5 py-1.5 bg-[var(--surface-soft)] text-[11.5px]">
              {birth ? (
                <span className="text-[10.5px] text-[var(--mute)] truncate">
                  Gõ nhanh: <b className="font-mono text-[var(--ink-soft)]">06031952</b>
                </span>
              ) : (
                <button
                  type="button"
                  disabled={!inRange(todayStr)}
                  onClick={() => selectDate(todayStr)}
                  className="inline-flex items-center gap-1 font-bold text-[var(--teal-deep)] px-1.5 py-0.5 rounded-[6px] hover:bg-[var(--teal-soft)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3 h-3 text-[var(--teal)]" /> Hôm nay
                </button>
              )}
              <div className="flex items-center gap-1 shrink-0">
                {value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setText("");
                      setIsInvalid(false);
                      setOpen(false);
                    }}
                    className="font-semibold text-[var(--rose)] px-1.5 py-0.5 rounded-[6px] hover:bg-[var(--rose-soft)] cursor-pointer"
                  >
                    Xoá
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="font-semibold text-[var(--mute)] hover:text-[var(--ink)] px-2 py-0.5 rounded-[6px] hover:bg-[var(--line-soft)] cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// Combobox cho phép nhập text tự do và chọn từ danh sách gợi ý
export function Combobox({ value, onChange, options, placeholder, disabled }: { value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string; disabled?: boolean; }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const { ready, style } = usePortalPosition(open, ref, 200);
  
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current && ref.current.contains(t)) return;
      if (popupRef.current && popupRef.current.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [open]);

  const filtered = options.filter(o => o.toLowerCase().includes(value.toLowerCase()));
  const exactMatch = options.some(o => o.toLowerCase() === value.trim().toLowerCase());
  const showAdd = value.trim() !== "" && !exactMatch;

  return (
    <div className={`relative ${disabled ? "opacity-70 pointer-events-none" : ""}`} ref={ref}>
      <div className="relative">
        <input 
          value={value} 
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => !disabled && setOpen(true)}
          disabled={disabled}
          className={`input-field w-full pr-8 ${open ? "border-[var(--navy)] ring-2 ring-[var(--navy-100)]" : ""} ${disabled ? "bg-[var(--surface-bg)] text-[var(--mute)]" : ""}`} 
          placeholder={placeholder} 
        />
        <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)] pointer-events-none transition-transform duration-200 ${open ? "rotate-180 text-[var(--navy)]" : ""}`} />
      </div>
      {open && ready && typeof document !== "undefined" && createPortal(
        <div ref={popupRef} data-portal-popover style={style} className="overflow-y-auto bg-white border border-[var(--line-strong)] rounded-[var(--r-md)] shadow-[var(--shadow-xl)] p-1 animate-dropdown">
          {options.length === 0 && !showAdd && (
            <div className="px-3 py-2.5 text-[12.5px] text-[var(--mute)] text-center">Chưa có điểm đón nào.<br/>Nhập để tạo mới.</div>
          )}
          {filtered.map(o => (
            <button key={o} type="button" onMouseDown={(e) => { e.preventDefault(); onChange(o); setOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-[var(--r-sm)] text-[13px] text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] cursor-pointer">
              {o}
            </button>
          ))}
          {showAdd && (
            <button type="button" onMouseDown={(e) => { e.preventDefault(); onChange(value.trim()); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--r-sm)] text-[13px] font-semibold text-[var(--teal-deep)] bg-[var(--teal-soft)] hover:bg-[var(--teal)] hover:text-white transition-colors cursor-pointer">
              <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[11px] shrink-0 font-black">+</span> 
              Thêm: &quot;{value.trim()}&quot;
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// Chọn 1 (Có/Không, hướng xử trí…) — segmented control kiểu ERP: rãnh xám nhạt, mục đang chọn là ô trắng
// chữ navy. Ít "nhiễu" hơn hàng nút viền khi trên một trang có nhiều nhóm lựa chọn.
export function ChoiceRow({ options, value, onChange, render, disabled }: {
  options: readonly string[]; value: string; onChange: (v: string) => void; render?: (o: string) => string; disabled?: boolean;
}) {
  return (
    <div
      className={`inline-flex flex-wrap gap-0.5 p-0.5 rounded-[10px] bg-[var(--surface-soft)] border border-[var(--line)] ${
        disabled ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {options.map((o) => {
        const on = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => !disabled && onChange(on ? "" : o)}
            disabled={disabled}
            className={`h-7 sm:h-8 px-3 sm:px-3.5 rounded-[8px] text-[11.5px] sm:text-[12px] transition-all cursor-pointer select-none ${
              on
                ? "bg-[var(--navy)] text-white font-semibold shadow-[var(--navy-shadow)]"
                : "text-[var(--ink-soft)] font-semibold hover:text-[var(--ink)]"
            }`}
          >
            {render ? render(o) : o}
          </button>
        );
      })}
    </div>
  );
}

// Pill chọn nhiều (chẩn đoán)
export function PillGroup({ options, selected, onToggle, disabled }: {
  options: readonly string[]; selected: string[]; onToggle: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-1 sm:gap-1.5 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => !disabled && onToggle(o)}
            disabled={disabled}
            className={`inline-flex items-center gap-1 h-7 sm:h-8 px-2.5 sm:px-3 rounded-full text-[11px] sm:text-[12px] font-semibold border transition-colors cursor-pointer select-none active:scale-[0.98] ${
              on
                ? "bg-[var(--amber-soft)] text-[var(--amber-deep)] border-[var(--amber)]/60"
                : "bg-[var(--surface)] border-[var(--line-strong)] text-[var(--ink-soft)] hover:border-[var(--amber)]/50 hover:text-[var(--amber-deep)]"
            }`}
          >
            {o}{on && !disabled && <X className="w-3 h-3 opacity-80 hover:opacity-100" />}
          </button>
        );
      })}
    </div>
  );
}

/** Select box chọn nhiều — dùng cho danh mục dài (mã ICD…) mà pill hiển thị không xuể. */
export function MultiSelect({ options, selected, onToggle, disabled, placeholder = "Chọn…", searchPlaceholder = "Tìm nhanh…" }: {
  options: readonly string[]; selected: string[]; onToggle: (v: string) => void;
  disabled?: boolean; placeholder?: string; searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const { ready, style } = usePortalPosition(open, ref, 320);
  const close = useCallback(() => { setOpen(false); setQ(""); }, []);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || popupRef.current?.contains(t)) return;
      close();
    };
    const esc = (e: KeyboardEvent) => { if (e.isComposing || e.keyCode === 229) return; if (e.key === "Escape") close(); };
    window.addEventListener("mousedown", h); window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("mousedown", h); window.removeEventListener("keydown", esc); };
  }, [open, close]);

  const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
  const filtered = q.trim() ? options.filter((o) => fold(o).includes(fold(q))) : options;

  return (
    <div className={`relative ${disabled ? "opacity-60 pointer-events-none" : ""}`} ref={ref}>
      <button type="button" disabled={disabled} onClick={() => (open ? close() : setOpen(true))}
        className={`input-field flex items-center justify-between gap-2 text-left w-full cursor-pointer select-none ${open ? "border-[var(--navy)] ring-2 ring-[var(--navy-100)]" : ""}`}>
        <span className={`truncate ${selected.length ? "text-[var(--ink)] font-semibold" : "text-[var(--mute-soft)]"}`}>
          {selected.length ? `Đã chọn ${selected.length} mục` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-[var(--mute)] transition-transform duration-200 ${open ? "rotate-180 text-[var(--navy)]" : ""}`} />
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[var(--gold-soft)] border border-[var(--gold-line)] text-[var(--gold-deep)] animate-fade-in">
              <span className="min-w-0">{v}</span>
              {!disabled && (
                <button type="button" onClick={() => onToggle(v)} title="Bỏ chọn" className="shrink-0 opacity-55 hover:opacity-100 transition-opacity cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && ready && !disabled && (
          <motion.div
            key="multiselect-pop"
            ref={popupRef} data-portal-popover
            style={style}
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="fixed z-[99999] flex flex-col max-h-[300px] bg-white dark:bg-slate-900 border border-[var(--line-strong)] rounded-xl shadow-2xl"
          >
            <div className="p-1.5 border-b border-[var(--line-soft)] shrink-0">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder}
                className="w-full px-2.5 py-1.5 text-[13px] rounded-lg bg-[var(--surface-bg)] border border-transparent outline-none focus:bg-white focus:border-[var(--navy)] transition-colors" />
            </div>
            <div className="overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="px-3 py-3 text-[12.5px] text-[var(--mute)] text-center italic">Không có mục nào khớp</div>
              ) : filtered.map((o) => {
                const on = selected.includes(o);
                return (
                  <button key={o} type="button" onClick={() => onToggle(o)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-[13px] flex items-center gap-2.5 transition-colors cursor-pointer ${
                      on ? "bg-[var(--navy-50)] text-[var(--navy)] font-semibold" : "text-[var(--ink-soft)] dark:text-slate-200 hover:bg-[var(--surface-hover)] dark:hover:bg-slate-800"}`}>
                    <span className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                      on ? "bg-[var(--navy)] border-[var(--navy)] text-white" : "border-[var(--line-heavy)] bg-white"}`}>
                      {on && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className="min-w-0 flex-1">{o}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// Badge trạng thái dùng chung với chỉ báo Glowing Dot
export function StatusBadge({ label, cls, sm }: { label: string; cls: string; sm?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${sm ? "text-[10.5px] px-2.5 py-0.5" : "text-[11.5px] px-3 py-1"} font-bold rounded-full border shadow-2xs ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-pulse" />
      {label}
    </span>
  );
}

