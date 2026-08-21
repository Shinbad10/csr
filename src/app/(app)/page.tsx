"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  CalendarHeart,
  ClipboardList,
  BarChart3,
  ArrowRight,
  PhoneCall,
  Users,
  Calendar,
  HeartHandshake,
  CheckCircle2,
  Activity,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { can } from "@/lib/permissions";
import { STATUS, statusOf } from "@/lib/csr";
import { Donut, BarChart, CHART_COLORS, type Slice } from "@/components/charts";
import { useRealtimeEvent } from "@/lib/useRealtime";

const TILES = [
  { label: "Đợt khám tầm soát", desc: "Tiếp nhận, đo thị lực, khám mắt & tư vấn theo đợt", href: "/buoi-kham", icon: CalendarHeart, cap: undefined, badge: "Thường trực" },
  { label: "Theo dõi A/B", desc: "Theo dõi, nhắc lịch, cập nhật trạng thái mổ & viện phí", href: "/theo-doi", icon: PhoneCall, cap: "hoso.followup" as const, badge: "Chăm sóc" },
  { label: "Đối chiếu HIS", desc: "Quét đối chiếu hàng loạt theo đợt & danh sách HIS", href: "/doi-chieu-his", icon: Activity, cap: "hoso.followup" as const, badge: "Tự động" },
  { label: "Hồ sơ bệnh nhân", desc: "Tra cứu, lọc, tìm kiếm theo tên, mã, SĐT hoặc CCCD", href: "/ho-so", icon: ClipboardList, cap: undefined, badge: "Tra cứu" },
  { label: "Báo cáo & thống kê", desc: "Xuất file Excel theo bộ lọc, biểu đồ tổng hợp", href: "/bao-cao", icon: BarChart3, cap: "report.export" as const, badge: "Tổng hợp" },
];

interface Stats {
  tong: number;
  soBuoi: number;
  byStatus: Record<string, number>;
  nhomA: number;
  nhomB: number;
  daMo: number;
}

const STATUS_ORDER = Object.keys(STATUS);
const statusColor = (key: string) => CHART_COLORS[Math.max(0, STATUS_ORDER.indexOf(key)) % CHART_COLORS.length];

