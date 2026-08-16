"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Check, CalendarDays, X, ChevronLeft, Calendar as CalendarIcon, Sparkles } from "lucide-react";

export const labelCls = "block text-[11px] sm:text-[12px] font-bold text-[var(--ink-soft)] mb-1";

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
    <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 border-b border-[var(--line)] bg-[var(--surface-soft)]/60">
      <h3 className="text-[12.5px] sm:text-[14px] font-bold text-[var(--ink)] flex items-center gap-1.5">
        <span className="text-[var(--navy)] font-extrabold">{n}.</span>{" "}
        <span className="text-[var(--teal-deep)]">{accent}</span>
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
        className={`input-field flex items-center justify-between gap-2 text-left w-full cursor-pointer select-none h-8 text-[12px] px-2.5 ${open ? "border-[var(--navy)] ring-2 ring-[var(--navy-100)]" : ""} ${disabled ? "bg-[var(--surface-bg)] text-[var(--mute)]" : ""}`}>
        <span className={`${value ? `text-[var(--ink)] font-medium ${mono && !labels ? "font-mono" : ""}` : "text-[var(--mute-soft)]"} truncate`}>
          {value ? disp(value) : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-[var(--mute)] transition-transform duration-200 ${open ? "rotate-180 text-[var(--navy)]" : ""}`} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div 
          ref={popupRef} 
          style={{ ...pos }} 
          className="fixed z-[99999] max-h-[260px] flex flex-col bg-white border border-[var(--line-strong)] rounded-lg shadow-xl p-1 text-[12px] animate-dropdown"
        >
          {showSearch && (
            <div className="p-1 border-b border-[var(--line)] mb-1">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm nhanh..."
                className="w-full px-2 py-1 text-[11.5px] rounded bg-[var(--surface-bg)] border border-transparent outline-none focus:bg-white focus:border-[var(--navy)] transition-all"
              />
            </div>
          )}
          <div className="overflow-y-auto flex-1 p-0.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="px-2.5 py-2 text-center text-xs text-[var(--mute)]">Không tìm thấy kết quả</div>
            ) : (
              filtered.map((o) => {
                const isSelected = value === o;
                return (
                  <button 
                    key={o || "__empty"} 
                    type="button" 
                    onClick={() => { onChange(o); setOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-[11.5px] sm:text-[12px] flex items-center justify-between gap-1.5 transition-colors cursor-pointer ${
                      isSelected ? "bg-[var(--navy-50)] text-[var(--navy)] font-bold" : "text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"} ${mono && o && !labels ? "font-mono" : ""}`}
                  >
                    <span className={o ? "truncate" : "text-[var(--mute-soft)]"}>{disp(o)}</span>
                    {isSelected && o && <Check className="w-3.5 h-3.5 shrink-0 text-[var(--teal-deep)] stroke-[2.5]" />}
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

/** Tự động chèn dấu / khi gõ liên tiếp các chữ số và giới hạn năm tối đa 4 số (DD/MM/YYYY) */
function formatDmyMask(input: string, prevText: string): string {
  // Nếu người dùng đang xóa lùi (backspace)
  if (input.length < prevText.length) {
    return input;
  }

  // Tách riêng các ký tự số
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";

  // Tối đa 8 chữ số: 2 ngày, 2 tháng, 4 năm
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);

  if (digits.length <= 2) {
    if (digits.length === 2 && !input.includes("/")) {
      return `${d}/`;
    }
    return input.includes("/") ? input : d;
  }

  if (digits.length <= 4) {
    if (digits.length === 4 && (input.match(/\//g) || []).length < 2) {
      return `${d}/${m}/`;
    }
    return `${d}/${m}`;
  }

  // 5 đến 8 chữ số -> DD/MM/YYYY (năm tối đa 4 số)
  return `${d}/${m}/${y}`;
}

function parseDateInput(str: string): { iso: string; dmy: string; date: Date } | null {
  const clean = str.trim();
  if (!clean) return null;
  
  // Format DD/MM/YYYY hoặc DD-MM-YYYY hoặc DD.MM.YYYY
  const parts = clean.split(/[/.-]/);
  if (parts.length === 3) {
    let [dStr, mStr, yStr] = parts;
    if (dStr.length === 4 && yStr.length <= 2) {
      // YYYY-MM-DD format
      [yStr, mStr, dStr] = parts;
    }
    const d = parseInt(dStr, 10);
    const m = parseInt(mStr, 10);
    const y = parseInt(yStr, 10);
    // Giới hạn năm đúng tối đa 4 chữ số từ 1900 đến 2100
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100 && yStr.length <= 4) {
      const dt = new Date(y, m - 1, d);
      if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) {
        const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dmy = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
        return { iso, dmy, date: dt };
      }
    }
  }

  // Format 8 chữ số liên tiếp: DDMMYYYY (VD: 16082025)
  if (/^\d{8}$/.test(clean)) {
    const d = parseInt(clean.slice(0, 2), 10);
    const m = parseInt(clean.slice(2, 4), 10);
    const y = parseInt(clean.slice(4, 8), 10);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      const dt = new Date(y, m - 1, d);
      if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) {
        const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dmy = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
        return { iso, dmy, date: dt };
      }
    }
  }

  return null;
}

