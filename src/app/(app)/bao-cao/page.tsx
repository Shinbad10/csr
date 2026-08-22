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
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { STATUS, statusOf } from "@/lib/csr";
import { Donut, BarChart, CHART_COLORS, type Slice } from "@/components/charts";

interface StatsData {
  tong: number;
  soBuoi: number;
  byStatus: Record<string, number>;
  nhomA: number;
  nhomB: number;
  daMo: number;
  chuyenDoiMoPct: number;
  coBhytCount: number;
  bhytPct: number;
  sheetUrl: string | null;
  coSoName: string;
  funnel: Array<{ stage: string; count: number; pct: number }>;
  diseases: Array<{ label: string; value: number; color: string }>;
  demographics: {
    age: Array<{ label: string; value: number; color: string }>;
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

  const [dateFilter, setDateFilter] = useState<"all" | "30days" | "90days" | "year">("all");

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/csr/reports";
      const now = new Date();
      if (dateFilter === "30days") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        url += `?from=${d.toISOString().slice(0, 10)}`;
      } else if (dateFilter === "90days") {
        const d = new Date();
        d.setDate(d.getDate() - 90);
        url += `?from=${d.toISOString().slice(0, 10)}`;
      } else if (dateFilter === "year") {
        url += `?from=${now.getFullYear()}-01-01`;
      }
      const res = await fetch(url);
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {
      addToast({ type: "error", message: "Lỗi tải số liệu báo cáo" });
    } finally {
      setLoading(false);
    }
  }, [dateFilter, addToast]);

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
      const url = buoiKhamId
        ? `/api/csr/export?buoiKhamId=${buoiKhamId}&format=${format}`
        : `/api/csr/export?format=${format}`;
      const res = await fetch(url);
      if (!res.ok) {
        addToast({ type: "error", message: "Không thể xuất file (cần quyền Kế toán/Quản lý)" });
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
          <p className="text-xs text-[var(--mute)] mt-1 font-medium">
            Trung tâm điều hành & phân tích số liệu khám sàng lọc mắt cộng đồng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bộ lọc thời gian */}
          <div className="flex items-center bg-[var(--surface-soft)] p-1 rounded-xl border border-[var(--line-soft)] text-xs font-semibold text-[var(--ink-soft)]">
            <button
              onClick={() => setDateFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                dateFilter === "all" ? "bg-white text-[var(--navy)] font-bold shadow-xs" : "hover:text-[var(--ink)]"
              }`}
            >
              Toàn thời gian
            </button>
            <button
              onClick={() => setDateFilter("30days")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                dateFilter === "30days" ? "bg-white text-[var(--navy)] font-bold shadow-xs" : "hover:text-[var(--ink)]"
              }`}
            >
              30 ngày qua
            </button>
            <button
              onClick={() => setDateFilter("90days")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                dateFilter === "90days" ? "bg-white text-[var(--navy)] font-bold shadow-xs" : "hover:text-[var(--ink)]"
              }`}
            >
              90 ngày qua
            </button>
            <button
              onClick={() => setDateFilter("year")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                dateFilter === "year" ? "bg-white text-[var(--navy)] font-bold shadow-xs" : "hover:text-[var(--ink)]"
              }`}
            >
              Năm nay
            </button>
          </div>

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

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--navy)]" />
          <span className="text-xs text-[var(--mute)] font-medium">Đang tổng hợp dữ liệu báo cáo...</span>
        </div>
      ) : stats ? (
        <>
          {/* Hàng thẻ KPI chỉ số chính */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Tổng tiếp nhận */}
            <div className="card p-4 hover:border-[var(--navy)]/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-[var(--mute)]">Tổng tiếp nhận</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--navy-50)] text-[var(--navy)]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-extrabold text-[var(--ink)] mt-2 leading-none">
                {stats.tong.toLocaleString("vi-VN")}
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1.5 flex items-center gap-1">
                <span className="font-semibold text-emerald-600">100%</span> hồ sơ tiếp nhận
              </div>
            </div>

            {/* Buổi khám */}
            <div className="card p-4 hover:border-[var(--navy)]/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-[var(--mute)]">Đợt khám CSR</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-extrabold text-[var(--ink)] mt-2 leading-none">
                {stats.soBuoi.toLocaleString("vi-VN")}
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1.5">
                TB{" "}
                <span className="font-semibold text-[var(--ink)]">
                  {stats.soBuoi > 0 ? Math.round(stats.tong / stats.soBuoi) : 0}
                </span>{" "}
                BN/đợt
              </div>
            </div>

            {/* Nhóm A (Chỉ định mổ) */}
            <div className="card p-4 hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-[var(--mute)]">Nhóm A (Chỉ định mổ)</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
                  <HeartHandshake className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-extrabold text-emerald-700 mt-2 leading-none">
                {stats.nhomA.toLocaleString("vi-VN")}
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1.5">
                Tỷ lệ{" "}
                <span className="font-bold text-emerald-600">
                  {stats.tong > 0 ? ((stats.nhomA / stats.tong) * 100).toFixed(1) : 0}%
                </span>{" "}
                tiếp nhận
              </div>
            </div>

            {/* Nhóm B (Theo dõi) */}
            <div className="card p-4 hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-[var(--mute)]">Nhóm B (Theo dõi)</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-extrabold text-amber-700 mt-2 leading-none">
                {stats.nhomB.toLocaleString("vi-VN")}
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1.5">
                Tỷ lệ{" "}
                <span className="font-bold text-amber-600">
                  {stats.tong > 0 ? ((stats.nhomB / stats.tong) * 100).toFixed(1) : 0}%
                </span>{" "}
                tiếp nhận
              </div>
            </div>

            {/* Đã mổ (HIS) */}
            <div className="card p-4 hover:border-[var(--teal)] transition-all bg-gradient-to-br from-white to-[var(--teal-soft)]/20">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-[var(--teal-deep)]">Đã mổ (HIS)</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--teal-soft)] text-[var(--teal-deep)]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-extrabold text-[var(--teal-deep)] mt-2 leading-none">
                {stats.daMo.toLocaleString("vi-VN")}
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1.5">
                Chuyển đổi{" "}
                <span className="font-bold text-[var(--teal-deep)]">{stats.chuyenDoiMoPct}%</span> nhóm A
              </div>
            </div>

            {/* Có BHYT */}
            <div className="card p-4 hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-[var(--mute)]">Bao phủ BHYT</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-2xl font-extrabold text-indigo-700 mt-2 leading-none">
                {stats.bhytPct}%
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1.5">
                <span className="font-bold text-indigo-600">{stats.coBhytCount.toLocaleString("vi-VN")}</span> BN có thẻ
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
                  <p className="text-[11.5px] text-[var(--mute)]">Hiệu quả từng bước trong quy trình CSR</p>
                </div>
                <span className="text-xs font-bold text-[var(--teal-deep)] bg-[var(--teal-soft)] px-2.5 py-1 rounded-full border border-[var(--teal)]/30">
                  Tỷ lệ mổ: {stats.chuyenDoiMoPct}%
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {stats.funnel.map((item, idx) => {
                  const colors = [
                    "from-blue-600 to-indigo-600",
                    "from-sky-500 to-cyan-500",
                    "from-emerald-500 to-teal-500",
                    "from-amber-500 to-orange-500",
                    "from-teal-600 to-emerald-600",
                  ];
                  return (
                    <div key={item.stage} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--ink-soft)] flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-[var(--surface-soft)] border border-[var(--line)] flex items-center justify-center text-[10px] font-bold text-[var(--mute)]">
                            {idx + 1}
                          </span>
                          {item.stage}
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-[var(--ink)]">{item.count.toLocaleString("vi-VN")}</span>
                          <span className="text-[var(--mute)] text-[11px]">({item.pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-[var(--surface-soft)] rounded-full overflow-hidden border border-[var(--line-soft)]">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${colors[idx % colors.length]} transition-all duration-500`}
                          style={{ width: `${Math.max(item.pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cơ cấu Bệnh lý Nhãn khoa */}
            <div className="card lg:col-span-6 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-base font-bold text-[var(--ink)]">Cơ cấu Bệnh lý Phát hiện</h2>
                  <p className="text-[11.5px] text-[var(--mute)]">Phân loại bệnh lý mắt qua các buổi sàng lọc</p>
                </div>
                <Eye className="w-4 h-4 text-[var(--mute)]" />
              </div>

              {stats.diseases.length > 0 ? (
                <Donut data={stats.diseases} size={180} centerLabel="Ca bệnh" />
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
              <p className="text-[11px] text-[var(--mute)] mb-4">Tỷ lệ người cao tuổi trong cộng đồng</p>
              <div className="space-y-2.5">
                {stats.demographics.age.map((a) => {
                  const pct = stats.tong > 0 ? Math.round((a.value / stats.tong) * 100) : 0;
                  return (
                    <div key={a.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--ink-soft)] font-medium">{a.label}</span>
                        <span className="font-mono font-bold text-[var(--ink)]">
                          {a.value.toLocaleString("vi-VN")} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[var(--surface-soft)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: a.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phân bố Giới tính */}
            <div className="card p-5">
              <h3 className="font-serif text-sm font-bold text-[var(--ink)] mb-1">Giới tính</h3>
              <p className="text-[11px] text-[var(--mute)] mb-4">Tỷ lệ bệnh nhân Nam / Nữ</p>
              <div className="flex items-center justify-around py-4">
                {stats.demographics.gender.map((g) => {
                  const pct = stats.tong > 0 ? Math.round((g.value / stats.tong) * 100) : 0;
                  return (
                    <div key={g.label} className="text-center">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center font-mono font-bold text-base text-white mx-auto shadow-xs"
                        style={{ background: g.color }}
                      >
                        {pct}%
                      </div>
                      <div className="text-xs font-bold text-[var(--ink)] mt-2">{g.label}</div>
                      <div className="font-mono text-[11px] text-[var(--mute)]">{g.value.toLocaleString("vi-VN")} BN</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mức hưởng BHYT */}
            <div className="card p-5">
              <h3 className="font-serif text-sm font-bold text-[var(--ink)] mb-1">Mức hưởng BHYT</h3>
              <p className="text-[11px] text-[var(--mute)] mb-4">Hỗ trợ chi trả bảo hiểm y tế</p>
              <div className="space-y-2.5">
                {stats.demographics.bhyt.map((b) => {
                  const pct = stats.tong > 0 ? Math.round((b.value / stats.tong) * 100) : 0;
                  return (
                    <div key={b.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--ink-soft)] font-medium">{b.label}</span>
                        <span className="font-mono font-bold text-[var(--ink)]">
                          {b.value.toLocaleString("vi-VN")} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[var(--surface-soft)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: b.color }} />
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
                  Tổng hợp số liệu tiếp nhận, chỉ định và phẫu thuật theo từng địa bàn
                </p>
              </div>
              <span className="text-xs font-bold text-[var(--mute)] bg-white px-3 py-1 rounded-lg border border-[var(--line)]">
                {stats.sessions.length} đợt khám
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--surface-soft)] text-[var(--ink-soft)] font-bold">
                    <th className="py-3 px-4">Ngày khám</th>
                    <th className="py-3 px-4">Địa bàn / Xã</th>
                    <th className="py-3 px-4">Điểm khám</th>
                    <th className="py-3 px-4">Bác sĩ phụ trách</th>
                    <th className="py-3 px-3 text-right">Tiếp nhận</th>
                    <th className="py-3 px-3 text-right text-emerald-700">Nhóm A</th>
                    <th className="py-3 px-3 text-right text-amber-700">Nhóm B</th>
                    <th className="py-3 px-3 text-right text-[var(--teal-deep)]">Đã mổ</th>
                    <th className="py-3 px-3 text-right">Tỷ lệ mổ</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)]">
                  {stats.sessions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-xs text-[var(--mute)]">
                        Không có dữ liệu đợt khám.
                      </td>
                    </tr>
                  ) : (
                    stats.sessions.map((s) => {
                      const tyLeMo = s.nhomA > 0 ? Math.round((s.daMo / s.nhomA) * 100) : 0;
                      return (
                        <tr key={s.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[var(--ink)]">
                            {s.ngayKham ? new Date(s.ngayKham).toLocaleDateString("vi-VN") : "—"}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[var(--ink)]">{s.xa || "—"}</td>
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
                          <td className="py-3 px-4 text-center">
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
                  <p className="text-[11px] text-[var(--mute)]">Theo số ca khám và tỷ lệ chỉ định phẫu thuật</p>
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
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--line-soft)] text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-white border border-[var(--line)] flex items-center justify-center font-bold text-[10px] text-[var(--navy)] shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-bold text-[var(--ink)] truncate">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-4 font-mono shrink-0">
                        <span className="text-[var(--mute)]">
                          Khám: <b className="text-[var(--ink)]">{doc.total}</b>
                        </span>
                        <span className="text-emerald-700 font-bold">Chỉ định: {doc.nhomA}</span>
                        <span className="text-[var(--teal-deep)] font-extrabold">Đã mổ: {doc.daMo}</span>
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
                  <p className="text-[11px] text-[var(--mute)]">Theo số ca tư vấn thành công và đã phẫu thuật</p>
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
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--line-soft)] text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-white border border-[var(--line)] flex items-center justify-center font-bold text-[10px] text-emerald-700 shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-bold text-[var(--ink)] truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-4 font-mono shrink-0">
                        <span className="text-[var(--mute)]">
                          Tổng ca: <b className="text-[var(--ink)]">{c.total}</b>
                        </span>
                        <span className="text-emerald-700 font-bold">Chốt mổ: {c.chotMo}</span>
                        <span className="text-[var(--teal-deep)] font-extrabold">Đã mổ: {c.daMo}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

