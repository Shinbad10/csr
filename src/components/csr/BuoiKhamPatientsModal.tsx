"use client";

import React, { useState, useEffect, useMemo } from "react";
import Modal from "@/components/layout/Modal";
import {
  Users, Calendar, MapPin, UserCheck, Loader2, CheckCircle2, Clock, Phone,
  FileSpreadsheet, Download, ChevronDown, FileText,
} from "lucide-react";
import {
  fmtDate, fmtBuoiKhamName, fmtBuoiKhamCode, ageOf, parseDiag, checkSurgeryTiming, classifyCSRNhom, bhytLevel, type HoSo,
} from "@/lib/csr";
import { useToast } from "@/components/providers/ToastProvider";
import { DataView, DataToolbar, DataTable, DataPagination } from "@/components/data";
import { type ColumnDef } from "@tanstack/react-table";
import { PatientInfoModal } from "@/components/csr/PatientModals";
import { cn } from "@/lib/utils";

interface BuoiKhamSummary {
  id: string;
  ngayKham: string;
  xa: string;
  diaDiem: string;
  bacSiKham?: string | null;
  ghiChu?: string | null;
  coSo?: { ten: string };
  _count?: { hoSo: number };
}

type PatientFilter = "ALL" | "A" | "B" | "DA_MO" | "DA_MO_TRUOC" | "CHUA_MO" | "PHACO_2_LAN";

interface BuoiKhamPatientsModalProps {
  open: boolean;
  onClose: () => void;
  buoiKham: BuoiKhamSummary | null;
  initialFilter?: PatientFilter;
}

/** SĐT hợp lệ tối thiểu — dữ liệu nhập cũ có nhiều giá trị "0" / "-" thay cho "không có". */
const validPhone = (s?: string | null) => (s && s.replace(/\D/g, "").length >= 8 ? s : "");

/** Danh sách chẩn đoán của một mắt: mảng JSON + ô "khác" → mảng chuỗi sạch. */
const diagOf = (raw?: string | null, other?: string | null) =>
  [...parseDiag(raw ?? null), ...(other ? [other] : [])].map((d) => String(d).trim()).filter(Boolean);

function EyeLine({ eye, items }: { eye: "MP" | "MT"; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex items-baseline gap-1.5 min-w-0">
      <span className="shrink-0 font-mono text-[9.5px] font-bold px-1 rounded-[4px] bg-[var(--line-soft)] text-[var(--mute)]">{eye}</span>
      <span className="text-[12px] text-[var(--ink)] truncate" title={items.join(", ")}>{items.join(", ")}</span>
    </div>
  );
}

