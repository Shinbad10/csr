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
  Search,
  Users,
  Sparkles,
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
  variant?: "dropdown" | "inline";
}

const COMMON_TIMES = ["05:00", "05:30", "06:00", "06:30", "07:00", "07:30", "13:30"];

export default function DoanXeAutocomplete({
  diemDon,
  gioDon,
  ngayHen,
  onSelect,
  disabled = false,
  buoiKhamXa = "",
  variant = "dropdown",
}: DoanXeAutocompleteProps) {
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [doanXeList, setDoanXeList] = useState<DoanXeItem[]>([]);
  const [quickFilter, setQuickFilter] = useState<"all" | "xa" | "tutuc">("all");

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

  // Modal thêm điểm đón / giờ mới vào đoàn xe đã có
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [targetDoanXe, setTargetDoanXe] = useState<DoanXeItem | null>(null);
  const [newStopDiem, setNewStopDiem] = useState("");
  const [newStopGio, setNewStopGio] = useState("06:00");
  const [savingStop, setSavingStop] = useState(false);

  const handleOpenAddStopModal = (dx: DoanXeItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetDoanXe(dx);
    setNewStopDiem("");
    setNewStopGio("06:00");
    setShowAddStopModal(true);
  };

  const handleSaveAddStop = async () => {
    if (!targetDoanXe) return;
    if (!newStopDiem.trim()) {
      addToast({ type: "error", message: "Vui lòng nhập tên điểm đón mới" });
      return;
    }
    if (!newStopGio.trim()) {
      addToast({ type: "error", message: "Vui lòng nhập giờ đón mới" });
      return;
    }

    setSavingStop(true);
    try {
      const res = await fetch("/api/csr/doan-xe/diem-don", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenDoan: targetDoanXe.tenDoan,
          ngayDon: targetDoanXe.ngayDon,
          cacDiem: [{ diemDon: newStopDiem.trim(), gioDon: newStopGio.trim() }],
        }),
      });

      const json = await res.json();
      if (res.ok) {
        addToast({
          type: "success",
          message: `✓ Đã thêm mốc đón "${newStopDiem.trim()}" (${newStopGio.trim()}) vào ${targetDoanXe.tenDoan}`,
        });

        onSelect({
          diemDon: newStopDiem.trim(),
          gioDon: newStopGio.trim(),
          ngayHen: targetDoanXe.ngayDon,
        });

        loadDoanXe();
        setShowAddStopModal(false);
        setOpen(false);
      } else {
        addToast({ type: "error", message: json.error || "Không thể thêm điểm đón" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối khi lưu điểm đón" });
    } finally {
      setSavingStop(false);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Nạp danh sách đoàn xe
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

  // Đóng dropdown khi click ra ngoài (chỉ ở chế độ dropdown)
  useEffect(() => {
    if (variant !== "dropdown") return;
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
  }, [open, isEditingTime, variant]);

  useEffect(() => {
    setTimeInput(gioDon || "");
  }, [gioDon]);

  // Lọc danh sách đoàn xe
  const filteredDoanXe = useMemo(() => {
    let list = doanXeList;

    if (quickFilter === "xa" && buoiKhamXa.trim()) {
      const xLower = buoiKhamXa.trim().toLowerCase();
      list = list.filter((dx) => {
        const matchTen = dx.tenDoan.toLowerCase().includes(xLower);
        const matchDiem = dx.cacDiem.some(
          (c) =>
            c.diemDon.toLowerCase().includes(xLower) ||
            (c.cacXa && c.cacXa.some((x) => x.toLowerCase().includes(xLower)))
        );
        return matchTen || matchDiem;
      });
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();

    return list
      .map((dx) => {
        const matchTen = dx.tenDoan.toLowerCase().includes(q);
        const matchNgay = dx.ngayDon.includes(q) || fmtDate(dx.ngayDon).toLowerCase().includes(q);

        const matchedChangs = dx.cacDiem.filter((c) => {
          return (
            matchTen ||
            matchNgay ||
            c.diemDon.toLowerCase().includes(q) ||
            c.gioDon.includes(q) ||
            (c.cacXa && c.cacXa.some((x) => x.toLowerCase().includes(xLowerSafe(x))))
          );
        });

        if (matchTen || matchNgay || matchedChangs.length > 0) {
          return { ...dx, cacDiem: matchedChangs.length > 0 ? matchedChangs : dx.cacDiem };
        }
        return null;
      })
      .filter(Boolean) as DoanXeItem[];
  }, [doanXeList, searchQuery, quickFilter, buoiKhamXa]);

  function xLowerSafe(val: string) {
    return (val || "").toLowerCase();
  }

  // Số lượng tuyến liên quan đến xã của bệnh nhân
  const routesForXaCount = useMemo(() => {
    if (!buoiKhamXa.trim()) return 0;
    const xLower = buoiKhamXa.trim().toLowerCase();
    return doanXeList.filter((dx) => {
      return (
        dx.tenDoan.toLowerCase().includes(xLower) ||
        dx.cacDiem.some(
          (c) =>
            c.diemDon.toLowerCase().includes(xLower) ||
            (c.cacXa && c.cacXa.some((x) => x.toLowerCase().includes(xLower)))
        )
      );
    }).length;
  }, [doanXeList, buoiKhamXa]);

  const isSelected = Boolean(diemDon && diemDon.trim());
  const isTuTuc =
    diemDon.toLowerCase().includes("tự túc") ||
    diemDon.toLowerCase().includes("xe nhà") ||
    diemDon.toLowerCase().includes("xe riêng");

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

  // Render danh sách đoàn xe & các điểm đón
  const renderRoutesList = (isInline: boolean) => (
    <div
      className={`space-y-3 ${
        isInline ? "max-h-[380px] overflow-y-auto pr-1" : "max-h-[340px] overflow-y-auto p-2 space-y-2.5"
      } custom-scrollbar`}
    >
      {/* 1. Tùy chọn Bệnh nhân Tự túc / Đi xe riêng */}
      {quickFilter !== "xa" && (
        <div
          onClick={() => {
            onSelect({
              diemDon: "Tự túc / Xe riêng",
              gioDon: gioDon || "07:30",
              ngayHen: ngayHen,
            });
            if (!isInline) setOpen(false);
          }}
          className={`group rounded-xl border p-3 transition-all cursor-pointer flex items-center justify-between gap-3 ${
            isTuTuc
              ? "bg-blue-50/80 border-[#031da6] ring-1 ring-[#031da6] shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isTuTuc ? "bg-[#031da6] text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
              }`}
            >
              <Car className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[13.5px] text-slate-900 flex items-center gap-2">
                <span>Bệnh nhân Tự túc / Đi xe riêng</span>
                {isTuTuc && (
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-[#031da6]">
                    Đang chọn
                  </span>
                )}
              </div>
              <p className="text-[12px] text-slate-500 truncate mt-0.5">
                Bệnh nhân chủ động phương tiện đến bệnh viện theo giờ hẹn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1">
              {["07:00", "07:30", "08:00"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect({
                      diemDon: "Tự túc / Xe riêng",
                      gioDon: t,
                      ngayHen: ngayHen,
                    });
                    if (!isInline) setOpen(false);
                  }}
                  className={`text-[11px] font-mono font-bold px-2 py-1 rounded-md border transition-all cursor-pointer ${
                    isTuTuc && (gioDon === t || (!gioDon && t === "07:30"))
                      ? "bg-[#031da6] text-white border-[#031da6] shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {isTuTuc && (
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#031da6]" />
          <span className="text-[12.5px] font-medium">Đang tải danh sách các tuyến xe đón...</span>
        </div>
      ) : filteredDoanXe.length === 0 ? (
        <div className="py-8 text-center text-slate-500 space-y-3 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-700">Không tìm thấy đoàn xe phù hợp</p>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Thử tìm kiếm với từ khóa khác hoặc tạo đoàn xe mới cho tuyến này
            </p>
          </div>
          <div className="pt-1 flex items-center justify-center gap-2">
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => {
                  onSelect({
                    diemDon: searchQuery.trim(),
                    gioDon: gioDon || "06:00",
                    ngayHen,
                  });
                  if (!isInline) setOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-[#031da6] border border-blue-200 hover:bg-blue-100 text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Chọn điểm: &quot;{searchQuery.trim()}&quot; (06:00)</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-3.5 py-1.5 rounded-xl bg-[#031da6] text-white hover:bg-[#02106a] text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo đoàn xe mới</span>
            </button>
          </div>
        </div>
      ) : (
        filteredDoanXe.map((dx) => {
          const isXaMatch =
            buoiKhamXa &&
            (dx.tenDoan.toLowerCase().includes(buoiKhamXa.toLowerCase()) ||
              dx.cacDiem.some(
                (c) =>
                  c.diemDon.toLowerCase().includes(buoiKhamXa.toLowerCase()) ||
                  (c.cacXa && c.cacXa.some((x) => x.toLowerCase().includes(buoiKhamXa.toLowerCase())))
              ));

          return (
            <div
              key={dx.id}
              className={`rounded-2xl border transition-all overflow-hidden bg-white shadow-xs ${
                isXaMatch ? "border-blue-200 ring-1 ring-blue-100" : "border-slate-200"
              }`}
            >
              {/* Header tuyến xe */}
              <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-200/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-[#031da6] flex items-center justify-center shrink-0">
                    <Bus className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[13.5px] text-slate-900 truncate">
                        {dx.tenDoan}
                      </span>
                      {isXaMatch && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Tuyến xã {buoiKhamXa}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    <Calendar className="w-3 h-3 text-indigo-600" />
                    <span>{fmtDate(dx.ngayDon)}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md hidden md:inline">
                    {dx.cacDiem.length} điểm đón
                  </span>
                </div>
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
                        if (!isInline) setOpen(false);
                      }}
                      className={`px-3.5 py-2.5 transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                        isMatch
                          ? "bg-blue-50/90 font-bold border-l-4 border-l-[#031da6]"
                          : "hover:bg-slate-50/90 border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isMatch
                              ? "bg-emerald-500 text-white"
                              : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[13px] leading-snug break-words ${
                                isMatch ? "text-[#031da6] font-extrabold" : "text-slate-800 font-semibold"
                              }`}
                            >
                              {c.diemDon}
                            </span>
                            {c.cacXa && c.cacXa.length > 0 && (
                              <span className="text-[11px] font-medium text-slate-500 bg-slate-100/90 px-2 py-0.2 rounded-md">
                                {c.cacXa.join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {c.soBN !== undefined && c.soBN > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-100/90 text-blue-900">
                            <Users className="w-3 h-3" />
                            <span>{c.soBN} BN</span>
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[12px] font-extrabold px-2 py-0.5 rounded-md border shadow-2xs ${
                            isMatch
                              ? "bg-[#031da6] text-white border-[#031da6]"
                              : "bg-white text-[#031da6] border-blue-200 group-hover:border-[#031da6]"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{c.gioDon}</span>
                        </span>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                            isMatch
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300 group-hover:border-slate-400 bg-white"
                          }`}
                        >
                          {isMatch && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nút thêm điểm đón / giờ mới cho tuyến */}
              <div className="p-2 bg-slate-50/70 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => handleOpenAddStopModal(dx, e)}
                  className="w-full py-1.5 text-[11.5px] font-bold text-[#031da6] hover:bg-blue-50/80 rounded-xl border border-dashed border-blue-200 hover:border-[#031da6] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Thêm điểm đón / giờ mới vào {dx.tenDoan}</span>
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="relative" ref={containerRef}>
      {/* A. NẾU LÀ DẠNG INLINE (Dùng trong Modal Xếp xe chuyên dụng) */}
      {variant === "inline" ? (
        <div className="space-y-3">
          {/* Thanh công cụ tìm kiếm & tạo mới */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm đoàn xe, điểm đón, xã, khung giờ..."
                className="w-full h-10 pl-9 pr-8 text-[13px] rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#031da6] focus:ring-2 focus:ring-blue-100 font-medium text-slate-800 placeholder:text-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="h-10 px-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#031da6] border border-blue-200 font-bold text-[12.5px] inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tạo đoàn xe mới</span>
            </button>
          </div>

          {/* Thanh filter tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[11.5px] font-bold">
            <button
              type="button"
              onClick={() => setQuickFilter("all")}
              className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                quickFilter === "all"
                  ? "bg-[#031da6] text-white border-[#031da6]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Tất cả tuyến ({doanXeList.length})
            </button>

            {buoiKhamXa && (
              <button
                type="button"
                onClick={() => setQuickFilter("xa")}
                className={`px-3 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                  quickFilter === "xa"
                    ? "bg-[#031da6] text-white border-[#031da6]"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Tuyến xã {buoiKhamXa} ({routesForXaCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onSelect({
                  diemDon: "Tự túc / Xe riêng",
                  gioDon: gioDon || "07:30",
                  ngayHen: ngayHen,
                });
              }}
              className={`px-3 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                isTuTuc
                  ? "bg-blue-50 text-[#031da6] border-[#031da6]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Car className="w-3 h-3" />
              <span>Đi xe riêng / Tự túc</span>
            </button>
          </div>

          {/* Danh sách các tuyến */}
          {renderRoutesList(true)}
        </div>
      ) : (
        /* B. NẾU LÀ DẠNG DROPDOWN (Dùng trong Form khám / tư vấn) */
        <>
          {isSelected ? (
            <div className="h-11 px-3.5 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center justify-between gap-2 transition-all shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#031da6] flex items-center justify-center shrink-0">
                  {isTuTuc ? <Car className="w-4 h-4 text-slate-700" /> : <Bus className="w-4 h-4 text-[#031da6]" />}
                </div>

                <span className="font-extrabold text-[13px] text-slate-900 truncate">
                  {diemDon}
                </span>

                {gioDon && (
                  <button
                    type="button"
                    onClick={() => !disabled && setIsEditingTime(!isEditingTime)}
                    title="Bấm để đổi giờ xe đón bệnh nhân này"
                    className="inline-flex items-center gap-1 font-mono text-[11.5px] font-black px-2 py-0.5 rounded-md bg-white text-[#031da6] border border-blue-300 shadow-2xs hover:border-[#031da6] hover:bg-blue-50 cursor-pointer shrink-0 transition-all active:scale-95"
                  >
                    <Clock className="w-3 h-3 text-[#031da6]" />
                    <span>{gioDon}</span>
                    <span className="text-[10px] text-slate-400 font-sans font-medium flex items-center ml-0.5">
                      <Edit3 className="w-2.5 h-2.5 mr-0.5" />Đổi giờ
                    </span>
                  </button>
                )}

                {ngayHen && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 shrink-0">
                    <Calendar className="w-3 h-3 text-indigo-600" />
                    <span>{fmtDate(ngayHen)}</span>
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
            <div
              className={`h-11 px-3.5 rounded-xl border border-slate-300 bg-white hover:border-[#031da6] flex items-center justify-between gap-2 transition-all shadow-2xs ${
                open ? "border-[#031da6] ring-2 ring-blue-100" : ""
              } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
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
                  className="w-full h-full bg-transparent text-[13px] font-semibold text-slate-900 outline-none placeholder:text-slate-400"
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
                  className="text-[11.5px] font-extrabold text-[#031da6] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Tạo đoàn</span>
                </button>
                <ChevronDown
                  onClick={() => !disabled && setOpen(!open)}
                  className={`w-4 h-4 text-slate-400 cursor-pointer transition-transform ${open ? "rotate-180" : ""}`}
                />
              </div>
            </div>
          )}

          {/* Popover chỉnh nhanh giờ đón */}
          {isEditingTime && !disabled && (
            <div className="mt-1.5 p-2.5 bg-white rounded-xl border border-blue-200 shadow-lg flex items-center gap-2 flex-wrap animate-fade-in z-40">
              <span className="text-[12px] font-bold text-slate-700">Giờ xe đón:</span>
              <input
                type="text"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                placeholder="06:00"
                maxLength={5}
                className="w-18 h-7 px-1 text-[12.5px] font-mono font-bold text-center border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#031da6]"
              />
              <button
                type="button"
                onClick={() => {
                  onSelect({ diemDon, gioDon: timeInput, ngayHen });
                  setIsEditingTime(false);
                }}
                className="px-2.5 py-1 text-[11.5px] font-bold bg-[#031da6] text-white rounded-lg cursor-pointer"
              >
                Lưu giờ
              </button>
              <div className="flex items-center gap-1 flex-wrap">
                {COMMON_TIMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      onSelect({ diemDon, gioDon: t, ngayHen });
                      setIsEditingTime(false);
                    }}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
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

          {/* Popover Dropdown khi mở */}
          {open && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[380px] animate-dropdown">
              {renderRoutesList(false)}

              {/* Footer popover */}
              <div className="p-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[12px]">
                <span className="text-slate-500 font-medium">Chưa có đoàn xe phù hợp?</span>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="font-extrabold text-[#031da6] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Tạo đoàn xe mới (nhiều điểm & giờ)</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 3. MODAL TẠO NHANH ĐOÀN XE */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        icon={Bus}
        title="Tạo nhanh đoàn xe đón bệnh nhân"
        subtitle="Khai báo tuyến xe chung và nhiều điểm đón kèm khung giờ khác nhau"
        maxWidth="max-w-[560px]"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={creating}
              onClick={handleSaveNewDoanXe}
              className="px-4 py-2 rounded-xl text-[12.5px] font-extrabold bg-[#031da6] hover:bg-[#021473] text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Check className="w-4 h-4 text-teal-300 stroke-[3]" />
              )}
              <span>Lưu & Chọn đoàn xe này</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider mb-1 block">
              Tên đoàn xe / Tuyến xe đón *
            </label>
            <input
              value={newTenDoan}
              onChange={(e) => setNewTenDoan(e.target.value)}
              placeholder="VD: Tuyến Xã Thông Hòa, Tuyến Cầu Kè - Trà Cú..."
              className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-[13px] font-semibold text-slate-900 outline-none focus:border-[#031da6] focus:ring-2 focus:ring-blue-100 transition-all"
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
              className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-mono text-[13px] font-bold text-slate-900 outline-none focus:border-[#031da6] focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider">
                Lộ trình đón (Điểm đón & Giờ đón) *
              </label>
              <span className="text-[11px] text-slate-500 font-medium">Tích chọn để gán cho BN này</span>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
              {newChangs.map((c, idx) => (
                <div
                  key={c.id}
                  className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${
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
                    className="flex-1 h-8 px-2.5 text-[12.5px] rounded-lg border border-slate-300 bg-white outline-none focus:border-[#031da6]"
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
                    className="w-22 h-8 px-1 text-[12.5px] font-mono font-bold text-center rounded-lg border border-slate-300 bg-white outline-none focus:border-[#031da6]"
                  />
                  {newChangs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChang(idx)}
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
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
              className="mt-2 text-[12px] font-bold text-[#031da6] hover:underline flex items-center gap-1 cursor-pointer py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Thêm điểm đón & giờ đón tiếp theo</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* 4. MODAL THÊM ĐIỂM ĐÓN / GIỜ MỚI VÀO ĐOÀN XE ĐÃ CÓ */}
      <Modal
        open={showAddStopModal}
        onClose={() => setShowAddStopModal(false)}
        icon={Plus}
        title="Thêm điểm đón / giờ mới vào đoàn xe"
        subtitle={targetDoanXe ? `${targetDoanXe.tenDoan} • Ngày đón: ${fmtDate(targetDoanXe.ngayDon)}` : ""}
        maxWidth="max-w-[480px]"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setShowAddStopModal(false)}
              className="px-4 py-2 text-[12.5px] font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={savingStop}
              onClick={handleSaveAddStop}
              className="px-4 py-2 text-[12.5px] font-bold bg-[#031da6] hover:bg-[#020f5c] text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {savingStop && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Lưu & Chọn điểm này</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider mb-1 block">
              Tên vị trí / Điểm đón mới *
            </label>
            <input
              type="text"
              value={newStopDiem}
              onChange={(e) => setNewStopDiem(e.target.value)}
              placeholder="VD: Trụ sở ấp 2, Ngã ba Chợ Xếp, Cầu Hàm Luông..."
              className="w-full h-10 px-3.5 text-[13px] border border-slate-300 rounded-xl focus:outline-none focus:border-[#031da6] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider mb-1 block">
              Khung giờ xe đón tại điểm này *
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newStopGio}
                  onChange={(e) => setNewStopGio(e.target.value)}
                  placeholder="06:00"
                  maxLength={5}
                  className="w-24 h-10 px-3 text-[13px] font-mono font-bold border border-slate-300 rounded-xl text-center focus:outline-none focus:border-[#031da6]"
                />
                <div className="flex items-center gap-1 flex-wrap">
                  {COMMON_TIMES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewStopGio(t)}
                      className={`text-[11px] font-mono px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                        newStopGio === t
                          ? "bg-[#031da6] text-white border-[#031da6] font-bold"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11.5px] text-slate-500">
                Gợi ý: Nếu cùng 1 vị trí đón nhưng bổ sung thêm chuyến/giờ mới, chỉ cần nhập lại tên điểm đón và chọn khung giờ này.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
