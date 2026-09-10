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
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ColumnDef } from "@tanstack/react-table";
import { can } from "@/lib/permissions";
import { fmtDate } from "@/lib/csr";
import { useRealtimeEvent } from "@/lib/useRealtime";
import { useCurrentFacility } from "@/lib/useFacility";
import { DataView, DataTable, DataPagination } from "@/components/data";
import DateRangeFilter, { resolvePreset, type DateRange } from "@/components/csr/DateRangeFilter";
import ReportDetailModal, { type ReportModalTarget } from "@/components/csr/ReportDetailModal";

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
  phaco2Lan?: number;
  sessions?: SessionRow[];
}

const fN = (v: number) => (v ?? 0).toLocaleString("vi-VN");
const pctOf = (v: number, total: number) => (total > 0 ? (v / total) * 100 : 0);
const fPct = (v: number) => `${v.toFixed(1).replace(".", ",")}%`;

/* Bảng màu ngữ nghĩa — khai báo tĩnh để Tailwind quét được. */
type ToneKey = "navy" | "indigo" | "amber" | "violet" | "green" | "rose";

const TONES: Record<ToneKey, { bar: string; fg: string; dot: string }> = {
  navy: { bar: "border-l-[var(--navy)]", fg: "text-[var(--navy)]", dot: "bg-[var(--navy)]" },
  indigo: { bar: "border-l-indigo-500", fg: "text-indigo-600", dot: "bg-indigo-500" },
  amber: { bar: "border-l-amber-500", fg: "text-amber-600", dot: "bg-amber-500" },
  violet: { bar: "border-l-violet-500", fg: "text-violet-600", dot: "bg-violet-500" },
  green: { bar: "border-l-emerald-500", fg: "text-emerald-600", dot: "bg-emerald-500" },
  rose: { bar: "border-l-rose-500", fg: "text-rose-600", dot: "bg-rose-500" },
};

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: ToneKey;
  onClick: () => void;
}) {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-xl border border-[var(--line)] border-l-[3px] ${t.bar} bg-[var(--surface)] p-3.5 text-left shadow-[var(--shadow-xs)] transition-all hover:shadow-[var(--shadow-md)]`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${t.fg}`} />
        <span className="truncate text-[12.5px] font-semibold text-[var(--ink)]">{label}</span>
      </div>
      <div className="mt-2 font-mono text-[26px] font-bold leading-none tracking-tight text-[var(--ink)]">
        {fN(value)}
      </div>
      <span
        className={`mt-2 inline-flex items-center gap-1 text-[10.5px] font-medium opacity-80 transition-opacity group-hover:opacity-100 ${t.fg}`}
      >
        Xem danh sách
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

/** Ánh xạ ô số trên bảng → kiểu lọc của API `reports/detail`. */
const SESSION_KIND = {
  all: { type: "session", label: "Toàn bộ bệnh nhân của đợt khám", icon: Users },
  nhomA: { type: "session_nhomA", label: "Nhóm A · Chỉ định mổ", icon: HeartHandshake },
  nhomB: { type: "session_nhomB", label: "Nhóm B · Theo dõi", icon: PhoneCall },
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
  if (value <= 0) return <span className="font-mono text-[var(--mute-soft)]">—</span>;
  return (
    <button
      type="button"
      data-no-row-click
      title={title}
      onClick={onClick}
      className={`cursor-pointer rounded px-1 font-mono font-bold underline-offset-2 transition-colors hover:bg-[var(--surface-soft)] hover:underline ${color}`}
    >
      {fN(value)}
    </button>
  );
}

/** Ô "tỷ lệ": thanh nhỏ + phần trăm, tô màu theo mức. */
function RateCell({ value, tone }: { value: number; tone: "emerald" | "fuchsia" }) {
  const on = tone === "emerald" ? "bg-emerald-500" : "bg-fuchsia-500";
  const fg =
    value === 0
      ? "text-[var(--mute)]"
      : tone === "emerald"
        ? value >= 50
          ? "text-emerald-600"
          : "text-amber-600"
        : "text-fuchsia-600";
  const barColor = value === 0 ? "bg-transparent" : tone === "emerald" && value < 50 ? "bg-amber-500" : on;

  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-full max-w-[62px] overflow-hidden rounded-full bg-[var(--line)]">
        <span className={`block h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, value)}%` }} />
      </span>
      <span className={`shrink-0 font-mono text-[11.5px] font-bold ${fg}`}>{value}%</span>
    </div>
  );
}