export default function BuoiKhamPatientsModal({
  open,
  onClose,
  buoiKham,
  initialFilter = "ALL",
}: BuoiKhamPatientsModalProps) {
  const { addToast } = useToast();
  const [selectedHoSoId, setSelectedHoSoId] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const h = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setExportMenuOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [exportMenuOpen]);

  const handleExport = async (format: "khamSucKhoe" | "default" = "khamSucKhoe") => {
    if (!buoiKham?.id || exportingFormat) return;
    setExportingFormat(format);
    try {
      const res = await fetch(`/api/csr/export?buoiKhamId=${encodeURIComponent(buoiKham.id)}&format=${format}`);
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
        const dateStr = buoiKham.ngayKham ? new Date(buoiKham.ngayKham).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
        const cleanXa = (buoiKham.xa || "KhamMat").replace(/[^a-zA-Z0-9_À-ɏḀ-ỿ]/g, "_");
        filename = format === "khamSucKhoe" ? `Kham_Suc_Khoe_${cleanXa}_${dateStr}.xlsx` : `Danh_Sach_Kham_Mat_${cleanXa}_${dateStr}.xlsx`;
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast({
        type: "success",
        title: "Xuất Excel thành công",
        message:
          format === "khamSucKhoe"
            ? `Đã tải file khám sức khỏe ${buoiKham.xa || fmtBuoiKhamName(buoiKham)} (mẫu 101 cột)`
            : `Đã tải file danh sách bệnh nhân ${buoiKham.xa || fmtBuoiKhamName(buoiKham)} (mẫu Google Sheet)`,
      });
    } catch (err) {
      addToast({ type: "error", title: "Lỗi xuất file", message: err instanceof Error ? err.message : "Có lỗi xảy ra khi xuất file Excel" });
    } finally {
      setExportingFormat(null);
    }
  };

  /* Dữ liệu gắn với id đợt đã nạp: đổi đợt / mở lại thì tự coi như đang tải — khỏi reset state trong effect. */
  const bkId = open ? buoiKham?.id ?? null : null;
  const [loaded, setLoaded] = useState<{ id: string; data: HoSo[] } | null>(null);
  const patients = useMemo(() => (bkId && loaded?.id === bkId ? loaded.data : []), [bkId, loaded]);
  const loading = !!bkId && loaded?.id !== bkId;

  useEffect(() => {
    if (!bkId) return;
    let cancelled = false;
    fetch(`/api/csr/hoso?buoiKhamId=${encodeURIComponent(bkId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .catch((err) => {
        console.error("Lỗi lấy danh sách bệnh nhân đợt khám:", err);
        return [];
      })
      .then((data: HoSo[]) => {
        if (!cancelled) setLoaded({ id: bkId, data });
      });
    return () => {
      cancelled = true;
    };
  }, [bkId]);

  /* Bộ lọc nhóm: mỗi lần mở (đợt / bộ lọc ban đầu khác) bắt đầu lại từ `initialFilter`. */
  const filterKey = `${bkId}|${initialFilter}`;
  const [filterState, setFilterState] = useState<{ key: string; f: PatientFilter }>({ key: "", f: "ALL" });
  const groupFilter: PatientFilter = filterState.key === filterKey ? filterState.f : initialFilter || "ALL";
  const setGroupFilter = (f: PatientFilter) => setFilterState({ key: filterKey, f });

  /* Phân loại mỗi hồ sơ một lần — dùng CHUNG hàm của hệ thống (classifyCSRNhom / checkSurgeryTiming)
     để số đếm ở đây khớp với cột "Phân nhóm" & "Tiến độ mổ" trên danh sách đợt khám. */
  const classified = useMemo(
    () =>
      patients.map((p) => {
        const nhom = classifyCSRNhom(p);
        const timing = checkSurgeryTiming(p, buoiKham?.ngayKham);
        return { p, nhom, timing };
      }),
    [patients, buoiKham?.ngayKham],
  );

  const match = (x: (typeof classified)[number], f: PatientFilter) => {
    switch (f) {
      case "A": return x.nhom.isNhomA;
      case "B": return x.nhom.isNhomB;
      case "DA_MO": return x.timing.isDaMo;
      case "DA_MO_TRUOC": return x.timing.isDaMoTruoc;
      case "CHUA_MO": return x.nhom.isNhomA && !x.timing.hasSurgery;
      case "PHACO_2_LAN": return Boolean(x.p.isPhaco2Lan);
      default: return true;
    }
  };

  const tabs: { key: PatientFilter; label: string; tone: string }[] = [
    { key: "ALL", label: "Tất cả", tone: "" },
    { key: "A", label: "Nhóm A", tone: "text-[var(--rose)]" },
    { key: "B", label: "Nhóm B", tone: "text-[var(--amber-deep)]" },
    { key: "CHUA_MO", label: "Chờ mổ", tone: "text-[var(--amber-deep)]" },
    { key: "DA_MO", label: "Đã mổ", tone: "text-[var(--teal-deep)]" },
    { key: "DA_MO_TRUOC", label: "Mổ trước", tone: "text-[#7c3aed]" },
    { key: "PHACO_2_LAN", label: "Mắt 2", tone: "text-[#7c3aed]" },
  ];
  const counts = Object.fromEntries(tabs.map((t) => [t.key, classified.filter((x) => match(x, t.key)).length])) as Record<PatientFilter, number>;

  const filtered = useMemo(
    () => classified.filter((x) => match(x, groupFilter)).map((x) => x.p),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [classified, groupFilter],
  );

  const columns = useMemo<ColumnDef<HoSo>[]>(() => [
    {
      id: "stt",
      header: "STT",
      size: 56,
      enableSorting: false,
      enableColumnFilter: false,
      meta: { align: "center" },
      accessorFn: (p) => p.stt ?? 0,
      cell: ({ row, table }) => {
        const { pageIndex = 0, pageSize = 15 } = table.getState().pagination || {};
        return (
          <span className="font-mono text-[12px] text-[var(--mute)] tabular-nums">
            {row.original.stt ? row.original.stt : pageIndex * pageSize + row.index + 1}
          </span>
        );
      },
    },
    {
      id: "benhNhan",
      header: "Bệnh nhân",
      size: 250,
      accessorFn: (p) => [p.hoTen, p.maBN, p.maBNHIS, p.cccd].filter(Boolean).join(" "),
      sortingFn: (a, b) => a.original.hoTen.localeCompare(b.original.hoTen, "vi"),
      meta: { noTruncate: true },
      cell: ({ row }) => {
        const p = row.original;
        const age = ageOf(p) || (p.namSinh ? new Date().getFullYear() - p.namSinh : null);
        return (
          <div className="min-w-0">
            <div className="font-semibold text-[13px] text-[var(--ink)] truncate" title={p.hoTen}>{p.hoTen}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--mute)] whitespace-nowrap min-w-0">
              <span className="font-mono font-bold text-[var(--navy)]">{p.maBN || p.id.slice(-6)}</span>
              <span className="text-[var(--mute-soft)]">·</span>
              <span>{[p.gioiTinh, age ? `${age} tuổi` : null].filter(Boolean).join(" · ") || "—"}</span>
              {p.maBNHIS && (
                <>
                  <span className="text-[var(--mute-soft)]">·</span>
                  <span className="font-mono truncate" title="Mã bệnh nhân HIS">HIS {p.maBNHIS}</span>
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "lienHe",
      header: "Liên hệ",
      size: 210,
      accessorFn: (p) => [p.sdt, p.sdtNguoiNha, p.diaChi].filter(Boolean).join(" "),
      enableSorting: false,
      enableColumnFilter: false,
      meta: { noTruncate: true },
      cell: ({ row }) => {
        const p = row.original;
        const phone = validPhone(p.sdt) || validPhone(p.sdtNguoiNha);
        return (
          <div className="min-w-0">
            {phone ? (
              <div className="flex items-center gap-1.5 font-mono text-[12px] text-[var(--ink)] tabular-nums">
                <Phone className="w-3 h-3 text-[var(--mute)] shrink-0" />
                {phone}
                {!validPhone(p.sdt) && <span className="font-sans text-[10px] text-[var(--mute)]">(người nhà)</span>}
              </div>
            ) : (
              <span className="text-[11.5px] text-[var(--mute-soft)]">Chưa có SĐT</span>
            )}
            <div className="text-[11px] text-[var(--mute)] truncate mt-0.5" title={p.diaChi || ""}>{p.diaChi || "—"}</div>
          </div>
        );
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
        if (!p.bhyt) return <span className="text-[11.5px] text-[var(--mute-soft)]">Không có</span>;
        return (
          <div className="min-w-0">
            <div className="font-mono text-[11.5px] font-semibold text-indigo-700 truncate" title={p.bhyt}>{p.bhyt}</div>
            <div className="text-[10.5px] text-[var(--mute)]">
              Mức hưởng <b className="font-mono text-[var(--ink-soft)]">{p.mucHuongBHYT ? `${p.mucHuongBHYT}%` : bhytLevel(p.bhyt)}</b>
            </div>
          </div>
        );
      },
    },
    {
      id: "thiLuc",
      header: "Thị lực",
      size: 100,
      enableSorting: false,
      enableColumnFilter: false,
      meta: { noTruncate: true },
      cell: ({ row }) => {
        const p = row.original;
        if (!p.thiLucMP && !p.thiLucMT) return <span className="text-[var(--mute-soft)] text-[12px]">—</span>;
        return (
          <div className="font-mono text-[11.5px] tabular-nums leading-[1.5]">
            <div><span className="text-[var(--mute)]">MP</span> <b className="text-[var(--ink)]">{p.thiLucMP || "—"}</b></div>
            <div><span className="text-[var(--mute)]">MT</span> <b className="text-[var(--ink)]">{p.thiLucMT || "—"}</b></div>
          </div>
        );
      },
    },
    {
      id: "chanDoan",
      header: "Chẩn đoán",
      size: 240,
      meta: { flex: true, noTruncate: true },
      enableSorting: false,
      accessorFn: (p) =>
        [...diagOf(p.chanDoanMP, p.chanDoanKhacMP), ...diagOf(p.chanDoanMT, p.chanDoanKhacMT), ...diagOf(p.chanDoan, p.chanDoanKhac)].join(" "),
      cell: ({ row }) => {
        const p = row.original;
        const mp = diagOf(p.chanDoanMP, p.chanDoanKhacMP);
        const mt = diagOf(p.chanDoanMT, p.chanDoanKhacMT);
        if (mp.length || mt.length) {
          return (
            <div className="space-y-0.5 min-w-0">
              <EyeLine eye="MP" items={mp} />
              <EyeLine eye="MT" items={mt} />
            </div>
          );
        }
        const all = diagOf(p.chanDoan, p.chanDoanKhac);
        return all.length ? (
          <div className="text-[12px] text-[var(--ink)] truncate" title={all.join(", ")}>{all.join(", ")}</div>
        ) : (
          <span className="text-[11.5px] text-[var(--mute-soft)]">Chưa chẩn đoán</span>
        );
      },
    },
    {
      id: "nhom",
      header: "Phân nhóm",
      size: 132,
      enableSorting: false,
      enableColumnFilter: false,
      meta: { noTruncate: true },
      cell: ({ row }) => {
        const p = row.original;
        const { isNhomA, isNhomB } = classifyCSRNhom(p);
        const sub = p.huongXuTri || p.khuyenNghi;
        if (!isNhomA && !isNhomB) return <span className="text-[11.5px] text-[var(--mute-soft)]">Chưa phân nhóm</span>;
        return (
          <div className="min-w-0">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11.5px] font-semibold whitespace-nowrap",
                isNhomA ? "bg-[var(--rose-soft)] text-[var(--rose)]" : "bg-[var(--amber-soft)] text-[var(--amber-deep)]",
              )}
            >
              <span className="w-[5px] h-[5px] rounded-full bg-current" />
              {isNhomA ? "Nhóm A" : "Nhóm B"}
            </span>
            {sub && <div className="text-[10.5px] text-[var(--mute)] mt-0.5 truncate">{sub}</div>}
          </div>
        );
      },
    },
    {
      id: "bacSi",
      header: "Bác sĩ khám",
      size: 160,
      accessorFn: (p) => p.bacSiChiDinh || "",
      cell: ({ row }) =>
        row.original.bacSiChiDinh ? (
          <span className="text-[12.5px] text-[var(--ink-soft)] truncate block" title={row.original.bacSiChiDinh}>{row.original.bacSiChiDinh}</span>
        ) : (
          <span className="text-[var(--mute-soft)] text-[12px]">—</span>
        ),
    },
    {
      id: "trangThaiMo",
      header: "Trạng thái mổ",
      size: 140,
      enableSorting: false,
      enableColumnFilter: false,
      meta: { noTruncate: true },
      cell: ({ row }) => {
        const p = row.original;
        const { isNhomA } = classifyCSRNhom(p);
        const timing = checkSurgeryTiming(p, buoiKham?.ngayKham);
        const badge = (cls: string, icon: React.ReactNode, label: string) => (
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11.5px] font-semibold whitespace-nowrap", cls)}>
            {icon}
            {label}
          </span>
        );
        if (timing.isDaMo || timing.isDaMoTruoc) {
          return (
            <div className="min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                {timing.isDaMo
                  ? badge("bg-[var(--teal-soft)] text-[var(--teal-deep)]", <CheckCircle2 className="w-3 h-3" />, "Đã mổ")
                  : badge("bg-[#f3eaf8] text-[#7c3aed]", null, "Mổ trước")}
                {p.isPhaco2Lan && (
                  <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-semibold bg-[#f3eaf8] text-[#7c3aed]" title="Đã mổ Phaco 2 lần (mắt 2)">Mắt 2</span>
                )}
              </div>
              {p.ngayMoThucTe && <div className="mt-0.5 font-mono text-[10.5px] text-[var(--mute)] tabular-nums">{fmtDate(p.ngayMoThucTe)}</div>}
            </div>
          );
        }
        if (isNhomA) return badge("bg-[var(--amber-soft)] text-[var(--amber-deep)]", <Clock className="w-3 h-3" />, "Chờ mổ");
        return <span className="text-[var(--mute-soft)] text-[12px]">—</span>;
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
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--mute)] hover:text-[var(--navy)] hover:border-[var(--navy)]/30 hover:bg-[var(--navy-50)] transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ], [buoiKham?.ngayKham]);

  if (!buoiKham) return null;

  const exportDisabled = !!exportingFormat || patients.length === 0;
  const exportBtn =
    "inline-flex items-center gap-1.5 h-9 px-3 border border-[var(--teal)]/30 bg-[var(--teal-soft)] text-[12px] font-semibold text-[var(--teal-deep)] hover:bg-[var(--teal)] hover:border-[var(--teal)] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={
          <span className="flex items-center gap-2.5 min-w-0">
            <span className="truncate">{fmtBuoiKhamName(buoiKham)}</span>
            <span className="shrink-0 font-mono text-[11.5px] font-bold px-2 py-0.5 rounded-md bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy)]/10">
              {fmtBuoiKhamCode(buoiKham.id)}
            </span>
          </span>
        }
        subtitle={
          <span className="flex items-center gap-x-3 gap-y-1 flex-wrap">
            <span className="inline-flex items-center gap-1 font-mono text-[11.5px] text-[var(--ink-soft)]">
              <Calendar className="w-3 h-3 text-[var(--teal-deep)]" />
              {fmtDate(buoiKham.ngayKham)}
            </span>
            {buoiKham.diaDiem && (
              <span className="inline-flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{buoiKham.diaDiem}</span>
              </span>
            )}
            {buoiKham.bacSiKham && (
              <span className="inline-flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                {buoiKham.bacSiKham}
              </span>
            )}
          </span>
        }
        icon={Users}
        maxWidth="w-[95vw] max-w-[95vw] h-[92vh] max-h-[92vh]!"
        noPadding
        bodyClassName="flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        <DataView<HoSo, unknown> key={buoiKham.id} columns={columns} data={filtered} pageSize={15} isLoading={loading} fullHeight>
          <div className="flex-1 min-h-0 flex flex-col bg-[var(--surface)] overflow-hidden">
            {/* Tab lọc nhanh (gạch chân + số đếm) */}
            <div className="shrink-0 flex gap-1 px-3 sm:px-5 border-b border-[var(--line)] overflow-x-auto no-scrollbar">
              {tabs
                .filter((t) => t.key === "ALL" || t.key === "A" || t.key === "B" || counts[t.key] > 0 || groupFilter === t.key)
                .map((t) => {
                  const active = groupFilter === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setGroupFilter(t.key)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 -mb-px border-b-2 text-[12.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer",
                        active ? "border-[var(--navy)] text-[var(--navy)]" : cn("border-transparent hover:text-[var(--ink)]", t.tone || "text-[var(--mute)]"),
                      )}
                    >
                      {t.label}
                      <span
                        className={cn(
                          "text-[10px] font-bold font-mono tabular-nums px-1.5 py-0.5 rounded-md",
                          active ? "bg-[var(--navy-50)] text-[var(--navy)]" : "bg-[var(--line)] text-[var(--mute)]",
                        )}
                      >
                        {counts[t.key]}
                      </span>
                    </button>
                  );
                })}
            </div>

            <DataToolbar
              searchPlaceholder="Tìm họ tên, SĐT, CCCD, mã BN, chẩn đoán…"
              primaryAction={
                <div className="relative" ref={exportMenuRef}>
                  <div className="inline-flex">
                    <button
                      type="button"
                      onClick={() => handleExport("khamSucKhoe")}
                      disabled={exportDisabled}
                      className={cn(exportBtn, "rounded-l-xl")}
                      title="Xuất Excel theo mẫu Khám Sức Khỏe (101 cột chuẩn HIS)"
                    >
                      {exportingFormat === "khamSucKhoe" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      Xuất Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportMenuOpen((o) => !o)}
                      disabled={exportDisabled}
                      className={cn(exportBtn, "rounded-r-xl border-l-0 px-2", exportMenuOpen && "bg-[var(--teal)] text-white")}
                      title="Chọn mẫu xuất Excel"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {exportMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-[var(--surface)] border border-[var(--line-strong)] rounded-[12px] shadow-[var(--shadow-lg)] p-1 z-50 animate-dropdown">
                      {[
                        { f: "khamSucKhoe" as const, label: "Mẫu Khám Sức Khỏe (101 cột)", hint: "Mẫu chuẩn nộp HIS & trạm y tế", icon: "text-[var(--teal-deep)]" },
                        { f: "default" as const, label: "Mẫu Google Sheet (25 cột)", hint: "Danh sách khám sàng lọc", icon: "text-[var(--mute)]" },
                      ].map((o) => (
                        <button
                          key={o.f}
                          type="button"
                          onClick={() => { setExportMenuOpen(false); handleExport(o.f); }}
                          className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-[8px] text-left hover:bg-[var(--navy-50)] transition-colors cursor-pointer"
                        >
                          <FileSpreadsheet className={cn("w-4 h-4 mt-px shrink-0", o.icon)} />
                          <div>
                            <div className="text-[12.5px] font-semibold text-[var(--ink)] leading-tight">{o.label}</div>
                            <div className="text-[10.5px] text-[var(--mute)] mt-0.5">{o.hint}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              }
            />

            <DataTable
              dense
              emptyIcon={Users}
              emptyTitle={patients.length === 0 ? "Chưa có bệnh nhân nào trong đợt khám này" : "Không tìm thấy bệnh nhân phù hợp"}
              emptyDesc={
                patients.length === 0
                  ? "Bệnh nhân sẽ xuất hiện tại đây khi được tiếp nhận vào đợt khám."
                  : "Thử đổi từ khóa tìm kiếm hoặc chọn nhóm khác."
              }
              onRowClick={(row: HoSo) => setSelectedHoSoId(row.id)}
            />
            <DataPagination pageSizeOptions={[15, 30, 50, 100]} />
          </div>
        </DataView>
      </Modal>

      {selectedHoSoId && <PatientInfoModal hoSoId={selectedHoSoId} onClose={() => setSelectedHoSoId(null)} />}
    </>
  );
}
