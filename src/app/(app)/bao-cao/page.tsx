"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import {
  Loader2,
  Download,
  Users,
  Calendar,
  HeartHandshake,
  Activity,
  CheckCircle2,
  FileSpreadsheet,
  ShieldCheck,
  TrendingUp,
  Stethoscope,
  MapPin,
  FileDown,
  ChevronRight,
  UserCheck,
  Eye,
  Filter,
  ShieldAlert,
  CalendarHeart,
  PhoneCall,
  Sparkles,
  RefreshCw,
  UserX,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { STATUS, statusOf, fmtDate } from "@/lib/csr";
import { Donut, BarChart, CHART_COLORS, type Slice } from "@/components/charts";
import DateRangeFilter, { resolvePreset, type DateRange } from "@/components/csr/DateRangeFilter";
import ReportDetailModal, { type ReportModalTarget } from "@/components/csr/ReportDetailModal";
import AnimatedNumber from "@/components/csr/AnimatedNumber";

interface StatsData {
  tong: number;
  soBuoi: number;
  byStatus: Record<string, number>;
  nhomA: number;
  nhomB: number;
  daMo: number;
  daDen: number;
  denKhongMo: number;
  chuyenDoiMoPct: number;
  coBhytCount: number;
  bhytPct: number;
  sheetUrl: string | null;
  coSoName: string;
  funnel: Array<{ key?: string; stage: string; count: number; pct: number }>;
  diseases: Array<{ label: string; value: number; color: string }>;
  demographics: {
    age: Array<{ key?: string; label: string; value: number; color: string }>;
    gender: Array<{ label: string; value: number; color: string }>;
    bhyt: Array<{ label: string; value: number; color: string }>;
  };
  sessions: Array<{
    id: string;
    ngayKham: string;
    xa: string;
    diaDiem: string;
    bacSi: string;
    tong: number;
    nhomA: number;
    nhomB: number;
    daMo: number;
    denKhongMo: number;
  }>;
  topDoctors: Array<{ name: string; total: number; nhomA: number; daMo: number }>;
  topCounselors: Array<{ name: string; total: number; chotMo: number; daMo: number }>;
}

const STATUS_ORDER = Object.keys(STATUS);
const statusColor = (key: string) => CHART_COLORS[Math.max(0, STATUS_ORDER.indexOf(key)) % CHART_COLORS.length];

