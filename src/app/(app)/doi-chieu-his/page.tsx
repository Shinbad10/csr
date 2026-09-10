"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import {
  Activity, RefreshCw, CheckCircle2, Search,
  Calendar, Users, ShieldCheck, Database, Check,
  Play, Download, UserCheck, Stethoscope, Sparkles,
  CalendarDays, X, AlertTriangle, ShieldQuestion, ArrowRight,
  CalendarCheck, Clock, CheckCircle, Zap, ChevronLeft, ChevronRight, Eye
} from "lucide-react";
import { fmtDate, fmtBuoiKhamName } from "@/lib/csr";
import { Dropdown } from "@/components/csr/fields";
import { DataView, DataTable, DataPagination } from "@/components/data";
import type { ColumnDef } from "@tanstack/react-table";
import { useCurrentFacility } from "@/lib/useFacility";

// Dữ liệu đối chiếu HIS trả về không có schema cố định — dùng bản ghi mở.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HisRow = Record<string, any>;

/* ─────────────────────────────────────────────────────────────────────────
   Giờ mổ: LUÔN dùng `ngayMoLocal` ("YYYY-MM-DD HH:mm:ss" — đúng như HIS lưu).
   `ngayMo` là chuỗi ISO do driver mssql đọc cột datetime theo UTC, nên ở VN bị
   lệch +7h: ca lưu 9/9 17:15 sẽ hiện thành 10/9 00:15. Trong khi bộ lọc theo
   ngày lại chạy server-side trên giá trị gốc → quét ngày và quét tháng cho ra
   kết quả lệch nhau đúng 7 tiếng.
   ───────────────────────────────────────────────────────────────────────── */
/** Phần ngày "YYYY-MM-DD" theo giờ HIS. */
const hisNgay = (r: HisRow): string =>
  r?.ngayMoLocal ? String(r.ngayMoLocal).slice(0, 10) : r?.ngayMo ? String(r.ngayMo).slice(0, 10) : "";
/** Phần giờ "HH:mm" theo giờ HIS. */
const hisGio = (r: HisRow): string => (r?.ngayMoLocal ? String(r.ngayMoLocal).slice(11, 16) : "");

interface BuoiKham {
  id: string;
  ngayKham: string;
  xa: string;
  diaDiem: string;
  _count?: { hoSo: number };
}


