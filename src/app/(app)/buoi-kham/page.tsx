"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import {
  Plus, Search, Calendar, CalendarDays, MapPin, Loader2, Check, X,
  Stethoscope, Pencil, FolderOpen, Lock, FileSpreadsheet, UserCheck,
  RotateCcw, ChevronDown, Eye, CheckCheck, AlertTriangle, MoreVertical,
  ClipboardList, Clock, RefreshCw, History, Download, Layers
} from "lucide-react";
import { can } from "@/lib/permissions";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fmtDate, fmtBuoiKhamName, fmtBuoiKhamCode, phaseOf } from "@/lib/csr";
import { Field, DateField } from "@/components/csr/fields";
import { DoctorMultiSelect, parseDoctorList, formatDoctorList } from "@/components/csr/DoctorAutocomplete";
import BuoiKhamPatientsModal from "@/components/csr/BuoiKhamPatientsModal";
import { SkeletonTable } from "@/components/layout/Skeleton";
import { useToast } from "@/components/providers/ToastProvider";
import { useRealtimeEvent } from "@/lib/useRealtime";
import { DataView, DataToolbar, DataTable, DataPagination, ToolbarSelect, useDataContext } from "@/components/data";
import {
  useHisReconcile,
  HisReconcilePanel,
  DoiChieuCell,
  DoiChieuHistoryModal,
  fmtRelative,
  type DoiChieuLog,
} from "@/components/csr/HisReconcile";
import type { ColumnDef } from "@tanstack/react-table";

interface CoSo { id: string; ten: string }
interface BuoiKham {
  id: string; coSo: CoSo; coSoId: string; ngayKham: string; xa: string; diaDiem: string;
  bacSiKham?: string | null; ghiChu?: string | null; _count: { hoSo: number };
  stats?: { nhomA: number; nhomB: number; daMo: number; daMoTruoc?: number; chuaMo: number; phaco2Lan?: number };
  /** Lần đối chiếu HIS gần nhất (từ AuditLog) */
  lastDoiChieu?: DoiChieuLog | null;
}

type StatusFilter = "ALL" | "DangDienRa" | "SapDienRa" | "DaKetThuc";
type GroupFilter = "ALL" | "HAS_A" | "HAS_B" | "HAS_UNOPERATED" | "HAS_PHACO_2_LAN";

interface Option<T = string> {
  value: T;
  label: string;
}

/* ── Nút & menu dùng chung (chuẩn UI công ty: token màu, bo 10px, font mono cho số) ── */
const BTN_SECONDARY =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface)] text-[12px] font-semibold text-[var(--ink-soft)] hover:text-[var(--navy)] hover:border-[var(--navy)]/40 hover:bg-[var(--navy-50)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
/** Xuất dữ liệu — tông teal (thành công / dữ liệu sạch) */
const BTN_TEAL_SOFT =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] border border-[var(--teal)]/30 bg-[var(--teal-soft)] text-[12px] font-semibold text-[var(--teal-deep)] hover:bg-[var(--teal)] hover:border-[var(--teal)] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
/** Đồng bộ / đối chiếu hệ thống — tông navy nhạt */
const BTN_NAVY_SOFT =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] border border-[var(--navy)]/20 bg-[var(--navy-50)] text-[12px] font-semibold text-[var(--navy)] hover:bg-[var(--navy)] hover:border-[var(--navy)] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
const BTN_PRIMARY =
  "btn-primary inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] text-[12px] font-semibold whitespace-nowrap";

