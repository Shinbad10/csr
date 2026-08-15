"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Check, CalendarDays, X, ChevronLeft, Calendar as CalendarIcon, Sparkles } from "lucide-react";

export const labelCls = "block text-[12px] font-bold text-[var(--ink-soft)] mb-1";

/** Vị trí popup dạng portal: tự lật lên trên khi không đủ chỗ bên dưới,
 *  và tự canh lề ngang (left) để không bao giờ bị tràn khỏi màn hình. */
export function usePortalPosition(
  open: boolean, 
  ref: React.RefObject<HTMLElement | null>, 
  dropdownHeight: number = 320,
  minWidth?: number
) {
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width?: number; maxHeight?: number }>({ left: 0 });

  useEffect(() => {
    if (!open || !ref.current) return;
    const update = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
      
      // Chiều rộng hiệu dụng
      const effectiveWidth = minWidth ? Math.max(rect.width, minWidth) : rect.width;
      
      // Canh lề ngang an toàn, tránh tràn mép phải hoặc trái màn hình
      const margin = 12;
      let left = rect.left;
      if (left + effectiveWidth > viewportWidth - margin) {
        left = Math.max(margin, viewportWidth - effectiveWidth - margin);
      }
      if (left < margin) {
        left = margin;
      }

      if (openUp) {
        const availableHeight = Math.max(160, Math.min(dropdownHeight, spaceAbove - 16));
        setPos({ 
          bottom: viewportHeight - rect.top + 6, 
          left, 
          width: minWidth ? effectiveWidth : rect.width,
          maxHeight: availableHeight 
        });
      } else {
        const availableHeight = Math.max(160, Math.min(dropdownHeight, spaceBelow - 16));
        setPos({ 
          top: rect.bottom + 6, 
          left, 
          width: minWidth ? effectiveWidth : rect.width,
          maxHeight: availableHeight 
        });
      }
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, ref, dropdownHeight, minWidth]);

  return pos;
}

