"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  CalendarHeart,
  ClipboardList,
  BarChart3,
  ArrowRight,
  PhoneCall,
  Users,
  HeartHandshake,
  CheckCircle2,
  Activity,
  Bus,
  Loader2,
  Sparkles,
  Stethoscope,
  Building2,
  ShieldCheck,
  TrendingUp,
  Clock,
  ChevronRight,
  Eye,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { can } from "@/lib/permissions";
import { useRealtimeEvent } from "@/lib/useRealtime";
import { useCurrentFacility } from "@/lib/useFacility";
import ReportDetailModal, { type ReportModalTarget } from "@/components/csr/ReportDetailModal";

interface Stats {
  tong: number;
  soBuoi: number;
  byStatus: Record<string, number>;
  nhomA: number;
  nhomB: number;
  daMo: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 380, damping: 26 },
  },
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const role = session?.user?.role || "";
  const { currentCoSo, hasHisConfig } = useCurrentFacility();

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // State cho Modal chi tiết khi click vào KPI
  const [detailTarget, setDetailTarget] = useState<ReportModalTarget | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openDetail = (target: ReportModalTarget) => {
    setDetailTarget(target);
    setModalOpen(true);
  };

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

  // Tính toán tỷ lệ phần trăm
  const tongBN = stats?.tong ?? 0;
  const nhomA = stats?.nhomA ?? 0;
  const nhomB = stats?.nhomB ?? 0;
  const daMo = stats?.daMo ?? 0;
  const soBuoi = stats?.soBuoi ?? 0;

  const tyLeChiDinh = tongBN > 0 ? Math.round((nhomA / tongBN) * 100) : 0;
  const tyLeMoThanhCong = nhomA > 0 ? Math.round((daMo / nhomA) * 100) : 0;

  // Danh mục điều hướng nghiệp vụ chính (đồng đều, cân đối)
  const navTiles = useMemo(() => {
    const all = [
      {
        id: "buoi-kham",
        label: "Đợt khám tầm soát",
        desc: "Lập lịch, tiếp nhận cộng đồng, đo thị lực & quản lý danh sách khám.",
        href: "/buoi-kham",
        icon: CalendarHeart,
        cap: "buoikham.view" as const,
        tag: "Tiếp nhận",
        accent: "from-blue-600 to-indigo-700",
        chip: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300",
      },
      {
        id: "tu-van",
        label: "Tư vấn điều trị",
        desc: "Khám lâm sàng, phân loại Nhóm A/B, tư vấn phẫu thuật & đặt hẹn mổ.",
        href: "/tu-van",
        icon: Stethoscope,
        cap: "hoso.clinical" as const,
        tag: "Chỉ định mổ",
        accent: "from-teal-600 to-emerald-700",
        chip: "bg-teal-50 text-teal-800 border-teal-200/60 dark:bg-teal-950/40 dark:text-teal-300",
      },
      {
        id: "theo-doi",
        label: "Theo dõi & Chăm sóc",
        desc: "Chăm sóc Nhóm A/B, gọi nhắc lịch đến viện, cập nhật mổ & thực thu.",
        href: "/theo-doi",
        icon: PhoneCall,
        cap: "hoso.followup" as const,
        tag: "Chăm sóc",
        accent: "from-amber-600 to-orange-700",
        chip: "bg-amber-50 text-amber-800 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300",
      },
      {
        id: "ho-so",
        label: "Hồ sơ bệnh nhân",
        desc: "Tra cứu thông tin, lịch sử khám, tìm kiếm theo tên, SĐT, CCCD hoặc mã BN.",
        href: "/ho-so",
        icon: ClipboardList,
        cap: undefined,
        tag: "Tra cứu",
        accent: "from-sky-600 to-blue-700",
        chip: "bg-sky-50 text-sky-800 border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300",
      },
      {
        id: "bao-cao",
        label: "Báo cáo & Thống kê",
        desc: "Xem biểu đồ chuyên sâu, tổng hợp kết quả toàn diện & xuất file Excel.",
        href: "/bao-cao",
        icon: BarChart3,
        cap: "report.export" as const,
        tag: "Dữ liệu & Excel",
        accent: "from-purple-600 to-violet-700",
        chip: "bg-purple-50 text-purple-800 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300",
      },
      {
        id: "quan-tri",
        label: "Quản trị hệ thống",
        desc: "Cấu hình đơn vị, danh sách bác sĩ, phân quyền tài khoản & kết nối HIS/BHYT.",
        href: "/quan-tri",
        icon: Building2,
        cap: "admin.users" as const,
        tag: "Cấu hình",
        accent: "from-slate-700 to-slate-900",
        chip: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200",
      },
      {
        id: "doan-xe",
        label: "Danh sách đoàn xe đón",
        desc: "Điều phối lộ trình xe, điểm đón, giờ đón và danh sách bệnh nhân điều trị.",
        href: "/doan-xe",
        icon: Bus,
        cap: "hoso.followup" as const,
        tag: "Xe đón",
        accent: "from-blue-600 to-indigo-700",
        chip: "bg-blue-50 text-blue-800 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300",
      },
    ];

    return all.filter((t) => !t.cap || can(role, t.cap));
  }, [role]);

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center py-36 gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-[var(--navy)]" />
        <span className="text-[13px] font-mono text-[var(--mute)] font-semibold">
          Đang nạp dữ liệu tổng quan...
        </span>
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full space-y-5 sm:space-y-6 pb-12 pt-1"
      >
        {/* TOP: 4 KPI CARDS GỌN GÀNG & RÕ RÀNG (2x2 TRÊN MOBILE) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4.5">
          {/* KPI 1: Tổng tiếp nhận */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() =>
              openDetail({
                type: "kpi_tong",
                title: "Danh sách Bệnh nhân Tiếp nhận",
                subtitle: "Toàn bộ hồ sơ bệnh nhân trong hệ thống",
                icon: Users,
              })
            }
            className="card p-3.5 sm:p-5 relative overflow-hidden group cursor-pointer hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider block truncate">
                  Tổng tiếp nhận
                </span>
                <div className="text-[22px] sm:text-[34px] font-black font-mono text-[var(--ink)] mt-1 leading-tight">
                  {tongBN.toLocaleString("vi-VN")}
                </div>
              </div>
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs group-hover:scale-105 transition-transform">
                <Users className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="mt-2.5 pt-2 sm:mt-4 sm:pt-3 border-t border-[var(--line-soft)] flex items-center justify-between text-[10.5px] sm:text-[12px] text-[var(--mute)]">
              <span className="truncate">Đã tiếp nhận</span>
              <span className="text-blue-700 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 shrink-0">
                Chi tiết ➔
              </span>
            </div>
          </motion.div>

          {/* KPI 2: Đợt khám CSR */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() =>
              openDetail({
                type: "kpi_soBuoi",
                title: "Danh sách Đợt khám CSR",
                subtitle: "Tổng hợp các đợt khám sàng lọc cộng đồng",
                icon: CalendarHeart,
              })
            }
            className="card p-3.5 sm:p-5 relative overflow-hidden group cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider block truncate">
                  Đợt khám CSR
                </span>
                <div className="text-[22px] sm:text-[34px] font-black font-mono text-[var(--ink)] mt-1 leading-tight">
                  {soBuoi.toLocaleString("vi-VN")}
                </div>
              </div>
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-200/60 shadow-2xs group-hover:scale-105 transition-transform">
                <CalendarHeart className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="mt-2.5 pt-2 sm:mt-4 sm:pt-3 border-t border-[var(--line-soft)] flex items-center justify-between text-[10.5px] sm:text-[12px] text-[var(--mute)]">
              <span className="truncate">Đợt đã tạo</span>
              <span className="text-indigo-700 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 shrink-0">
                Chi tiết ➔
              </span>
            </div>
          </motion.div>

          {/* KPI 3: Chỉ định mổ Nhóm A */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() =>
              openDetail({
                type: "kpi_nhomA",
                title: "Danh sách Bệnh nhân Nhóm A (Chỉ định mổ)",
                subtitle: "Bệnh nhân có chỉ định phẫu thuật",
                icon: HeartHandshake,
              })
            }
            className="card p-3.5 sm:p-5 relative overflow-hidden group cursor-pointer hover:border-teal-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600" />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider block truncate">
                  Chỉ định mổ (A)
                </span>
                <div className="text-[22px] sm:text-[34px] font-black font-mono text-[var(--teal-deep)] mt-1 leading-tight">
                  {nhomA.toLocaleString("vi-VN")}
                </div>
              </div>
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0 border border-teal-200/60 shadow-2xs group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="mt-2.5 pt-2 sm:mt-4 sm:pt-3 border-t border-[var(--line-soft)] flex items-center justify-between text-[10.5px] sm:text-[12px]">
              <span className="text-[var(--mute)] truncate">
                Tỷ lệ: <strong className="text-teal-800 font-mono">{tyLeChiDinh}%</strong>
              </span>
              <span className="text-teal-800 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 shrink-0">
                Chi tiết ➔
              </span>
            </div>
          </motion.div>

          {/* KPI 4: Đã phẫu thuật thành công */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() =>
              openDetail({
                type: "kpi_daMo",
                title: "Danh sách Bệnh nhân Đã phẫu thuật (HIS)",
                subtitle: "Bệnh nhân đã mổ mắt thành công",
                icon: CheckCircle2,
              })
            }
            className="card p-3.5 sm:p-5 relative overflow-hidden group cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider block truncate">
                  Đã phẫu thuật
                </span>
                <div className="text-[22px] sm:text-[34px] font-black font-mono text-emerald-800 mt-1 leading-tight">
                  {daMo.toLocaleString("vi-VN")}
                </div>
              </div>
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="mt-2.5 pt-2 sm:mt-4 sm:pt-3 border-t border-[var(--line-soft)] flex items-center justify-between text-[10.5px] sm:text-[12px]">
              <span className="text-[var(--mute)] truncate">
                Tỷ lệ mổ: <strong className="text-emerald-800 font-mono">{tyLeMoThanhCong}%</strong>
              </span>
              <span className="text-emerald-800 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 shrink-0">
                Chi tiết ➔
              </span>
            </div>
          </motion.div>
        </div>

        {/* MIDDLE: PIPELINE TÓM TẮT TIẾN ĐỘ NGHIỆP VỤ & LỐI TẮT BÁO CÁO */}
        <motion.div
          variants={itemVariants}
          className="card p-4 sm:p-5 bg-gradient-to-r from-white via-slate-50/70 to-indigo-50/40 border border-[var(--line)] shadow-2xs"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--teal)] animate-pulse" />
                <h3 className="text-[14.5px] sm:text-[15.5px] font-bold text-[var(--ink)]">
                  Tiến độ vận hành & Phân loại dòng bệnh nhân
                </h3>
              </div>
              <p className="text-[12.5px] text-[var(--mute)]">
                Tóm tắt luồng hoạt động từ Tiếp nhận cộng đồng ➔ Khám phân loại ➔ Hẹn mổ & Điều trị tại viện
              </p>
            </div>

            <Link
              href="/bao-cao"
              className="inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-bold text-[var(--navy)] bg-white hover:bg-[var(--navy-50)] border border-[var(--navy)]/20 hover:border-[var(--navy)] rounded-xl transition-all shadow-2xs shrink-0 self-start lg:self-center"
            >
              <BarChart3 className="w-4 h-4 text-[var(--teal-deep)]" />
              <span>Xem Báo cáo biểu đồ chi tiết & Xuất Excel</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4 Pipeline Stages */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--line-soft)]">
            <div className="p-3 rounded-xl bg-white border border-[var(--line-soft)] shadow-2xs">
              <div className="text-[11px] font-bold text-[var(--mute)] uppercase">1. Tiếp nhận</div>
              <div className="text-[20px] font-black font-mono text-blue-700 mt-1">
                {tongBN.toLocaleString("vi-VN")} <span className="text-[11px] font-normal text-[var(--mute)]">ca</span>
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1">Đã vào danh sách</div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[var(--line-soft)] shadow-2xs">
              <div className="text-[11px] font-bold text-[var(--mute)] uppercase">2. Nhóm A (Mổ)</div>
              <div className="text-[20px] font-black font-mono text-[var(--teal-deep)] mt-1">
                {nhomA.toLocaleString("vi-VN")} <span className="text-[11px] font-normal text-[var(--mute)]">ca</span>
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1">{tyLeChiDinh}% tổng khám</div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[var(--line-soft)] shadow-2xs">
              <div className="text-[11px] font-bold text-[var(--mute)] uppercase">3. Nhóm B (Chăm sóc)</div>
              <div className="text-[20px] font-black font-mono text-amber-700 mt-1">
                {nhomB.toLocaleString("vi-VN")} <span className="text-[11px] font-normal text-[var(--mute)]">ca</span>
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1">Theo dõi định kỳ</div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[var(--line-soft)] shadow-2xs">
              <div className="text-[11px] font-bold text-[var(--mute)] uppercase">4. Đã phẫu thuật</div>
              <div className="text-[20px] font-black font-mono text-emerald-700 mt-1">
                {daMo.toLocaleString("vi-VN")} <span className="text-[11px] font-normal text-[var(--mute)]">ca</span>
              </div>
              <div className="text-[11px] text-[var(--mute)] mt-1">{tyLeMoThanhCong}% ca Nhóm A</div>
            </div>
          </div>
        </motion.div>

        {/* BOTTOM: CÁC CARD ĐIỀU HƯỚNG NGHIỆP VỤ ĐỒNG ĐỀU & ĐẸP */}
        <motion.div variants={itemVariants} className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] sm:text-[17px] font-bold text-[var(--ink)] tracking-tight">
                Chức năng điều hướng nhanh
              </h2>
              <p className="text-[12px] text-[var(--mute)] mt-0.5">
                Truy cập trực tiếp các quy trình nghiệp vụ chính của hệ thống
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--mute)] hidden sm:inline-block">
              {navTiles.length} phân hệ
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4.5">
            {navTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <motion.div
                  key={tile.id}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="h-full"
                >
                  <Link
                    href={tile.href}
                    className="card p-3 sm:p-5 h-full flex flex-col justify-between hover:border-[var(--teal)] hover:shadow-md transition-all duration-200 group relative overflow-hidden cursor-pointer"
                  >
                    {/* Accent subtle bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tile.accent}`} />

                    <div>
                      {/* Card Header: Icon + Badge */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div
                          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br ${tile.accent} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0`}
                        >
                          <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                          <span
                            className={`px-1.5 sm:px-2.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider border truncate ${tile.chip}`}
                          >
                            {tile.tag}
                          </span>
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[var(--surface-soft)] group-hover:bg-[var(--teal-soft)] hidden sm:flex items-center justify-center text-[var(--mute)] group-hover:text-[var(--teal-deep)] transition-colors">
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>

                      {/* Card Title & Desc */}
                      <div className="mt-2.5 sm:mt-3.5">
                        <h3 className="text-[13px] sm:text-[15.5px] font-bold text-[var(--ink)] group-hover:text-[var(--navy)] transition-colors leading-snug line-clamp-1 sm:line-clamp-none">
                          {tile.label}
                        </h3>
                        <p className="text-[11px] sm:text-[12px] text-[var(--ink-soft)] mt-1 sm:mt-1.5 leading-snug line-clamp-2">
                          {tile.desc}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer action indicator */}
                    <div className="mt-2.5 pt-2 sm:mt-4 sm:pt-3 border-t border-[var(--line-soft)] flex items-center justify-between text-[10.5px] sm:text-[11.5px] font-semibold text-[var(--mute)] group-hover:text-[var(--navy)] transition-colors">
                      <span className="truncate">Mở phân hệ</span>
                      <span className="font-mono text-[10px] sm:text-[11px] text-[var(--teal-deep)] font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                        ➔
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* Modal Chi tiết khi click vào KPI */}
      {modalOpen && detailTarget && (
        <ReportDetailModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setDetailTarget(null);
          }}
          target={detailTarget}
          dateFilter="all"
        />
      )}
    </>
  );
}
