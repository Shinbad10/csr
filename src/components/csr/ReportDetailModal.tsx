"use client";

import React, { useState, useEffect, useMemo } from "react";
import Modal from "@/components/layout/Modal";
import {
  Users,
  Calendar,
  Phone,
  CheckCircle2,
  Download,
  FileText,
  AlertCircle,
  Layers,
  Scissors,
  CreditCard,
} from "lucide-react";
import * as XLSX from "xlsx";
import { type ColumnDef } from "@tanstack/react-table";
import { fmtDate, statusOf, bhytLevel, ageOf, parseDiag, classifyCSRNhom } from "@/lib/csr";
import { StatusBadge } from "@/components/csr/fields";
import { PatientInfoModal } from "@/components/csr/PatientModals";
import { useToast } from "@/components/providers/ToastProvider";
import {
  DataView,
  DataToolbar,
  DataTable,
  DataPagination,
  ToolbarSelect,
  useDataContext,
} from "@/components/data";
import { cn } from "@/lib/utils";

export interface ReportModalTarget {
  type: string;
  val?: string;
  title: string;
  subtitle?: string;
  icon?: any;
  dateFilterLabel?: string;
}

type SessionItem = {
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
};

interface ReportDetailModalProps {
  open: boolean;
  onClose: () => void;
  target: ReportModalTarget | null;
  dateFilter: "all" | "30days" | "90days" | "year";
  /** Khoảng ngày cụ thể (YYYY-MM-DD). Nếu có thì ĐƯỢC ƯU TIÊN hơn `dateFilter`. */
  from?: string;
  to?: string;
  coSoName?: string;
  sessions?: SessionItem[];
  onExportSessionExcel?: (buoiKhamId: string) => void;
}

type GroupFilter = "ALL" | "A" | "B" | "OTHER";
type SurgeryFilter = "ALL" | "DA_MO" | "CHUA_MO" | "DEN_KHONG_MO";
type BhytFilter = "ALL" | "CO_BHYT" | "KHONG_BHYT";

const GROUP_OPTIONS: { value: GroupFilter; label: string }[] = [
  { value: "ALL", label: "Mọi nhóm" },
  { value: "A", label: "Nhóm A — chỉ định mổ" },
  { value: "B", label: "Nhóm B — theo dõi" },
  { value: "OTHER", label: "Chưa phân nhóm" },
];
const SURGERY_OPTIONS: { value: SurgeryFilter; label: string }[] = [
  { value: "ALL", label: "Mọi tình trạng mổ" },
  { value: "DA_MO", label: "Đã mổ" },
  { value: "CHUA_MO", label: "Chưa mổ" },
  { value: "DEN_KHONG_MO", label: "Đến nhưng không mổ" },
];
const BHYT_OPTIONS: { value: BhytFilter; label: string }[] = [
  { value: "ALL", label: "Mọi loại thẻ" },
  { value: "CO_BHYT", label: "Có BHYT" },
  { value: "KHONG_BHYT", label: "Không BHYT" },
];

type Nhom = ReturnType<typeof classifyCSRNhom>;
const matchGroup = (c: Nhom, f: GroupFilter) =>
  f === "ALL" || (f === "A" ? c.isNhomA : f === "B" ? c.isNhomB : !c.isNhomA && !c.isNhomB);
const matchSurgery = (c: Nhom, f: SurgeryFilter) =>
  f === "ALL" || (f === "DA_MO" ? c.isDaMo : f === "CHUA_MO" ? !c.isDaMo : c.isDenKhongMo);
const matchBhyt = (has: boolean, f: BhytFilter) => f === "ALL" || (f === "CO_BHYT" ? has : !has);
const withCounts = <K extends string>(opts: { value: K; label: string }[], counts: Record<K, number>) =>
  opts.map((o) => ({ ...o, count: counts[o.value] }));

const fN = (n: number) => n.toLocaleString("vi-VN");
const hasBhyt = (p: any) => !!p.bhyt && p.bhyt.trim().length >= 8;
const tyLeMo = (s: SessionItem) => (s.nhomA > 0 ? Math.round((s.daMo / s.nhomA) * 100) : null);

