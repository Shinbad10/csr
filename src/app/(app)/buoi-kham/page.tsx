"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import {
  Plus, Search, Calendar, CalendarDays, MapPin, Loader2, Check, X,
  Stethoscope, Pencil, FolderOpen, Lock, FileSpreadsheet, UserCheck,
  RotateCcw, ChevronDown, Eye, CheckCheck, AlertTriangle, MoreVertical
} from "lucide-react";
import { can } from "@/lib/permissions";
import { fmtDate, fmtBuoiKhamName, fmtBuoiKhamCode, phaseOf } from "@/lib/csr";
import { Field, DateField } from "@/components/csr/fields";
import { DoctorMultiSelect, parseDoctorList, formatDoctorList } from "@/components/csr/DoctorAutocomplete";
import BuoiKhamPatientsModal from "@/components/csr/BuoiKhamPatientsModal";
import { SkeletonTable } from "@/components/layout/Skeleton";
import ImportExcelModal from "@/components/csr/ImportExcelModal";
import { useToast } from "@/components/providers/ToastProvider";
import { useRealtimeEvent } from "@/lib/useRealtime";
import { motion, AnimatePresence } from "framer-motion";

interface CoSo { id: string; ten: string }
interface BuoiKham {
  id: string; coSo: CoSo; coSoId: string; ngayKham: string; xa: string; diaDiem: string;
  bacSiKham?: string | null; ghiChu?: string | null; _count: { hoSo: number };
  stats?: { nhomA: number; nhomB: number; daMo: number; chuaMo: number };
}

type StatusFilter = "ALL" | "DangDienRa" | "SapDienRa" | "DaKetThuc";
type GroupFilter = "ALL" | "HAS_A" | "HAS_B" | "HAS_UNOPERATED";

interface Option<T = string> {
  value: T;
  label: string;
}

/** Dropdown gọn gàng chuẩn VISIHUB với bo góc, bóng mờ và checkmark */
function VISISelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  icon: Icon,
}: {
  value: T;
  onChange: (val: T) => void;
  options: Option<T>[];
  placeholder?: string;
  className?: string;
  icon?: React.ElementType;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", h);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", h);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const selectedOpt = options.find((o) => o.value === value);
  const isFiltered = value !== "ALL" && value !== "";

  return (
    <div className={`relative w-full ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`h-8 px-2 sm:px-2.5 w-full rounded-lg border text-[11px] sm:text-[11.5px] font-bold transition-all cursor-pointer select-none flex items-center justify-between gap-1 text-left ${
          open
            ? "bg-white border-[#02b8a9] text-[#0f172a] shadow-xs ring-2 ring-[#02b8a9]/15"
            : isFiltered
            ? "bg-[#e6faf7] border-[#02b8a9]/40 text-[#018a7f] shadow-2xs"
            : "bg-white border-[#cbd5e1] text-[#334155] hover:border-[#94a3b8] hover:bg-[#f8fafc] shadow-2xs"
        }`}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {Icon && <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${isFiltered ? "text-[#018a7f]" : "text-[#64748b]"}`} />}
          <span className="truncate">{selectedOpt?.label || placeholder}</span>
        </div>
        <ChevronDown
          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 transition-transform duration-200 ${
            isFiltered ? "text-[#018a7f]" : "text-[#64748b]"
          } ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="absolute left-0 sm:left-auto top-full mt-1.5 z-50 min-w-[190px] max-w-[260px] bg-white dark:bg-slate-900 border border-[var(--line-strong)] rounded-xl shadow-xl p-1 text-[var(--ink)] dark:text-slate-200"
          >
            <div className="max-h-[220px] overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[12px] font-semibold transition-colors text-left cursor-pointer ${
                      active
                        ? "bg-[var(--navy)] text-white shadow-2xs font-bold"
                        : "text-[var(--ink)] dark:text-slate-200 hover:bg-[var(--surface-hover)] dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Nút vào đợt khám theo pha ngày khám. */
