"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Loader2,
  Search,
  Check,
  Save,
  PhoneCall,
  CalendarClock,
  Send,
  X,
  Users,
  ClipboardList,
  Phone,
  CalendarDays,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  History,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useRealtimeEvent } from "@/lib/useRealtime";
import { useSession } from "next-auth/react";
import { isCorporate } from "@/lib/permissions";
import { motion, AnimatePresence } from "framer-motion";
import {
  parseDiag,
  ageOf,
  fmtDate,
  fmtTime,
  fmtBuoiKhamName,
  statusOf,
  bhytLevel,
  TT_DIEU_TRI,
  type HoSo,
} from "@/lib/csr";
import { Dropdown, StatusBadge, DateField, ChoiceRow, labelCls } from "@/components/csr/fields";
import { SkeletonList } from "@/components/layout/Skeleton";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import { Badge, Fact, FIELD_LABEL, INPUT_CLS, BTN_SOFT, TONE_SOLID, WorkCard, type Tone } from "@/components/csr/ui";
import { useHisReconcile, DoiChieuHistoryModal, fmtRelative, type DoiChieuLog } from "@/components/csr/HisReconcile";

const FOLLOW = ["", "Đang follow-up", "Quá 28 ngày–chuyển CSKH", "Đã chốt", "Ngừng"];
/** Các trạng thái thuộc luồng mổ (nhóm A). Gồm cả CoChiDinhMo — ca chưa chốt ngày, cần nhắc lịch. */
const A_STATES = ["CoChiDinhMo", "NhomA", "DaNhacLich", "DaDonVien", "DaMoHauPhau", "HuyKhongDen"];
const EMPTY_DIEUTRI = {
  daDon: false,
  ngayDenBV: "",
  ngayMoThucTe: "",
  soTienThucThu: "",
  trangThaiDieuTri: "",
  ngayTaiKham: "",
  ghiChuMat2: "",
};

interface NhatKy {
  id: string;
  ngay: string;
  noiDung: string;
  nguoiGoi?: { hoTen: string };
}
interface HoSoDetail extends HoSo {
  nhatKy?: NhatKy[];
}

const isOverdue28Days = (p: HoSo) => {
  if (p.followUpStatus === "Quá 28 ngày-chuyển CSKH") return true;
  if (p.trangThaiDieuTri === "Đã mổ" || p.ngayMoThucTe) return false;

  const baseDateStr = p.ngayDieuTri || p.buoiKham?.ngayKham;
  if (!baseDateStr) return false;

  const baseDate = new Date(baseDateStr);
  const now = new Date();
  const diffTime = now.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
  return diffDays > 28;
};

import { useCurrentFacility } from "@/lib/useFacility";