function diagnosisOf(p: any) {
  const diags = [...parseDiag(p.loaiBenhLy), ...parseDiag(p.chanDoan), ...parseDiag(p.chanDoanMP), ...parseDiag(p.chanDoanMT)];
  return Array.from(new Set(diags.filter(Boolean))).join(", ");
}

/** Số liệu trong bảng: số 0 lùi màu để mắt chỉ dừng ở những ô có giá trị. */
function NumCell({ value, tone = "text-[var(--ink)]" }: { value: number; tone?: string }) {
  return (
    <span className={cn("font-mono text-[12.5px] tabular-nums", value ? cn("font-bold", tone) : "text-[var(--mute-soft)]")}>
      {fN(value)}
    </span>
  );
}

function SttCell({ index, table }: { index: number; table: any }) {
  const { pageIndex = 0, pageSize = 15 } = table.getState().pagination || {};
  return <span className="font-mono text-[12px] text-[var(--mute)] tabular-nums">{pageIndex * pageSize + index + 1}</span>;
}

/** Nút xuất Excel — lấy đúng các dòng đang hiển thị (đã qua ô tìm kiếm, lọc cột, sắp xếp). */
function ExportButton({ onExport }: { onExport: (rows: any[]) => void }) {
  const { table } = useDataContext<any>();
  const rows = table.getPrePaginationRowModel().rows.map((r) => r.original);
  return (
    <button
      type="button"
      onClick={() => onExport(rows)}
      disabled={rows.length === 0}
      className="btn-primary h-9 px-3.5 text-[12px] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="w-3.5 h-3.5 text-[var(--teal)]" />
      <span>Xuất Excel</span>
      <span className="font-mono text-[11px] px-1.5 py-px rounded-md bg-white/15">{fN(rows.length)}</span>
    </button>
  );
}

