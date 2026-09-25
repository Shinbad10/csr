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
  Bus,
  Loader2,
  Stethoscope,
  Building2,
  LayoutDashboard,
  PieChart,
  RefreshCw,
  Hourglass,
  Eye,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ColumnDef } from "@tanstack/react-table";
import { can } from "@/lib/permissions";
import { fmtDate } from "@/lib/csr";
import { useRealtimeEvent } from "@/lib/useRealtime";
import { DataView, DataTable, DataPagination } from "@/components/data";
import DateRangeFilter, { resolvePreset, type DateRange } from "@/components/csr/DateRangeFilter";
import ReportDetailModal, { type ReportModalTarget } from "@/components/csr/ReportDetailModal";
import AnimatedNumber from "@/components/csr/AnimatedNumber";

interface SessionRow {
  id: string;
  ngayKham: string;
  xa: string;
  diaDiem: string;
  bacSi: string;
  tong: number;
  nhomA: number;
  nhomB: number;
  daMo: number;
  denKhongMo?: number;
  /** Số ca mổ Phaco 2 lần (Mắt 2) — lấy từ HIS. */
  phaco2Lan: number;
}

interface Stats {
  tong: number;
  soBuoi: number;
  byStatus: Record<string, number>;
  nhomA: number;
  nhomB: number;
  daMo: number;
  daDen?: number;
  denKhongMo?: number;
  phaco2Lan?: number;
  coSoName?: string;
  sessions?: SessionRow[];
}

const fN = (v: number) => (v ?? 0).toLocaleString("vi-VN");
const pctOf = (v: number, total: number) => (total > 0 ? (v / total) * 100 : 0);
const fPct = (v: number) => `${v.toFixed(1).replace(".", ",")}%`;

/* Bảng màu ngữ nghĩa — chuẩn Visihub Design Tokens (3px side accent bar, squircle background). */
type ToneKey = "navy" | "indigo" | "amber" | "violet" | "green" | "rose";

const TONES: Record<ToneKey, { bar: string; fg: string; dot: string; softBg: string }> = {
  navy: { bar: "border-l-[3.5px] border-l-[var(--navy)]", fg: "text-[var(--navy)]", dot: "bg-[var(--navy)]", softBg: "bg-[var(--navy-50)] text-[var(--navy)]" },
  indigo: { bar: "border-l-[3.5px] border-l-indigo-500", fg: "text-indigo-600", dot: "bg-indigo-500", softBg: "bg-indigo-50 text-indigo-600" },
  amber: { bar: "border-l-[3.5px] border-l-amber-500", fg: "text-amber-600", dot: "bg-amber-500", softBg: "bg-amber-50 text-amber-600" },
  violet: { bar: "border-l-[3.5px] border-l-violet-500", fg: "text-violet-600", dot: "bg-violet-500", softBg: "bg-violet-50 text-violet-600" },
  green: { bar: "border-l-[3.5px] border-l-emerald-500", fg: "text-emerald-600", dot: "bg-emerald-500", softBg: "bg-emerald-50 text-emerald-600" },
  rose: { bar: "border-l-[3.5px] border-l-rose-500", fg: "text-rose-600", dot: "bg-rose-500", softBg: "bg-rose-50 text-rose-600" },
};