export function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1">
        <span className="block text-[12px] font-semibold text-[var(--ink-soft)]">
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
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--line)] bg-[var(--surface-soft)]">
      <h3 className="font-serif text-[15.5px] font-semibold text-[var(--ink)]">
        <span className="text-[var(--navy)]">{n}.</span>{" "}
        <span className="italic text-[var(--teal-deep)]">{accent}</span>
      </h3>
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
  const pos = usePortalPosition(open, ref, 280);

  useEffect(() => {
    if (!open) { setSearch(""); return; }
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && (!popupRef.current || !popupRef.current.contains(e.target as Node))) {
        setOpen(false);
      }
    };
    const esc = (e: KeyboardEvent) => { if (e.isComposing || e.keyCode === 229) return; if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", h); window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("mousedown", h); window.removeEventListener("keydown", esc); };
  }, [open]);

  const showSearch = options.length > 8;
  const filtered = showSearch && search.trim()
    ? options.filter((o) => (labels?.[o] ?? o).toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => !disabled && setOpen((o) => !o)} disabled={disabled}
        className={`input-field flex items-center justify-between gap-2 text-left w-full cursor-pointer select-none ${open ? "border-[var(--navy)] ring-2 ring-[var(--navy-100)]" : ""} ${disabled ? "bg-[var(--surface-bg)] text-[var(--mute)]" : ""}`}>
        <span className={`${value ? `text-[var(--ink)] font-medium ${mono && !labels ? "font-mono" : ""}` : "text-[var(--mute-soft)]"} truncate`}>
          {value ? disp(value) : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-[var(--mute)] transition-transform duration-200 ${open ? "rotate-180 text-[var(--navy)]" : ""}`} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div 
          ref={popupRef} 
          style={{ ...pos }} 
          className="fixed z-[99999] max-h-[280px] flex flex-col bg-white border border-[var(--line-strong)] rounded-[var(--r-md)] shadow-[var(--shadow-xl)] p-1 animate-dropdown"
        >
          {showSearch && (
            <div className="p-1 border-b border-[var(--line)] mb-1">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm nhanh..."
                className="w-full px-2.5 py-1 text-[12.5px] rounded-[var(--r-sm)] bg-[var(--surface-bg)] border border-transparent outline-none focus:bg-white focus:border-[var(--navy)] transition-all"
              />
            </div>
          )}
          <div className="overflow-y-auto flex-1 p-0.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-[var(--mute)]">Không tìm thấy kết quả</div>
            ) : (
              filtered.map((o) => {
                const isSelected = value === o;
                return (
                  <button 
                    key={o || "__empty"} 
                    type="button" 
                    onClick={() => { onChange(o); setOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-[var(--r-sm)] text-[13px] flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected ? "bg-[var(--navy-50)] text-[var(--navy)] font-semibold" : "text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"} ${mono && o && !labels ? "font-mono" : ""}`}
                  >
                    <span className={o ? "truncate" : "text-[var(--mute-soft)]"}>{disp(o)}</span>
                    {isSelected && o && <Check className="w-4 h-4 shrink-0 text-[var(--teal-deep)] stroke-[2.5]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const MONTH_NAMES = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

// Modern Date Picker Dropdown
export function DateField({ label, value, onChange, min, placeholder, disabled }: { label?: string; value: string; onChange: (v: string) => void; min?: string; placeholder?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const fmt = value ? value.split("-").reverse().join("/") : "";
  const phFmt = placeholder ? placeholder.split("-").reverse().join("/") : "dd/mm/yyyy";
  
  // Khởi tạo ngày hiển thị
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
  
  // Đảm bảo khi mở popup thì hiển thị tháng của ngày đang chọn
  useEffect(() => {
    if (open && value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) setViewDate(d);
    }
  }, [open, value]);

  // Căn lề thông minh qua Portal Position
  const pos = usePortalPosition(open, ref, 340, 300);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && (!popupRef.current || !popupRef.current.contains(e.target as Node))) {
        setOpen(false);
      }
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", h); window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("mousedown", h); window.removeEventListener("keydown", esc); };
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0 = CN, 1 = T2...
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  const getLocalToday = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const todayStr = getLocalToday();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const setToday = () => {
    onChange(todayStr);
    setViewDate(new Date());
    setOpen(false);
  };
  const clearDate = () => {
    onChange("");
    setOpen(false);
  };

  return (
    <div className={`relative ${disabled ? "opacity-70 pointer-events-none" : ""}`} ref={ref}>
      {label && <label className={labelCls}>{label}</label>}
      <button 
        type="button" 
        onClick={() => !disabled && setOpen((o) => !o)} 
        disabled={disabled}
        className={`input-field flex items-center justify-between gap-2 text-left w-full cursor-pointer select-none ${open ? "border-[var(--navy)] ring-2 ring-[var(--navy-100)]" : ""} ${disabled ? "bg-[var(--surface-bg)] text-[var(--mute)]" : ""}`}
      >
        <span className={`font-mono text-[13.5px] ${fmt ? "text-[var(--ink)] font-bold" : "text-[var(--mute-soft)] font-normal"}`}>
          {fmt || phFmt}
        </span>
        <CalendarDays className={`w-4 h-4 shrink-0 transition-colors ${value ? "text-[var(--navy)]" : "text-[var(--mute)]"}`} />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div 
          ref={popupRef} 
          style={{ ...pos, width: 300 }} 
          className="fixed z-[99999] bg-white border border-[var(--line-strong)] rounded-2xl shadow-[var(--shadow-xl)] p-3.5 animate-dropdown select-none"
        >
          {/* Header chọn tháng & năm */}
          <div className="flex items-center justify-between gap-1 pb-3 mb-2 border-b border-[var(--line)]">
            <button 
              type="button" 
              onClick={prevMonth} 
              className="w-8 h-8 flex items-center justify-center hover:bg-[var(--surface-hover)] rounded-lg text-[var(--ink-soft)] hover:text-[var(--navy)] transition-colors active:scale-95 cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1.5 font-sans">
              <select 
                value={month} 
                onChange={(e) => setViewDate(new Date(year, Number(e.target.value), 1))} 
                className="text-[13px] font-bold text-[var(--navy)] bg-[var(--surface-bg)] border border-[var(--line)] cursor-pointer hover:border-[var(--navy-100)] px-2 py-1 rounded-md outline-none transition-colors"
              >
                {MONTH_NAMES.map((name, i) => <option key={i} value={i}>{name}</option>)}
              </select>
              <select 
                value={year} 
                onChange={(e) => setViewDate(new Date(Number(e.target.value), month, 1))} 
                className="text-[13px] font-bold text-[var(--navy)] bg-[var(--surface-bg)] border border-[var(--line)] cursor-pointer hover:border-[var(--navy-100)] px-2 py-1 rounded-md outline-none transition-colors font-mono"
              >
                {Array.from({ length: 80 }).map((_, i) => { 
                  const y = new Date().getFullYear() + 5 - i; 
                  return <option key={y} value={y}>{y}</option>; 
                })}
              </select>
            </div>

            <button 
              type="button" 
              onClick={nextMonth} 
              className="w-8 h-8 flex items-center justify-center hover:bg-[var(--surface-hover)] rounded-lg text-[var(--ink-soft)] hover:text-[var(--navy)] transition-colors active:scale-95 cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Tiêu đề thứ trong tuần */}
          <div className="grid grid-cols-7 gap-1 mb-1.5 text-center text-[10.5px] font-bold tracking-wider text-[var(--mute)]">
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d, i) => (
              <div key={d} className={`py-0.5 ${i === 0 ? "text-[var(--rose)]" : ""}`}>{d}</div>
            ))}
          </div>

          {/* Lưới ngày */}
          <div className="grid grid-cols-7 gap-1">
            {/* Các ngày tháng trước */}
            {Array.from({ length: firstDay }).map((_, i) => {
              const dayNum = prevMonthDays - firstDay + i + 1;
              return (
                <div key={`prev-${i}`} className="h-8 flex items-center justify-center text-[11.5px] text-[var(--mute-soft)] opacity-40 font-mono">
                  {dayNum}
                </div>
              );
            })}

            {/* Các ngày trong tháng */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const isSelected = value === dateStr;
              const isToday = todayStr === dateStr;
              const isDisabled = min ? dateStr < min : false;
              
              return (
                <button
                  key={d} 
                  type="button" 
                  disabled={isDisabled}
                  onClick={() => { onChange(dateStr); setOpen(false); }}
                  className={`h-8 w-full rounded-lg flex items-center justify-center text-[12.5px] font-mono transition-all cursor-pointer ${
                    isDisabled 
                      ? "text-[var(--mute-soft)] cursor-not-allowed opacity-30" 
                      : isSelected 
                        ? "bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-white font-bold shadow-[var(--navy-shadow)] scale-105" 
                        : "hover:bg-[var(--surface-hover)] text-[var(--ink)] font-medium"
                  } ${isToday && !isSelected && !isDisabled ? "border-2 border-[var(--teal)] text-[var(--teal-deep)] font-extrabold bg-[var(--teal-softer)]" : ""}`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Thanh tác vụ nhanh ở chân popup */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[var(--line)] text-xs">
            <button 
              type="button" 
              onClick={setToday} 
              className="inline-flex items-center gap-1 font-bold text-[var(--teal-deep)] hover:text-[var(--navy)] px-2 py-1 rounded-md hover:bg-[var(--teal-soft)] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--teal)]" /> Hôm nay
            </button>
            <div className="flex items-center gap-1">
              {value && (
                <button 
                  type="button" 
                  onClick={clearDate} 
                  className="font-semibold text-[var(--rose)] hover:text-[var(--rose)] px-2 py-1 rounded-md hover:bg-[var(--rose-soft)] transition-colors cursor-pointer"
                >
                  Xóa
                </button>
              )}
              <button 
                type="button" 
                onClick={() => setOpen(false)} 
                className="font-semibold text-[var(--mute)] hover:text-[var(--ink)] px-2.5 py-1 rounded-md hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
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
  const pos = usePortalPosition(open, ref, 200);
  
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && (!popupRef.current || !popupRef.current.contains(e.target as Node))) {
        setOpen(false);
      }
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
      {open && typeof document !== "undefined" && createPortal(
        <div ref={popupRef} style={{ ...pos }} className="fixed z-[99999] max-h-[200px] overflow-y-auto bg-white border border-[var(--line-strong)] rounded-[var(--r-md)] shadow-[var(--shadow-xl)] p-1 animate-dropdown">
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

// Pill chọn 1 (khuyến nghị, phân nhóm)
export function ChoiceRow({ options, value, onChange, render, disabled }: {
  options: readonly string[]; value: string; onChange: (v: string) => void; render?: (o: string) => string; disabled?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      {options.map((o) => {
        const on = value === o;
        return (
          <button key={o} type="button" onClick={() => !disabled && onChange(on ? "" : o)} disabled={disabled}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all cursor-pointer ${
              on ? "bg-gradient-to-r from-[var(--navy)] to-[var(--navy-deep)] border-[var(--navy)] text-white shadow-xs" : "bg-white border-[var(--line-strong)] text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] hover:border-[var(--navy-100)]"}`}>
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
    <div className={`flex flex-wrap gap-1.5 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button key={o} type="button" onClick={() => !disabled && onToggle(o)} disabled={disabled}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all cursor-pointer ${
              on ? "bg-[var(--gold-soft)] border-[var(--gold-line)] text-[var(--gold-deep)] shadow-xs" : "bg-white border-[var(--line-strong)] text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] hover:border-[var(--gold-line)]"}`}>
            {o}{on && !disabled && <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />}
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
  const pos = usePortalPosition(open, ref, 320);
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

      {open && !disabled && typeof document !== "undefined" && createPortal(
        <div ref={popupRef} style={{ ...pos }}
          className="fixed z-[99999] flex flex-col max-h-[300px] bg-white border border-[var(--line-strong)] rounded-[var(--r-md)] shadow-[var(--shadow-xl)] animate-dropdown">
          <div className="p-1.5 border-b border-[var(--line-soft)] shrink-0">
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder}
              className="w-full px-2.5 py-1.5 text-[13px] rounded-[var(--r-sm)] bg-[var(--surface-bg)] border border-transparent outline-none focus:bg-white focus:border-[var(--navy)] transition-colors" />
          </div>
          <div className="overflow-y-auto p-1 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-[12.5px] text-[var(--mute)] text-center italic">Không có mục nào khớp</div>
            ) : filtered.map((o) => {
              const on = selected.includes(o);
              return (
                <button key={o} type="button" onClick={() => onToggle(o)}
                  className={`w-full text-left px-2.5 py-2 rounded-[var(--r-sm)] text-[13px] flex items-center gap-2.5 transition-colors cursor-pointer ${
                    on ? "bg-[var(--navy-50)] text-[var(--navy)] font-semibold" : "text-[var(--ink-soft)] hover:bg-[var(--surface-hover)]"}`}>
                  <span className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                    on ? "bg-[var(--navy)] border-[var(--navy)] text-white" : "border-[var(--line-heavy)] bg-white"}`}>
                    {on && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  <span className="min-w-0 flex-1">{o}</span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Badge trạng thái dùng chung
export function StatusBadge({ label, cls, sm }: { label: string; cls: string; sm?: boolean }) {
  return <span className={`${sm ? "text-[10.5px] px-2 py-0.5" : "text-[11.5px] px-2.5 py-1"} font-bold rounded-full border ${cls}`}>{label}</span>;
}