function JoinAction({ b, block }: { b: BuoiKham; block?: boolean }) {
  const p = phaseOf(b.ngayKham);
  const size = block ? "py-2 px-3 text-[13px] flex-1 justify-center" : "h-7.5 px-3 text-[11.5px] font-bold";
  if (p.key === "DaKetThuc") {
    return (
      <Link
        href={`/kham/${b.id}`}
        className={`btn ${size} inline-flex items-center gap-1.5 border border-[#cbd5e1] bg-white hover:bg-[#f1f5f9] text-[#334155] font-semibold cursor-pointer shadow-2xs`}
      >
        <Eye className="w-3.5 h-3.5 text-[#031da6]" />
        <span>Xem hồ sơ</span>
      </Link>
    );
  }
  if (p.key === "SapDienRa") {
    return (
      <span title={p.hint} className={`btn ${size} font-semibold inline-flex border border-[#cbd5e1] bg-[#f8fafc] text-[#94a3b8] cursor-not-allowed`}>
        Chưa tới ngày
      </span>
    );
  }
  return (
    <Link
      href={`/kham/${b.id}`}
      className={`btn btn-primary ${size} inline-flex items-center gap-1.5 bg-[#031da6] hover:bg-[#020f5c] text-white shadow-2xs font-bold cursor-pointer active:scale-95`}
    >
      <Stethoscope className="w-3.5 h-3.5 text-[#02b8a9]" />
      <span>Tham gia khám</span>
    </Link>
  );
}

/** Cụm thao tác đợt khám tinh gọn, chuẩn UI hiện đại */
function BuoiKhamRowActions({
  b,
  canManage,
  exportingId,
  onExport,
  onEdit,
  onComplete,
}: {
  b: BuoiKham;
  canManage: boolean;
  exportingId: string | null;
  onExport: (b: BuoiKham, format?: "khamSucKhoe" | "default") => void;
  onEdit: (b: BuoiKham) => void;
  onComplete: (b: BuoiKham) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isEnded = phaseOf(b.ngayKham).key === "DaKetThuc";

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousedown", h);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", h);
      window.removeEventListener("keydown", esc);
    };
  }, [menuOpen]);

  return (
    <div className="flex items-center justify-end gap-1.5" ref={ref}>
      {/* Menu thao tác tùy chọn (Xuất Excel, Sửa, Kết thúc đợt) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className={`h-7.5 w-7.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
            menuOpen
              ? "bg-[#031da6] text-white border-[#031da6] shadow-xs"
              : "bg-white border-[#cbd5e1] text-[#475569] hover:bg-[#f1f5f9] hover:border-[#94a3b8] shadow-2xs"
          }`}
          title="Tùy chọn thao tác"
        >
          {exportingId === b.id ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#02b8a9]" />
          ) : (
            <MoreVertical className="w-4 h-4" />
          )}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[230px] bg-white border border-[#cbd5e1] rounded-xl shadow-xl p-1 animate-dropdown text-[#0f172a]">
            {/* Xuất Excel Mẫu Khám Sức Khỏe (101 cột) */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onExport(b, "khamSucKhoe");
              }}
              disabled={exportingId === b.id}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold text-[#018a7f] hover:bg-[#e6faf7] transition-colors text-left cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#02b8a9] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="leading-tight">Xuất Excel (Khám Sức Khỏe)</div>
                <div className="text-[10px] text-[#64748b] font-normal">Mẫu 101 cột nộp HIS / cơ quan</div>
              </div>
            </button>

            {/* Xuất Excel Mẫu Google Sheet (25 cột) */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onExport(b, "default");
              }}
              disabled={exportingId === b.id}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium text-[#334155] hover:bg-[#f1f5f9] transition-colors text-left cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#64748b] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="leading-tight">Xuất Excel (Google Sheet)</div>
                <div className="text-[10px] text-[#94a3b8] font-normal">Mẫu 25 cột danh sách sàng lọc</div>
              </div>
            </button>

            <div className="border-t border-[#f1f5f9] my-1" />

            {canManage && !isEnded && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onComplete(b);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold text-[#b45309] hover:bg-[#fffbeb] transition-colors text-left cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-[#d97706] shrink-0" />
                <span>Kết thúc đợt khám</span>
              </button>
            )}

            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(b);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold text-[#334155] hover:bg-[#f1f5f9] transition-colors text-left cursor-pointer"
              >
                <Pencil className="w-4 h-4 text-[#64748b] shrink-0" />
                <span>Chỉnh sửa đợt khám</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Nút hành động chính (Tham gia khám / Xem hồ sơ / Chưa tới ngày) */}
      <JoinAction b={b} />
    </div>
  );
}

