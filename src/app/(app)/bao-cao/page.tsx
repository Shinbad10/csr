"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Loader2, Download, Users, Calendar, HeartHandshake, Activity, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { STATUS, statusOf } from "@/lib/csr";
import { Donut, BarChart, CHART_COLORS, type Slice } from "@/components/charts";

// Màu ổn định theo TRẠNG THÁI (theo thứ tự khai báo trong STATUS — màu bám trạng thái, không theo thứ hạng).
const STATUS_ORDER = Object.keys(STATUS);
const statusColor = (key: string) => CHART_COLORS[Math.max(0, STATUS_ORDER.indexOf(key)) % CHART_COLORS.length];

interface Stats { tong: number; soBuoi: number; byStatus: Record<string, number>; nhomA: number; nhomB: number; daMo: number; sheetUrl: string | null }

const CARDS = [
  { key: "tong", label: "Tổng bệnh nhân", icon: Users, accent: "text-[var(--navy)] bg-[var(--navy-50)]" },
  { key: "soBuoi", label: "Buổi khám", icon: Calendar, accent: "text-[var(--navy)] bg-[var(--navy-50)]" },
  { key: "nhomA", label: "Nhóm A (chỉ định mổ)", icon: HeartHandshake, accent: "text-[var(--teal-deep)] bg-[var(--teal-soft)]" },
  { key: "nhomB", label: "Nhóm B (theo dõi)", icon: Activity, accent: "text-[var(--gold-deep)] bg-[var(--gold-soft)]" },
  { key: "daMo", label: "Đã mổ", icon: CheckCircle2, accent: "text-[var(--teal-deep)] bg-[var(--teal-soft)]" },
] as const;

export default function BaoCaoPage() {
  const { addToast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/csr/reports");
    if (res.ok) setStats(await res.json());
    setLoading(false);
  }, []);
  useEffect(() => { (async () => { await load(); })(); }, [load]);

  const exportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/csr/export");
      if (!res.ok) { addToast({ type: "error", message: "Không thể xuất (cần quyền Kế toán/Quản lý)" }); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `VISI_CSR_${new Date().toISOString().slice(0, 10)}.xlsx`; a.click();
      URL.revokeObjectURL(url);
      addToast({ type: "success", message: "Đã xuất Excel theo bộ lọc cơ sở." });
    } catch { addToast({ type: "error", message: "Mất kết nối" }); }
    finally { setExporting(false); }
  };

  return (
    <div>
      <PageHeader 
        title="Báo cáo & thống kê"
        description="Thống kê cơ bản theo cơ sở đang làm việc + xuất Excel để Kế toán tính tiền CSR."
        guide={[
          { selector: '[data-tour="bc-kpi"]', title: "Xem số liệu tổng quan", desc: "Các thẻ KPI này tổng hợp số bệnh nhân theo từng trạng thái của cơ sở." },
          { selector: '[data-tour="bc-chart"]', title: "Xem phân bố", desc: "Biểu đồ \"Phân bố theo trạng thái\" cho thấy tỉ lệ các nhóm bệnh nhân." },
          { selector: '[data-tour="bc-export"]', title: "Xuất Excel", desc: "Bấm \"Xuất Excel\" để tải file cho Kế toán tính tiền CSR." },
          { selector: '[data-tour="bc-sheet"]', title: "Mở Google Sheet", desc: "Bấm \"Google Sheet\" (nếu có) để xem báo cáo trực tuyến được đồng bộ." },
        ]}
        guideTip="Số liệu thống kê theo đúng cơ sở bạn đang làm việc."
        actions={<div className="flex items-center gap-2">
          {stats?.sheetUrl && <a data-tour="bc-sheet" href={stats.sheetUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary px-4 py-2.5 font-bold"><FileSpreadsheet className="w-4 h-4 text-[var(--teal-deep)]" /> Google Sheet</a>}
          <button data-tour="bc-export" onClick={exportExcel} disabled={exporting} className="btn btn-primary px-5 py-2.5 font-bold">{exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-[var(--teal)]" />} Xuất Excel</button>
        </div>}
      />

      {loading ? <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--navy)]" /></div> : stats && (<>
        <div data-tour="bc-kpi" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.key} className="card p-4">
                <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${c.accent}`}><Icon className="w-5 h-5" /></div>
                <div className="font-mono text-[28px] font-bold text-[var(--ink)] mt-3 leading-none">{stats[c.key as keyof Stats] as number}</div>
                <div className="text-[12px] text-[var(--text-muted)] mt-1.5">{c.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
          <div data-tour="bc-chart" className="card lg:col-span-2">
            <h3 className="font-serif text-[16px] font-semibold text-[var(--ink)] mb-4">Phân bố theo trạng thái</h3>
            {(() => {
              const slices: Slice[] = STATUS_ORDER
                .map((k) => ({ label: statusOf(k).label, value: stats.byStatus[k] || 0, color: statusColor(k) }))
                .filter((s) => s.value > 0);
              return <Donut data={slices} centerLabel="Hồ sơ" />;
            })()}
          </div>
          <div className="card">
            <h3 className="font-serif text-[16px] font-semibold text-[var(--ink)] mb-4">Phân nhóm & kết quả</h3>
            <BarChart data={[
              { label: "Nhóm A", value: stats.nhomA, color: CHART_COLORS[1] },
              { label: "Nhóm B", value: stats.nhomB, color: CHART_COLORS[3] },
              { label: "Đã mổ", value: stats.daMo, color: CHART_COLORS[0] },
            ]} height={210} />
          </div>
        </div>
      </>)}
    </div>
  );
}