function KpiCard({
  label,
  value,
  subtext,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  subtext?: string;
  icon: LucideIcon;
  tone: ToneKey;
  onClick: () => void;
}) {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col justify-between rounded-2xl border border-[var(--line)] ${t.bar} bg-[var(--surface)] p-3.5 sm:p-4 text-left shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:border-[var(--line-strong)] cursor-pointer overflow-hidden select-none`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] sm:text-[10.5px] font-bold tracking-[0.06em] uppercase text-[var(--mute)] truncate">
          {label}
        </span>
        <div className={`grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-xl transition-transform group-hover:scale-110 ${t.softBg} shrink-0`}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
      </div>

      <div className="my-2 sm:my-2.5 font-serif text-[24px] sm:text-[28px] font-bold leading-none tracking-tight text-[var(--ink)]">
        <AnimatedNumber value={value} />
      </div>

      <div className="flex items-center justify-between gap-1 text-[10.5px] sm:text-[11px] font-medium text-[var(--mute)] pt-2 border-t border-[var(--line-soft)]">
        <span className="truncate group-hover:text-[var(--ink-soft)] transition-colors">{subtext || "Xem danh sách"}</span>
        <ArrowRight className={`h-3 w-3 shrink-0 opacity-70 transition-all group-hover:translate-x-1 group-hover:opacity-100 ${t.fg}`} />
      </div>
    </button>
  );
}

/** Ánh xạ ô số trên bảng → kiểu lọc của API `reports/detail`. */
const SESSION_KIND = {
  all: { type: "session", label: "Toàn bộ bệnh nhân của đợt khám", icon: Users },
  nhomA: { type: "session_nhomA", label: "Nhóm A · Chỉ định mổ", icon: HeartHandshake },
  nhomB: { type: "session_nhomB", label: "Nhóm B · Theo dõi", icon: PhoneCall },
  denKhongMo: { type: "session_denKhongMo", label: "Có đến nhưng không mổ", icon: UserX },
  daMo: { type: "session_daMo", label: "Đã phẫu thuật", icon: CheckCircle2 },
  phaco2: { type: "session_phaco2", label: "Mổ Phaco 2 lần (Mắt 2)", icon: Eye },
} satisfies Record<string, { type: string; label: string; icon: LucideIcon }>;

/** Con số bấm được trong bảng — mở thẳng danh sách bệnh nhân tương ứng. */
function NumCell({
  value,
  color,
  title,
  onClick,
}: {
  value: number;
  color: string;
  title: string;
  onClick: () => void;
}) {
  if (value <= 0) return <span className="font-mono text-[var(--mute-soft)] select-none">—</span>;
  return (
    <button
      type="button"
      data-no-row-click
      title={title}
      onClick={onClick}
      className={`cursor-pointer rounded-md px-1.5 py-0.5 font-mono text-[12.5px] font-bold tabular-nums transition-all hover:bg-[var(--surface-hover)] hover:scale-105 active:scale-95 ${color}`}
    >
      {fN(value)}
    </button>
  );
}

/** Ô "tỷ lệ": thanh nhỏ gradient + phần trăm, tô màu theo mức. */
function RateCell({ value, tone }: { value: number; tone: "emerald" | "fuchsia" }) {
  const on = tone === "emerald" ? "from-emerald-500 to-teal-500" : "from-fuchsia-500 to-purple-500";
  const fg =
    value === 0
      ? "text-[var(--mute)]"
      : tone === "emerald"
        ? value >= 50
          ? "text-emerald-600"
          : "text-amber-600"
        : "text-fuchsia-600";
  const barGradient =
    value === 0
      ? "bg-transparent"
      : tone === "emerald" && value < 50
        ? "bg-gradient-to-r from-amber-500 to-amber-400"
        : `bg-gradient-to-r ${on}`;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full max-w-[60px] overflow-hidden rounded-full bg-[var(--line)]">
        <div className={`h-full rounded-full ${barGradient} transition-all duration-300`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className={`shrink-0 font-mono text-[11.5px] font-bold tabular-nums ${fg}`}>{value}%</span>
    </div>
  );
}

function Legend({
  tone,
  label,
  value,
  pct,
  onClick,
}: {
  tone: ToneKey;
  label: string;
  value: number;
  pct: number;
  onClick?: () => void;
}) {
  const t = TONES[tone];
  const Component = onClick ? "button" : "div";
  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1 transition-all ${
        onClick ? "cursor-pointer hover:bg-[var(--surface-hover)] active:scale-95 select-none" : ""
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${t.dot}`} />
      <span className="text-[12px] font-medium text-[var(--ink-soft)]">{label}:</span>
      <span className={`font-mono text-[12px] font-bold tabular-nums ${t.fg}`}><AnimatedNumber value={value} /></span>
      <span className="font-mono text-[11px] text-[var(--mute)] tabular-nums">(<AnimatedNumber value={pct} decimals={1} suffix="%" />)</span>
    </Component>
  );
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const role = session?.user?.role || "";

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mặc định lọc theo Tháng này — đổi nhanh sang Ngày / Tuần / Quý / Năm ở bộ lọc.
  const [range, setRange] = useState<DateRange>(() => resolvePreset("thisMonth"));

  const [detailTarget, setDetailTarget] = useState<ReportModalTarget | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openDetail = (target: ReportModalTarget) => {
    setDetailTarget(target);
    setModalOpen(true);
  };

  /** Bấm vào con số trên bảng → mở danh sách BN của đúng đợt khám + đúng phân loại. */
  const openSessionDetail = (s: SessionRow, kind: keyof typeof SESSION_KIND) => {
    const k = SESSION_KIND[kind];
    openDetail({
      type: k.type,
      val: s.id,
      title: k.label,
      subtitle: `${s.xa || s.diaDiem || "Đợt khám"} · ${fmtDate(s.ngayKham)}${s.bacSi ? ` · BS. ${s.bacSi}` : ""}`,
      icon: k.icon,
    });
  };

  const loadStats = useCallback(() => {
    const sp = new URLSearchParams();
    if (range.from) sp.set("from", range.from);
    if (range.to) sp.set("to", range.to);
    const qs = sp.toString();

    fetch(`/api/csr/reports${qs ? `?${qs}` : ""}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setStats(d);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [range.from, range.to]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useRealtimeEvent(["buoikham_change", "hoso_change", "stats_change"], () => {
    loadStats();
  }, [loadStats]);

  const ready = status !== "loading" && !loading;

  const tongBN = stats?.tong ?? 0;
  const nhomA = stats?.nhomA ?? 0;
  const nhomB = stats?.nhomB ?? 0;
  const daMo = stats?.daMo ?? 0;
  const soBuoi = stats?.soBuoi ?? 0;
  const sessions = useMemo(() => stats?.sessions ?? [], [stats]);

  const chuaMo = Math.max(0, nhomA - daMo);
  const chuaPhanLoai = Math.max(0, tongBN - nhomA - nhomB);
  const tyLePhanLoai = pctOf(nhomA + nhomB, tongBN);

  const navTiles = useMemo(() => {
    const all = [
      { id: "buoi-kham", label: "Đợt khám tầm soát", desc: "Lập lịch & tiếp nhận cộng đồng", href: "/buoi-kham", icon: CalendarHeart, cap: "buoikham.view" as const, tone: "navy" as ToneKey },
      { id: "tu-van", label: "Tư vấn điều trị", desc: "Phân loại A/B & đặt hẹn mổ", href: "/tu-van", icon: Stethoscope, cap: "hoso.clinical" as const, tone: "green" as ToneKey },
      { id: "theo-doi", label: "Theo dõi & Chăm sóc", desc: "Gọi nhắc lịch, cập nhật ca mổ", href: "/theo-doi", icon: PhoneCall, cap: "hoso.followup" as const, tone: "amber" as ToneKey },
      { id: "ho-so", label: "Hồ sơ bệnh nhân", desc: "Tra cứu theo tên, SĐT, CCCD", href: "/ho-so", icon: ClipboardList, cap: undefined, tone: "indigo" as ToneKey },
      { id: "bao-cao", label: "Báo cáo & Thống kê", desc: "Biểu đồ chuyên sâu & xuất Excel", href: "/bao-cao", icon: BarChart3, cap: "report.export" as const, tone: "violet" as ToneKey },
      { id: "doan-xe", label: "Đoàn xe đón", desc: "Lộ trình, điểm đón & giờ đón", href: "/doan-xe", icon: Bus, cap: "hoso.followup" as const, tone: "rose" as ToneKey },
      { id: "quan-tri", label: "Quản trị hệ thống", desc: "Đơn vị, phân quyền, HIS/BHYT", href: "/quan-tri", icon: Building2, cap: "admin.users" as const, tone: "navy" as ToneKey },
    ];
    return all.filter((t) => !t.cap || can(role, t.cap));
  }, [role]);

  const sessionColumns = useMemo<ColumnDef<SessionRow>[]>(
    () => [
      {
        id: "ngayKham",
        header: "Ngày khám",
        size: 118,
        accessorFn: (r) => (r.ngayKham ? new Date(r.ngayKham).getTime() : 0),
        cell: ({ row }) => (
          <span className="font-mono font-bold text-[var(--ink)]">{fmtDate(row.original.ngayKham)}</span>
        ),
      },
      {
        id: "xa",
        accessorKey: "xa",
        header: "Địa bàn / Xã",
        size: 160,
        cell: ({ row }) => (
          <span className="font-semibold text-[var(--ink)]" title={row.original.xa}>
            {row.original.xa || "—"}
          </span>
        ),
      },
      {
        id: "diaDiem",
        accessorKey: "diaDiem",
        header: "Điểm khám",
        size: 220,
        meta: { flex: true },
        cell: ({ row }) => <span title={row.original.diaDiem}>{row.original.diaDiem || "—"}</span>,
      },
      {
        id: "bacSi",
        accessorKey: "bacSi",
        header: "Bác sĩ",
        size: 150,
        cell: ({ row }) => <span title={row.original.bacSi}>{row.original.bacSi || "—"}</span>,
      },
      {
        id: "tong",
        accessorKey: "tong",
        header: "SL BN",
        size: 88,
        meta: { align: "right" },
        cell: ({ row }) => (
          <NumCell
            value={row.original.tong}
            color="text-[var(--navy)]"
            title="Xem toàn bộ bệnh nhân của đợt khám này"
            onClick={() => openSessionDetail(row.original, "all")}
          />
        ),
      },
      {
        id: "nhomA",
        accessorKey: "nhomA",
        header: "Nhóm A",
        size: 88,
        meta: { align: "right" },
        cell: ({ row }) => (
          <NumCell
            value={row.original.nhomA}
            color="text-amber-600"
            title="Xem bệnh nhân Nhóm A (chỉ định mổ) của đợt khám này"
            onClick={() => openSessionDetail(row.original, "nhomA")}
          />
        ),
      },
      {
        id: "nhomB",
        accessorKey: "nhomB",
        header: "Nhóm B",
        size: 88,
        meta: { align: "right" },
        cell: ({ row }) => (
          <NumCell
            value={row.original.nhomB}
            color="text-violet-600"
            title="Xem bệnh nhân Nhóm B (theo dõi) của đợt khám này"
            onClick={() => openSessionDetail(row.original, "nhomB")}
          />
        ),
      },
      {
        id: "denKhongMo",
        accessorKey: "denKhongMo",
        header: "Đến chưa mổ",
        size: 96,
        meta: { align: "right" },
        cell: ({ row }) => (
          <NumCell
            value={row.original.denKhongMo ?? 0}
            color="text-amber-600"
            title="Xem bệnh nhân có đến viện nhưng chưa/không mổ của đợt này"
            onClick={() => openSessionDetail(row.original, "denKhongMo")}
          />
        ),
      },
      {
        id: "daMo",
        accessorKey: "daMo",
        header: "Đã mổ",
        size: 84,
        meta: { align: "right" },
        cell: ({ row }) => (
          <NumCell
            value={row.original.daMo}
            color="text-emerald-600"
            title="Xem bệnh nhân đã phẫu thuật của đợt khám này"
            onClick={() => openSessionDetail(row.original, "daMo")}
          />
        ),
      },
      {
        id: "tyLeMo",
        header: "Tỷ lệ mổ",
        size: 128,
        accessorFn: (r) => (r.nhomA > 0 ? Math.round((r.daMo / r.nhomA) * 100) : 0),
        cell: ({ getValue }) => <RateCell value={Number(getValue()) || 0} tone="emerald" />,
      },
      {
        id: "phaco2Lan",
        accessorKey: "phaco2Lan",
        header: "Mắt 2",
        size: 84,
        meta: { align: "right" },
        cell: ({ row }) => (
          <NumCell
            value={row.original.phaco2Lan}
            color="text-fuchsia-600"
            title="Xem bệnh nhân mổ Phaco 2 lần (mắt thứ hai) của đợt khám này"
            onClick={() => openSessionDetail(row.original, "phaco2")}
          />
        ),
      },
      {
        id: "tyLeMat2",
        header: "Tỷ lệ mắt 2",
        size: 128,
        // Tỷ lệ trên số ca ĐÃ MỔ — bao nhiêu % ca mổ là mổ mắt thứ hai.
        accessorFn: (r) => (r.daMo > 0 ? Math.round((r.phaco2Lan / r.daMo) * 100) : 0),
        cell: ({ getValue }) => <RateCell value={Number(getValue()) || 0} tone="fuchsia" />,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-36">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--navy)]" />
        <span className="text-[11px] font-semibold text-[var(--mute)]">Đang nạp dữ liệu tổng quan…</span>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 pb-10"
      >
        {/* ── TIÊU ĐỀ + BỘ LỌC ── */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3.5">
            <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-[var(--teal)] shadow-[var(--navy-shadow)]">
              <LayoutDashboard className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-bold tracking-[0.14em] text-[var(--teal-deep)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] animate-pulse" />
                  Báo cáo thống kê CSR · Thời gian thực
                </span>
              </div>
              <h1 className="font-serif text-[22px] sm:text-[25px] font-bold leading-tight tracking-[-0.02em] text-[var(--ink)]">
                Tổng quan <em className="italic font-normal text-[var(--navy)]">Tầm soát</em>
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[var(--mute)]">
                Tình hình bệnh nhân từ tiếp nhận cộng đồng đến phẫu thuật tại viện
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <DateRangeFilter value={range} onChange={setRange} className="w-full sm:w-auto" />
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                loadStats();
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-[12px] font-bold text-[var(--ink-soft)] shadow-xs transition-all hover:bg-[var(--surface-soft)] hover:border-[var(--line-strong)] hover:text-[var(--navy)] active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[var(--navy)]" : "text-[var(--mute)]"}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* ── DẢI KPI ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Tổng tiếp nhận"
            value={tongBN}
            subtext="Toàn bộ hồ sơ trong kỳ"
            icon={Users}
            tone="navy"
            onClick={() => openDetail({ type: "kpi_tong", title: "Danh sách Bệnh nhân Tiếp nhận", subtitle: "Toàn bộ hồ sơ trong kỳ đang lọc", icon: Users })}
          />
          <KpiCard
            label="Đợt khám CSR"
            value={soBuoi}
            subtext="Các đợt khám cộng đồng"
            icon={CalendarHeart}
            tone="indigo"
            onClick={() => openDetail({ type: "kpi_soBuoi", title: "Danh sách Đợt khám CSR", subtitle: "Các đợt khám sàng lọc cộng đồng", icon: CalendarHeart })}
          />
          <KpiCard
            label="Chỉ định mổ (A)"
            value={nhomA}
            subtext="Bệnh nhân chỉ định mổ"
            icon={HeartHandshake}
            tone="amber"
            onClick={() => openDetail({ type: "kpi_nhomA", title: "Bệnh nhân Nhóm A (Chỉ định mổ)", subtitle: "Bệnh nhân có chỉ định phẫu thuật", icon: HeartHandshake })}
          />
          <KpiCard
            label="Theo dõi (B)"
            value={nhomB}
            subtext="Cần theo dõi định kỳ"
            icon={PhoneCall}
            tone="violet"
            onClick={() => openDetail({ type: "kpi_nhomB", title: "Bệnh nhân Nhóm B (Theo dõi)", subtitle: "Cần chăm sóc & theo dõi định kỳ", icon: PhoneCall })}
          />
          <KpiCard
            label="Đã phẫu thuật"
            value={daMo}
            subtext="Đã mổ thành công (HIS)"
            icon={CheckCircle2}
            tone="green"
            onClick={() => openDetail({ type: "kpi_daMo", title: "Bệnh nhân Đã phẫu thuật (HIS)", subtitle: "Đã mổ mắt thành công", icon: CheckCircle2 })}
          />
          <KpiCard
            label="Chờ mổ (A)"
            value={chuaMo}
            subtext={`${fN(chuaMo)}/${fN(nhomA)} ca chưa mổ`}
            icon={Hourglass}
            tone="rose"
            onClick={() => openDetail({ type: "kpi_nhomA", title: "Bệnh nhân Nhóm A (Chỉ định mổ)", subtitle: `${fN(chuaMo)}/${fN(nhomA)} ca chưa ghi nhận phẫu thuật trên HIS`, icon: Hourglass })}
          />
        </div>

        {/* ── TIẾN ĐỘ PHÂN LOẠI ── */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-[var(--shadow-xs)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[var(--navy-50)] to-[var(--teal-soft)] text-[var(--navy)]">
                <PieChart className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-serif text-[15px] font-bold leading-tight text-[var(--ink)]">
                  Tiến độ phân loại &amp; điều trị
                </h2>
                <p className="text-[11px] text-[var(--mute)]">
                  Tỷ lệ chuyển đổi từ tiếp nhận sang chỉ định &amp; phẫu thuật
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1 font-mono text-[11.5px] text-[var(--ink-soft)] shadow-xs">
                <span className="font-sans font-medium text-[var(--mute)]">Đã phân loại:</span>
                <span className="font-bold text-[var(--ink)] tabular-nums">{fPct(tyLePhanLoai)}</span>
                <span className="text-[var(--mute-soft)]">/ 100%</span>
              </div>

              {chuaPhanLoai > 0 && (
                <span className="inline-flex items-center gap-1 rounded-xl border border-rose-200/70 bg-rose-50 px-2.5 py-1 font-mono text-[11px] font-bold text-rose-700 shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Còn {fN(chuaPhanLoai)} ca chưa phân loại
                </span>
              )}

              {Number(stats?.denKhongMo) > 0 && (
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
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 font-mono text-[11px] font-bold text-amber-800 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Xem danh sách bệnh nhân có đến nhưng không mổ"
                >
                  <UserX className="w-3.5 h-3.5 text-amber-600" />
                  <span>Đến chưa mổ:</span>
                  <span className="font-bold underline decoration-amber-400">{fN(Number(stats?.denKhongMo))}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--line-soft)] p-0.5 ring-1 ring-[var(--line)]">
            <div
              className="h-full rounded-l-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${pctOf(daMo, tongBN)}%` }}
              title={`Đã mổ: ${fN(daMo)} ca (${fPct(pctOf(daMo, tongBN))})`}
            />
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
              style={{ width: `${pctOf(chuaMo, tongBN)}%` }}
              title={`Chờ mổ: ${fN(chuaMo)} ca (${fPct(pctOf(chuaMo, tongBN))})`}
            />
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
              style={{ width: `${pctOf(nhomB, tongBN)}%` }}
              title={`Theo dõi (B): ${fN(nhomB)} ca (${fPct(pctOf(nhomB, tongBN))})`}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] border-t border-[var(--line-soft)] pt-2.5">
            <Legend
              tone="green"
              label="Đã mổ"
              value={daMo}
              pct={pctOf(daMo, tongBN)}
              onClick={() => openDetail({ type: "kpi_daMo", title: "Bệnh nhân Đã phẫu thuật (HIS)", subtitle: "Đã mổ mắt thành công", icon: CheckCircle2 })}
            />
            <Legend
              tone="amber"
              label="Chờ mổ"
              value={chuaMo}
              pct={pctOf(chuaMo, tongBN)}
              onClick={() => openDetail({ type: "kpi_nhomA", title: "Bệnh nhân Nhóm A (Chỉ định mổ)", subtitle: `${fN(chuaMo)}/${fN(nhomA)} ca chưa ghi nhận phẫu thuật trên HIS`, icon: Hourglass })}
            />
            <Legend
              tone="violet"
              label="Theo dõi (B)"
              value={nhomB}
              pct={pctOf(nhomB, tongBN)}
              onClick={() => openDetail({ type: "kpi_nhomB", title: "Bệnh nhân Nhóm B (Theo dõi)", subtitle: "Cần chăm sóc & theo dõi định kỳ", icon: PhoneCall })}
            />
            <div className="sm:ml-auto">
              <Legend
                tone="rose"
                label="Chưa phân loại"
                value={chuaPhanLoai}
                pct={pctOf(chuaPhanLoai, tongBN)}
              />
            </div>
          </div>
        </div>

        {/* ── BẢNG ĐỢT KHÁM TRONG KỲ ── */}
        <DataView<SessionRow, unknown> columns={sessionColumns} data={sessions} pageSize={10}>
          <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-[16px] font-bold leading-tight text-[var(--ink)]">
                    Đợt khám trong kỳ
                  </h2>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)] tabular-nums">
                    {sessions.length}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-[var(--mute)]">
                  Số liệu tiếp nhận, phân loại và phẫu thuật theo từng địa bàn
                </p>
              </div>
              <Link
                href="/bao-cao"
                className="inline-flex h-8.5 shrink-0 items-center gap-2 rounded-xl bg-[var(--teal)] px-3.5 text-[12px] font-bold text-[var(--navy-ink)] shadow-xs transition-all hover:bg-[var(--teal-deep)] hover:text-white hover:shadow-sm active:scale-95"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Báo cáo chi tiết &amp; Xuất Excel</span>
              </Link>
            </div>

            <DataTable<SessionRow>
              dense
              headerVariant="subtle"
              emptyIcon={CalendarHeart}
              emptyTitle="Không có đợt khám nào trong kỳ"
              emptyDesc="Thử mở rộng khoảng thời gian ở bộ lọc phía trên."
            />
            <DataPagination pageSizeOptions={[10, 25, 50, 100]} />
          </div>
        </DataView>

        {/* ── PHÂN HỆ NGHIỆP VỤ ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-[16px] font-bold text-[var(--ink)]">
                Phân hệ nghiệp vụ
              </h2>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface-soft)] text-[var(--mute)] border border-[var(--line)] tabular-nums">
                {navTiles.length}
              </span>
            </div>
            <span className="hidden text-[11.5px] text-[var(--mute)] sm:inline font-mono">
              § TRUY CẬP TRỰC TIẾP CÁC QUY TRÌNH CHÍNH
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {navTiles.map((tile) => {
              const Icon = tile.icon;
              const t = TONES[tile.tone];
              return (
                <Link
                  key={tile.id}
                  href={tile.href}
                  className={`group relative flex items-center gap-3.5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3.5 shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:border-[var(--line-strong)] overflow-hidden`}
                >
                  <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${t.dot}`} />

                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-110 ${t.softBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold leading-snug text-[var(--ink)] transition-colors group-hover:text-[var(--navy)]">
                      {tile.label}
                    </div>
                    <div className="truncate text-[11px] text-[var(--mute)] mt-0.5">
                      {tile.desc}
                    </div>
                  </div>

                  <ArrowRight
                    className={`h-4 w-4 shrink-0 text-[var(--mute-soft)] opacity-60 transition-all group-hover:translate-x-1 group-hover:opacity-100 ${t.fg}`}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </motion.div>

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
        />
      )}
    </>
  );
}
