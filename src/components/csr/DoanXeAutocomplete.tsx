"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Bus,
  Clock,
  MapPin,
  Calendar,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  X,
  Loader2,
  Car,
  AlertCircle,
  Edit3,
} from "lucide-react";
import Modal from "@/components/layout/Modal";
import { fmtDate } from "@/lib/csr";
import { useToast } from "@/components/providers/ToastProvider";
import { useRealtimeEvent } from "@/lib/useRealtime";

export interface DoanXeChang {
  id: string;
  diemDon: string;
  gioDon: string;
  soBN?: number;
  cacXa?: string[];
}

export interface DoanXeItem {
  id: string;
  tenDoan: string;
  ngayDon: string; // YYYY-MM-DD
  cacDiem: DoanXeChang[];
}

interface DoanXeAutocompleteProps {
  diemDon: string;
  gioDon: string;
  ngayHen?: string;
  onSelect: (val: { diemDon: string; gioDon: string; ngayHen?: string }) => void;
  disabled?: boolean;
  buoiKhamXa?: string;
}

const COMMON_TIMES = ["05:30", "06:00", "06:30", "07:00", "07:30", "13:30"];

export default function DoanXeAutocomplete({
  diemDon,
  gioDon,
  ngayHen,
  onSelect,
  disabled = false,
  buoiKhamXa = "",
}: DoanXeAutocompleteProps) {
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [doanXeList, setDoanXeList] = useState<DoanXeItem[]>([]);

  // Chỉnh nhanh giờ đón
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [timeInput, setTimeInput] = useState(gioDon || "");

  // Modal tạo nhanh đoàn xe
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTenDoan, setNewTenDoan] = useState("");
  const [newNgayDon, setNewNgayDon] = useState(ngayHen || "");
  const [newChangs, setNewChangs] = useState<Array<{ id: string; diemDon: string; gioDon: string }>>([
    { id: "c_1", diemDon: "", gioDon: "05:30" },
  ]);
  const [selectedChangIndex, setSelectedChangIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Nạp danh sách đoàn xe chưa qua ngày
  const loadDoanXe = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/csr/doan-xe/diem-don");
      const json = await res.json();
      if (res.ok && Array.isArray(json.doanXeList)) {
        setDoanXeList(json.doanXeList);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoanXe();
  }, [loadDoanXe]);

  useRealtimeEvent(["hoso_change"], () => {
    loadDoanXe();
  });

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setIsEditingTime(false);
      }
    };
    if (open || isEditingTime) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, isEditingTime]);

  useEffect(() => {
    setTimeInput(gioDon || "");
  }, [gioDon]);

  // Lọc theo query người dùng nhập trực tiếp vào ô input
  const filteredDoanXe = useMemo(() => {
    if (!searchQuery.trim()) return doanXeList;
    const q = searchQuery.trim().toLowerCase();

    return doanXeList
      .map((dx) => {
        const matchTen = dx.tenDoan.toLowerCase().includes(q);
        const matchNgay = dx.ngayDon.includes(q) || fmtDate(dx.ngayDon).toLowerCase().includes(q);

        const matchedChangs = dx.cacDiem.filter((c) => {
          return (
            matchTen ||
            matchNgay ||
            c.diemDon.toLowerCase().includes(q) ||
            c.gioDon.includes(q) ||
            (c.cacXa && c.cacXa.some((x) => x.toLowerCase().includes(q)))
          );
        });

        if (matchedChangs.length > 0) {
          return { ...dx, cacDiem: matchedChangs };
        }
        return null;
      })
      .filter(Boolean) as DoanXeItem[];
  }, [doanXeList, searchQuery]);

  const isSelected = Boolean(diemDon && diemDon.trim());
  const isTuTuc =
    diemDon.toLowerCase().includes("tự túc") || diemDon.toLowerCase().includes("xe nhà");

  // Mở modal tạo nhanh
  const handleOpenCreateModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpen(false);
    const defaultName = buoiKhamXa ? `Đoàn xe Tuyến ${buoiKhamXa}` : "Đoàn xe Đón điều trị";
    setNewTenDoan(defaultName);
    setNewNgayDon(ngayHen || new Date().toISOString().slice(0, 10));
    setNewChangs([
      { id: "c_1", diemDon: buoiKhamXa ? `Trạm Y tế ${buoiKhamXa}` : "", gioDon: "05:15" },
      { id: "c_2", diemDon: buoiKhamXa ? `UBND Xã ${buoiKhamXa}` : "", gioDon: "05:45" },
    ]);
    setSelectedChangIndex(0);
    setShowCreateModal(true);
  };

  const handleAddChang = () => {
    const nextIdx = newChangs.length + 1;
    setNewChangs((prev) => [
      ...prev,
      { id: `c_${Date.now()}_${nextIdx}`, diemDon: "", gioDon: "06:00" },
    ]);
  };

  const handleRemoveChang = (idx: number) => {
    if (newChangs.length <= 1) return;
    setNewChangs((prev) => prev.filter((_, i) => i !== idx));
    if (selectedChangIndex >= idx && selectedChangIndex > 0) {
      setSelectedChangIndex(selectedChangIndex - 1);
    }
  };

  const handleSaveNewDoanXe = async () => {
    if (!newTenDoan.trim()) {
      addToast({ type: "error", message: "Vui lòng nhập tên đoàn xe / tuyến xe" });
      return;
    }
    if (!newNgayDon) {
      addToast({ type: "error", message: "Vui lòng chọn ngày đón của đoàn xe" });
      return;
    }

    const validChangs = newChangs
      .map((c) => ({ ...c, diemDon: c.diemDon.trim(), gioDon: c.gioDon.trim() }))
      .filter((c) => c.diemDon.length > 0);

    if (validChangs.length === 0) {
      addToast({ type: "error", message: "Vui lòng nhập ít nhất 1 điểm đón kèm giờ đón" });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/csr/doan-xe/diem-don", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenDoan: newTenDoan.trim(),
          ngayDon: newNgayDon,
          cacDiem: validChangs,
        }),
      });

      const json = await res.json();
      if (res.ok && json.route) {
        addToast({
          type: "success",
          message: `✓ Đã tạo đoàn xe "${newTenDoan}" với ${validChangs.length} mốc đón`,
        });

        const chosen = validChangs[selectedChangIndex] || validChangs[0];
        onSelect({
          diemDon: chosen.diemDon,
          gioDon: chosen.gioDon,
          ngayHen: newNgayDon,
        });

        loadDoanXe();
        setShowCreateModal(false);
      } else {
        addToast({ type: "error", message: json.error || "Không thể tạo đoàn xe" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối khi lưu đoàn xe" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* 1. THANH CHỌN ĐOÀN XE / TRẠNG THÁI HIỆN TẠI (Chiều cao cố định h-10.5 không làm nhảy layout) */}
      {isSelected ? (
        <div className="h-10.5 px-3 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between gap-2 transition-all shadow-2xs">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isTuTuc ? (
              <Car className="w-4 h-4 text-slate-700 shrink-0" />
            ) : (
              <Bus className="w-4 h-4 text-[#031da6] shrink-0" />
            )}

            <span className="font-extrabold text-[13px] text-slate-900 truncate">
              {diemDon}
            </span>

            {gioDon && (
              <span
                onClick={() => !disabled && setIsEditingTime(!isEditingTime)}
                title="Bấm để đổi giờ đón"
                className="inline-flex items-center gap-1 font-mono text-[11.5px] font-black px-2 py-0.5 rounded-md bg-white text-[#031da6] border border-blue-300 shadow-2xs hover:border-[#031da6] cursor-pointer shrink-0 transition-all"
              >
                <Clock className="w-3 h-3 text-[#031da6]" />
                <span>{gioDon}</span>
                <Edit3 className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
              </span>
            )}

            {ngayHen && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 shrink-0">
                📅 {fmtDate(ngayHen)}
              </span>
            )}
          </div>

          {!disabled && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setOpen(true);
                }}
                className="px-2.5 py-1 text-[11.5px] font-bold text-[#031da6] hover:bg-white rounded-md border border-blue-200 transition-colors cursor-pointer shadow-2xs"
              >
                Đổi đoàn
              </button>
              <button
                type="button"
                onClick={() => onSelect({ diemDon: "", gioDon: "" })}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-md hover:bg-white transition-colors cursor-pointer"
                title="Hủy chọn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Ô tìm kiếm & kích hoạt trực tiếp (Không có 2 lớp tìm kiếm thừa) */
        <div
          className={`h-10.5 px-3 rounded-xl border border-slate-300 bg-white hover:border-[#031da6] flex items-center justify-between gap-2 transition-all shadow-2xs ${
            open ? "border-[#031da6] ring-2 ring-blue-100" : ""
          } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Bus className="w-4 h-4 text-[#031da6] shrink-0" />
            <input
              ref={inputRef}
              disabled={disabled}
              value={searchQuery}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!open) setOpen(true);
              }}
              placeholder="Chọn hoặc tìm đoàn xe, điểm đón, giờ đón..."
              className="w-full h-full bg-transparent text-[13px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="text-[11.5px] font-extrabold text-[#031da6] bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Tạo đoàn</span>
            </button>
            <ChevronDown
              onClick={() => !disabled && setOpen(!open)}
              className="w-4 h-4 text-slate-400 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Popover chỉnh nhanh giờ đón khi bấm vào badge giờ */}
      {isEditingTime && !disabled && (
        <div className="mt-1.5 p-2 bg-white rounded-xl border border-blue-200 shadow-md flex items-center gap-2 flex-wrap animate-fade-in z-40">
          <span className="text-[11.5px] font-bold text-slate-600">Giờ đón:</span>
          <input
            type="text"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            placeholder="06:00"
            maxLength={5}
            className="w-16 h-6 px-1 text-[12px] font-mono font-bold text-center border border-slate-300 rounded bg-white focus:outline-none focus:border-[#031da6]"
          />
          <button
            type="button"
            onClick={() => {
              onSelect({ diemDon, gioDon: timeInput, ngayHen });
              setIsEditingTime(false);
            }}
            className="px-2 py-0.5 text-[11px] font-bold bg-[#031da6] text-white rounded cursor-pointer"
          >
            Lưu
          </button>
          <div className="flex items-center gap-1">
            {COMMON_TIMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  onSelect({ diemDon, gioDon: t, ngayHen });
                  setIsEditingTime(false);
                }}
                className={`text-[10.5px] font-mono px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                  gioDon === t
                    ? "bg-[#031da6] text-white border-[#031da6] font-bold"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. DROPDOWN POPOVER NỔI (Hoàn toàn float, không chiếm layout và không gây nhảy form) */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[300px] animate-dropdown">
          <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
            {/* Tùy chọn 1: Bệnh nhân tự túc / Xe nhà */}
            <button
              type="button"
              onClick={() => {
                onSelect({
                  diemDon: "Tự túc / Xe nhà",
                  gioDon: "07:30",
                  ngayHen: ngayHen,
                });
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-between text-[12.5px] text-slate-800 font-bold cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-slate-600" />
                <span>Bệnh nhân Tự túc / Đi xe riêng</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                07:30
              </span>
            </button>

            {loading ? (
              <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin text-[#031da6]" />
                <span className="text-[11.5px]">Đang tải danh sách đoàn xe...</span>
              </div>
            ) : filteredDoanXe.length === 0 ? (
              <div className="py-4 text-center text-slate-500 space-y-2 px-3">
                <p className="text-[12px]">Không tìm thấy đoàn xe phù hợp.</p>
                {searchQuery.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSelect({
                        diemDon: searchQuery.trim(),
                        gioDon: gioDon || "06:00",
                        ngayHen,
                      });
                      setOpen(false);
                    }}
                    className="px-3 py-1 rounded-lg bg-blue-50 text-[#031da6] border border-blue-200 hover:bg-blue-100 text-[11.5px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#031da6]" />
                    <span>Dùng điểm: <b>&quot;{searchQuery.trim()}&quot;</b> (Giờ đón 06:00)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="text-[12px] font-bold text-[#031da6] hover:underline"
                  >
                    + Tạo đoàn xe mới cho tuyến này
                  </button>
                )}
              </div>
            ) : (
              filteredDoanXe.map((dx) => (
                <div
                  key={dx.id}
                  className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-2xs"
                >
                  {/* Tiêu đề Tuyến xe */}
                  <div className="py-1 px-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Bus className="w-3.5 h-3.5 text-[#031da6] shrink-0" />
                      <span className="font-extrabold text-[12px] text-slate-900 truncate">
                        {dx.tenDoan}
                      </span>
                    </div>
                    <span className="font-mono text-[10.5px] font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 shrink-0">
                      📅 {fmtDate(dx.ngayDon)}
                    </span>
                  </div>

                  {/* Danh sách các điểm đón trên xe */}
                  <div className="divide-y divide-slate-100">
                    {dx.cacDiem.map((c) => {
                      const isMatch = diemDon === c.diemDon && gioDon === c.gioDon;

                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            onSelect({
                              diemDon: c.diemDon,
                              gioDon: c.gioDon,
                              ngayHen: dx.ngayDon,
                            });
                            setOpen(false);
                          }}
                          className={`px-2.5 py-1.5 hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                            isMatch ? "bg-blue-50/90 font-bold" : ""
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="text-[12px] text-slate-800 truncate">
                              {c.diemDon}
                            </span>
                            {c.cacXa && c.cacXa.length > 0 && (
                              <span className="text-[10px] text-slate-400 hidden sm:inline truncate max-w-[120px]">
                                ({c.cacXa.join(", ")})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {c.soBN !== undefined && c.soBN > 0 && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-900">
                                {c.soBN} BN
                              </span>
                            )}
                            <span className="font-mono text-[11px] font-black text-[#031da6] bg-white px-1.5 py-0.5 rounded border border-blue-200">
                              ⏰ {c.gioDon}
                            </span>
                            {isMatch && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer popover: Nút tạo đoàn xe mới */}
          <div className="p-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11.5px]">
            <span className="text-slate-500 font-medium">Chưa có đoàn xe phù hợp?</span>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="font-extrabold text-[#031da6] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Tạo đoàn xe mới (nhiều điểm & giờ)</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MODAL TẠO NHANH ĐOÀN XE */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#031da6] text-white flex items-center justify-center">
              <Bus className="w-4 h-4 text-teal-300" />
            </div>
            <span className="text-[15px] font-bold">Tạo nhanh đoàn xe đón bệnh nhân</span>
          </div>
        }
        subtitle="Khai báo tuyến xe chung và nhiều điểm đón kèm khung giờ khác nhau"
        maxWidth="max-w-[540px]"
      >
        <div className="space-y-3.5">
          <div>
            <label className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider mb-1 block">
              Tên đoàn xe / Tuyến xe đón *
            </label>
            <input
              value={newTenDoan}
              onChange={(e) => setNewTenDoan(e.target.value)}
              placeholder="VD: Tuyến Xã Thông Hòa, Tuyến Cầu Kè - Trà Cú..."
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-[13px] font-semibold text-slate-900 outline-none focus:border-[#031da6]"
            />
          </div>

          <div>
            <label className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider mb-1 block">
              Ngày đón xe đến bệnh viện *
            </label>
            <input
              type="date"
              value={newNgayDon}
              onChange={(e) => setNewNgayDon(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono text-[13px] font-bold text-slate-900 outline-none focus:border-[#031da6]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider">
                Lộ trình đón (Điểm đón & Giờ đón) *
              </label>
              <span className="text-[11px] text-slate-500">Tích chọn để gán cho BN này</span>
            </div>

            <div className="space-y-2 max-h-[180px] overflow-y-auto p-0.5 custom-scrollbar">
              {newChangs.map((c, idx) => (
                <div
                  key={c.id}
                  className={`p-1.5 rounded-lg border transition-all flex items-center gap-2 ${
                    selectedChangIndex === idx
                      ? "border-[#031da6] bg-blue-50/50 ring-1 ring-[#031da6]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="selected_chang"
                    checked={selectedChangIndex === idx}
                    onChange={() => setSelectedChangIndex(idx)}
                    className="w-4 h-4 text-[#031da6] cursor-pointer shrink-0 ml-1"
                    title="Chọn điểm đón này cho bệnh nhân hiện tại"
                  />
                  <input
                    value={c.diemDon}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewChangs((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, diemDon: val } : item))
                      );
                    }}
                    placeholder={`Điểm đón ${idx + 1} (Trạm Y tế, UBND, Cầu...)`}
                    className="flex-1 h-7.5 px-2 text-[12px] rounded border border-slate-300 bg-white outline-none focus:border-[#031da6]"
                  />
                  <input
                    value={c.gioDon}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewChangs((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, gioDon: val } : item))
                      );
                    }}
                    placeholder="05:30"
                    className="w-20 h-7.5 px-1 text-[12px] font-mono font-bold text-center rounded border border-slate-300 bg-white outline-none focus:border-[#031da6]"
                  />
                  {newChangs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChang(idx)}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddChang}
              className="mt-1.5 text-[11.5px] font-bold text-[#031da6] hover:underline flex items-center gap-1 cursor-pointer py-1 px-2 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>+ Thêm điểm đón & giờ đón tiếp theo</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={creating}
              onClick={handleSaveNewDoanXe}
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-extrabold bg-[#031da6] hover:bg-[#021473] text-white shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Check className="w-3.5 h-3.5 text-teal-300 stroke-[3]" />
              )}
              <span>Lưu & Chọn đoàn xe này</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