export default function ReportDetailModal({
  open,
  onClose,
  target,
  dateFilter,
  from,
  to,
  coSoName,
  sessions = [],
  onExportSessionExcel,
}: ReportDetailModalProps) {
  const { addToast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [internalSessions, setInternalSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("ALL");
  const [surgeryFilter, setSurgeryFilter] = useState<SurgeryFilter>("ALL");
  const [bhytFilter, setBhytFilter] = useState<BhytFilter>("ALL");

  // Modal xem chi tiết hồ sơ bệnh nhân
  const [selectedHoSoId, setSelectedHoSoId] = useState<string | null>(null);

  const isSessionView = target?.type === "kpi_soBuoi";

  // Fetch danh sách hồ sơ chi tiết khi mở modal
  useEffect(() => {
    if (!open || !target) {
      setData([]);
      setInternalSessions([]);
      setGroupFilter("ALL");
      setSurgeryFilter("ALL");
      setBhytFilter("ALL");
      return;
    }

    if (target.type === "kpi_soBuoi") {
      if (sessions && sessions.length > 0) {
        setLoading(false);
        return;
      }
      let active = true;
      setLoading(true);
      const fetchSessions = async () => {
        try {
          const sp = new URLSearchParams();
          if (from) sp.set("from", from);
          if (to) sp.set("to", to);
          const res = await fetch(`/api/csr/reports${sp.toString() ? `?${sp.toString()}` : ""}`);
          if (res.ok) {
            const json = await res.json();
            if (active && json.sessions) {
              setInternalSessions(json.sessions);
            }
          }
        } catch (e) {
          console.error("Lỗi nạp đợt khám:", e);
        } finally {
          if (active) setLoading(false);
        }
      };
      fetchSessions();
      return () => {
        active = false;
      };
    }

    let active = true;
    setLoading(true);

    const fetchDetail = async () => {
      try {
        let url = `/api/csr/reports/detail?type=${encodeURIComponent(target.type)}`;
        if (target.val) {
          url += `&val=${encodeURIComponent(target.val)}`;
        }
        /* Có khoảng ngày cụ thể thì dùng luôn — danh sách chi tiết phải khớp
           đúng kỳ đang lọc ở trang cha, không tự suy diễn lại. */
        if (from || to) {
          if (from) url += `&from=${from}`;
          if (to) url += `&to=${to}`;
        } else {
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
  }, [open, target, dateFilter, from, to, sessions]);

  const allSessions = useMemo(
    () => (sessions && sessions.length > 0 ? sessions : internalSessions) || [],
    [sessions, internalSessions],
  );

  /* Lọc theo nhóm / mổ / BHYT ở đây; tìm kiếm tự do do DataToolbar (global filter) lo. */
  /* Phân loại mỗi hồ sơ một lần, dùng chung cho lọc và đếm số lượng trên các ô chọn. */
  const classified = useMemo(
    () => data.map((p) => ({ p, c: classifyCSRNhom(p), bhyt: hasBhyt(p) })),
    [data],
  );

  const filteredPatients = useMemo(() => {
    if (groupFilter === "ALL" && surgeryFilter === "ALL" && bhytFilter === "ALL") return data;
    return classified
      .filter((x) => matchGroup(x.c, groupFilter) && matchSurgery(x.c, surgeryFilter) && matchBhyt(x.bhyt, bhytFilter))
      .map((x) => x.p);
  }, [data, classified, groupFilter, surgeryFilter, bhytFilter]);

  /* Số lượng trên từng lựa chọn: tính theo HAI bộ lọc còn lại (faceted) — con số hiện ra
     đúng bằng số dòng sẽ thấy nếu bấm chọn lựa chọn đó. */
  const filterCounts = useMemo(() => {
    const count = <K extends string>(keys: readonly K[], match: (x: (typeof classified)[number], k: K) => boolean, base: typeof classified) =>
      Object.fromEntries(keys.map((k) => [k, base.filter((x) => match(x, k)).length])) as Record<K, number>;

    const forGroup = classified.filter((x) => matchSurgery(x.c, surgeryFilter) && matchBhyt(x.bhyt, bhytFilter));
    const forSurgery = classified.filter((x) => matchGroup(x.c, groupFilter) && matchBhyt(x.bhyt, bhytFilter));
    const forBhyt = classified.filter((x) => matchGroup(x.c, groupFilter) && matchSurgery(x.c, surgeryFilter));

    return {
      group: count(GROUP_OPTIONS.map((o) => o.value), (x, k) => matchGroup(x.c, k), forGroup),
      surgery: count(SURGERY_OPTIONS.map((o) => o.value), (x, k) => matchSurgery(x.c, k), forSurgery),
      bhyt: count(BHYT_OPTIONS.map((o) => o.value), (x, k) => matchBhyt(x.bhyt, k), forBhyt),
    };
  }, [classified, groupFilter, surgeryFilter, bhytFilter]);

  // Cột bảng đợt khám CSR (TanStack Table v8 — chuẩn VISIHUB)
  const sessionColumns = useMemo<ColumnDef<SessionItem>[]>(() => {
    const cols: ColumnDef<SessionItem>[] = [
      {
        id: "stt",
        header: "STT",
        size: 48,
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        meta: { align: "center" },
        cell: ({ row, table }) => <SttCell index={row.index} table={table} />,
      },
      {
        id: "ngayKham",
        header: "Ngày khám",
        size: 108,
        accessorFn: (s) => fmtDate(s.ngayKham),
        sortingFn: (a, b) => String(a.original.ngayKham).localeCompare(String(b.original.ngayKham)),
        meta: { noTruncate: true },
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-[var(--ink)] whitespace-nowrap text-[12px] tabular-nums">
            {row.original.ngayKham ? fmtDate(row.original.ngayKham) : "—"}
          </span>
        ),
      },
      {
        id: "xa",
        accessorKey: "xa",
        header: "Địa bàn / Xã",
        size: 170,
        cell: ({ row }) => (
          <span className="font-bold text-[var(--navy)] text-[12.5px]" title={row.original.xa}>
            {row.original.xa || "—"}
          </span>
        ),
      },
      {
        id: "diaDiem",
        accessorKey: "diaDiem",
        header: "Điểm khám",
        size: 280,
        enableSorting: false,
        meta: { flex: true },
        cell: ({ row }) => (
          <span className="text-[var(--ink-soft)] text-[12.5px]" title={row.original.diaDiem}>
            {row.original.diaDiem || "—"}
          </span>
        ),
      },
      {
        id: "bacSi",
        accessorKey: "bacSi",
        header: "Bác sĩ phụ trách",
        size: 180,
        cell: ({ row }) => (
          <span className="text-[var(--ink-soft)] text-[12.5px]" title={row.original.bacSi}>
            {row.original.bacSi || "—"}
          </span>
        ),
      },
      {
        id: "tong",
        accessorKey: "tong",
        header: "Tiếp nhận",
        size: 92,
        enableColumnFilter: false,
        meta: { align: "right" },
        cell: ({ row }) => <NumCell value={row.original.tong} />,
      },
      {
        id: "nhomA",
        accessorKey: "nhomA",
        header: "Nhóm A",
        size: 82,
        enableColumnFilter: false,
        meta: { align: "right" },
        cell: ({ row }) => <NumCell value={row.original.nhomA} tone="text-[var(--rose)]" />,
      },
      {
        id: "nhomB",
        accessorKey: "nhomB",
        header: "Nhóm B",
        size: 82,
        enableColumnFilter: false,
        meta: { align: "right" },
        cell: ({ row }) => <NumCell value={row.original.nhomB} tone="text-[var(--amber-deep)]" />,
      },
      {
        id: "daMo",
        accessorKey: "daMo",
        header: "Đã mổ",
        size: 82,
        enableColumnFilter: false,
        meta: { align: "right" },
        cell: ({ row }) => <NumCell value={row.original.daMo} tone="text-[var(--teal-deep)]" />,
      },
      {
        id: "tyLeMo",
        header: "Tỷ lệ mổ",
        size: 140,
        accessorFn: (s) => tyLeMo(s) ?? -1,
        enableColumnFilter: false,
        meta: { noTruncate: true },
        cell: ({ row }) => {
          const pct = tyLeMo(row.original);
          if (pct === null) return <span className="font-mono text-[12px] text-[var(--mute-soft)]">—</span>;
          const bar = pct >= 50 ? "bg-[var(--teal)]" : pct > 0 ? "bg-[var(--amber)]" : "bg-transparent";
          const text = pct >= 50 ? "text-[var(--teal-deep)]" : pct > 0 ? "text-[var(--amber-deep)]" : "text-[var(--mute)]";
          return (
            <div className="flex items-center gap-2" title={`${row.original.daMo}/${row.original.nhomA} ca nhóm A đã mổ`}>
              <div className="flex-1 h-1.5 rounded-full bg-[var(--line)] overflow-hidden">
                <div className={cn("h-full rounded-full", bar)} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <span className={cn("w-9 text-right font-mono text-[11.5px] font-bold tabular-nums", text)}>{pct}%</span>
            </div>
          );
        },
      },
    ];

    // Chỉ thêm cột thao tác khi trang cha có hỗ trợ xuất file theo đợt — tránh cột trống.
    if (onExportSessionExcel) {
      cols.push({
        id: "actions",
        header: "",
        size: 96,
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        meta: { align: "center", noTruncate: true },
        cell: ({ row }) => (
          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onExportSessionExcel(row.original.id)}
              title="Xuất file Excel đợt khám (mẫu 101 cột)"
              className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-bold whitespace-nowrap rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--navy)] hover:border-[var(--navy)]/40 hover:bg-[var(--navy-soft)] transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-[var(--teal-deep)]" />
              Excel
            </button>
          </div>
        ),
      });
    }
    return cols;
  }, [onExportSessionExcel]);

  // Cột bảng bệnh nhân (TanStack Table v8 — chuẩn VISIHUB)
  const patientColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: "stt",
      header: "STT",
      size: 48,
      enableSorting: false,
      enableColumnFilter: false,
      enableHiding: false,
      meta: { align: "center" },
      cell: ({ row, table }) => <SttCell index={row.index} table={table} />,
    },
    {
      id: "maBN",
      header: "Mã BN",
      size: 124,
      accessorFn: (p) => [p.maBN, p.maBNHIS].filter(Boolean).join(" "),
      enableSorting: false,
      meta: { noTruncate: true },
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex flex-col items-start">
            <span className="font-mono font-bold text-[var(--navy)] text-[11.5px] px-1.5 py-0.5 rounded bg-[var(--surface-soft)] border border-[var(--line)] whitespace-nowrap">
              {p.maBN || "—"}
            </span>
            {p.maBNHIS && (
              <span className="text-[10.5px] font-mono text-[var(--mute)] mt-0.5 whitespace-nowrap">HIS {p.maBNHIS}</span>
            )}
          </div>
        );
      },
    },
    {
      id: "hoTen",
      accessorKey: "hoTen",
      header: "Họ và tên",
      size: 210,
      meta: { noTruncate: true },
      cell: ({ row }) => {
        const p = row.original;
        const age = ageOf(p) || (p.namSinh ? new Date().getFullYear() - p.namSinh : null);
        return (
          <div className="min-w-0">
            <div className="font-bold text-[13px] text-[var(--ink)] truncate" title={p.hoTen}>
              {p.hoTen}
            </div>
            <div className="text-[11px] text-[var(--mute)] mt-0.5 truncate">
              {[p.gioiTinh, age ? `${age} tuổi` : null, p.namSinh ? `NS ${p.namSinh}` : null].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
        );
      },
    },
    {
      id: "lienHe",
      header: "Liên hệ / Địa chỉ",
      size: 230,
      accessorFn: (p) =>
        [p.sdt, p.sdtNguoiNha, p.cccd, p.diaChi, p.khuPho, p.xaPhuong].filter(Boolean).join(" "),
      enableSorting: false,
      enableColumnFilter: false,
      meta: { noTruncate: true },
      cell: ({ row }) => {
        const p = row.original;
        const addr = p.diaChi || [p.khuPho, p.xaPhuong].filter(Boolean).join(", ") || "—";
        return (
          <div className="min-w-0">
            {p.sdt ? (
              <div className="font-mono text-[11.5px] font-semibold text-[var(--ink)] flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-[var(--mute)] shrink-0" />
                {p.sdt}
              </div>
            ) : (
              <span className="text-[11px] text-[var(--mute-soft)]">Chưa có SĐT</span>
            )}
            <div className="text-[11px] text-[var(--mute)] truncate mt-0.5" title={addr}>
              {addr}
            </div>
          </div>
        );
      },
    },
    {
      id: "buoiKham",
      header: "Đợt khám",
      size: 160,
      accessorFn: (p) =>
        [p.buoiKham?.xa, p.buoiKham?.diaDiem, p.buoiKham?.ngayKham ? fmtDate(p.buoiKham.ngayKham) : ""]
          .filter(Boolean)
          .join(" "),
      enableSorting: false,
      enableColumnFilter: false,
      meta: { noTruncate: true },
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="min-w-0">
            <div className="font-semibold text-[var(--ink)] text-[12px] truncate" title={p.buoiKham?.diaDiem || p.buoiKham?.xa || ""}>
              {p.buoiKham?.xa || "—"}
            </div>
            <div className="text-[11px] text-[var(--mute)] font-mono mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 shrink-0" />
              {p.buoiKham?.ngayKham ? fmtDate(p.buoiKham.ngayKham) : "—"}
            </div>
          </div>
        );
      },
    },
    {
      id: "chanDoan",
      header: "Chẩn đoán",
      size: 240,
      accessorFn: (p) => diagnosisOf(p) || p.chanDoanKhac || "",
      enableSorting: false,
      meta: { flex: true, noTruncate: true },
      cell: ({ row }) => {
        const p = row.original;
        const detailDiag = diagnosisOf(p) || p.chanDoanKhac || "—";
        return (
          <div className="min-w-0">
            <div className="text-[12px] text-[var(--ink)] font-medium line-clamp-2 leading-snug" title={detailDiag}>
              {detailDiag}
            </div>
            {(p.thiLucMP || p.thiLucMT) && (
              <div className="text-[10.5px] text-[var(--mute)] font-mono mt-0.5">
                TL MP {p.thiLucMP || "—"} · MT {p.thiLucMT || "—"}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "nhom",
      header: "Nhóm",
      size: 64,
      enableSorting: false,
      enableColumnFilter: false,
      meta: { align: "center", noTruncate: true },
      cell: ({ row }) => {
        const { isNhomA, isNhomB } = classifyCSRNhom(row.original);
        if (isNhomA)
          return (
            <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold bg-[var(--rose-soft)] text-[var(--rose)] border border-rose-200/70">
              A
            </span>
          );
        if (isNhomB)
          return (
            <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold bg-[var(--amber-soft)] text-[var(--amber-deep)] border border-amber-200/70">
              B
            </span>
          );
        return <span className="text-[var(--mute-soft)] text-[12px] font-mono">—</span>;
      },
    },
    {
      id: "bhyt",
      header: "Thẻ BHYT",
      size: 150,
      accessorFn: (p) => p.bhyt || "",
      enableSorting: false,
      meta: { noTruncate: true },
      cell: ({ row }) => {
        const p = row.original;
        if (!hasBhyt(p)) return <span className="text-[11px] text-[var(--mute-soft)]">Không có</span>;
        return (
          <div>
            <div className="font-mono text-[11.5px] font-bold text-indigo-700">{p.bhyt}</div>
            <div className="text-[10.5px] text-[var(--mute)] mt-0.5">
              Mức hưởng <b className="font-mono text-[var(--ink-soft)]">{p.mucHuongBHYT ? `${p.mucHuongBHYT}%` : bhytLevel(p.bhyt)}</b>
            </div>
          </div>
        );
      },
    },
    {
      id: "bacSi",
      header: "Bác sĩ / TVV",
      size: 170,
      accessorFn: (p) => [p.bacSiChiDinh || p.buoiKham?.bacSiKham, p.nhanVienTuVan].filter(Boolean).join(" "),
      enableSorting: false,
      meta: { noTruncate: true },
      cell: ({ row }) => {
        const p = row.original;
        const doctor = p.bacSiChiDinh || p.buoiKham?.bacSiKham || "";
        return (
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-[var(--ink)] truncate" title={doctor}>
              {doctor || "—"}
            </div>
            {p.nhanVienTuVan && (
              <div className="text-[11px] text-[var(--mute)] truncate mt-0.5" title={p.nhanVienTuVan}>
                TV: {p.nhanVienTuVan}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "trangThai",
      header: "Trạng thái",
      size: 160,
      accessorFn: (p) => statusOf(p.trangThai).label,
      enableSorting: false,
      meta: { noTruncate: true },
      cell: ({ row }) => {
        const p = row.original;
        const { isDaMo, isDenKhongMo } = classifyCSRNhom(p);
        const st = statusOf(p.trangThai);
        return (
          <div>
            <StatusBadge label={st.label} cls={st.cls} sm />
            {isDaMo && (
              <div className="text-[10.5px] font-bold text-[var(--teal-deep)] mt-1 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                {p.ngayMoThucTe ? `Mổ ${fmtDate(p.ngayMoThucTe)}` : "Đã mổ"}
              </div>
            )}
            {isDenKhongMo && (
              <div className="text-[10.5px] font-bold text-[var(--amber-deep)] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                Đến chưa mổ{p.trangThaiDieuTri === "Hủy" ? " (Hủy)" : ""}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      size: 56,
      enableSorting: false,
      enableColumnFilter: false,
      enableHiding: false,
      meta: { align: "center", noTruncate: true },
      cell: ({ row }) => (
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setSelectedHoSoId(row.original.id)}
            title="Xem chi tiết hồ sơ"
            aria-label="Xem chi tiết hồ sơ"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--mute)] hover:text-[var(--navy)] hover:border-[var(--navy)]/30 hover:bg-[var(--navy-soft)] transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ], []);

  // Xuất Excel đúng các dòng đang hiển thị trong bảng
  const exportModalExcel = (rowsToExport: any[]) => {
    try {
      if (isSessionView) {
        const rows = (rowsToExport as SessionItem[]).map((s, idx) => ({
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
          "Tỷ lệ mổ (%)": `${tyLeMo(s) ?? 0}%`,
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachDotKham");
        XLSX.writeFile(wb, `Danh_Sach_Dot_Kham_CSR_${new Date().toISOString().slice(0, 10)}.xlsx`);
        addToast({ type: "success", message: `Đã xuất ${rows.length} đợt khám ra file Excel!` });
        return;
      }

      const rows = rowsToExport.map((p, idx) => {
        const age = ageOf(p) || (p.namSinh ? new Date().getFullYear() - p.namSinh : "");
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
          "Chẩn đoán chi tiết": diagnosisOf(p) || p.chanDoanKhac || "",
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
      const sheetName = (target?.title || "BaoCaoChiTiet").replace(/[^a-zA-Z0-9_À-ɏḀ-ỿ]/g, "_").slice(0, 30);
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

  // Nhãn kỳ đang xem: ưu tiên khoảng ngày cụ thể trang cha truyền vào.
  const periodLabel =
    from || to
      ? from && to && from === to
        ? fmtDate(from)
        : `${from ? fmtDate(from) : "…"} – ${to ? fmtDate(to) : "nay"}`
      : dateFilter === "30days"
      ? "30 ngày qua"
      : dateFilter === "90days"
      ? "90 ngày qua"
      : dateFilter === "year"
      ? "Năm nay"
      : "Toàn thời gian";

  const patientFilters = (
    <>
      <ToolbarSelect icon={Layers} ariaLabel="Lọc theo nhóm" className="w-[210px]"
        options={withCounts(GROUP_OPTIONS, filterCounts.group)}
        value={groupFilter} active={groupFilter !== "ALL"} onChange={(v) => setGroupFilter(v as GroupFilter)} />
      <ToolbarSelect icon={Scissors} ariaLabel="Lọc theo tình trạng mổ" className="w-[210px]"
        options={withCounts(SURGERY_OPTIONS, filterCounts.surgery)}
        value={surgeryFilter} active={surgeryFilter !== "ALL"} onChange={(v) => setSurgeryFilter(v as SurgeryFilter)} />
      <ToolbarSelect icon={CreditCard} ariaLabel="Lọc theo BHYT" className="w-[180px]"
        options={withCounts(BHYT_OPTIONS, filterCounts.bhyt)}
        value={bhytFilter} active={bhytFilter !== "ALL"} onChange={(v) => setBhytFilter(v as BhytFilter)} />
    </>
  );

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={
          <span className="flex items-center gap-2.5 min-w-0">
            <span className="truncate">{target.title}</span>
            <span className="shrink-0 px-2 py-0.5 rounded-md font-mono text-[11.5px] font-bold bg-[var(--navy-soft)] text-[var(--navy)] border border-[var(--navy)]/10">
              {fN(isSessionView ? allSessions.length : data.length)} {isSessionView ? "đợt" : "hồ sơ"}
            </span>
          </span>
        }
        subtitle={
          <span className="flex items-center gap-1.5 flex-wrap">
            <span>{target.subtitle || "Danh sách chi tiết theo kỳ đang lọc"}</span>
            <span className="text-[var(--mute-soft)]">·</span>
            <span className="text-[var(--navy)] font-semibold">{coSoName || "Tất cả cơ sở"}</span>
            <span className="text-[var(--mute-soft)]">·</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11.5px] text-[var(--ink-soft)]">
              <Calendar className="w-3 h-3 text-[var(--teal-deep)]" />
              {periodLabel}
            </span>
          </span>
        }
        icon={Icon}
        maxWidth="w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh]!"
        noPadding
        bodyClassName="flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        <div className="flex-1 min-h-0 flex flex-col bg-[var(--surface)] overflow-hidden">
          <DataView<any, unknown>
            key={target.type + (target.val || "")}
            columns={(isSessionView ? sessionColumns : patientColumns) as ColumnDef<any, unknown>[]}
            data={isSessionView ? allSessions : filteredPatients}
            pageSize={15}
            isLoading={loading}
            fullHeight
          >
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <DataToolbar
                searchPlaceholder={
                  isSessionView ? "Tìm theo xã, điểm khám, bác sĩ, ngày khám…" : "Tìm tên, SĐT, CCCD, mã BN, chẩn đoán, bác sĩ…"
                }
                filters={isSessionView ? undefined : patientFilters}
                primaryAction={<ExportButton onExport={exportModalExcel} />}
              />
              <DataTable
                dense
                striped
                headerVariant="subtle"
                emptyIcon={isSessionView ? Calendar : Users}
                emptyTitle={isSessionView ? "Không tìm thấy đợt khám phù hợp" : "Không tìm thấy bệnh nhân phù hợp"}
                emptyDesc="Thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc."
                onRowClick={!isSessionView ? (row: any) => setSelectedHoSoId(row.id) : undefined}
              />
              <DataPagination pageSizeOptions={[15, 30, 50, 100]} />
            </div>
          </DataView>
        </div>
      </Modal>

      {selectedHoSoId && (
        <PatientInfoModal hoSoId={selectedHoSoId} onClose={() => setSelectedHoSoId(null)} />
      )}
    </>
  );
}
