"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, UserCheck, Check, RefreshCw, Loader2 } from "lucide-react";

let globalDoctorsCache: string[] | null = null;

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
  const [doctors, setDoctors] = useState<string[]>(globalDoctorsCache || []);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (globalDoctorsCache) {
      setDoctors(globalDoctorsCache);
      return;
    }
    fetch("/api/csr/bacsi")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: string[]) => {
        if (Array.isArray(data)) {
          const cleanList = data.filter((d) => typeof d === "string" && d.trim().length > 0);
          globalDoctorsCache = cleanList;
          setDoctors(cleanList);
        }
      })
      .catch((err) => console.error("Lỗi lấy danh sách bác sĩ:", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const safeSearch = (search ?? "").toString();
  const query = (open ? safeSearch : safeVal)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const filtered = doctors.filter((d) => {
    const safeDoc = (d ?? "").toString();
    return safeDoc
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(query);
  });

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
          className={`input-field w-full pr-9 ${
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
            className="absolute right-2 text-[var(--mute)] hover:text-[var(--navy)] p-1.5 rounded-lg transition-colors"
            title="Xem danh sách bác sĩ"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180 text-[var(--teal)]" : ""}`} />
          </button>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white border border-[var(--line)] rounded-xl shadow-xl py-1.5 text-[13px] animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider flex items-center justify-between border-b border-[var(--line-soft)] mb-1">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[var(--teal)]" />
              <span>Danh sách bác sĩ hệ thống ({filtered.length})</span>
            </div>
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                setSyncing(true);
                try {
                  await fetch("/api/csr/bacsi", { method: "POST" });
                  const res = await fetch("/api/csr/bacsi");
                  const data = await res.json();
                  if (Array.isArray(data)) {
                    const clean = data.filter((d) => typeof d === "string" && d.trim().length > 0);
                    globalDoctorsCache = clean;
                    setDoctors(clean);
                  }
                } catch (err) {
                  console.error("Lỗi đồng bộ HIS:", err);
                } finally {
                  setSyncing(false);
                }
              }}
              disabled={syncing}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--teal-soft)] text-[var(--teal-deep)] hover:bg-[var(--teal)] hover:text-white transition-colors cursor-pointer text-[10px] font-bold"
              title="Đồng bộ danh sách từ HIS bệnh viện ngay bây giờ"
            >
              {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              <span>Đồng bộ HIS</span>
            </button>
          </div>
          {filtered.length === 0 ? (
            <div className="px-3.5 py-2.5 text-[var(--mute)] italic text-center">
              Không tìm thấy bác sĩ nào phù hợp với &ldquo;{safeSearch}&rdquo;. Tiếp tục nhập để thêm mới.
            </div>
          ) : (
            filtered.map((doc) => {
              const safeDoc = (doc ?? "").toString();
              const isSelected = safeVal.trim().toLowerCase() === safeDoc.trim().toLowerCase();
              return (
                <button
                  key={safeDoc}
                  type="button"
                  onClick={() => {
                    onChange(safeDoc);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-[var(--teal-soft)] text-[var(--teal-deep)] font-semibold"
                      : "hover:bg-[var(--surface-hover)] text-[var(--navy)]"
                  }`}
                >
                  <span className="truncate">{safeDoc}</span>
                  {isSelected && <Check className="w-4 h-4 text-[var(--teal)] shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