/** Nút vào đợt khám theo pha ngày khám. */
function JoinAction({
  b,
  block,
  canClinical,
  canViewTamSoat,
  onViewPatients,
}: {
  b: BuoiKham;
  block?: boolean;
  canClinical?: boolean;
  canViewTamSoat?: boolean;
  onViewPatients?: (b: BuoiKham) => void;
}) {
  const p = phaseOf(b.ngayKham);
  const w = block ? "flex-1 justify-center" : "";

  // Vai trò hành chính / quản lý không khám lâm sàng (như HCNS): ưu tiên xem DS tầm soát
  if (!canClinical && canViewTamSoat) {
    return (
      <button type="button" onClick={() => onViewPatients?.(b)} className={`${BTN_SECONDARY} ${w}`} title="Xem danh sách bệnh nhân tầm soát của đợt khám">
        <ClipboardList className="w-3.5 h-3.5 text-[var(--navy)]" />
        DS tầm soát
      </button>
    );
  }

  if (p.key === "DaKetThuc") {
    return (
      <Link href={`/kham/${b.id}`} className={`${BTN_SECONDARY} ${w}`}>
        <Eye className="w-3.5 h-3.5 text-[var(--navy)]" />
        Xem hồ sơ
      </Link>
    );
  }
  if (p.key === "SapDienRa") {
    return (
      <span title={p.hint} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-soft)] text-[12px] font-semibold text-[var(--mute)] cursor-not-allowed whitespace-nowrap ${w}`}>
        <Clock className="w-3.5 h-3.5" />
        Chưa tới ngày
      </span>
    );
  }
  return (
    <Link href={`/kham/${b.id}`} className={`${BTN_PRIMARY} ${w}`}>
      <Stethoscope className="w-3.5 h-3.5 text-[var(--teal)]" />
      Tham gia khám
    </Link>
  );
}

function MenuItem({
  icon: Icon,
  label,
  hint,
  tone = "default",
  disabled,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  hint?: string;
  tone?: "default" | "navy" | "teal" | "amber";
  disabled?: boolean;
  onClick: () => void;
}) {
  const iconCls = {
    default: "text-[var(--mute)]",
    navy: "text-[var(--navy)]",
    teal: "text-[var(--teal-deep)]",
    amber: "text-[var(--amber)]",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-[8px] text-left hover:bg-[var(--navy-50)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon className={`w-4 h-4 mt-px shrink-0 ${iconCls}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-[12.5px] font-semibold leading-tight ${tone === "amber" ? "text-[var(--amber-deep)]" : "text-[var(--ink)]"}`}>{label}</div>
        {hint && <div className="text-[10.5px] text-[var(--mute)] mt-0.5 truncate">{hint}</div>}
      </div>
    </button>
  );
}

function MenuGroup({ label }: { label: string }) {
  return <div className="px-2.5 pt-2 pb-1 text-[9.5px] font-mono font-bold uppercase tracking-[0.14em] text-[var(--mute-soft)]">{label}</div>;
}

/** Cụm thao tác của một đợt khám: menu ⋮ + nút chính theo pha. */
function BuoiKhamRowActions({
  b,
  canManage,
  canViewTamSoat,
  canClinical,
  canReconcile,
  reconciling,
  exportingId,
  onExport,
  onEdit,
  onComplete,
  onViewPatients,
  onReconcile,
  onHistory,
}: {
  b: BuoiKham;
  canManage: boolean;
  canViewTamSoat?: boolean;
  canClinical?: boolean;
  canReconcile?: boolean;
  reconciling?: boolean;
  exportingId: string | null;
  onExport: (b: BuoiKham, format?: "khamSucKhoe" | "default") => void;
  onEdit: (b: BuoiKham) => void;
  onComplete: (b: BuoiKham) => void;
  onViewPatients?: (b: BuoiKham) => void;
  onReconcile?: (b: BuoiKham) => void;
  onHistory?: (b: BuoiKham) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const isEnded = phaseOf(b.ngayKham).key === "DaKetThuc";
  const soCa = (b.stats?.nhomA ?? 0) + (b.stats?.nhomB ?? 0);
  const busy = exportingId === b.id || reconciling;

  const MENU_W = 264;
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuHeight = 380;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight && rect.top > spaceBelow;
    let left = rect.right - MENU_W;
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_W - 8));
    setCoords(openUp ? { bottom: Math.round(window.innerHeight - rect.top + 4), left: Math.round(left) } : { top: Math.round(rect.bottom + 4), left: Math.round(left) });
  }, []);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!menuOpen) {
      updatePosition();
      setMenuOpen(true);
    } else setMenuOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) return;
    updatePosition();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t) && buttonRef.current && !buttonRef.current.contains(t)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const onScroll = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [menuOpen, updatePosition]);

  const pick = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <JoinAction b={b} canClinical={canClinical} canViewTamSoat={canViewTamSoat} onViewPatients={onViewPatients} />
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className={`w-8 h-8 rounded-[10px] border flex items-center justify-center transition-colors cursor-pointer ${
          menuOpen
            ? "bg-[var(--navy)] text-white border-[var(--navy)]"
            : "bg-[var(--surface)] border-[var(--line-strong)] text-[var(--mute)] hover:text-[var(--navy)] hover:border-[var(--navy)]/40"
        }`}
        title="Thao tác khác"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--teal)]" /> : <MoreVertical className="w-4 h-4" />}
      </button>

      {menuOpen && coords && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: coords.top,
              bottom: coords.bottom,
              left: coords.left,
              width: MENU_W,
              maxHeight: "min(420px, calc(100vh - 32px))",
              zIndex: 99999,
            }}
            className="overflow-y-auto bg-[var(--surface)] border border-[var(--line-strong)] rounded-[12px] shadow-[var(--shadow-lg)] p-1 animate-dropdown"
            onClick={(e) => e.stopPropagation()}
          >
            {canViewTamSoat && onViewPatients && (
              <MenuItem icon={ClipboardList} tone="navy" label="Xem danh sách tầm soát" hint={`${b._count?.hoSo ?? 0} bệnh nhân & kết quả khám`} onClick={pick(() => onViewPatients(b))} />
            )}

            {(canReconcile || onHistory) && (
              <>
                <MenuGroup label="Đối chiếu HIS" />
                {canReconcile && onReconcile && (
                  <MenuItem
                    icon={RefreshCw}
                    tone="teal"
                    label={reconciling ? "Đang đối chiếu HIS…" : "Đối chiếu HIS đợt này"}
                    hint={soCa > 0 ? `Tra ${soCa} ca Nhóm A + B trên HIS` : "Không có BN Nhóm A/B"}
                    disabled={reconciling || soCa === 0}
                    onClick={pick(() => onReconcile(b))}
                  />
                )}
                {onHistory && (
                  <MenuItem
                    icon={History}
                    label="Lịch sử đối chiếu"
                    hint={b.lastDoiChieu ? `Gần nhất ${fmtRelative(b.lastDoiChieu.thoiDiem)}` : "Chưa đối chiếu lần nào"}
                    onClick={pick(() => onHistory(b))}
                  />
                )}
              </>
            )}

            <MenuGroup label="Xuất dữ liệu" />
            <MenuItem icon={FileSpreadsheet} tone="teal" label="Excel khám sức khỏe" hint="Mẫu 101 cột nộp HIS / cơ quan" disabled={exportingId === b.id} onClick={pick(() => onExport(b, "khamSucKhoe"))} />
            <MenuItem icon={FileSpreadsheet} label="Excel Google Sheet" hint="Mẫu 25 cột danh sách sàng lọc" disabled={exportingId === b.id} onClick={pick(() => onExport(b, "default"))} />

            {canManage && (
              <>
                <div className="my-1 border-t border-[var(--line-soft)]" />
                {!isEnded && <MenuItem icon={CheckCheck} tone="amber" label="Kết thúc đợt khám" onClick={pick(() => onComplete(b))} />}
                <MenuItem icon={Pencil} label="Chỉnh sửa đợt khám" onClick={pick(() => onEdit(b))} />
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

/** A/B liền khối */
function NhomChip({ a, b }: { a: number; b: number }) {
  return (
    <div className="inline-flex rounded-[6px] overflow-hidden border border-[var(--line)] font-mono text-[11px] font-bold tabular-nums">
      <span className={`px-2 py-0.5 border-r border-[var(--line)] ${a ? "bg-[var(--rose-soft)] text-[var(--rose)]" : "text-[var(--mute-soft)]"}`} title="Nhóm A — đã chỉ định mổ">
        A {a}
      </span>
      <span className={`px-2 py-0.5 ${b ? "bg-[var(--amber-soft)] text-[var(--amber-deep)]" : "text-[var(--mute-soft)]"}`} title="Nhóm B — theo dõi / chưa chốt">
        B {b}
      </span>
    </div>
  );
}

/** Tiến độ mổ "đã mổ / cần mổ" kèm thanh & ca mổ trước nếu có */
function MoProgress({ done, waiting, daMoTruoc }: { done: number; waiting: number; daMoTruoc?: number }) {
  const need = done + waiting;
  if (need === 0 && !daMoTruoc) return <span className="text-[var(--mute-soft)] font-mono text-xs">—</span>;
  const pct = need > 0 ? Math.round((done / need) * 100) : 0;
  return (
    <div
      className="w-full max-w-[124px]"
      title={`Đã mổ CSR: ${done}/${need} ca chỉ định (${pct}%)${daMoTruoc ? ` • ${daMoTruoc} ca đã mổ trước ngày khám` : ""}`}
    >
      <div className="flex items-baseline justify-between gap-1 font-mono text-[11.5px] tabular-nums whitespace-nowrap">
        <span>
          <b className={done ? "text-[var(--teal-deep)]" : "text-[var(--ink)]"}>{done}</b>
          <span className="text-[var(--mute)]">/{need}</span>
          {Boolean(daMoTruoc) && <span className="ml-1 text-[10px] font-semibold text-[#7c3aed]">+{daMoTruoc} trước</span>}
        </span>
        <span className="text-[10px] text-[var(--mute)]">{pct}%</span>
      </div>
      <div className="mt-1 h-1 rounded-full bg-[var(--line)] overflow-hidden">
        <div className="h-full rounded-full bg-[var(--teal)] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Số ca mổ mắt 2 (Phaco 2 lần) */
function Mat2Badge({ count, onClick }: { count: number; onClick?: () => void }) {
  if (count <= 0) return <span className="text-[var(--mute-soft)] font-mono text-xs">—</span>;
  return (
    <button
      type="button"
      data-no-row-click
      onClick={onClick}
      className="inline-flex items-center gap-1 font-mono font-bold text-[11px] tabular-nums bg-[#f3eaf8] text-[#7c3aed] px-2 py-0.5 rounded-[6px] hover:bg-[#7c3aed] hover:text-white transition-colors cursor-pointer"
      title={`${count} bệnh nhân mổ Phaco 2 lần (mắt 2). Bấm để xem danh sách.`}
    >
      <Eye className="w-3 h-3" />
      {count}
    </button>
  );
}

/** Badge trạng thái đợt: đang diễn ra = teal (sống), sắp tới = amber, đã xong = xám. */
function PhaseBadge({ ngayKham }: { ngayKham: string }) {
  const p = phaseOf(ngayKham);
  const cls =
    p.key === "DangDienRa"
      ? "bg-[var(--teal-soft)] text-[var(--teal-deep)]"
      : p.key === "SapDienRa"
      ? "bg-[var(--amber-soft)] text-[var(--amber-deep)]"
      : "bg-[var(--line-soft)] text-[var(--mute)]";
  return (
    <span title={p.hint} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11.5px] font-semibold whitespace-nowrap ${cls}`}>
      <span className={`w-[5px] h-[5px] rounded-full bg-current ${p.key === "DangDienRa" ? "animate-pulse" : ""}`} />
      {p.label}
    </span>
  );
}