/** A/B liền khối */
function NhomChip({ a, b }: { a: number; b: number }) {
  return (
    <div className="inline-flex rounded-lg overflow-hidden border border-[#cbd5e1] font-mono text-[11px] font-bold shadow-2xs">
      <span className="px-2 py-0.5 bg-[#fef1f4] text-[#e11d48] border-r border-[#e11d48]/20" title="Nhóm A — đã chỉ định mổ">A {a}</span>
      <span className="px-2 py-0.5 bg-[#fef6eb] text-[#d97706]" title="Nhóm B — theo dõi / suy nghĩ / chưa chốt">B {b}</span>
    </div>
  );
}

/** Tiến độ mổ dạng "đã mổ / cần mổ" kèm thanh */
function MoProgress({ done, waiting }: { done: number; waiting: number }) {
  const need = done + waiting;
  if (need === 0) return <span className="text-[#94a3b8] font-mono text-xs">—</span>;
  const pct = Math.round((done / need) * 100);
  return (
    <div className="inline-flex flex-col items-center gap-1 min-w-[76px]" title={`Đã mổ ${done}/${need} ca chỉ định (${pct}%)`}>
      <span className="font-mono text-[11.5px] font-bold text-[#0f172a]">
        {done}<span className="text-[#64748b] font-medium">/{need}</span>
      </span>
      <div className="w-full h-1.5 rounded-full bg-[#e2e8f0] overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#02b8a9] to-[#018a7f] rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
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

  const [list, setList] = useState<BuoiKham[]>([]);
  const [cosos, setCosos] = useState<CoSo[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [q, setQ] = useState("");
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

  const [importOpen, setImportOpen] = useState(false);
  const [viewPatientsBuoiKham, setViewPatientsBuoiKham] = useState<BuoiKham | null>(null);
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

  // Cập nhật danh sách đợt khám & số liệu bệnh nhân thời gian thực (SSE)
  useRealtimeEvent(["buoikham_change", "hoso_change"], () => {
    load();
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
      if (b.bacSiKham) set.add(b.bacSiKham.trim());
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
      if (q.trim()) {
        const matchText = [b.xa, b.diaDiem, b.ghiChu, b.bacSiKham, b.coSo?.ten, fmtBuoiKhamCode(b.id)]
          .some((s) => (s || "").toLowerCase().includes(q.toLowerCase()));
        if (!matchText) return false;
      }
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
      }
      return true;
    });
  }, [list, q, statusFilter, doctorFilter, groupFilter, monthFilter]);

  const hasActiveFilters = q || statusFilter !== "ALL" || doctorFilter !== "ALL" || groupFilter !== "ALL" || monthFilter !== getCurrentMonthKey();

  const resetFilters = () => {
    setQ("");
    setStatusFilter("ALL");
    setDoctorFilter("ALL");
    setGroupFilter("ALL");
    setMonthFilter(getCurrentMonthKey());
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2 sm:gap-3 h-full">
      {/* Main Container: Filter Toolbar + Table với Fixed Height */}
      <div className="flex-1 flex flex-col min-h-0 card p-0 overflow-hidden shadow-xs border-[#cbd5e1]">
        {/* Toolbar Lọc: Tinh giản, thông minh, không rối */}
        <div className="shrink-0 p-2.5 sm:px-3.5 sm:py-2.5 border-b border-[#cbd5e1] bg-[#f8fafc] space-y-2">
          {/* Hàng 1: Ô tìm kiếm & Các nút thao tác */}
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div data-tour="bk-search" className="relative flex-1 max-w-full sm:max-w-[280px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748b]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm xã, điểm khám, mã đợt…"
                className="input-field pl-8 pr-7 bg-white h-8 text-[12px] border-[#cbd5e1] text-[#0f172a] focus:border-[#031da6]"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f172a] cursor-pointer p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Các nút hành động: Nhập Excel, Xuất Excel (Google Sheet), Tổ chức đợt khám */}
            <div className="flex items-center gap-2 shrink-0 ml-auto flex-wrap">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#e11d48] hover:underline cursor-pointer mr-1"
                  title="Xóa tất cả bộ lọc"
                >
                  <RotateCcw className="w-3 h-3" /> Đặt lại
                </button>
              )}

              {canManage && (
                <button
                  type="button"
                  onClick={() => setImportOpen(true)}
                  title="Nhập danh sách bệnh nhân các đợt khám cũ từ file Excel"
                  className="btn btn-secondary h-8 px-2.5 font-bold text-[12px] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#02b8a9]" />
                  <span>Nhập Excel</span>
                </button>
              )}

              <div className="relative" ref={topExportRef}>
                <div className="inline-flex rounded-lg shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleExportPageExcel("khamSucKhoe")}
                    disabled={exportingPage}
                    title="Xuất file Excel toàn bộ bệnh nhân theo mẫu Khám Sức Khỏe (101 cột)"
                    className="btn bg-[#018a7f] hover:bg-[#016e65] text-white h-8 px-2.5 font-bold text-[12px] flex items-center gap-1.5 cursor-pointer rounded-r-none disabled:opacity-50"
                  >
                    {exportingPage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#e6faf7]" />
                    )}
                    <span>Xuất Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopExportOpen((o) => !o)}
                    disabled={exportingPage}
                    title="Tùy chọn mẫu xuất file Excel"
                    className="btn bg-[#017a70] hover:bg-[#01635b] text-white h-8 px-1.5 flex items-center justify-center cursor-pointer rounded-l-none border-l border-white/20 disabled:opacity-50"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {topExportOpen && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#cbd5e1] rounded-xl shadow-xl p-1 z-50 animate-dropdown text-[#0f172a]">
                    <button
                      type="button"
                      onClick={() => {
                        setTopExportOpen(false);
                        handleExportPageExcel("khamSucKhoe");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-[#018a7f] hover:bg-[#e6faf7] transition-colors text-left cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#02b8a9] shrink-0" />
                      <div>
                        <div className="font-bold">Mẫu Khám Sức Khỏe (101 cột)</div>
                        <div className="text-[10.5px] text-[#64748b] font-normal">Mẫu chuẩn nộp HIS / cơ quan</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTopExportOpen(false);
                        handleExportPageExcel("default");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-[#334155] hover:bg-[#f1f5f9] transition-colors text-left cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#64748b] shrink-0" />
                      <div>
                        <div className="font-bold">Mẫu Google Sheet (25 cột)</div>
                        <div className="text-[10.5px] text-[#94a3b8] font-normal">Mẫu danh sách khám sàng lọc</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {canManage && (
                <button
                  data-tour="bk-create"
                  type="button"
                  onClick={openCreateModal}
                  className="btn btn-primary h-8 px-3 font-bold text-[12px] flex items-center gap-1.5 cursor-pointer shadow-2xs bg-[#031da6] hover:bg-[#020f5c] text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tổ chức đợt khám</span>
                </button>
              )}
            </div>
          </div>

          {/* Hàng 2: Status Pills Tabs & Filter Dropdowns (Chia layout không bị cuộn ngang) */}
          <div className="space-y-1.5 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
            {/* 4 Tabs trạng thái: Mobile chia 4 cột vừa khít màn hình */}
            <div className="grid grid-cols-4 sm:flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-[#cbd5e1] shadow-2xs">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-1 sm:px-2.5 py-1 rounded-md text-[10.5px] sm:text-[11.5px] font-bold transition-all cursor-pointer select-none flex items-center justify-center gap-1 ${
                  statusFilter === "ALL"
                    ? "bg-[#031da6] text-white shadow-2xs"
                    : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#031da6]"
                }`}
              >
                <span>Tất cả</span>
                <span className={`text-[9px] sm:text-[10px] px-1 rounded-full font-mono font-bold ${
                  statusFilter === "ALL" ? "bg-white/20 text-white" : "bg-[#f1f5f9] text-[#64748b]"
                }`}>
                  {countsByStatus.ALL}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("DangDienRa")}
                className={`px-1 sm:px-2.5 py-1 rounded-md text-[10.5px] sm:text-[11.5px] font-bold transition-all cursor-pointer select-none flex items-center justify-center gap-1 ${
                  statusFilter === "DangDienRa"
                    ? "bg-[#059669] text-white shadow-2xs"
                    : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#059669]"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden xs:inline-block" />
                <span className="truncate">Đang khám</span>
                <span className={`text-[9px] sm:text-[10px] px-1 rounded-full font-mono font-bold ${
                  statusFilter === "DangDienRa" ? "bg-white/20 text-white" : "bg-[#f1f5f9] text-[#64748b]"
                }`}>
                  {countsByStatus.DangDienRa}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("SapDienRa")}
                className={`px-1 sm:px-2.5 py-1 rounded-md text-[10.5px] sm:text-[11.5px] font-bold transition-all cursor-pointer select-none flex items-center justify-center gap-1 ${
                  statusFilter === "SapDienRa"
                    ? "bg-[#d97706] text-white shadow-2xs"
                    : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#d97706]"
                }`}
              >
                <span className="truncate">Sắp tới</span>
                <span className={`text-[9px] sm:text-[10px] px-1 rounded-full font-mono font-bold ${
                  statusFilter === "SapDienRa" ? "bg-white/20 text-white" : "bg-[#f1f5f9] text-[#64748b]"
                }`}>
                  {countsByStatus.SapDienRa}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("DaKetThuc")}
                className={`px-1 sm:px-2.5 py-1 rounded-md text-[10.5px] sm:text-[11.5px] font-bold transition-all cursor-pointer select-none flex items-center justify-center gap-1 ${
                  statusFilter === "DaKetThuc"
                    ? "bg-[#020f5c] text-white shadow-2xs"
                    : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#031da6]"
                }`}
              >
                <span className="truncate">Đã xong</span>
                <span className={`text-[9px] sm:text-[10px] px-1 rounded-full font-mono font-bold ${
                  statusFilter === "DaKetThuc" ? "bg-white/20 text-white" : "bg-[#f1f5f9] text-[#64748b]"
                }`}>
                  {countsByStatus.DaKetThuc}
                </span>
              </button>
            </div>

            {/* 3 Dropdowns (Tháng, Bác sĩ, Phân nhóm): Mobile chia 3 cột vừa khít */}
            <div className="grid grid-cols-3 sm:flex items-center gap-1.5 shrink-0">
              <VISISelect
                value={monthFilter}
                onChange={setMonthFilter}
                options={monthOptions}
                icon={Calendar}
                placeholder="Tháng"
              />

              <VISISelect
                value={doctorFilter}
                onChange={setDoctorFilter}
                options={doctorOptions}
                icon={UserCheck}
                placeholder="Bác sĩ"
              />

              <VISISelect
                value={groupFilter}
                onChange={setGroupFilter}
                options={groupOptions}
                placeholder="Phân nhóm"
              />
            </div>
          </div>
        </div>

        {/* Danh sách kết quả có Scroll dọc cố định */}
        <div data-tour="bk-table" className="flex-1 min-h-0 overflow-auto">
          {/* Mobile View: Cards Tinh Gọn với Màu Xen Kẽ (Zebra) */}
          <div className="md:hidden divide-y divide-[#e2e8f0]">
            {loading ? (
              <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#031da6]" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-[#64748b] text-[13px] space-y-2 bg-white">
                <div>Không tìm thấy đợt khám nào phù hợp bộ lọc.</div>
                {hasActiveFilters && (
                  <button onClick={resetFilters} className="btn btn-outline text-xs px-3 py-1.5">
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : filtered.map((b, i) => {
              const isOngoing = phaseOf(b.ngayKham).key === "DangDienRa";
              return (
                <div
                  key={b.id}
                  className={`p-3.5 space-y-2 transition-colors border-b border-[#e2e8f0] last:border-b-0 ${
                    isOngoing
                      ? "bg-[#ecfdf5] border-l-[3.5px] border-l-[#059669] shadow-2xs"
                      : i % 2 === 0
                      ? "bg-white hover:bg-[#f1f5f9] border-l-[3.5px] border-l-transparent"
                      : "bg-[#f8fafc] hover:bg-[#f1f5f9] border-l-[3.5px] border-l-slate-300"
                  }`}
                >
                  {/* Hàng 1: Tên đợt khám + Trạng thái */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-[13.5px] text-[#0f172a] leading-snug truncate">{fmtBuoiKhamName(b)}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-[#031da6] bg-[#eef2ff] px-1.5 py-0.5 rounded border border-[#c7d2fe]">
                          {fmtBuoiKhamCode(b.id)}
                        </span>
                        {b.bacSiKham && (
                          <span className="text-[10.5px] text-[#047857] font-semibold flex items-center gap-1 bg-[#ecfdf5] px-1.5 py-0.5 rounded border border-[#a7f3d0]">
                            <UserCheck className="w-3 h-3 text-[#047857]" /> {cleanDoctorName(b.bacSiKham)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        phaseOf(b.ngayKham).key === "DaKetThuc"
                          ? "bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]"
                          : phaseOf(b.ngayKham).key === "DangDienRa"
                          ? "bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]"
                          : "bg-[#fffbeb] text-[#b45309] border-[#fde68a]"
                      }`}>
                        {isOngoing && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block mr-1" />}
                        {phaseOf(b.ngayKham).label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-medium text-[#64748b]">
                        <Calendar className="w-3 h-3 text-[#94a3b8]" /> {fmtDate(b.ngayKham)}
                      </span>
                    </div>
                  </div>

                  {/* Hàng 2: Địa điểm khám (Thoáng, không lồng ô xám) */}
                  <div className="flex items-center gap-1.5 text-[11.5px] text-[#475569]">
                    <MapPin className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />
                    <span className="truncate">{b.diaDiem}</span>
                  </div>

                  {/* Hàng 3: Thống kê & Thao tác */}
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#cbd5e1]/40">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setViewPatientsBuoiKham(b)}
                        className="px-2 py-0.5 font-mono text-[11.5px] font-bold bg-[#eef2ff] hover:bg-[#031da6] text-[#031da6] hover:text-white rounded-md border border-[#c7d2fe] hover:border-[#031da6] transition-all flex items-center gap-1 cursor-pointer shadow-2xs group/btn"
                        title="Bấm để xem danh sách bệnh nhân và kết quả khám"
                      >
                        <span>{b._count?.hoSo ?? 0} BN</span>
                        <Eye className="w-3 h-3 opacity-70 group-hover/btn:opacity-100" />
                      </button>
                      <NhomChip a={b.stats?.nhomA ?? 0} b={b.stats?.nhomB ?? 0} />
                      <MoProgress done={b.stats?.daMo ?? 0} waiting={b.stats?.chuaMo ?? 0} />
                    </div>

                    <BuoiKhamRowActions
                      b={b}
                      canManage={canManage}
                      exportingId={exportingId}
                      onExport={handleExportBuoiKham}
                      onEdit={openEditModal}
                      onComplete={setConfirmCompleteModal}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View: Clean VISIHUB Table with Crisp Light Header & Zebra Striping */}
          <table className="hidden md:table w-full min-w-[920px] text-left border-collapse">
            <thead className="bg-[#f1f5f9] text-[#1e293b] text-[11.5px] font-extrabold uppercase tracking-[0.06em] font-mono sticky top-0 z-10 border-b border-[#cbd5e1] select-none shadow-2xs">
              <tr className="[&>th]:py-3 [&>th]:px-3.5 [&>th]:whitespace-nowrap">
                <th className="w-[50px] text-center text-[#64748b]">STT</th>
                <th>Đợt khám</th>
                <th>Địa điểm</th>
                <th className="text-center">SL BN</th>
                <th className="text-center">Phân nhóm</th>
                <th className="text-center">Tiến độ mổ</th>
                <th>Ngày khám</th>
                <th className="text-center">Trạng thái</th>
                <th className="text-right pr-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-[#334155] divide-y divide-[#e2e8f0]">
              {loading ? (
                <SkeletonTable rows={6} cols={9} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-[#64748b] bg-white">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-[#94a3b8]" />
                      <div className="font-bold text-[14px] text-[#0f172a]">Không tìm thấy đợt khám nào</div>
                      <div className="text-xs text-[#64748b]">Thử điều chỉnh từ khóa hoặc bộ lọc</div>
                      {hasActiveFilters && (
                        <button onClick={resetFilters} className="btn btn-outline text-xs px-3 py-1.5 mt-2">
                          <RotateCcw className="w-3.5 h-3.5" /> Đặt lại bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filtered.map((b, i) => {
                const isOngoing = phaseOf(b.ngayKham).key === "DangDienRa";
                const isEnded = phaseOf(b.ngayKham).key === "DaKetThuc";
                return (
                  <tr
                    key={b.id}
                    className={`transition-colors group ${
                      isOngoing
                        ? "bg-[#ecfdf5]/90 hover:bg-[#d1fae5]"
                        : i % 2 === 0
                        ? "bg-white hover:bg-[#eef2ff]"
                        : "bg-[#f8fafc] hover:bg-[#eef2ff]"
                    }`}
                  >
                    {/* STT */}
                    <td className="py-3.5 px-3.5 text-center align-middle font-mono font-bold text-[#031da6] text-[12px]">
                      <span className="text-[#94a3b8] font-normal">#</span>{String(i + 1).padStart(2, "0")}
                    </td>

                    {/* Tên & Mã đợt khám */}
                    <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                      <div className="font-bold text-[#0f172a] group-hover:text-[#031da6] text-[13.5px] transition-colors" title={fmtBuoiKhamName(b)}>
                        {fmtBuoiKhamName(b)}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] font-bold text-[#031da6] bg-[#eef2ff] px-1.5 py-0.5 rounded border border-[#c7d2fe]">
                          {fmtBuoiKhamCode(b.id)}
                        </span>
                        {b.bacSiKham && (
                          <span className="text-[11px] text-[#047857] font-semibold flex items-center gap-1 bg-[#ecfdf5] px-1.5 py-0.5 rounded border border-[#a7f3d0]">
                            <UserCheck className="w-3 h-3 text-[#047857]" /> {cleanDoctorName(b.bacSiKham)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Địa điểm */}
                    <td className="py-3.5 px-3.5 align-middle">
                      <div className="flex items-start gap-1.5 max-w-[240px]">
                        <MapPin className="w-3.5 h-3.5 text-[#64748b] shrink-0 mt-0.5" />
                        <span className="text-[12.5px] leading-tight truncate text-[#334155]" title={b.diaDiem}>
                          {b.diaDiem}
                        </span>
                      </div>
                    </td>

                    {/* Số lượng BN - Bấm để xem danh sách */}
                    <td className="py-3.5 px-3.5 align-middle text-center">
                      <button
                        type="button"
                        onClick={() => setViewPatientsBuoiKham(b)}
                        className="inline-flex items-center gap-1.5 font-mono font-black text-[13px] text-[#031da6] bg-[#eef2ff] hover:bg-[#031da6] hover:text-white px-2.5 py-1 rounded-lg border border-[#c7d2fe] hover:border-[#031da6] transition-all hover:scale-105 cursor-pointer shadow-2xs group/btn"
                        title="Bấm để xem danh sách bệnh nhân và kết quả khám"
                      >
                        <span>{b._count?.hoSo ?? 0}</span>
                        <Eye className="w-3.5 h-3.5 text-[#031da6] group-hover/btn:text-white opacity-70 group-hover/btn:opacity-100 transition-colors" />
                      </button>
                    </td>

                    {/* Phân nhóm A / B */}
                    <td className="py-3.5 px-3.5 align-middle text-center">
                      <NhomChip a={b.stats?.nhomA ?? 0} b={b.stats?.nhomB ?? 0} />
                    </td>

                    {/* Tiến độ mổ */}
                    <td className="py-3.5 px-3.5 align-middle text-center">
                      <MoProgress done={b.stats?.daMo ?? 0} waiting={b.stats?.chuaMo ?? 0} />
                    </td>

                    {/* Ngày khám */}
                    <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-[#334155] font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-[#64748b]" />
                        <span>{fmtDate(b.ngayKham)}</span>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-3.5 align-middle text-center whitespace-nowrap">
                      <span title={phaseOf(b.ngayKham).hint} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold border ${
                        phaseOf(b.ngayKham).key === "DaKetThuc"
                          ? "bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]"
                          : phaseOf(b.ngayKham).key === "DangDienRa"
                          ? "bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]"
                          : "bg-[#fffbeb] text-[#b45309] border-[#fde68a]"
                      }`}>
                        {isOngoing && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        {phaseOf(b.ngayKham).label}
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5 pr-4 align-middle whitespace-nowrap text-right">
                      <div data-tour="bk-join">
                        <BuoiKhamRowActions
                          b={b}
                          canManage={canManage}
                          exportingId={exportingId}
                          onExport={handleExportBuoiKham}
                          onEdit={openEditModal}
                          onComplete={setConfirmCompleteModal}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer phân trang & đếm số lượng */}
        <div className="shrink-0 bg-[#f8fafc] border-t border-[#cbd5e1] px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap text-xs text-[#64748b] font-medium">
          <div>
            Hiển thị <span className="font-mono font-bold text-[#0f172a]">{filtered.length > 0 ? 1 : 0}–{filtered.length}</span> trong tổng số <span className="font-mono font-bold text-[#031da6]">{list.length}</span> đợt khám
          </div>
          <div className="flex items-center gap-1 font-mono">
            <button disabled className="w-7 h-7 rounded flex items-center justify-center border border-[#cbd5e1] bg-white text-[#94a3b8] disabled:opacity-40">&lt;</button>
            <button className="w-7 h-7 rounded flex items-center justify-center bg-[#031da6] text-white font-bold text-xs shadow-xs">1</button>
            <button disabled className="w-7 h-7 rounded flex items-center justify-center border border-[#cbd5e1] bg-white text-[#94a3b8] disabled:opacity-40">&gt;</button>
          </div>
        </div>
      </div>

      <ImportExcelModal open={importOpen} onClose={() => setImportOpen(false)} onDone={() => { setImportOpen(false); load(); }} />

      {/* Modal Xem danh sách bệnh nhân và thông tin khám */}
      <BuoiKhamPatientsModal
        open={Boolean(viewPatientsBuoiKham)}
        onClose={() => setViewPatientsBuoiKham(null)}
        buoiKham={viewPatientsBuoiKham}
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
