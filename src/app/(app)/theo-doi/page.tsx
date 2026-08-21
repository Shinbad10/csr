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
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useRealtimeEvent } from "@/lib/useRealtime";
import { useSession } from "next-auth/react";
import { isCorporate } from "@/lib/permissions";
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

export default function TheoDoiPage() {
  const { data: session } = useSession();
  const isManager = isCorporate(session?.user?.role);

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

  const [batchChecking, setBatchChecking] = useState(false);

  const runBatchCheckHIS = async () => {
    if (!selBk) {
      addToast({ type: "error", message: "Vui lòng chọn Đợt khám để đối chiếu hàng loạt" });
      return;
    }
    setBatchChecking(true);
    setProgressModal({
      open: true,
      type: "check",
      status: "running",
      title: "Đang đối chiếu HIS đợt khám...",
      message: "Hệ thống đang kết nối CSDL HIS bệnh viện và tự động rà soát danh sách bệnh nhân Nhóm A...",
      summary: null,
    });
    try {
      const res = await fetch("/api/his/batch-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buoiKhamId: selBk }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const s = data.summary;
        setProgressModal({
          open: true,
          type: "check",
          status: "success",
          title: "Đối chiếu HIS hoàn tất!",
          message: `Đã rà soát ${s.total} bệnh nhân Nhóm A: Tìm thấy ${s.found} ca trên HIS (${s.surgery} ca mổ) & tự động cập nhật thực thu!`,
          summary: s,
        });
        await load(sel?.id);
      } else {
        setProgressModal({
          open: true,
          type: "check",
          status: "error",
          title: "Lỗi đối chiếu HIS",
          message: data.error || "Không thể thực hiện đối chiếu hàng loạt",
        });
      }
    } catch {
      setProgressModal({
        open: true,
        type: "check",
        status: "error",
        title: "Lỗi kết nối máy chủ HIS",
        message: "Mất kết nối hoặc không thể truy vấn CSDL HIS bệnh viện.",
      });
    } finally {
      setBatchChecking(false);
    }
  };

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

  const [batchUnlinking, setBatchUnlinking] = useState(false);

  const runBatchUnlinkHIS = async () => {
    if (!selBk) {
      addToast({ type: "error", message: "Vui lòng chọn đợt khám để hủy liên kết hàng loạt" });
      return;
    }

    setConfirmModal({
      open: true,
      title: "Hủy liên kết HIS hàng loạt đợt khám",
      message: "Bạn có chắc chắn muốn HỦY LƯU & HỦY LIÊN KẾT HIS HÀNG LOẠT cho tất cả bệnh nhân trong đợt khám này? Tất cả trạng thái Đã mổ, Đã đến, Số tiền thực thu và Mã HIS sẽ được khôi phục về trạng thái sạch ban đầu.",
      confirmText: "Đồng ý hủy hàng loạt",
      variant: "danger",
      onConfirm: async () => {
        setBatchUnlinking(true);
        setProgressModal({
          open: true,
          type: "unlink",
          status: "running",
          title: "Đang hủy liên kết HIS hàng loạt...",
          message: "Đang làm sạch dữ liệu, khôi phục trạng thái ban đầu cho tất cả bệnh nhân trong đợt khám...",
        });
        try {
          const res = await fetch("/api/his/batch-unlink", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ buoiKhamId: selBk }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setProgressModal({
              open: true,
              type: "unlink",
              status: "success",
              title: "Hủy liên kết HIS hoàn tất!",
              message: data.message || `Đã hủy liên kết HIS thành công cho ${data.unlinkedCount || 0} bệnh nhân!`,
              unlinkedCount: data.unlinkedCount,
            });
            setF({
              daDon: false,
              ngayDenBV: "",
              ngayMoThucTe: "",
              soTienThucThu: "",
              trangThaiDieuTri: "",
              ngayTaiKham: "",
              ghiChuMat2: "",
            });
            await load(sel?.id);
          } else {
            setProgressModal({
              open: true,
              type: "unlink",
              status: "error",
              title: "Lỗi hủy liên kết hàng loạt",
              message: data.error || "Không thể hủy liên kết hàng loạt",
            });
          }
        } catch {
          setProgressModal({
            open: true,
            type: "unlink",
            status: "error",
            title: "Lỗi kết nối máy chủ",
            message: "Không thể kết nối đến máy chủ để hủy liên kết hàng loạt.",
          });
        } finally {
          setBatchUnlinking(false);
        }
      },
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[var(--surface-bg)] overflow-hidden h-full">
      <PageHeader
        title="Theo dõi & Chăm sóc A/B"
        description="Theo dõi nhóm B (chăm sóc) và nhóm A (nhắc lịch & cập nhật điều trị tại BV)."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={batchChecking || !selBk}
              onClick={runBatchCheckHIS}
              className="btn btn-secondary px-3 py-1.5 text-[11.5px] sm:text-[12.5px] font-bold h-[34px] rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50 disabled:pointer-events-none"
              title="Tự động kiểm tra lịch sử mổ & thực thu tiền từ hệ thống HIS cho tất cả bệnh nhân đợt khám này"
            >
              {batchChecking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
              ) : (
                <span className="text-amber-600 font-black">⚡</span>
              )}
              <span>{batchChecking ? "Đang đối chiếu HIS..." : "Đối chiếu HIS hàng loạt đợt khám"}</span>
            </button>
            {isManager && (
              <button
                type="button"
                disabled={batchUnlinking || !selBk}
                onClick={runBatchUnlinkHIS}
                className="btn btn-secondary px-3 py-1.5 text-[11.5px] sm:text-[12.5px] font-bold h-[34px] rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50 disabled:pointer-events-none"
                title="Hủy liên kết mã HIS hàng loạt cho tất cả bệnh nhân trong đợt khám này để chọn đối chiếu lại từ đầu"
              >
                {batchUnlinking ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-700" />
                ) : (
                  <X className="w-3.5 h-3.5 text-rose-600 font-black" />
                )}
                <span>{batchUnlinking ? "Đang hủy liên kết..." : "Hủy liên kết HIS hàng loạt"}</span>
              </button>
            )}
            <Link
              href="/doi-chieu-his"
              className="btn btn-secondary px-2.5 sm:px-3 py-1.5 text-[11.5px] sm:text-[12.5px] font-semibold h-[34px] rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors flex items-center gap-1.5 text-teal-800 bg-teal-50/50 shadow-2xs"
            >
              Tra cứu HIS
            </Link>
            <button
              data-tour="td-bk"
              onClick={() => setShowBkModal(true)}
              className="btn btn-secondary px-3 py-1.5 text-[11.5px] sm:text-[12.5px] font-semibold h-[34px] rounded-lg border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 text-[var(--ink)] cursor-pointer shadow-2xs"
            >
              <CalendarDays className="w-4 h-4 text-[var(--teal-deep)]" />
              <span className="truncate max-w-[160px] sm:max-w-none">
                {selBk ? bkLabels[selBk] : "Chọn đợt khám..."}
              </span>
            </button>
          </div>
        }
      />

      {/* Dải chỉ số thống kê */}
      <div className="px-3 sm:px-5 py-2.5 border-b border-[var(--line)] bg-[var(--surface-soft)] shrink-0 overflow-x-auto">
        <div className="flex items-stretch gap-2.5 min-w-[600px] sm:min-w-0 flex-nowrap sm:flex-wrap">
          {[
            { k: "Tổng BN", v: stats.tong, accent: "var(--navy)", tone: "text-[var(--navy)]" },
            { k: "Chỉ định A/B", v: stats.chiDinh, sub: `/ ${stats.tong}`, accent: "var(--teal)", tone: "text-[var(--teal-deep)]" },
            { k: "Nhóm A · đã đến BV", v: stats.daDen, accent: "var(--green)", tone: "text-[var(--green)]" },
            { k: "Nhóm A · chưa đến", v: stats.chuaDen, accent: "var(--amber)", tone: "text-[var(--amber-deep)]" },
            { k: "Nhóm A · quá hạn", v: stats.quaHan, accent: "var(--rose)", tone: "text-[var(--rose)]", alert: stats.quaHan > 0 },
          ].map((s) => (
            <div
              key={s.k}
              className={`relative flex-1 min-w-[120px] pl-3 pr-2.5 py-1.5 rounded-lg bg-white border transition-colors shadow-2xs ${
                s.alert ? "border-[var(--rose)]/40" : "border-[var(--line)]"
              }`}
            >
              <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ background: s.accent }} />
              <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--mute)] whitespace-nowrap">
                {s.k}
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`font-mono text-[17px] font-bold leading-tight ${s.tone}`}>{s.v}</span>
                {s.sub && <span className="font-mono text-[10.5px] text-[var(--mute-soft)]">{s.sub}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!selBk ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[var(--surface-bg)] animate-fade-in border-t border-[var(--line)]">
          <div className="w-16 h-16 rounded-2xl bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)] flex items-center justify-center shadow-xs mb-4">
            <CalendarDays className="w-8 h-8 text-[var(--teal-deep)]" />
          </div>
          <h3 className="font-serif font-bold text-[18px] text-[var(--ink)]">Chưa chọn đợt khám</h3>
          <p className="text-[13px] text-[var(--mute)] max-w-md mt-1.5 leading-relaxed">
            Vui lòng chọn một đợt khám tầm soát để tải danh sách bệnh nhân và thực hiện theo dõi & chăm sóc.
          </p>
          <button
            type="button"
            onClick={() => setShowBkModal(true)}
            className="btn btn-primary px-6 py-2.5 font-bold rounded-xl shadow-md flex items-center gap-2 mt-5 cursor-pointer active:scale-95 text-[13.5px]"
          >
            <CalendarDays className="w-4 h-4 text-[var(--teal)]" />
            <span>Chọn đợt khám ngay</span>
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col xl:flex-row min-h-0 border-t border-[var(--line)] overflow-hidden relative">
          {/* Backdrop */}
          {showList && (
            <div
              className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[2px] transition-opacity xl:hidden"
              onClick={() => setShowList(false)}
            />
          )}

          {/* COL 1 — List Sidebar */}
          <aside
            className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
              showList ? "translate-x-0" : "translate-x-full"
            } xl:static xl:translate-x-0 xl:w-[350px] xl:shrink-0 xl:border-r xl:border-[var(--line)] xl:shadow-none xl:z-0`}
          >
          {/* Segmented Control Tabs */}
          <div data-tour="td-tabs" className="p-2.5 border-b border-[var(--line)] bg-[var(--surface-bg)]">
            <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface-hover)] border border-[var(--line)]">
              {[
                { k: "A" as const, icon: CalendarClock, label: "Nhóm A (Mổ)", n: stats.soA },
                { k: "B" as const, icon: PhoneCall, label: "Nhóm B (K/N)", n: stats.soB },
              ].map(({ k, icon: Icon, label, n }) => {
                const on = tab === k;
                return (
                  <button
                    key={k}
                    onClick={() => {
                      setTab(k);
                      setSel(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[12px] font-bold transition-all cursor-pointer ${
                      on
                        ? "bg-[var(--navy)] text-white shadow-xs"
                        : "text-[var(--ink-soft)] hover:bg-white hover:text-[var(--ink)]"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${on ? "text-[var(--teal)]" : "text-[var(--mute)]"}`} />
                    <span className="truncate">{label}</span>
                    <span
                      className={`font-mono text-[10.5px] font-bold px-1.5 rounded-full ${
                        on ? "bg-white/20 text-white" : "bg-[var(--surface-bg)] text-[var(--mute)] border border-[var(--line)]"
                      }`}
                    >
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 py-2.5 flex items-center justify-between border-b border-[var(--line-soft)] xl:hidden">
            <h2 className="text-[12.5px] font-extrabold uppercase tracking-[0.1em] text-[var(--navy)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--teal-deep)]" />
              <span>Danh sách bệnh nhân</span>
            </h2>
            <button
              onClick={() => setShowList(false)}
              className="p-1.5 rounded-full hover:bg-[var(--line-soft)] text-[var(--mute)] active:scale-90 transition-transform cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-Filter Toolbar (Nhóm A & Nhóm B) */}
          <div className="p-2 border-b border-slate-200/80 bg-slate-50/70">
            <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold">
              {(tab === "A"
                ? [
                    { k: "all" as const, label: "Tất cả", n: rows.length },
                    {
                      k: "daMo" as const,
                      label: "✓ Đã mổ",
                      n: rows.filter((p) => p.trangThaiDieuTri === "Đã mổ" || (!!p.ngayMoThucTe && p.trangThaiDieuTri !== "Đã mổ trước đây" && p.trangThaiDieuTri !== "Đã đến trước đây")).length,
                      cls: "text-emerald-800 bg-emerald-50 border-emerald-300 hover:bg-emerald-100",
                    },
                    {
                      k: "daMoTruoc" as const,
                      label: "🟣 Đến/Mổ trước",
                      n: rows.filter((p) => p.trangThaiDieuTri === "Đã mổ trước đây" || p.trangThaiDieuTri === "Đã đến trước đây").length,
                      cls: "text-purple-800 bg-purple-50 border-purple-300 hover:bg-purple-100",
                    },
                    {
                      k: "choMo" as const,
                      label: "⏳ Chờ mổ",
                      n: rows.filter(
                        (p) =>
                          p.trangThaiDieuTri !== "Đã mổ" &&
                          p.trangThaiDieuTri !== "Đã mổ trước đây" &&
                          p.trangThaiDieuTri !== "Đã đến trước đây" &&
                          p.trangThaiDieuTri !== "Hủy" &&
                          p.trangThaiDieuTri !== "Không đến" &&
                          !p.ngayMoThucTe &&
                          !isOverdue28Days(p)
                      ).length,
                      cls: "text-amber-900 bg-amber-50 border-amber-300 hover:bg-amber-100",
                    },
                    {
                      k: "daDen" as const,
                      label: "🏥 Đã đến",
                      n: rows.filter((p) => p.daDon).length,
                      cls: "text-sky-900 bg-sky-50 border-sky-300 hover:bg-sky-100",
                    },
                    {
                      k: "quaHan" as const,
                      label: "⚠️ Quá 28d",
                      n: rows.filter(isOverdue28Days).length,
                      cls: "text-rose-900 bg-rose-50 border-rose-300 hover:bg-rose-100",
                    },
                    {
                      k: "huy" as const,
                      label: "❌ Hủy/Vắng",
                      n: rows.filter((p) => p.trangThaiDieuTri === "Hủy" || p.trangThaiDieuTri === "Không đến").length,
                      cls: "text-rose-800 bg-rose-50 border-rose-200 hover:bg-rose-100",
                    },
                  ]
                : [
                    { k: "all" as const, label: "Tất cả", n: rows.length },
                    {
                      k: "followUp" as const,
                      label: "📞 Follow-up",
                      n: rows.filter((p) => (!p.followUpStatus || p.followUpStatus === "Đang follow-up") && !isOverdue28Days(p)).length,
                      cls: "text-indigo-900 bg-indigo-50 border-indigo-300 hover:bg-indigo-100",
                    },
                    {
                      k: "quaHan" as const,
                      label: "⚠️ Quá 28d",
                      n: rows.filter(isOverdue28Days).length,
                      cls: "text-rose-900 bg-rose-50 border-rose-300 hover:bg-rose-100",
                    },
                    {
                      k: "daChot" as const,
                      label: "✓ Đã chốt",
                      n: rows.filter((p) => p.followUpStatus === "Đã chốt").length,
                      cls: "text-emerald-900 bg-emerald-50 border-emerald-300 hover:bg-emerald-100",
                    },
                    {
                      k: "ngung" as const,
                      label: "🛑 Ngưng",
                      n: rows.filter((p) => p.followUpStatus === "Ngưng").length,
                      cls: "text-slate-800 bg-slate-100 border-slate-300 hover:bg-slate-200",
                    },
                  ]
              ).map((sf) => {
                const on = subFilter === sf.k;
                return (
                  <button
                    key={sf.k}
                    type="button"
                    onClick={() => setSubFilter(sf.k)}
                    className={`px-2 py-0.5 rounded-md border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0 ${
                      on
                        ? "bg-[var(--navy)] text-white border-[var(--navy)] font-extrabold shadow-xs"
                        : sf.cls || "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{sf.label}</span>
                    <span className={`font-mono text-[10px] font-extrabold px-1 rounded-full ${on ? "bg-white/25 text-white" : "bg-black/5 text-slate-700"}`}>
                      {sf.n}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div className="p-2.5 flex items-center gap-2 border-b border-[var(--line-soft)]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tên, mã, SĐT, BHYT, CCCD…"
                className="w-full h-9 rounded-lg border border-[var(--line)] bg-white pl-9 pr-8 text-[13px] outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Patient Cards List */}
          <div data-tour="td-list" className="flex-1 overflow-y-auto p-2 space-y-2">
            {loading ? (
              <SkeletonList items={6} />
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center text-center gap-2 py-14 px-6">
                <Users className="w-8 h-8 text-[var(--mute-soft)]" />
                <p className="text-[12.5px] text-[var(--mute)] leading-relaxed">
                  {search ? (
                    <>
                      Không có bệnh nhân nào khớp <b className="text-[var(--ink-soft)]">“{search}”</b>.
                    </>
                  ) : tab === "A" ? (
                    "Chưa có bệnh nhân nhóm A trong đợt khám này."
                  ) : (
                    "Chưa có bệnh nhân nhóm B trong đợt khám này."
                  )}
                </p>
                {!search && (tab === "A" ? stats.soB : stats.soA) > 0 && (
                  <button
                    onClick={() => {
                      setTab(tab === "A" ? "B" : "A");
                      setSubFilter("all");
                      setSel(null);
                    }}
                    className="text-[12px] font-bold text-[var(--navy)] hover:underline cursor-pointer mt-2"
                  >
                    Nhóm {tab === "A" ? "B" : "A"} đang có {tab === "A" ? stats.soB : stats.soA} bệnh nhân →
                  </button>
                )}
              </div>
            ) : (
              rows
                .filter((p) => {
                  if (subFilter === "all") return true;
                  const isMo = p.trangThaiDieuTri === "Đã mổ" || !!p.ngayMoThucTe;
                  const isHuy = p.trangThaiDieuTri === "Hủy" || p.trangThaiDieuTri === "Không đến";
                  const isOverdue = isOverdue28Days(p);

                  if (tab === "A") {
                    if (subFilter === "daMo") return isMo && p.trangThaiDieuTri !== "Đã mổ trước đây" && p.trangThaiDieuTri !== "Đã đến trước đây";
                    if (subFilter === "daMoTruoc") return p.trangThaiDieuTri === "Đã mổ trước đây" || p.trangThaiDieuTri === "Đã đến trước đây";
                    if (subFilter === "choMo") return !isMo && p.trangThaiDieuTri !== "Đã mổ trước đây" && p.trangThaiDieuTri !== "Đã đến trước đây" && !isHuy && !isOverdue;
                    if (subFilter === "daDen") return !!p.daDon;
                    if (subFilter === "quaHan") return isOverdue;
                    if (subFilter === "huy") return isHuy;
                  } else {
                    if (subFilter === "followUp") return (!p.followUpStatus || p.followUpStatus === "Đang follow-up") && !isOverdue;
                    if (subFilter === "quaHan") return isOverdue;
                    if (subFilter === "daChot") return p.followUpStatus === "Đã chốt";
                    if (subFilter === "ngung") return p.followUpStatus === "Ngưng";
                  }
                  return true;
                })
                .map((p, idx) => {
                  const active = sel?.id === p.id;
                  const diags = parseDiag(p.chanDoan);
                  const isMo = p.trangThaiDieuTri === "Đã mổ" || !!p.ngayMoThucTe;
                  const isHuy = p.trangThaiDieuTri === "Hủy" || p.trangThaiDieuTri === "Không đến";
                  const isDaDen = !!p.daDon;
                  const isOverdue = isOverdue28Days(p);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        openDetail(p);
                        if (window.innerWidth < 1280) setShowList(false);
                      }}
                      className={`w-full text-left rounded-xl border p-3 transition-all duration-150 cursor-pointer relative ${
                        active
                          ? "border-indigo-600 bg-indigo-50/90 shadow-md ring-2 ring-indigo-500/20"
                          : p.trangThaiDieuTri === "Đã mổ trước đây" || p.trangThaiDieuTri === "Đã đến trước đây"
                          ? "border-purple-200 bg-purple-50/40 hover:bg-purple-50/80 hover:border-purple-300"
                          : isMo
                          ? "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/80 hover:border-emerald-300"
                          : isHuy
                          ? "border-rose-200 bg-rose-50/40 hover:bg-rose-50/80"
                          : isOverdue
                          ? "border-rose-200 bg-rose-50/30 hover:bg-rose-50/60"
                          : isDaDen
                          ? "border-sky-200 bg-sky-50/40 hover:bg-sky-50/80"
                          : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[11px] font-extrabold opacity-60">#{p.stt || idx + 1}</span>
                            <span className={`text-[14px] font-extrabold truncate ${active ? "text-indigo-950" : "text-slate-900"}`}>
                              {p.hoTen}
                            </span>
                            {p.namSinh && (
                              <span className="text-[11.5px] text-slate-500 font-semibold">({p.namSinh})</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-mono text-[11px] font-extrabold text-teal-800 bg-white px-2 py-0.5 rounded-md border border-teal-200 shadow-2xs">
                            {p.maBN?.split("-").pop() || p.maBN}
                          </span>
                        </div>
                      </div>

                      {diags.length > 0 && (
                        <div className="text-[11.5px] font-semibold text-slate-600 mt-1 truncate">
                          🩺 {diags.join(", ")}
                        </div>
                      )}

                      {/* Dynamic Status Badges Row (MKT & CSKH) */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200/60 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {p.trangThaiDieuTri === "Đã mổ trước đây" ? (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-black px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-2xs">
                              🟣 ĐÃ MỔ TRƯỚC ĐÂY
                            </span>
                          ) : p.trangThaiDieuTri === "Đã đến trước đây" ? (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                              🟣 ĐÃ ĐẾN TRƯỚC ĐÂY
                            </span>
                          ) : isMo ? (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                              ✓ ĐÃ MỔ
                            </span>
                          ) : isHuy ? (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
                              ❌ {p.trangThaiDieuTri || "HỦY"}
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                              ⚠️ QUÁ 28 NGÀY
                            </span>
                          ) : tab === "A" ? (
                            isDaDen ? (
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-black px-2 py-0.5 rounded-full bg-sky-600 text-white shadow-2xs">
                                🏥 ĐÃ ĐẾN BV
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                ⏳ CHỜ MỔ
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                              📞 {p.followUpStatus || "Đang follow-up"}
                            </span>
                          )}

                          {p.maBNHIS && (
                            <span className="text-[10px] font-extrabold font-mono px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                              ⚡ HIS
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-mono font-bold text-slate-600 shrink-0">
                          {p.ngayMoThucTe ? (
                            <span className="text-emerald-700 font-extrabold">📆 Mổ: {fmtDate(p.ngayMoThucTe)}</span>
                          ) : p.ngayDieuTri ? (
                            <span className="text-teal-800 font-semibold">📅 Hẹn: {fmtDate(p.ngayDieuTri)}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">Chưa hẹn</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
            )}
          </div>
        </aside>

        {/* COL 2 — Details Workspace */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0 bg-white overflow-hidden">
          {sel ? (
            <>
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                {/* COMPACT PATIENT HEADER STRIP (FULL INFO - NO TRUNCATION) */}
                <div className="bg-[var(--surface-soft)] border-b border-[var(--line)] px-4 sm:px-5 py-3 shrink-0 flex flex-col gap-2 shadow-2xs">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="font-serif font-bold text-[18px] sm:text-[19px] text-[var(--ink)] uppercase tracking-tight">
                        {sel.hoTen}
                      </h2>
                      <span className="font-mono font-bold text-[var(--navy)] bg-white px-2.5 py-0.5 rounded-[var(--r-sm)] border border-[var(--line)] text-xs shadow-2xs">
                        {sel.maBN}
                      </span>
                      {sel.maBNHIS && (
                        <span className="font-mono font-bold text-[var(--teal-deep)] bg-[var(--teal-soft)] px-2.5 py-0.5 rounded-[var(--r-sm)] border border-[var(--teal)] text-xs shadow-2xs">
                          HIS: {sel.maBNHIS}
                        </span>
                      )}
                      {sel.nhom && (
                        <span
                          className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded border shadow-2xs ${
                            sel.nhom === "A"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                          }`}
                        >
                          Nhóm {sel.nhom}
                        </span>
                      )}
                      <span className="text-xs font-bold text-[var(--ink-soft)] bg-white px-2 py-0.5 rounded-[var(--r-sm)] border border-[var(--line-soft)]">
                        {sel.gioiTinh} · {ageOf(sel)} tuổi
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => checkHisPatient(sel)}
                        disabled={checkingHis}
                        title="Đối chiếu HIS tự động"
                        className="px-2.5 sm:px-3 py-1 h-7 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {checkingHis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>⚡ Đối chiếu HIS</>}
                      </button>
                      <button
                        onClick={() => openHisSearch(sel)}
                        title="Tìm & chọn ca mổ trong HIS thủ công"
                        className="px-2.5 sm:px-3 py-1 h-7 text-xs font-bold rounded-lg bg-white hover:bg-slate-50 active:scale-95 border border-slate-300 text-slate-700 hover:text-slate-900 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5 text-slate-500" /> Tìm HIS
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap text-xs text-[var(--ink-soft)] pt-1.5 border-t border-[var(--line-soft)]/80">
                    {sel.cccd && (
                      <div className="flex items-center gap-1">
                        <span className="text-[var(--mute)] font-semibold">CCCD:</span>
                        <span className="font-mono font-bold text-[var(--ink)]">{sel.cccd}</span>
                      </div>
                    )}
                    {sel.bhyt && (
                      <div className="flex items-center gap-1">
                        <span className="text-[var(--mute)] font-semibold">BHYT:</span>
                        <span className="font-mono font-bold text-[var(--teal-deep)] bg-white px-1.5 py-0.5 rounded border border-[var(--line)]">
                          {sel.bhyt} <span className="text-[10px] text-[var(--teal)]">({bhytLevel(sel.bhyt)})</span>
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--mute)] font-semibold">Điện thoại:</span>
                      {sel.sdt ? (
                        <a
                          href={`tel:${sel.sdt}`}
                          className="font-mono font-bold text-[var(--navy)] hover:text-[var(--teal-deep)] inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[var(--line)]"
                        >
                          <Phone className="w-3 h-3 text-[var(--teal)]" /> {sel.sdt}
                        </a>
                      ) : (
                        <span className="font-mono text-[var(--mute)]">—</span>
                      )}
                    </div>
                    <div className="flex items-start sm:items-center gap-1.5 flex-1 min-w-[280px]">
                      <span className="text-[var(--mute)] font-semibold shrink-0">Địa chỉ:</span>
                      <span className="font-medium text-[var(--ink)] leading-relaxed break-words">
                        {sel.diaChi || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col xl:flex-row min-h-0 border-b border-[var(--line)] overflow-y-auto">
                  {/* NHẬT KÝ LIÊN HỆ */}
                  <div
                    data-tour="td-note"
                    className={`p-4 sm:p-6 xl:border-r border-[var(--line)] flex flex-col min-h-0 ${
                      tab === "A" ? "xl:w-[400px] shrink-0 bg-[var(--surface-bg)]" : "w-full"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <PhoneCall className="w-4 h-4 text-[var(--navy)]" />
                      <h3 className="font-bold text-[13px] uppercase tracking-wide">Nhật ký liên hệ</h3>
                    </div>
                    <div className="space-y-3.5">
                      {tab === "B" && (
                        <div>
                          <label className="text-[12.5px] font-bold text-[var(--ink-soft)] block mb-1">
                            Cập nhật trạng thái follow-up
                          </label>
                          <Dropdown
                            value={fstatus}
                            placeholder="Giữ nguyên trạng thái hiện tại"
                            mono={false}
                            options={FOLLOW}
                            onChange={setFstatus}
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-[12.5px] font-bold text-[var(--ink-soft)] block mb-1">
                          Thêm nhật ký mới
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                          className="input-field resize-none"
                          placeholder="Nhập kết quả gọi điện, ý kiến bệnh nhân…"
                        />
                      </div>
                      <button
                        onClick={addNote}
                        disabled={savingNote || !note.trim()}
                        className="btn btn-secondary w-full py-2.5 font-bold border border-[var(--line-strong)] shadow-xs bg-white hover:bg-[var(--surface-hover)] cursor-pointer disabled:opacity-50"
                      >
                        {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-[var(--navy)]" />}
                        <span>Ghi nhận liên hệ</span>
                      </button>
                      <div className="pt-4 mt-4 border-t border-[var(--line)] flex-1 flex flex-col min-h-0">
                        <h4 className="text-[11.5px] font-extrabold uppercase tracking-wider text-[var(--mute)] mb-2.5 shrink-0">
                          Lịch sử liên hệ
                        </h4>
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {(sel.nhatKy || []).length === 0 ? (
                            <div className="text-[12.5px] text-[var(--mute)] py-4 text-center">Chưa có lịch sử liên hệ.</div>
                          ) : (
                            sel.nhatKy!.map((n) => (
                              <div
                                key={n.id}
                                className="text-[13px] bg-white border border-[var(--line-soft)] rounded-lg p-3 shadow-2xs"
                              >
                                <div className="text-[var(--ink)] leading-snug">{n.noiDung}</div>
                                <div className="text-[11px] text-[var(--mute)] mt-1.5 flex items-center justify-between">
                                  <span className="font-semibold text-[var(--navy)]">{n.nguoiGoi?.hoTen}</span>
                                  <span className="font-mono">{fmtTime(n.ngay)}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TIẾP NHẬN & ĐIỀU TRỊ (CHỈ NHÓM A) */}
                  {tab === "A" && (
                    <div data-tour="td-treat" className="flex-1 p-4 sm:p-6 relative flex flex-col min-h-0">
                      <div className="flex items-center gap-2 mb-4 shrink-0">
                        <ClipboardList className="w-4 h-4 text-[var(--teal-deep)]" />
                        <h3 className="font-bold text-[13px] uppercase tracking-wide">Tiếp nhận & Điều trị tại BV</h3>
                      </div>

                      <div className="space-y-5">
                        <div
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                            f.daDon
                              ? "bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20 text-emerald-950 shadow-2xs"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
                          }`}
                          onClick={() =>
                            setF((s) => {
                              const nextDaDon = !s.daDon;
                              return {
                                ...s,
                                daDon: nextDaDon,
                                ngayDenBV: nextDaDon ? (s.ngayDenBV || new Date().toISOString().slice(0, 10)) : s.ngayDenBV,
                              };
                            })
                          }
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={f.daDon}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setF((s) => ({
                                  ...s,
                                  daDon: checked,
                                  ngayDenBV: checked ? (s.ngayDenBV || new Date().toISOString().slice(0, 10)) : s.ngayDenBV,
                                }));
                              }}
                              className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <div className="flex flex-col">
                              <label className="font-extrabold text-[14.5px] cursor-pointer select-none">
                                Bệnh nhân ĐÃ ĐẾN BỆNH VIỆN
                              </label>
                              <span className="text-[12px] opacity-75 font-medium">
                                {f.daDon ? "✓ Đã xác nhận đến BV điều trị" : "Tích chọn khi bệnh nhân có mặt tại viện"}
                              </span>
                            </div>
                          </div>

                          {sel?.ngayDieuTri ? (
                            <div className="text-[11.5px] font-semibold text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded-lg border border-teal-300/80 shrink-0">
                              📅 Lịch hẹn mổ (Tư vấn): <span className="font-mono font-bold">{fmtDate(sel.ngayDieuTri)}</span>
                            </div>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                          <DateField
                            label="Ngày đến bệnh viện"
                            value={f.ngayDenBV}
                            onChange={(v) =>
                              setF((s) => ({
                                ...s,
                                ngayDenBV: v,
                                daDon: v ? true : s.daDon,
                              }))
                            }
                          />
                          <DateField
                            label="Ngày mổ thực tế"
                            value={f.ngayMoThucTe}
                            onChange={(v) =>
                              setF((s) => ({
                                ...s,
                                ngayMoThucTe: v,
                                daDon: v ? true : s.daDon,
                                ngayDenBV: v ? (s.ngayDenBV || v) : s.ngayDenBV,
                                trangThaiDieuTri: v ? (s.trangThaiDieuTri || "Đã mổ") : s.trangThaiDieuTri,
                              }))
                            }
                          />
                          <div>
                            <label className={labelCls}>Số tiền thực thu (VNĐ)</label>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="VD: 5.000.000"
                                value={f.soTienThucThu ? new Intl.NumberFormat("vi-VN").format(Number(f.soTienThucThu)) : ""}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/[^\d]/g, "");
                                  setF((s) => ({ ...s, soTienThucThu: raw }));
                                }}
                                className="w-full h-10 px-3 font-mono font-bold text-teal-800 bg-white border border-slate-300 rounded-xl text-[14px] outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs pr-12"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-bold uppercase">
                                VNĐ
                              </span>
                            </div>
                          </div>

                          <div className="md:col-span-2 space-y-1.5">
                            <label className={labelCls}>Trạng thái điều trị</label>
                            <div className="flex items-center gap-2 flex-wrap">
                              {[
                                { key: "Đã mổ", label: "Đã mổ", color: "bg-emerald-600 text-white border-emerald-600 shadow-xs font-extrabold" },
                                { key: "Đã mổ trước đây", label: "Đã mổ trước đây", color: "bg-purple-600 text-white border-purple-600 shadow-xs font-extrabold" },
                                { key: "Đã đến trước đây", label: "Đã đến trước đây", color: "bg-indigo-600 text-white border-indigo-600 shadow-xs font-extrabold" },
                                { key: "Hủy", label: "Hủy", color: "bg-rose-600 text-white border-rose-600 shadow-xs font-extrabold" },
                                { key: "Không đến", label: "Không đến", color: "bg-amber-600 text-white border-amber-600 shadow-xs font-extrabold" },
                              ].map((opt) => {
                                const active = f.trangThaiDieuTri === opt.key;
                                return (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() =>
                                      setF((s) => {
                                        const isMo = opt.key === "Đã mổ";
                                        const nextVal = active ? "" : opt.key;
                                        return {
                                          ...s,
                                          trangThaiDieuTri: nextVal,
                                          daDon: isMo && !active ? true : s.daDon,
                                          ngayMoThucTe: isMo && !active && !s.ngayMoThucTe ? new Date().toISOString().slice(0, 10) : s.ngayMoThucTe,
                                        };
                                      })
                                    }
                                    className={`px-4 py-2 rounded-xl text-[13px] font-bold border transition-all cursor-pointer active:scale-95 ${
                                      active
                                        ? opt.color
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <DateField
                            label="Hẹn tái khám"
                            value={f.ngayTaiKham}
                            onChange={(v) => setF((s) => ({ ...s, ngayTaiKham: v }))}
                          />
                          <div className="md:col-span-2 space-y-2">
                            {f.ghiChuMat2 && f.ghiChuMat2.includes("[HIS]") && (
                              <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/90 via-emerald-50/60 to-sky-50/40 p-3.5 shadow-2xs space-y-2 mb-2">
                                <div className="flex items-center justify-between gap-2 border-b border-teal-200/80 pb-2 flex-wrap">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Zap className="w-4 h-4 text-teal-600 fill-teal-600" />
                                    <span className="font-extrabold text-teal-950 text-[13px]">
                                      HỒ SƠ ĐỐI CHIẾU HIS BỆNH VIỆN
                                    </span>
                                    {sel?.maBNHIS && (
                                      <span className="font-mono text-xs font-extrabold bg-white text-teal-800 px-2 py-0.5 rounded border border-teal-200 shadow-2xs">
                                        Mã HIS: {sel.maBNHIS}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => sel && checkHisPatient(sel)}
                                      disabled={checkingHis}
                                      className="text-[11px] font-bold text-teal-800 bg-white hover:bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-300 shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
                                      title="Kiểm tra lại hồ sơ này với HIS bằng thuật toán lọc chuẩn"
                                    >
                                      <RefreshCw className={`w-3 h-3 ${checkingHis ? "animate-spin" : ""}`} />
                                      <span>Rà soát lại</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => { setHisQuery(sel?.hoTen || ""); setHisSearchOpen(true); }}
                                      className="text-[11px] font-bold text-indigo-800 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-300 shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
                                      title="Tìm kiếm mã HIS khác để liên kết lại"
                                    >
                                      <Search className="w-3 h-3" />
                                      <span>Đổi mã HIS</span>
                                    </button>

                                    {isManager && (
                                      <button
                                        type="button"
                                        onClick={unlinkHis}
                                        className="text-[11px] font-bold text-rose-700 bg-white hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-300 shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
                                        title="Hủy liên kết mã HIS nếu sai hồ sơ bệnh nhân"
                                      >
                                        <X className="w-3 h-3" />
                                        <span>Hủy liên kết</span>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="text-[12.5px] text-slate-800 font-medium whitespace-pre-wrap leading-relaxed font-sans">
                                  {f.ghiChuMat2.substring(f.ghiChuMat2.indexOf("[HIS]")).replace(/^\[HIS\]:\s*/, "").trim()}
                                </div>
                              </div>
                            )}

                            <label className={labelCls}>Ghi chú (nhóm tài liệu mặt 2)</label>
                            <textarea
                              rows={3}
                              placeholder="Sức khỏe, thuốc, dặn dò..."
                              value={
                                f.ghiChuMat2 && f.ghiChuMat2.includes("[HIS]")
                                  ? f.ghiChuMat2.substring(0, f.ghiChuMat2.indexOf("[HIS]")).trim()
                                  : f.ghiChuMat2 || ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                setF((s) => {
                                  const full = s.ghiChuMat2 || "";
                                  const idx = full.indexOf("[HIS]");
                                  const hisPart = idx !== -1 ? full.substring(idx).trim() : "";
                                  const nextVal = val.trim()
                                    ? (hisPart ? `${val.trim()}\n\n${hisPart}` : val.trim())
                                    : hisPart;
                                  return { ...s, ghiChuMat2: nextVal };
                                });
                              }}
                              className="w-full p-3 font-medium text-slate-800 bg-white border border-slate-300 rounded-xl text-[13.5px] outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs min-h-[80px] leading-relaxed resize-y"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Unified Action Bar */}
              <div className="px-2 sm:px-4 py-1.5 sm:py-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.375rem)] border-t border-[var(--line)] bg-white/95 backdrop-blur-sm sticky bottom-0 z-30 flex items-center justify-between gap-1.5 sm:gap-2 shadow-lg shrink-0">
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                  {/* Nút mở danh sách bệnh nhân trên mobile chuẩn theo style DS */}
                  <button
                    type="button"
                    onClick={() => setShowList(true)}
                    className="xl:hidden h-8 px-2.5 rounded-lg bg-[#002b7f] hover:bg-[var(--navy-deep)] text-white font-bold text-[12px] flex items-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Users className="w-3.5 h-3.5 text-[#00d2d3]" />
                    <span className="font-extrabold text-[12px] text-white">DS</span>
                    <span className="min-w-[18px] h-[18px] px-1 bg-[#e11d48] text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                      {rows.length}
                    </span>
                  </button>

                  {/* Bộ phím chuyển ca Trước / Sau nhanh cho Mobile */}
                  <div className="xl:hidden flex items-center gap-0.5 border border-[var(--line)] rounded-lg p-0.5 bg-[var(--surface-soft)] shrink-0">
                    <button
                      type="button"
                      onClick={() => prevPatient && openDetail(prevPatient)}
                      disabled={!prevPatient}
                      className="p-1 rounded text-[var(--ink-soft)] hover:bg-white disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                      title="Ca trước"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-[9.5px] sm:text-[10px] font-mono font-bold px-0.5 text-[var(--mute)]">
                      {curPatientIndex >= 0 ? `${curPatientIndex + 1}/${rows.length}` : "—"}
                    </span>
                    <button
                      type="button"
                      onClick={() => nextPatient && openDetail(nextPatient)}
                      disabled={!nextPatient}
                      className="p-1 rounded text-[var(--ink-soft)] hover:bg-white disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                      title="Ca tiếp"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="hidden md:inline-flex text-[11px] sm:text-[12px] items-center gap-1 min-w-0 truncate">
                    {tab === "A" && dirtyDieuTri ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-[var(--amber)] truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-pulse shrink-0" /> Chưa lưu điều trị
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[var(--mute)] truncate">
                        <Check className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" /> Đã lưu
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {tab === "A" && (
                    <button
                      type="button"
                      onClick={saveDieuTri}
                      disabled={savingDieuTri || !dirtyDieuTri}
                      className="btn btn-primary px-3 sm:px-6 py-1.5 font-bold h-8 sm:h-9 text-[11px] sm:text-[13px] shrink-0 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {savingDieuTri ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[var(--teal)]" />}
                      <span>Lưu điều trị</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-between min-h-0">
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--mute)] text-center px-6 py-12 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[var(--navy-50)] text-[var(--navy)] flex items-center justify-center border border-[var(--navy-100)] shadow-2xs">
                  <PhoneCall className="w-7 h-7 text-[var(--teal-deep)]" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <div className="font-bold text-[15px] text-[var(--ink)]">
                    {rows.length > 0 ? "Chưa chọn bệnh nhân" : `Chưa có ca nhóm ${tab}`}
                  </div>
                  <div className="text-[12.5px] text-[var(--mute)] leading-relaxed">
                    {rows.length > 0
                      ? `Đợt khám có ${rows.length} bệnh nhân nhóm ${tab}. Bấm nút bên dưới để mở danh sách chọn ca.`
                      : `Đợt khám này chưa có bệnh nhân nào thuộc nhóm ${tab}.`}
                  </div>
                </div>
                {rows.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowList(true)}
                    className="btn btn-primary px-5 py-2.5 font-bold rounded-xl shadow-md flex items-center gap-2 mt-2 cursor-pointer active:scale-95"
                  >
                    <Users className="w-4 h-4 text-[var(--teal)]" />
                    <span>Mở danh sách bệnh nhân ({rows.length})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowBkModal(true)}
                    className="btn btn-secondary px-5 py-2.5 font-bold rounded-xl border border-[var(--line-strong)] flex items-center gap-2 mt-2 cursor-pointer"
                  >
                    <CalendarDays className="w-4 h-4 text-[var(--navy)]" />
                    <span>Chọn đợt khám khác</span>
                  </button>
                )}
              </div>

              {/* Thanh đáy dự phòng trên Mobile khi chưa chọn bệnh nhân */}
              <div className="xl:hidden px-3 py-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.375rem)] border-t border-[var(--line)] bg-white/95 backdrop-blur-sm sticky bottom-0 z-30 flex items-center justify-between shadow-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setShowList(true)}
                  className="h-8 px-2.5 rounded-lg bg-[#002b7f] hover:bg-[var(--navy-deep)] text-white font-bold text-[12px] flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <Users className="w-3.5 h-3.5 text-[#00d2d3]" />
                  <span className="font-extrabold text-[12px] text-white">DS</span>
                  <span className="min-w-[18px] h-[18px] px-1 bg-[#e11d48] text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {rows.length}
                  </span>
                </button>
                <span className="text-[11.5px] text-[var(--mute)] font-medium">Chưa chọn ca</span>
              </div>
            </div>
          )}
        </main>
      </div>
      )}

      {/* Modal Chọn Đợt Khám */}
      <Modal
        open={showBkModal}
        onClose={() => setShowBkModal(false)}
        title={<>Chọn <span className="italic font-normal text-[var(--teal)]">đợt khám</span></>}
        subtitle="Lấy danh sách bệnh nhân để theo dõi & chăm sóc"
        icon={CalendarDays}
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
                className={`w-full text-left p-4 rounded-[var(--r-lg)] transition-all duration-200 flex items-center gap-4 border cursor-pointer ${
                  active
                    ? "bg-white border-[var(--navy)] shadow-md ring-1 ring-[var(--navy)]"
                    : "bg-white border-[var(--line)] shadow-xs hover:border-[var(--line-strong)] hover:shadow-sm"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-[var(--r-md)] flex items-center justify-center shrink-0 border transition-colors ${
                    active
                      ? "bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] border-transparent text-white shadow-xs"
                      : "bg-[var(--navy-50)] border-[var(--navy-100)] text-[var(--navy)]"
                  }`}
                >
                  {active ? <Check className="w-5 h-5 text-[var(--teal)]" /> : <MapPin className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[15px] truncate text-[var(--ink)]" title={fmtBuoiKhamName(b)}>
                      {fmtBuoiKhamName(b)}
                    </span>
                    <span className="font-mono text-[11.5px] font-bold px-2 py-0.5 rounded-[var(--r-sm)] shrink-0 bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)]">
                      {b.id}
                    </span>
                  </div>
                  <div className="text-[13px] text-[var(--mute)] mt-1.5 flex items-center gap-4 font-medium">
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
                  className={`p-4 border rounded-xl transition-all flex items-center justify-between gap-4 ${
                    item.hasSurgery
                      ? "border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 shadow-2xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 shadow-2xs"
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="font-bold text-[14.5px] text-slate-900 flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold">{item.hoTen}</span>
                      <span className="font-mono text-[11.5px] font-extrabold text-teal-800 bg-teal-100 px-2 py-0.5 rounded border border-teal-200">
                        Mã HIS: {item.maHIS}
                      </span>
                      {item.namSinh && <span className="text-[12px] text-slate-500 font-medium">({item.namSinh})</span>}

                      {item.hasSurgery ? (
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                          ✓ {item.ngayMo ? `ĐÃ MỔ/NHẬP VIỆN (${fmtDate(item.ngayMo)})` : "GHI NHẬN MỔ/NỘI TRÚ"}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          ℹ️ KHÁM NGOẠI TRÚ
                        </span>
                      )}
                    </div>

                    <div className="text-[12.5px] text-slate-600 flex items-center gap-3 flex-wrap font-medium">
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
                      <div className="text-[12px] font-extrabold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 inline-block">
                        👁️ Phẫu thuật: <span className="text-teal-700">{item.loaiPhauThuat}</span>
                        {item.tenDichVu ? ` — ${item.tenDichVu}` : ""}
                      </div>
                    )}

                    {item.chanDoan && (
                      <div className="text-[12.5px] font-semibold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/80 inline-block">
                        🩺 Chẩn đoán: {item.chanDoan}
                      </div>
                    )}

                    {item.soTienThucThu != null && item.soTienThucThu > 0 && (
                      <div className="text-[12px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 border border-emerald-300">
                        💰 Thực thu HIS: {new Intl.NumberFormat("vi-VN").format(item.soTienThucThu)} VNĐ
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => confirmHisSurgery(item)}
                    disabled={hisLinking === item.maHIS}
                    className="btn btn-primary px-3 py-1.5 text-xs font-bold shrink-0 cursor-pointer"
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
              className="px-4 py-2 rounded-xl text-[13px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer active:scale-95 transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmModal((s) => ({ ...s, open: false }));
                confirmModal.onConfirm();
              }}
              className={`px-4.5 py-2 rounded-xl text-[13px] font-extrabold text-white shadow-sm cursor-pointer active:scale-95 transition-all ${
                confirmModal.variant === "danger"
                  ? "bg-rose-600 hover:bg-rose-700 border border-rose-600"
                  : confirmModal.variant === "warning"
                  ? "bg-amber-600 hover:bg-amber-700 border border-amber-600"
                  : "bg-indigo-600 hover:bg-indigo-700 border border-indigo-600"
              }`}
            >
              {confirmModal.confirmText || "Xác nhận"}
            </button>
          </>
        }
      >
        <p className="text-[13.5px] text-slate-700 leading-relaxed font-medium">
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
              className="w-full py-2.5 rounded-xl text-[13.5px] font-extrabold text-white bg-teal-800 hover:bg-teal-900 shadow-xs cursor-pointer active:scale-95 transition-all"
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
                <div className="w-16 h-16 rounded-full border-4 border-teal-200 border-t-teal-700 animate-spin" />
                <Zap className="w-7 h-7 text-teal-800 absolute animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-[14px] font-extrabold text-slate-800">
                  {progressModal.message}
                </p>
                <p className="text-[12px] text-slate-500 font-medium">
                  Vui lòng không đóng trình duyệt trong quá trình xử lý...
                </p>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200 mt-2">
                <div className="h-full bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-600 animate-pulse w-full rounded-full" />
              </div>
            </div>
          ) : progressModal.status === "success" ? (
            <div className="space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-[14px] font-extrabold text-emerald-950 leading-relaxed">
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
              <div className="w-14 h-14 rounded-full bg-rose-100 border-2 border-rose-300 text-rose-700 flex items-center justify-center mx-auto shadow-xs">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <p className="text-[14px] font-extrabold text-rose-900 leading-relaxed">
                {progressModal.message}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