/** "An Định" → "Xã An Định"; giữ nguyên nếu dữ liệu đã có tiền tố xã / phường / thị trấn. */
function xaLabel(xa?: string | null): string {
  const v = (xa || "").trim();
  if (!v) return "";
  return /^(xã|phường|thị trấn|tt\.?)\s/i.test(v) ? v.charAt(0).toUpperCase() + v.slice(1) : `Xã ${v}`;
}

/** Trao các dòng của trang hiện tại (đã qua tìm kiếm / lọc / sắp xếp) cho render-prop — dùng cho thẻ mobile. */
function PageRows<T>({ children }: { children: (rows: T[]) => React.ReactNode }) {
  const { table } = useDataContext<T>();
  return <>{children(table.getRowModel().rows.map((r) => r.original))}</>;
}

/** Nút đối chiếu HIS hàng loạt — lấy đúng các đợt đang hiển thị (mọi trang, sau tìm kiếm & bộ lọc). */
function ReconcileAllButton({
  his,
  toTarget,
  compact,
}: {
  his: ReturnType<typeof useHisReconcile>;
  compact?: boolean;
  toTarget: (b: BuoiKham) => { id: string; name: string; soCa: number };
}) {
  const { table } = useDataContext<BuoiKham>();
  const visible = table.getPrePaginationRowModel().rows.map((r) => r.original);
  const eligible = visible.filter((b) => (b.stats?.nhomA ?? 0) + (b.stats?.nhomB ?? 0) > 0).length;
  return (
    <button
      type="button"
      onClick={() => his.runBulk(visible.map(toTarget))}
      disabled={his.bulkActive || eligible === 0}
      className={cn("group", BTN_NAVY_SOFT, compact && "h-9 px-2.5 rounded-xl")}
      title={eligible === 0 ? "Không có đợt nào đang hiển thị có BN Nhóm A/B" : `Đối chiếu HIS cho ${eligible} đợt đang hiển thị (chạy nền, song song)`}
    >
      {his.bulkActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
      {his.bulkActive && his.progress ? (
        <span className="font-mono tabular-nums">Đang đối chiếu {his.progress.finished}/{his.progress.total}</span>
      ) : (
        <>
          {compact ? "HIS" : "Đối chiếu HIS"}
          <span className="font-mono text-[10.5px] font-bold px-1.5 rounded-[5px] bg-[var(--navy)] text-white group-hover:bg-white group-hover:text-[var(--navy)] tabular-nums transition-colors">{eligible}</span>
        </>
      )}
    </button>
  );
}

function cleanDoctorName(doc: string): string {
  const d = doc.trim();
  if (d.startsWith("BS.") || d.startsWith("BS:")) return d.replace(/^BS[:.]\s*/i, "BS. ");
  if (d.startsWith("BS")) return d.replace(/^BS\s*/i, "BS. ");
  return `BS. ${d}`;
}

function readCosoCookie(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.split("; ").find((r) => r.startsWith("selected_coso_id="));
  return m ? m.split("=")[1] : "";
}

export default function BuoiKhamPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const canManage = can(session?.user?.role, "buoikham.manage");
  const canViewTamSoat = can(session?.user?.role, "tamsoat.view");
  const canClinical = can(session?.user?.role, "hoso.clinical");
  const canExport = can(session?.user?.role, "report.export");
  const canReconcile = can(session?.user?.role, "hoso.treatment");

  const [list, setList] = useState<BuoiKham[]>([]);
  const [cosos, setCosos] = useState<CoSo[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [doctorFilter, setDoctorFilter] = useState<string>("ALL");
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("ALL");

  const getCurrentMonthKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const [monthFilter, setMonthFilter] = useState<string>(getCurrentMonthKey);
  const [exportingPage, setExportingPage] = useState(false);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const getTodayIso = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const [coSoId, setCoSoId] = useState("");
  const [ngayKham, setNgayKham] = useState(getTodayIso);
  const [xa, setXa] = useState("");
  const [diaDiem, setDiaDiem] = useState("");
  const [bacSiKham, setBacSiKham] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  const [viewPatientsBuoiKham, setViewPatientsBuoiKham] = useState<BuoiKham | null>(null);
  const [patientInitialFilter, setPatientInitialFilter] = useState<"ALL" | "A" | "B" | "DA_MO" | "DA_MO_TRUOC" | "CHUA_MO" | "PHACO_2_LAN">("ALL");
  const [editModal, setEditModal] = useState<BuoiKham | null>(null);
  const [editXa, setEditXa] = useState("");
  const [editDiaDiem, setEditDiaDiem] = useState("");
  const [editGhiChu, setEditGhiChu] = useState("");
  const [editNgayKham, setEditNgayKham] = useState("");
  const [editBacSiKham, setEditBacSiKham] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState("");
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [topExportOpen, setTopExportOpen] = useState(false);
  const topExportRef = useRef<HTMLDivElement>(null);
  const [confirmCompleteModal, setConfirmCompleteModal] = useState<BuoiKham | null>(null);
  const [completing, setCompleting] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<BuoiKham | null>(null);

  useEffect(() => {
    if (!topExportOpen) return;
    const h = (e: MouseEvent) => {
      if (topExportRef.current && !topExportRef.current.contains(e.target as Node)) setTopExportOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [topExportOpen]);

  const handleCompleteBuoiKham = async () => {
    if (!confirmCompleteModal) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/csr/buoikham/${confirmCompleteModal.id}/complete-pending`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể kết thúc đợt khám");
      }
      addToast({
        type: "success",
        title: "Kết thúc đợt khám thành công",
        message: data.message || `Đã chuyển các ca chờ sang trạng thái đã khám.`,
      });
      setConfirmCompleteModal(null);
      await load();
    } catch (err) {
      addToast({
        type: "error",
        title: "Lỗi",
        message: err instanceof Error ? err.message : "Mất kết nối máy chủ",
      });
    } finally {
      setCompleting(false);
    }
  };

  const handleExportBuoiKham = async (b: BuoiKham, format: "khamSucKhoe" | "default" = "khamSucKhoe") => {
    if (exportingId) return;
    setExportingId(b.id);
    try {
      const res = await fetch(`/api/csr/export?buoiKhamId=${encodeURIComponent(b.id)}&format=${format}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể xuất file Excel");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const disp = res.headers.get("Content-Disposition");
      let filename = "";
      if (disp) {
        const matchStar = disp.match(/filename\*=UTF-8''([^;]+)/i);
        if (matchStar) filename = decodeURIComponent(matchStar[1]);
        else {
          const matchPlain = disp.match(/filename="?([^";]+)"?/i);
          if (matchPlain) filename = matchPlain[1];
        }
      }
      if (!filename) {
        const dateStr = b.ngayKham ? new Date(b.ngayKham).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
        const cleanXa = (b.xa || "KhamMat").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, "_");
        filename = format === "khamSucKhoe"
          ? `Kham_Suc_Khoe_${cleanXa}_${dateStr}.xlsx`
          : `Danh_Sach_Kham_Mat_${cleanXa}_${dateStr}.xlsx`;
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast({
        type: "success",
        title: "Xuất Excel thành công",
        message: format === "khamSucKhoe"
          ? `Đã tải file khám sức khỏe ${b.xa || fmtBuoiKhamName(b)} (mẫu 101 cột)`
          : `Đã tải file danh sách khám mắt ${b.xa || fmtBuoiKhamName(b)} (mẫu Google Sheet)`,
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Lỗi xuất file",
        message: err instanceof Error ? err.message : "Có lỗi xảy ra khi xuất file Excel",
      });
    } finally {
      setExportingId(null);
    }
  };

  const handleExportPageExcel = async (format: "khamSucKhoe" | "default" = "khamSucKhoe") => {
    if (exportingPage) return;
    setExportingPage(true);
    try {
      const res = await fetch(`/api/csr/export?format=${format}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể xuất file Excel");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = format === "khamSucKhoe"
        ? `Kham_Suc_Khoe_VISI_${dateStr}.xlsx`
        : `Danh_Sach_Kham_Mat_VISI_${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast({
        type: "success",
        title: "Xuất Excel thành công",
        message: format === "khamSucKhoe"
          ? "Đã tải file khám sức khỏe toàn bộ bệnh nhân (mẫu 101 cột)"
          : "Đã tải file danh sách bệnh nhân (chuẩn Google Sheet)",
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Lỗi xuất file",
        message: err instanceof Error ? err.message : "Có lỗi xảy ra khi xuất file Excel",
      });
    } finally {
      setExportingPage(false);
    }
  };

  const openCreateModal = () => {
    setNgayKham(getTodayIso());
    setXa("");
    setDiaDiem("");
    setBacSiKham("");
    setGhiChu("");
    setErr("");
    setOpen(true);
  };

  const openEditModal = (b: BuoiKham) => {
    setEditXa(b.xa || "");
    setEditDiaDiem(b.diaDiem || "");
    setEditGhiChu(b.ghiChu || "");
    setEditNgayKham(b.ngayKham ? new Date(b.ngayKham).toISOString().slice(0, 10) : "");
    setEditBacSiKham(b.bacSiKham || "");
    setEditErr("");
    setEditModal(b);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    setEditSaving(true);
    setEditErr("");
    try {
      const res = await fetch(`/api/csr/buoikham/${editModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xa: editXa,
          diaDiem: editDiaDiem,
          ghiChu: editGhiChu,
          ngayKham: editNgayKham || undefined,
          bacSiKham: editBacSiKham,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể lưu thông tin");
      }
      addToast({ type: "success", title: "Thành công", message: "Đã cập nhật thông tin đợt khám" });
      setEditModal(null);
      await load();
    } catch (err) {
      setEditErr(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setEditSaving(false);
    }
  };

  const load = useCallback(async () => {
    const [bk, cs] = await Promise.all([fetch("/api/csr/buoikham"), fetch("/api/csr/coso")]);
    if (bk.ok) setList(await bk.json());
    if (cs.ok) {
      const data: CoSo[] = await cs.json();
      setCosos(data);
      const active = readCosoCookie() || session?.user?.coSoId || data[0]?.id || "";
      setCoSoId(active);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { (async () => { await load(); })(); }, [load]);

  // Cập nhật danh sách đợt khám & số liệu bệnh nhân thời gian thực (SSE).
  // Gom các sự kiện dồn dập (đối chiếu HIS hàng loạt bắn nhiều sự kiện liên tiếp) thành một lần nạp.
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useRealtimeEvent(["buoikham_change", "hoso_change"], () => {
    if (reloadTimer.current) clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => load(), 1200);
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const res = await fetch("/api/csr/buoikham", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coSoId, ngayKham, xa, diaDiem, bacSiKham, ghiChu }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Không thể tạo"); return; }
      setOpen(false); setNgayKham(getTodayIso()); setXa(""); setDiaDiem(""); setBacSiKham(""); setGhiChu("");
      addToast({ type: "success", title: "Đã tạo đợt khám", message: `Xã ${data.xa}` });
      load();
    } catch { setErr("Mất kết nối máy chủ"); }
    finally { setSaving(false); }
  };

  // Danh sách bác sĩ chuẩn hóa
  const doctorOptions = useMemo<Option[]>(() => {
    const set = new Set<string>();
    list.forEach((b) => {
      if (b.bacSiKham) {
        parseDoctorList(b.bacSiKham).forEach((d) => {
          if (d.trim()) set.add(d.trim());
        });
      }
    });
    const items = Array.from(set).sort().map((d) => ({
      value: d,
      label: cleanDoctorName(d),
    }));
    return [{ value: "ALL", label: "Tất cả bác sĩ" }, ...items];
  }, [list]);

  // Danh sách các tháng có đợt khám
  const monthOptions = useMemo<Option[]>(() => {
    const map = new Map<string, string>();
    const curKey = getCurrentMonthKey();
    const now = new Date();
    map.set(curKey, `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`);

    list.forEach((b) => {
      if (b.ngayKham) {
        const d = new Date(b.ngayKham);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const key = `${y}-${m}`;
        const label = `Tháng ${d.getMonth() + 1}/${y}`;
        map.set(key, label);
      }
    });
    const items = Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([value, label]) => ({ value, label }));
    return [{ value: "ALL", label: "Tất cả tháng" }, ...items];
  }, [list]);

  const groupOptions: Option<GroupFilter>[] = [
    { value: "ALL", label: "Tất cả phân nhóm" },
    { value: "HAS_A", label: "Có chỉ định mổ (A)" },
    { value: "HAS_B", label: "Có ca theo dõi (B)" },
    { value: "HAS_UNOPERATED", label: "Còn ca chưa mổ" },
    { value: "HAS_PHACO_2_LAN", label: "Có ca mổ mắt 2 (Phaco)" },
  ];

  // Đếm theo trạng thái
  const countsByStatus = useMemo(() => {
    const counts = { ALL: list.length, DangDienRa: 0, SapDienRa: 0, DaKetThuc: 0 };
    list.forEach((b) => {
      const p = phaseOf(b.ngayKham).key;
      if (p === "DangDienRa") counts.DangDienRa++;
      else if (p === "SapDienRa") counts.SapDienRa++;
      else if (p === "DaKetThuc") counts.DaKetThuc++;
    });
    return counts;
  }, [list]);

  // Lọc dữ liệu
  const filtered = useMemo(() => {
    return list.filter((b) => {
      if (statusFilter !== "ALL") {
        if (phaseOf(b.ngayKham).key !== statusFilter) return false;
      }
      if (doctorFilter !== "ALL") {
        if (!b.bacSiKham || !parseDoctorList(b.bacSiKham).includes(doctorFilter)) return false;
      }
      if (monthFilter !== "ALL") {
        if (!b.ngayKham) return false;
        const d = new Date(b.ngayKham);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const key = `${y}-${m}`;
        if (key !== monthFilter) return false;
      }
      if (groupFilter === "HAS_A") {
        if ((b.stats?.nhomA ?? 0) <= 0) return false;
      } else if (groupFilter === "HAS_B") {
        if ((b.stats?.nhomB ?? 0) <= 0) return false;
      } else if (groupFilter === "HAS_UNOPERATED") {
        if ((b.stats?.chuaMo ?? 0) <= 0) return false;
      } else if (groupFilter === "HAS_PHACO_2_LAN") {
        if ((b.stats?.phaco2Lan ?? 0) <= 0) return false;
      }
      return true;
    });
  }, [list, statusFilter, doctorFilter, groupFilter, monthFilter]);

  const hasActiveFilters = statusFilter !== "ALL" || doctorFilter !== "ALL" || groupFilter !== "ALL" || monthFilter !== getCurrentMonthKey();

  const resetFilters = () => {
    setStatusFilter("ALL");
    setDoctorFilter("ALL");
    setGroupFilter("ALL");
    setMonthFilter(getCurrentMonthKey());
  };

  // ── Đối chiếu HIS: chạy nền, cập nhật "đối chiếu gần nhất" ngay trên từng dòng ──
  const his = useHisReconcile({
    onLog: (id, log) => setList((prev) => prev.map((b) => (b.id === id ? { ...b, lastDoiChieu: log } : b))),
    onFinish: () => load(),
  });

  /** Các đợt ĐANG HIỂN THỊ (sau bộ lọc) có BN Nhóm A — đích của nút đối chiếu hàng loạt. */
  const toTarget = (b: BuoiKham) => ({ id: b.id, name: fmtBuoiKhamName(b), soCa: (b.stats?.nhomA ?? 0) + (b.stats?.nhomB ?? 0) });
  const reconcileOne = (b: BuoiKham) => his.runOne(toTarget(b));

  const columns = useMemo<ColumnDef<BuoiKham>[]>(
    () => [
      {
        id: "stt",
        header: "STT",
        size: 48,
        enableSorting: false,
        enableColumnFilter: false,
        meta: { align: "center" },
        cell: ({ row, table }) => {
          const { pageIndex = 0, pageSize = 50 } = table.getState().pagination || {};
          return <span className="font-mono text-[12px] text-[var(--mute)] tabular-nums">{pageIndex * pageSize + row.index + 1}</span>;
        },
      },
      {
        id: "tenBuoiKham",
        header: "Đợt khám",
        size: 320,
        meta: { flex: true },
        accessorFn: (row) => `${fmtBuoiKhamName(row)} ${fmtBuoiKhamCode(row.id)} ${row.xa || ""} ${row.diaDiem || ""}`,
        sortingFn: (a, b) => fmtBuoiKhamName(a.original).localeCompare(fmtBuoiKhamName(b.original), "vi"),
        cell: ({ row }) => {
          const b = row.original;
          const name = fmtBuoiKhamName(b);
          const place = b.diaDiem && b.diaDiem.trim() !== name ? b.diaDiem : xaLabel(b.xa);
          return (
            <div className="min-w-0">
              <div className="font-semibold text-[var(--ink)] text-[13px] leading-snug truncate" title={name}>
                {name}
              </div>
              <div className="flex items-center gap-2 mt-0.5 min-w-0">
                <span className="font-mono text-[10.5px] font-bold text-[var(--navy)] shrink-0">{fmtBuoiKhamCode(b.id)}</span>
                {place && (
                  <span className="flex items-center gap-1 text-[11px] text-[var(--mute)] min-w-0" title={place}>
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{place}</span>
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "ngayKham",
        header: "Ngày khám",
        size: 104,
        enableColumnFilter: false,
        accessorFn: (row) => (row.ngayKham ? new Date(row.ngayKham).getTime() : 0),
        cell: ({ row }) => (
          <span className="font-mono text-[12px] text-[var(--ink)] font-semibold tabular-nums">{fmtDate(row.original.ngayKham)}</span>
        ),
      },
      {
        id: "bacSi",
        header: "Bác sĩ",
        size: 170,
        accessorFn: (row) => row.bacSiKham || "",
        cell: ({ row }) => {
          const docs = parseDoctorList(row.original.bacSiKham);
          if (docs.length === 0) return <span className="text-[var(--mute-soft)] text-[12px]">—</span>;
          return (
            <div className="min-w-0" title={docs.map(cleanDoctorName).join(", ")}>
              <div className="text-[12.5px] text-[var(--ink-soft)] font-medium truncate">{cleanDoctorName(docs[0])}</div>
              {docs.length > 1 && <div className="text-[10.5px] text-[var(--mute)]">+{docs.length - 1} bác sĩ khác</div>}
            </div>
          );
        },
      },
      {
        id: "slBn",
        header: "Số BN",
        size: 88,
        enableColumnFilter: false,
        meta: { align: "right" },
        accessorFn: (row) => row._count?.hoSo ?? 0,
        cell: ({ row }) => (
          <button
            type="button"
            data-no-row-click
            onClick={() => setViewPatientsBuoiKham(row.original)}
            className="font-mono font-bold text-[13px] tabular-nums text-[var(--navy)] hover:underline underline-offset-2 cursor-pointer"
            title="Xem danh sách bệnh nhân và kết quả khám"
          >
            {(row.original._count?.hoSo ?? 0).toLocaleString("vi-VN")}
          </button>
        ),
      },
      {
        id: "phanNhom",
        header: "Phân nhóm",
        size: 108,
        enableSorting: false,
        enableColumnFilter: false,
        meta: { align: "center" },
        cell: ({ row }) => <NhomChip a={row.original.stats?.nhomA ?? 0} b={row.original.stats?.nhomB ?? 0} />,
      },
      {
        id: "tienDoMo",
        header: "Tiến độ mổ",
        size: 150,
        enableColumnFilter: false,
        accessorFn: (row) => {
          const need = (row.stats?.daMo ?? 0) + (row.stats?.chuaMo ?? 0);
          return need > 0 ? (row.stats?.daMo ?? 0) / need : -1;
        },
        cell: ({ row }) => (
          <MoProgress done={row.original.stats?.daMo ?? 0} waiting={row.original.stats?.chuaMo ?? 0} daMoTruoc={row.original.stats?.daMoTruoc ?? 0} />
        ),
      },
      {
        id: "phaco2Lan",
        header: "Mắt 2",
        size: 76,
        enableColumnFilter: false,
        meta: { align: "center" },
        accessorFn: (row) => row.stats?.phaco2Lan ?? 0,
        cell: ({ row }) => (
          <Mat2Badge
            count={row.original.stats?.phaco2Lan ?? 0}
            onClick={() => {
              setPatientInitialFilter("PHACO_2_LAN");
              setViewPatientsBuoiKham(row.original);
            }}
          />
        ),
      },
      {
        id: "doiChieuHis",
        header: "Đối chiếu HIS",
        size: 196,
        enableColumnFilter: false,
        meta: { noTruncate: true },
        accessorFn: (row) => (row.lastDoiChieu ? new Date(row.lastDoiChieu.thoiDiem).getTime() : 0),
        cell: ({ row }) => (
          <DoiChieuCell
            log={row.original.lastDoiChieu}
            running={his.runningIds.has(row.original.id)}
            onOpenHistory={() => setHistoryTarget(row.original)}
          />
        ),
      },
      {
        id: "trangThai",
        header: "Trạng thái",
        size: 128,
        enableColumnFilter: false,
        accessorFn: (row) => phaseOf(row.ngayKham).key,
        cell: ({ row }) => <PhaseBadge ngayKham={row.original.ngayKham} />,
      },
      {
        id: "actions",
        header: "",
        size: 188,
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        meta: { align: "right", noTruncate: true },
        cell: ({ row }) => (
          <BuoiKhamRowActions
            b={row.original}
            canManage={canManage}
            canViewTamSoat={canViewTamSoat}
            canClinical={canClinical}
            canReconcile={canReconcile}
            reconciling={his.runningIds.has(row.original.id)}
            exportingId={exportingId}
            onExport={handleExportBuoiKham}
            onEdit={openEditModal}
            onComplete={setConfirmCompleteModal}
            onViewPatients={(rec) => setViewPatientsBuoiKham(rec)}
            onReconcile={reconcileOne}
            onHistory={setHistoryTarget}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManage, canViewTamSoat, canClinical, canReconcile, exportingId, his.runningIds]
  );

  const statusTabs: { key: StatusFilter; label: string; dot?: boolean }[] = [
    { key: "ALL", label: "Tất cả" },
    { key: "DangDienRa", label: "Đang khám", dot: true },
    { key: "SapDienRa", label: "Sắp tới" },
    { key: "DaKetThuc", label: "Đã xong" },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full">
      <DataView<BuoiKham, unknown> fullHeight columns={columns} data={filtered} isLoading={loading} pageSize={50}>
        {/* ── Tab trạng thái (pill — chuẩn Tabs VISIHUB) + thao tác cấp trang ── */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-3">
          <div className="inline-flex gap-0.5 p-[3px] rounded-xl bg-[var(--surface)] border border-[var(--line)] shadow-xs overflow-x-auto no-scrollbar max-w-full">
            {statusTabs.map((t) => {
              const active = statusFilter === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setStatusFilter(t.key)}
                  className={`relative flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    active ? "text-white" : "text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="bk-status-pill"
                      className="absolute inset-0 rounded-lg bg-[var(--navy)] shadow-[var(--navy-shadow)]"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  {t.dot && <span className={`relative w-1.5 h-1.5 rounded-full bg-[var(--teal)] ${active ? "" : "animate-pulse"}`} />}
                  <span className="relative">{t.label}</span>
                  <span
                    className={`relative text-[10px] font-bold font-mono tabular-nums px-1.5 py-px rounded-md ${
                      active ? "bg-white/20 text-white" : "bg-[var(--line-soft)] text-[var(--mute)]"
                    }`}
                  >
                    {countsByStatus[t.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <div className="relative" ref={topExportRef}>
              <div className="inline-flex">
                <button
                  type="button"
                  onClick={() => handleExportPageExcel("khamSucKhoe")}
                  disabled={exportingPage}
                  title="Xuất Excel toàn bộ bệnh nhân theo mẫu Khám Sức Khỏe (101 cột)"
                  className={cn(BTN_TEAL_SOFT, "rounded-r-none")}
                >
                  {exportingPage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Xuất Excel
                </button>
                <button
                  type="button"
                  onClick={() => setTopExportOpen((o) => !o)}
                  disabled={exportingPage}
                  title="Chọn mẫu xuất Excel"
                  className={cn(BTN_TEAL_SOFT, "rounded-l-none border-l-0 px-2", topExportOpen && "bg-[var(--teal)] text-white")}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              {topExportOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-[var(--surface)] border border-[var(--line-strong)] rounded-[12px] shadow-[var(--shadow-lg)] p-1 z-50 animate-dropdown">
                  <MenuItem icon={FileSpreadsheet} tone="teal" label="Mẫu Khám Sức Khỏe (101 cột)" hint="Mẫu chuẩn nộp HIS / cơ quan" onClick={() => { setTopExportOpen(false); handleExportPageExcel("khamSucKhoe"); }} />
                  <MenuItem icon={FileSpreadsheet} label="Mẫu Google Sheet (25 cột)" hint="Danh sách khám sàng lọc" onClick={() => { setTopExportOpen(false); handleExportPageExcel("default"); }} />
                </div>
              )}
            </div>

            {canReconcile && <ReconcileAllButton his={his} toTarget={toTarget} />}
          </div>
        </div>

        {/* ── Card danh sách: DataToolbar + bảng + phân trang ── */}
        <div className="flex-1 min-h-0 flex flex-col bg-[var(--surface)] border border-[var(--line-soft)] rounded-2xl shadow-xs overflow-hidden">
          <DataToolbar
            searchPlaceholder="Tìm xã, điểm khám, mã đợt, bác sĩ…"
            filters={
              <>
                <ToolbarSelect icon={Calendar} className="w-[150px]" ariaLabel="Lọc theo tháng" value={monthFilter} onChange={setMonthFilter} options={monthOptions} active={monthFilter !== "ALL"} />
                <ToolbarSelect icon={UserCheck} className="w-[190px]" ariaLabel="Lọc theo bác sĩ" value={doctorFilter} onChange={setDoctorFilter} options={doctorOptions} active={doctorFilter !== "ALL"} />
                <ToolbarSelect icon={Layers} className="w-[190px]" ariaLabel="Lọc theo phân nhóm" value={groupFilter} onChange={(v) => setGroupFilter(v as GroupFilter)} options={groupOptions} active={groupFilter !== "ALL"} />
                {hasActiveFilters && (
                  <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 h-9 px-2 text-[11.5px] font-semibold text-[var(--rose)] hover:underline cursor-pointer shrink-0" title="Đưa bộ lọc về mặc định">
                    <RotateCcw className="w-3 h-3" /> Đặt lại
                  </button>
                )}
              </>
            }
            mobileActions={
              <>
                <button
                  type="button"
                  onClick={() => handleExportPageExcel("khamSucKhoe")}
                  disabled={exportingPage}
                  className="w-9 h-9 rounded-xl border border-[var(--teal)]/30 bg-[var(--teal-soft)] text-[var(--teal-deep)] flex items-center justify-center disabled:opacity-50"
                  title="Xuất Excel (mẫu Khám Sức Khỏe)"
                >
                  {exportingPage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-4 h-4" />}
                </button>
                {canReconcile && <ReconcileAllButton his={his} toTarget={toTarget} compact />}
              </>
            }
            primaryAction={
              canManage ? (
                <button data-tour="bk-create" type="button" onClick={openCreateModal} className="btn-primary inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[12px] font-semibold whitespace-nowrap">
                  <Plus className="w-3.5 h-3.5 text-[var(--teal)]" />
                  <span className="md:hidden">Tạo đợt</span>
                  <span className="hidden md:inline">Tổ chức đợt khám</span>
                </button>
              ) : null
            }
          />

          <div data-tour="bk-table" className="flex-1 min-h-0 flex flex-col">
            {/* Mobile: thẻ gọn — lấy đúng các dòng của trang hiện tại (đã qua tìm kiếm) */}
            <div className="md:hidden flex-1 min-h-0 overflow-auto divide-y divide-[var(--line-soft)]">
              <PageRows<BuoiKham>>
                {(rows) =>
                  loading && rows.length === 0 ? (
                    <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--navy)]" /></div>
                  ) : rows.length === 0 ? (
                    <div className="py-16 text-center text-[var(--mute)] text-[13px]">Không tìm thấy đợt khám nào phù hợp bộ lọc.</div>
                  ) : (
                    rows.map((b) => {
                      const isOngoing = phaseOf(b.ngayKham).key === "DangDienRa";
                      const name = fmtBuoiKhamName(b);
                      const place = b.diaDiem && b.diaDiem.trim() !== name ? b.diaDiem : "";
                      const docs = parseDoctorList(b.bacSiKham);
                      const daMo = b.stats?.daMo ?? 0;
                      const need = daMo + (b.stats?.chuaMo ?? 0);
                      const pct = need ? Math.round((daMo / need) * 100) : 0;
                      const mat2 = b.stats?.phaco2Lan ?? 0;
                      return (
                        <div
                          key={b.id}
                          className={`px-4 py-3.5 border-l-[3px] ${isOngoing ? "border-l-[var(--teal)] bg-[var(--teal-softer)]" : "border-l-transparent"}`}
                        >
                          {/* Tên + trạng thái */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold text-[14px] text-[var(--ink)] leading-snug line-clamp-2">{name}</div>
                              <div className="mt-0.5 flex items-center gap-1.5 flex-wrap text-[11px] text-[var(--mute)]">
                                <span className="font-mono font-bold text-[var(--navy)]">{fmtBuoiKhamCode(b.id)}</span>
                                <span className="text-[var(--mute-soft)]">·</span>
                                <span className="font-mono tabular-nums">{fmtDate(b.ngayKham)}</span>
                                {docs.length > 0 && (
                                  <>
                                    <span className="text-[var(--mute-soft)]">·</span>
                                    <span className="truncate max-w-[160px]">{cleanDoctorName(docs[0])}{docs.length > 1 ? ` +${docs.length - 1}` : ""}</span>
                                  </>
                                )}
                              </div>
                              {place && (
                                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--mute)] min-w-0">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{place}</span>
                                </div>
                              )}
                            </div>
                            <PhaseBadge ngayKham={b.ngayKham} />
                          </div>

                          {/* Dải số liệu */}
                          <div className={`mt-2.5 grid ${mat2 ? "grid-cols-4" : "grid-cols-3"} rounded-[10px] border border-[var(--line)] bg-[var(--surface)] divide-x divide-[var(--line-soft)] overflow-hidden`}>
                            <button type="button" onClick={() => setViewPatientsBuoiKham(b)} className="px-2.5 py-2 text-left cursor-pointer active:bg-[var(--navy-50)]">
                              <div className="font-mono text-[15px] font-bold text-[var(--navy)] tabular-nums leading-tight">{(b._count?.hoSo ?? 0).toLocaleString("vi-VN")}</div>
                              <div className="text-[10.5px] text-[var(--mute)]">Bệnh nhân</div>
                            </button>
                            <div className="px-2.5 py-2">
                              <div className="font-mono text-[13px] font-bold tabular-nums leading-tight whitespace-nowrap">
                                <span className="text-[var(--rose)]">A {b.stats?.nhomA ?? 0}</span>
                                <span className="text-[var(--mute-soft)]"> · </span>
                                <span className="text-[var(--amber-deep)]">B {b.stats?.nhomB ?? 0}</span>
                              </div>
                              <div className="text-[10.5px] text-[var(--mute)] mt-px">Phân nhóm</div>
                            </div>
                            <div className="px-2.5 py-2 min-w-0">
                              <div className="font-mono text-[13px] tabular-nums leading-tight whitespace-nowrap">
                                <b className={daMo ? "text-[var(--teal-deep)]" : "text-[var(--ink)]"}>{daMo}</b>
                                <span className="text-[var(--mute)]">/{need}</span>
                              </div>
                              <div className="mt-1 h-1 rounded-full bg-[var(--line)] overflow-hidden">
                                <div className="h-full bg-[var(--teal)] rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              {(b.stats?.daMoTruoc ?? 0) > 0 && (
                                <div className="text-[10px] font-semibold text-[#7c3aed] mt-0.5 whitespace-nowrap">+{b.stats?.daMoTruoc} mổ trước</div>
                              )}
                            </div>
                            {mat2 > 0 && (
                              <button
                                type="button"
                                onClick={() => { setPatientInitialFilter("PHACO_2_LAN"); setViewPatientsBuoiKham(b); }}
                                className="px-2.5 py-2 text-left cursor-pointer active:bg-[#f3eaf8]"
                              >
                                <div className="font-mono text-[15px] font-bold text-[#7c3aed] tabular-nums leading-tight">{mat2}</div>
                                <div className="text-[10.5px] text-[var(--mute)]">Mắt 2</div>
                              </button>
                            )}
                          </div>

                          {/* Đối chiếu HIS + thao tác */}
                          <div className="mt-2.5 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <DoiChieuCell log={b.lastDoiChieu} running={his.runningIds.has(b.id)} onOpenHistory={() => setHistoryTarget(b)} />
                            </div>
                            <BuoiKhamRowActions
                              b={b}
                              canManage={canManage}
                              canViewTamSoat={canViewTamSoat}
                              canClinical={canClinical}
                              canReconcile={canReconcile}
                              reconciling={his.runningIds.has(b.id)}
                              exportingId={exportingId}
                              onExport={handleExportBuoiKham}
                              onEdit={openEditModal}
                              onComplete={setConfirmCompleteModal}
                              onViewPatients={(rec) => setViewPatientsBuoiKham(rec)}
                              onReconcile={reconcileOne}
                              onHistory={setHistoryTarget}
                            />
                          </div>
                        </div>
                      );
                    })
                  )
                }
              </PageRows>
            </div>

            {/* Desktop: DataTable */}
            <div className="hidden md:flex flex-col flex-1 min-h-0">
              <DataTable<BuoiKham>
                rowClassName={(b) => (phaseOf(b.ngayKham).key === "DangDienRa" ? "shadow-[inset_3px_0_0_var(--teal)]" : undefined)}
                emptyIcon={CalendarDays}
                emptyTitle="Không tìm thấy đợt khám nào phù hợp bộ lọc"
              />
            </div>

            <DataPagination pageSizeOptions={[10, 25, 50, 100]} />
          </div>
        </div>
      </DataView>

      <HisReconcilePanel bulk={his.bulk} progress={his.progress} onCancel={his.cancel} onDismiss={his.dismiss} />

      <DoiChieuHistoryModal
        target={historyTarget ? { id: historyTarget.id, name: fmtBuoiKhamName(historyTarget) } : null}
        onClose={() => setHistoryTarget(null)}
        running={historyTarget ? his.runningIds.has(historyTarget.id) : false}
        onRerun={canReconcile && historyTarget && (historyTarget.stats?.nhomA ?? 0) + (historyTarget.stats?.nhomB ?? 0) > 0 ? () => reconcileOne(historyTarget) : undefined}
      />


      {/* Modal Xem danh sách bệnh nhân và thông tin khám */}
      <BuoiKhamPatientsModal
        open={Boolean(viewPatientsBuoiKham)}
        onClose={() => {
          setViewPatientsBuoiKham(null);
          setPatientInitialFilter("ALL");
        }}
        buoiKham={viewPatientsBuoiKham}
        initialFilter={patientInitialFilter}
      />

      {/* Modal Tổ chức đợt khám mới */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tổ chức đợt khám mới"
        subtitle="Tạo lịch khám tầm soát cộng đồng tại cơ sở y tế"
        icon={CalendarDays}
        maxWidth="max-w-[580px]"
        noPadding
      >
        <form onSubmit={create} className="p-5 sm:p-6 space-y-4 bg-white">
          {err && (
            <div className="p-3.5 bg-[#fef1f4] border border-[#e11d48]/30 rounded-xl text-[13px] font-semibold text-[#e11d48] flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" /> {err}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Ngày khám" required hint="Chọn ngày tổ chức">
              <DateField value={ngayKham} onChange={setNgayKham} placeholder="dd/mm/yyyy" />
            </Field>
            <Field label="Xã / phường" required hint="Địa bàn tiếp nhận">
              <input value={xa} onChange={(e) => setXa(e.target.value)} required className="input-field h-10" placeholder="VD: Vĩnh Thạnh" />
            </Field>
          </div>

          <Field label="Địa điểm khám (= Điểm khám trên phiếu)" required hint="In trên phiếu khám của bệnh nhân">
            <input value={diaDiem} onChange={(e) => setDiaDiem(e.target.value)} required className="input-field h-10" placeholder="VD: Trạm y tế / UBND xã…" />
          </Field>

          <Field label="Bác sĩ khám / chỉ định" hint="Chọn 1 hoặc nhiều bác sĩ tham gia đoàn">
            <DoctorMultiSelect
              value={bacSiKham}
              onChange={setBacSiKham}
              placeholder="Chọn hoặc nhập tên bác sĩ khám..."
            />
          </Field>

          <Field label="Ghi chú đợt khám" hint="Không bắt buộc">
            <textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={3} className="input-field resize-none py-2" placeholder="Ghi chú thêm về công tác chuẩn bị, nhân sự, số lượng dự kiến..." />
          </Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e2e8f0]">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary px-4 py-2 text-xs font-semibold">
              Hủy
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary px-5 py-2 text-xs font-bold cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{saving ? "Đang lưu..." : "Tạo đợt khám"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Chỉnh sửa đợt khám */}
      <Modal
        open={Boolean(editModal)}
        onClose={() => setEditModal(null)}
        title="Chỉnh sửa đợt khám"
        subtitle={editModal ? fmtBuoiKhamName(editModal) : ""}
        icon={Pencil}
        maxWidth="max-w-[580px]"
        noPadding
      >
        <form onSubmit={handleSaveEdit} className="p-5 sm:p-6 space-y-4 bg-white">
          {editErr && (
            <div className="p-3.5 bg-[#fef1f4] border border-[#e11d48]/30 rounded-xl text-[13px] font-semibold text-[#e11d48] flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" /> {editErr}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Ngày khám" required hint="Cập nhật ngày tổ chức">
              <DateField value={editNgayKham} onChange={setEditNgayKham} placeholder="dd/mm/yyyy" />
            </Field>
            <Field label="Xã / phường" required hint="Địa bàn tiếp nhận">
              <input value={editXa} onChange={(e) => setEditXa(e.target.value)} required className="input-field h-10" placeholder="VD: Vĩnh Thạnh" />
            </Field>
          </div>

          <Field label="Địa điểm khám" required hint="In trên phiếu khám">
            <input value={editDiaDiem} onChange={(e) => setEditDiaDiem(e.target.value)} required className="input-field h-10" placeholder="VD: Trạm y tế..." />
          </Field>

          <Field label="Bác sĩ khám / chỉ định" hint="Chọn 1 hoặc nhiều bác sĩ tham gia đoàn">
            <DoctorMultiSelect
              value={editBacSiKham}
              onChange={setEditBacSiKham}
              placeholder="Chọn hoặc nhập tên bác sĩ..."
            />
          </Field>

          <Field label="Ghi chú đợt khám" hint="Không bắt buộc">
            <textarea value={editGhiChu} onChange={(e) => setEditGhiChu(e.target.value)} rows={3} className="input-field resize-none py-2" placeholder="Ghi chú cập nhật..." />
          </Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e2e8f0]">
            <button type="button" onClick={() => setEditModal(null)} className="btn btn-secondary px-4 py-2 text-xs font-semibold">
              Hủy
            </button>
            <button type="submit" disabled={editSaving} className="btn btn-primary px-5 py-2 text-xs font-bold cursor-pointer">
              {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{editSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Xác nhận Kết thúc đợt khám */}
      {confirmCompleteModal && (
        <Modal
          open={true}
          onClose={() => setConfirmCompleteModal(null)}
          title="Xác nhận kết thúc đợt khám"
          icon={CheckCheck}
          maxWidth="max-w-[480px]"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setConfirmCompleteModal(null)}
                disabled={completing}
                className="btn btn-secondary px-4 py-2 text-[13px] font-bold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleCompleteBuoiKham}
                disabled={completing}
                className="btn btn-primary px-4 py-2 text-[13px] font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
              >
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                Xác nhận kết thúc đợt
              </button>
            </div>
          }
        >
          <div className="space-y-3.5 text-[13.5px] text-[#334155] p-1">
            <p>
              Bạn có chắc chắn muốn kết thúc đợt khám <strong className="text-[#0f172a]">{fmtBuoiKhamName(confirmCompleteModal)}</strong> (<span className="font-mono text-[#031da6] font-bold">{fmtBuoiKhamCode(confirmCompleteModal.id)}</span>)?
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Lưu ý hành động này:
              </div>
              <div>Tất cả bệnh nhân đang ở trạng thái <strong>Tiếp nhận (chờ khám)</strong> trong đợt này sẽ được tự động chuyển sang <strong>Đã khám</strong> với kết quả <strong>Bình thường (Thị lực 10/10, Chưa phát hiện bất thường, Theo dõi)</strong>.</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