const KPIS = [
  {
    key: "tong",
    label: "Tổng bệnh nhân",
    icon: Users,
    iconBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40",
    sparkColor: "text-blue-500",
  },
  {
    key: "soBuoi",
    label: "Buổi khám đã tạo",
    icon: Calendar,
    iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/40",
    sparkColor: "text-sky-500",
  },
  {
    key: "nhomA",
    label: "Nhóm A (Chỉ định mổ)",
    icon: HeartHandshake,
    iconBg: "bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/40",
    sparkColor: "text-teal-600",
  },
  {
    key: "daMo",
    label: "Đã mổ thành công",
    icon: CheckCircle2,
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40",
    sparkColor: "text-emerald-600",
  },
] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 25 },
  },
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const tiles = TILES.filter((t) => !t.cap || can(role, t.cap));

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(() => {
    fetch("/api/csr/reports")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setStats(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useRealtimeEvent(["buoikham_change", "hoso_change", "stats_change"], () => {
    loadStats();
  }, [loadStats]);

  const ready = status !== "loading" && !loading;

  const slices: Slice[] = stats
    ? STATUS_ORDER.map((k) => ({
        label: statusOf(k).label,
        value: stats.byStatus[k] || 0,
        color: statusColor(k),
      })).filter((s) => s.value > 0)
    : [];

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center py-32 sm:py-40 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--navy)]" />
        <span className="text-xs font-mono text-[var(--mute)] font-semibold">Đang nạp dữ liệu bảng điều khiển...</span>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[1280px] mx-auto space-y-4 sm:space-y-5 pb-8 pt-1"
    >
      {/* KPI 4 Cards Grid */}
      <div data-tour="db-kpi" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4.5">
        {KPIS.map((c) => {
          const Icon = c.icon;
          const val = (stats?.[c.key as keyof Stats] as number) ?? 0;
          return (
            <motion.div
              key={c.key}
              variants={itemVariants}
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-[var(--line-strong)] dark:border-white/10 p-4 sm:p-5 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group cursor-default"
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border flex items-center justify-center ${c.iconBg} shadow-2xs group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className="w-5 h-5" />
                </div>
                <Sparkles className={`w-3.5 h-3.5 ${c.sparkColor} opacity-50 group-hover:opacity-100 transition-opacity`} />
              </div>

              <div className="mt-3.5 sm:mt-4">
                <div className="font-mono text-[26px] sm:text-[32px] font-black text-[var(--ink)] dark:text-white tracking-tight leading-none">
                  {val.toLocaleString("vi-VN")}
                </div>
                <div className="text-[12px] sm:text-[12.5px] font-bold text-[var(--ink-soft)] dark:text-slate-400 mt-1.5 truncate">
                  {c.label}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section: Donut + Bar */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Left: Donut Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-[var(--line-strong)] dark:border-white/10 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line-soft)] dark:border-white/5">
            <h3 className="font-serif text-[15.5px] sm:text-[16.5px] font-bold text-[var(--ink)] dark:text-white">
              Phân bố hồ sơ theo trạng thái
            </h3>
            <span className="text-[10.5px] font-mono font-bold text-[var(--mute)] bg-[var(--surface-soft)] dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-[var(--line)] dark:border-white/10">
              Tổng: {((stats?.tong) ?? 0).toLocaleString("vi-VN")} ca
            </span>
          </div>
          <div className="py-2 flex items-center justify-center">
            <Donut data={slices} size={190} centerLabel="Hồ sơ" />
          </div>
        </div>

        {/* Right: Bar Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-[var(--line-strong)] dark:border-white/10 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line-soft)] dark:border-white/5">
            <h3 className="font-serif text-[15.5px] sm:text-[16.5px] font-bold text-[var(--ink)] dark:text-white">
              Phân nhóm &amp; kết quả
            </h3>
            <span className="text-[10.5px] font-mono font-bold text-[var(--teal-deep)] dark:text-[var(--teal)] bg-[var(--teal-soft)] dark:bg-teal-950/40 px-2.5 py-0.5 rounded-md border border-[var(--teal)]/20">
              Nhóm A: {stats?.nhomA ?? 0}
            </span>
          </div>
          <div className="py-2">
            <BarChart
              data={[
                { label: "Nhóm A", value: stats?.nhomA ?? 0, color: CHART_COLORS[1] },
                { label: "Nhóm B", value: stats?.nhomB ?? 0, color: CHART_COLORS[3] },
                { label: "Đã mổ", value: stats?.daMo ?? 0, color: CHART_COLORS[0] },
              ]}
              height={195}
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div variants={itemVariants} className="pt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-sans font-extrabold text-[11px] uppercase tracking-[0.15em] text-[var(--mute)] font-mono">
            Chức năng truy cập nhanh
          </h3>
          <span className="text-[11px] text-[var(--mute)] hidden sm:inline font-medium">Bấm vào thẻ để chuyển trang</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={t.href}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Link
                  href={t.href}
                  className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-[var(--line-strong)] dark:border-white/10 p-4 sm:p-4.5 shadow-xs hover:border-[var(--teal)] hover:shadow-md transition-all duration-200 flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-[var(--navy-50)] text-[var(--navy)] dark:text-[var(--teal)] flex items-center justify-center shrink-0 group-hover:bg-[var(--navy)] group-hover:text-[var(--teal)] group-hover:scale-105 transition-all duration-200 shadow-2xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-serif text-[15.5px] font-bold text-[var(--ink)] dark:text-white group-hover:text-[var(--navy)] dark:group-hover:text-[var(--teal)] transition-colors truncate">
                        {t.label}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[var(--mute-soft)] group-hover:text-[var(--teal)] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                    <p className="text-[12px] text-[var(--ink-soft)] dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {t.desc}
                    </p>
                    {t.badge && (
                      <span className="inline-block mt-2.5 px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold uppercase tracking-wider bg-[var(--surface-soft)] dark:bg-slate-800 text-[var(--mute)] border border-[var(--line)] dark:border-white/10 group-hover:bg-[var(--teal-soft)] dark:group-hover:bg-teal-950/60 group-hover:text-[var(--teal-deep)] dark:group-hover:text-[var(--teal)] group-hover:border-[var(--teal)]/30 transition-colors">
                        {t.badge}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