const MASK_EMPTY = "__/__/____";

/** Kiểm tra và chặn các chữ số vô lý ngay khi bấm phím */
function processDigitInput(
  key: string,
  cursorPos: number,
  curMask: string
): { nextVal: string; nextCursor: number } | null {
  const num = parseInt(key, 10);
  if (isNaN(num)) return null;

  let arr = curMask.includes("/") ? curMask.split("") : MASK_EMPTY.split("");
  if (arr.length < 10) arr = MASK_EMPTY.split("");

  // Vị trí 0: Chữ số hàng chục của Ngày (chỉ được 0, 1, 2, 3)
  if (cursorPos === 0) {
    if (num > 3) {
      // Người dùng gõ 4-9 -> tự hiểu là 04, 05... và chuyển con trỏ sang Tháng (vị trí 3)
      arr[0] = "0";
      arr[1] = String(num);
      return { nextVal: arr.join(""), nextCursor: 3 };
    }
    arr[0] = String(num);
    return { nextVal: arr.join(""), nextCursor: 1 };
  }

  // Vị trí 1: Chữ số hàng đơn vị của Ngày
  if (cursorPos === 1) {
    const d0 = arr[0] === "_" ? 0 : parseInt(arr[0], 10);
    if (d0 === 3 && num > 1) {
      // Ngày trong tháng không thể lớn hơn 31
      return null;
    }
    if (d0 === 0 && num === 0) {
      // Ngày không thể là 00
      return null;
    }
    arr[1] = String(num);
    return { nextVal: arr.join(""), nextCursor: 3 }; // Nhảy qua dấu / đến vị trí 3
  }

  // Vị trí 3: Chữ số hàng chục của Tháng (chỉ được 0 hoặc 1)
  if (cursorPos === 3) {
    if (num > 1) {
      // Người dùng gõ 2-9 -> tự hiểu là 02, 03... và chuyển con trỏ sang Năm (vị trí 6)
      arr[3] = "0";
      arr[4] = String(num);
      return { nextVal: arr.join(""), nextCursor: 6 };
    }
    arr[3] = String(num);
    return { nextVal: arr.join(""), nextCursor: 4 };
  }

  // Vị trí 4: Chữ số hàng đơn vị của Tháng
  if (cursorPos === 4) {
    const m0 = arr[3] === "_" ? 0 : parseInt(arr[3], 10);
    if (m0 === 1 && num > 2) {
      // Tháng không thể lớn hơn 12
      return null;
    }
    if (m0 === 0 && num === 0) {
      // Tháng không thể là 00
      return null;
    }
    arr[4] = String(num);
    return { nextVal: arr.join(""), nextCursor: 6 }; // Nhảy qua dấu / đến vị trí 6
  }

  // Vị trí 6-9: 4 chữ số của Năm (1900 - 2099)
  if (cursorPos >= 6 && cursorPos <= 9) {
    arr[cursorPos] = String(num);
    return { nextVal: arr.join(""), nextCursor: cursorPos + 1 };
  }

  return null;
}

