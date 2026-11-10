"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import {
  Activity, RefreshCw, CheckCircle2, Search,
  Users, ShieldCheck, Database, Check,
  Download, UserCheck, Stethoscope, Info,
  CalendarDays, X, AlertTriangle, ShieldQuestion, ArrowRight,
  Clock, CheckCircle, Zap, ChevronLeft, ChevronRight, Eye, Lightbulb
} from "lucide-react";
import { fmtDate, fmtBuoiKhamName } from "@/lib/csr";
import { Dropdown } from "@/components/csr/fields";
import { DataView, DataTable, DataPagination } from "@/components/data";
import type { ColumnDef } from "@tanstack/react-table";
import { useCurrentFacility } from "@/lib/useFacility";
import { CsrSideCell, HisSideCell, HisCsrCompareModal } from "@/components/csr/HisCsrCompare";

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
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl px-3 py-2 flex items-center justify-between gap-2.5 shadow-2xs">
      <div className="min-w-0">
        <div className="text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider truncate">{label}</div>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className={`text-[18px] leading-none font-mono font-extrabold ${tones.val}`}>{value}</span>
          {sub && <span className="text-[11px] text-[var(--mute)] truncate">{sub}</span>}
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
  const [dailyFilterStatus, setDailyFilterStatus] = useState<"all" | "pending" | "unlinked" | "linked" | "mat2" | "choMo" | "nomatch">("all");
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
  const [batchFilterStatus, setBatchFilterStatus] = useState<"all" | "found" | "chomo" | "surgery" | "pending" | "not_found">("all");

  // Tab 2: Reverse Check state (Mặc định chọn tháng hiện tại)
  const [revMonth, setRevMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [revLoading, setRevLoading] = useState<boolean>(false);
  const [revList, setRevList] = useState<any[]>([]);
  const [revSummary, setRevSummary] = useState<any>(null);
  const [hasScannedRev, setHasScannedRev] = useState<boolean>(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  /** Ca chỉ khớp Họ tên + Năm sinh đang mở hộp so sánh HIS ↔ CSR để xác nhận */
  const [compareRow, setCompareRow] = useState<HisRow | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Filter states cho Tab 2 (Lọc theo ngày, từ khóa, trạng thái)
  const [revSearch, setRevSearch] = useState<string>("");
  const [revFilterDate, setRevFilterDate] = useState<string>(""); // YYYY-MM-DD
  const [revFilterStatus, setRevFilterStatus] = useState<"all" | "pending" | "unlinked" | "linked" | "mat2">("all");

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
      .catch(() => { });
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

  // Map cho chọn Tháng HIS (24 tháng gần nhất, tháng này đứng đầu)
  const monthOptions = useMemo(() => {
    const options: string[] = [""];
    const labels: Record<string, string> = {
      "": "Tất cả các tháng",
    };
    const now = new Date();
    const currentY = now.getFullYear();
    const currentStr = `${currentY}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const temp: string[] = [];
    for (let i = -23; i <= 0; i++) {
      const d = new Date(currentY, now.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const val = `${y}-${String(m).padStart(2, "0")}`;
      temp.push(val);
      labels[val] = `Tháng ${String(m).padStart(2, "0")}/${y}${val === currentStr ? " · tháng này" : ""}`;
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
      "": "Tất cả các ngày trong tháng",
    };
    sortedDates.forEach((d) => {
      labels[d] = `${fmtDate(d)} · ${dateMap[d]} ca mổ`;
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
          message:
            `Đã tìm thấy ${d.summary?.totalHIS || 0} ca mổ ngày ${fmtDate(targetDate)} (${d.summary?.matchedCSR || 0} ca khớp CSR)` +
            (d.summary?.choMo ? ` · ${d.summary.choMo} ca chờ mổ (đã nhập viện, chưa vào sổ mổ)` : ""),
        });
        // Mắt 2 của BN đã khớp chắc chắn (CCCD / đã xác nhận) → tự lưu, không cần bấm đồng bộ
        await tuLuuMat2(d.list || []);
      } else {
        addToast({ type: "error", message: d.error || "Lỗi khi quét dữ liệu từ HIS" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối tới máy chủ HIS" });
    } finally {
      setDailyLoading(false);
    }
  };

  /** Ca Mắt 2 tự lưu: đã mổ thật (có trong sổ mổ), BN khớp chắc chắn (CCCD/BHYT hoặc đã xác nhận), CSR chưa ghi ca này. */
  const laMat2TuLuu = (r: HisRow) =>
    !r.choMo && r.matchedCsr && r.matchedCsr.confirmed && !r.matchedCsr.daMo && Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));

  const tuLuuMat2 = async (list: HisRow[]) => {
    const ds = list.filter(laMat2TuLuu);
    if (ds.length === 0) return;
    try {
      const res = await fetch("/api/his/link-reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: ds.map((r) => ({
            hoSoId: r.matchedCsr.id,
            maHIS: r.maHIS,
            ngayMo: r.ngayMo,
            soTienThucThu: r.soTienThucThu,
            isMat2: true,
            tenDichVu: r.tenDichVu,
            matMo: r.matMo,
            loaiPT: r.loaiPT,
            matchType: r.matchedCsr.matchType,
            confirmed: true,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      const ids = new Set(ds.map((r) => r.matchedCsr.id));
      setDailyList((prev) =>
        prev.map((r) =>
          r.matchedCsr && ids.has(r.matchedCsr.id) && laMat2TuLuu(r)
            ? { ...r, matchedCsr: { ...r.matchedCsr, daMo: true, maBNHIS: r.maHIS, trangThaiDieuTri: "Đã mổ", ghiChuMat2: `${r.matchedCsr.ghiChuMat2 || ""}\n[Mắt 2]` } }
            : r
        )
      );
      setDailySummary((prev: typeof dailySummary) => prev ? {
        ...prev,
        alreadyLinked: (prev.alreadyLinked || 0) + ds.length,
        unlinkedMatched: Math.max(0, (prev.unlinkedMatched || 0) - ds.length),
      } : null);
      addToast({ type: "success", message: `Đã tự lưu ${ds.length} ca Mắt 2 vào CSR` });
    } catch {
      addToast({ type: "error", message: `Chưa tự lưu được ${ds.length} ca Mắt 2 — bấm "Lưu Mắt 2" ở từng ca để lưu tay` });
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
    } catch { }
  };

  const linkDailyPatient = async (item: any, isConfirm = false) => {
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
          matchType: item.matchedCsr.matchType,
          isKhuyetCccd: Boolean(item.matchedCsr.isKhuyetCccd),
          confirmed: isConfirm || item.matchedCsr.matchType === "exact",
          chiTiet: isConfirm
            ? `[✓ Đã xác nhận khớp HIS]: Xác nhận thủ công ca mổ ngày ${fmtDate(hisNgay(item))} (Mã HIS: ${item.maHIS}${item.matchedCsr.isKhuyetCccd ? " - Khuyết CCCD" : ""})`
            : isSecondEye
              ? `Mắt 2: Mổ ngày ${fmtDate(hisNgay(item))} (${item.tenDichVu || item.loaiPT || "Phẫu thuật"}${item.matMo ? ` - ${item.matMo}` : ""})`
              : `Mổ ngày ${fmtDate(hisNgay(item))} (Khoa: ${item.khoaMo || "Phòng mổ"}, Bác sĩ: ${item.bsDieuTri || "—"}${item.tenDichVu ? `, DV: ${item.tenDichVu}` : ""})`,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        addToast({
          type: "success",
          message: isConfirm
            ? `Đã xác nhận ca mổ cho bệnh nhân ${item.hoTen || item.matchedCsr.hoTen} vào báo cáo!`
            : isSecondEye
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
                  confirmed: true,
                  maBNHIS: item.maHIS,
                  trangThaiDieuTri: "Đã mổ",
                  ghiChuMat2: isSecondEye ? "Mắt 2" : (isConfirm ? "[✓ Đã xác nhận khớp HIS]" : r.matchedCsr.ghiChuMat2),
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
    // Chỉ tự động đồng bộ hàng loạt các ca KHỚP CCCD CHÍNH XÁC. Ca khuyết CCCD cần xác nhận tay từng ca.
    const exactUnlinked = dailyList.filter(
      (r) => !r.choMo && r.matchedCsr && !r.matchedCsr.daMo && r.matchedCsr.matchType === "exact" && !(r.isMat2 || (r.lanMo && r.lanMo >= 2))
    );
    const partialUnlinked = dailyList.filter((r) => !r.choMo && r.matchedCsr && (!r.matchedCsr.daMo || !r.matchedCsr.confirmed) && r.matchedCsr.matchType === "partial");

    if (exactUnlinked.length === 0) {
      if (partialUnlinked.length > 0) {
        addToast({
          type: "info",
          message: `Có ${partialUnlinked.length} ca khuyết CCCD chưa được xác nhận. Vui lòng bấm "Xác nhận đã mổ" thủ công từng ca để tránh nhầm lẫn!`,
        });
      } else {
        addToast({ type: "info", message: "Tất cả các ca mổ khớp đều đã được cập nhật vào CSR!" });
      }
      return;
    }

    const ok = await confirm({
      title: "Đồng bộ tất cả ca mổ khớp CCCD vào CSR",
      message: `Tìm thấy ${exactUnlinked.length} ca khớp CCCD chính xác. Bạn có chắc muốn cập nhật vào CSR không?${partialUnlinked.length > 0 ? ` (${partialUnlinked.length} ca khuyết CCCD sẽ được giữ lại để bạn xác nhận thủ công từng ca)` : ""
        }`,
      confirmLabel: `Đồng bộ ${exactUnlinked.length} ca`,
    });
    if (!ok) return;

    setSyncingAll(true);
    try {
      const items = exactUnlinked.map((r) => ({
        hoSoId: r.matchedCsr.id,
        maHIS: r.maHIS,
        ngayMo: r.ngayMo,
        soTienThucThu: r.soTienThucThu,
        isMat2: r.isMat2,
        tenDichVu: r.tenDichVu,
        matMo: r.matMo,
        loaiPT: r.loaiPT,
        matchType: "exact",
        confirmed: true,
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
        addToast({
          type: "success",
          message: `Đã đồng bộ ${d.count || exactUnlinked.length} ca khớp CCCD vào CSR!${partialUnlinked.length > 0 ? ` Còn ${partialUnlinked.length} ca khuyết CCCD cần xác nhận tay.` : ""
            }`,
        });
        const unlinkedIds = new Set(exactUnlinked.map((u) => u.matchedCsr.id));
        setDailyList((prev) =>
          prev.map((r) =>
            r.matchedCsr && unlinkedIds.has(r.matchedCsr.id)
              ? { ...r, matchedCsr: { ...r.matchedCsr, daMo: true, confirmed: true, maBNHIS: r.maHIS, trangThaiDieuTri: "Đã mổ", ghiChuMat2: r.isMat2 ? "Mắt 2" : r.matchedCsr.ghiChuMat2 } }
              : r
          )
        );
        setDailySummary((prev: any) => prev ? {
          ...prev,
          alreadyLinked: (prev.alreadyLinked || 0) + exactUnlinked.length,
          unlinkedMatched: Math.max(0, (prev.unlinkedMatched || 0) - exactUnlinked.length),
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
  const linkPatient = async (item: any, isConfirm = false) => {
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
          isMat2: item.isMat2,
          tenDichVu: item.tenDichVu,
          matMo: item.matMo,
          loaiPT: item.loaiPT,
          matchType: item.matchedCsr.matchType,
          isKhuyetCccd: Boolean(item.matchedCsr.isKhuyetCccd),
          confirmed: isConfirm || item.matchedCsr.matchType === "exact",
          chiTiet: isConfirm
            ? `[✓ Đã xác nhận khớp HIS]: Xác nhận thủ công ca mổ ngày ${fmtDate(hisNgay(item))} (Mã HIS: ${item.maHIS}${item.matchedCsr.isKhuyetCccd ? " - Khuyết CCCD" : ""})`
            : item.isMat2
              ? `Mắt 2: Mổ ngày ${fmtDate(hisNgay(item))} (${item.tenDichVu || item.loaiPT}${item.matMo ? ` - ${item.matMo}` : ""})`
              : `Mổ ngày ${fmtDate(hisNgay(item))} (Khoa: ${item.khoaMo || "Phòng mổ"}, Bác sĩ: ${item.bsDieuTri || "—"}${item.tenDichVu ? `, DV: ${item.tenDichVu}` : ""})`,
        }),
      });
      if (res.ok) {
        addToast({
          type: "success",
          message: isConfirm
            ? `Đã xác nhận ca mổ cho ${item.matchedCsr.hoTen} vào báo cáo!`
            : `Đã liên kết ${item.isMat2 ? "Mắt 2" : "mã HIS"} cho ${item.matchedCsr.hoTen}`,
        });
        // update local revList
        setRevList((prev) =>
          prev.map((r) =>
            r.matchedCsr?.id === item.matchedCsr.id
              ? {
                ...r,
                matchedCsr: {
                  ...r.matchedCsr,
                  daMo: true,
                  confirmed: true,
                  maBNHIS: item.maHIS,
                  trangThaiDieuTri: "Đã mổ",
                  ghiChuMat2: item.isMat2 ? "Mắt 2" : (isConfirm ? "[✓ Đã xác nhận khớp HIS]" : r.matchedCsr.ghiChuMat2),
                },
              }
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
    const pending = revList.filter((r) => r.matchedCsr && (!r.matchedCsr.daMo || !r.matchedCsr.confirmed));
    const exactUnlinked = pending.filter((r) => !r.matchedCsr.ambiguous && r.matchedCsr.matchType === "exact");
    const partialUnlinked = pending.filter((r) => !r.matchedCsr.ambiguous && r.matchedCsr.matchType === "partial");
    const skipped = pending.length - exactUnlinked.length;

    if (exactUnlinked.length === 0) {
      if (partialUnlinked.length > 0) {
        addToast({
          type: "info",
          message: `Có ${partialUnlinked.length} ca khuyết CCCD chưa được xác nhận. Vui lòng bấm "Xác nhận đã mổ" từng ca để đảm bảo chính xác!`,
        });
      } else {
        addToast({
          type: "info",
          message: skipped > 0
            ? `${skipped} ca khớp nhiều hồ sơ hoặc khuyết CCCD — cần kiểm tra tay từng ca.`
            : "Tất cả các BN khớp CCCD đều đã được liên kết mã HIS!",
        });
      }
      return;
    }
    if (!(await confirm({
      title: "Liên kết mã HIS hàng loạt (Chỉ ca khớp CCCD)",
      message: `Sẽ gán mã HIS cho ${exactUnlinked.length} bệnh nhân khớp CCCD chính xác.`,
      note: partialUnlinked.length > 0
        ? `Giữ lại ${partialUnlinked.length} ca khuyết CCCD để bạn bấm "Xác nhận đã mổ" thủ công.`
        : "Thao tác chạy lần lượt từng hồ sơ và không thể hoàn tác tự động.",
      confirmLabel: `Liên kết ${exactUnlinked.length} hồ sơ`,
      tone: "info",
    }))) return;

    setRevLoading(true);
    try {
      const items = exactUnlinked.map((r) => ({
        hoSoId: r.matchedCsr.id,
        maHIS: r.maHIS,
        ngayMo: r.ngayMo,
        soTienThucThu: r.soTienThucThu,
        isMat2: r.isMat2,
        tenDichVu: r.tenDichVu,
        matMo: r.matMo,
        loaiPT: r.loaiPT,
        matchType: "exact",
        confirmed: true,
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
        const unlinkedIds = new Set(exactUnlinked.map((u) => u.matchedCsr.id));
        setRevList((prev) =>
          prev.map((r) =>
            r.matchedCsr && unlinkedIds.has(r.matchedCsr.id)
              ? { ...r, matchedCsr: { ...r.matchedCsr, daMo: true, confirmed: true, maBNHIS: r.maHIS, trangThaiDieuTri: "Đã mổ", ghiChuMat2: r.isMat2 ? "Mắt 2" : r.matchedCsr.ghiChuMat2 } }
              : r
          )
        );
        setRevSummary((prev: any) => prev ? {
          ...prev,
          alreadyLinked: (prev.alreadyLinked || 0) + exactUnlinked.length,
          unlinkedMatched: Math.max(0, (prev.unlinkedMatched || 0) - exactUnlinked.length),
        } : null);
        addToast({ type: "success", message: `Đã tự động liên kết thành công ${d.count || exactUnlinked.length} bệnh nhân khớp CCCD!${partialUnlinked.length > 0 ? ` Còn ${partialUnlinked.length} ca khuyết CCCD cần xác nhận tay.` : ""}` });
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
      if (batchFilterStatus === "found") return r.found && !r.hasSurgery && !r.isChoMo;
      if (batchFilterStatus === "chomo") return r.found && !r.hasSurgery && r.isChoMo;
      if (batchFilterStatus === "surgery") return r.hasSurgery && (r.matchType === "exact" || r.confirmed);
      if (batchFilterStatus === "pending") return r.hasSurgery && r.matchType === "partial" && !r.confirmed;
      if (batchFilterStatus === "not_found") return !r.found;
      return true;
    });
  }, [batchResults, batchSearch, batchFilterStatus]);

  // Filtered Reverse List: Chỉ hiển thị các ca thuộc CSR (khớp CCCD và chờ xác nhận)
  const filteredRevList = useMemo(() => {
    // Chỉ giữ các ca có hồ sơ CSR
    const list = revList.filter((r) => Boolean(r.matchedCsr));

    return list.filter((r) => {
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
      if (revFilterStatus === "pending") {
        return (r.matchedCsr?.matchType === "partial" || r.matchedCsr?.isKhuyetCccd) && !r.matchedCsr?.confirmed;
      }
      if (revFilterStatus === "unlinked") {
        const isSecondEye = Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
        const isLinkedToThisHis = Boolean(
          r.matchedCsr?.maBNHIS && (
            r.matchedCsr.maBNHIS === r.maHIS ||
            r.matchedCsr.maBNHIS.replace(/\./g, "") === r.maHIS?.replace(/\./g, "")
          )
        );
        const isLinked = r.matchedCsr?.daMo || (isLinkedToThisHis && r.matchedCsr?.trangThaiDieuTri === "Đã mổ");
        return r.matchedCsr?.matchType === "exact" && !isLinked && !isSecondEye;
      }
      if (revFilterStatus === "linked") {
        const isLinkedToThisHis = Boolean(
          r.matchedCsr?.maBNHIS && (
            r.matchedCsr.maBNHIS === r.maHIS ||
            r.matchedCsr.maBNHIS.replace(/\./g, "") === r.maHIS?.replace(/\./g, "")
          )
        );
        return Boolean(r.matchedCsr?.daMo || r.matchedCsr?.confirmed || (isLinkedToThisHis && r.matchedCsr?.trangThaiDieuTri === "Đã mổ"));
      }
      if (revFilterStatus === "mat2") {
        return Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
      }
      return true;
    });
  }, [revList, revSearch, revFilterDate, revFilterStatus]);

  // Ưu tiên ca chờ xác nhận lên đầu, tiếp đến ca chưa liên kết
  const sortedRevList = useMemo(
    () => [...filteredRevList].sort((a, b) => {
      const aPending = (a.matchedCsr?.matchType === "partial" || a.matchedCsr?.isKhuyetCccd) && !a.matchedCsr?.confirmed ? 1 : 0;
      const bPending = (b.matchedCsr?.matchType === "partial" || b.matchedCsr?.isKhuyetCccd) && !b.matchedCsr?.confirmed ? 1 : 0;
      return bPending - aPending;
    }),
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
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border ${r.matchReason?.includes("BHYT")
                    ? "bg-[var(--navy-soft)] text-[var(--navy)] border-[var(--navy-200)]"
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
          // Đã nhập viện / có DV phẫu thuật nhưng phòng mổ chưa ghi sổ — chưa tính là đã mổ
          if (r.isChoMo)
            return (
              <span
                title="Đã nhập viện hoặc có chỉ định phẫu thuật, phòng mổ chưa ghi sổ"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--amber-soft)] text-[var(--amber-deep)] border border-[var(--amber)]/30"
              >
                <Clock className="w-3.5 h-3.5" /> Chờ mổ
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

  /* Số đếm trên các chip. "Tất cả" = mọi ca mổ trong ngày trên HIS (kể cả chưa khớp CSR). */
  const dailyCounts = useMemo(() => {
    const caCsr = dailyList.filter((r) => r.matchedCsr && !r.choMo);
    const laMat2 = (r: HisRow) => Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
    return {
      all: dailyList.length,
      nomatch: dailyList.filter((r) => !r.matchedCsr && !r.choMo).length,
      pending: caCsr.filter((r) => (r.matchedCsr.matchType === "partial" || r.matchedCsr.isKhuyetCccd) && !r.matchedCsr.confirmed).length,
      // Mắt 2 tự lưu nên không nằm trong "Cần cập nhật" / nút Đồng bộ
      unlinked: caCsr.filter((r) => r.matchedCsr.matchType === "exact" && !r.matchedCsr.daMo && !laMat2(r)).length,
      linked: caCsr.filter((r) => r.matchedCsr.daMo || r.matchedCsr.confirmed).length,
      mat2: caCsr.filter((r) => r.isMat2 || (r.lanMo && r.lanMo >= 2)).length,
      choMo: dailyList.filter((r) => r.matchedCsr && r.choMo).length,
    };
  }, [dailyList]);

  const filteredDailyList = useMemo(() => {
    // Mọi ca mổ trong ngày trên HIS; thứ tự: khớp CCCD/BHYT → cần xác nhận (Họ tên + NS) → chưa khớp CSR,
    // ca chờ mổ (chưa vào sổ mổ) xuống cuối từng nhóm
    const hang = (r: HisRow) => (r.matchedCsr ? (r.matchedCsr.matchType === "exact" ? 0 : 1) : 2) * 2 + (r.choMo ? 1 : 0);
    let result = dailyList.map((r, i) => ({ r, i })).sort((a, b) => hang(a.r) - hang(b.r) || a.i - b.i).map((x) => x.r);

    if (dailyFilterStatus === "choMo") {
      result = result.filter((r) => r.choMo);
    } else if (dailyFilterStatus !== "all") {
      result = result.filter((r) => !r.choMo);
    }

    if (dailyFilterStatus === "nomatch") {
      result = result.filter((r) => !r.matchedCsr);
    } else if (dailyFilterStatus === "pending") {
      result = result.filter((r) => (r.matchedCsr?.matchType === "partial" || r.matchedCsr?.isKhuyetCccd) && !r.matchedCsr?.confirmed);
    } else if (dailyFilterStatus === "unlinked") {
      result = result.filter((r) => r.matchedCsr?.matchType === "exact" && !r.matchedCsr?.daMo && !(r.isMat2 || (r.lanMo && r.lanMo >= 2)));
    } else if (dailyFilterStatus === "linked") {
      result = result.filter((r) => r.matchedCsr && (r.matchedCsr.daMo || r.matchedCsr.confirmed));
    } else if (dailyFilterStatus === "mat2") {
      result = result.filter((r) => Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2)));
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
        size: 124,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="min-w-0 leading-tight">
              <div className="font-mono text-[12px] font-bold whitespace-nowrap text-[var(--navy)]" title={r.maHIS}>{r.maHIS}</div>
              {r.phongMo && <div className="mt-1 truncate text-[11px] text-[var(--mute)]">{r.phongMo}</div>}
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
        size: 250,
        cell: ({ row }) => <HisSideCell r={row.original} />,
      },
      {
        /* Ngày + Mắt chung một cột: tab này xem theo 1 ngày nên ngày gần như giống nhau,
           thông tin cần nhìn là Mắt 1 / Mắt 2 và mắt nào. */
        id: "ngayMo",
        header: "Ca mổ",
        size: 104,
        accessorFn: (r) => `${r.isMat2 || (r.lanMo && r.lanMo >= 2) ? 2 : 1}${r.ngayMoLocal || ""}`,
        cell: ({ row }) => {
          const r = row.original;
          const ngay = hisNgay(r);
          const isSecondEye = Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
          return (
            <div className="leading-tight min-w-0">
              {r.choMo ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--amber-soft)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--amber-deep)] whitespace-nowrap">
                  <Clock className="h-3 w-3 shrink-0" /> Chờ mổ
                </span>
              ) : (
                <span className="font-mono text-[12px] font-semibold text-[var(--ink)] whitespace-nowrap">
                  {ngay ? fmtDate(ngay).slice(0, 5) : "—"}
                </span>
              )}
              <div className="mt-1 flex flex-col items-start gap-0.5 whitespace-nowrap">
                <span
                  className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-px text-[11px] font-bold ${isSecondEye ? "bg-[var(--violet-soft)] text-[var(--violet)]" : "bg-[var(--surface-soft)] text-[var(--ink-soft)]"
                    }`}
                  title={r.lanMo ? `Lần mổ thứ ${r.lanMo}` : undefined}
                >
                  {isSecondEye && <Eye className="h-2.5 w-2.5" />}
                  Mắt {isSecondEye ? 2 : 1}
                </span>
                {r.matMo && <span className="text-[11px] text-[var(--mute)]">{r.matMo}</span>}
              </div>
            </div>
          );
        },
      },
      {
        /* Tên DV HIS rất dài ("Phẫu thuật tán nhuyễn thể thủy tinh bằng siêu âm (Phaco) có hoặc
           không đặt IOL_ IOL Mini 4") — loại PT đã có nhãn riêng nên chỉ hiện phần IOL; chẩn đoán
           (thường trống) gộp vào dòng phụ thay vì chiếm hẳn một cột. */
        id: "dichVu",
        header: "Phẫu thuật",
        size: 240,
        meta: { flex: true, noTruncate: true },
        cell: ({ row }) => {
          const r = row.original;
          const ten = String(r.tenDichVu || r.loaiPT || "");
          const iol = ten.match(/IOL[_\s:-]*(?:IOL\s*)?\(?([^()]+?)\)?\s*$/i)?.[1]?.trim();
          const ngan = iol && !/^có hoặc không/i.test(iol) ? `IOL ${iol}` : ten;
          const diag = r.chanDoanRavien || r.chanDoanVaovien || r.chanDoanBM || r.chanDoan;
          return (
            <div className="min-w-0 leading-tight" title={[ten, diag && `Chẩn đoán: ${diag}`, r.bsDieuTri && `BS: ${r.bsDieuTri}`].filter(Boolean).join("\n")}>
              <div className="flex items-start gap-1.5 min-w-0">
                {r.loaiPT && (
                  <span className="shrink-0 rounded-md bg-[var(--navy-50)] px-1.5 py-px text-[11px] font-bold text-[var(--navy)]">
                    {r.loaiPT}
                  </span>
                )}
                <span className="line-clamp-2 whitespace-normal text-[12.5px] font-medium leading-snug text-[var(--ink)]">
                  {ngan || <span className="italic text-[var(--mute-soft)]">Chưa có tên DV</span>}
                </span>
              </div>
              {(diag || r.bsDieuTri) && (
                <div className="mt-1 line-clamp-2 whitespace-normal text-[11px] leading-snug text-[var(--mute)]">
                  {[diag, r.bsDieuTri && `BS. ${r.bsDieuTri}`].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "doiChieu",
        header: "Hồ sơ CSR",
        size: 290,
        cell: ({ row }) => {
          const r = row.original;
          if (r.cccdConflict) {
            return (
              <div className="text-xs space-y-1 min-w-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[11px] font-bold bg-[var(--rose-soft)] text-[var(--rose-deep)] border border-[var(--rose)]/30">
                  ✕ Lệch CCCD ({r.cccdConflict.maBN})
                </span>
                <div className="text-[11px] text-[var(--mute)]">
                  HIS: {r.cccd || "—"} ≠ CSR: {r.cccdConflict.cccd || "—"}
                </div>
              </div>
            );
          }
          if (!r.matchedCsr) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-[var(--mute)] bg-[var(--surface-hover)] border border-[var(--line)] font-medium">
                Chưa có trong CSR
              </span>
            );
          }
          return <CsrSideCell r={r} />;
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 140,
        meta: { align: "right" },
        cell: ({ row }) => {
          const r = row.original;
          if (r.choMo) {
            // Chưa mổ thật thì không cho đánh dấu — đợi phòng mổ ghi sổ rồi quét lại
            return (
              <span className="text-[11px] font-semibold text-[var(--amber-deep)]" title="Phòng mổ ghi sổ xong thì ca này hiện ở danh sách mổ để đánh dấu">
                Chờ ghi sổ mổ
              </span>
            );
          }
          if (r.cccdConflict) {
            return (
              <span className="text-xs font-semibold text-[var(--rose)]" title="Trùng tên và năm sinh nhưng CCCD khác nhau - không thể liên kết">
                ✕ Lệch CCCD
              </span>
            );
          }
          if (!r.matchedCsr) return <span className="text-xs text-[var(--mute-soft)]">—</span>;
          const isSecondEye = Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
          const isPartial = r.matchedCsr.matchType === "partial" || r.matchedCsr.isKhuyetCccd;
          const isLinkedToThisHis = Boolean(
            r.matchedCsr.maBNHIS && (
              r.matchedCsr.maBNHIS === r.maHIS ||
              r.matchedCsr.maBNHIS.replace(/\./g, "") === r.maHIS?.replace(/\./g, "")
            )
          );
          const isLinked = r.matchedCsr.daMo || (isLinkedToThisHis && r.matchedCsr.trangThaiDieuTri === "Đã mổ");

          // Nếu 1 trong 2 khuyết CCCD và CHƯA được xác nhận: nút "Xác nhận đã mổ" màu cam
          if (isPartial && !r.matchedCsr.confirmed) {
            return (
              <button
                type="button"
                data-no-row-click
                onClick={() => setCompareRow(r)}
                disabled={linkingId === r.matchedCsr.id}
                className="h-8 px-3 whitespace-nowrap bg-[var(--amber)] hover:bg-[var(--amber-deep)] text-white text-[12px] font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="1 trong 2 bên khuyết CCCD: Bấm xác nhận sau khi kiểm tra đúng bệnh nhân"
              >
                {linkingId === r.matchedCsr.id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Xác nhận mổ</span>
              </button>
            );
          }

          if (isLinked) {
            return (
              <span
                className={`inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-semibold ${isSecondEye ? "text-[var(--violet-deep)]" : isPartial ? "text-[var(--amber-deep)]" : "text-[var(--teal-deep)]"
                  }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSecondEye ? "Đã lưu (Mắt 2)" : isPartial ? "Đã xác nhận" : "Đã lưu CSR"}</span>
              </span>
            );
          }

          return (
            <button
              type="button"
              data-no-row-click
              onClick={() => linkDailyPatient(r, false)}
              disabled={linkingId === r.matchedCsr.id}
              className={`h-8 px-3 whitespace-nowrap text-[12px] font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 text-white ${isSecondEye ? "bg-[var(--violet)] hover:bg-[var(--violet-deep)]" : "bg-[var(--teal-deep)] hover:bg-[var(--teal)]"
                }`}
            >
              {linkingId === r.matchedCsr.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : isSecondEye ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              )}
              <span>{isSecondEye ? "Lưu Mắt 2" : "Đánh dấu mổ"}</span>
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
                <div className="text-[11px] text-[var(--mute)] font-mono mt-0.5 truncate">
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
                <div className="text-[11px] text-[var(--navy)] font-semibold truncate" title={`BHYT: ${r.bhyt}`}>
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
        header: "Ngày mổ",
        size: 95,
        // Sắp xếp trên chuỗi "YYYY-MM-DD HH:mm:ss" — thứ tự chuỗi trùng thứ tự thời gian.
        accessorFn: (r) => r.ngayMoLocal || "",
        cell: ({ row }) => {
          const ngay = hisNgay(row.original);
          return (
            <span className="font-mono text-xs font-semibold text-[var(--ink)] whitespace-nowrap">
              {ngay ? fmtDate(ngay) : "—"}
            </span>
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-[var(--violet)]/15 text-[var(--violet-deep)] border border-[var(--violet)]/40 shadow-2xs">
                    <Eye className="w-3 h-3 text-[var(--violet-deep)]" />
                    <span>Mắt 2</span>
                    {r.lanMo && r.lanMo > 2 && <span className="text-[11px] opacity-80">(lần {r.lanMo})</span>}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--surface-hover)] text-[var(--ink-soft)] border border-[var(--line)]">
                    <span>Mắt 1</span>
                    {r.lanMo ? <span className="text-[11px] text-[var(--mute)]">(lần {r.lanMo})</span> : null}
                  </span>
                )}
              </div>
              {r.matMo && (
                <div className="text-[11px] font-bold text-[var(--teal-deep)] flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal-deep)] shrink-0" />
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
                  <span className="inline-block px-1.5 py-0.2 rounded text-[11px] font-extrabold uppercase tracking-wide bg-[var(--navy-soft)] text-[var(--navy)] border border-[var(--navy-200)]">
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
                <div className="text-[11px] text-[var(--green-deep)] font-semibold mt-0.5 truncate" title={`BS: ${r.bsDieuTri}`}>
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
          if (r.cccdConflict) {
            return (
              <div className="text-xs space-y-1 min-w-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[11px] font-bold bg-[var(--rose-soft)] text-[var(--rose-deep)] border border-[var(--rose)]/30">
                  ✕ Lệch CCCD ({r.cccdConflict.maBN})
                </span>
                <div className="text-[11px] text-[var(--mute)]">
                  HIS: {r.cccd || "—"} ≠ CSR: {r.cccdConflict.cccd || "—"}
                </div>
              </div>
            );
          }
          if (!r.matchedCsr) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-[var(--mute)] bg-[var(--surface-hover)] border border-[var(--line)] font-medium">
                ⚪ Khách tự đến BV / Khác
              </span>
            );
          }
          const m = r.matchedCsr;
          const isBhyt = m.matchReason?.includes("BHYT");
          const isSecondEye = Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
          const isPartial = m.matchType === "partial" || m.isKhuyetCccd;
          return (
            <div className="text-xs space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${m.matchType === "exact"
                      ? isBhyt
                        ? "bg-[var(--navy-soft)] text-[var(--navy)] border-[var(--navy-200)]"
                        : "bg-[var(--green-soft)] text-[var(--green-deep)] border-[var(--green)]/30"
                      : "bg-[var(--amber-soft)] text-[var(--amber-deep)] border-[var(--amber)]/40"
                    }`}
                >
                  {isPartial ? "⚠ Khuyết CCCD (Tên + NS)" : (m.matchReason || "Khớp hồ sơ")}
                </span>
                <span className="font-mono font-bold text-[var(--navy)]">{m.maBN}</span>
              </div>
              <div className="text-[11px] text-[var(--mute)] truncate">
                {m.buoiKham?.xa ? `Đợt: ${m.buoiKham.xa}` : (m.buoiKham?.diaDiem || "—")}
                {m.buoiKham?.ngayKham ? ` (${fmtDate(m.buoiKham.ngayKham)})` : ""}
              </div>
              {isSecondEye && (
                <div className="text-[11px] font-semibold text-[var(--violet-deep)] flex items-center gap-1 bg-[var(--violet-soft)] px-1.5 py-0.5 rounded border border-[var(--violet)]/30">
                  <Eye className="w-3 h-3 text-[var(--violet)] shrink-0" />
                  <span className="truncate">
                    {r.matchedCsr.daMo || (r.matchedCsr.maBNHIS && r.matchedCsr.trangThaiDieuTri === "Đã mổ")
                      ? "Đã lưu hồ sơ (Mắt 2)"
                      : "Ghi nhận vào Ghi chú Mắt 2"}
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 150,
        enableSorting: false,
        enableResizing: false,
        meta: { align: "right" },
        cell: ({ row }) => {
          const r = row.original;
          if (r.cccdConflict) {
            return (
              <span className="text-xs font-semibold text-[var(--rose)]" title="Trùng tên và năm sinh nhưng CCCD khác nhau - không thể liên kết">
                ✕ Lệch CCCD
              </span>
            );
          }
          if (!r.matchedCsr) return <span className="text-xs text-[var(--mute-soft)] font-mono">—</span>;
          const isSecondEye = Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
          const isPartial = r.matchedCsr.matchType === "partial" || r.matchedCsr.isKhuyetCccd;
          const isLinkedToThisHis = Boolean(
            r.matchedCsr.maBNHIS && (
              r.matchedCsr.maBNHIS === r.maHIS ||
              r.matchedCsr.maBNHIS.replace(/\./g, "") === r.maHIS?.replace(/\./g, "")
            )
          );
          const isLinked = r.matchedCsr.daMo || (isLinkedToThisHis && r.matchedCsr.trangThaiDieuTri === "Đã mổ");

          // Nếu 1 trong 2 khuyết CCCD và CHƯA được xác nhận: hiển thị nút "Xác nhận đã mổ" màu cam
          if (isPartial && !r.matchedCsr.confirmed) {
            return (
              <button
                type="button"
                data-no-row-click
                onClick={() => linkPatient(r, true)}
                disabled={linkingId === r.matchedCsr.id}
                className="px-3 py-1.5 bg-[var(--amber)] hover:bg-[var(--amber)] text-white text-xs font-bold rounded-lg shadow-2xs inline-flex items-center gap-1.5 hover:shadow transition cursor-pointer disabled:opacity-50 ml-auto"
                title="1 trong 2 bên khuyết CCCD: Bấm xác nhận sau khi kiểm tra đúng bệnh nhân"
              >
                {linkingId === r.matchedCsr.id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Xác nhận</span>
              </button>
            );
          }

          if (isLinked) {
            return (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border ${isSecondEye
                    ? "bg-[var(--violet-soft)] text-[var(--violet-deep)] border-[var(--violet)]/30"
                    : isPartial
                      ? "bg-[var(--amber-soft)] text-[var(--amber-deep)] border-[var(--amber)]/40"
                      : "bg-[var(--green-soft)] text-[var(--green-deep)] border-[var(--green)]/30"
                  }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSecondEye ? "Đã lưu (Mắt 2)" : isPartial ? "Đã xác nhận" : "Đã liên kết"}</span>
              </span>
            );
          }

          return (
            <button
              type="button"
              data-no-row-click
              onClick={() => linkPatient(r, false)}
              disabled={linkingId === r.matchedCsr.id}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-2xs inline-flex items-center gap-1.5 hover:shadow transition cursor-pointer disabled:opacity-50 ml-auto ${isSecondEye
                  ? "bg-[var(--violet)] hover:bg-[var(--violet-deep)] text-white"
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
          icon={Database}
          title="Đối chiếu"
          accent="dữ liệu HIS"
          description="Quét & đồng bộ tự động giữa danh sách tầm soát CSR và hệ thống HIS bệnh viện."
        />
        <div className="card p-10 text-center max-w-2xl mx-auto space-y-4 my-8 bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[var(--amber-soft)] text-[var(--amber-deep)] flex items-center justify-center mx-auto border border-[var(--amber)]/30 shadow-sm">
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
    /* Khung trang đứng yên cố định chiều cao, chỉ phần bảng dữ liệu cuộn dọc */
    <div className="h-full flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
      {/* Header chung siêu tinh gọn: Tiêu đề + Tabs + Bộ điều khiển trong 1 khối duy nhất */}
      <PageHeader
        icon={Database}
        title="Đối chiếu"
        accent="dữ liệu HIS"
        badge={
          <span className="inline-flex items-center gap-1 text-[var(--teal-deep)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)]" />
            HIS sẵn sàng
          </span>
        }
        description="Theo dõi ca mổ & đối chiếu bệnh nhân tầm soát CSR với máy chủ HIS"
        actions={
          <div data-tour="his-tabs" role="tablist" className="inline-flex p-1 bg-[var(--surface-soft)] rounded-lg border border-[var(--line)]">
            {([
              ["today", "Mổ trong ngày"],
              ["batch", "Quét theo đợt khám"],
              ["reverse", "Đối chiếu theo tháng"],
            ] as const).map(([k, nhan]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`px-3 py-1 rounded-md text-[12px] font-semibold transition-all cursor-pointer ${tab === k
                    ? "bg-white text-[var(--navy)] shadow-2xs font-bold"
                    : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
              >
                {nhan}
              </button>
            ))}
          </div>
        }
      >
        {/* Bộ điều khiển tương ứng với Tab đang chọn */}
        {tab === "today" && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-[var(--surface-soft)] rounded-lg border border-[var(--line)] p-0.5">
                <button
                  type="button"
                  title="Ngày trước"
                  onClick={() => shiftDailyDate(-1)}
                  className="p-1 text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--surface)] rounded transition-colors cursor-pointer"
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
                  className="p-1 text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--surface)] rounded transition-colors cursor-pointer"
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
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${dailyDate === todayStr ? "bg-[var(--surface)] text-[var(--navy)] shadow-2xs font-extrabold" : "text-[var(--mute)] hover:text-[var(--ink)]"
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
              <Info aria-hidden="true" className="w-3.5 h-3.5 text-[var(--mute)]" />
              <span>Chỉ truy vấn khi bấm nút · Lưu vĩnh viễn vào CSR để báo cáo</span>
            </div>
          </div>
        )}

        {tab === "batch" && (
          <div data-tour="his-select" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
            <div className="w-full sm:w-[320px]">
              <Dropdown
                value={selectedBuoiId}
                onChange={setSelectedBuoiId}
                options={bkOptions}
                labels={bkLabels}
                placeholder="Chọn đợt khám…"
                mono={false}
                size="sm"
              />
            </div>
            <div className="w-full sm:w-[170px]">
              <Dropdown
                value={batchMonth}
                onChange={setBatchMonth}
                options={monthOptions.options}
                labels={monthOptions.labels}
                placeholder="Chọn tháng…"
                mono={false}
                size="sm"
              />
            </div>
            <button
              type="button"
              data-tour="his-run"
              onClick={runBatchCheck}
              disabled={batchLoading || !selectedBuoiId}
              className="btn btn-primary h-8 px-4 rounded-lg font-bold text-xs shrink-0 inline-flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {batchLoading ? <RefreshCw aria-hidden="true" className="w-3.5 h-3.5 animate-spin text-teal-300" /> : <Search aria-hidden="true" className="w-3.5 h-3.5 text-teal-300" />}
              <span>{batchLoading ? "Đang quét HIS…" : "Quét đối chiếu"}</span>
            </button>
          </div>
        )}

        {tab === "reverse" && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <div className="w-full sm:w-[220px]">
                <Dropdown
                  value={revMonth}
                  onChange={setRevMonth}
                  options={monthOptions.options}
                  labels={monthOptions.labels}
                  placeholder="Chọn tháng phẫu thuật..."
                  mono={false}
                  size="sm"
                />
              </div>

              <button
                onClick={runReverseCheck}
                disabled={revLoading}
                className="btn btn-primary h-8 px-4 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {revLoading ? <RefreshCw aria-hidden="true" className="w-3.5 h-3.5 animate-spin text-teal-300" /> : <Download aria-hidden="true" className="w-3.5 h-3.5 text-teal-300" />}
                <span>{revLoading ? "Đang tải danh sách HIS…" : "Tải danh sách mổ HIS"}</span>
              </button>
            </div>

            {revList.some((r) => {
              if (!r.matchedCsr) return false;
              const isSecondEye = Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
              const isLinkedToThisHis = Boolean(
                r.matchedCsr.maBNHIS && (
                  r.matchedCsr.maBNHIS === r.maHIS ||
                  r.matchedCsr.maBNHIS.replace(/\./g, "") === r.maHIS?.replace(/\./g, "")
                )
              );
              const isLinked = r.matchedCsr.daMo || (isLinkedToThisHis && r.matchedCsr.trangThaiDieuTri === "Đã mổ");
              return !isLinked && !isSecondEye;
            }) && (
              <button
                onClick={linkAllMatched}
                disabled={revLoading}
                className="btn btn-success h-8 px-4 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Cập nhật toàn bộ ({revList.filter((r) => {
                  if (!r.matchedCsr) return false;
                  const isSecondEye = Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
                  const isLinkedToThisHis = Boolean(
                    r.matchedCsr.maBNHIS && (
                      r.matchedCsr.maBNHIS === r.maHIS ||
                      r.matchedCsr.maBNHIS.replace(/\./g, "") === r.maHIS?.replace(/\./g, "")
                    )
                  );
                  const isLinked = r.matchedCsr.daMo || (isLinkedToThisHis && r.matchedCsr.trangThaiDieuTri === "Đã mổ");
                  return !isLinked && !isSecondEye;
                }).length})</span>
              </button>
            )}
          </div>
        )}
      </PageHeader>

      {/* TAB 0: THEO DÕI MỔ TRONG NGÀY (HÔM NAY / CHỌN NGÀY) */}
      {tab === "today" && (
        <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">

          {/* Stat Cards tinh gọn (Compact Strip) */}
          {hasScannedDaily && dailySummary && (
            <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2">
              <CompactStatCard
                label="Tổng ca mổ ở HIS"
                value={dailySummary.totalHIS.toLocaleString("vi-VN")}
                sub={`Ngày ${fmtDate(dailyDate)}${dailyCounts.choMo ? ` · +${dailyCounts.choMo} chờ mổ` : ""}`}
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
            <div className="lg:flex-1 lg:min-h-0 flex flex-col card p-0 overflow-hidden bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-2xs">
              {/* Header Lọc & Tìm kiếm & Đồng bộ tất cả */}
              <div className="shrink-0 p-2 border-b border-[var(--line)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-[var(--surface-soft)]/60">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDailyFilterStatus("all")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${dailyFilterStatus === "all" ? "bg-[var(--navy)] text-white shadow-2xs" : "bg-[var(--surface)] text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] border border-[var(--line)]"
                      }`}
                  >
                    Tất cả ({dailyCounts.all})
                  </button>
                  {dailyCounts.pending > 0 && (
                    <button
                      type="button"
                      onClick={() => setDailyFilterStatus("pending")}
                      title="Ca khuyết CCCD (chỉ khớp Họ tên + Năm sinh) cần xác nhận thủ công"
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${dailyFilterStatus === "pending"
                          ? "bg-[var(--amber)] text-white shadow-2xs"
                          : "bg-[var(--amber-soft)] text-[var(--amber-deep)] hover:bg-[var(--amber)]/15 border border-[var(--amber)]/40"
                        }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-[var(--amber-deep)]" />
                      <span>Chờ xác nhận</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-black ${dailyFilterStatus === "pending" ? "bg-white/25 text-white" : "bg-[var(--amber)]/25 text-[var(--amber-deep)]"}`}>
                        {dailyCounts.pending}
                      </span>
                    </button>
                  )}
                  {dailyCounts.unlinked > 0 && (
                    <button
                      type="button"
                      onClick={() => setDailyFilterStatus("unlinked")}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${dailyFilterStatus === "unlinked" ? "bg-[var(--navy)] text-white shadow-2xs" : "bg-[var(--surface)] text-[var(--navy)] hover:bg-[var(--navy-soft)] border border-[var(--navy-200)]"
                        }`}
                    >
                      <Zap aria-hidden="true" className="w-3.5 h-3.5" />
                      <span>Cần cập nhật CSR</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-black ${dailyFilterStatus === "unlinked" ? "bg-white/25 text-white" : "bg-[var(--navy)]/10 text-[var(--navy)]"}`}>
                        {dailyCounts.unlinked}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDailyFilterStatus("linked")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${dailyFilterStatus === "linked" ? "bg-[var(--green)] text-white shadow-2xs" : "bg-[var(--surface)] text-[var(--green-deep)] hover:bg-[var(--green-soft)] border border-[var(--green)]/30"
                      }`}
                  >
                    Đã lưu CSR ({dailyCounts.linked})
                  </button>
                  {dailyCounts.mat2 > 0 && (
                    <button
                      type="button"
                      onClick={() => setDailyFilterStatus("mat2")}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${dailyFilterStatus === "mat2" ? "bg-[var(--violet-deep)] text-white shadow-2xs" : "bg-[var(--surface)] text-[var(--violet-deep)] hover:bg-[var(--violet-soft)] border border-[var(--violet)]/30"
                        }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Mắt 2</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-black ${dailyFilterStatus === "mat2" ? "bg-white/25 text-white" : "bg-[var(--violet)]/15 text-[var(--violet-deep)]"}`}>
                        {dailyCounts.mat2}
                      </span>
                    </button>
                  )}
                  {dailyCounts.nomatch > 0 && (
                    <button
                      type="button"
                      onClick={() => setDailyFilterStatus("nomatch")}
                      title="Ca mổ trên HIS không tìm thấy hồ sơ tầm soát CSR tương ứng"
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${dailyFilterStatus === "nomatch" ? "bg-[var(--ink-soft)] text-white shadow-2xs" : "bg-[var(--surface)] text-[var(--ink-soft)] hover:bg-[var(--surface-hover)] border border-[var(--line)]"
                        }`}
                    >
                      <span>Chưa khớp CSR</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-black ${dailyFilterStatus === "nomatch" ? "bg-white/25 text-white" : "bg-[var(--surface-hover)] text-[var(--ink-soft)]"}`}>
                        {dailyCounts.nomatch}
                      </span>
                    </button>
                  )}
                  {dailyCounts.choMo > 0 && (
                    <button
                      type="button"
                      onClick={() => setDailyFilterStatus("choMo")}
                      title="Đã nhập viện / có chỉ định phẫu thuật trong ngày, phòng mổ chưa ghi sổ"
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${dailyFilterStatus === "choMo" ? "bg-[var(--amber-deep)] text-white shadow-2xs" : "bg-[var(--surface)] text-[var(--amber-deep)] hover:bg-[var(--amber-soft)] border border-[var(--amber)]/40"
                        }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Chờ mổ</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono font-black ${dailyFilterStatus === "choMo" ? "bg-white/25 text-white" : "bg-[var(--amber-soft)] text-[var(--amber-deep)]"}`}>
                        {dailyCounts.choMo}
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
                    <input
                      type="text"
                      value={dailySearch}
                      onChange={(e) => setDailySearch(e.target.value)}
                      placeholder="Tìm tên, CCCD, Mã HIS..."
                      className="input-field pl-7 pr-2.5 h-8 text-xs w-full bg-[var(--surface)] rounded-lg border border-[var(--line-strong)]"
                    />
                  </div>

                  {dailyCounts.unlinked > 0 && (
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
                      <span>Đồng bộ {dailyCounts.unlinked} ca</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bảng dữ liệu TanStack */}
              <DataView<HisRow, unknown>
                fullHeight
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
            <HuongDanBatDau
              tieuDe="Chưa kiểm tra ca mổ trong ngày"
              moTa={<>Chọn ngày ở trên rồi bấm <b className="font-semibold text-[var(--ink)]">Kiểm tra mổ từ HIS</b> để tải các ca phẫu thuật thực tế và đối chiếu với hồ sơ CSR.</>}
              hanhDong={
                <button
                  type="button"
                  onClick={() => runDailyCheck(todayStr)}
                  disabled={dailyLoading}
                  className="btn btn-primary h-8 px-3 text-[12.5px] font-semibold disabled:opacity-50"
                >
                  <Search aria-hidden="true" className="w-3.5 h-3.5" />
                  Kiểm tra ca mổ hôm nay ({fmtDate(todayStr)})
                </button>
              }
            />
          )}
        </div>
      )}

      {/* TAB 1: QUÉT HÀNG LOẠT THEO ĐỢT KHÁM */}
      {tab === "batch" && (
        <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
          {/* Thống kê KPIs */}
          {batchSummary && (
            <div className={`shrink-0 grid grid-cols-2 gap-2 ${(batchSummary.surgeryPartial || 0) > 0 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
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
            <div className="flex-1 min-h-0 overflow-y-auto">
              <HuongDanBatDau
                tieuDe="Chưa quét đợt khám nào"
                moTa={<>Chọn đợt khám ở trên rồi bấm <b className="font-semibold text-[var(--ink)]">Quét đối chiếu</b>. Hệ thống đối chiếu từng bệnh nhân Nhóm A/B theo thứ tự:</>}
                buoc={[
                  { t: "Tìm bệnh nhân trên HIS", d: "Theo CCCD, rồi mã thẻ BHYT (10 số cuối), cuối cùng Họ tên + Năm sinh" },
                  { t: "Gán mã bệnh nhân HIS", d: "Lưu mã hồ sơ bệnh viện vào hồ sơ tầm soát" },
                  { t: "Đọc sổ phòng mổ", d: "Ca mổ sau ngày khám, ca chờ mổ, ca đã mổ trước — khớp CCCD/BHYT tự ghi nhận, khớp tên cần xác nhận" },
                ]}
              />
            </div>
          )}

          {/* Bộ lọc nhanh Tab 1 */}
          {hasScannedBatch && batchResults.length > 0 && (
            <div className="shrink-0 card p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
                  { k: "found", label: `Khớp HIS (${batchResults.filter((r) => r.found && !r.hasSurgery && !r.isChoMo).length})`, on: "bg-[var(--teal-deep)] text-white" },
                  { k: "chomo", label: `Chờ mổ (${batchResults.filter((r) => r.found && !r.hasSurgery && r.isChoMo).length})`, on: "bg-[var(--amber-deep)] text-white" },
                  { k: "surgery", label: `✅ Đã mổ (${batchResults.filter((r) => r.hasSurgery && (r.matchType === "exact" || r.confirmed)).length})`, on: "bg-[var(--gold)] text-white" },
                  { k: "pending", label: `⚠ Chờ xác nhận (${batchResults.filter((r) => r.hasSurgery && r.matchType === "partial" && !r.confirmed).length})`, on: "bg-[var(--amber)] text-white" },
                  { k: "not_found", label: `Chưa thấy (${batchResults.filter((r) => !r.found).length})`, on: "bg-[var(--ink-soft)] text-white" },
                ] as const).map((f) => (
                  <button key={f.k} onClick={() => setBatchFilterStatus(f.k)}
                    className={`px-3 py-1.5 rounded-[var(--r-sm)] text-[12px] font-bold transition whitespace-nowrap ${batchFilterStatus === f.k ? `${f.on} shadow-[var(--shadow-sm)]` : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bảng kết quả Tab 1 */}
          {hasScannedBatch && (
            <div className="card p-0 overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="shrink-0 px-5 py-3.5 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface-soft)] flex-wrap gap-2">
                <span className="font-bold text-[14px] text-[var(--ink)] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--teal-deep)]" />
                  Danh sách Bệnh nhân ({filteredBatchResults.length} / {batchResults.length} BN)
                </span>
                <span className="text-[11.5px] text-[var(--teal-deep)] font-semibold bg-[var(--teal-soft)] px-3 py-1 rounded-[4px] border border-[var(--teal)]/25">
                  ⚡ Tự động cập nhật hồ sơ khi quét
                </span>
              </div>

              <DataView
                fullHeight
                columns={batchColumns}
                data={filteredBatchResults}
                isLoading={batchLoading && batchResults.length === 0}
                pageSize={50}
              >
                <div className="flex flex-col flex-1 min-h-0">
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
                </div>
              </DataView>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ĐỐI CHIẾU THEO THÁNG */}
      {tab === "reverse" && (
        <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
          {/* Thống kê KPIs */}
          {revSummary && (
            <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
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
            <div className="flex-1 min-h-0 overflow-y-auto">
              <HuongDanBatDau
                tieuDe="Chưa tải danh sách mổ của tháng"
                moTa={<>Chọn tháng phẫu thuật ở trên rồi bấm <b className="font-semibold text-[var(--ink)]">Tải danh sách mổ HIS</b>. Hệ thống lấy toàn bộ ca mổ trong tháng rồi tìm hồ sơ tầm soát tương ứng:</>}
                buoc={[
                  { t: "Lấy ca mổ trong tháng", d: "Toàn bộ ca có trong sổ phòng mổ, kèm dịch vụ, mắt mổ, phòng mổ" },
                  { t: "Tìm hồ sơ tầm soát", d: "Khớp CCCD / mã BHYT trước, Họ tên + Năm sinh sau" },
                  { t: "Ghi nhận vào CSR", d: "Ca khớp chắc chắn đồng bộ được ngay; ca khớp tên cần xác nhận từng ca" },
                ]}
              />
            </div>
          )}

          {/* Bộ lọc nhanh Tab 2 */}
          {hasScannedRev && revList.length > 0 && (
            <div className="shrink-0 card p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
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
                    placeholder="Tất cả các ngày trong tháng"
                    mono={false}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 bg-[var(--surface-soft)] p-1 rounded-[var(--r-md)] border border-[var(--line)] shrink-0 overflow-x-auto">
                {([
                  { k: "all", label: `Tất cả (${revList.filter((r) => r.matchedCsr).length})`, on: "bg-[var(--navy)] text-white", icon: null },
                  { k: "pending", icon: AlertTriangle, label: `Chờ xác nhận (${revList.filter((r) => (r.matchedCsr?.matchType === "partial" || r.matchedCsr?.isKhuyetCccd) && !r.matchedCsr?.confirmed).length})`, on: "bg-[var(--amber)] text-white" },
                  { k: "unlinked", icon: Zap, label: `Cần cập nhật (${revList.filter((r) => r.matchedCsr && !r.matchedCsr.daMo && !(r.matchedCsr.maBNHIS && r.matchedCsr.trangThaiDieuTri === "Đã mổ") && r.matchedCsr.matchType === "exact" && !(r.isMat2 || (r.lanMo && r.lanMo >= 2))).length})`, on: "bg-[var(--navy)] text-white" },
                  { k: "linked", icon: null, label: `Đã liên kết (${revList.filter((r) => r.matchedCsr && (r.matchedCsr.daMo || r.matchedCsr.confirmed || (r.matchedCsr.maBNHIS && r.matchedCsr.trangThaiDieuTri === "Đã mổ"))).length})`, on: "bg-[var(--gold)] text-white" },
                  { k: "mat2", icon: Eye, label: `Mắt 2 (${revList.filter((r) => r.isMat2 || (r.lanMo && r.lanMo >= 2)).length})`, on: "bg-[var(--violet-deep)] text-white" },
                ] as const).filter((f) => f.k === "all" || !f.label.includes("(0)")).map((f) => (
                  <button key={f.k} onClick={() => setRevFilterStatus(f.k)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-sm)] text-[12px] font-bold transition-colors whitespace-nowrap cursor-pointer ${revFilterStatus === f.k ? `${f.on} shadow-[var(--shadow-sm)]` : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}>
                    {f.icon && <f.icon aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />}
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bảng kết quả Tab 2 */}
          {hasScannedRev && (
            <div className="card p-0 overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="shrink-0 px-5 py-3.5 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface-soft)] flex-wrap gap-2">
                <span className="font-bold text-[14px] text-[var(--ink)] flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[var(--navy)]" />
                  Danh sách phẫu thuật trên HIS ({filteredRevList.length} / {revList.length} ca)
                </span>
                <span className="text-[11.5px] text-[var(--teal-deep)] font-semibold bg-[var(--teal-soft)] px-3 py-1 rounded-[4px] border border-[var(--teal)]/25">
                  <Lightbulb aria-hidden="true" className="inline w-3.5 h-3.5 -mt-0.5 mr-1" />
                  Ưu tiên hiển thị các ca khớp tầm soát
                </span>
              </div>

              <DataView
                fullHeight
                columns={revColumns}
                data={sortedRevList}
                isLoading={revLoading && revList.length === 0}
                pageSize={50}
              >
                <div className="flex flex-col flex-1 min-h-0">
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
                </div>
              </DataView>
            </div>
          )}
        </div>
      )}
      <HisCsrCompareModal
        row={compareRow}
        loading={Boolean(compareRow && linkingId === compareRow.matchedCsr?.id)}
        onClose={() => setCompareRow(null)}
        onConfirm={async () => {
          if (!compareRow) return;
          await linkDailyPatient(compareRow, true);
          setCompareRow(null);
        }}
      />
    </div>
  );
}

/** Trạng thái chưa quét: panel gọn kiểu bảng (tiêu đề · hướng dẫn · các bước), căn trái theo lưới trang. */
function HuongDanBatDau({
  tieuDe,
  moTa,
  buoc,
  hanhDong,
}: {
  tieuDe: string;
  moTa: React.ReactNode;
  buoc?: { t: string; d: string }[];
  hanhDong?: React.ReactNode;
}) {
  return (
    <section className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-[var(--ink)]">{tieuDe}</h3>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--ink-soft)] max-w-3xl">{moTa}</p>
        </div>
        {hanhDong && <div className="shrink-0">{hanhDong}</div>}
      </div>
      {buoc && buoc.length > 0 && (
        <ol className="border-t border-[var(--line)] px-4 sm:px-5 py-2">
          {buoc.map((b, i) => (
            <li key={b.t} className="grid grid-cols-[20px_minmax(0,1fr)] sm:grid-cols-[20px_200px_minmax(0,1fr)] items-baseline gap-x-2 gap-y-0.5 py-1.5">
              <span className="text-[12.5px] font-semibold text-[var(--mute)] tabular-nums">{i + 1}.</span>
              <span className="text-[13px] font-semibold text-[var(--ink)]">{b.t}</span>
              <span className="col-start-2 sm:col-start-auto text-[12.5px] text-[var(--ink-soft)]">{b.d}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