export default function TheoDoiPage() {
  const { data: session } = useSession();
  const isManager = isCorporate(session?.user?.role);
  const { hasHisConfig } = useCurrentFacility();

  const { addToast } = useToast();
  const [tab, setTab] = useState<"A" | "B">("A");
  const [rows, setRows] = useState<HoSo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<HoSoDetail | null>(null);
  const [stats, setStats] = useState({ tong: 0, chiDinh: 0, daDen: 0, chuaDen: 0, quaHan: 0, soA: 0, soB: 0 });

  const [bks, setBks] = useState<any[]>([]);
  const [selBk, setSelBk] = useState<string>("");
  const [showBkModal, setShowBkModal] = useState(false);
  const [bkSearch, setBkSearch] = useState("");
  const bkLabels = useMemo(
    () => Object.fromEntries(bks.map((b) => [b.id, `${fmtDate(b.ngayKham)} · ${fmtBuoiKhamName(b)}`])),
    [bks]
  );

  const filteredBks = useMemo(() => {
    if (!bkSearch.trim()) return bks;
    const q = bkSearch.toLowerCase();
    return bks.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.xa.toLowerCase().includes(q) ||
        (b.diaDiem && b.diaDiem.toLowerCase().includes(q)) ||
        (b.ghiChu && b.ghiChu.toLowerCase().includes(q))
    );
  }, [bks, bkSearch]);

  useEffect(() => {
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const queryBk = urlParams?.get("buoiKhamId");

    fetch("/api/csr/buoikham")
      .then((r) => r.json())
      .then((data) => {
        setBks(data);
        if (queryBk && data.some((b: any) => b.id === queryBk)) {
          setSelBk(queryBk);
        } else {
          setSelBk("");
          setShowBkModal(true);
        }
        setLoading(false);
      });
  }, []);

  const [note, setNote] = useState("");
  const [fstatus, setFstatus] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [f, setF] = useState(EMPTY_DIEUTRI);
  const [savingDieuTri, setSavingDieuTri] = useState(false);
  const [isEditingDieuTri, setIsEditingDieuTri] = useState(false);

  const [showList, setShowList] = useState(false);
  const [checkingHis, setCheckingHis] = useState(false);
  const [subFilter, setSubFilter] = useState<
    "all" | "daMo" | "daMoTruoc" | "choMo" | "daDen" | "quaHan" | "huy" | "followUp" | "daChot" | "ngung"
  >("all");

  // Tìm HIS thủ công (khi đối chiếu tự động không khớp)
  const [hisSearchOpen, setHisSearchOpen] = useState(false);
  const [hisQuery, setHisQuery] = useState("");
  const [hisResults, setHisResults] = useState<any[]>([]);
  const [hisSearched, setHisSearched] = useState(false);
  const [hisSearching, setHisSearching] = useState(false);
  const [hisLinking, setHisLinking] = useState<string | null>(null);

  const curPatientIndex = rows.findIndex((p) => p.id === sel?.id);
  const prevPatient = curPatientIndex > 0 ? rows[curPatientIndex - 1] : null;
  const nextPatient = curPatientIndex >= 0 && curPatientIndex < rows.length - 1 ? rows[curPatientIndex + 1] : null;

  const checkHisPatient = async (p: HoSoDetail) => {
    setCheckingHis(true);
    try {
      const res = await fetch("/api/his/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoSoId: p.id }),
      });
      const r = await res.json();
      if (r.success && r.data) {
        addToast({ type: "success", message: r.data.chiTiet || `Đã liên kết mã HIS: ${r.data.maHIS}` });
        if (r.data.soTienThucThu) {
          setF((prev) => ({ ...prev, soTienThucThu: String(r.data.soTienThucThu) }));
        }
        load(p.id);
      } else {
        addToast({ type: "error", message: r.message || r.error || "Không tìm thấy trên HIS" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối máy chủ HIS" });
    } finally {
      setCheckingHis(false);
    }
  };

  const openHisSearch = (p: HoSoDetail) => {
    setHisQuery(p.cccd || p.bhyt || p.hoTen || "");
    setHisResults([]);
    setHisSearched(false);
    setHisSearchOpen(true);
  };

  const runHisSearch = async () => {
    if (!sel || !hisQuery.trim()) return;
    setHisSearching(true);
    try {
      const res = await fetch("/api/his/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoSoId: sel.id, q: hisQuery.trim() }),
      });
      const r = await res.json();
      if (r.success) {
        setHisResults(r.results || []);
        setHisSearched(true);
      } else {
        addToast({ type: "error", message: r.error || "Không tìm được trên HIS" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối máy chủ HIS" });
    } finally {
      setHisSearching(false);
    }
  };

  const confirmHisSurgery = async (item: any) => {
    if (!sel) return;
    setHisLinking(item.maHIS);
    try {
      const dStr = item.ngayMo ? new Date(item.ngayMo).toLocaleDateString("vi-VN") : "";
      let chiTiet = `${item.hoTen} (Mã HIS: ${item.maHIS}, NS: ${item.namSinh}) [✓ Xác nhận thủ công]`;
      if (item.ngayMo) {
        chiTiet += `\n• Loại mổ: ${item.loaiPhauThuat || "Phẫu thuật"} (Ngày mổ: ${dStr})`;
        if (item.tenDichVu) chiTiet += `\n• Chi tiết PT: ${item.tenDichVu}`;
        if (item.chanDoan) chiTiet += `\n• Chẩn đoán: ${item.chanDoan}`;
        if (item.khoaMo) chiTiet += `\n• Khoa: ${item.khoaMo}`;
      } else {
        chiTiet += `\n• Trạng thái: Liên kết hồ sơ HIS thủ công`;
      }
      if (item.soTienThucThu != null && item.soTienThucThu > 0) {
        chiTiet += `\n• Thực thu HIS: ${new Intl.NumberFormat("vi-VN").format(item.soTienThucThu)} VNĐ`;
      }
      const res = await fetch("/api/his/link-reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoSoId: sel.id,
          maHIS: item.maHIS,
          ngayMo: item.ngayMo,
          khoaMo: item.khoaMo,
          chanDoan: item.chanDoan,
          chiTiet,
        }),
      });
      const r = await res.json();
      if (r.success) {
        addToast({ type: "success", message: `Đã xác nhận mổ: ${sel.hoTen} (HIS ${item.maHIS})` });
        if (item.soTienThucThu) {
          setF((prev) => ({ ...prev, soTienThucThu: String(item.soTienThucThu) }));
        }
        setHisSearchOpen(false);
        load(sel.id);
      } else {
        addToast({ type: "error", message: r.error || "Không thể xác nhận" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối máy chủ" });
    } finally {
      setHisLinking(null);
    }
  };

  const openDetail = async (p: HoSo) => {
    const res = await fetch(`/api/csr/hoso/${p.id}`);
    const detail: HoSoDetail = res.ok ? await res.json() : p;
    setSel(detail);
    setNote("");
    setFstatus(detail.followUpStatus || "");

    const hasArrived = Boolean(detail.daDon || detail.maBNHIS);

    const actualNgayMo = detail.ngayMoThucTe
      ? new Date(detail.ngayMoThucTe).toISOString().slice(0, 10)
      : "";

    const actualNgayDen = detail.ngayDenBV
      ? new Date(detail.ngayDenBV).toISOString().slice(0, 10)
      : actualNgayMo
      ? actualNgayMo
      : hasArrived
      ? new Date().toISOString().slice(0, 10)
      : "";

    const parseRevFromNote = (note?: string | null) => {
      if (!note) return "";
      const m = note.match(/Thực thu HIS:\s*([\d\.,]+)/i);
      if (m && m[1]) {
        const raw = m[1].replace(/\D/g, "");
        if (raw && Number(raw) > 0) return raw;
      }
      return "";
    };

    setF({
      daDon: hasArrived,
      ngayDenBV: actualNgayDen,
      ngayMoThucTe: actualNgayMo,
      soTienThucThu:
        detail.soTienThucThu != null && Number(detail.soTienThucThu) > 0
          ? String(detail.soTienThucThu)
          : detail.maBNHIS ? parseRevFromNote(detail.ghiChuMat2) : "",
      trangThaiDieuTri: detail.trangThaiDieuTri || "",
      ngayTaiKham: detail.ngayTaiKham ? new Date(detail.ngayTaiKham).toISOString().slice(0, 10) : "",
      ghiChuMat2: detail.ghiChuMat2 || "",
    });
    setIsEditingDieuTri(false);
  };

  const load = useCallback(
    async (keepId?: string) => {
      if (!selBk) {
        setRows([]);
        setSel(null);
        return;
      }
      setLoading(true);
      const res = await fetch(`/api/csr/hoso?buoiKhamId=${selBk}&search=${encodeURIComponent(search)}`);
      const all: HoSo[] = res.ok ? await res.json() : [];

      const isB = (r: HoSo) => r.nhom === "B" || r.trangThai === "NhomB";
      const isA = (r: HoSo) => !isB(r) && (r.nhom === "A" || A_STATES.includes(r.trangThai));

      let data: HoSo[] = [];
      if (tab === "B") {
        data = all.filter(isB);
      } else {
        data = all.filter(isA).sort((a, b) => (a.ngayDieuTri || "").localeCompare(b.ngayDieuTri || ""));
      }

      setRows(data);
      const next = data.find((p) => p.id === (keepId ?? sel?.id)) || data[0] || null;
      if (next) {
        openDetail(next);
      } else {
        setSel(null);
      }

      const today = new Date().toISOString().slice(0, 10);
      const nhomA = all.filter(isA);
      const tong = all.length;
      const chiDinh = all.filter((p) => isA(p) || isB(p)).length;
      const daDen = nhomA.filter((p) => p.daDon).length;
      const chuaDen = nhomA.length - daDen;
      const quaHan = nhomA.filter((p) => !p.daDon && p.ngayDieuTri && p.ngayDieuTri.slice(0, 10) < today).length;
      setStats({ tong, chiDinh, daDen, chuaDen, quaHan, soA: nhomA.length, soB: all.filter(isB).length });

      setLoading(false);
    },
    [tab, search, sel?.id, selBk]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(t);
  }, [search, tab, selBk]);

  // Đồng bộ thời gian thực cho theo dõi A/B, nhật ký liên hệ và danh sách đợt khám (SSE)
  useRealtimeEvent(["hoso_change", "nhatky_change", "buoikham_change"], (evt) => {
    if (evt.type === "buoikham_change") {
      fetch("/api/csr/buoikham")
        .then((r) => r.json())
        .then((data) => {
          setBks(data);
        });
    }
    if (selBk && (evt.type === "hoso_change" || evt.type === "nhatky_change")) {
      load(sel?.id);
    }
  }, [selBk, sel?.id, load]);

  const addNote = async () => {
    if (!sel || !note.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/csr/nhatky", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoSoId: sel.id, noiDung: note, followUpStatus: fstatus || undefined }),
      });
      const d = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: d.error || "Lỗi" });
        return;
      }
      addToast({ type: "success", message: "Đã thêm nhật ký liên hệ." });
      setNote("");
      await openDetail(sel);
    } catch {
      addToast({ type: "error", message: "Mất kết nối máy chủ" });
    } finally {
      setSavingNote(false);
    }
  };

  const saveDieuTri = async () => {
    if (!sel) return;
    setSavingDieuTri(true);
    try {
      const res = await fetch(`/api/csr/hoso/${sel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daDon: f.daDon,
          ngayDenBV: f.ngayDenBV || (f.daDon ? new Date().toISOString().slice(0, 10) : null),
          ngayMoThucTe: f.ngayMoThucTe || null,
          soTienThucThu: f.soTienThucThu ? Number(f.soTienThucThu) : null,
          trangThaiDieuTri: f.trangThaiDieuTri || null,
          ngayTaiKham: f.ngayTaiKham || null,
          ghiChuMat2: f.ghiChuMat2,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: d.error || "Lỗi" });
        return;
      }
      addToast({ type: "success", message: `Đã lưu điều trị: ${sel.hoTen}` });
      await load(sel.id);
      setIsEditingDieuTri(false);
    } catch {
      addToast({ type: "error", message: "Mất kết nối máy chủ" });
    } finally {
      setSavingDieuTri(false);
    }
  };

  const dirtyDieuTri = useMemo(() => {
    if (!sel) return false;
    const isDaDon = !!sel.daDon;
    const isNgayDen = sel.ngayDenBV
      ? new Date(sel.ngayDenBV).toISOString().slice(0, 10)
      : "";
    const isNgayMo = sel.ngayMoThucTe
      ? new Date(sel.ngayMoThucTe).toISOString().slice(0, 10)
      : "";
    const isTien = sel.soTienThucThu != null ? String(sel.soTienThucThu) : sel.soTienBao != null ? String(sel.soTienBao) : "";
    const isTrangThai = sel.trangThaiDieuTri || "";
    const isNgayTaiKham = sel.ngayTaiKham ? new Date(sel.ngayTaiKham).toISOString().slice(0, 10) : "";
    const isGhiChu = sel.ghiChuMat2 || "";

    return (
      f.daDon !== isDaDon ||
      f.ngayDenBV !== isNgayDen ||
      f.ngayMoThucTe !== isNgayMo ||
      f.soTienThucThu !== isTien ||
      f.trangThaiDieuTri !== isTrangThai ||
      f.ngayTaiKham !== isNgayTaiKham ||
      f.ghiChuMat2 !== isGhiChu
    );
  }, [f, sel]);

  const [progressModal, setProgressModal] = useState<{
    open: boolean;
    type: "check" | "unlink";
    status: "running" | "success" | "error";
    title: string;
    message: string;
    summary?: {
      total: number;
      found: number;
      surgery: number;
      exactMatch: number;
      partialMatch: number;
    } | null;
    unlinkedCount?: number;
  }>({
    open: false,
    type: "check",
    status: "running",
    title: "",
    message: "",
  });


  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const unlinkHis = async () => {
    if (!sel) return;
    setConfirmModal({
      open: true,
      title: "Hủy liên kết HIS bệnh nhân",
      message: `Bạn có chắc chắn muốn HỦY LIÊN KẾT HIS, XÓA TRẠNG THÁI ĐÃ MỔ / ĐÃ ĐẾN và khôi phục dữ liệu sạch cho bệnh nhân ${sel.hoTen}?`,
      confirmText: "Đồng ý hủy liên kết",
      variant: "danger",
      onConfirm: async () => {
        try {
          const cleanNote = f.ghiChuMat2 && f.ghiChuMat2.includes("[HIS]")
            ? f.ghiChuMat2.substring(0, f.ghiChuMat2.indexOf("[HIS]")).trim()
            : f.ghiChuMat2 || "";

          const res = await fetch(`/api/csr/hoso/${sel.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              maBNHIS: null,
              daDon: false,
              ngayDenBV: null,
              ngayMoThucTe: null,
              soTienThucThu: null,
              soTienBao: null,
              trangThaiDieuTri: null,
              followUpStatus: null,
              ghiChuMat2: cleanNote,
            }),
          });
          if (res.ok) {
            addToast({ type: "success", message: `Đã hủy liên kết HIS cho bệnh nhân ${sel.hoTen}` });
            setF({
              daDon: false,
              ngayDenBV: "",
              ngayMoThucTe: "",
              soTienThucThu: "",
              trangThaiDieuTri: "",
              ngayTaiKham: "",
              ghiChuMat2: cleanNote,
            });
            await load(sel.id);
          } else {
            addToast({ type: "error", message: "Không thể hủy liên kết HIS" });
          }
        } catch {
          addToast({ type: "error", message: "Mất kết nối máy chủ" });
        }
      },
    });
  };


  // ── Đối chiếu HIS cả đợt: dùng chung API ghi lịch sử với trang Đợt khám / Tư vấn ──
  const curBk = bks.find((b) => b.id === selBk) || null;
  const [lastDoiChieu, setLastDoiChieu] = useState<{ bkId: string; log: DoiChieuLog } | null>(null);
  const curLog: DoiChieuLog | null =
    lastDoiChieu && lastDoiChieu.bkId === selBk ? lastDoiChieu.log : (curBk?.lastDoiChieu as DoiChieuLog | null) ?? null;
  const [showHisHistory, setShowHisHistory] = useState(false);
  const his = useHisReconcile({
    onLog: (bkId, log) => setLastDoiChieu({ bkId, log }),
    onFinish: () => load(sel?.id),
  });
  const reconciling = !!selBk && his.runningIds.has(selBk);
  const reconcileCurrent = () => {
    if (!curBk) return;
    const soCa = (curBk.stats?.nhomA ?? 0) + (curBk.stats?.nhomB ?? 0);
    his.runOne({ id: curBk.id, name: fmtBuoiKhamName(curBk), soCa: soCa || stats.chiDinh });
  };

  // ── Phân loại từng ca cho danh sách (A: tiến trình mổ, B: follow-up) ──
  const rowState = (p: HoSo) => {
    const truocDay = p.trangThaiDieuTri === "Đã mổ trước đây" || p.trangThaiDieuTri === "Đã đến trước đây";
    const isMo = !truocDay && (p.trangThaiDieuTri === "Đã mổ" || !!p.ngayMoThucTe);
    const isHuy = p.trangThaiDieuTri === "Hủy" || p.trangThaiDieuTri === "Không đến";
    const isOverdue = isOverdue28Days(p);
    const isDaDen = !!p.daDon;
    let tone: Tone;
    let label: string;
    if (tab === "A") {
      if (truocDay) [tone, label] = ["violet", p.trangThaiDieuTri === "Đã mổ trước đây" ? "Mổ trước đây" : "Đến trước đây"];
      else if (isMo) [tone, label] = ["teal", "Đã mổ"];
      else if (isHuy) [tone, label] = ["rose", p.trangThaiDieuTri || "Hủy"];
      else if (isOverdue) [tone, label] = ["rose", "Quá 28 ngày"];
      else if (isDaDen) [tone, label] = ["navy", "Đã đến BV"];
      else [tone, label] = ["amber", "Chờ mổ"];
    } else {
      if (isOverdue) [tone, label] = ["rose", "Quá 28 ngày"];
      else if (p.followUpStatus === "Đã chốt") [tone, label] = ["teal", "Đã chốt"];
      else if (p.followUpStatus === "Ngừng" || p.followUpStatus === "Ngưng") [tone, label] = ["gray", "Ngừng"];
      else [tone, label] = ["navy", "Đang follow-up"];
    }
    return { truocDay, isMo, isHuy, isOverdue, isDaDen, tone, label };
  };

  const subFilters: { k: typeof subFilter; label: string; n: number }[] =
    tab === "A"
      ? [
          { k: "all", label: "Tất cả", n: rows.length },
          { k: "choMo", label: "Chờ mổ", n: rows.filter((p) => { const s = rowState(p); return !s.isMo && !s.truocDay && !s.isHuy && !s.isOverdue; }).length },
          { k: "daDen", label: "Đã đến", n: rows.filter((p) => !!p.daDon).length },
          { k: "daMo", label: "Đã mổ", n: rows.filter((p) => rowState(p).isMo).length },
          { k: "daMoTruoc", label: "Đến/Mổ trước", n: rows.filter((p) => rowState(p).truocDay).length },
          { k: "quaHan", label: "Quá 28 ngày", n: rows.filter(isOverdue28Days).length },
          { k: "huy", label: "Hủy / Vắng", n: rows.filter((p) => rowState(p).isHuy).length },
        ]
      : [
          { k: "all", label: "Tất cả", n: rows.length },
          { k: "followUp", label: "Follow-up", n: rows.filter((p) => (!p.followUpStatus || p.followUpStatus === "Đang follow-up") && !isOverdue28Days(p)).length },
          { k: "quaHan", label: "Quá 28 ngày", n: rows.filter(isOverdue28Days).length },
          { k: "daChot", label: "Đã chốt", n: rows.filter((p) => p.followUpStatus === "Đã chốt").length },
          { k: "ngung", label: "Ngừng", n: rows.filter((p) => p.followUpStatus === "Ngưng" || p.followUpStatus === "Ngừng").length },
        ];

  const listRows = rows.filter((p) => {
    if (subFilter === "all") return true;
    const s = rowState(p);
    if (tab === "A") {
      if (subFilter === "daMo") return s.isMo;
      if (subFilter === "daMoTruoc") return s.truocDay;
      if (subFilter === "choMo") return !s.isMo && !s.truocDay && !s.isHuy && !s.isOverdue;
      if (subFilter === "daDen") return s.isDaDen;
      if (subFilter === "quaHan") return s.isOverdue;
      if (subFilter === "huy") return s.isHuy;
    } else {
      if (subFilter === "followUp") return (!p.followUpStatus || p.followUpStatus === "Đang follow-up") && !s.isOverdue;
      if (subFilter === "quaHan") return s.isOverdue;
      if (subFilter === "daChot") return p.followUpStatus === "Đã chốt";
      if (subFilter === "ngung") return p.followUpStatus === "Ngưng" || p.followUpStatus === "Ngừng";
    }
    return true;
  });

  const TREAT_OPTIONS: { key: string; tone: Tone }[] = [
    { key: "Đã mổ", tone: "teal" },
    { key: "Đã mổ trước đây", tone: "violet" },
    { key: "Đã đến trước đây", tone: "violet" },
    { key: "Hủy", tone: "rose" },
    { key: "Không đến", tone: "amber" },
  ];
  const TONE_ACTIVE: Record<Tone, string> = {
    teal: "bg-[var(--teal)] border-[var(--teal)] text-white",
    violet: "bg-[#7c3aed] border-[#7c3aed] text-white",
    rose: "bg-[var(--rose)] border-[var(--rose)] text-white",
    amber: "bg-[var(--amber)] border-[var(--amber)] text-white",
    navy: "bg-[var(--navy)] border-[var(--navy)] text-white",
    gray: "bg-[var(--mute)] border-[var(--mute)] text-white",
  };

  const hisIdx = f.ghiChuMat2 ? f.ghiChuMat2.indexOf("[HIS]") : -1;
  const hisNote = hisIdx >= 0 ? f.ghiChuMat2.substring(hisIdx).replace(/^\[HIS\]:\s*/, "").trim() : "";
  const userNote = hisIdx >= 0 ? f.ghiChuMat2.substring(0, hisIdx).trim() : f.ghiChuMat2 || "";

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[var(--bg)] overflow-hidden h-full">
      <PageHeader
        title="Theo dõi & Chăm sóc A/B"
        description="Theo dõi nhóm B (chăm sóc) và nhóm A (nhắc lịch & cập nhật điều trị tại BV)."
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {hasHisConfig && selBk && (
              <div className="inline-flex">
                <button
                  type="button"
                  onClick={reconcileCurrent}
                  disabled={reconciling}
                  title={
                    curLog
                      ? `Đối chiếu HIS gần nhất: ${fmtRelative(curLog.thoiDiem)} — ${curLog.found ?? 0}/${curLog.total ?? 0} khớp`
                      : "Đối chiếu toàn bộ BN Nhóm A/B của đợt với HIS (tự cập nhật đã đến, đã mổ, thực thu)"
                  }
                  className={`${BTN_SOFT.navy} rounded-r-none`}
                >
                  {reconciling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {reconciling ? "Đang đối chiếu…" : "Đối chiếu HIS"}
                  {!reconciling && curLog && <span className="hidden sm:inline font-normal text-[11px] opacity-75">· {fmtRelative(curLog.thoiDiem)}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowHisHistory(true)}
                  title="Lịch sử đối chiếu HIS của đợt"
                  className={`${BTN_SOFT.navy} rounded-l-none border-l-0 px-2.5`}
                >
                  <History className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {hasHisConfig && (
              <Link href="/doi-chieu-his" className={BTN_SOFT.ghost}>
                <Search className="w-3.5 h-3.5" />
                Tra cứu HIS
              </Link>
            )}
            <button data-tour="td-bk" onClick={() => setShowBkModal(true)} className={BTN_SOFT.ghost}>
              <CalendarDays className="w-3.5 h-3.5 text-[var(--teal-deep)]" />
              <span className="truncate max-w-[160px] sm:max-w-[260px] text-[var(--ink)]">{selBk ? bkLabels[selBk] : "Chọn đợt khám…"}</span>
            </button>
          </div>
        }
      />

      {/* Dải chỉ số */}
      <div className="px-3 sm:px-5 py-3 border-b border-[var(--line)] shrink-0 overflow-x-auto no-scrollbar">
        <div className="grid grid-cols-5 gap-2.5 min-w-[640px]">
          {[
            { k: "Tổng bệnh nhân", v: stats.tong, tone: "text-[var(--ink)]", bar: "var(--navy)" },
            { k: "Chỉ định A/B", v: stats.chiDinh, sub: `/ ${stats.tong}`, tone: "text-[var(--navy)]", bar: "var(--navy)" },
            { k: "Nhóm A · đã đến BV", v: stats.daDen, tone: "text-[var(--teal-deep)]", bar: "var(--teal)" },
            { k: "Nhóm A · chưa đến", v: stats.chuaDen, tone: "text-[var(--amber-deep)]", bar: "var(--amber)" },
            { k: "Nhóm A · quá hạn", v: stats.quaHan, tone: stats.quaHan ? "text-[var(--rose)]" : "text-[var(--mute-soft)]", bar: "var(--rose)" },
          ].map((s) => (
            <div key={s.k} className="relative pl-3.5 pr-3 py-2 rounded-[12px] bg-[var(--surface)] border border-[var(--line)] shadow-[var(--shadow-xs)] overflow-hidden">
              <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: s.bar }} />
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-[var(--mute)] whitespace-nowrap">{s.k}</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`font-mono text-[19px] font-bold leading-tight tabular-nums ${s.tone}`}>{s.v}</span>
                {s.sub && <span className="font-mono text-[11px] text-[var(--mute)]">{s.sub}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!selBk ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
          <div className="w-14 h-14 rounded-[14px] bg-[var(--navy-50)] flex items-center justify-center mb-4">
            <CalendarDays className="w-7 h-7 text-[var(--teal-deep)]" />
          </div>
          <h3 className="font-serif font-semibold text-[18px] text-[var(--ink)]">Chưa chọn đợt khám</h3>
          <p className="text-[13px] text-[var(--mute)] max-w-md mt-1.5 leading-relaxed">
            Chọn một đợt khám tầm soát để tải danh sách bệnh nhân và theo dõi, chăm sóc.
          </p>
          <button type="button" onClick={() => setShowBkModal(true)} className="btn-primary inline-flex items-center gap-2 h-10 px-5 rounded-[10px] text-[13px] font-semibold mt-5">
            <CalendarDays className="w-4 h-4 text-[var(--teal)]" />
            Chọn đợt khám
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col xl:flex-row min-h-0 overflow-hidden relative">
          {showList && <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[2px] xl:hidden" onClick={() => setShowList(false)} />}

          {/* COL 1 — Danh sách */}
          <aside
            className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] bg-[var(--surface)] shadow-2xl flex flex-col transition-transform duration-300 ${
              showList ? "translate-x-0" : "translate-x-full"
            } xl:static xl:translate-x-0 xl:w-[372px] xl:shrink-0 xl:border-r xl:border-[var(--line)] xl:shadow-none xl:z-0`}
          >
            {/* Tab A / B */}
            <div data-tour="td-tabs" className="px-4 pt-3.5 pb-2.5 flex items-center gap-2">
              <div className="flex-1 flex gap-0.5 p-[3px] rounded-xl bg-[var(--surface-soft)] border border-[var(--line)]">
                {[
                  { k: "A" as const, icon: CalendarClock, label: "Nhóm A · Mổ", n: stats.soA },
                  { k: "B" as const, icon: PhoneCall, label: "Nhóm B · Chăm sóc", n: stats.soB },
                ].map(({ k, icon: Icon, label, n }) => {
                  const on = tab === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setTab(k);
                        setSubFilter("all");
                        setSel(null);
                      }}
                      className={`relative flex-1 flex items-center justify-center gap-1.5 h-8 px-2 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
                        on ? "text-white" : "text-[var(--mute)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {on && (
                        <motion.span
                          layoutId="theo-doi-tab-pill"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                          className="absolute inset-0 bg-[var(--navy)] rounded-lg shadow-[var(--navy-shadow)]"
                        />
                      )}
                      <Icon className={`relative w-3.5 h-3.5 ${on ? "text-[var(--teal)]" : ""}`} />
                      <span className="relative truncate">{label}</span>
                      <span className={`relative font-mono text-[10px] font-bold px-1.5 rounded-md tabular-nums ${on ? "bg-white/20 text-white" : "bg-[var(--line-soft)] text-[var(--mute)]"}`}>{n}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setShowList(false)} className="xl:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--mute)] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tìm kiếm */}
            <div className="px-4 pb-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--mute)] pointer-events-none" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên, mã, SĐT, BHYT, CCCD…" className={`${INPUT_CLS} h-9 pl-8 pr-8`} />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer" title="Xóa tìm kiếm">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Lọc nhanh */}
            <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto no-scrollbar border-b border-[var(--line)] shrink-0">
              {subFilters.map((sf) => {
                const on = subFilter === sf.k;
                if (sf.k !== "all" && sf.n === 0 && !on) return null;
                return (
                  <button
                    key={sf.k}
                    type="button"
                    onClick={() => setSubFilter(sf.k)}
                    className={`shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-[11.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      on
                        ? "bg-[var(--navy)] border-[var(--navy)] text-white"
                        : "bg-[var(--surface)] border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--navy)]/40 hover:text-[var(--navy)]"
                    }`}
                  >
                    {sf.label}
                    <span className={`font-mono text-[10px] font-bold tabular-nums ${on ? "text-white/80" : "text-[var(--mute)]"}`}>{sf.n}</span>
                  </button>
                );
              })}
            </div>

            {/* Danh sách ca */}
            <div data-tour="td-list" className="flex-1 overflow-y-auto divide-y divide-[var(--line-soft)]">
              {loading && rows.length === 0 ? (
                <div className="p-3"><SkeletonList items={6} /></div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center text-center gap-2 py-14 px-6">
                  <Users className="w-8 h-8 text-[var(--mute-soft)]" />
                  <p className="text-[12.5px] text-[var(--mute)] leading-relaxed">
                    {search ? <>Không có bệnh nhân nào khớp <b className="text-[var(--ink-soft)]">“{search}”</b>.</> : `Chưa có bệnh nhân nhóm ${tab} trong đợt khám này.`}
                  </p>
                  {!search && (tab === "A" ? stats.soB : stats.soA) > 0 && (
                    <button
                      onClick={() => {
                        setTab(tab === "A" ? "B" : "A");
                        setSubFilter("all");
                        setSel(null);
                      }}
                      className="text-[12px] font-semibold text-[var(--navy)] hover:underline cursor-pointer mt-1"
                    >
                      Nhóm {tab === "A" ? "B" : "A"} đang có {tab === "A" ? stats.soB : stats.soA} bệnh nhân →
                    </button>
                  )}
                </div>
              ) : listRows.length === 0 ? (
                <div className="text-center text-[var(--mute)] text-[12.5px] py-14 px-6">Không có bệnh nhân khớp bộ lọc.</div>
              ) : (
                listRows.map((p, idx) => {
                  const active = sel?.id === p.id;
                  const diags = parseDiag(p.chanDoan);
                  const s = rowState(p);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        openDetail(p);
                        if (window.innerWidth < 1280) setShowList(false);
                      }}
                      className={`relative w-full text-left px-4 py-3 transition-colors cursor-pointer ${active ? "bg-[var(--navy-50)]" : "hover:bg-[var(--surface-soft)]"}`}
                    >
                      <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: TONE_SOLID[s.tone] }} />
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex items-baseline gap-2">
                          <span className="font-mono text-[11px] text-[var(--mute)] tabular-nums shrink-0">{String(p.stt || idx + 1).padStart(2, "0")}</span>
                          <span className={`text-[13.5px] font-semibold truncate ${active ? "text-[var(--navy)]" : "text-[var(--ink)]"}`}>{p.hoTen}</span>
                          {p.namSinh && <span className="text-[11.5px] text-[var(--mute)] shrink-0">{p.namSinh}</span>}
                        </div>
                        <span className="font-mono text-[11px] font-bold text-[var(--navy)] shrink-0">{p.maBN?.split("-").pop() || p.maBN}</span>
                      </div>
                      {diags.length > 0 && <div className="mt-0.5 pl-[26px] text-[11.5px] text-[var(--ink-soft)] truncate">{diags.join(", ")}</div>}
                      <div className="mt-1.5 pl-[26px] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Badge tone={s.tone}>{s.label}</Badge>
                          {p.maBNHIS && (
                            <Badge tone="gray" dot={false} title={`Mã HIS: ${p.maBNHIS}`}>
                              <Zap className="w-3 h-3" />HIS
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] font-mono tabular-nums shrink-0">
                          {p.ngayMoThucTe ? (
                            <span className="text-[var(--teal-deep)]">Mổ {fmtDate(p.ngayMoThucTe)}</span>
                          ) : p.ngayDieuTri ? (
                            <span className="text-[var(--ink-soft)]">Hẹn {fmtDate(p.ngayDieuTri)}</span>
                          ) : (
                            <span className="text-[var(--mute-soft)]">Chưa hẹn</span>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* COL 2 — Vùng làm việc */}
          <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
            {sel ? (
              <>
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                  {/* Thẻ hồ sơ */}
                  <div className="bg-[var(--surface)] border-b border-[var(--line)] px-4 sm:px-6 py-3.5 shrink-0">
                    <div className="flex items-start justify-between gap-x-6 gap-y-2 flex-wrap">
                      <div className="min-w-0 flex items-center gap-x-2.5 gap-y-1.5 flex-wrap">
                        <h2 className="font-serif text-[21px] font-semibold tracking-[-0.02em] text-[var(--ink)] leading-tight">{sel.hoTen}</h2>
                        <span className="font-mono text-[11.5px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--navy-50)] text-[var(--navy)]">{sel.maBN}</span>
                        {sel.maBNHIS && <span className="font-mono text-[11.5px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--teal-soft)] text-[var(--teal-deep)]">HIS {sel.maBNHIS}</span>}
                        <span className="text-[12.5px] text-[var(--mute)]">{sel.gioiTinh} · {ageOf(sel)} tuổi</span>
                        {sel.nhom && <Badge tone={sel.nhom === "A" ? "rose" : "amber"}>Nhóm {sel.nhom}</Badge>}
                      </div>
                      {hasHisConfig && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => checkHisPatient(sel)} disabled={checkingHis} title="Đối chiếu HIS riêng bệnh nhân này" className={`${BTN_SOFT.navy} h-8`}>
                            {checkingHis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                            Đối chiếu BN này
                          </button>
                          <button onClick={() => openHisSearch(sel)} title="Tìm & chọn ca mổ trong HIS thủ công" className={`${BTN_SOFT.ghost} h-8`}>
                            <Search className="w-3.5 h-3.5" /> Tìm HIS
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5 pt-2.5 border-t border-[var(--line-soft)] flex items-center gap-x-5 gap-y-1.5 flex-wrap">
                      <Fact label="SĐT">
                        {sel.sdt ? (
                          <a href={`tel:${sel.sdt}`} className="inline-flex items-center gap-1 font-mono font-semibold text-[var(--navy)] hover:underline">
                            <Phone className="w-3 h-3" /> {sel.sdt}
                          </a>
                        ) : (
                          <span className="text-[var(--mute-soft)]">—</span>
                        )}
                      </Fact>
                      {sel.bhyt && (
                        <Fact label="BHYT">
                          <span className="font-mono">{sel.bhyt}</span> <span className="text-[var(--mute)]">({bhytLevel(sel.bhyt)})</span>
                        </Fact>
                      )}
                      {sel.cccd && <Fact label="CCCD"><span className="font-mono">{sel.cccd}</span></Fact>}
                      {sel.ngayDieuTri && <Fact label="Hẹn mổ (tư vấn)"><span className="font-mono">{fmtDate(sel.ngayDieuTri)}</span></Fact>}
                      {sel.diaChi && <Fact label="Địa chỉ"><span title={sel.diaChi}>{sel.diaChi}</span></Fact>}
                    </div>
                  </div>

                  {/* Hai cột: nhật ký | điều trị */}
                  <div className={`p-4 sm:p-5 flex-1 min-h-0 grid gap-4 items-start ${tab === "A" ? "grid-cols-1 xl:grid-cols-[380px_1fr]" : "grid-cols-1 max-w-[760px]"}`}>
                    {/* Nhật ký liên hệ */}
                    <WorkCard
                      title="Nhật ký liên hệ"
                      desc="Kết quả gọi điện, ý kiến bệnh nhân"
                      aside={
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--line-soft)] text-[var(--ink-soft)] tabular-nums shrink-0">
                          {(sel.nhatKy || []).length} lần
                        </span>
                      }
                    >
                      <div data-tour="td-note" className="p-4 space-y-2.5 border-b border-[var(--line-soft)]">
                        {tab === "B" && (
                          <div>
                            <label className={FIELD_LABEL}>Trạng thái follow-up</label>
                            <Dropdown value={fstatus} placeholder="Giữ nguyên trạng thái hiện tại" mono={false} options={FOLLOW} onChange={setFstatus} />
                          </div>
                        )}
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                          className={`${INPUT_CLS} p-3 resize-none`}
                          placeholder="Kết quả gọi điện, ý kiến bệnh nhân…"
                        />
                        <div className="flex justify-end">
                          <button onClick={addNote} disabled={savingNote || !note.trim()} className={`${BTN_SOFT.teal} h-8`}>
                            {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Ghi nhận liên hệ
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        {(sel.nhatKy || []).length === 0 ? (
                          <div className="flex flex-col items-center text-center py-6 gap-1.5 text-[12.5px] text-[var(--mute)]">
                            <PhoneCall className="w-5 h-5 text-[var(--mute-soft)]" />
                            Chưa có lịch sử liên hệ.
                          </div>
                        ) : (
                          <ol className="relative space-y-3.5 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--line)]">
                            {sel.nhatKy!.map((n, i) => (
                              <li key={n.id} className="relative pl-6">
                                <span className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-[var(--surface)] ${i === 0 ? "bg-[var(--teal)]" : "bg-[var(--mute-soft)]"}`} />
                                <div className="flex items-center justify-between gap-2 text-[11.5px]">
                                  <span className="font-semibold text-[var(--ink)] truncate">{n.nguoiGoi?.hoTen || "Nhân viên"}</span>
                                  <span className="font-mono text-[var(--mute)] tabular-nums shrink-0">{fmtTime(n.ngay)} · {fmtDate(n.ngay)}</span>
                                </div>
                                <p className="mt-0.5 text-[12.5px] text-[var(--ink-soft)] leading-relaxed whitespace-pre-wrap">{n.noiDung}</p>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </WorkCard>

                    {/* Tiếp nhận & điều trị tại BV (nhóm A) */}
                    {tab === "A" && (
                      <WorkCard title="Tiếp nhận & điều trị tại bệnh viện" desc="Cập nhật khi bệnh nhân đến viện, mổ, tái khám" bodyClassName="p-5 space-y-5">
                        <div data-tour="td-treat" className="contents" />
                        {/* Đã đến BV */}
                        <button
                          type="button"
                          onClick={() =>
                            setF((s) => {
                              const next = !s.daDon;
                              return { ...s, daDon: next, ngayDenBV: next ? s.ngayDenBV || new Date().toISOString().slice(0, 10) : s.ngayDenBV };
                            })
                          }
                          className={`w-full flex items-center gap-3 p-3.5 rounded-[12px] border text-left transition-all cursor-pointer ${
                            f.daDon ? "border-[var(--teal)]/50 bg-[var(--teal-softer)] shadow-[0_0_0_3px_var(--teal-soft)]" : "border-[var(--line)] bg-[var(--surface-soft)] hover:border-[var(--line-strong)]"
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${f.daDon ? "bg-[var(--teal)] border-[var(--teal)]" : "border-[var(--line-strong)] bg-[var(--surface)]"}`}>
                            {f.daDon && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </span>
                          <div className="min-w-0">
                            <div className={`text-[13.5px] font-semibold ${f.daDon ? "text-[var(--teal-deep)]" : "text-[var(--ink)]"}`}>Bệnh nhân đã đến bệnh viện</div>
                            <div className="text-[11.5px] text-[var(--mute)]">{f.daDon ? "Đã xác nhận có mặt tại viện" : "Đánh dấu khi bệnh nhân có mặt tại viện"}</div>
                          </div>
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <DateField label="Ngày đến bệnh viện" value={f.ngayDenBV} onChange={(v) => setF((s) => ({ ...s, ngayDenBV: v, daDon: v ? true : s.daDon }))} />
                          <DateField
                            label="Ngày mổ thực tế"
                            value={f.ngayMoThucTe}
                            onChange={(v) =>
                              setF((s) => ({
                                ...s,
                                ngayMoThucTe: v,
                                daDon: v ? true : s.daDon,
                                ngayDenBV: v ? s.ngayDenBV || v : s.ngayDenBV,
                                trangThaiDieuTri: v ? s.trangThaiDieuTri || "Đã mổ" : s.trangThaiDieuTri,
                              }))
                            }
                          />
                          <div>
                            <label className={FIELD_LABEL}>Số tiền thực thu</label>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={f.soTienThucThu ? new Intl.NumberFormat("vi-VN").format(Number(f.soTienThucThu)) : ""}
                                onChange={(e) => setF((s) => ({ ...s, soTienThucThu: e.target.value.replace(/[^\d]/g, "") }))}
                                className={`${INPUT_CLS} h-10 px-3 pr-9 font-mono font-semibold tabular-nums`}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] text-[13px] font-semibold">₫</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className={FIELD_LABEL}>Trạng thái điều trị</label>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {TREAT_OPTIONS.map((opt) => {
                                const active = f.trangThaiDieuTri === opt.key;
                                return (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() =>
                                      setF((s) => {
                                        const isMo = opt.key === "Đã mổ";
                                        return {
                                          ...s,
                                          trangThaiDieuTri: active ? "" : opt.key,
                                          daDon: isMo && !active ? true : s.daDon,
                                          ngayMoThucTe: isMo && !active && !s.ngayMoThucTe ? new Date().toISOString().slice(0, 10) : s.ngayMoThucTe,
                                        };
                                      })
                                    }
                                    className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] border text-[12.5px] font-semibold transition-colors cursor-pointer ${
                                      active ? TONE_ACTIVE[opt.tone] : "bg-[var(--surface)] border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                                    }`}
                                  >
                                    {active && <Check className="w-3 h-3 stroke-[3]" />}
                                    {opt.key}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <DateField label="Hẹn tái khám" value={f.ngayTaiKham} onChange={(v) => setF((s) => ({ ...s, ngayTaiKham: v }))} />
                        </div>

                        {/* Hồ sơ đối chiếu HIS */}
                        {hisNote && (
                          <div className="rounded-[12px] border border-[var(--line)] border-l-[3px] border-l-[var(--teal)] bg-[var(--surface)] overflow-hidden">
                            <div className="flex items-center justify-between gap-2 flex-wrap px-3.5 py-2.5 bg-[var(--surface-soft)] border-b border-[var(--line-soft)]">
                              <div className="flex items-center gap-2 min-w-0">
                                <Zap className="w-3.5 h-3.5 text-[var(--teal-deep)]" />
                                <span className="text-[13px] font-semibold text-[var(--ink)]">Kết quả đối chiếu HIS</span>
                                {sel.maBNHIS && <span className="font-mono text-[11px] font-bold px-1.5 py-px rounded-md bg-[var(--teal-soft)] text-[var(--teal-deep)]">{sel.maBNHIS}</span>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button type="button" onClick={() => checkHisPatient(sel)} disabled={checkingHis} className={`${BTN_SOFT.ghost} h-7 px-2.5 text-[11.5px]`} title="Kiểm tra lại hồ sơ này với HIS">
                                  <RefreshCw className={`w-3 h-3 ${checkingHis ? "animate-spin" : ""}`} /> Rà soát lại
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHisQuery(sel.hoTen || "");
                                    setHisSearchOpen(true);
                                  }}
                                  className={`${BTN_SOFT.ghost} h-7 px-2.5 text-[11.5px]`}
                                  title="Tìm mã HIS khác để liên kết lại"
                                >
                                  <Search className="w-3 h-3" /> Đổi mã HIS
                                </button>
                                {isManager && (
                                  <button type="button" onClick={unlinkHis} className={`${BTN_SOFT.rose} h-7 px-2.5 text-[11.5px]`} title="Hủy liên kết nếu sai hồ sơ">
                                    <X className="w-3 h-3" /> Hủy liên kết
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="px-3.5 py-3 text-[12.5px] text-[var(--ink-soft)] whitespace-pre-wrap leading-relaxed">{hisNote}</div>
                          </div>
                        )}

                        <div>
                          <label className={FIELD_LABEL}>Ghi chú (tài liệu mặt 2)</label>
                          <textarea
                            rows={3}
                            placeholder="Sức khỏe, thuốc, dặn dò…"
                            value={userNote}
                            onChange={(e) => {
                              const val = e.target.value;
                              setF((s) => {
                                const full = s.ghiChuMat2 || "";
                                const idx = full.indexOf("[HIS]");
                                const hisPart = idx !== -1 ? full.substring(idx).trim() : "";
                                const nextVal = val.trim() ? (hisPart ? `${val.trim()}\n\n${hisPart}` : val.trim()) : hisPart;
                                return { ...s, ghiChuMat2: nextVal };
                              });
                            }}
                            className={`${INPUT_CLS} p-3 min-h-[80px] leading-relaxed resize-y`}
                          />
                        </div>
                      </WorkCard>
                    )}
                  </div>
                </div>

                {/* Thanh thao tác dưới */}
                <div className="px-3 sm:px-5 py-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.625rem)] border-t border-[var(--line)] bg-[var(--surface)] sticky bottom-0 z-30 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setShowList(true)}
                      className="xl:hidden inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[10px] border border-[var(--navy)]/20 bg-[var(--navy-50)] text-[12px] font-semibold text-[var(--navy)] shrink-0 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      DS
                      <span className="font-mono text-[10.5px] font-bold px-1.5 rounded-[5px] bg-[var(--navy)] text-white tabular-nums">{rows.length}</span>
                    </button>
                    <div className="flex items-center gap-0.5 p-[2px] rounded-[10px] border border-[var(--line)] bg-[var(--surface-soft)] shrink-0">
                      <button
                        type="button"
                        onClick={() => prevPatient && openDetail(prevPatient)}
                        disabled={!prevPatient}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--surface)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Ca trước"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono font-semibold px-1 text-[var(--mute)] tabular-nums">
                        {curPatientIndex >= 0 ? `${curPatientIndex + 1}/${rows.length}` : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => nextPatient && openDetail(nextPatient)}
                        disabled={!nextPatient}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--surface)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Ca tiếp"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="hidden md:inline-flex items-center gap-1.5 text-[12px] font-medium min-w-0 truncate">
                      {tab === "A" && dirtyDieuTri ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-pulse shrink-0" />
                          <span className="text-[var(--amber-deep)]">Có thay đổi điều trị chưa lưu</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" />
                          <span className="text-[var(--mute)]">Đã lưu</span>
                        </>
                      )}
                    </span>
                  </div>
                  {tab === "A" && (
                    <button
                      type="button"
                      onClick={saveDieuTri}
                      disabled={savingDieuTri || !dirtyDieuTri}
                      className="btn-primary inline-flex items-center gap-1.5 h-9 px-5 rounded-[10px] text-[13px] font-semibold shrink-0 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {savingDieuTri ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[var(--teal)]" />}
                      Lưu điều trị
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 gap-3">
                  <div className="w-14 h-14 rounded-[14px] bg-[var(--navy-50)] flex items-center justify-center">
                    <PhoneCall className="w-7 h-7 text-[var(--teal-deep)]" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <div className="font-semibold text-[15px] text-[var(--ink)]">{rows.length > 0 ? "Chưa chọn bệnh nhân" : `Chưa có ca nhóm ${tab}`}</div>
                    <div className="text-[12.5px] text-[var(--mute)] leading-relaxed">
                      {rows.length > 0 ? `Đợt khám có ${rows.length} bệnh nhân nhóm ${tab}. Chọn một ca trong danh sách để bắt đầu.` : `Đợt khám này chưa có bệnh nhân nào thuộc nhóm ${tab}.`}
                    </div>
                  </div>
                  {rows.length > 0 ? (
                    <button type="button" onClick={() => setShowList(true)} className="xl:hidden btn-primary inline-flex items-center gap-2 h-10 px-5 rounded-[10px] text-[13px] font-semibold mt-2">
                      <Users className="w-4 h-4 text-[var(--teal)]" />
                      Mở danh sách ({rows.length})
                    </button>
                  ) : (
                    <button type="button" onClick={() => setShowBkModal(true)} className={`${BTN_SOFT.ghost} mt-2`}>
                      <CalendarDays className="w-4 h-4 text-[var(--navy)]" />
                      Chọn đợt khám khác
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      <DoiChieuHistoryModal
        target={showHisHistory && curBk ? { id: curBk.id, name: fmtBuoiKhamName(curBk) } : null}
        onClose={() => setShowHisHistory(false)}
        running={reconciling}
        onRerun={reconcileCurrent}
      />

      {/* Modal Chọn Đợt Khám */}
      <Modal
        open={showBkModal}
        onClose={() => setShowBkModal(false)}
        title={<>Chọn <span className="italic font-normal text-[var(--teal)]">đợt khám</span></>}
        subtitle="Lấy danh sách bệnh nhân để theo dõi & chăm sóc"
        icon={CalendarDays}
        maxWidth="max-w-[660px]"
        noPadding
      >
        {/* Search */}
        <div className="p-4 border-b border-[var(--line-soft)] bg-[var(--surface-soft)]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
            <input
              autoFocus
              placeholder="Tìm theo xã, địa điểm hoặc mã đợt khám..."
              value={bkSearch}
              onChange={(e) => setBkSearch(e.target.value)}
              className="w-full h-11 rounded-[var(--r-md)] border border-[var(--line-strong)] bg-white pl-10 pr-9 text-[13.5px] font-medium text-[var(--ink)] outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)] placeholder:text-[var(--mute-soft)] transition-all shadow-xs"
            />
            {bkSearch && (
              <button
                type="button"
                onClick={() => setBkSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer p-0.5"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="p-4 space-y-2.5 bg-[var(--surface-soft)] min-h-[300px] max-h-[60vh] overflow-y-auto">
          {filteredBks.map((b) => {
            const active = selBk === b.id;
            return (
              <button
                key={b.id}
                onClick={() => {
                  setSelBk(b.id);
                  setShowBkModal(false);
                }}
                className={`w-full text-left p-3.5 sm:p-4 rounded-[var(--r-lg)] transition-all duration-200 flex items-start gap-3.5 sm:gap-4 border cursor-pointer ${
                  active
                    ? "bg-white border-[var(--navy)] shadow-md ring-1 ring-[var(--navy)]"
                    : "bg-white border-[var(--line)] shadow-xs hover:border-[var(--line-strong)] hover:shadow-sm"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-[var(--r-md)] flex items-center justify-center shrink-0 border transition-colors mt-0.5 ${
                    active
                      ? "bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] border-transparent text-white shadow-xs"
                      : "bg-[var(--navy-50)] border-[var(--navy-100)] text-[var(--navy)]"
                  }`}
                >
                  {active ? <Check className="w-5 h-5 text-[var(--teal)]" /> : <MapPin className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[14.5px] sm:text-[15px] truncate text-[var(--ink)]" title={fmtBuoiKhamName(b)}>
                      {fmtBuoiKhamName(b)}
                    </span>
                    <span className="font-mono text-[11px] sm:text-[11.5px] font-bold px-2 py-0.5 rounded-[var(--r-sm)] shrink-0 bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)]">
                      {b.id}
                    </span>
                  </div>
                  <div className="text-[12.5px] sm:text-[13px] text-[var(--mute)] mt-1 flex items-center gap-3.5 font-medium flex-wrap">
                    <span className="flex items-center gap-1.5 shrink-0 font-mono">
                      <CalendarDays className="w-3.5 h-3.5 text-[var(--teal-deep)]" /> {fmtDate(b.ngayKham)}
                    </span>
                    {b.diaDiem && (
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[var(--navy)] shrink-0" />{" "}
                        <span className="truncate">{b.diaDiem}</span>
                      </span>
                    )}
                  </div>

                  {/* Thống kê Phân nhóm A/B & Đã mổ */}
                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-[var(--line-soft)] flex-wrap">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--surface-bg)] text-[var(--ink-soft)] border border-[var(--line)]" title="Tổng số bệnh nhân tiếp nhận">
                      {b._count?.hoSo ?? 0} BN
                    </span>

                    <div className="inline-flex rounded-md overflow-hidden border border-[var(--line)] font-mono text-[11px] font-bold shadow-2xs">
                      <span className="px-2 py-0.5 bg-[#fef1f4] text-[#e11d48] border-r border-[#e11d48]/20" title="Nhóm A: Đồng ý điều trị / Chỉ định mổ">
                        Nhóm A: {b.stats?.nhomA ?? 0}
                      </span>
                      <span className="px-2 py-0.5 bg-[#fef6eb] text-[#d97706]" title="Nhóm B: Cần suy nghĩ thêm / Theo dõi">
                        Nhóm B: {b.stats?.nhomB ?? 0}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border shadow-2xs ${
                        (b.stats?.daMo ?? 0) > 0
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}
                      title={`Đã mổ thực tế: ${b.stats?.daMo ?? 0} ca${(b.stats?.nhomA ?? 0) > 0 ? ` trên tổng ${b.stats?.nhomA} ca nhóm A` : ""}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${(b.stats?.daMo ?? 0) > 0 ? "bg-emerald-600" : "bg-slate-400"}`} />
                      <span>
                        Đã mổ: {b.stats?.daMo ?? 0}
                        {(b.stats?.nhomA ?? 0) > 0 ? `/${b.stats?.nhomA ?? 0}` : ""}
                      </span>
                    </span>

                    {b.bacSiKham && (
                      <span className="text-[11px] font-medium text-[var(--mute)] ml-auto truncate" title={`Bác sĩ chỉ định / khám: ${b.bacSiKham}`}>
                        BS: {b.bacSiKham.replace(/^(BS|Bác sĩ|BSCKI|BSCKII)\s*/i, "")}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {filteredBks.length === 0 && (
            <div className="text-center py-14 flex flex-col items-center justify-center text-[var(--mute)]">
              <div className="w-12 h-12 rounded-[var(--r-lg)] bg-white shadow-xs border border-[var(--line)] flex items-center justify-center mb-4 text-[var(--mute)]">
                <Search className="w-6 h-6" />
              </div>
              <div className="font-bold text-[15px] text-[var(--ink)] font-serif">Không tìm thấy đợt khám</div>
              <div className="text-[13px] mt-1 text-[var(--mute)]">Thử thay đổi từ khóa tìm kiếm của bạn.</div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal tìm HIS thủ công */}
      <Modal
        open={hisSearchOpen}
        onClose={() => setHisSearchOpen(false)}
        title={<>Tìm <span className="italic font-normal text-[var(--teal)]">HIS thủ công</span></>}
        subtitle="Khi đối chiếu tự động không khớp — tự tìm & chọn đúng ca mổ để xác nhận"
        icon={Search}
        maxWidth="max-w-[720px]"
        noPadding
      >
        <div className="p-5 bg-white">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
              <input
                autoFocus
                value={hisQuery}
                onChange={(e) => setHisQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runHisSearch();
                  }
                }}
                placeholder="Nhập CCCD / Mã thẻ BHYT / Họ tên / Mã HIS…"
                className="w-full h-11 rounded-[var(--r-md)] border border-[var(--line-strong)] bg-white pl-10 pr-9 text-[13.5px] font-medium text-[var(--ink)] outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)] placeholder:text-[var(--mute-soft)] transition-all shadow-xs"
              />
              {hisQuery && (
                <button
                  type="button"
                  onClick={() => setHisQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={runHisSearch}
              disabled={hisSearching || !hisQuery.trim()}
              className="btn btn-primary px-5 py-2.5 font-bold h-11 rounded-[var(--r-md)] flex items-center gap-2 cursor-pointer"
            >
              {hisSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Tìm kiếm</span>
            </button>
          </div>

          <div className="mt-4 max-h-[380px] overflow-y-auto space-y-2">
            {hisSearching ? (
              <div className="py-12 flex flex-col items-center justify-center text-[var(--mute)] gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--navy)]" />
                <span className="text-[13px]">Đang tra cứu trên máy chủ HIS...</span>
              </div>
            ) : hisSearched && hisResults.length === 0 ? (
              <div className="py-10 text-center text-[var(--mute)] text-[13px]">
                Không tìm thấy kết quả nào phù hợp trên HIS.
              </div>
            ) : (
              hisResults.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 border rounded-[12px] transition-colors flex items-center justify-between gap-4 ${
                    item.hasSurgery
                      ? "border-[var(--teal)]/40 border-l-[3px] border-l-[var(--teal)] bg-[var(--surface)] hover:bg-[var(--teal-softer)]"
                      : "border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-soft)]"
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="text-[14px] text-[var(--ink)] flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{item.hoTen}</span>
                      <span className="font-mono text-[11px] font-bold text-[var(--teal-deep)] bg-[var(--teal-soft)] px-1.5 py-px rounded-md">
                        Mã HIS: {item.maHIS}
                      </span>
                      {item.namSinh && <span className="text-[12px] text-slate-500 font-medium">({item.namSinh})</span>}

                      {item.hasSurgery ? (
                        <Badge tone="teal">{item.ngayMo ? <>Đã mổ / nhập viện <span className="font-mono font-medium">{fmtDate(item.ngayMo)}</span></> : "Ghi nhận mổ / nội trú"}</Badge>
                      ) : (
                        <Badge tone="gray">Khám ngoại trú</Badge>
                      )}
                    </div>

                    <div className="text-[12px] text-[var(--mute)] flex items-center gap-3 flex-wrap">
                      {item.cccd && <span>CCCD: <b className="text-slate-900 font-mono">{item.cccd}</b></span>}
                      {item.bhyt && <span>BHYT: <b className="text-indigo-700 font-mono">{item.bhyt}</b></span>}
                      {item.sdt && <span>SĐT: <b className="text-slate-800 font-mono">{item.sdt}</b></span>}
                      {item.ngayKham && (
                        <span>
                          Ngày khám: <b className="text-slate-800 font-mono">{fmtDate(item.ngayKham)}</b>
                        </span>
                      )}
                    </div>

                    {item.loaiPhauThuat && (
                      <div className="text-[12px] text-[var(--ink-soft)]">
                        <span className="text-[var(--mute)]">Phẫu thuật:</span> <b className="font-semibold text-[var(--teal-deep)]">{item.loaiPhauThuat}</b>
                        {item.tenDichVu ? ` — ${item.tenDichVu}` : ""}
                      </div>
                    )}

                    {item.chanDoan && (
                      <div className="text-[12px] text-[var(--ink-soft)]">
                        <span className="text-[var(--mute)]">Chẩn đoán:</span> {item.chanDoan}
                      </div>
                    )}

                    {item.soTienThucThu != null && item.soTienThucThu > 0 && (
                      <div className="text-[12px] text-[var(--ink-soft)]">
                        <span className="text-[var(--mute)]">Thực thu HIS:</span> <b className="font-mono font-semibold text-[var(--ink)]">{new Intl.NumberFormat("vi-VN").format(item.soTienThucThu)} ₫</b>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => confirmHisSurgery(item)}
                    disabled={hisLinking === item.maHIS}
                    className="btn-primary inline-flex items-center h-8 px-3.5 rounded-[10px] text-[12px] font-semibold shrink-0"
                  >
                    {hisLinking === item.maHIS ? <Loader2 className="w-3 h-3 animate-spin" /> : "Xác nhận"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Custom Confirmation Modal */}
      <Modal
        open={confirmModal.open}
        onClose={() => setConfirmModal((s) => ({ ...s, open: false }))}
        title={confirmModal.title}
        icon={AlertTriangle}
        maxWidth="max-w-[480px]"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmModal((s) => ({ ...s, open: false }))}
              className={BTN_SOFT.ghost}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmModal((s) => ({ ...s, open: false }));
                confirmModal.onConfirm();
              }}
              className={`inline-flex items-center h-[34px] px-4 rounded-[10px] text-[12.5px] font-semibold text-white cursor-pointer transition-colors ${
                confirmModal.variant === "danger"
                  ? "bg-[var(--rose)] hover:bg-rose-700"
                  : confirmModal.variant === "warning"
                  ? "bg-[var(--amber)] hover:bg-[var(--amber-deep)]"
                  : "bg-[var(--navy)] hover:bg-[var(--navy-deep)]"
              }`}
            >
              {confirmModal.confirmText || "Xác nhận"}
            </button>
          </>
        }
      >
        <p className="text-[13px] text-[var(--ink-soft)] leading-relaxed">
          {confirmModal.message}
        </p>
      </Modal>

      {/* Progress Modal (Tiến trình Đối chiếu & Hủy hàng loạt) */}
      <Modal
        open={progressModal.open}
        onClose={() => {
          if (progressModal.status !== "running") {
            setProgressModal((s) => ({ ...s, open: false }));
          }
        }}
        title={progressModal.title}
        icon={progressModal.status === "running" ? RefreshCw : progressModal.status === "success" ? CheckCircle2 : AlertTriangle}
        maxWidth="max-w-[480px]"
        footer={
          progressModal.status !== "running" ? (
            <button
              type="button"
              onClick={() => setProgressModal((s) => ({ ...s, open: false }))}
              className="btn-primary w-full h-10 rounded-[10px] text-[13px] font-semibold"
            >
              Đóng & Hoàn tất
            </button>
          ) : null
        }
      >
        <div className="py-2 space-y-4 text-center">
          {progressModal.status === "running" ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-[3px] border-[var(--line)] border-t-[var(--navy)] animate-spin" />
                <Zap className="w-6 h-6 text-[var(--teal)] absolute" />
              </div>
              <div className="space-y-1">
                <p className="text-[13.5px] font-semibold text-[var(--ink)]">
                  {progressModal.message}
                </p>
                <p className="text-[12px] text-[var(--mute)]">
                  Vui lòng không đóng trình duyệt trong quá trình xử lý…
                </p>
              </div>
              <div className="w-full bg-[var(--line)] h-1 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-gradient-to-r from-[var(--navy)] to-[var(--teal)] animate-pulse w-full rounded-full" />
              </div>
            </div>
          ) : progressModal.status === "success" ? (
            <div className="space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-[var(--teal-soft)] text-[var(--teal-deep)] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-[13.5px] font-semibold text-[var(--ink)] leading-relaxed">
                {progressModal.message}
              </p>

              {progressModal.summary && (
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                    <div className="text-[10.5px] text-slate-500 font-bold uppercase">Tổng Nhóm A</div>
                    <div className="text-[18px] font-black text-slate-900 font-mono">{progressModal.summary.total}</div>
                  </div>
                  <div className="p-2 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="text-[10.5px] text-teal-700 font-bold uppercase">Khớp HIS</div>
                    <div className="text-[18px] font-black text-teal-900 font-mono">{progressModal.summary.found}</div>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="text-[10.5px] text-emerald-700 font-bold uppercase">Đã Mổ</div>
                    <div className="text-[18px] font-black text-emerald-900 font-mono">{progressModal.summary.surgery}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="w-14 h-14 rounded-full bg-[var(--rose-soft)] text-[var(--rose)] flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <p className="text-[13.5px] font-semibold text-[var(--rose)] leading-relaxed">
                {progressModal.message}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