export default function BaoCaoPage() {
  const { addToast } = useToast();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingSessionId, setExportingSessionId] = useState<string | null>(null);

  // Mặc định lọc theo Tháng này — đổi nhanh sang Ngày / Tuần / Quý / Năm ở bộ lọc (giống Bảng điều khiển).
  const [range, setRange] = useState<DateRange>(() => resolvePreset("thisMonth"));

  // State cho Modal chi tiết khi nhấp vào từng mục trên Dashboard
  const [detailTarget, setDetailTarget] = useState<ReportModalTarget | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openDetail = (target: ReportModalTarget) => {
    setDetailTarget(target);
    setModalOpen(true);
  };

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (range.from) sp.set("from", range.from);
      if (range.to) sp.set("to", range.to);
      const qs = sp.toString();
      const res = await fetch(`/api/csr/reports${qs ? `?${qs}` : ""}`);
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {
      addToast({ type: "error", message: "Lỗi tải số liệu báo cáo" });
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, addToast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const exportExcel = async (buoiKhamId?: string, format: "khamSucKhoe" | "default" = "khamSucKhoe") => {
    if (buoiKhamId) {
      setExportingSessionId(buoiKhamId);
    } else {
      setExporting(true);
    }
    try {
      const sp = new URLSearchParams();
      if (buoiKhamId) sp.set("buoiKhamId", buoiKhamId);
      sp.set("format", format);
      if (range.from) sp.set("from", range.from);
      if (range.to) sp.set("to", range.to);
      const url = `/api/csr/export?${sp.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        addToast({ type: "error", message: "Không thể xuất file (cần quyền HCNS/Kế toán/Quản lý)" });
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = buoiKhamId
        ? (format === "khamSucKhoe" ? `Kham_Suc_Khoe_${buoiKhamId}_${dateStr}.xlsx` : `VISI_KhamMat_${buoiKhamId}_${dateStr}.xlsx`)
        : (format === "khamSucKhoe" ? `Kham_Suc_Khoe_TongHop_${dateStr}.xlsx` : `VISI_CSR_BaoCao_${dateStr}.xlsx`);
      a.click();
      URL.revokeObjectURL(blobUrl);
      addToast({
        type: "success",
        message: format === "khamSucKhoe"
          ? "Đã xuất file Excel mẫu Khám Sức Khỏe (101 cột) thành công."
          : "Đã xuất file Excel thành công."
      });
    } catch {
      addToast({ type: "error", message: "Mất kết nối máy chủ" });
    } finally {
      setExporting(false);
      setExportingSessionId(null);
    }
  };

function BaoCaoSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      {/* Tiêu đề skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[var(--line)] shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-7 bg-slate-200 rounded-lg w-64" />
            <div className="h-5 bg-slate-200 rounded-full w-24" />
          </div>
          <div className="h-4 bg-slate-100 rounded w-80" />
        </div>
        <div className="h-10 bg-slate-100 rounded-xl w-64" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-3 bg-white border border-[var(--line)]">
            <div className="flex items-center justify-between">
              <div className="h-3.5 bg-slate-200 rounded w-2/3" />
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
            </div>
            <div className="h-7 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-100 rounded w-3/4" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5 bg-white border border-[var(--line)] space-y-4 h-[340px]">
            <div className="h-5 bg-slate-200 rounded w-1/3" />
            <div className="h-[240px] bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="card p-5 bg-white border border-[var(--line)] space-y-4 h-[300px]">
        <div className="h-5 bg-slate-200 rounded w-1/4" />
        <div className="h-[200px] bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}

  if (!stats && loading) {
    return <BaoCaoSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Tiêu đề & Hành động */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[var(--line)] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-[var(--ink)] tracking-tight">
              Báo cáo & Thống kê CSR
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)]">
              {stats?.coSoName || "Đơn vị"}
            </span>
          </div>
          <p className="text-xs text-[var(--mute)] mt-1 font-medium flex items-center gap-1.5">
            <span>Trung tâm điều hành & phân tích số liệu khám sàng lọc mắt cộng đồng</span>
            <span className="text-teal-600 font-bold hidden sm:inline">• Nhấp vào từng mục để xem danh sách chi tiết</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bộ lọc thời gian giống bên Bảng điều khiển */}
          <DateRangeFilter value={range} onChange={setRange} className="w-full sm:w-auto" />
          <button
            type="button"
            onClick={() => loadStats()}
            title="Làm mới dữ liệu"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line-strong)] bg-white px-3 text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--navy)] hover:border-[var(--navy)] transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[var(--navy)]" : ""}`} />
            Làm mới
          </button>

          {/* Nút Google Sheet */}
          {stats?.sheetUrl && (
            <a
              href={stats.sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-[var(--line-strong)] bg-white text-[var(--ink)] hover:bg-[var(--surface-soft)] transition-all shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Google Sheet
            </a>
          )}

          {/* Nút Xuất Excel */}
          <button
            onClick={() => exportExcel()}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[var(--navy)] hover:bg-[var(--navy-deep)] text-white shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-teal-300" />}
            Xuất Excel Tổng hợp
          </button>
        </div>
      </div>

      {stats ? (
        <>
          {/* Hàng thẻ KPI chỉ số chính - Nhấp vào từng thẻ để xem chi tiết */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
            {/* Tổng tiếp nhận */}
            <div
              onClick={() =>
                openDetail({
                  type: "kpi_tong",
                  title: "Danh sách Bệnh nhân Tiếp nhận",
                  subtitle: "Toàn bộ hồ sơ bệnh nhân tiếp nhận qua các đợt khám",
                  icon: Users,
                })
              }
              className="card p-4 hover:border-[var(--navy)] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
              title="Nhấp để xem danh sách chi tiết"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-[var(--mute)] group-hover:text-[var(--navy)] transition-colors">
                  Tổng tiếp nhận
                </span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--navy-50)] text-[var(--navy)] group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-extrabold text-[var(--ink)] mt-2 leading-none">
                <AnimatedNumber value={stats.tong} />
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-emerald-600">100%</span> hồ sơ
                </div>
                <span className="text-[10px] text-[var(--navy)] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Xem ➔
                </span>
              </div>
            </div>

            {/* Đợt khám CSR */}
            <div
              onClick={() =>
                openDetail({
                  type: "kpi_soBuoi",
                  title: "Danh sách các Đợt khám CSR",
                  subtitle: "Tổng hợp các đợt khám sàng lọc mắt cộng đồng",
                  icon: Calendar,
                })
              }
              className="card p-4 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
              title="Nhấp để xem danh sách chi tiết các đợt khám"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-[var(--mute)] group-hover:text-blue-600 transition-colors">
                  Đợt khám CSR
                </span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-extrabold text-[var(--ink)] mt-2 leading-none">
                <AnimatedNumber value={stats.soBuoi} />
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1.5 flex items-center justify-between">
                <div>
                  TB{" "}
                  <span className="font-semibold text-[var(--ink)]">
                    <AnimatedNumber value={stats.soBuoi > 0 ? Math.round(stats.tong / stats.soBuoi) : 0} />
                  </span>{" "}
                  BN/đợt
                </div>
                <span className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Xem ➔
                </span>
              </div>
            </div>

            {/* Nhóm A (Chỉ định mổ) */}
            <div
              onClick={() =>
                openDetail({
                  type: "kpi_nhomA",
                  title: "Danh sách Bệnh nhân Nhóm A (Đồng ý phẫu thuật)",
                  subtitle: "Có chỉ định và đã đồng ý phẫu thuật mắt",
                  icon: HeartHandshake,
                })
              }
              className="card p-4 hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
              title="Nhấp để xem danh sách bệnh nhân nhóm A"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-[var(--mute)] group-hover:text-emerald-700 transition-colors">
                  Nhóm A (Đồng ý phẫu thuật)
                </span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                  <HeartHandshake className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-extrabold text-emerald-700 mt-2 leading-none">
                <AnimatedNumber value={stats.nhomA} />
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1.5 flex items-center justify-between">
                <div>
                  Tỷ lệ{" "}
                  <span className="font-bold text-emerald-600">
                    <AnimatedNumber value={stats.tong > 0 ? (stats.nhomA / stats.tong) * 100 : 0} decimals={1} suffix="%" />
                  </span>{" "}
                  <span className="text-[var(--mute)]">tiếp nhận khám</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Xem ➔
                </span>
              </div>
            </div>

            {/* Nhóm B (Theo dõi) */}
            <div
              onClick={() =>
                openDetail({
                  type: "kpi_nhomB",
                  title: "Danh sách Bệnh nhân Nhóm B (Chưa đồng ý / Theo dõi)",
                  subtitle: "Có chỉ định nhưng chưa đồng ý phẫu thuật hoặc cần theo dõi",
                  icon: Activity,
                })
              }
              className="card p-4 hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
              title="Nhấp để xem danh sách bệnh nhân nhóm B"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-[var(--mute)] group-hover:text-amber-700 transition-colors">
                  Nhóm B (Chưa đồng ý / Theo dõi)
                </span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-extrabold text-amber-700 mt-2 leading-none">
                <AnimatedNumber value={stats.nhomB} />
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1.5 flex items-center justify-between">
                <div>
                  Tỷ lệ{" "}
                  <span className="font-bold text-amber-600">
                    <AnimatedNumber value={stats.tong > 0 ? (stats.nhomB / stats.tong) * 100 : 0} decimals={1} suffix="%" />
                  </span>{" "}
                  <span className="text-[var(--mute)]">tiếp nhận khám</span>
                </div>
                <span className="text-[10px] text-amber-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Xem ➔
                </span>
              </div>
            </div>

            {/* Đã mổ (HIS) */}
            <div
              onClick={() =>
                openDetail({
                  type: "kpi_daMo",
                  title: "Danh sách Bệnh nhân Đã phẫu thuật (HIS)",
                  subtitle: "Bệnh nhân đã phẫu thuật mắt thành công",
                  icon: CheckCircle2,
                })
              }
              className="card p-4 hover:border-[var(--teal)] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all bg-gradient-to-br from-white to-[var(--teal-soft)]/20 cursor-pointer group"
              title="Nhấp để xem danh sách bệnh nhân đã mổ"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-[var(--teal-deep)] group-hover:text-[var(--teal-deep)] transition-colors">
                  Đã mổ (HIS)
                </span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--teal-soft)] text-[var(--teal-deep)] group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-extrabold text-[var(--teal-deep)] mt-2 leading-none">
                <AnimatedNumber value={stats.daMo} />
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1.5 flex items-center justify-between">
                <div>
                  Chuyển đổi{" "}
                  <span className="font-bold text-[var(--teal-deep)]">
                    <AnimatedNumber value={stats.chuyenDoiMoPct} suffix="%" />
                  </span>
                </div>
                <span className="text-[10px] text-[var(--teal-deep)] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Xem ➔
                </span>
              </div>
            </div>

            {/* Đến viện không mổ */}
            <div
              onClick={() =>
                openDetail({
                  type: "kpi_denKhongMo",
                  title: "Danh sách Bệnh nhân Có đến nhưng không mổ",
                  subtitle: "Bệnh nhân đã đón hoặc đến bệnh viện nhưng chưa/không thực hiện phẫu thuật",
                  icon: UserX,
                })
              }
              className="card p-4 hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all bg-gradient-to-br from-white to-amber-50/30 cursor-pointer group"
              title="Nhấp để xem danh sách bệnh nhân có đến nhưng không mổ"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-amber-800 group-hover:text-amber-900 transition-colors">
                  Đến viện không mổ
                </span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
                  <UserX className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-extrabold text-amber-700 mt-2 leading-none">
                <AnimatedNumber value={stats.denKhongMo} />
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1.5 flex items-center justify-between">
                <div>
                  Tỷ lệ{" "}
                  <span className="font-bold text-amber-700">
                    <AnimatedNumber
                      value={stats.daDen > 0 ? (stats.denKhongMo / stats.daDen) * 100 : 0}
                      decimals={1}
                      suffix="%"
                    />
                  </span>{" "}
                  ca đến
                </div>
                <span className="text-[10px] text-amber-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Xem ➔
                </span>
              </div>
            </div>

            {/* Có BHYT */}
            <div
              onClick={() =>
                openDetail({
                  type: "kpi_bhyt",
                  title: "Danh sách Bệnh nhân có thẻ BHYT",
                  subtitle: "Bệnh nhân tham gia bảo hiểm y tế",
                  icon: ShieldCheck,
                })
              }
              className="card p-4 hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
              title="Nhấp để xem danh sách bệnh nhân có BHYT"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-[var(--mute)] group-hover:text-indigo-700 transition-colors">
                  Bao phủ BHYT
                </span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-extrabold text-indigo-700 mt-2 leading-none">
                <AnimatedNumber value={stats.bhytPct} suffix="%" />
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-indigo-600">
                    <AnimatedNumber value={stats.coBhytCount} />
                  </span>{" "}
                  BN có thẻ
                </div>
                <span className="text-[10px] text-indigo-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Xem ➔
                </span>
              </div>
            </div>
          </div>

          {/* Hàng 2: Phễu chuyển đổi CSR & Cơ cấu Bệnh lý */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Phễu chuyển đổi CSR */}
            <div className="card lg:col-span-6 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-base font-bold text-[var(--ink)]">
                    Phễu chuyển đổi Khám ➔ Phẫu thuật
                  </h2>
                  <p className="text-[11.5px] text-[var(--mute)]">
                    Hiệu quả từng bước trong quy trình CSR (Bấm vào từng bước để xem chi tiết)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openDetail({
                        type: "kpi_denKhongMo",
                        title: "Danh sách Bệnh nhân Có đến nhưng không mổ",
                        subtitle: "Bệnh nhân đã đón hoặc đến bệnh viện nhưng chưa/không thực hiện phẫu thuật",
                        icon: UserX,
                      })
                    }
                    className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Nhấp để xem danh sách chi tiết bệnh nhân có đến nhưng không mổ"
                  >
                    <UserX className="w-3.5 h-3.5 text-amber-600" />
                    Đến không mổ: <AnimatedNumber value={stats.denKhongMo} />
                  </button>
                  <span className="text-xs font-bold text-[var(--teal-deep)] bg-[var(--teal-soft)] px-2.5 py-1 rounded-full border border-[var(--teal)]/30">
                    Tỷ lệ mổ: <AnimatedNumber value={stats.chuyenDoiMoPct} suffix="%" />
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {stats.funnel.map((item, idx) => {
                  const colors = [
                    "from-blue-600 to-indigo-600",
                    "from-emerald-500 to-teal-500",
                    "from-amber-500 to-orange-500",
                    "from-teal-600 to-emerald-600",
                  ];
                  const funnelTypes = [
                    "funnel_tiepNhan",
                    "funnel_chiDinhMo",
                    "funnel_chotMo",
                    "funnel_daMo",
                  ];
                  const funnelIcons = [Users, HeartHandshake, UserCheck, CheckCircle2];
                  const targetType = item.key || funnelTypes[idx] || "kpi_tong";
                  const TargetIcon = funnelIcons[idx] || Users;

                  return (
                    <div
                      key={item.stage}
                      onClick={() =>
                        openDetail({
                          type: targetType,
                          title: `Phễu CSR: ${item.stage}`,
                          subtitle: `Danh sách bệnh nhân ở giai đoạn ${item.stage}`,
                          icon: TargetIcon,
                        })
                      }
                      className="p-2 rounded-xl hover:bg-[var(--surface-hover)] cursor-pointer transition-all space-y-1 group"
                      title={`Xem danh sách: ${item.stage}`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--ink-soft)] group-hover:text-[var(--navy)] flex items-center gap-1.5 transition-colors">
                          <span className="w-4 h-4 rounded-full bg-[var(--surface-soft)] border border-[var(--line)] flex items-center justify-center text-[10px] font-bold text-[var(--mute)] group-hover:border-[var(--navy)] group-hover:text-[var(--navy)]">
                            {idx + 1}
                          </span>
                          {item.stage}
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-[var(--ink)] group-hover:text-[var(--navy)]">
                            <AnimatedNumber value={item.count} />
                          </span>
                          <span className="text-[var(--mute)] text-[11px]">(<AnimatedNumber value={item.pct} suffix="%" />)</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[var(--navy)] group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-[var(--surface-soft)] rounded-full overflow-hidden border border-[var(--line-soft)]">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${colors[idx % colors.length]} transition-all duration-500 group-hover:brightness-110`}
                          style={{ width: `${Math.max(item.pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cơ cấu Bệnh lý Nhãn khoa */}
            <div className="card lg:col-span-6 p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-base font-bold text-[var(--ink)]">Cơ cấu Bệnh lý Phát hiện</h2>
                  <p className="text-[11.5px] text-[var(--mute)]">
                    Phân loại bệnh lý mắt (Nhấp vào bệnh lý để xem danh sách bệnh nhân)
                  </p>
                </div>
                <Eye className="w-4 h-4 text-[var(--mute)]" />
              </div>

              {stats.diseases.length > 0 ? (
                <div className="py-2">
                  <Donut
                    data={stats.diseases}
                    size={180}
                    centerLabel="Ca bệnh"
                    onSliceClick={(slice) =>
                      openDetail({
                        type: "disease",
                        val: slice.label,
                        title: `Bệnh lý: ${slice.label}`,
                        subtitle: `Danh sách bệnh nhân phát hiện bệnh lý ${slice.label}`,
                        icon: Eye,
                      })
                    }
                  />
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[var(--mute)]">Chưa có dữ liệu chẩn đoán bệnh lý.</div>
              )}
            </div>
          </div>

          {/* Hàng 3: Nhân khẩu học & BHYT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Phân bố độ tuổi */}
            <div className="card p-5">
              <h3 className="font-serif text-sm font-bold text-[var(--ink)] mb-1">Nhóm tuổi</h3>
              <p className="text-[11px] text-[var(--mute)] mb-3">
                Phân bố theo các nhóm tuổi tiếp nhận khám (Bấm để xem danh sách)
              </p>
              <div className="space-y-1.5">
                {stats.demographics.age.map((a, idx) => {
                  const ageKeys = ["u6", "6to18", "18to55", "55to60", "over60"];
                  const ageKey = a.key || ageKeys[idx] || "all";
                  const pct = stats.tong > 0 ? Math.round((a.value / stats.tong) * 100) : 0;
                  return (
                    <div
                      key={a.label}
                      onClick={() =>
                        openDetail({
                          type: "age",
                          val: ageKey,
                          title: `Độ tuổi: ${a.label}`,
                          subtitle: `Danh sách bệnh nhân tiếp nhận khám nhóm tuổi ${a.label}`,
                          icon: Users,
                        })
                      }
                      className="p-1.5 rounded-xl hover:bg-[var(--surface-hover)] cursor-pointer transition-all space-y-1 group"
                      title={`Xem danh sách: ${a.label}`}
                    >
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--ink-soft)] font-medium group-hover:text-[var(--navy)] transition-colors">
                          {a.label}
                        </span>
                        <span className="font-mono font-bold text-[var(--ink)] group-hover:text-[var(--navy)]">
                          <AnimatedNumber value={a.value} /> người khám (<AnimatedNumber value={pct} suffix="%" />)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[var(--surface-soft)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full group-hover:brightness-110" style={{ width: `${pct}%`, background: a.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phân bố Giới tính */}
            <div className="card p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-sm font-bold text-[var(--ink)] mb-1">Giới tính</h3>
                <p className="text-[11px] text-[var(--mute)] mb-4">
                  Tỷ lệ Nam / Nữ tiếp nhận khám (Bấm để xem danh sách bệnh nhân)
                </p>
              </div>
              <div className="flex items-center justify-around py-3">
                {stats.demographics.gender.map((g, idx) => {
                  const genderVal = idx === 0 ? "nam" : "nu";
                  const pct = stats.tong > 0 ? Math.round((g.value / stats.tong) * 100) : 0;
                  return (
                    <div
                      key={g.label}
                      onClick={() =>
                        openDetail({
                          type: "gender",
                          val: genderVal,
                          title: `Giới tính: ${g.label}`,
                          subtitle: `Danh sách bệnh nhân tiếp nhận khám giới tính ${g.label}`,
                          icon: Users,
                        })
                      }
                      className="text-center cursor-pointer p-3 rounded-2xl hover:bg-[var(--surface-hover)] hover:scale-105 transition-all group"
                      title={`Xem danh sách bệnh nhân ${g.label}`}
                    >
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center font-mono font-bold text-base text-white mx-auto shadow-xs group-hover:shadow-md transition-shadow"
                        style={{ background: g.color }}
                      >
                        <AnimatedNumber value={pct} suffix="%" />
                      </div>
                      <div className="text-xs font-bold text-[var(--ink)] mt-2 group-hover:text-[var(--navy)]">
                        {g.label}
                      </div>
                      <div className="font-mono text-[11px] text-[var(--mute)]">
                        <AnimatedNumber value={g.value} /> BN
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mức hưởng BHYT */}
            <div className="card p-5">
              <h3 className="font-serif text-sm font-bold text-[var(--ink)] mb-1">Mức hưởng BHYT</h3>
              <p className="text-[11px] text-[var(--mute)] mb-3">
                Hỗ trợ chi trả BHYT cho người tiếp nhận khám (Bấm để xem danh sách)
              </p>
              <div className="space-y-1.5">
                {stats.demographics.bhyt.map((b, idx) => {
                  const bhytKeys = ["100", "95", "80", "none"];
                  const pct = stats.tong > 0 ? Math.round((b.value / stats.tong) * 100) : 0;
                  return (
                    <div
                      key={b.label}
                      onClick={() =>
                        openDetail({
                          type: "bhyt_tier",
                          val: bhytKeys[idx] || "all",
                          title: `Mức hưởng BHYT: ${b.label}`,
                          subtitle: `Danh sách bệnh nhân theo mức hưởng ${b.label}`,
                          icon: b.label.includes("Không") ? ShieldAlert : ShieldCheck,
                        })
                      }
                      className="p-1.5 rounded-xl hover:bg-[var(--surface-hover)] cursor-pointer transition-all space-y-1 group"
                      title={`Xem danh sách: ${b.label}`}
                    >
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--ink-soft)] font-medium group-hover:text-indigo-700 transition-colors">
                          {b.label}
                        </span>
                        <span className="font-mono font-bold text-[var(--ink)] group-hover:text-indigo-700">
                          <AnimatedNumber value={b.value} /> (<AnimatedNumber value={pct} suffix="%" />)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[var(--surface-soft)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full group-hover:brightness-110" style={{ width: `${pct}%`, background: b.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hàng 4: Bảng Báo cáo Chi tiết theo từng Đợt Khám */}
          <div className="card p-0 overflow-hidden">
            <div className="p-5 border-b border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface-soft)]/50">
              <div>
                <h2 className="font-serif text-base font-bold text-[var(--ink)]">
                  Báo cáo Hiệu quả từng Đợt Khám CSR
                </h2>
                <p className="text-xs text-[var(--mute)]">
                  Tổng hợp số liệu tiếp nhận, chỉ định và phẫu thuật theo từng địa bàn (Bấm vào dòng để xem danh sách bệnh nhân)
                </p>
              </div>
              <span className="text-xs font-bold text-[var(--mute)] bg-white px-3 py-1 rounded-lg border border-[var(--line)]">
                {stats.sessions.length} đợt khám
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1050px] table-fixed">
                <colgroup>
                  <col className="w-24" />
                  <col className="w-36" />
                  <col className="w-44" />
                  <col className="w-36" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-24" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-24" />
                </colgroup>
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--surface-soft)] text-[var(--ink-soft)] font-bold">
                    <th className="py-3 px-4">Ngày khám</th>
                    <th className="py-3 px-4">Địa bàn / Xã</th>
                    <th className="py-3 px-4">Điểm khám</th>
                    <th className="py-3 px-4">Bác sĩ phụ trách</th>
                    <th className="py-3 px-3 text-right">Tiếp nhận</th>
                    <th className="py-3 px-3 text-right text-emerald-700">Nhóm A</th>
                    <th className="py-3 px-3 text-right text-amber-700">Nhóm B</th>
                    <th className="py-3 px-3 text-right text-amber-600">Đến chưa mổ</th>
                    <th className="py-3 px-3 text-right text-[var(--teal-deep)]">Đã mổ</th>
                    <th className="py-3 px-3 text-right">Tỷ lệ mổ</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)]">
                  {stats.sessions.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-xs text-[var(--mute)]">
                        Không có dữ liệu đợt khám.
                      </td>
                    </tr>
                  ) : (
                    stats.sessions.map((s) => {
                      const tyLeMo = s.nhomA > 0 ? Math.round((s.daMo / s.nhomA) * 100) : 0;
                      return (
                        <tr
                          key={s.id}
                          onClick={() =>
                            openDetail({
                              type: "session",
                              val: s.id,
                              title: `Đợt khám: ${s.xa || s.diaDiem}`,
                              subtitle: `Ngày khám: ${s.ngayKham ? fmtDate(s.ngayKham) : "—"} | Bác sĩ: ${s.bacSi || "—"} | Điểm khám: ${s.diaDiem || "—"}`,
                              icon: CalendarHeart,
                            })
                          }
                          className="hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-[var(--ink)] group-hover:text-[var(--navy)]">
                            {s.ngayKham ? new Date(s.ngayKham).toLocaleDateString("vi-VN") : "—"}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[var(--ink)] group-hover:text-[var(--navy)]">
                            {s.xa || "—"}
                          </td>
                          <td className="py-3 px-4 text-[var(--ink-soft)] truncate max-w-[200px]" title={s.diaDiem}>
                            {s.diaDiem || "—"}
                          </td>
                          <td className="py-3 px-4 text-[var(--ink-soft)] font-medium">{s.bacSi || "—"}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[var(--ink)]">
                            {s.tong.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                            {s.nhomA.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-amber-700">
                            {s.nhomB.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-amber-600">
                            {s.denKhongMo > 0 ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetail({
                                    type: "session_denKhongMo",
                                    val: s.id,
                                    title: `Đợt khám: ${s.xa || s.diaDiem} — Đến chưa mổ`,
                                    subtitle: `Bệnh nhân đã đến viện nhưng chưa/không mổ (${s.denKhongMo} ca)`,
                                    icon: UserX,
                                  });
                                }}
                                title="Bấm để xem danh sách bệnh nhân có đến nhưng không mổ"
                                className="underline decoration-dotted underline-offset-2 hover:text-amber-800 transition-colors cursor-pointer font-bold"
                              >
                                {s.denKhongMo.toLocaleString("vi-VN")}
                              </button>
                            ) : (
                              <span className="text-slate-300 font-normal">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-[var(--teal-deep)]">
                            {s.daMo.toLocaleString("vi-VN")}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
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
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => exportExcel(s.id)}
                              disabled={exportingSessionId === s.id}
                              title="Xuất Excel theo mẫu 101 cột Khám sức khỏe"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[var(--line-strong)] bg-white hover:bg-[var(--surface-soft)] text-[var(--navy)] transition-all cursor-pointer disabled:opacity-50"
                            >
                              {exportingSessionId === s.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <FileDown className="w-3 h-3 text-[var(--teal-deep)]" />
                              )}
                              Xuất Excel
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hàng 5: Xếp hạng Bác sĩ & Tư vấn viên */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Bác sĩ */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-sm font-bold text-[var(--ink)]">
                    Top Bác sĩ Chỉ định & Khám Sàng Lọc
                  </h3>
                  <p className="text-[11px] text-[var(--mute)]">
                    Theo số ca khám và tỷ lệ chỉ định (Bấm để xem danh sách bệnh nhân của bác sĩ)
                  </p>
                </div>
                <Stethoscope className="w-4 h-4 text-[var(--navy)]" />
              </div>
              <div className="space-y-2.5">
                {stats.topDoctors.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--mute)]">Chưa có dữ liệu bác sĩ.</div>
                ) : (
                  stats.topDoctors.map((doc, i) => (
                    <div
                      key={doc.name}
                      onClick={() =>
                        openDetail({
                          type: "doctor",
                          val: doc.name,
                          title: `Bác sĩ: ${doc.name}`,
                          subtitle: `Danh sách bệnh nhân được khám và chỉ định bởi Bác sĩ ${doc.name}`,
                          icon: Stethoscope,
                        })
                      }
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-soft)] hover:bg-[var(--surface-hover)] border border-[var(--line-soft)] hover:border-[var(--navy)]/30 text-xs cursor-pointer transition-all group"
                      title={`Xem danh sách bệnh nhân của ${doc.name}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-white border border-[var(--line)] flex items-center justify-center font-bold text-[10px] text-[var(--navy)] shrink-0 group-hover:bg-[var(--navy)] group-hover:text-white transition-colors">
                          {i + 1}
                        </span>
                        <span className="font-bold text-[var(--ink)] group-hover:text-[var(--navy)] truncate transition-colors">
                          {doc.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 font-mono shrink-0">
                        <span className="text-[var(--mute)]">
                          Khám: <b className="text-[var(--ink)]"><AnimatedNumber value={doc.total} /></b>
                        </span>
                        <span className="text-emerald-700 font-bold">Chỉ định: <AnimatedNumber value={doc.nhomA} /></span>
                        <span className="text-[var(--teal-deep)] font-extrabold">Đã mổ: <AnimatedNumber value={doc.daMo} /></span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[var(--navy)] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Tư vấn viên */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-sm font-bold text-[var(--ink)]">Top Tư Vấn Viên Chốt Ca Mổ</h3>
                  <p className="text-[11px] text-[var(--mute)]">
                    Theo số ca tư vấn và đã phẫu thuật (Bấm để xem danh sách bệnh nhân)
                  </p>
                </div>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="space-y-2.5">
                {stats.topCounselors.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--mute)]">Chưa có dữ liệu tư vấn viên.</div>
                ) : (
                  stats.topCounselors.map((c, i) => (
                    <div
                      key={c.name}
                      onClick={() =>
                        openDetail({
                          type: "counselor",
                          val: c.name,
                          title: `Tư vấn viên: ${c.name}`,
                          subtitle: `Danh sách bệnh nhân được tư vấn và chốt ca bởi ${c.name}`,
                          icon: UserCheck,
                        })
                      }
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-soft)] hover:bg-[var(--surface-hover)] border border-[var(--line-soft)] hover:border-emerald-300 text-xs cursor-pointer transition-all group"
                      title={`Xem danh sách bệnh nhân của tư vấn viên ${c.name}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-white border border-[var(--line)] flex items-center justify-center font-bold text-[10px] text-emerald-700 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          {i + 1}
                        </span>
                        <span className="font-bold text-[var(--ink)] group-hover:text-emerald-800 truncate transition-colors">
                          {c.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 font-mono shrink-0">
                        <span className="text-[var(--mute)]">
                          Tổng ca: <b className="text-[var(--ink)]"><AnimatedNumber value={c.total} /></b>
                        </span>
                        <span className="text-emerald-700 font-bold">Chốt mổ: <AnimatedNumber value={c.chotMo} /></span>
                        <span className="text-[var(--teal-deep)] font-extrabold">Đã mổ: <AnimatedNumber value={c.daMo} /></span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Modal Chi tiết khi click vào bất kỳ mục nào trên Dashboard */}
      {modalOpen && detailTarget && (
        <ReportDetailModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setDetailTarget(null);
          }}
          target={detailTarget}
          dateFilter="all"
          from={range.from}
          to={range.to}
          coSoName={stats?.coSoName}
          sessions={stats?.sessions}
          onExportSessionExcel={(sessionId) => exportExcel(sessionId)}
        />
      )}
    </div>
  );
}