// Modern Date Picker hỗ trợ mask cố định sẵn 2 dấu / (dd/mm/yyyy), kiểm tra ngày hợp lệ và chọn qua lịch
export function DateField({
  label,
  value,
  onChange,
  min,
  placeholder = "dd/mm/yyyy",
  disabled,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Chuyển YYYY-MM-DD -> DD/MM/YYYY
  const toDmy = useCallback((iso: string) => {
    if (!iso) return "";
    const parts = iso.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso;
  }, []);

  const [text, setText] = useState(() => (value ? toDmy(value) : ""));

  // Đồng bộ khi value từ bên ngoài thay đổi
  useEffect(() => {
    setText(value ? toDmy(value) : "");
    setIsInvalid(false);
  }, [value, toDmy]);

  // Khởi tạo ngày hiển thị của lịch
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  // Đảm bảo khi mở popup thì hiển thị tháng của ngày đang chọn
  useEffect(() => {
    if (open && value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) setViewDate(d);
    }
  }, [open, value]);

  // Căn lề thông minh qua Portal Position
  const pos = usePortalPosition(open, ref, 340, 275);
  const { maxHeight, ...safePos } = pos;

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        (!popupRef.current || !popupRef.current.contains(e.target as Node))
      ) {
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

  // Khi focus vào ô trống, tự động hiển thị sẵn 2 dấu gạch chéo __/__/____
  const handleFocus = () => {
    if (!text || text === "") {
      setText(MASK_EMPTY);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(0, 0);
        }
      }, 0);
    }
  };

  // Khi blur, kiểm tra tính hợp lệ của ngày trong tháng (VD: 31/02/2026 là sai)
  const handleBlur = () => {
    const digits = text.replace(/\D/g, "");
    if (digits.length === 0) {
      setText("");
      setIsInvalid(false);
      onChange("");
      return;
    }
    if (digits.length === 8) {
      const parsed = parseDateInput(text);
      if (parsed) {
        setText(parsed.dmy);
        setIsInvalid(false);
        onChange(parsed.iso);
        setViewDate(parsed.date);
        return;
      }
    }
    // Nếu chưa nhập đủ 8 chữ số hoặc ngày không tồn tại trên lịch
    if (value) {
      setText(toDmy(value));
      setIsInvalid(false);
    } else {
      setText("");
      setIsInvalid(false);
      onChange("");
    }
  };

  // Xử lý bàn phím cho mask cố định __/__/____
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
      setOpen(false);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" && !open) {
      setOpen(true);
      return;
    }

    // Các phím điều hướng
    if (["Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      return;
    }

    const input = inputRef.current;
    if (!input) return;

    let cursorPos = input.selectionStart ?? 0;
    let cur = text.includes("/") ? text : MASK_EMPTY;
    if (cur.length < 10) cur = MASK_EMPTY;

    // Phím Backspace: xóa lùi và bỏ qua dấu /
    if (e.key === "Backspace") {
      e.preventDefault();
      if (cursorPos === 0) return;
      let targetPos = cursorPos - 1;
      if (targetPos === 2 || targetPos === 5) {
        targetPos = targetPos - 1;
      }
      if (targetPos >= 0) {
        const arr = cur.split("");
        arr[targetPos] = "_";
        const nextVal = arr.join("");
        setText(nextVal);
        setIsInvalid(false);
        setTimeout(() => {
          input.setSelectionRange(targetPos, targetPos);
        }, 0);
      }
      return;
    }

    // Phím Delete: xóa tiến
    if (e.key === "Delete") {
      e.preventDefault();
      let targetPos = cursorPos;
      if (targetPos === 2 || targetPos === 5) targetPos++;
      if (targetPos < 10) {
        const arr = cur.split("");
        arr[targetPos] = "_";
        const nextVal = arr.join("");
        setText(nextVal);
        setIsInvalid(false);
        setTimeout(() => {
          input.setSelectionRange(targetPos + 1, targetPos + 1);
        }, 0);
      }
      return;
    }

    // Khi gõ chữ số 0-9: tự động kiểm tra tính hợp lệ của ngày/tháng/năm
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      if (cursorPos === 2 || cursorPos === 5) {
        cursorPos++;
      }
      if (cursorPos < 10) {
        const result = processDigitInput(e.key, cursorPos, cur);
        if (!result) {
          // Bỏ qua ký tự không hợp lệ (VD: ngày > 31, tháng > 12, ngày/tháng là 00)
          return;
        }

        const { nextVal, nextCursor } = result;
        setText(nextVal);

        setTimeout(() => {
          input.setSelectionRange(nextCursor, nextCursor);
        }, 0);

        // Kiểm tra nếu đã đủ 8 chữ số
        const digits = nextVal.replace(/\D/g, "");
        if (digits.length === 8) {
          const parsed = parseDateInput(nextVal);
          if (parsed) {
            setIsInvalid(false);
            onChange(parsed.iso);
            setViewDate(parsed.date);
          } else {
            // Ngày không tồn tại trong lịch thực tế (VD: 31/02/2026, 31/04/2026)
            setIsInvalid(true);
          }
        } else {
          setIsInvalid(false);
        }
      }
      return;
    }

    // Cho phép phím tắt sao chép/dán
    if (e.ctrlKey || e.metaKey) return;

    // Chặn các phím chữ hoặc ký tự khác
    if (e.key.length === 1) {
      e.preventDefault();
    }
  };

  // Xử lý khi dán (Paste)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const digits = pasted.replace(/\D/g, "").slice(0, 8);
    if (!digits) return;

    let maskArr = MASK_EMPTY.split("");
    let digitIdx = 0;
    for (let i = 0; i < 10 && digitIdx < digits.length; i++) {
      if (i === 2 || i === 5) continue;
      maskArr[i] = digits[digitIdx++];
    }
    const nextVal = maskArr.join("");
    setText(nextVal);

    if (digits.length === 8) {
      const parsed = parseDateInput(nextVal);
      if (parsed) {
        setIsInvalid(false);
        onChange(parsed.iso);
        setViewDate(parsed.date);
      } else {
        setIsInvalid(true);
      }
    }
  };

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
    setText(toDmy(todayStr));
    setIsInvalid(false);
    setViewDate(new Date());
    setOpen(false);
  };
  const clearDate = () => {
    onChange("");
    setText("");
    setIsInvalid(false);
    setOpen(false);
  };

  const selectDate = (dateStr: string) => {
    onChange(dateStr);
    setText(toDmy(dateStr));
    setIsInvalid(false);
    setOpen(false);
  };

  return (
    <div className={`relative ${disabled ? "opacity-70 pointer-events-none" : ""}`} ref={ref}>
      {label && <label className={labelCls}>{label}</label>}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onChange={(e) => {
            if (e.target.value === "") {
              setText(MASK_EMPTY);
            }
          }}
          disabled={disabled}
          maxLength={10}
          placeholder={placeholder}
          className={`input-field font-mono text-[12px] pr-8 h-8 w-full tracking-wider transition-colors ${
            isInvalid
              ? "border-[#e11d48] text-[#e11d48] ring-2 ring-[#e11d48]/20 bg-[#fef1f4]"
              : open
              ? "border-[#031da6] ring-2 ring-[#031da6]/15"
              : ""
          } ${disabled ? "bg-[var(--surface-bg)] text-[var(--mute)]" : "bg-white text-[#0f172a]"}`}
        />
        <button
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-[#64748b] hover:text-[#031da6] hover:bg-[#f1f5f9] rounded transition-colors cursor-pointer"
          title="Mở lịch chọn ngày"
        >
          <CalendarDays className={`w-3.5 h-3.5 transition-colors ${isInvalid ? "text-[#e11d48]" : value ? "text-[#031da6]" : "text-[#64748b]"}`} />
        </button>
      </div>

      {open && typeof document !== "undefined" && createPortal(
        <div 
          ref={popupRef} 
          style={{ ...safePos, width: 275 }} 
          className="fixed z-[99999] bg-white border border-[#cbd5e1] rounded-2xl shadow-2xl p-2.5 animate-dropdown select-none flex flex-col overflow-hidden"
        >
          {/* Header chọn tháng & năm */}
          <div className="flex items-center justify-between gap-1 pb-2 mb-1.5 border-b border-[#e2e8f0]">
            <button 
              type="button" 
              onClick={prevMonth} 
              className="w-7 h-7 flex items-center justify-center hover:bg-[#f1f5f9] rounded-lg text-[#475569] hover:text-[#031da6] transition-colors active:scale-95 cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1 font-sans">
              <div className="relative">
                <select 
                  value={month} 
                  onChange={(e) => setViewDate(new Date(year, Number(e.target.value), 1))} 
                  className="text-[12px] font-bold text-[#031da6] bg-[#f8fafc] border border-[#cbd5e1] cursor-pointer hover:border-[#031da6] px-2 py-0.5 rounded-md outline-none transition-colors appearance-none pr-5"
                >
                  {MONTH_NAMES.map((name, i) => <option key={i} value={i}>{name}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 text-[#64748b] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <div className="relative">
                <select 
                  value={year} 
                  onChange={(e) => setViewDate(new Date(Number(e.target.value), month, 1))} 
                  className="text-[12px] font-bold text-[#031da6] bg-[#f8fafc] border border-[#cbd5e1] cursor-pointer hover:border-[#031da6] px-2 py-0.5 rounded-md outline-none transition-colors font-mono appearance-none pr-5"
                >
                  {Array.from({ length: 80 }).map((_, i) => { 
                    const y = new Date().getFullYear() + 5 - i; 
                    return <option key={y} value={y}>{y}</option>; 
                  })}
                </select>
                <ChevronDown className="w-3 h-3 text-[#64748b] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button 
              type="button" 
              onClick={nextMonth} 
              className="w-7 h-7 flex items-center justify-center hover:bg-[#f1f5f9] rounded-lg text-[#475569] hover:text-[#031da6] transition-colors active:scale-95 cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Tiêu đề thứ trong tuần */}
          <div className="grid grid-cols-7 gap-0.5 mb-1 text-center text-[10px] font-extrabold tracking-wider text-[#64748b]">
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d, i) => (
              <div key={d} className={`py-0.5 ${i === 0 ? "text-[#e11d48]" : ""}`}>{d}</div>
            ))}
          </div>

          {/* Lưới ngày */}
          <div className="grid grid-cols-7 gap-0.5">
            {/* Các ngày tháng trước */}
            {Array.from({ length: firstDay }).map((_, i) => {
              const dayNum = prevMonthDays - firstDay + i + 1;
              return (
                <div key={`prev-${i}`} className="h-7 flex items-center justify-center text-[11px] text-[#cbd5e1] font-mono">
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
                  onClick={() => selectDate(dateStr)}
                  className={`h-7 w-full rounded-md flex items-center justify-center text-[12px] font-mono transition-all cursor-pointer ${
                    isDisabled 
                      ? "text-[#cbd5e1] cursor-not-allowed opacity-30" 
                      : isSelected 
                        ? "bg-[#031da6] text-white font-bold shadow-xs scale-105" 
                        : "hover:bg-[#f1f5f9] text-[#0f172a] font-medium"
                  } ${isToday && !isSelected && !isDisabled ? "border border-[#02b8a9] text-[#018a7f] font-bold bg-[#e6faf7]" : ""}`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Thanh tác vụ nhanh ở chân popup */}
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#e2e8f0] text-[11.5px] bg-[#f8fafc] -mx-2.5 -mb-2.5 px-2.5 py-1.5">
            <button 
              type="button" 
              onClick={setToday} 
              className="inline-flex items-center gap-1 font-bold text-[#018a7f] hover:text-[#031da6] px-1.5 py-0.5 rounded hover:bg-[#e6faf7] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#02b8a9]" /> Hôm nay
            </button>
            <div className="flex items-center gap-1">
              {value && (
                <button 
                  type="button" 
                  onClick={clearDate} 
                  className="font-semibold text-[#e11d48] hover:text-[#e11d48] px-1.5 py-0.5 rounded hover:bg-[#fef1f4] transition-colors cursor-pointer"
                >
                  Xóa
                </button>
              )}
              <button 
                type="button" 
                onClick={() => setOpen(false)} 
                className="font-semibold text-[#64748b] hover:text-[#0f172a] px-2 py-0.5 rounded hover:bg-[#e2e8f0] transition-colors cursor-pointer"
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
    <div className={`flex flex-wrap gap-1 sm:gap-1.5 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      {options.map((o) => {
        const on = value === o;
        return (
          <button key={o} type="button" onClick={() => !disabled && onChange(on ? "" : o)} disabled={disabled}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-[12px] font-bold border transition-all cursor-pointer ${
              on ? "bg-gradient-to-r from-[var(--navy)] to-[var(--navy-deep)] border-[var(--navy)] text-white shadow-2xs" : "bg-white border-[var(--line-strong)] text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] hover:border-[var(--navy-100)]"}`}>
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
          <button key={o} type="button" onClick={() => !disabled && onToggle(o)} disabled={disabled}
            className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-[12px] font-bold border transition-all cursor-pointer ${
              on ? "bg-[var(--gold-soft)] border-[var(--gold-line)] text-[var(--gold-deep)] shadow-2xs" : "bg-white border-[var(--line-strong)] text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] hover:border-[var(--gold-line)]"}`}>
            {o}{on && !disabled && <X className="w-3 h-3 opacity-60 hover:opacity-100" />}
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
