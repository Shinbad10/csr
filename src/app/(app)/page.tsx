"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarHeart, ClipboardList, BarChart3, ArrowRight, PhoneCall, Users, Calendar, HeartHandshake, CheckCircle2, Activity } from "lucide-react";
import { can } from "@/lib/permissions";
import PageHeader from "@/components/layout/PageHeader";
import { STATUS, statusOf } from "@/lib/csr";
import { Donut, BarChart, CHART_COLORS, type Slice } from "@/components/charts";

const TILES = [
  { label: "Đợt khám tầm soát", desc: "Tiếp nhận, đo thị lực, khám mắt & tư vấn theo đợt", href: "/buoi-kham", icon: CalendarHeart, cap: undefined },
  { label: "Theo dõi A/B", desc: "Theo dõi, nhắc lịch, cập nhật trạng thái mổ & thu viện phí", href: "/theo-doi", icon: PhoneCall, cap: "hoso.followup" as const },
  { label: "Đối chiếu HIS", desc: "Quét đối chiếu hàng loạt theo đợt & đối chiếu ngược từ danh sách mổ HIS", href: "/doi-chieu-his", icon: Activity, cap: "hoso.followup" as const },
  { label: "Hồ sơ bệnh nhân", desc: "Tra cứu, lọc, tìm theo tên / mã / SĐT / CCCD", href: "/ho-so", icon: ClipboardList, cap: undefined },
  { label: "Báo cáo & thống kê", desc: "Xuất Excel theo bộ lọc, thống kê cơ bản", href: "/bao-cao", icon: BarChart3, cap: "report.export" as const },
];

interface Stats { tong: number; soBuoi: number; byStatus: Record<string, number>; nhomA: number; nhomB: number; daMo: number }

const STATUS_ORDER = Object.keys(STATUS);
const statusColor = (key: string) => CHART_COLORS[Math.max(0, STATUS_ORDER.indexOf(key)) % CHART_COLORS.length];

const KPIS = [
  { key: "tong", label: "Tổng bệnh nhân", icon: Users, accent: "text-[var(--navy)] bg-[var(--navy-50)]" },
  { key: "soBuoi", label: "Buổi khám", icon: Calendar, accent: "text-[var(--navy)] bg-[var(--navy-50)]" },
  { key: "nhomA", label: "Nhóm A (chỉ định mổ)", icon: HeartHandshake, accent: "text-[var(--teal-deep)] bg-[var(--teal-soft)]" },
  { key: "daMo", label: "Đã mổ", icon: CheckCircle2, accent: "text-[var(--teal-deep)] bg-[var(--teal-soft)]" },
] as const;

export default function Dashboard() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const tiles = TILES.filter((t) => !t.cap || can(role, t.cap));

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/csr/reports").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setStats(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const slices: Slice[] = stats
    ? STATUS_ORDER.map((k) => ({ label: statusOf(k).label, value: stats.byStatus[k] || 0, color: statusColor(k) })).filter((s) => s.value > 0)
    : [];

  return (
    <div>
      <PageHeader
        title={<>Xin chào, <span className="italic text-[var(--teal-deep)]">{session?.user?.name || "bạn"}</span></>}
        description="Tổng quan hoạt động của cơ sở đang làm việc."
        guideTitle="Bảng điều khiển"
        guide={[
          { selector: '[data-tour="db-kpi"]', title: "Xem chỉ số nhanh", desc: "Các thẻ KPI này tổng hợp hoạt động chính của cơ sở đang làm việc." },
          { selector: '[data-tour="db-nav"]', title: "Điều hướng chức năng", desc: "Dùng thanh menu bên trái để chuyển giữa các chức năng. Bắt đầu từ \"Đợt khám tầm soát\"." },
          { selector: '[data-tour="help-btn"]', title: "Cần trợ giúp?", desc: "Mỗi trang đều có nút \"Hướng dẫn\" này — bấm để xem tour từng bước." },
        ]}
        guideTip="Quy trình chuẩn: Đợt khám → Khám → Tư vấn & phân nhóm → Theo dõi A/B → Đối chiếu HIS → Báo cáo."
      />

      {/* KPI */}
      <div data-tour="db-kpi" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
        {KPIS.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.key} className="card p-4">
              <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${c.accent}`}><Icon className="w-5 h-5" /></div>
              <div className="font-mono text-[28px] font-bold text-[var(--ink)] mt-3 leading-none">
                {loading ? <span className="inline-block w-14 h-7 bg-[var(--surface-hover)] rounded animate-pulse" /> : (stats?.[c.key as keyof Stats] as number) ?? 0}
              </div>
              <div className="text-[12px] text-[var(--text-muted)] mt-1.5">{c.label}</div>
            </div>
          );
        })}
      </div>

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="card lg:col-span-2">
          <h3 className="font-serif text-[16px] font-semibold text-[var(--ink)] mb-4">Phân bố hồ sơ theo trạng thái</h3>
          {loading ? <div className="h-[200px] bg-[var(--surface-hover)] rounded-[var(--r-md)] animate-pulse" /> : <Donut data={slices} centerLabel="Hồ sơ" />}
        </div>
        <div className="card">
          <h3 className="font-serif text-[16px] font-semibold text-[var(--ink)] mb-4">Phân nhóm & kết quả</h3>
          {loading ? <div className="h-[210px] bg-[var(--surface-hover)] rounded-[var(--r-md)] animate-pulse" /> : (
            <BarChart data={[
              { label: "Nhóm A", value: stats?.nhomA ?? 0, color: CHART_COLORS[1] },
              { label: "Nhóm B", value: stats?.nhomB ?? 0, color: CHART_COLORS[3] },
              { label: "Đã mổ", value: stats?.daMo ?? 0, color: CHART_COLORS[0] },
            ]} height={210} />
          )}
        </div>
      </div>

      {/* Điều hướng nhanh */}
      <h3 className="font-sans font-extrabold text-[11px] uppercase tracking-[0.14em] text-[var(--mute)] mt-8 mb-3">Truy cập nhanh</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href}
              className="group card hover:shadow-[var(--shadow-md)] hover:border-[var(--navy-100)] transition-all flex items-start gap-4 p-5">
              <div className="w-11 h-11 rounded-[12px] bg-[var(--navy-50)] text-[var(--navy)] flex items-center justify-center shrink-0 group-hover:bg-[var(--navy)] group-hover:text-[var(--teal)] transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-[17px] font-semibold text-[var(--ink)]">{t.label}</span>
                  <ArrowRight className="w-4 h-4 text-[var(--mute-soft)] group-hover:text-[var(--navy)] group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[12.5px] text-[var(--text-muted)] mt-1 leading-snug">{t.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