function Legend({ tone, label, value, pct }: { tone: ToneKey; label: string; value: number; pct: number }) {
  const t = TONES[tone];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`h-2 w-2 shrink-0 rounded-full ${t.dot}`} />
      <span className="text-[var(--ink-soft)]">{label}:</span>
      <span className={`font-mono font-bold ${t.fg}`}>{fN(value)}</span>
      <span className="font-mono text-[var(--mute)]">({fPct(pct)})</span>
    </span>
  );
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const role = session?.user?.role || "";
  const { currentCoSo } = useCurrentFacility();

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
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--navy)] text-white shadow-[var(--navy-shadow)]">
              <LayoutDashboard className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <h1 className="font-serif text-[20px] font-bold leading-tight tracking-[-0.015em] text-[var(--ink)] sm:text-[22px]">
                Tổng quan Tầm soát
              </h1>
              <p className="mt-0.5 text-[12px] text-[var(--mute)]">
                Tình hình bệnh nhân từ tiếp nhận cộng đồng đến phẫu thuật tại viện
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <DateRangeFilter value={range} onChange={setRange} className="w-full sm:w-auto" />
            <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-[12px] font-semibold text-[var(--ink-soft)]">
              <Building2 className="h-3.5 w-3.5 text-[var(--navy)]" />
              <span className="max-w-[180px] truncate">{currentCoSo?.ten || "Toàn hệ thống"}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                loadStats();
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-[12px] font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--navy)] hover:text-[var(--navy)]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[var(--navy)]" : ""}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* ── DẢI KPI ── */}
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Tổng tiếp nhận" value={tongBN} icon={Users} tone="navy"
            onClick={() => openDetail({ type: "kpi_tong", title: "Danh sách Bệnh nhân Tiếp nhận", subtitle: "Toàn bộ hồ sơ trong kỳ đang lọc", icon: Users })} />
          <KpiCard label="Đợt khám CSR" value={soBuoi} icon={CalendarHeart} tone="indigo"
            onClick={() => openDetail({ type: "kpi_soBuoi", title: "Danh sách Đợt khám CSR", subtitle: "Các đợt khám sàng lọc cộng đồng", icon: CalendarHeart })} />
          <KpiCard label="Chỉ định mổ (A)" value={nhomA} icon={HeartHandshake} tone="amber"
            onClick={() => openDetail({ type: "kpi_nhomA", title: "Bệnh nhân Nhóm A (Chỉ định mổ)", subtitle: "Bệnh nhân có chỉ định phẫu thuật", icon: HeartHandshake })} />
          <KpiCard label="Theo dõi (B)" value={nhomB} icon={PhoneCall} tone="violet"
            onClick={() => openDetail({ type: "kpi_nhomB", title: "Bệnh nhân Nhóm B (Theo dõi)", subtitle: "Cần chăm sóc & theo dõi định kỳ", icon: PhoneCall })} />
          <KpiCard label="Đã phẫu thuật" value={daMo} icon={CheckCircle2} tone="green"
            onClick={() => openDetail({ type: "kpi_daMo", title: "Bệnh nhân Đã phẫu thuật (HIS)", subtitle: "Đã mổ mắt thành công", icon: CheckCircle2 })} />
          <KpiCard label="Chờ mổ (A)" value={chuaMo} icon={Hourglass} tone="rose"
            onClick={() => openDetail({ type: "kpi_nhomA", title: "Bệnh nhân Nhóm A (Chỉ định mổ)", subtitle: `${fN(chuaMo)}/${fN(nhomA)} ca chưa ghi nhận phẫu thuật trên HIS`, icon: Hourglass })} />
        </div>

        {/* ── TIẾN ĐỘ PHÂN LOẠI ── */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow-sm)] sm:px-5">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink)]">
              <PieChart className="h-4 w-4 text-[var(--navy)]" />
              Tiến độ phân loại &amp; điều trị
            </span>
            <span className="font-mono text-[11.5px] text-[var(--ink-soft)]">
              Đã phân loại: <b className="text-[var(--ink)]">{fPct(tyLePhanLoai)}</b> / 100%
              {chuaPhanLoai > 0 && (
                <span className="ml-2 rounded bg-rose-50 px-1.5 py-0.5 text-[11px] font-bold text-rose-600">
                  Còn {fN(chuaPhanLoai)} ca chưa phân loại
                </span>
              )}
            </span>
          </div>

          <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--line)]">
            <div className="h-full bg-emerald-500" style={{ width: `${pctOf(daMo, tongBN)}%` }} />
            <div className="h-full bg-amber-500" style={{ width: `${pctOf(chuaMo, tongBN)}%` }} />
            <div className="h-full bg-violet-500" style={{ width: `${pctOf(nhomB, tongBN)}%` }} />
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11.5px]">
            <Legend tone="green" label="Đã mổ" value={daMo} pct={pctOf(daMo, tongBN)} />
            <Legend tone="amber" label="Chờ mổ" value={chuaMo} pct={pctOf(chuaMo, tongBN)} />
            <Legend tone="violet" label="Theo dõi (B)" value={nhomB} pct={pctOf(nhomB, tongBN)} />
            <span className="sm:ml-auto">
              <Legend tone="rose" label="Chưa phân loại" value={chuaPhanLoai} pct={pctOf(chuaPhanLoai, tongBN)} />
            </span>
          </div>
        </div>

        {/* ── BẢNG ĐỢT KHÁM TRONG KỲ ── */}
        <DataView<SessionRow, unknown> columns={sessionColumns} data={sessions} pageSize={10}>
          <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line-soft)] px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <h2 className="font-serif text-[15px] font-bold leading-tight text-[var(--ink)]">
                  Đợt khám trong kỳ{" "}
                  <span className="font-sans text-[13px] font-semibold text-[var(--mute)]">({sessions.length})</span>
                </h2>
                <p className="mt-0.5 text-[11.5px] text-[var(--mute)]">
                  Số liệu tiếp nhận, phân loại và phẫu thuật theo từng địa bàn
                </p>
              </div>
              <Link
                href="/bao-cao"
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--teal)]/35 bg-[var(--teal-soft)] px-3 text-[11.5px] font-bold text-[var(--teal-deep)] transition-colors hover:bg-[var(--teal)] hover:text-white"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Báo cáo chi tiết &amp; Xuất Excel
              </Link>
            </div>

            <DataTable<SessionRow>
              dense
              emptyIcon={CalendarHeart}
              emptyTitle="Không có đợt khám nào trong kỳ"
              emptyDesc="Thử mở rộng khoảng thời gian ở bộ lọc phía trên."
            />
            <DataPagination pageSizeOptions={[10, 25, 50, 100]} />
          </div>
        </DataView>

        {/* ── PHÂN HỆ (gọn, 1 dòng mỗi mục) ── */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-[15px] font-bold text-[var(--ink)]">
              Phân hệ nghiệp vụ{" "}
              <span className="font-sans text-[13px] font-semibold text-[var(--mute)]">({navTiles.length})</span>
            </h2>
            <span className="hidden text-[11.5px] text-[var(--mute)] sm:inline">
              Truy cập trực tiếp các quy trình chính
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {navTiles.map((tile) => {
              const Icon = tile.icon;
              const t = TONES[tile.tone];
              return (
                <Link
                  key={tile.id}
                  href={tile.href}
                  className={`group flex items-center gap-3 rounded-xl border border-[var(--line)] border-l-[3px] ${t.bar} bg-[var(--surface)] px-3.5 py-3 shadow-[var(--shadow-xs)] transition-all hover:shadow-[var(--shadow-md)]`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${t.fg}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold leading-tight text-[var(--ink)] transition-colors group-hover:text-[var(--navy)]">
                      {tile.label}
                    </div>
                    <div className="truncate text-[11px] text-[var(--mute)]">{tile.desc}</div>
                  </div>
                  <ArrowRight
                    className={`h-3.5 w-3.5 shrink-0 opacity-40 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 ${t.fg}`}
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
        />
      )}
    </>
  );
}
