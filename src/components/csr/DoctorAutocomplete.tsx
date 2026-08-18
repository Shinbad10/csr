"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, UserCheck, Check, RefreshCw, Loader2, UserPlus, ShieldCheck, Clock } from "lucide-react";
import { usePortalPosition } from "./fields";
import { parseDoctorList, formatDoctorList } from "@/lib/csr";

export interface DoctorItem {
  maNV?: string;
  hoTen: string;
  maHIS?: string | null;
  coSoId?: string | null;
}

let globalDoctorsCache: DoctorItem[] | null = null;

interface DoctorAutocompleteProps {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function DoctorAutocomplete({
  value = "",
  onChange,
  placeholder = "Chọn hoặc nhập họ tên bác sĩ...",
  disabled = false,
  required = false,
  className = "",
}: DoctorAutocompleteProps) {
  const safeVal = (value ?? "").toString();
  const [doctors, setDoctors] = useState<DoctorItem[]>(globalDoctorsCache || []);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const pos = usePortalPosition(open, containerRef, 320);

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/csr/bacsi");
      const data = await res.json();
      if (Array.isArray(data)) {
        const formatted: DoctorItem[] = data.map((d: any) => {
          if (typeof d === "string") return { hoTen: d, maHIS: null };
          return {
            maNV: d.maNV,
            hoTen: String(d.hoTen || "").trim(),
            maHIS: d.maHIS || null,
            coSoId: d.coSoId || null,
          };
        }).filter((d) => d.hoTen.length > 0);

        globalDoctorsCache = formatted;
        setDoctors(formatted);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách bác sĩ:", err);
    }
  };