function CompactStatCard({ label, value, sub, icon: Icon, tone }: {
  label: string; value: React.ReactNode; sub?: React.ReactNode; icon: any; tone: "navy" | "teal" | "gold" | "amber";
}) {
  const tones = {
    navy: { chip: "bg-[var(--navy-50)] text-[var(--navy)]", val: "text-[var(--navy)]" },
    teal: { chip: "bg-[var(--teal-soft)] text-[var(--teal-deep)]", val: "text-[var(--teal-deep)]" },
    gold: { chip: "bg-[var(--gold-soft)] text-[var(--gold-deep)]", val: "text-[var(--gold-deep)]" },
    amber: { chip: "bg-[var(--amber-soft)] text-[var(--amber-deep)]", val: "text-[var(--amber-deep)]" },
  }[tone];
  return (
    <div className="bg-white border border-[var(--line)] rounded-xl px-3 py-2 flex items-center justify-between gap-2.5 shadow-2xs">
      <div className="min-w-0">
        <div className="text-[10px] font-bold text-[var(--mute)] uppercase tracking-wider truncate">{label}</div>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className={`text-[18px] leading-none font-mono font-extrabold ${tones.val}`}>{value}</span>
          {sub && <span className="text-[10.5px] text-[var(--mute)] truncate">{sub}</span>}
        </div>
      </div>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tones.chip}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

export default function DoiChieuHisPage() {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const { currentCoSo, activeCoSoId, hasHisConfig, loading: facilityLoading } = useCurrentFacility();
  const [tab, setTab] = useState<"today" | "batch" | "reverse">("today");

  // Tab 1 (MỚI): Theo dõi mổ trong ngày (Hôm nay / Chọn ngày cụ thể)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dailyDate, setDailyDate] = useState<string>(todayStr);
  const [dailyLoading, setDailyLoading] = useState<boolean>(false);
  const [dailyList, setDailyList] = useState<any[]>([]);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [hasScannedDaily, setHasScannedDaily] = useState<boolean>(false);
  const [dailySearch, setDailySearch] = useState<string>("");
  const [dailyFilterStatus, setDailyFilterStatus] = useState<"all" | "unlinked" | "linked" | "mat2" | "unmatched">("all");
  const [syncingAll, setSyncingAll] = useState<boolean>(false);

  // Tab 1: Batch Check state (Mặc định chọn tháng hiện tại)
  const [buoiKhams, setBuoiKhams] = useState<BuoiKham[]>([]);
  const [selectedBuoiId, setSelectedBuoiId] = useState<string>("");
  const [batchMonth, setBatchMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [batchLoading, setBatchLoading] = useState<boolean>(false);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [batchSummary, setBatchSummary] = useState<any>(null);
  const [hasScannedBatch, setHasScannedBatch] = useState<boolean>(false);

  // Filter states cho Tab 1
  const [batchSearch, setBatchSearch] = useState<string>("");
  const [batchFilterStatus, setBatchFilterStatus] = useState<"all" | "found" | "surgery" | "pending" | "not_found">("all");

  // Tab 2: Reverse Check state (Mặc định chọn tháng hiện tại)
  const [revMonth, setRevMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [revLoading, setRevLoading] = useState<boolean>(false);
  const [revList, setRevList] = useState<any[]>([]);
  const [revSummary, setRevSummary] = useState<any>(null);
  const [hasScannedRev, setHasScannedRev] = useState<boolean>(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Filter states cho Tab 2 (Lọc theo ngày, từ khóa, trạng thái)
  const [revSearch, setRevSearch] = useState<string>("");
  const [revFilterDate, setRevFilterDate] = useState<string>(""); // YYYY-MM-DD
  const [revFilterStatus, setRevFilterStatus] = useState<"all" | "matched" | "unmatched" | "linked" | "mat2">("all");

  // Load BuoiKham list
  useEffect(() => {
    fetch("/api/csr/buoikham")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBuoiKhams(data);
          if (data.length > 0) setSelectedBuoiId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Map cho Dropdown Buổi khám
  const bkOptions = useMemo(() => buoiKhams.map((b) => b.id), [buoiKhams]);
  const bkLabels = useMemo(() => {
    const map: Record<string, string> = {};
    buoiKhams.forEach((b) => {
      const countStr = b._count?.hoSo ? ` (${b._count.hoSo} BN)` : "";
      map[b.id] = `${fmtDate(b.ngayKham)} · ${fmtBuoiKhamName(b)}${countStr}`;
    });
    return map;
  }, [buoiKhams]);

  // Map cho chọn Tháng HIS (18 tháng trước -> 6 tháng sau)
  const monthOptions = useMemo(() => {
    const options: string[] = [""];
    const labels: Record<string, string> = {
      "": "🌐 Tất cả các tháng (Không lọc theo tháng)",
    };
    const now = new Date();
    const currentY = now.getFullYear();
    const currentStr = `${currentY}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const temp: string[] = [];
    for (let i = -18; i <= 6; i++) {
      const d = new Date(currentY, now.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const val = `${y}-${String(m).padStart(2, "0")}`;
      temp.push(val);
      labels[val] = val === currentStr ? `📅 Tháng ${String(m).padStart(2, "0")} / ${y} (Hiện tại)` : `📅 Tháng ${String(m).padStart(2, "0")} / ${y}`;
    }
    temp.sort().reverse();
    return { options: ["", ...temp], labels };
  }, []);

  // Map cho chọn Ngày mổ cụ thể trong Tab 2 (Tự động đếm số ca mổ từng ngày)
  const revDateOptions = useMemo(() => {
    const dateMap: Record<string, number> = {};
    revList.forEach((r) => {
      if (r.ngayMo) {
        const dStr = hisNgay(r);
        dateMap[dStr] = (dateMap[dStr] || 0) + 1;
      }
    });
    const sortedDates = Object.keys(dateMap).sort().reverse();
    const options = ["", ...sortedDates];
    const labels: Record<string, string> = {
      "": "📅 Tất cả các ngày trong tháng",
    };
    sortedDates.forEach((d) => {
      labels[d] = `📅 Ngày ${fmtDate(d)} (${dateMap[d]} ca mổ)`;
    });
    return { options, labels };
  }, [revList]);

  // ── Tab 1: Theo dõi mổ trong ngày Handlers ──
  const runDailyCheck = async (dateToUse?: string) => {
    const targetDate = dateToUse || dailyDate;
    if (!targetDate) {
      addToast({ type: "info", message: "Vui lòng chọn ngày cần kiểm tra mổ" });
      return;
    }
    setDailyLoading(true);
    setHasScannedDaily(true);
    try {
      const res = await fetch("/api/his/reverse-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coSoId: activeCoSoId, date: targetDate }),
      });
      const d = await res.json();
      if (res.ok) {
        setDailyList(d.list || []);
        setDailySummary(d.summary || null);
        addToast({
          type: "success",
          message: `Đã tìm thấy ${d.summary?.totalHIS || 0} ca mổ ngày ${fmtDate(targetDate)} (${d.summary?.matchedCSR || 0} ca khớp CSR)`,
        });
      } else {
        addToast({ type: "error", message: d.error || "Lỗi khi quét dữ liệu từ HIS" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối tới máy chủ HIS" });
    } finally {
      setDailyLoading(false);
    }
  };

  const shiftDailyDate = (days: number) => {
    try {
      const [y, m, d] = (dailyDate || todayStr).split("-").map(Number);
      const dt = new Date(y, m - 1, d + days);
      const yStr = dt.getFullYear();
      const mStr = String(dt.getMonth() + 1).padStart(2, "0");
      const dStr = String(dt.getDate()).padStart(2, "0");
      const nextDate = `${yStr}-${mStr}-${dStr}`;
      setDailyDate(nextDate);
      runDailyCheck(nextDate);
    } catch {}
  };

  const linkDailyPatient = async (item: any) => {
    if (!item.matchedCsr?.id) return;
    setLinkingId(item.matchedCsr.id);
    try {
      const isSecondEye = Boolean(item.isMat2 || (item.lanMo && item.lanMo >= 2));
      const res = await fetch("/api/his/link-reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoSoId: item.matchedCsr.id,
          maHIS: item.maHIS,
          ngayMo: item.ngayMo,
          soTienThucThu: item.soTienThucThu,
          isMat2: isSecondEye,
          tenDichVu: item.tenDichVu,
          matMo: item.matMo,
          loaiPT: item.loaiPT,
          chiTiet: isSecondEye
            ? `Mắt 2: Mổ ngày ${fmtDate(hisNgay(item))} (${item.tenDichVu || item.loaiPT || "Phẫu thuật"}${item.matMo ? ` - ${item.matMo}` : ""})`
            : `Mổ ngày ${fmtDate(hisNgay(item))} (Khoa: ${item.khoaMo || "Phòng mổ"}, Bác sĩ: ${item.bsDieuTri || "—"}${item.tenDichVu ? `, DV: ${item.tenDichVu}` : ""})`,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        addToast({
          type: "success",
          message: isSecondEye
            ? `Đã ghi nhận Mắt 2 cho bệnh nhân ${item.hoTen || item.matchedCsr.hoTen}`
            : `Đã cập nhật Đã mổ cho bệnh nhân ${item.hoTen || item.matchedCsr.hoTen}`,
        });
        setDailyList((prev) =>
          prev.map((r) =>
            r.matchedCsr?.id === item.matchedCsr.id
              ? {
                  ...r,
                  matchedCsr: {
                    ...r.matchedCsr,
                    daMo: true,
                    maBNHIS: item.maHIS,
                    trangThaiDieuTri: "Đã mổ",
                    ghiChuMat2: isSecondEye ? "Mắt 2" : r.matchedCsr.ghiChuMat2,
                  },
                }
              : r
          )
        );
        setDailySummary((prev: any) => prev ? {
          ...prev,
          alreadyLinked: (prev.alreadyLinked || 0) + 1,
          unlinkedMatched: Math.max(0, (prev.unlinkedMatched || 0) - 1),
        } : null);
      } else {
        addToast({ type: "error", message: d.error || "Lỗi cập nhật hồ sơ" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối máy chủ" });
    } finally {
      setLinkingId(null);
    }
  };

  const syncAllDailyUnlinked = async () => {
    const unlinked = dailyList.filter((r) => r.matchedCsr && !r.matchedCsr.daMo && !r.matchedCsr.maBNHIS);
    if (unlinked.length === 0) {
      addToast({ type: "info", message: "Tất cả các ca mổ khớp đều đã được cập nhật vào CSR!" });
      return;
    }

    const ok = await confirm({
      title: "Đồng bộ tất cả ca mổ vào CSR",
      message: `Bạn có chắc chắn muốn đánh dấu "Đã mổ" vào hồ sơ CSR cho toàn bộ ${unlinked.length} bệnh nhân đã khớp không? Dữ liệu sẽ được lưu vĩnh viễn vào hệ thống CSR.`,
      confirmLabel: `Đồng bộ ${unlinked.length} ca`,
    });
    if (!ok) return;

    setSyncingAll(true);
    try {
      const items = unlinked.map((r) => ({
        hoSoId: r.matchedCsr.id,
        maHIS: r.maHIS,
        ngayMo: r.ngayMo,
        soTienThucThu: r.soTienThucThu,
        isMat2: r.isMat2,
        tenDichVu: r.tenDichVu,
        matMo: r.matMo,
        loaiPT: r.loaiPT,
        chiTiet: r.isMat2
          ? `Mắt 2: Mổ ngày ${fmtDate(hisNgay(r))} (${r.tenDichVu || r.loaiPT}${r.matMo ? ` - ${r.matMo}` : ""})`
          : `Mổ ngày ${fmtDate(hisNgay(r))} (Khoa: ${r.khoaMo || "Phòng mổ"}, Bác sĩ: ${r.bsDieuTri || "—"}${r.tenDichVu ? `, DV: ${r.tenDichVu}` : ""})`,
      }));
      const res = await fetch("/api/his/link-reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const d = await res.json();
      if (res.ok) {
        addToast({ type: "success", message: `Đã đồng bộ thành công ${d.count || unlinked.length} ca mổ vào CSR!` });
        const unlinkedIds = new Set(unlinked.map((u) => u.matchedCsr.id));
        setDailyList((prev) =>
          prev.map((r) =>
            r.matchedCsr && unlinkedIds.has(r.matchedCsr.id)
              ? { ...r, matchedCsr: { ...r.matchedCsr, daMo: true, maBNHIS: r.maHIS, trangThaiDieuTri: "Đã mổ", ghiChuMat2: r.isMat2 ? "Mắt 2" : r.matchedCsr.ghiChuMat2 } }
              : r
          )
        );
        setDailySummary((prev: any) => prev ? {
          ...prev,
          alreadyLinked: (prev.alreadyLinked || 0) + unlinked.length,
          unlinkedMatched: 0,
        } : null);
      } else {
        addToast({ type: "error", message: d.error || "Lỗi khi đồng bộ hàng loạt" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối máy chủ" });
    } finally {
      setSyncingAll(false);
    }
  };

  // Run Batch Check
  const runBatchCheck = async () => {
    if (!selectedBuoiId) {
      addToast({ type: "info", message: "Vui lòng chọn đợt khám tầm soát" });
      return;
    }
    setBatchLoading(true);
    setBatchResults([]);
    setBatchSummary(null);
    setHasScannedBatch(true);
    try {
      const res = await fetch("/api/his/batch-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buoiKhamId: selectedBuoiId, month: batchMonth || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: data.error || "Lỗi khi quét HIS" });
        return;
      }
      setBatchResults(data.results || []);
      setBatchSummary(data.summary || null);
      addToast({
        type: "success",
        message: `Đã đối chiếu ${data.summary?.total || 0} BN. Tìm thấy ${data.summary?.found || 0} hồ sơ HIS, ${data.summary?.surgery || 0} ca phẫu thuật/điều trị!`,
      });
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối máy chủ" });
    } finally {
      setBatchLoading(false);
    }
  };

  // Run Reverse Check
  const runReverseCheck = async () => {
    setRevLoading(true);
    setRevList([]);
    setRevSummary(null);
    setHasScannedRev(true);
    try {
      const res = await fetch("/api/his/reverse-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coSoId: activeCoSoId, month: revMonth || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: data.error || "Lỗi tải danh sách HIS" });
        return;
      }
      setRevList(data.list || data.surgeries || []);
      setRevSummary(data.summary || null);
      addToast({
        type: "success",
        message: `Đã tải ${data.summary?.totalHIS || 0} ca mổ HIS. Khớp ${data.summary?.matchedCSR || 0} BN tầm soát CSR!`,
      });
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối máy chủ HIS" });
    } finally {
      setRevLoading(false);
    }
  };

  // Xác nhận thủ công cho partial match (chỉ khớp họ tên + năm sinh, chưa CCCD)
  const confirmPartialMatch = async (r: any) => {
    if (!r.id) return;
    setConfirmingId(r.id);
    try {
      const res = await fetch("/api/his/link-reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoSoId: r.id,
          maHIS: r.maHIS,
          ngayMo: r.ngayMo || null,
          chiTiet: r.chiTiet || `Xác nhận thủ công: ${r.hoTen} (Mã HIS: ${r.maHIS})`,
        }),
      });
      if (res.ok) {
        addToast({ type: "success", message: `Đã xác nhận đã mổ cho ${r.hoTen}` });
        // Update local state
        setBatchResults((prev) =>
          prev.map((item) =>
            item.id === r.id ? { ...item, confirmed: true } : item
          )
        );
      } else {
        const d = await res.json();
        addToast({ type: "error", message: d.error || "Lỗi xác nhận" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối" });
    } finally {
      setConfirmingId(null);
    }
  };

  // Link single patient in Reverse Check
  const linkPatient = async (item: any) => {
    if (!item.matchedCsr?.id) return;
    setLinkingId(item.matchedCsr.id);
    try {
      const res = await fetch("/api/his/link-reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoSoId: item.matchedCsr.id,
          maHIS: item.maHIS,
          ngayMo: item.ngayMo,
          soTienThucThu: item.soTienThucThu,
          isMat2: item.isMat2,
          tenDichVu: item.tenDichVu,
          matMo: item.matMo,
          loaiPT: item.loaiPT,
          chiTiet: item.isMat2
            ? `Mắt 2: Mổ ngày ${fmtDate(hisNgay(item))} (${item.tenDichVu || item.loaiPT}${item.matMo ? ` - ${item.matMo}` : ""})`
            : `Mổ ngày ${fmtDate(hisNgay(item))} (Khoa: ${item.khoaMo || "Phòng mổ"}, Bác sĩ: ${item.bsDieuTri || "—"}${item.tenDichVu ? `, DV: ${item.tenDichVu}` : ""})`,
        }),
      });
      if (res.ok) {
        addToast({ type: "success", message: `Đã liên kết ${item.isMat2 ? "Mắt 2" : "mã HIS"} cho ${item.matchedCsr.hoTen}` });
        // update local revList
        setRevList((prev) =>
          prev.map((r) =>
            r.matchedCsr?.id === item.matchedCsr.id
              ? { ...r, matchedCsr: { ...r.matchedCsr, daMo: true, maBNHIS: item.maHIS, trangThaiDieuTri: "Đã mổ", ghiChuMat2: item.isMat2 ? "Mắt 2" : r.matchedCsr.ghiChuMat2 } }
              : r
          )
        );
        setRevSummary((prev: any) => prev ? {
          ...prev,
          alreadyLinked: (prev.alreadyLinked || 0) + 1,
          unlinkedMatched: Math.max(0, (prev.unlinkedMatched || 0) - 1),
        } : null);
      } else {
        const d = await res.json();
        addToast({ type: "error", message: d.error || "Lỗi cập nhật" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối" });
    } finally {
      setLinkingId(null);
    }
  };

  // Link all matched patients
  const linkAllMatched = async () => {
    const pending = revList.filter((r) => r.matchedCsr && !r.matchedCsr.maBNHIS && !r.matchedCsr.daMo);
    const unlinked = pending.filter((r) => !r.matchedCsr.ambiguous);
    const skipped = pending.length - unlinked.length;
    if (unlinked.length === 0) {
      addToast({
        type: "info",
        message: skipped > 0
          ? `${skipped} ca khớp nhiều hồ sơ trùng tên — cần chọn tay, không tự động liên kết được.`
          : "Tất cả các BN khớp đều đã được liên kết mã HIS!",
      });
      return;
    }
    if (!(await confirm({
      title: "Liên kết mã HIS hàng loạt",
      message: `Sẽ gán mã HIS cho ${unlinked.length} bệnh nhân đang khớp.`,
      note: skipped > 0
        ? `Bỏ qua ${skipped} ca khớp nhiều hồ sơ trùng tên — anh/chị cần chọn tay từng ca. Thao tác không thể hoàn tác tự động.`
        : "Thao tác chạy lần lượt từng hồ sơ và không thể hoàn tác tự động.",
      confirmLabel: `Liên kết ${unlinked.length} hồ sơ`,
      tone: "info",
    }))) return;

    setRevLoading(true);
    try {
      const items = unlinked.map((r) => ({
        hoSoId: r.matchedCsr.id,
        maHIS: r.maHIS,
        ngayMo: r.ngayMo,
        soTienThucThu: r.soTienThucThu,
        isMat2: r.isMat2,
        tenDichVu: r.tenDichVu,
        matMo: r.matMo,
        loaiPT: r.loaiPT,
        chiTiet: r.isMat2
          ? `Mắt 2: Mổ ngày ${fmtDate(hisNgay(r))} (${r.tenDichVu || r.loaiPT}${r.matMo ? ` - ${r.matMo}` : ""})`
          : `Mổ ngày ${fmtDate(hisNgay(r))} (Khoa: ${r.khoaMo || "Phòng mổ"}, Bác sĩ: ${r.bsDieuTri || "—"}${r.tenDichVu ? `, DV: ${r.tenDichVu}` : ""})`,
      }));
      const res = await fetch("/api/his/link-reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const d = await res.json();
      if (res.ok) {
        const unlinkedIds = new Set(unlinked.map((u) => u.matchedCsr.id));
        setRevList((prev) =>
          prev.map((r) =>
            r.matchedCsr && unlinkedIds.has(r.matchedCsr.id)
              ? { ...r, matchedCsr: { ...r.matchedCsr, daMo: true, maBNHIS: r.maHIS, trangThaiDieuTri: "Đã mổ", ghiChuMat2: r.isMat2 ? "Mắt 2" : r.matchedCsr.ghiChuMat2 } }
              : r
          )
        );
        setRevSummary((prev: any) => prev ? {
          ...prev,
          alreadyLinked: (prev.alreadyLinked || 0) + unlinked.length,
          unlinkedMatched: 0,
        } : null);
        addToast({ type: "success", message: `Đã tự động liên kết thành công ${d.count || unlinked.length} bệnh nhân!` });
      } else {
        addToast({ type: "error", message: d.error || "Lỗi liên kết hàng loạt" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối máy chủ" });
    } finally {
      setRevLoading(false);
    }
  };

  // Filtered Batch Results
  const filteredBatchResults = useMemo(() => {
    return batchResults.filter((r) => {
      if (batchSearch) {
        const q = batchSearch.toLowerCase();
        const matchName = r.hoTen?.toLowerCase().includes(q);
        const matchBN = r.maBN?.toLowerCase().includes(q);
        const matchHIS = r.maHIS?.toLowerCase().includes(q);
        if (!matchName && !matchBN && !matchHIS) return false;
      }
      if (batchFilterStatus === "found") return r.found && !r.hasSurgery;
      if (batchFilterStatus === "surgery") return r.hasSurgery && (r.matchType === "exact" || r.confirmed);
      if (batchFilterStatus === "pending") return r.hasSurgery && r.matchType === "partial" && !r.confirmed;
      if (batchFilterStatus === "not_found") return !r.found;
      return true;
    });
  }, [batchResults, batchSearch, batchFilterStatus]);

  // Filtered Reverse List
  const filteredRevList = useMemo(() => {
    return revList.filter((r) => {
      if (revSearch) {
        const q = revSearch.toLowerCase();
        const matchName = r.hoTen?.toLowerCase().includes(q);
        const matchHIS = r.maHIS?.toLowerCase().includes(q);
        const matchSDT = r.sdt?.includes(q);
        const matchCccd = r.cccd?.includes(q);
        const matchDV = (r.tenDichVu || "").toLowerCase().includes(q) || (r.loaiPT || "").toLowerCase().includes(q);
        const matchCsr = r.matchedCsr?.hoTen?.toLowerCase().includes(q) || r.matchedCsr?.maBN?.toLowerCase().includes(q);
        if (!matchName && !matchHIS && !matchSDT && !matchCccd && !matchDV && !matchCsr) return false;
      }
      if (revFilterDate) {
        const dateStr = hisNgay(r);
        if (dateStr !== revFilterDate) return false;
      }
      if (revFilterStatus === "matched") return !!r.matchedCsr;
      if (revFilterStatus === "unmatched") return !r.matchedCsr;
      if (revFilterStatus === "linked") return !!(r.matchedCsr && (r.matchedCsr.maBNHIS || r.matchedCsr.daMo));
      if (revFilterStatus === "mat2") return Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
      return true;
    });
  }, [revList, revSearch, revFilterDate, revFilterStatus]);

  // Ưu tiên hiển thị các ca khớp tầm soát lên đầu
  const sortedRevList = useMemo(
    () => [...filteredRevList].sort((a, b) => (b.matchedCsr ? 1 : 0) - (a.matchedCsr ? 1 : 0)),
    [filteredRevList]
  );

  const batchColumns = useMemo<ColumnDef<HisRow>[]>(
    () => [
      {
        id: "hoTen",
        accessorKey: "hoTen",
        header: "Họ và tên / Mã BN",
        size: 220,
        meta: { flex: true },
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="min-w-0">
              <div className="font-bold text-[var(--ink)] group-hover:text-[var(--navy)] text-[13.5px] truncate">{r.hoTen}</div>
              <div className="font-mono text-[11.5px] font-bold text-[var(--navy)] mt-0.5">
                <span className="text-[var(--mute-soft)] font-normal">BN-</span>
                {(r.maBN || "").replace(/^BN-?/i, "") || "—"}
              </div>
            </div>
          );
        },
      },
      {
        id: "maHIS",
        accessorKey: "maHIS",
        header: "Mã HIS",
        size: 120,
        cell: ({ row }) =>
          row.original.maHIS ? (
            <span className="px-2.5 py-1 rounded-md bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)] font-mono text-xs font-bold">
              {row.original.maHIS}
            </span>
          ) : (
            <span className="text-[var(--mute-soft)]">—</span>
          ),
      },
      {
        id: "mucKhop",
        header: "Mức khớp",
        size: 150,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (!r.found) return <span className="text-[var(--mute-soft)] text-[11px]">—</span>;
          if (r.matchType === "exact")
            return (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                  r.matchReason?.includes("BHYT")
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]/30"
                }`}
              >
                <ShieldCheck className="w-3 h-3" /> {r.matchReason || "Khớp CCCD"}
              </span>
            );
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[var(--amber-soft)] text-[var(--amber-deep)] border border-[var(--amber)]/30">
              <AlertTriangle className="w-3 h-3" /> Tên + Tuổi
            </span>
          );
        },
      },
      {
        id: "trangThaiHis",
        header: "Trạng thái HIS",
        size: 170,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (!r.found)
            return (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--surface-hover)] text-[var(--mute)] border border-[var(--line)]">
                Chưa thấy trên HIS
              </span>
            );
          if (r.hasSurgery)
            return r.matchType === "exact" || r.confirmed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--gold-soft)] text-[var(--gold-deep)] border border-[var(--gold-line)]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã mổ / Điều trị
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--amber-soft)] text-[var(--amber-deep)] border border-[var(--amber)]/30">
                <ShieldQuestion className="w-3.5 h-3.5" /> Chờ xác nhận
              </span>
            );
          return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--teal-soft)] text-[var(--teal-deep)] border border-[var(--teal)]/30">
              <Check className="w-3.5 h-3.5" /> Có hồ sơ HIS
            </span>
          );
        },
      },
      {
        id: "chiTiet",
        header: "Chi tiết / Thao tác",
        size: 300,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (r.hasSurgery && r.matchType === "partial" && !r.confirmed)
            return (
              <div className="flex flex-col gap-2" data-no-row-click>
                <div className="text-[11px] text-[var(--amber-deep)] font-medium leading-relaxed">
                  ⚠ Chỉ khớp Họ tên + Năm sinh, chưa xác minh CCCD. Cần xác nhận thủ công.
                </div>
                <button
                  type="button"
                  onClick={() => confirmPartialMatch(r)}
                  disabled={confirmingId === r.id}
                  className="px-3 py-1.5 bg-[var(--amber)] hover:bg-[var(--amber-deep)] text-white text-[11px] font-bold rounded-[var(--r-sm)] shadow-[var(--shadow-sm)] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 self-start cursor-pointer"
                >
                  {confirmingId === r.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Xác nhận đã mổ
                </button>
              </div>
            );
          return <span className="text-xs text-[var(--ink-soft)]">{r.chiTiet || r.error || "—"}</span>;
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [confirmingId]
  );

  const filteredDailyList = useMemo(() => {
    let result = dailyList;
    if (dailyFilterStatus === "unlinked") {
      result = result.filter((r) => r.matchedCsr && !r.matchedCsr.daMo && !r.matchedCsr.maBNHIS);
    } else if (dailyFilterStatus === "linked") {
      result = result.filter((r) => r.matchedCsr && (r.matchedCsr.daMo || r.matchedCsr.maBNHIS));
    } else if (dailyFilterStatus === "mat2") {
      result = result.filter((r) => Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2)));
    } else if (dailyFilterStatus === "unmatched") {
      result = result.filter((r) => !r.matchedCsr);
    }

    if (dailySearch.trim()) {
      const q = dailySearch.trim().toLowerCase();
      result = result.filter((r) => {
        const matchName = (r.hoTen || "").toLowerCase().includes(q);
        const matchMa = (r.maHIS || "").toLowerCase().includes(q);
        const matchCccd = (r.cccd || "").includes(q);
        const matchSdt = (r.sdt || "").includes(q);
        const matchDV = (r.tenDichVu || "").toLowerCase().includes(q) || (r.loaiPT || "").toLowerCase().includes(q);
        const matchCsr = r.matchedCsr
          ? (r.matchedCsr.hoTen || "").toLowerCase().includes(q) || (r.matchedCsr.maBN || "").toLowerCase().includes(q)
          : false;
        return matchName || matchMa || matchCccd || matchSdt || matchDV || matchCsr;
      });
    }
    return result;
  }, [dailyList, dailyFilterStatus, dailySearch]);

  const dailyColumns = useMemo<ColumnDef<HisRow>[]>(
    () => [
      {
        id: "stt",
        header: "#",
        size: 46,
        enableSorting: false,
        enableResizing: false,
        meta: { align: "center" },
        cell: ({ row }) => (
          <span className="font-mono text-[11.5px] font-semibold text-[var(--mute)]">{row.index + 1}</span>
        ),
      },
      {
        id: "maHIS",
        accessorKey: "maHIS",
        header: "Mã HIS",
        size: 98,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="min-w-0">
              <span className="rounded-md border border-[var(--navy-100)] bg-[var(--navy-50)] px-1.5 py-0.5 font-mono text-[11.5px] font-bold whitespace-nowrap text-[var(--navy)]">
                {r.maHIS}
              </span>
              {r.phongMo && (
                <div className="mt-0.5 truncate font-mono text-[10px] text-[var(--mute)]">{r.phongMo}</div>
              )}
            </div>
          );
        },
      },
      {
        /* Gộp CCCD / BHYT / SĐT vào chung khối bệnh nhân — bớt hẳn một cột rộng
           mà vẫn đủ định danh để đối chiếu. */
        id: "hoTen",
        accessorKey: "hoTen",
        header: "Bệnh nhân trên HIS",
        size: 215,
        meta: { flex: true },
        cell: ({ row }) => {
          const r = row.original;
          const age = r.namSinh ? new Date().getFullYear() - Number(r.namSinh) : null;
          return (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-bold text-[var(--ink)]">{r.hoTen}</div>
              <div className="mt-0.5 truncate text-[11px] text-[var(--mute)]">
                {r.namSinh ? `${r.namSinh}${age ? ` · ${age}t` : ""}` : "—"}
                {r.gioiTinh ? ` · ${r.gioiTinh}` : ""}
              </div>
              {(r.cccd || r.sdt || r.bhyt) && (
                <div
                  className="mt-0.5 truncate font-mono text-[10.5px] text-[var(--mute)]"
                  title={[r.cccd && `CCCD: ${r.cccd}`, r.bhyt && `BHYT: ${r.bhyt}`, r.sdt && `SĐT: ${r.sdt}`]
                    .filter(Boolean)
                    .join(" · ")}
                >
                  {[r.cccd, r.bhyt, r.sdt].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "ngayMo",
        header: "Mổ lúc",
        size: 100,
        // Sắp xếp trên chuỗi "YYYY-MM-DD HH:mm:ss" — thứ tự chuỗi trùng thứ tự thời gian.
        accessorFn: (r) => r.ngayMoLocal || "",
        cell: ({ row }) => {
          const ngay = hisNgay(row.original);
          const gio = hisGio(row.original);
          return (
            <div className="font-mono text-xs">
              <div className="font-bold text-[var(--ink)] whitespace-nowrap">
                {ngay ? fmtDate(ngay) : "—"}
              </div>
              {gio && <div className="text-[11px] text-[var(--mute)]">{gio}</div>}
            </div>
          );
        },
      },
      {
        id: "lanMo",
        header: "Mắt",
        size: 96,
        // Sắp xếp được để dồn nhanh các ca Mắt 2 lên đầu.
        accessorFn: (r) => (r.isMat2 || (r.lanMo && r.lanMo >= 2) ? 2 : 1),
        cell: ({ row }) => {
          const r = row.original;
          const isSecondEye = Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
          return (
            <div className="leading-tight">
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-bold ${
                  isSecondEye
                    ? "border border-purple-300 bg-purple-100 text-purple-900"
                    : "border border-[var(--line-strong)] bg-[var(--surface-soft)] text-[var(--ink-soft)]"
                }`}
                title={r.lanMo ? `Lần mổ thứ ${r.lanMo}` : undefined}
              >
                {isSecondEye && <Eye className="h-3 w-3 shrink-0 text-purple-700" />}
                Mắt {isSecondEye ? 2 : 1}
              </span>
              {r.matMo && (
                <div className="mt-0.5 truncate text-[10.5px] font-semibold text-teal-800">{r.matMo}</div>
              )}
            </div>
          );
        },
      },
      {
        /* Gộp Khoa / Bác sĩ vào cột dịch vụ — hai thông tin luôn đi cùng nhau,
           tách riêng chỉ tốn thêm 150px mà cột kia thường trống. */
        id: "dichVu",
        header: "Phẫu thuật",
        size: 250,
        meta: { flex: true },
        cell: ({ row }) => {
          const r = row.original;
          const ten = r.tenDichVu || r.loaiPT;
          return (
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5">
                {r.loaiPT && (
                  <span className="shrink-0 rounded border border-blue-200 bg-blue-50 px-1.5 py-px text-[9.5px] font-extrabold uppercase tracking-wide text-blue-800">
                    {r.loaiPT}
                  </span>
                )}
                <span className="truncate text-[11px] font-bold text-[var(--navy)]" title={r.khoaMo || ""}>
                  {r.khoaMo || "Phòng mổ"}
                </span>
              </div>
              <div className="mt-0.5 line-clamp-2 text-[11.5px] font-medium text-[var(--ink)]" title={ten || ""}>
                {ten || <span className="italic text-[var(--mute-soft)]">Chưa có tên DV</span>}
              </div>
              {r.bsDieuTri && (
                <div
                  className="mt-0.5 truncate text-[10.5px] font-semibold text-emerald-800"
                  title={`BS: ${r.bsDieuTri}`}
                >
                  BS. {r.bsDieuTri}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "chanDoan",
        header: "Chẩn đoán HIS",
        size: 175,
        cell: ({ row }) => {
          const r = row.original;
          const diag = r.chanDoanRavien || r.chanDoanVaovien || r.chanDoanBM || r.chanDoan;
          return (
            <div
              className="text-xs text-[var(--ink-soft)] line-clamp-2 leading-relaxed"
              title={diag || "—"}
            >
              {diag || <span className="text-[var(--mute-soft)]">—</span>}
            </div>
          );
        },
      },
      {
        id: "doiChieu",
        header: "Đối chiếu CSR",
        size: 230,
        cell: ({ row }) => {
          const r = row.original;
          if (!r.matchedCsr) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-[var(--mute)] bg-slate-100 border border-slate-200 font-medium">
                Chưa có trong CSR
              </span>
            );
          }
          const m = r.matchedCsr;
          const isBhyt = m.matchReason?.includes("BHYT");
          const isSecondEye = Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
          return (
            <div className="text-xs space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                    m.matchType === "exact"
                      ? isBhyt
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-purple-50 text-purple-700 border-purple-200"
                  }`}
                >
                  {m.matchReason || "Khớp hồ sơ"}
                </span>
                <span className="font-mono font-bold text-[var(--navy)]">{m.maBN}</span>
                {m.nhom && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      m.nhom === "A" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    Nhóm {m.nhom}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[var(--mute)] truncate">
                {m.buoiKham?.xa ? `Đợt: ${m.buoiKham.xa}` : (m.buoiKham?.diaDiem || "—")}
                {m.buoiKham?.ngayKham ? ` (${fmtDate(m.buoiKham.ngayKham)})` : ""}
              </div>
              {isSecondEye && (
                <div className="text-[10.5px] font-semibold text-purple-700 flex items-center gap-1 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  <Eye className="w-3 h-3 text-purple-600 shrink-0" />
                  <span className="truncate">Ghi nhận vào Ghi chú Mắt 2</span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 130,
        meta: { align: "right" },
        cell: ({ row }) => {
          const r = row.original;
          if (!r.matchedCsr) return <span className="text-xs text-[var(--mute-soft)]">—</span>;
          const isSecondEye = Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
          const isLinked = r.matchedCsr.daMo || r.matchedCsr.maBNHIS;
          const hasMat2Note = Boolean(r.matchedCsr.ghiChuMat2);

          if (isLinked && (!isSecondEye || hasMat2Note)) {
            return (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                  isSecondEye
                    ? "bg-purple-50 text-purple-800 border-purple-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSecondEye ? "Đã lưu Mắt 2" : "Đã lưu CSR"}</span>
              </span>
            );
          }

          return (
            <button
              type="button"
              data-no-row-click
              onClick={() => linkDailyPatient(r)}
              disabled={linkingId === r.matchedCsr.id}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-2xs inline-flex items-center gap-1.5 hover:shadow transition-all cursor-pointer disabled:opacity-50 ${
                isSecondEye
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "btn btn-success"
              }`}
            >
              {linkingId === r.matchedCsr.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : isSecondEye ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              )}
              <span>{isSecondEye ? "Lưu Mắt 2" : "Đánh dấu Đã mổ"}</span>
            </button>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [linkingId]
  );

  const revColumns = useMemo<ColumnDef<HisRow>[]>(
    () => [
      {
        id: "maHIS",
        accessorKey: "maHIS",
        header: "Mã HIS",
        size: 110,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div>
              <span className="px-2 py-0.5 rounded-md bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)] font-mono text-xs font-bold whitespace-nowrap">
                {r.maHIS}
              </span>
              {r.phongMo && (
                <div className="text-[10px] text-[var(--mute)] font-mono mt-0.5 truncate">
                  {r.phongMo}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "hoTen",
        accessorKey: "hoTen",
        header: "Bệnh nhân trên HIS",
        size: 200,
        meta: { flex: true },
        cell: ({ row }) => {
          const r = row.original;
          const age = r.namSinh ? (new Date().getFullYear() - Number(r.namSinh)) : null;
          return (
            <div className="min-w-0">
              <div className="text-[var(--ink)] font-bold text-[13.5px] truncate">
                {r.hoTen}
              </div>
              <div className="text-xs text-[var(--mute)] mt-0.5 flex items-center gap-1.5 flex-wrap">
                {r.namSinh && <span>NS: {r.namSinh}{age ? ` (${age}t)` : ""}</span>}
                {r.gioiTinh && <span>· {r.gioiTinh}</span>}
              </div>
            </div>
          );
        },
      },
      {
        id: "dinhDanh",
        header: "CCCD / BHYT / SĐT",
        size: 175,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="text-xs space-y-0.5 min-w-0 font-mono">
              {r.cccd ? (
                <div className="text-[11.5px] text-[var(--ink)] font-semibold truncate" title={`CCCD: ${r.cccd}`}>
                  <span className="text-[var(--mute)] font-sans font-normal mr-1">CCCD:</span>
                  <b>{r.cccd}</b>
                </div>
              ) : null}
              {r.bhyt ? (
                <div className="text-[11px] text-blue-700 font-semibold truncate" title={`BHYT: ${r.bhyt}`}>
                  <span className="text-[var(--mute)] font-sans font-normal mr-1">BHYT:</span>
                  {r.bhyt}
                </div>
              ) : null}
              {r.sdt ? (
                <div className="text-[11px] text-[var(--mute)] truncate font-sans">
                  SĐT: <span className="font-mono font-medium text-[var(--ink-soft)]">{r.sdt}</span>
                </div>
              ) : null}
              {!r.cccd && !r.bhyt && !r.sdt && <span className="text-[var(--mute-soft)]">—</span>}
            </div>
          );
        },
      },
      {
        id: "ngayMo",
        header: "Thời gian mổ",
        size: 115,
        // Sắp xếp trên chuỗi "YYYY-MM-DD HH:mm:ss" — thứ tự chuỗi trùng thứ tự thời gian.
        accessorFn: (r) => r.ngayMoLocal || "",
        cell: ({ row }) => {
          const ngay = hisNgay(row.original);
          const gio = hisGio(row.original);
          return (
            <div className="font-mono text-xs">
              <div className="font-bold text-[var(--ink)] whitespace-nowrap">
                {ngay ? fmtDate(ngay) : "—"}
              </div>
              {gio && <div className="text-[11px] text-[var(--mute)]">{gio}</div>}
            </div>
          );
        },
      },
      {
        id: "lanMo",
        header: "Lần mổ / Mắt",
        size: 130,
        cell: ({ row }) => {
          const r = row.original;
          const isSecondEye = Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
          return (
            <div className="space-y-1">
              <div>
                {isSecondEye ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
                    <Eye className="w-3 h-3 text-purple-700" />
                    <span>Mắt 2</span>
                    {r.lanMo && r.lanMo > 2 && <span className="text-[9.5px] opacity-80">(lần {r.lanMo})</span>}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <span>Mắt 1</span>
                    {r.lanMo ? <span className="text-[10px] text-slate-500">(lần {r.lanMo})</span> : null}
                  </span>
                )}
              </div>
              {r.matMo && (
                <div className="text-[11px] font-bold text-teal-800 flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                  <span>{r.matMo}</span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "dichVu",
        header: "Dịch vụ phẫu thuật",
        size: 240,
        cell: ({ row }) => {
          const r = row.original;
          const loai = r.loaiPT;
          const ten = r.tenDichVu;
          if (!loai && !ten) {
            return <span className="text-xs text-[var(--mute-soft)] italic">Chưa có tên DV</span>;
          }
          return (
            <div className="text-xs min-w-0 space-y-0.5">
              {loai && (
                <div>
                  <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase tracking-wide bg-blue-50 text-blue-800 border border-blue-200">
                    {loai}
                  </span>
                </div>
              )}
              <div
                className="font-medium text-[var(--ink)] text-[12px] leading-snug line-clamp-2"
                title={ten || loai}
              >
                {ten || loai}
              </div>
            </div>
          );
        },
      },
      {
        id: "khoa",
        header: "Khoa / Bác sĩ",
        size: 150,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="text-xs min-w-0">
              <div className="font-bold text-[var(--navy)] truncate" title={r.khoaMo || "Phòng mổ"}>
                {r.khoaMo || "Phòng mổ"}
              </div>
              {r.bsDieuTri ? (
                <div className="text-[11px] text-emerald-800 font-semibold mt-0.5 truncate" title={`BS: ${r.bsDieuTri}`}>
                  BS: {r.bsDieuTri}
                </div>
              ) : (
                <div className="text-[11px] text-[var(--mute)]">—</div>
              )}
            </div>
          );
        },
      },
      {
        id: "chanDoan",
        header: "Chẩn đoán HIS",
        size: 190,
        cell: ({ row }) => {
          const r = row.original;
          const diag = r.chanDoanRavien || r.chanDoanVaovien || r.chanDoanBM || r.chanDoan;
          return (
            <div
              className="text-xs text-[var(--ink-soft)] line-clamp-2 leading-relaxed"
              title={diag || "—"}
            >
              {diag || <span className="text-[var(--mute-soft)]">—</span>}
            </div>
          );
        },
      },
      {
        id: "doiChieu",
        header: "Đối chiếu CSR",
        size: 270,
        cell: ({ row }) => {
          const r = row.original;
          if (!r.matchedCsr) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-[var(--mute)] bg-slate-100 border border-slate-200 font-medium">
                ⚪ Khách tự đến BV / Khác
              </span>
            );
          }
          const m = r.matchedCsr;
          const isBhyt = m.matchReason?.includes("BHYT");
          const isSecondEye = Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
          return (
            <div className="text-xs space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                    m.matchType === "exact"
                      ? isBhyt
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-purple-50 text-purple-700 border-purple-200"
                  }`}
                >
                  {m.matchReason || "Khớp hồ sơ"}
                </span>
                <span className="font-mono font-bold text-[var(--navy)]">{m.maBN}</span>
              </div>
              <div className="text-[11px] text-[var(--mute)] truncate">
                {m.buoiKham?.xa ? `Đợt: ${m.buoiKham.xa}` : (m.buoiKham?.diaDiem || "—")}
                {m.buoiKham?.ngayKham ? ` (${fmtDate(m.buoiKham.ngayKham)})` : ""}
              </div>
              {isSecondEye && (
                <div className="text-[10.5px] font-semibold text-purple-700 flex items-center gap-1 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  <Eye className="w-3 h-3 text-purple-600 shrink-0" />
                  <span className="truncate">Ghi nhận vào Ghi chú Mắt 2</span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 140,
        enableSorting: false,
        enableResizing: false,
        meta: { align: "right" },
        cell: ({ row }) => {
          const r = row.original;
          if (!r.matchedCsr) return <span className="text-xs text-[var(--mute-soft)] font-mono">—</span>;
          const isSecondEye = Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
          const isLinked = r.matchedCsr.maBNHIS || r.matchedCsr.daMo;
          const hasMat2Note = Boolean(r.matchedCsr.ghiChuMat2);

          if (isLinked && (!isSecondEye || hasMat2Note)) {
            return (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                  isSecondEye
                    ? "bg-purple-50 text-purple-800 border-purple-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSecondEye ? "Đã lưu Mắt 2" : "Đã liên kết"}</span>
              </span>
            );
          }

          return (
            <button
              type="button"
              data-no-row-click
              onClick={() => linkPatient(r)}
              disabled={linkingId === r.matchedCsr.id}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-2xs inline-flex items-center gap-1.5 hover:shadow transition-all cursor-pointer disabled:opacity-50 ml-auto ${
                isSecondEye
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "btn btn-success"
              }`}
            >
              {linkingId === r.matchedCsr.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : isSecondEye ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              )}
              <span>{isSecondEye ? "Lưu Mắt 2" : "Cập nhật ngay"}</span>
            </button>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [linkingId]
  );

  if (!facilityLoading && !hasHisConfig) {
    return (
      <div className="space-y-6 pb-16">
        <PageHeader
          title="Đối chiếu máy chủ HIS"
          description="Quét & đồng bộ tự động giữa danh sách tầm soát CSR và hệ thống HIS bệnh viện."
        />
        <div className="card p-10 text-center max-w-2xl mx-auto space-y-4 my-8 bg-white border border-[var(--line)] rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
            <Database className="w-8 h-8" />
          </div>
          <h2 className="text-[18px] font-bold text-[var(--ink)]">
            Đơn vị chưa cấu hình kết nối CSDL HIS
          </h2>
          <p className="text-[13.5px] text-[var(--mute)] max-w-lg mx-auto leading-relaxed">
            Cơ sở <strong className="text-[var(--ink)]">{currentCoSo?.ten || activeCoSoId || "hiện tại"}</strong> chưa được thiết lập địa chỉ IP máy chủ và tên Database HIS. Vui lòng vào mục <strong>Quản trị → Cấu hình đơn vị</strong> để điền thông tin kết nối SQL Server HIS.
          </p>
          <div className="pt-2">
            <Link href="/quan-tri" className="btn btn-primary px-6 py-2.5 font-bold rounded-xl inline-flex items-center gap-2">
              <span>Đến trang Quản trị cấu hình</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 pb-12">
      {/* Header & Tabs tinh gọn chuẩn Company UI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-[var(--ink)] tracking-tight">Đối chiếu dữ liệu HIS</h1>
          <p className="text-xs text-[var(--mute)]">Theo dõi ca mổ & đối chiếu bệnh nhân tầm soát CSR với máy chủ HIS</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-[var(--teal-soft)] border border-[var(--teal)]/25 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-[var(--teal)] animate-pulse" />
            <span className="text-[11px] font-bold text-[var(--teal-deep)]">HIS SQL Sẵn sàng</span>
          </div>
        </div>
      </div>

      {/* Tabs tinh gọn */}
      <div data-tour="his-tabs" className="flex items-center">
        <div className="bg-[var(--surface-soft)] p-1 rounded-xl inline-flex gap-1 border border-[var(--line)] max-w-full overflow-x-auto">
          <button
            onClick={() => setTab("today")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              tab === "today" ? "bg-[var(--navy)] text-white shadow-xs" : "text-[var(--ink-soft)] hover:bg-white"
            }`}
          >
            <CalendarCheck className={`w-3.5 h-3.5 ${tab === "today" ? "text-[var(--teal)]" : "text-[var(--mute)]"}`} />
            <span>Mổ trong ngày</span>
            <span className={`px-1.5 py-0.2 text-[9.5px] font-mono font-bold rounded ${
              tab === "today" ? "bg-[var(--teal)] text-[var(--navy-ink)]" : "bg-emerald-100 text-emerald-800"
            }`}>
              Hôm nay
            </span>
          </button>
          <button
            onClick={() => setTab("batch")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              tab === "batch" ? "bg-[var(--navy)] text-white shadow-xs" : "text-[var(--ink-soft)] hover:bg-white"
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${tab === "batch" ? "text-[var(--teal)]" : "text-[var(--mute)]"}`} />
            <span>Quét theo Đợt khám</span>
          </button>
          <button
            onClick={() => setTab("reverse")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              tab === "reverse" ? "bg-[var(--navy)] text-white shadow-xs" : "text-[var(--ink-soft)] hover:bg-white"
            }`}
          >
            <Database className={`w-3.5 h-3.5 ${tab === "reverse" ? "text-[var(--teal)]" : "text-[var(--mute)]"}`} />
            <span>Đối chiếu theo Tháng</span>
          </button>
        </div>
      </div>

      {/* TAB 0: THEO DÕI MỔ TRONG NGÀY (HÔM NAY / CHỌN NGÀY) */}
      {tab === "today" && (
        <div className="space-y-2.5">
          {/* Thanh điều khiển siêu tinh gọn */}
          <div className="bg-white border border-[var(--line)] p-2 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-[var(--surface-soft)] rounded-lg border border-[var(--line)] p-0.5">
                <button
                  type="button"
                  title="Ngày trước"
                  onClick={() => shiftDailyDate(-1)}
                  className="p-1 text-[var(--mute)] hover:text-[var(--ink)] hover:bg-white rounded transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-[var(--ink)] px-1.5 py-0.5 outline-none cursor-pointer"
                />
                <button
                  type="button"
                  title="Ngày sau"
                  onClick={() => shiftDailyDate(1)}
                  className="p-1 text-[var(--mute)] hover:text-[var(--ink)] hover:bg-white rounded transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <div className="h-4 w-px bg-[var(--line)] mx-0.5" />
                <button
                  type="button"
                  onClick={() => {
                    setDailyDate(todayStr);
                    runDailyCheck(todayStr);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    dailyDate === todayStr ? "bg-white text-[var(--navy)] shadow-2xs font-extrabold" : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
                >
                  Hôm nay
                </button>
              </div>

              <button
                type="button"
                onClick={() => runDailyCheck()}
                disabled={dailyLoading}
                className="btn btn-primary h-8 px-3.5 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {dailyLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-300" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-teal-300" />
                )}
                <span>{dailyLoading ? "Đang quét HIS..." : "Kiểm tra mổ từ HIS"}</span>
              </button>
            </div>

            <div className="text-[11px] text-[var(--mute)] hidden md:flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[var(--teal-deep)]" />
              <span>Chỉ truy vấn khi bấm nút · Lưu vĩnh viễn vào CSR để báo cáo</span>
            </div>
          </div>

          {/* Stat Cards tinh gọn (Compact Strip) */}
          {hasScannedDaily && dailySummary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <CompactStatCard
                label="Tổng ca mổ ở HIS"
                value={dailySummary.totalHIS.toLocaleString("vi-VN")}
                sub={`Ngày ${fmtDate(dailyDate)}`}
                icon={Stethoscope}
                tone="navy"
              />
              <CompactStatCard
                label="Khớp bệnh nhân CSR"
                value={dailySummary.matchedCSR.toLocaleString("vi-VN")}
                sub="Có hồ sơ CSR"
                icon={Users}
                tone="teal"
              />
              <CompactStatCard
                label="Cần cập nhật CSR"
                value={dailySummary.unlinkedMatched.toLocaleString("vi-VN")}
                sub="Chưa đánh dấu mổ"
                icon={Zap}
                tone="amber"
              />
              <CompactStatCard
                label="Đã ghi nhận Đã mổ"
                value={dailySummary.alreadyLinked.toLocaleString("vi-VN")}
                sub="Đã lưu vào CSR"
                icon={CheckCircle2}
                tone="gold"
              />
            </div>
          )}

          {/* Bảng kết quả danh sách mổ trong ngày */}
          {hasScannedDaily ? (
            <div className="card p-0 overflow-hidden bg-white border border-[var(--line)] rounded-xl shadow-2xs">
              {/* Header Lọc & Tìm kiếm & Đồng bộ tất cả */}
              <div className="p-2 border-b border-[var(--line)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-[var(--surface-soft)]/60">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDailyFilterStatus("all")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      dailyFilterStatus === "all" ? "bg-[var(--navy)] text-white shadow-2xs" : "bg-white text-[var(--ink-soft)] hover:bg-slate-100 border border-[var(--line)]"
                    }`}
                  >
                    Tất cả ({dailyList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDailyFilterStatus("unlinked")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      dailyFilterStatus === "unlinked" ? "bg-amber-600 text-white shadow-2xs" : "bg-white text-amber-800 hover:bg-amber-50 border border-amber-200"
                    }`}
                  >
                    <span>⚡ Cần cập nhật CSR</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${dailyFilterStatus === "unlinked" ? "bg-white/25 text-white" : "bg-amber-100 text-amber-900"}`}>
                      {dailySummary?.unlinkedMatched || 0}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDailyFilterStatus("mat2")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      dailyFilterStatus === "mat2" ? "bg-purple-700 text-white shadow-2xs" : "bg-white text-purple-900 hover:bg-purple-50 border border-purple-200"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Mắt 2</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${dailyFilterStatus === "mat2" ? "bg-white/25 text-white" : "bg-purple-100 text-purple-900"}`}>
                      {dailyList.filter((r) => r.isMat2 || (r.lanMo && r.lanMo >= 2)).length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDailyFilterStatus("linked")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      dailyFilterStatus === "linked" ? "bg-emerald-600 text-white shadow-2xs" : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
                    }`}
                  >
                    Đã lưu CSR ({dailySummary?.alreadyLinked || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDailyFilterStatus("unmatched")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      dailyFilterStatus === "unmatched" ? "bg-slate-700 text-white shadow-2xs" : "bg-white text-slate-600 hover:bg-slate-100 border border-[var(--line)]"
                    }`}
                  >
                    Chưa có trong CSR ({dailyList.length - (dailySummary?.matchedCSR || 0)})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
                    <input
                      type="text"
                      value={dailySearch}
                      onChange={(e) => setDailySearch(e.target.value)}
                      placeholder="Tìm tên, CCCD, Mã HIS..."
                      className="input-field pl-7 pr-2.5 h-8 text-xs w-full bg-white rounded-lg border border-[var(--line-strong)]"
                    />
                  </div>

                  {(dailySummary?.unlinkedMatched || 0) > 0 && (
                    <button
                      type="button"
                      onClick={syncAllDailyUnlinked}
                      disabled={syncingAll}
                      className="btn bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-3 h-8 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      {syncingAll ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      <span>Đồng bộ {dailySummary?.unlinkedMatched} ca</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bảng dữ liệu TanStack */}
              <DataView<HisRow, unknown>
                columns={dailyColumns}
                data={filteredDailyList}
                pageSize={25}
                isLoading={dailyLoading}
              >
                <div className="flex flex-col flex-1 min-h-0">
                  <DataTable<HisRow>
                    dense
                    emptyIcon={CalendarDays}
                    emptyTitle={
                      dailyList.length === 0
                        ? `Không có ca mổ nào ghi nhận trên HIS trong ngày ${fmtDate(dailyDate)}`
                        : `Không có ca mổ nào phù hợp với bộ lọc trong ngày ${fmtDate(dailyDate)}`
                    }
                  />
                  {filteredDailyList.length > 0 && (
                    <DataPagination pageSizeOptions={[10, 25, 50, 100]} />
                  )}
                </div>
              </DataView>
            </div>
          ) : (
            /* Khung hướng dẫn ban đầu trước khi quét */
            <div className="card p-6 text-center max-w-md mx-auto space-y-2.5 my-4 bg-white border border-[var(--line)] rounded-xl shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-[var(--teal-soft)] text-[var(--teal-deep)] flex items-center justify-center mx-auto border border-[var(--teal)]/25 shadow-2xs">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[15px] font-bold text-[var(--ink)]">
                  Theo dõi & Đối chiếu ca mổ trong ngày
                </h3>
                <p className="text-xs text-[var(--mute)] max-w-sm mx-auto leading-relaxed">
                  Chọn ngày ở trên rồi bấm <strong>Kiểm tra mổ từ HIS</strong> để tải danh sách phẫu thuật thực tế và đối chiếu với hồ sơ CSR.
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => runDailyCheck(todayStr)}
                  disabled={dailyLoading}
                  className="btn btn-primary px-4 py-2 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-teal-300" />
                  <span>Quét ca mổ hôm nay ({fmtDate(todayStr)})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUÉT HÀNG LOẠT THEO ĐỢT KHÁM */}
      {tab === "batch" && (
        <div className="space-y-5">
          {/* Card lọc & chọn buổi khám — KHÔNG overflow-hidden để menu dropdown không bị cắt */}
          <div data-tour="his-select" className="card p-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 flex-1">
              <div className="flex-1 min-w-[240px]">
                <label className="text-[12px] font-bold text-[var(--ink-soft)] mb-1.5 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-[var(--navy)]" /> Chọn Đợt khám / Buổi khám
                </label>
                <Dropdown
                  value={selectedBuoiId}
                  onChange={setSelectedBuoiId}
                  options={bkOptions}
                  labels={bkLabels}
                  placeholder="Chọn buổi khám tầm soát..."
                  mono={false}
                />
              </div>

              <div className="w-full sm:w-[240px]">
                <label className="text-[12px] font-bold text-[var(--ink-soft)] mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--teal)]" /> Tháng phẫu thuật HIS
                </label>
                <Dropdown
                  value={batchMonth}
                  onChange={setBatchMonth}
                  options={monthOptions.options}
                  labels={monthOptions.labels}
                  placeholder="Chọn tháng phẫu thuật..."
                  mono={false}
                />
              </div>
            </div>

            <button
              data-tour="his-run"
              onClick={runBatchCheck}
              disabled={batchLoading || !selectedBuoiId}
              className="btn btn-primary h-[42px] px-6 rounded-[var(--r-md)] font-bold text-sm shrink-0 justify-center gap-2"
            >
              {batchLoading ? <RefreshCw className="w-4 h-4 animate-spin text-[var(--teal)]" /> : <Play className="w-4 h-4 fill-current" />}
              {batchLoading ? "Đang quét HIS..." : "Quét đối chiếu ngay"}
            </button>
          </div>

          {/* Thống kê KPIs */}
          {batchSummary && (
            <div className={`grid grid-cols-2 gap-2 ${(batchSummary.surgeryPartial || 0) > 0 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
              <CompactStatCard tone="navy" icon={Users} label="Tổng BN tầm soát" value={batchSummary.total} sub="Đợt khám" />
              <CompactStatCard tone="teal" icon={ShieldCheck} label="Khớp mã HIS"
                value={<>{batchSummary.found}<span className="text-[11px] font-sans font-normal ml-1">({batchSummary.total ? Math.round((batchSummary.found / batchSummary.total) * 100) : 0}%)</span></>}
                sub="Có trên HIS" />
              <CompactStatCard tone="gold" icon={Stethoscope} label="Đã mổ (xác nhận)"
                value={<>{batchSummary.surgeryExact || 0}{batchSummary.found > 0 && <span className="text-[11px] font-sans font-normal ml-1">({Math.round(((batchSummary.surgeryExact || 0) / batchSummary.found) * 100)}%)</span>}</>}
                sub="Tự động khớp" />
              {(batchSummary.surgeryPartial || 0) > 0 && (
                <CompactStatCard tone="amber" icon={AlertTriangle} label="Chờ duyệt mổ"
                  value={<>{batchSummary.surgeryPartial}</>}
                  sub="Khớp Tên + Tuổi" />
              )}
            </div>
          )}

          {/* Trạng thái trống (Chưa quét) */}
          {!hasScannedBatch && (
            <div className="card p-0 max-w-5xl mx-auto relative overflow-hidden">
              {/* nền khí quyển nhẹ theo tông navy → teal */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--navy-50)] via-transparent to-[var(--teal-soft)]/40 pointer-events-none" />
              <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-[var(--teal)]/5 blur-3xl pointer-events-none" />

              <div className="relative p-6 sm:p-9">
                <div className="flex flex-col items-center text-center max-w-xl mx-auto mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--navy)] to-[var(--teal-deep)] text-white shadow-[var(--shadow-lg)] ring-4 ring-white flex items-center justify-center mb-4">
                    <Sparkles className="w-7 h-7 text-[var(--teal)] animate-pulse" />
                  </div>
                  <h3 className="font-serif text-xl sm:text-[26px] font-bold text-[var(--ink)] tracking-tight leading-tight">
                    Sẵn sàng đối chiếu <span className="italic font-normal text-[var(--teal)]">dữ liệu HIS</span>
                  </h3>
                  <p className="text-[13px] text-[var(--mute)] leading-relaxed mt-2">
                    Chọn buổi khám tầm soát ở trên rồi nhấn <strong className="text-[var(--navy)] font-semibold">Quét đối chiếu ngay</strong> — hệ thống tự chạy quy trình 3 bước:
                  </p>
                </div>

                {/* Pipeline 3 bước có mũi tên kết nối */}
                <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-0 max-w-4xl mx-auto">
                  {[
                    { n: 1, chip: "bg-[var(--navy)] text-white", t: "So khớp CCCD & BHYT", tbl: "QLyCapThe", d: "Đối chiếu tự động CCCD · Mã thẻ BHYT · Họ tên · Năm sinh trên bảng" },
                    { n: 2, chip: "bg-[var(--teal-deep)] text-white", t: "Gán Mã BN HIS", tbl: "MaBNHIS", d: "Tự động lấy mã hồ sơ bệnh viện từ bảng" },
                    { n: 3, chip: "bg-[var(--gold)] text-white", t: "Xác nhận Phẫu thuật", tbl: "QLyPhongMo", d: "Truy vấn lịch sử mổ & cập nhật trạng thái trên" },
                  ].map((s, idx) => (
                    <div key={s.n} className="flex-1 flex items-stretch">
                      <div className="flex-1 rounded-[var(--r-md)] bg-white/80 backdrop-blur-sm border border-[var(--line)] p-4 text-left hover:border-[var(--teal)] hover:shadow-[var(--shadow-sm)] transition-all">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono text-[12px] shrink-0 shadow-[var(--shadow-sm)] ${s.chip}`}>{s.n}</div>
                          <div className="font-bold text-[var(--ink)] text-[13.5px]">{s.t}</div>
                        </div>
                        <div className="text-[12px] text-[var(--mute)] leading-relaxed">{s.d} <code className="text-[11px] font-mono bg-[var(--surface-hover)] px-1.5 py-0.5 rounded text-[var(--ink-soft)] font-bold">{s.tbl}</code></div>
                      </div>
                      {idx < 2 && (
                        <div className="hidden md:flex items-center justify-center w-8 shrink-0 text-[var(--mute-soft)]">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-center mt-7">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--teal-deep)] bg-[var(--teal-soft)] border border-[var(--teal)]/25 px-5 py-2.5 rounded-full">
                    <Play className="w-3.5 h-3.5 fill-current" /> Nhấn &quot;Quét đối chiếu ngay&quot; để bắt đầu
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bộ lọc nhanh Tab 1 */}
          {hasScannedBatch && batchResults.length > 0 && (
            <div className="card p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative min-w-[260px] flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
                <input
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                  placeholder="Tìm theo Tên BN, Mã BN, Mã HIS..."
                  className="input-field pl-9 h-[38px] text-[13px]"
                />
                {batchSearch && (
                  <button onClick={() => setBatchSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)]">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-[var(--surface-soft)] p-1 rounded-[var(--r-md)] border border-[var(--line)] shrink-0 overflow-x-auto">
                {([
                  { k: "all", label: `Tất cả (${batchResults.length})`, on: "bg-[var(--navy)] text-white" },
                  { k: "found", label: `Khớp HIS (${batchResults.filter((r) => r.found && !r.hasSurgery).length})`, on: "bg-[var(--teal-deep)] text-white" },
                  { k: "surgery", label: `✅ Đã mổ (${batchResults.filter((r) => r.hasSurgery && (r.matchType === "exact" || r.confirmed)).length})`, on: "bg-[var(--gold)] text-white" },
                  { k: "pending", label: `⚠ Chờ xác nhận (${batchResults.filter((r) => r.hasSurgery && r.matchType === "partial" && !r.confirmed).length})`, on: "bg-[var(--amber)] text-white" },
                  { k: "not_found", label: `Chưa thấy (${batchResults.filter((r) => !r.found).length})`, on: "bg-[var(--ink-soft)] text-white" },
                ] as const).map((f) => (
                  <button key={f.k} onClick={() => setBatchFilterStatus(f.k)}
                    className={`px-3 py-1.5 rounded-[var(--r-sm)] text-[12px] font-bold transition-all whitespace-nowrap ${batchFilterStatus === f.k ? `${f.on} shadow-[var(--shadow-sm)]` : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bảng kết quả Tab 1 */}
          {hasScannedBatch && (
            <div className="card p-0 overflow-hidden flex flex-col">
              <div className="px-5 py-3.5 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface-soft)] flex-wrap gap-2">
                <span className="font-bold text-[14px] text-[var(--ink)] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--teal-deep)]" />
                  Danh sách Bệnh nhân ({filteredBatchResults.length} / {batchResults.length} BN)
                </span>
                <span className="text-[11.5px] text-[var(--teal-deep)] font-semibold bg-[var(--teal-soft)] px-3 py-1 rounded-full border border-[var(--teal)]/25">
                  ⚡ Tự động cập nhật hồ sơ khi quét
                </span>
              </div>

              <DataView
                columns={batchColumns}
                data={filteredBatchResults}
                isLoading={batchLoading && batchResults.length === 0}
                pageSize={50}
              >
                <DataTable<HisRow>
                  dense
                  emptyIcon={Activity}
                  emptyTitle={
                    batchResults.length === 0
                      ? "Không tìm thấy bệnh nhân nào trong đợt khám này"
                      : "Không có bệnh nhân khớp bộ lọc"
                  }
                  rowClassName={(r) =>
                    r.hasSurgery && r.matchType === "partial" && !r.confirmed
                      ? "!bg-[var(--amber-soft)]/60"
                      : undefined
                  }
                />
                <DataPagination pageSizeOptions={[25, 50, 100, 200]} />
              </DataView>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ĐỐI CHIẾU NGƯỢC TỪ HIS */}
      {tab === "reverse" && (
        <div className="space-y-5">
          {/* Card chọn tháng & action — KHÔNG overflow-hidden để menu dropdown không bị cắt */}
          <div className="card p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="w-full sm:w-[300px]">
              <label className="text-[12px] font-bold text-[var(--ink-soft)] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--navy)]" /> Tháng phẫu thuật trên HIS
              </label>
              <Dropdown
                value={revMonth}
                onChange={setRevMonth}
                options={monthOptions.options}
                labels={monthOptions.labels}
                placeholder="Chọn tháng phẫu thuật..."
                mono={false}
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={runReverseCheck}
                disabled={revLoading}
                className="btn btn-primary h-[42px] px-6 rounded-[var(--r-md)] font-bold text-sm gap-2"
              >
                {revLoading ? <RefreshCw className="w-4 h-4 animate-spin text-[var(--teal)]" /> : <Download className="w-4 h-4" />}
                {revLoading ? "Đang tải danh sách HIS..." : "Tải danh sách mổ HIS"}
              </button>

              {revList.some((r) => r.matchedCsr && !r.matchedCsr.maBNHIS) && (
                <button
                  onClick={linkAllMatched}
                  disabled={revLoading}
                  className="btn btn-success h-[42px] px-6 rounded-[var(--r-md)] font-bold text-sm gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Cập nhật toàn bộ ({revList.filter((r) => r.matchedCsr && !r.matchedCsr.maBNHIS).length})
                </button>
              )}
            </div>
          </div>

          {/* Thống kê KPIs Tab 3 */}
          {revSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <CompactStatCard tone="navy" icon={Database} label="Tổng ca mổ trên HIS" value={revSummary.totalHIS} sub="Danh sách tháng" />
              <CompactStatCard tone="teal" icon={UserCheck} label="Khớp BN tầm soát CSR"
                value={<>{revSummary.matchedCSR}<span className="text-[11px] font-sans font-normal ml-1">({revSummary.totalHIS ? Math.round((revSummary.matchedCSR / revSummary.totalHIS) * 100) : 0}%)</span></>}
                sub="Có hồ sơ CSR" />
              <CompactStatCard tone="gold" icon={CheckCircle2} label="Đã liên kết vào CSR" value={revSummary.alreadyLinked}
                sub="Đã lưu mã HIS" />
            </div>
          )}

          {/* Trạng thái trống Tab 2 */}
          {!hasScannedRev && (
            <div className="card p-0 max-w-4xl mx-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--navy-50)] via-transparent to-[var(--teal-soft)]/40 pointer-events-none" />
              <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-[var(--teal)]/5 blur-3xl pointer-events-none" />
              <div className="relative p-6 sm:p-9 text-center flex flex-col items-center max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--navy)] to-[var(--teal-deep)] text-white shadow-[var(--shadow-lg)] ring-4 ring-white flex items-center justify-center mb-4">
                  <Database className="w-7 h-7 text-[var(--teal)] animate-pulse" />
                </div>
                <h3 className="font-serif text-xl sm:text-[26px] font-bold text-[var(--ink)] tracking-tight leading-tight">
                  Đối chiếu ngược từ <span className="italic font-normal text-[var(--teal)]">danh sách mổ HIS</span>
                </h3>
                <p className="text-[13px] text-[var(--mute)] leading-relaxed mt-2 mb-6">
                  Chọn tháng phẫu thuật ở trên rồi nhấn <strong className="text-[var(--navy)] font-semibold">Tải danh sách mổ HIS</strong> — hệ thống kéo toàn bộ ca mổ từ HIS và tự động so khớp với bệnh nhân đã tầm soát trong CSR.
                </p>
                <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--teal-deep)] bg-[var(--teal-soft)] border border-[var(--teal)]/25 px-5 py-2.5 rounded-full">
                  <Download className="w-3.5 h-3.5" /> Tự động tìm bệnh nhân mổ để chốt danh sách chính xác
                </span>
              </div>
            </div>
          )}

          {/* Bộ lọc nhanh Tab 2 */}
          {hasScannedRev && revList.length > 0 && (
            <div className="card p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 flex-wrap">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
                  <input
                    value={revSearch}
                    onChange={(e) => setRevSearch(e.target.value)}
                    placeholder="Tìm theo Tên BN, Mã HIS, SĐT..."
                    className="input-field pl-9 h-[38px] text-[13px]"
                  />
                  {revSearch && (
                    <button onClick={() => setRevSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)]">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="w-full sm:w-[240px]">
                  <Dropdown
                    value={revFilterDate}
                    onChange={setRevFilterDate}
                    options={revDateOptions.options}
                    labels={revDateOptions.labels}
                    placeholder="📅 Tất cả các ngày trong tháng"
                    mono={false}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 bg-[var(--surface-soft)] p-1 rounded-[var(--r-md)] border border-[var(--line)] shrink-0 overflow-x-auto">
                {([
                  { k: "all", label: `Tất cả (${revList.length})`, on: "bg-[var(--navy)] text-white" },
                  { k: "matched", label: `Khớp BN (${revList.filter((r) => r.matchedCsr).length})`, on: "bg-[var(--teal-deep)] text-white" },
                  { k: "mat2", label: `👁️ Mắt 2 (${revList.filter((r) => r.isMat2 || (r.lanMo && r.lanMo >= 2)).length})`, on: "bg-purple-700 text-white" },
                  { k: "unmatched", label: `Khách tự đến (${revList.filter((r) => !r.matchedCsr).length})`, on: "bg-[var(--ink-soft)] text-white" },
                  { k: "linked", label: `Đã liên kết (${revList.filter((r) => r.matchedCsr && (r.matchedCsr.maBNHIS || r.matchedCsr.daMo)).length})`, on: "bg-[var(--gold)] text-white" },
                ] as const).map((f) => (
                  <button key={f.k} onClick={() => setRevFilterStatus(f.k)}
                    className={`px-3 py-1.5 rounded-[var(--r-sm)] text-[12px] font-bold transition-all whitespace-nowrap cursor-pointer ${revFilterStatus === f.k ? `${f.on} shadow-[var(--shadow-sm)]` : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bảng kết quả Tab 2 */}
          {hasScannedRev && (
            <div className="card p-0 overflow-hidden flex flex-col">
              <div className="px-5 py-3.5 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface-soft)] flex-wrap gap-2">
                <span className="font-bold text-[14px] text-[var(--ink)] flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[var(--navy)]" />
                  Danh sách phẫu thuật trên HIS ({filteredRevList.length} / {revList.length} ca)
                </span>
                <span className="text-[11.5px] text-[var(--teal-deep)] font-semibold bg-[var(--teal-soft)] px-3 py-1 rounded-full border border-[var(--teal)]/25">
                  💡 Ưu tiên hiển thị các ca khớp tầm soát
                </span>
              </div>

              <DataView
                columns={revColumns}
                data={sortedRevList}
                isLoading={revLoading && revList.length === 0}
                pageSize={50}
              >
                <DataTable<HisRow>
                  dense
                  emptyIcon={Stethoscope}
                  emptyTitle={
                    revList.length === 0
                      ? "Không tìm thấy ca phẫu thuật nào trong tháng này trên HIS"
                      : "Không có ca phẫu thuật khớp bộ lọc"
                  }
                  rowClassName={(r) =>
                    r.matchedCsr
                      ? r.matchedCsr.matchType === "exact"
                        ? "!bg-[var(--teal-soft)]/40"
                        : "!bg-[var(--amber-soft)]/40"
                      : undefined
                  }
                />
                <DataPagination pageSizeOptions={[25, 50, 100, 200]} />
              </DataView>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
