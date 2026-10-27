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
} from "lucide-react";
import Modal from "@/components/layout/Modal";
import { fmtDate, suggestNextTime } from "@/lib/csr";
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

  // Nhân bản nhanh toàn bộ thông tin tuyến xe sang Đoàn 2 (cùng điểm đón, giờ đón tự lùi sau)
  const handleCloneToNextDoan = (dx: DoanXeItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cleanName = dx.tenDoan.replace(/\s*[-–—]\s*(?:Đoàn|Doan)\s*[12]/gi, "").trim();
    setNewTenDoan(`${cleanName} - Đoàn 2`);
    setNewNgayDon(dx.ngayDon);
    setNewChangs(
      dx.cacDiem.map((c, i) => ({
        id: `c_${Date.now()}_${i}`,
        diemDon: c.diemDon,
        gioDon: suggestNextTime(c.gioDon),
      }))
    );
    setSelectedChangIndex(0);
    setShowCreateModal(true);
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
  // company-ui: thẻ trắng viền mảnh, navy = đang chọn / thao tác, mono cho giờ & số
  const renderRoutesList = (isInline: boolean) => (
    <div
      className={`space-y-2.5 ${isInline ? "max-h-[380px] overflow-y-auto pr-1" : "max-h-[340px] overflow-y-auto p-2"} custom-scrollbar`}
    >
      {/* 1. Tự túc / đi xe riêng */}
      {quickFilter !== "xa" && (
        <div
          onClick={() => {
            onSelect({ diemDon: "Tự túc / Xe riêng", gioDon: gioDon || "07:30", ngayHen: ngayHen });
            if (!isInline) setOpen(false);
          }}
          className={`rounded-[12px] border px-3 py-2.5 transition-all cursor-pointer flex items-center justify-between gap-3 flex-wrap ${
            isTuTuc ? "border-[var(--navy)] bg-[var(--navy-50)]" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 ${
                isTuTuc ? "bg-[var(--navy)] text-white" : "bg-[var(--surface-soft)] text-[var(--ink-soft)]"
              }`}
            >
              <Car className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className={`text-[13px] font-semibold ${isTuTuc ? "text-[var(--navy)]" : "text-[var(--ink)]"}`}>Tự túc / Đi xe riêng</div>
              <p className="text-[11.5px] text-[var(--mute)] truncate">Bệnh nhân tự đến bệnh viện theo giờ hẹn</p>
            </div>
          </div>
          <div className="inline-flex p-0.5 rounded-[9px] bg-[var(--surface-soft)] border border-[var(--line)] gap-0.5 shrink-0">
            {["07:00", "07:30", "08:00"].map((t) => {
              const on = isTuTuc && (gioDon === t || (!gioDon && t === "07:30"));
              return (
                <button
                  key={t}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect({ diemDon: "Tự túc / Xe riêng", gioDon: t, ngayHen: ngayHen });
                    if (!isInline) setOpen(false);
                  }}
                  className={`h-6 px-2 rounded-[7px] font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                    on ? "bg-[var(--navy)] text-white" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-[var(--mute)] gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--navy)]" />
          <span className="text-[12.5px]">Đang tải danh sách tuyến xe đón…</span>
        </div>
      ) : filteredDoanXe.length === 0 ? (
        <div className="py-6 px-4 text-center rounded-[12px] border border-dashed border-[var(--line-strong)]">
          <p className="text-[13px] font-semibold text-[var(--ink)]">Không tìm thấy tuyến xe phù hợp</p>
          <p className="text-[12px] text-[var(--mute)] mt-0.5">Thử từ khoá khác hoặc tạo tuyến mới</p>
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => {
                  onSelect({ diemDon: searchQuery.trim(), gioDon: gioDon || "06:00", ngayHen });
                  if (!isInline) setOpen(false);
                }}
                className="h-8 px-3 rounded-[9px] border border-[var(--navy)]/20 bg-[var(--navy-50)] text-[var(--navy)] text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                Chọn điểm &quot;{searchQuery.trim()}&quot; · <span className="font-mono">06:00</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="h-8 px-3 rounded-[9px] bg-gradient-to-b from-[var(--navy)] to-[var(--navy-deep)] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-[var(--navy-shadow)]"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo tuyến xe mới
            </button>
          </div>
        </div>
      ) : (
        filteredDoanXe.map((dx) => {
          const xaLower = buoiKhamXa?.toLowerCase() || "";
          const isXaMatch =
            buoiKhamXa &&
            (dx.tenDoan.toLowerCase().includes(xaLower) ||
              dx.cacDiem.some((c) => c.diemDon.toLowerCase().includes(xaLower) || (c.cacXa && c.cacXa.some((x) => x.toLowerCase().includes(xaLower)))));

          return (
            <div key={dx.id} className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
              {/* Header tuyến */}
              <div className="px-3 py-2 bg-[var(--surface-soft)]/60 border-b border-[var(--line-soft)] flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <Bus className="w-3.5 h-3.5 text-[var(--navy)] shrink-0" />
                  <span className="text-[13px] font-semibold text-[var(--ink)] truncate">{dx.tenDoan}</span>
                  {isXaMatch && (
                    <span className="hidden sm:inline-flex h-5 px-1.5 rounded-full bg-[var(--teal-soft)] text-[var(--teal-deep)] text-[10.5px] font-semibold items-center">
                      Cùng xã
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5 shrink-0 text-[11.5px] text-[var(--mute)]">
                  <span className="inline-flex items-center gap-1 font-mono font-semibold text-[var(--ink-soft)]">
                    <Calendar className="w-3 h-3 text-[var(--teal-deep)]" />
                    {fmtDate(dx.ngayDon)}
                  </span>
                  <span className="hidden md:inline">
                    <span className="font-mono">{dx.cacDiem.length}</span> điểm
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCloneToNextDoan(dx, e)}
                    className="h-6 px-2 rounded-[7px] border border-[var(--line)] bg-[var(--surface)] text-[11px] font-semibold text-[var(--ink-soft)] hover:text-[var(--navy)] hover:border-[var(--navy)]/40 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Tạo nhanh đoàn tiếp theo cùng lộ trình, giờ đón muộn hơn"
                  >
                    <Plus className="w-3 h-3" /> Đoàn sau
                  </button>
                </div>
              </div>

              {/* Các điểm đón của tuyến */}
              <div className="divide-y divide-[var(--line-soft)]">
                {dx.cacDiem.map((c) => {
                  const isMatch = diemDon === c.diemDon && gioDon === c.gioDon;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        onSelect({ diemDon: c.diemDon, gioDon: c.gioDon, ngayHen: dx.ngayDon });
                        if (!isInline) setOpen(false);
                      }}
                      className={`pl-2.5 pr-3 py-2 flex items-center justify-between gap-3 cursor-pointer border-l-2 transition-colors ${
                        isMatch ? "bg-[var(--navy-50)] border-l-[var(--navy)]" : "border-l-transparent hover:bg-[var(--surface-soft)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${
                            isMatch ? "border-[var(--navy)]" : "border-[var(--line-strong)]"
                          }`}
                        >
                          {isMatch && <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />}
                        </span>
                        <div className="min-w-0">
                          <div className={`text-[13px] leading-snug break-words ${isMatch ? "text-[var(--navy)] font-semibold" : "text-[var(--ink)] font-medium"}`}>
                            {c.diemDon}
                          </div>
                          {c.cacXa && c.cacXa.length > 0 && <div className="text-[11px] text-[var(--mute)] truncate">{c.cacXa.join(", ")}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-[11.5px]">
                        {c.soBN !== undefined && c.soBN > 0 && (
                          <span className="text-[var(--mute)]">
                            <span className="font-mono font-semibold text-[var(--ink-soft)]">{c.soBN}</span> BN
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 font-mono text-[12px] font-semibold ${isMatch ? "text-[var(--navy)]" : "text-[var(--ink-soft)]"}`}>
                          <Clock className="w-3 h-3" />
                          {c.gioDon}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={(e) => handleOpenAddStopModal(dx, e)}
                className="w-full h-8 border-t border-[var(--line-soft)] text-[11.5px] font-semibold text-[var(--mute)] hover:text-[var(--navy)] hover:bg-[var(--surface-soft)] flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm điểm đón / giờ vào tuyến này
              </button>
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
        <div className="space-y-2.5">
          {/* Tìm + tạo tuyến mới */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-[var(--mute)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tuyến, điểm đón, xã, giờ…"
                className="w-full h-9 pl-8 pr-8 rounded-[10px] border border-[var(--line)] bg-[var(--surface-soft)] text-[13px] text-[var(--ink)] placeholder:text-[var(--mute-soft)] outline-none focus:bg-[var(--surface)] focus:border-[var(--navy)] focus:shadow-[0_0_0_3px_var(--navy-100)] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="h-9 px-3 rounded-[10px] border border-dashed border-[var(--line-strong)] text-[12.5px] font-semibold text-[var(--ink-soft)] hover:text-[var(--navy)] hover:border-[var(--navy)]/40 inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo tuyến xe mới
            </button>
          </div>

          {/* Lọc nhanh */}
          <div className="inline-flex p-0.5 rounded-[10px] bg-[var(--surface-soft)] border border-[var(--line)] gap-0.5 max-w-full overflow-x-auto no-scrollbar">
            {([
              ["all", `Tất cả tuyến`, doanXeList.length],
              ...(buoiKhamXa ? ([["xa", `Xã ${buoiKhamXa}`, routesForXaCount]] as const) : []),
            ] as const).map(([k, label, n]) => (
              <button
                key={k}
                type="button"
                onClick={() => setQuickFilter(k as typeof quickFilter)}
                className={`shrink-0 h-7 px-2.5 rounded-[8px] text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  quickFilter === k ? "bg-[var(--navy)] text-white shadow-[var(--navy-shadow)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {label}
                <span className={`font-mono text-[10.5px] ${quickFilter === k ? "text-white/75" : "text-[var(--mute)]"}`}>{n}</span>
              </button>
            ))}
          </div>

          {/* Danh sách các tuyến */}
          {renderRoutesList(true)}
        </div>
      ) : (
        /* B. NẾU LÀ DẠNG DROPDOWN (Dùng trong Form khám / tư vấn) */
        <>
          {isSelected ? (
            /* Hai dòng: tên điểm đón + nút | giờ + ngày. Trước đây dồn một dòng cao cố định 44px nên
               trên điện thoại ngày hẹn đè lên nút "Đổi đoàn". */
            <div className="px-3 py-2.5 rounded-[12px] border border-[var(--navy)]/15 bg-[var(--navy-50)]/60 flex items-start gap-2.5 transition-all">
              <div className="w-8 h-8 rounded-[9px] bg-[var(--surface)] border border-[var(--navy)]/15 flex items-center justify-center shrink-0">
                {isTuTuc ? <Car className="w-4 h-4 text-[var(--ink-soft)]" /> : <Bus className="w-4 h-4 text-[var(--navy)]" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[var(--ink)] truncate leading-8" title={diemDon}>
                  {diemDon}
                </div>
                {(gioDon || ngayHen) && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {gioDon && (
                      <button
                        type="button"
                        onClick={() => !disabled && setIsEditingTime(!isEditingTime)}
                        title="Bấm để đổi giờ xe đón bệnh nhân này"
                        className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-[var(--surface)] border border-[var(--navy)]/25 font-mono text-[11.5px] font-bold text-[var(--navy)] hover:border-[var(--navy)] cursor-pointer transition-colors"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{gioDon}</span>
                        {!disabled && <Edit3 className="w-2.5 h-2.5 text-[var(--mute)] ml-0.5" />}
                      </button>
                    )}
                    {ngayHen && (
                      <span className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-[var(--surface)] border border-[var(--line)] font-mono text-[11px] font-semibold text-[var(--ink-soft)]">
                        <Calendar className="w-3 h-3 text-[var(--teal-deep)]" />
                        <span>{fmtDate(ngayHen)}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {!disabled && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setOpen(true);
                    }}
                    className="h-8 px-2.5 text-[12px] font-semibold text-[var(--navy)] bg-[var(--surface)] hover:bg-[var(--navy)] hover:text-white rounded-[8px] border border-[var(--navy)]/20 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Đổi đoàn
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelect({ diemDon: "", gioDon: "" })}
                    className="w-8 h-8 flex items-center justify-center text-[var(--mute)] hover:text-[var(--rose)] rounded-[8px] hover:bg-[var(--surface)] transition-colors cursor-pointer"
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