  useEffect(() => {
    if (globalDoctorsCache) {
      setDoctors(globalDoctorsCache);
      return;
    }
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (containerRef.current?.contains(t) || popupRef.current?.contains(t)) return;
      setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const safeSearch = (search ?? "").toString();
  const query = (open ? safeSearch : safeVal)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const filtered = doctors.filter((d) => {
    const nameMatch = d.hoTen
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(query);
    const hisMatch = d.maHIS?.toLowerCase().includes(query) ?? false;
    return nameMatch || hisMatch;
  });

  const exactMatch = doctors.some(
    (d) => d.hoTen.trim().toLowerCase() === (open ? safeSearch : safeVal).trim().toLowerCase()
  );

  const handleSelect = (docName: string) => {
    onChange(docName);
    setSearch(docName);
    setOpen(false);
  };

  const handleAddNewDoctor = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    handleSelect(trimmed);

    // Lưu ngay vào cache cục bộ với mã HIS để trống
    const newItem: DoctorItem = { hoTen: trimmed, maHIS: null };
    const nextList = [...doctors.filter((d) => d.hoTen !== trimmed), newItem];
    globalDoctorsCache = nextList;
    setDoctors(nextList);

    // Gửi request ngầm để tạo tài khoản bác sĩ với maHIS: null
    try {
      await fetch("/api/csr/bacsi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", hoTen: trimmed }),
      });
    } catch (e) {
      console.error("Lỗi tạo bác sĩ mới:", e);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={open ? safeSearch : safeVal}
          onChange={(e) => {
            const val = e.target.value;
            if (!open) {
              setSearch(val);
              setOpen(true);
            } else {
              setSearch(val);
            }
            onChange(val);
          }}
          onFocus={() => {
            if (!disabled) {
              setSearch(safeVal);
              setOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required && !safeVal.trim()}
          className={`input-field w-full pr-7 h-8 sm:h-8.5 text-[12px] ${
            disabled ? "bg-[var(--surface-soft)] text-[var(--ink-soft)] cursor-not-allowed font-medium" : "bg-white"
          }`}
        />
        {!disabled && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              if (open) {
                setOpen(false);
              } else {
                setSearch(safeVal);
                setOpen(true);
              }
            }}
            className="absolute right-1 text-[var(--mute)] hover:text-[#031da6] p-1 rounded transition-colors cursor-pointer"
            title="Xem danh sách bác sĩ"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180 text-[var(--teal)]" : ""}`} />
          </button>
        )}
      </div>

      {open && !disabled && typeof document !== "undefined" && createPortal(
        <div
          ref={popupRef}
          style={{ ...pos }}
          className="fixed z-[99999] max-h-60 overflow-y-auto bg-white border border-[#cbd5e1] rounded-lg shadow-xl py-1 text-[12px] animate-fade-in flex flex-col"
        >
          {/* Header */}
          <div className="px-2.5 py-1 text-[10px] font-bold text-[var(--mute)] uppercase tracking-wider flex items-center justify-between border-b border-[#e2e8f0] mb-0.5 shrink-0">
            <div className="flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-[var(--teal)]" />
              <span>Bác sĩ hệ thống ({filtered.length})</span>
            </div>
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                setSyncing(true);
                try {
                  await fetch("/api/csr/bacsi", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "sync" }),
                  });
                  await fetchDoctors();
                } catch (err) {
                  console.error("Lỗi đồng bộ HIS:", err);
                } finally {
                  setSyncing(false);
                }
              }}
              disabled={syncing}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--teal-soft)] text-[var(--teal-deep)] hover:bg-[var(--teal)] hover:text-white transition-colors cursor-pointer text-[9.5px] font-bold"
              title="Đồng bộ và gắn mã HIS cho các bác sĩ mới"
            >
              {syncing ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RefreshCw className="w-2.5 h-2.5" />}
              <span>Đồng bộ HIS</span>
            </button>
          </div>

          {/* Option thêm mới nếu chưa có trùng khớp */}
          {safeSearch.trim().length > 0 && !exactMatch && (
            <button
              type="button"
              onClick={() => handleAddNewDoctor(safeSearch)}
              className="w-full text-left px-2.5 py-1.5 bg-[#f0fdf4] hover:bg-[#dcfce7] border-b border-[#bbf7d0] text-[#166534] flex items-center justify-between gap-1.5 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <UserPlus className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-[11.5px] truncate">
                    Thêm bác sĩ: <span className="underline font-bold">&ldquo;{safeSearch.trim()}&rdquo;</span>
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 bg-[#16a34a] text-white rounded shrink-0">
                Thêm mới
              </span>
            </button>
          )}

          {/* Danh sách bác sĩ */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && safeSearch.trim().length === 0 ? (
              <div className="px-3 py-2 text-[var(--mute)] italic text-center text-[11px]">
                Chưa có danh sách bác sĩ. Hãy bấm &ldquo;Đồng bộ HIS&rdquo; hoặc nhập tên mới.
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2 text-[var(--mute)] text-center text-[11px]">
                Không tìm thấy bác sĩ &ldquo;{safeSearch}&rdquo;. Bấm nút &ldquo;Thêm bác sĩ&rdquo; ở trên để tạo mới.
              </div>
            ) : (
              filtered.map((doc) => {
                const isSelected = safeVal.trim().toLowerCase() === doc.hoTen.trim().toLowerCase();
                return (
                  <button
                    key={doc.maNV || doc.hoTen}
                    type="button"
                    onClick={() => handleSelect(doc.hoTen)}
                    className={`w-full text-left px-2.5 py-1.5 flex items-center justify-between gap-1.5 transition-colors cursor-pointer text-[11.5px] ${
                      isSelected
                        ? "bg-[var(--teal-soft)] text-[var(--teal-deep)] font-bold"
                        : "hover:bg-[#f8fafc] text-[#0f172a]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{doc.hoTen}</span>
                      {doc.maHIS ? (
                        <span className="inline-flex items-center gap-0.5 text-[9.5px] font-mono font-bold text-emerald-800 bg-emerald-100/70 px-1 py-0.2 rounded border border-emerald-300/60 shrink-0" title={`Mã HIS: ${doc.maHIS}`}>
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                          <span>HIS: {doc.maHIS}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[9.5px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 shrink-0" title="Chưa có mã HIS - Bấm 'Đồng bộ HIS' để tự động ghép mã">
                          <Clock className="w-2.5 h-2.5 text-amber-500" />
                          <span>Chờ HIS</span>
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" />}
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

export { parseDoctorList, formatDoctorList } from "@/lib/csr";

/** Component chọn nhiều bác sĩ cho đoàn khám (Multi-doctor Tags) */
export function DoctorMultiSelect({
  value = "",
  onChange,
  placeholder = "Chọn hoặc nhập thêm bác sĩ...",
  disabled = false,
  className = "",
}: {
  value?: string | string[] | null;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const selectedList = Array.isArray(value) ? value : parseDoctorList(value);
  const [doctors, setDoctors] = useState<DoctorItem[]>(globalDoctorsCache || []);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const pos = usePortalPosition(open, containerRef, 320);

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/csr/bacsi");
      const data = await res.json();
      if (Array.isArray(data)) {
        const formatted: DoctorItem[] = data.map((d: any) => {
          if (typeof d === "string") return { hoTen: d, maHIS: null };
          return {
            maNV: d.maNV,
            hoTen: String(d.hoTen || "").trim(),
            maHIS: d.maHIS || null,
            coSoId: d.coSoId || null,
          };
        }).filter((d) => d.hoTen.length > 0);

        globalDoctorsCache = formatted;
        setDoctors(formatted);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách bác sĩ:", err);
    }
  };

  useEffect(() => {
    if (globalDoctorsCache) {
      setDoctors(globalDoctorsCache);
      return;
    }
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (containerRef.current?.contains(t) || popupRef.current?.contains(t)) return;
      setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const safeSearch = (search ?? "").toString();
  const query = safeSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const filtered = doctors.filter((d) => {
    const nameMatch = d.hoTen.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query);
    const hisMatch = d.maHIS?.toLowerCase().includes(query) ?? false;
    return nameMatch || hisMatch;
  });

  const exactMatch = doctors.some((d) => d.hoTen.trim().toLowerCase() === safeSearch.trim().toLowerCase());

  const toggleDoctor = (docName: string) => {
    const trimmed = docName.trim();
    if (!trimmed) return;
    let next: string[];
    if (selectedList.includes(trimmed)) {
      next = selectedList.filter((s) => s !== trimmed);
    } else {
      next = [...selectedList, trimmed];
    }
    onChange(formatDoctorList(next));
    setSearch("");
  };

  const removeDoctor = (docName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = selectedList.filter((s) => s !== docName);
    onChange(formatDoctorList(next));
  };

  const handleAddNewDoctor = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    toggleDoctor(trimmed);

    // Lưu ngay vào cache cục bộ
    const newItem: DoctorItem = { hoTen: trimmed, maHIS: null };
    const nextList = [...doctors.filter((d) => d.hoTen !== trimmed), newItem];
    globalDoctorsCache = nextList;
    setDoctors(nextList);

    try {
      await fetch("/api/csr/bacsi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", hoTen: trimmed }),
      });
    } catch (e) {
      console.error("Lỗi tạo bác sĩ mới:", e);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Khung chứa các Tag bác sĩ đã chọn và ô nhập */}
      <div
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
        className={`min-h-10 w-full p-1.5 rounded-xl border bg-white flex flex-wrap items-center gap-1.5 cursor-text transition-all ${
          open ? "border-[#031da6] ring-2 ring-[#031da6]/15" : "border-[#cbd5e1] hover:border-[#94a3b8]"
        } ${disabled ? "bg-[var(--surface-soft)] opacity-70 cursor-not-allowed" : ""}`}
      >
        {selectedList.map((docName, idx) => (
          <span
            key={docName}
            className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-[#eef2ff] border border-[#c7d2fe] text-[#031da6] text-[12.5px] font-bold shadow-2xs select-none animate-scale-in"
          >
            <span>{idx === 0 && selectedList.length > 1 ? `⭐ ${docName}` : docName}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => removeDoctor(docName, e)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-[#6366f1] hover:text-white hover:bg-[#e11d48] transition-colors cursor-pointer"
                title="Bỏ chọn bác sĩ này"
              >
                ✕
              </button>
            )}
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setOpen(true);
          }}
          disabled={disabled}
          placeholder={selectedList.length === 0 ? placeholder : "Thêm bác sĩ khác..."}
          className="flex-1 min-w-[150px] h-7 bg-transparent text-[13px] text-[#0f172a] placeholder-[#94a3b8] outline-hidden px-1"
        />

        <div className="ml-auto pr-1">
          <ChevronDown className={`w-4 h-4 text-[#64748b] transition-transform duration-200 ${open ? "rotate-180 text-[#02b8a9]" : ""}`} />
        </div>
      </div>

      {open && !disabled && typeof document !== "undefined" && createPortal(
        <div
          ref={popupRef}
          style={{ ...pos }}
          className="fixed z-[99999] max-h-72 overflow-y-auto bg-white border border-[#cbd5e1] rounded-xl shadow-2xl py-1.5 text-[13px] animate-fade-in flex flex-col"
        >
          {/* Header */}
          <div className="px-3 py-1.5 text-[11px] font-bold text-[#64748b] uppercase tracking-wider flex items-center justify-between border-b border-[#e2e8f0] mb-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#02b8a9]" />
              <span>Đoàn bác sĩ khám ({selectedList.length} đã chọn)</span>
            </div>
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                setSyncing(true);
                try {
                  await fetch("/api/csr/bacsi", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "sync" }),
                  });
                  await fetchDoctors();
                } catch (err) {
                  console.error("Lỗi đồng bộ HIS:", err);
                } finally {
                  setSyncing(false);
                }
              }}
              disabled={syncing}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#e6faf7] text-[#018a7f] hover:bg-[#02b8a9] hover:text-white transition-colors cursor-pointer text-[10px] font-bold"
              title="Đồng bộ danh sách từ HIS bệnh viện"
            >
              {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              <span>Đồng bộ HIS</span>
            </button>
          </div>

          {/* Option thêm mới nếu chưa có trong danh mục */}
          {safeSearch.trim().length > 0 && !exactMatch && (
            <button
              type="button"
              onClick={() => handleAddNewDoctor(safeSearch)}
              className="w-full text-left px-3 py-2 bg-[#f0fdf4] hover:bg-[#dcfce7] border-b border-[#bbf7d0] text-[#166534] flex items-center justify-between gap-2 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <UserPlus className="w-4 h-4 text-[#16a34a] shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-[13px] truncate">
                    Thêm vào đoàn: <span className="underline font-bold">&ldquo;{safeSearch.trim()}&rdquo;</span>
                  </div>
                  <div className="text-[11px] text-[#15803d]/80">
                    Mã HIS: để trống — Hệ thống sẽ tự động ghép mã khi đồng bộ HIS
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#16a34a] text-white rounded shrink-0">
                + Thêm
              </span>
            </button>
          )}

          {/* Danh sách gợi ý bác sĩ */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && safeSearch.trim().length === 0 ? (
              <div className="px-3.5 py-3 text-[#64748b] italic text-center">
                Chưa có danh sách bác sĩ. Hãy bấm &ldquo;Đồng bộ HIS&rdquo; hoặc nhập tên mới.
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3.5 py-3 text-[#64748b] text-center text-[12.5px]">
                Không tìm thấy bác sĩ có sẵn phù hợp với &ldquo;{safeSearch}&rdquo;. Bấm nút &ldquo;Thêm vào đoàn&rdquo; ở trên để tạo mới.
              </div>
            ) : (
              filtered.map((doc) => {
                const isSelected = selectedList.includes(doc.hoTen);
                return (
                  <button
                    key={doc.maNV || doc.hoTen}
                    type="button"
                    onClick={() => toggleDoctor(doc.hoTen)}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#eef2ff] text-[#031da6] font-bold"
                        : "hover:bg-[#f8fafc] text-[#0f172a]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{doc.hoTen}</span>
                      {doc.maHIS ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0" title={`Mã HIS: ${doc.maHIS}`}>
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>HIS: {doc.maHIS}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10.5px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0" title="Chưa có mã HIS">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Chờ đồng bộ HIS</span>
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#031da6] bg-[#c7d2fe]/40 px-2 py-0.5 rounded">
                        <Check className="w-3.5 h-3.5" /> Đã chọn
                      </span>
                    )}
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
