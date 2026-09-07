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
  Search,
  ChevronDown,
  X,
  Loader2,
  Car,
  AlertCircle,
  Sparkles,
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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [doanXeList, setDoanXeList] = useState<DoanXeItem[]>([]);

  // Chế độ chỉnh sửa giờ nhanh khi đã chọn điểm
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState(gioDon || "");

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Nạp danh sách các đoàn xe chưa qua ngày
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

  // Đóng dropdown khi click ngoài
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
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    setCustomTimeInput(gioDon || "");
  }, [gioDon]);

  // Lọc danh sách đoàn xe & các điểm đón theo từ khóa
  const filteredDoanXe = useMemo(() => {
    if (!search.trim()) return doanXeList;
    const q = search.trim().toLowerCase();

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
  }, [doanXeList, search]);

  const isSelected = Boolean(diemDon && diemDon.trim());
  const isTuTuc =
    diemDon.toLowerCase().includes("tự túc") || diemDon.toLowerCase().includes("xe nhà");

  // Mở modal tạo nhanh đoàn xe mới
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

  const handleApplyCustomDiemDon = (pointName: string) => {
    onSelect({
      diemDon: pointName,
      gioDon: gioDon || "06:00",
      ngayHen: ngayHen,
    });
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      {/* 1. THANH HIỂN THỊ ĐIỂM ĐÓN / ĐOÀN XE */}
      {isSelected ? (
        <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-white p-2.5 shadow-xs transition-all">
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            {/* Chi tiết xe đón */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isTuTuc
                    ? "bg-slate-700 text-white"
                    : "bg-[#031da6] text-white ring-2 ring-blue-200"
                }`}
              >
                {isTuTuc ? <Car className="w-4.5 h-4.5" /> : <Bus className="w-4.5 h-4.5 text-teal-300" />}
              </div>

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-[14px] text-slate-900 truncate">
                    {diemDon}
                  </span>

                  {gioDon && (
                    <span
                      onClick={() => !disabled && setIsEditingTime(!isEditingTime)}
                      title="Bấm để đổi giờ đón"
                      className="inline-flex items-center gap-1 font-mono text-[12px] font-black px-2 py-0.5 rounded-lg bg-white text-[#031da6] border border-blue-300 shadow-2xs hover:border-[#031da6] cursor-pointer transition-all"
                    >
                      <Clock className="w-3.5 h-3.5 text-[#031da6]" />
                      <span>{gioDon}</span>
                      <Edit3 className="w-3 h-3 text-slate-400 ml-0.5" />
                    </span>
                  )}

                  {ngayHen && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                      📅 {fmtDate(ngayHen)}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>
                    {isTuTuc
                      ? "Bệnh nhân tự di chuyển đến bệnh viện theo giờ hẹn mổ"
                      : "Xe bệnh viện đón tại điểm theo lộ trình đoàn"}
                  </span>
                </div>
              </div>
            </div>

            {/* Các nút đổi / xóa */}
            {!disabled && (
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="px-3 py-1.5 text-[12px] font-bold text-[#031da6] hover:bg-white rounded-lg border border-blue-200 hover:border-[#031da6] transition-all cursor-pointer shadow-2xs"
                >
                  Đổi đoàn xe
                </button>
                <button
                  type="button"
                  onClick={() => onSelect({ diemDon: "", gioDon: "" })}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white hover:border hover:border-rose-200 transition-all cursor-pointer"
                  title="Hủy chọn đoàn xe"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Hộp chỉnh nhanh giờ đón khi bấm vào badge giờ */}
          {isEditingTime && !disabled && (
            <div className="mt-2.5 pt-2 border-t border-blue-100/80 flex items-center gap-2 flex-wrap animate-fade-in">
              <span className="text-[11.5px] font-bold text-slate-600">Đổi giờ đón:</span>
              <input
                type="text"
                value={customTimeInput}
                onChange={(e) => setCustomTimeInput(e.target.value)}
                placeholder="06:00"
                maxLength={5}
                className="w-20 h-7 px-2 text-[12px] font-mono font-bold text-center border border-slate-300 rounded-md bg-white focus:outline-none focus:border-[#031da6]"
              />
              <button
                type="button"
                onClick={() => {
                  onSelect({ diemDon, gioDon: customTimeInput, ngayHen });
                  setIsEditingTime(false);
                }}
                className="px-2 py-1 text-[11px] font-bold bg-[#031da6] text-white rounded-md cursor-pointer"
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
                    className={`text-[11px] font-mono px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
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
        </div>
      ) : (
        /* Ô kích hoạt khi chưa chọn */
        <div
          onClick={() => !disabled && setOpen(true)}
          className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:border-[#031da6] flex items-center justify-between gap-2.5 transition-all cursor-pointer shadow-2xs ${
            open ? "border-[#031da6] ring-2 ring-blue-100" : ""
          } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
        >
          <div className="flex items-center gap-2.5 text-slate-500 text-[13px] min-w-0">
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#031da6] flex items-center justify-center shrink-0 border border-blue-100">
              <Bus className="w-3.5 h-3.5" />
            </div>
            <span className="truncate font-medium text-slate-600">
              Chọn đoàn xe, điểm đón & giờ đón (hoặc tạo mới)…
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="text-[11.5px] font-extrabold text-[#031da6] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Tạo đoàn mới</span>
            </button>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      )}

      {/* 2. POPOVER DANH SÁCH ĐOÀN XE & ĐIỂM ĐÓN */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[360px] animate-dropdown">
          {/* Header tìm kiếm & Tạo nhanh */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm đoàn xe, điểm đón, giờ đón, tuyến xã..."
                  className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-300 bg-white text-[13px] font-medium outline-none focus:border-[#031da6] focus:ring-2 focus:ring-blue-100"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Nút Tạo nhanh đoàn xe */}
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="h-9 px-3 rounded-xl bg-[#031da6] hover:bg-[#021473] text-white text-[12px] font-extrabold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4 text-teal-300 stroke-[3]" />
                <span>Tạo đoàn xe mới</span>
              </button>
            </div>

            {/* Lối tắt: Tự túc / Xe nhà */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
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
                className="flex-1 text-left px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-white transition-all flex items-center justify-between text-[12px] text-slate-700 font-bold cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-600" />
                  <span>Bệnh nhân Tự túc / Đi xe riêng</span>
                </span>
                <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                  07:30
                </span>
              </button>
            </div>
          </div>

          {/* Danh sách các đoàn xe */}
          <div className="overflow-y-auto flex-1 p-2 space-y-2.5 custom-scrollbar">
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#031da6]" />
                <span className="text-[12px]">Đang nạp danh sách đoàn xe...</span>
              </div>
            ) : filteredDoanXe.length === 0 ? (
              <div className="py-6 text-center text-slate-500 space-y-2 px-3">
                <p className="text-[12.5px] font-medium">
                  Không tìm thấy đoàn xe nào khớp với từ khóa.
                </p>
                {search.trim() ? (
                  <button
                    type="button"
                    onClick={() => handleApplyCustomDiemDon(search.trim())}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#031da6] border border-blue-200 hover:bg-blue-100 text-[12px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#031da6]" />
                    <span>Dùng điểm đón riêng: <b>&quot;{search.trim()}&quot;</b> (Giờ đón 06:00)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="text-[12px] font-bold text-[#031da6] hover:underline"
                  >
                    + Bấm vào đây để tạo đoàn xe mới với lịch đón
                  </button>
                )}
              </div>
            ) : (
              filteredDoanXe.map((dx) => (
                <div
                  key={dx.id}
                  className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs hover:border-slate-300 transition-all"
                >
                  {/* Header Đoàn xe */}
                  <div className="p-2 px-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Bus className="w-3.5 h-3.5 text-[#031da6] shrink-0" />
                      <span className="font-extrabold text-[13px] text-slate-900 truncate">
                        {dx.tenDoan}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 shrink-0">
                      📅 {fmtDate(dx.ngayDon)}
                    </span>
                  </div>

                  {/* Danh sách các điểm đón trên tuyến này */}
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
                          className={`p-2 px-3 hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                            isMatch ? "bg-blue-50/90 font-bold" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-[12.5px] text-slate-800 font-semibold truncate">
                              {c.diemDon}
                            </span>
                            {c.cacXa && c.cacXa.length > 0 && (
                              <span className="text-[11px] text-slate-400 hidden sm:inline truncate max-w-[140px]">
                                ({c.cacXa.join(", ")})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {c.soBN !== undefined && c.soBN > 0 && (
                              <span className="text-[10.5px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-900">
                                {c.soBN} BN
                              </span>
                            )}
                            <span className="font-mono text-[12px] font-extrabold text-[#031da6] bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                              ⏰ {c.gioDon}
                            </span>
                            {isMatch ? (
                              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                            ) : (
                              <span className="text-[11px] font-bold text-[#031da6] opacity-0 hover:opacity-100 transition-opacity">
                                Chọn
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. MODAL TẠO NHANH ĐOÀN XE (HỖ TRỢ NHIỀU THỜI GIAN & ĐIỂM ĐÓN) */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#031da6] text-white flex items-center justify-center">
              <Bus className="w-4 h-4 text-teal-300" />
            </div>
            <span>Tạo nhanh đoàn xe đón bệnh nhân</span>
          </div>
        }
        subtitle="Thiết lập tuyến xe đón chung với nhiều điểm dừng và khung giờ khác nhau"
        maxWidth="max-w-[560px]"
      >
        <div className="space-y-4">
          {/* Tên đoàn xe */}
          <div>
            <label className="text-[12px] font-extrabold text-slate-800 uppercase tracking-wider mb-1 block">
              Tên đoàn xe / Tuyến xe đón *
            </label>
            <input
              value={newTenDoan}
              onChange={(e) => setNewTenDoan(e.target.value)}
              placeholder="VD: Đoàn xe Tuyến Thông Hòa, Đoàn xe Cầu Kè - Trà Cú..."
              className="w-full h-10 px-3 rounded-xl border border-slate-300 text-[13.5px] font-semibold text-slate-900 outline-none focus:border-[#031da6] focus:ring-2 focus:ring-blue-100 shadow-2xs"
            />
          </div>

          {/* Ngày đón xe */}
          <div>
            <label className="text-[12px] font-extrabold text-slate-800 uppercase tracking-wider mb-1 block">
              Ngày đón xe đến bệnh viện *
            </label>
            <input
              type="date"
              value={newNgayDon}
              onChange={(e) => setNewNgayDon(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono text-[13px] font-bold text-slate-900 outline-none focus:border-[#031da6] focus:ring-2 focus:ring-blue-100 shadow-2xs"
            />
          </div>

          {/* Danh sách các điểm đón & thời gian đón */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-extrabold text-slate-800 uppercase tracking-wider">
                Lộ trình đón (Điểm đón & Giờ đón) *
              </label>
              <span className="text-[11px] text-slate-500 italic">Chọn radio để gán cho BN hiện tại</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto p-1 custom-scrollbar">
              {newChangs.map((c, idx) => (
                <div
                  key={c.id}
                  className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${
                    selectedChangIndex === idx
                      ? "border-[#031da6] bg-blue-50/50 ring-1 ring-[#031da6]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {/* Radio chọn chặng gán cho bệnh nhân đang tư vấn */}
                  <input
                    type="radio"
                    name="selected_chang"
                    checked={selectedChangIndex === idx}
                    onChange={() => setSelectedChangIndex(idx)}
                    className="w-4 h-4 text-[#031da6] cursor-pointer shrink-0 ml-1"
                    title="Chọn điểm đón này cho bệnh nhân hiện tại"
                  />

                  {/* Điểm đón */}
                  <div className="flex-1 min-w-0">
                    <input
                      value={c.diemDon}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewChangs((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, diemDon: val } : item))
                        );
                      }}
                      placeholder={`Điểm đón ${idx + 1} (Trạm y tế, ngã ba, UBND...)`}
                      className="w-full h-8 px-2.5 text-[12.5px] rounded-lg border border-slate-300 bg-white outline-none focus:border-[#031da6]"
                    />
                  </div>

                  {/* Giờ đón */}
                  <div className="w-24 shrink-0">
                    <input
                      value={c.gioDon}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewChangs((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, gioDon: val } : item))
                        );
                      }}
                      placeholder="05:30"
                      className="w-full h-8 px-2 text-[12.5px] font-mono font-bold text-center rounded-lg border border-slate-300 bg-white outline-none focus:border-[#031da6]"
                    />
                  </div>

                  {/* Nút xóa */}
                  {newChangs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChang(idx)}
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                      title="Xóa điểm này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Nút thêm điểm đón tiếp theo */}
            <button
              type="button"
              onClick={handleAddChang}
              className="mt-2 text-[12px] font-extrabold text-[#031da6] hover:underline flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-lg bg-blue-50/80 hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Thêm điểm đón & giờ đón tiếp theo</span>
            </button>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11.5px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Đoàn xe sau khi tạo sẽ được lưu vào hệ thống và tự động hiển thị cho <b>tất cả các đợt khám / xã lân cận</b> chưa qua ngày để tiện ghép đoàn.
            </span>
          </div>

          {/* Footer nút bấm */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={creating}
              onClick={handleSaveNewDoanXe}
              className="px-4 py-2 rounded-xl text-[12.5px] font-extrabold bg-[#031da6] hover:bg-[#021473] text-white shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Check className="w-4 h-4 text-teal-300 stroke-[3]" />
              )}
              <span>Lưu đoàn xe & Chọn điểm này</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
