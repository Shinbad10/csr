"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Check, CalendarDays, X, ChevronLeft } from "lucide-react";

export const labelCls = "block text-[12px] font-bold text-[var(--ink-soft)] mb-1.5";

function usePortalPosition(open: boolean, ref: React.RefObject<HTMLElement | null>, dropdownHeight: number = 280) {
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width?: number }>({ left: 0 });

  useEffect(() => {
    if (!open || !ref.current) return;
    const update = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      if (openUp) {
        setPos({ bottom: window.innerHeight - rect.top + 6, left: rect.left, width: rect.width });
      } else {
        setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
      }
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, ref, dropdownHeight]);

  return pos;
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold text-[var(--ink-soft)] mb-1">
        {label} {required && <span className="text-[var(--rose)]">*</span>}
      </span>
      {children}
    </label>
  );
}

export function SectionHeader({ n, accent }: { n: number; accent: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--line)]">
      <h3 className="font-serif text-[17px] font-semibold text-[var(--ink)]">
        <span className="text-[var(--navy)]">{n}.</span>{" "}
        <span className="italic text-[var(--teal-deep)]">{accent}</span>
      </h3>
      <ChevronRight className="w-4 h-4 text-[var(--mute-soft)]" />
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
// labels: ánh xạ value → nhãn hiển thị (vd trạng thái key → tiếng Việt).
export function Dropdown({ value, onChange, options, placeholder = "Chọn…", mono, labels, disabled }: {
  value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string; mono?: boolean; labels?: Record<string, string>; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const disp = (o: string) => (o ? labels?.[o] ?? o : placeholder);
  const pos = usePortalPosition(open, ref, 244);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && (!popupRef.current || !popupRef.current.contains(e.target as Node))) {
        setOpen(false);
      }
    };
    const esc = (e: KeyboardEvent) => { if (e.isComposing || e.keyCode === 229) return; if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", h); window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("mousedown", h); window.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => !disabled && setOpen((o) => !o)} disabled={disabled}
        className={`input-field flex items-center justify-between gap-2 text-left w-full ${open ? "border-[var(--navy)] ring-2 ring-[var(--navy-100)]" : ""} ${disabled ? "bg-[var(--surface-bg)] text-[var(--mute)]" : ""}`}>
        <span className={`${value ? `text-[var(--ink)] ${mono && !labels ? "font-mono" : ""}` : "text-[var(--mute-soft)]"} truncate`}>{value ? disp(value) : placeholder}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-[var(--mute)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div ref={popupRef} style={{ ...pos }} className="fixed z-[99999] max-h-[244px] overflow-y-auto bg-white border border-[var(--line)] rounded-[var(--r-md)] shadow-[var(--shadow-xl)] p-1 animate-fade-in">
          {options.map((o) => (
            <button key={o || "__empty"} type="button" onClick={() => { onChange(o); setOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-[var(--r-sm)] text-[13px] flex items-center justify-between gap-2 transition-colors ${
                value === o ? "bg-[var(--navy-50)] text-[var(--navy)] font-semibold" : "text-[var(--ink-soft)] hover:bg-[var(--surface-hover)]"} ${mono && o && !labels ? "font-mono" : ""}`}>
              <span className={o ? "" : "text-[var(--mute-soft)]"}>{disp(o)}</span>
              {value === o && o && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// Custom Date Picker Dropdown
export function DateField({ label, value, onChange, min, placeholder, disabled }: { label?: string; value: string; onChange: (v: string) => void; min?: string; placeholder?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const fmt = value ? value.split("-").reverse().join("/") : "";
  const phFmt = placeholder ? placeholder.split("-").reverse().join("/") : "dd/mm/yyyy";
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
  const pos = usePortalPosition(open, ref, 300);

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
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className={`relative ${disabled ? "opacity-70 pointer-events-none" : ""}`} ref={ref}>
      {label && <label className={labelCls}>{label}</label>}
      <button type="button" onClick={() => !disabled && setOpen((o) => !o)} disabled={disabled}
        className={`input-field flex items-center justify-between gap-2 text-left w-full ${open ? "border-[var(--navy)] ring-2 ring-[var(--navy-100)]" : ""} ${disabled ? "bg-[var(--surface-bg)] text-[var(--mute)]" : ""}`}>
        <span className={fmt ? "text-[var(--ink)] font-mono" : "text-[var(--mute-soft)]"}>{fmt || phFmt}</span>
        <CalendarDays className="w-4 h-4 shrink-0 text-[var(--mute)]" />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div ref={popupRef} style={{ ...pos, width: pos.width ? Math.max(pos.width, 280) : 280 }} className="fixed z-[99999] bg-white border border-[var(--line)] rounded-[var(--r-xl)] shadow-[var(--shadow-xl)] p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="w-7 h-7 flex items-center justify-center hover:bg-[var(--surface-hover)] rounded-full transition-colors"><ChevronLeft className="w-4 h-4 text-[var(--ink-soft)]" /></button>
            <div className="flex gap-1">
              <select value={month} onChange={(e) => setViewDate(new Date(year, Number(e.target.value), 1))} className="text-[13px] font-bold text-[var(--navy)] outline-none bg-transparent cursor-pointer hover:bg-[var(--surface-hover)] px-1 py-0.5 rounded">
                {Array.from({ length: 12 }).map((_, i) => <option key={i} value={i}>Tháng {i + 1}</option>)}
              </select>
              <select value={year} onChange={(e) => setViewDate(new Date(Number(e.target.value), month, 1))} className="text-[13px] font-bold text-[var(--navy)] outline-none bg-transparent cursor-pointer hover:bg-[var(--surface-hover)] px-1 py-0.5 rounded">
                {Array.from({ length: 100 }).map((_, i) => { const y = new Date().getFullYear() + 5 - i; return <option key={y} value={y}>{y}</option>; })}
              </select>
            </div>
            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="w-7 h-7 flex items-center justify-center hover:bg-[var(--surface-hover)] rounded-full transition-colors"><ChevronRight className="w-4 h-4 text-[var(--ink-soft)]" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[11px] font-extrabold text-[var(--mute)]">
            {["CN","T2","T3","T4","T5","T6","T7"].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              if (!d) return <div key={`empty-${i}`} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const isSelected = value === dateStr;
              const isToday = new Date().toISOString().slice(0, 10) === dateStr;
              const disabled = min ? dateStr < min : false;
              
              return (
                <button
                  key={i} type="button" disabled={disabled}
                  onClick={() => { onChange(dateStr); setOpen(false); }}
                  className={`h-8 rounded-lg flex items-center justify-center text-[13px] transition-colors ${disabled ? "text-[var(--mute-soft)] cursor-not-allowed opacity-50" : isSelected ? "bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-white font-bold shadow-[var(--navy-shadow)]" : "hover:bg-[var(--surface-soft)] text-[var(--ink)]"} ${isToday && !isSelected && !disabled ? "font-bold text-[var(--teal-deep)] bg-[var(--teal-soft)]" : ""}`}
                >
                  {d}
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
        <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)] pointer-events-none transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      {open && typeof document !== "undefined" && createPortal(
        <div ref={popupRef} style={{ ...pos }} className="fixed z-[99999] max-h-[200px] overflow-y-auto bg-white border border-[var(--line)] rounded-[var(--r-md)] shadow-[var(--shadow-xl)] p-1 animate-fade-in">
          {options.length === 0 && !showAdd && (
            <div className="px-3 py-2.5 text-[12.5px] text-[var(--mute)] text-center">Chưa có điểm đón nào.<br/>Nhập để tạo mới.</div>
          )}
          {filtered.map(o => (
            <button key={o} type="button" onMouseDown={(e) => { e.preventDefault(); onChange(o); setOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-[var(--r-sm)] text-[13px] text-[var(--ink-soft)] hover:bg-[var(--surface-hover)]">
              {o}
            </button>
          ))}
          {showAdd && (
            <button type="button" onMouseDown={(e) => { e.preventDefault(); onChange(value.trim()); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--r-sm)] text-[13px] font-semibold text-[var(--teal-deep)] bg-[var(--teal-soft)] hover:bg-[var(--teal)] hover:text-white transition-colors">
              <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[11px] shrink-0 font-black">+</span> 
              Thêm điểm đón: &quot;{value.trim()}&quot;
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
    <div className={`flex flex-wrap gap-2 ${disabled ? "opacity-70 pointer-events-none" : ""}`}>
      {options.map((o) => {
        const on = value === o;
        return (
          <button key={o} type="button" onClick={() => !disabled && onChange(on ? "" : o)} disabled={disabled}
            className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold border transition-colors ${
              on ? "bg-[var(--navy)] border-[var(--navy)] text-white" : "bg-white border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-hover)]"}`}>
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
    <div className={`flex flex-wrap gap-2 ${disabled ? "opacity-70 pointer-events-none" : ""}`}>
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button key={o} type="button" onClick={() => !disabled && onToggle(o)} disabled={disabled}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-semibold border transition-colors ${
              on ? "bg-[var(--gold-soft)] border-[var(--gold-line)] text-[var(--gold-deep)]" : "bg-white border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-hover)]"}`}>
            {o}{on && !disabled && <X className="w-3.5 h-3.5 opacity-60" />}
          </button>
        );
      })}
    </div>
  );
}

// Badge trạng thái dùng chung
export function StatusBadge({ label, cls, sm }: { label: string; cls: string; sm?: boolean }) {
  return <span className={`${sm ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-1"} font-bold rounded-full border ${cls}`}>{label}</span>;
}
