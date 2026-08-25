"use client";

import React, { useState, useEffect, useMemo } from "react";
import Modal from "@/components/layout/Modal";
import {
  Users,
  Search,
  Calendar,
  MapPin,
  UserCheck,
  Loader2,
  Stethoscope,
  Eye,
  CheckCircle2,
  Clock,
  Phone,
  CreditCard,
  FileSpreadsheet,
  Sparkles,
  Filter,
  X,
  ChevronDown,
  Download,
  Activity,
  HeartHandshake,
  ShieldCheck,
  CalendarHeart,
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import * as XLSX from "xlsx";
import { fmtDate, statusOf, bhytLevel, ageOf, parseDiag, classifyCSRNhom } from "@/lib/csr";
import { StatusBadge } from "@/components/csr/fields";
import { PatientInfoModal } from "@/components/csr/PatientModals";
import { useToast } from "@/components/providers/ToastProvider";

export interface ReportModalTarget {
  type: string;
  val?: string;
  title: string;
  subtitle?: string;
  icon?: any;
  dateFilterLabel?: string;
}

interface ReportDetailModalProps {
  open: boolean;
  onClose: () => void;
  target: ReportModalTarget | null;
  dateFilter: "all" | "30days" | "90days" | "year";
  coSoName?: string;
  sessions?: Array<{
    id: string;
    ngayKham: string;
    xa: string;
    diaDiem: string;
    bacSi: string;
    tong: number;
    nhomA: number;
    nhomB: number;
    daMo: number;
  }>;
  onExportSessionExcel?: (buoiKhamId: string) => void;
}

export default function ReportDetailModal({
  open,
  onClose,
  target,
  dateFilter,
  coSoName,
  sessions = [],
  onExportSessionExcel,
}: ReportDetailModalProps) {
  const { addToast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<"ALL" | "A" | "B" | "OTHER">("ALL");
  const [surgeryFilter, setSurgeryFilter] = useState<"ALL" | "DA_MO" | "CHUA_MO">("ALL");
  const [bhytFilter, setBhytFilter] = useState<"ALL" | "CO_BHYT" | "KHONG_BHYT">("ALL");
  
  // Phân trang
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modal xem chi tiết hồ sơ bệnh nhân
  const [selectedHoSoId, setSelectedHoSoId] = useState<string | null>(null);

  // Fetch danh sách hồ sơ chi tiết khi mở modal
  useEffect(() => {
    if (!open || !target) {
      setData([]);
      setSearch("");
      setGroupFilter("ALL");
      setSurgeryFilter("ALL");
      setBhytFilter("ALL");
      setPage(1);
      return;
    }

    if (target.type === "kpi_soBuoi") {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    const fetchDetail = async () => {
      try {
        let url = `/api/csr/reports/detail?type=${encodeURIComponent(target.type)}`;
        if (target.val) {
          url += `&val=${encodeURIComponent(target.val)}`;
        }
        const now = new Date();
        if (dateFilter === "30days") {
          const d = new Date();
          d.setDate(d.getDate() - 30);
          url += `&from=${d.toISOString().slice(0, 10)}`;
        } else if (dateFilter === "90days") {
          const d = new Date();
          d.setDate(d.getDate() - 90);
          url += `&from=${d.toISOString().slice(0, 10)}`;
        } else if (dateFilter === "year") {
          url += `&from=${now.getFullYear()}-01-01`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (active) {
            setData(json.items || []);
          }
        }
      } catch (e) {
        console.error("Lỗi nạp chi tiết:", e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDetail();

    return () => {
      active = false;
    };
  }, [open, target, dateFilter]);

  // Bộ lọc tìm kiếm & nhóm
  const filtered = useMemo(() => {
    if (target?.type === "kpi_soBuoi") {
      return sessions.filter((s) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase().trim();
        return (
          (s.xa || "").toLowerCase().includes(q) ||
          (s.diaDiem || "").toLowerCase().includes(q) ||
          (s.bacSi || "").toLowerCase().includes(q) ||
          (s.ngayKham || "").toLowerCase().includes(q)
        );
      });
    }

    return data.filter((p) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const fullText = [
          p.hoTen,
          p.maBN,
          p.maBNHIS,
          p.cccd,
          p.sdt,
          p.sdtNguoiNha,
          p.diaChi,
          p.xaPhuong,
          p.khuPho,
          p.buoiKham?.xa,
          p.buoiKham?.diaDiem,
          p.bacSiChiDinh,
          p.buoiKham?.bacSiKham,
          p.nhanVienTuVan,
          p.chanDoan,
          p.chanDoanMP,
          p.chanDoanMT,
          p.chanDoanKhac,
          p.loaiBenhLy,
          p.loaiBenhLyKhac,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!fullText.includes(q)) return false;
      }

      const { isNhomA, isNhomB, isDaMo } = classifyCSRNhom(p);

      // Group
      if (groupFilter === "A") {
        if (!isNhomA) return false;
      } else if (groupFilter === "B") {
        if (!isNhomB) return false;
      } else if (groupFilter === "OTHER") {
        if (isNhomA || isNhomB) return false;
      }

      // Surgery
      if (surgeryFilter === "DA_MO") {
        if (!isDaMo) return false;
      } else if (surgeryFilter === "CHUA_MO") {
        if (isDaMo) return false;
      }

      // BHYT
      if (bhytFilter === "CO_BHYT") {
        if (!p.bhyt || p.bhyt.trim().length < 8) return false;
      } else if (bhytFilter === "KHONG_BHYT") {
        if (p.bhyt && p.bhyt.trim().length >= 8) return false;
      }

      return true;
    });
  }, [data, sessions, search, groupFilter, surgeryFilter, bhytFilter, target?.type]);

  // Thống kê nhanh trong modal
  const stats = useMemo(() => {
    if (target?.type === "kpi_soBuoi") {
      let totalTong = 0;
      let totalNhomA = 0;
      let totalNhomB = 0;
      let totalDaMo = 0;
      sessions.forEach((s) => {
        totalTong += s.tong;
        totalNhomA += s.nhomA;
        totalNhomB += s.nhomB;
        totalDaMo += s.daMo;
      });
      return {
        total: sessions.length,
        totalPatients: totalTong,
        nhomA: totalNhomA,
        nhomB: totalNhomB,
        daMo: totalDaMo,
        bhyt: 0,
      };
    }

    let nhomA = 0;
    let nhomB = 0;
    let daMo = 0;
    let coBhyt = 0;

    data.forEach((p) => {
      const { isNhomA, isNhomB, isDaMo } = classifyCSRNhom(p);
      if (isNhomA) nhomA++;
      else if (isNhomB) nhomB++;
      if (isDaMo) daMo++;
      if (p.bhyt && p.bhyt.trim().length >= 8) coBhyt++;
    });

    return { total: data.length, nhomA, nhomB, daMo, bhyt: coBhyt };
  }, [data, sessions, target?.type]);

  // Paging
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Xuất Excel danh sách đang xem trong Modal
  const exportModalExcel = () => {
    try {
      if (target?.type === "kpi_soBuoi") {
        const rows = (filtered as typeof sessions).map((s, idx) => ({
          STT: idx + 1,
          "Mã đợt khám": s.id,
          "Ngày khám": s.ngayKham ? fmtDate(s.ngayKham) : "",
          "Địa bàn / Xã": s.xa || "",
          "Điểm khám": s.diaDiem || "",
          "Bác sĩ phụ trách": s.bacSi || "",
          "Tiếp nhận (BN)": s.tong,
          "Nhóm A (Chỉ định mổ)": s.nhomA,
          "Nhóm B (Theo dõi)": s.nhomB,
          "Đã phẫu thuật": s.daMo,
          "Tỷ lệ mổ (%)": s.nhomA > 0 ? `${Math.round((s.daMo / s.nhomA) * 100)}%` : "0%",
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachDotKham");
        XLSX.writeFile(wb, `Danh_Sach_Dot_Kham_CSR_${new Date().toISOString().slice(0, 10)}.xlsx`);
        addToast({ type: "success", message: "Đã xuất file Excel danh sách đợt khám thành công!" });
        return;
      }

      const rows = (filtered as any[]).map((p, idx) => {
        const age = ageOf(p) || (p.namSinh ? new Date().getFullYear() - p.namSinh : "");
        const diags = [
          ...parseDiag(p.loaiBenhLy),
          ...parseDiag(p.chanDoan),
          ...parseDiag(p.chanDoanMP),
          ...parseDiag(p.chanDoanMT),
        ];
        const detailDiag = Array.from(new Set(diags.filter(Boolean))).join(", ");

        return {
          STT: idx + 1,
          "Mã BN": p.maBN || "",
          "Mã HIS": p.maBNHIS || "",
          "Họ và tên": p.hoTen || "",
          "Giới tính": p.gioiTinh || "",
          "Năm sinh": p.namSinh || (p.ngaySinh ? new Date(p.ngaySinh).getFullYear() : "") || "",
          "Tuổi": age || "",
          "Số điện thoại": p.sdt || "",
          "CCCD/Định danh": p.cccd || "",
          "Địa chỉ": p.diaChi || [p.khuPho, p.xaPhuong].filter(Boolean).join(", ") || "",
          "Xã / Phường": p.xaPhuong || p.buoiKham?.xa || "",
          "Đợt khám": p.buoiKham?.xa || "",
          "Ngày khám": p.buoiKham?.ngayKham ? fmtDate(p.buoiKham.ngayKham) : "",
          "Điểm khám": p.buoiKham?.diaDiem || "",
          "Thị lực MP": p.thiLucMP || "",
          "Thị lực MT": p.thiLucMT || "",
          "Chẩn đoán chi tiết": detailDiag || p.chanDoanKhac || "",
          "Khuyến nghị": p.khuyenNghi || "",
          "Hướng xử trí": p.huongXuTri || "",
          "Nhóm phân loại": p.nhom || (p.khuyenNghi === "Phẫu thuật" ? "A" : p.khuyenNghi === "Theo dõi" ? "B" : ""),
          "Thẻ BHYT": p.bhyt || "",
          "Mức hưởng BHYT": p.mucHuongBHYT ? `${p.mucHuongBHYT}%` : bhytLevel(p.bhyt),
          "Bác sĩ chỉ định": p.bacSiChiDinh || p.buoiKham?.bacSiKham || "",
          "Nhân viên tư vấn": p.nhanVienTuVan || "",
          "Trạng thái": statusOf(p.trangThai).label,
          "Ngày mổ thực tế": p.ngayMoThucTe ? fmtDate(p.ngayMoThucTe) : "",
          "Trạng thái điều trị": p.trangThaiDieuTri || "",
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      const sheetName = (target?.title || "BaoCaoChiTiet").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, "_").slice(0, 30);
      XLSX.utils.book_append_sheet(wb, ws, sheetName || "DanhSach");
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `CSR_ChiTiet_${sheetName}_${dateStr}.xlsx`);
      addToast({ type: "success", message: `Đã xuất ${rows.length} bệnh nhân ra file Excel thành công!` });
    } catch (err) {
      console.error(err);
      addToast({ type: "error", message: "Lỗi xuất file Excel" });
    }
  };

  if (!target) return null;

  const Icon = target.icon || Users;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-serif text-[18px] sm:text-[20px] font-bold text-[var(--ink)]">
              {target.title}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)]">
              {filtered.length.toLocaleString("vi-VN")}{" "}
              {target.type === "kpi_soBuoi" ? "đợt khám" : "hồ sơ"}
            </span>
          </div>
        }
        subtitle={
          <div className="flex items-center gap-2 text-xs text-[var(--mute)] flex-wrap mt-0.5 font-medium">
            <span>{target.subtitle || "Danh sách chi tiết theo thời gian và bộ lọc"}</span>
            <span>•</span>
            <span className="text-[var(--navy)] font-semibold">{coSoName || "Tất cả cơ sở"}</span>
            <span>•</span>
            <span className="text-slate-600 font-medium">
              Bộ lọc:{" "}
              <b className="text-[var(--ink)]">
                {dateFilter === "all"
                  ? "Toàn thời gian"
                  : dateFilter === "30days"
                  ? "30 ngày qua"
                  : dateFilter === "90days"
                  ? "90 ngày qua"
                  : "Năm nay"}
              </b>
            </span>
          </div>
        }
        icon={Icon}
        maxWidth="w-[98vw] max-w-[98vw] 2xl:max-w-[1860px] h-[95vh] max-h-[95vh]"
        noPadding
        bodyClassName="flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden">
          {/* Summary Strip */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-[var(--line-soft)] flex items-center justify-between gap-3 flex-wrap shrink-0">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-[var(--ink-soft)] mr-1">Chỉ số nhanh:</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-[var(--line)] shadow-2xs font-mono font-semibold text-[var(--ink)]">
                Tổng: <b>{stats.total.toLocaleString("vi-VN")}</b>
              </span>
              {target.type !== "kpi_soBuoi" && (
                <>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-semibold">
                    Nhóm A: <b>{stats.nhomA.toLocaleString("vi-VN")}</b>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-mono font-semibold">
                    Nhóm B: <b>{stats.nhomB.toLocaleString("vi-VN")}</b>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-[var(--teal-deep)] border border-teal-200 font-mono font-bold">
                    Đã mổ: <b>{stats.daMo.toLocaleString("vi-VN")}</b>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono font-semibold">
                    BHYT: <b>{stats.bhyt.toLocaleString("vi-VN")}</b>
                  </span>
                </>
              )}
            </div>

            {/* Xuất Excel button */}
            <button
              onClick={exportModalExcel}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[var(--navy)] hover:bg-[var(--navy-deep)] text-white shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-teal-300" />
              Xuất Excel danh sách này ({filtered.length})
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-3 sm:px-4 py-3 border-b border-[var(--line)] bg-white flex items-center justify-between gap-3 flex-wrap shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-[380px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={
                  target.type === "kpi_soBuoi"
                    ? "Tìm theo xã, điểm khám, bác sĩ..."
                    : "Tìm tên, SĐT, CCCD, mã BN, bác sĩ..."
                }
                className="w-full h-9 pl-9 pr-8 text-[13px] bg-[var(--surface-soft)] border border-[var(--line-strong)] rounded-xl outline-none focus:bg-white focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy)]/15 transition-all text-[var(--ink)] shadow-2xs font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Buttons for Patient Views */}
            {target.type !== "kpi_soBuoi" && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Group Filter */}
                <div className="flex items-center bg-[var(--surface-soft)] p-0.5 rounded-lg border border-[var(--line-soft)] font-medium">
                  <button
                    onClick={() => {
                      setGroupFilter("ALL");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      groupFilter === "ALL"
                        ? "bg-white text-[var(--navy)] font-bold shadow-2xs"
                        : "text-[var(--mute)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Tất cả nhóm
                  </button>
                  <button
                    onClick={() => {
                      setGroupFilter("A");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      groupFilter === "A"
                        ? "bg-emerald-600 text-white font-bold shadow-2xs"
                        : "text-emerald-700 hover:text-emerald-900"
                    }`}
                  >
                    Nhóm A
                  </button>
                  <button
                    onClick={() => {
                      setGroupFilter("B");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      groupFilter === "B"
                        ? "bg-amber-600 text-white font-bold shadow-2xs"
                        : "text-amber-700 hover:text-amber-900"
                    }`}
                  >
                    Nhóm B
                  </button>
                </div>

                {/* Surgery Filter */}
                <div className="flex items-center bg-[var(--surface-soft)] p-0.5 rounded-lg border border-[var(--line-soft)] font-medium">
                  <button
                    onClick={() => {
                      setSurgeryFilter("ALL");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      surgeryFilter === "ALL"
                        ? "bg-white text-[var(--navy)] font-bold shadow-2xs"
                        : "text-[var(--mute)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Tất cả mổ
                  </button>
                  <button
                    onClick={() => {
                      setSurgeryFilter("DA_MO");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      surgeryFilter === "DA_MO"
                        ? "bg-[var(--teal-deep)] text-white font-bold shadow-2xs"
                        : "text-[var(--teal-deep)] hover:text-teal-900"
                    }`}
                  >
                    Đã mổ
                  </button>
                  <button
                    onClick={() => {
                      setSurgeryFilter("CHUA_MO");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      surgeryFilter === "CHUA_MO"
                        ? "bg-slate-700 text-white font-bold shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Chưa mổ
                  </button>
                </div>

                {/* BHYT Filter */}
                <div className="flex items-center bg-[var(--surface-soft)] p-0.5 rounded-lg border border-[var(--line-soft)] font-medium">
                  <button
                    onClick={() => {
                      setBhytFilter("ALL");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      bhytFilter === "ALL"
                        ? "bg-white text-[var(--navy)] font-bold shadow-2xs"
                        : "text-[var(--mute)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Tất cả thẻ
                  </button>
                  <button
                    onClick={() => {
                      setBhytFilter("CO_BHYT");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      bhytFilter === "CO_BHYT"
                        ? "bg-indigo-600 text-white font-bold shadow-2xs"
                        : "text-indigo-700 hover:text-indigo-900"
                    }`}
                  >
                    Có BHYT
                  </button>
                  <button
                    onClick={() => {
                      setBhytFilter("KHONG_BHYT");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      bhytFilter === "KHONG_BHYT"
                        ? "bg-rose-600 text-white font-bold shadow-2xs"
                        : "text-rose-700 hover:text-rose-900"
                    }`}
                  >
                    Không BHYT
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Table Area */}
          <div className="flex-1 min-h-0 overflow-auto bg-slate-50/50">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--navy)]" />
                <span className="text-xs text-[var(--mute)] font-medium">
                  Đang nạp dữ liệu chi tiết báo cáo...
                </span>
              </div>
            ) : target.type === "kpi_soBuoi" ? (
              /* Bảng danh sách các đợt khám CSR */
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[var(--surface-soft)] border-b border-[var(--line)] text-[var(--ink-soft)] font-bold z-10">
                  <tr>
                    <th className="py-3 px-3.5 text-center w-12">STT</th>
                    <th className="py-3 px-4">Ngày khám</th>
                    <th className="py-3 px-4">Địa bàn / Xã</th>
                    <th className="py-3 px-4">Điểm khám chi tiết</th>
                    <th className="py-3 px-4">Bác sĩ phụ trách</th>
                    <th className="py-3 px-3.5 text-right">Tiếp nhận</th>
                    <th className="py-3 px-3.5 text-right text-emerald-700">Nhóm A</th>
                    <th className="py-3 px-3.5 text-right text-amber-700">Nhóm B</th>
                    <th className="py-3 px-3.5 text-right text-[var(--teal-deep)]">Đã mổ</th>
                    <th className="py-3 px-3.5 text-right">Tỷ lệ mổ</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)] bg-white">
                  {pagedItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-16 text-center text-xs text-[var(--mute)]">
                        Không tìm thấy đợt khám phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    (pagedItems as typeof sessions).map((s, idx) => {
                      const stt = (currentPage - 1) * pageSize + idx + 1;
                      const tyLeMo = s.nhomA > 0 ? Math.round((s.daMo / s.nhomA) * 100) : 0;
                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-[var(--surface-hover)] transition-colors group"
                        >
                          <td className="py-3 px-3.5 text-center font-mono font-semibold text-[var(--mute)]">
                            {stt}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[var(--ink)] whitespace-nowrap">
                            {s.ngayKham ? fmtDate(s.ngayKham) : "—"}
                          </td>
                          <td className="py-3 px-4 font-bold text-[var(--navy)] whitespace-nowrap">
                            {s.xa || "—"}
                          </td>
                          <td
                            className="py-3 px-4 text-[var(--ink-soft)] truncate max-w-[240px]"
                            title={s.diaDiem}
                          >
                            {s.diaDiem || "—"}
                          </td>
                          <td className="py-3 px-4 text-[var(--ink-soft)] font-medium whitespace-nowrap">
                            {s.bacSi || "—"}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-[var(--ink)]">
                            {s.tong.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700">
                            {s.nhomA.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-700">
                            {s.nhomB.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-extrabold text-[var(--teal-deep)]">
                            {s.daMo.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                tyLeMo >= 50
                                  ? "bg-emerald-50 text-emerald-700"
                                  : tyLeMo > 0
                                  ? "bg-amber-50 text-amber-700"
                                  : "text-[var(--mute)]"
                              }`}
                            >
                              {tyLeMo}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {onExportSessionExcel && (
                                <button
                                  onClick={() => onExportSessionExcel(s.id)}
                                  title="Xuất file Excel đợt khám (mẫu 101 cột)"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[var(--line-strong)] bg-white hover:bg-[var(--surface-soft)] text-[var(--navy)] transition-all cursor-pointer"
                                >
                                  <Download className="w-3 h-3 text-[var(--teal-deep)]" />
                                  Excel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* Bảng danh sách hồ sơ bệnh nhân */
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[var(--surface-soft)] border-b border-[var(--line)] text-[var(--ink-soft)] font-bold z-10">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">STT</th>
                    <th className="py-3 px-3.5">Mã BN</th>
                    <th className="py-3 px-4">Họ và tên</th>
                    <th className="py-3 px-3.5">Điện thoại / Địa chỉ</th>
                    <th className="py-3 px-3.5">Đợt khám</th>
                    <th className="py-3 px-4">Chẩn đoán & Bệnh lý</th>
                    <th className="py-3 px-3 text-center">Nhóm</th>
                    <th className="py-3 px-3.5">Thẻ BHYT</th>
                    <th className="py-3 px-3.5">Bác sĩ / TVV</th>
                    <th className="py-3 px-3.5">Trạng thái CSR</th>
                    <th className="py-3 px-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)] bg-white">
                  {pagedItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-16 text-center text-xs text-[var(--mute)]">
                        Không tìm thấy bệnh nhân nào phù hợp với điều kiện tìm kiếm/lọc.
                      </td>
                    </tr>
                  ) : (
                    (pagedItems as any[]).map((p, idx) => {
                      const stt = (currentPage - 1) * pageSize + idx + 1;
                      const age =
                        ageOf(p) ||
                        (p.namSinh ? new Date().getFullYear() - p.namSinh : null);
                      const { isNhomA, isNhomB, isDaMo } = classifyCSRNhom(p);

                      // Tách chẩn đoán
                      const diags = [
                        ...parseDiag(p.loaiBenhLy),
                        ...parseDiag(p.chanDoan),
                        ...parseDiag(p.chanDoanMP),
                        ...parseDiag(p.chanDoanMT),
                      ];
                      const detailDiag = Array.from(
                        new Set(diags.filter(Boolean))
                      ).join(", ") || p.chanDoanKhac || "—";

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-[var(--surface-hover)] transition-colors group cursor-pointer"
                          onClick={() => setSelectedHoSoId(p.id)}
                        >
                          <td className="py-3 px-3 text-center font-mono font-semibold text-[var(--mute)]">
                            {stt}
                          </td>
                          <td className="py-3 px-3.5 font-mono whitespace-nowrap">
                            <div className="font-bold text-[var(--navy)]">{p.maBN}</div>
                            {p.maBNHIS && (
                              <div className="text-[10px] text-[var(--mute)]">
                                HIS: {p.maBNHIS}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[var(--ink)] group-hover:text-[var(--navy)] transition-colors">
                              {p.hoTen}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[var(--mute)] mt-0.5">
                              <span>{p.gioiTinh || "—"}</span>
                              {age && (
                                <>
                                  <span>•</span>
                                  <span>{age} tuổi</span>
                                </>
                              )}
                              {p.namSinh && (
                                <>
                                  <span>•</span>
                                  <span>Năm sinh {p.namSinh}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-[var(--ink-soft)] max-w-[200px]">
                            {p.sdt ? (
                              <div className="font-mono font-semibold text-[var(--ink)] flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {p.sdt}
                              </div>
                            ) : (
                              <span className="text-[var(--mute)] italic">Không có SĐT</span>
                            )}
                            <div className="text-[11px] text-[var(--mute)] truncate mt-0.5" title={p.diaChi || p.xaPhuong || ""}>
                              {p.diaChi || p.xaPhuong || p.khuPho || "—"}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="font-semibold text-[var(--ink)]">
                              {p.buoiKham?.xa || "—"}
                            </div>
                            <div className="text-[11px] text-[var(--mute)] font-mono">
                              {p.buoiKham?.ngayKham ? fmtDate(p.buoiKham.ngayKham) : "—"}
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-[240px]">
                            <div className="font-medium text-[var(--ink)] truncate" title={detailDiag}>
                              {detailDiag}
                            </div>
                            {(p.thiLucMP || p.thiLucMT) && (
                              <div className="text-[10.5px] text-[var(--mute)] font-mono mt-0.5">
                                TL: MP [{p.thiLucMP || "—"}] / MT [{p.thiLucMT || "—"}]
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {isNhomA ? (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Nhóm A
                              </span>
                            ) : isNhomB ? (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Nhóm B
                              </span>
                            ) : (
                              <span className="text-[var(--mute)] text-[11px]">Chưa nhóm</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {p.bhyt && p.bhyt.trim().length >= 8 ? (
                              <div>
                                <div className="font-mono text-[11.5px] font-semibold text-indigo-700">
                                  {p.bhyt}
                                </div>
                                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                  Mức hưởng: {p.mucHuongBHYT ? `${p.mucHuongBHYT}%` : bhytLevel(p.bhyt)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[var(--mute)] text-[11px]">Không có BHYT</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-[11.5px]">
                            <div className="font-medium text-[var(--ink)] truncate max-w-[140px]" title={p.bacSiChiDinh || p.buoiKham?.bacSiKham || ""}>
                              BS: {p.bacSiChiDinh || p.buoiKham?.bacSiKham || "—"}
                            </div>
                            {p.nhanVienTuVan && (
                              <div className="text-[11px] text-[var(--mute)] truncate max-w-[140px]" title={p.nhanVienTuVan}>
                                TV: {p.nhanVienTuVan}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <StatusBadge
                              label={statusOf(p.trangThai).label}
                              cls={statusOf(p.trangThai).cls}
                              sm
                            />
                            {isDaMo && (
                              <div className="text-[10.5px] font-bold text-[var(--teal-deep)] mt-1 flex items-center gap-1 font-mono">
                                <CheckCircle2 className="w-3 h-3 text-[var(--teal-deep)]" />
                                {p.ngayMoThucTe ? fmtDate(p.ngayMoThucTe) : "Đã mổ"}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedHoSoId(p.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[var(--line-strong)] bg-white hover:bg-[var(--surface-soft)] text-[var(--navy)] transition-all cursor-pointer shadow-2xs hover:border-[var(--navy)]"
                            >
                              <FileText className="w-3 h-3 text-[var(--teal-deep)]" />
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="px-4 py-3 border-t border-[var(--line)] bg-white flex items-center justify-between gap-3 flex-wrap shrink-0">
            <div className="flex items-center gap-2 text-xs text-[var(--mute)] font-medium">
              <span>
                Hiển thị{" "}
                <b className="text-[var(--ink)]">
                  {filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                </b>{" "}
                -{" "}
                <b className="text-[var(--ink)]">
                  {Math.min(currentPage * pageSize, filtered.length)}
                </b>{" "}
                trong số <b className="text-[var(--ink)]">{filtered.length}</b> mục
              </span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span>Số dòng:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 text-xs border border-[var(--line)] rounded-lg bg-[var(--surface-soft)] font-mono font-bold text-[var(--ink)] cursor-pointer outline-none"
                >
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--surface-soft)] text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 text-xs font-mono font-bold text-[var(--ink)] px-2">
                <span>Trang</span>
                <span className="px-2 py-0.5 rounded bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)]">
                  {currentPage}
                </span>
                <span>/ {totalPages}</span>
              </div>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--surface-soft)] text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Patient Info Modal when clicking a patient */}
      {selectedHoSoId && (
        <PatientInfoModal
          hoSoId={selectedHoSoId}
          onClose={() => setSelectedHoSoId(null)}
        />
      )}
    </>
  );
}
