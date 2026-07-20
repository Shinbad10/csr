"use client";

import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { useToast } from "@/components/providers/ToastProvider";
import {
  Activity, RefreshCw, CheckCircle2, Search,
  Calendar, Users, ShieldCheck, Database, Check,
  Play, Download, UserCheck, Stethoscope, Sparkles,
  CalendarDays, X, AlertTriangle, ShieldQuestion, ArrowRight
} from "lucide-react";
import { fmtDate, fmtBuoiKhamName } from "@/lib/csr";
import { Dropdown } from "@/components/csr/fields";
import { SkeletonTable } from "@/components/layout/Skeleton";

interface BuoiKham {
  id: string;
  ngayKham: string;
  xa: string;
  diaDiem: string;
  _count?: { hoSo: number };
}

// Thẻ KPI theo design system company (accent bar + icon chip theo tone)
function StatCard({ label, value, sub, icon: Icon, tone }: {
  label: string; value: React.ReactNode; sub: React.ReactNode; icon: any; tone: "navy" | "teal" | "gold" | "amber";
}) {
  const tones = {
    navy: { bar: "bg-[var(--navy)]", chip: "bg-[var(--navy-50)] text-[var(--navy)]", val: "text-[var(--ink)]" },
    teal: { bar: "bg-[var(--teal)]", chip: "bg-[var(--teal-soft)] text-[var(--teal-deep)]", val: "text-[var(--teal-deep)]" },
    gold: { bar: "bg-[var(--gold)]", chip: "bg-[var(--gold-soft)] text-[var(--gold-deep)]", val: "text-[var(--gold-deep)]" },
    amber: { bar: "bg-[var(--amber)]", chip: "bg-[var(--amber-soft)] text-[var(--amber-deep)]", val: "text-[var(--amber-deep)]" },
  }[tone];
  return (
    <div className="card p-5 relative overflow-hidden group hover:shadow-[var(--shadow-lg)] transition-shadow">
      <div className={`absolute top-0 left-0 right-0 h-1 ${tones.bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-[var(--mute)] uppercase tracking-[0.12em]">{label}</div>
          <div className={`text-[28px] leading-none font-extrabold font-mono mt-2 flex items-baseline gap-2 ${tones.val}`}>{value}</div>
          <div className="text-[11.5px] text-[var(--mute)] mt-1.5 flex items-center gap-1">{sub}</div>
        </div>
        <div className={`w-12 h-12 rounded-[var(--r-md)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${tones.chip}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function DoiChieuHisPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState<"batch" | "reverse">("batch");

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
  const [revFilterStatus, setRevFilterStatus] = useState<"all" | "matched" | "unmatched" | "linked">("all");

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
        const dStr = r.ngayMo.slice(0, 10);
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
        body: JSON.stringify({ month: revMonth || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: data.error || "Lỗi tải danh sách HIS" });
        return;
      }
      setRevList(data.surgeries || []);
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
      const res = await fetch("/api/his/link-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoSoId: item.matchedCsr.id, maHIS: item.maHIS, maMo: item.maMo, ngayMo: item.ngayMo }),
      });
      if (res.ok) {
        addToast({ type: "success", message: `Đã liên kết ${item.matchedCsr.hoTen} với mã HIS ${item.maHIS}` });
        // update local revList
        setRevList((prev) =>
          prev.map((r) =>
            r.matchedCsr?.id === item.matchedCsr.id
              ? { ...r, matchedCsr: { ...r.matchedCsr, maBNHIS: item.maHIS } }
              : r
          )
        );
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
    const unlinked = revList.filter((r) => r.matchedCsr && !r.matchedCsr.maBNHIS);
    if (unlinked.length === 0) {
      addToast({ type: "info", message: "Tất cả các BN khớp đều đã được liên kết mã HIS!" });
      return;
    }
    if (!confirm(`Bạn có chắc muốn tự động liên kết mã HIS cho ${unlinked.length} bệnh nhân khớp không?`)) return;

    setRevLoading(true);
    let successCount = 0;
    for (const item of unlinked) {
      try {
        const res = await fetch("/api/his/link-patient", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hoSoId: item.matchedCsr.id, maHIS: item.maHIS, maMo: item.maMo, ngayMo: item.ngayMo }),
        });
        if (res.ok) {
          successCount++;
          setRevList((prev) =>
            prev.map((r) =>
              r.matchedCsr?.id === item.matchedCsr.id
                ? { ...r, matchedCsr: { ...r.matchedCsr, maBNHIS: item.maHIS } }
                : r
            )
          );
        }
      } catch {
        // ignore single failure in batch
      }
    }
    setRevLoading(false);
    addToast({ type: "success", message: `Đã tự động liên kết thành công ${successCount}/${unlinked.length} bệnh nhân!` });
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
        const matchCsr = r.matchedCsr?.hoTen?.toLowerCase().includes(q) || r.matchedCsr?.maBN?.toLowerCase().includes(q);
        if (!matchName && !matchHIS && !matchSDT && !matchCsr) return false;
      }
      if (revFilterDate) {
        const dateStr = r.ngayMo ? r.ngayMo.slice(0, 10) : "";
        if (dateStr !== revFilterDate) return false;
      }
      if (revFilterStatus === "matched") return !!r.matchedCsr;
      if (revFilterStatus === "unmatched") return !r.matchedCsr;
      if (revFilterStatus === "linked") return !!(r.matchedCsr && r.matchedCsr.maBNHIS);
      return true;
    });
  }, [revList, revSearch, revFilterDate, revFilterStatus]);

  return (
    <div className="space-y-5 pb-16">
      <PageHeader
        title="Đối chiếu máy chủ HIS"
        description="Quét & đồng bộ tự động giữa danh sách tầm soát CSR và hệ thống HIS bệnh viện với tốc độ cao."
        actions={
          <div className="flex items-center gap-2.5 bg-[var(--teal-soft)] border border-[var(--teal)]/25 px-3.5 py-2 rounded-[var(--r-md)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--teal)] animate-pulse" />
            <div className="leading-tight">
              <div className="text-[12px] font-bold text-[var(--teal-deep)]">HIS SQL Server</div>
              <div className="text-[10.5px] text-[var(--teal-deep)]/80 font-medium">Sẵn sàng · Kết nối trực tiếp</div>
            </div>
          </div>
        }
      />

      {/* Tabs */}
      <div data-tour="his-tabs" className="flex items-center">
        <div className="bg-[var(--surface-soft)] p-1.5 rounded-[var(--r-lg)] inline-flex gap-1.5 border border-[var(--line)] max-w-full overflow-x-auto">
          <button
            onClick={() => setTab("batch")}
            className={`px-4 sm:px-5 py-2.5 rounded-[var(--r-md)] text-[13px] font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              tab === "batch" ? "bg-[var(--navy)] text-white shadow-[var(--shadow-sm)]" : "text-[var(--ink-soft)] hover:bg-white"
            }`}
          >
            <Activity className={`w-4 h-4 ${tab === "batch" ? "text-[var(--teal)]" : "text-[var(--mute)]"}`} />
            <span>Quét theo Đợt khám</span>
          </button>
          <button
            onClick={() => setTab("reverse")}
            className={`px-4 sm:px-5 py-2.5 rounded-[var(--r-md)] text-[13px] font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              tab === "reverse" ? "bg-[var(--navy)] text-white shadow-[var(--shadow-sm)]" : "text-[var(--ink-soft)] hover:bg-white"
            }`}
          >
            <Database className={`w-4 h-4 ${tab === "reverse" ? "text-[var(--teal)]" : "text-[var(--mute)]"}`} />
            <span>Đối chiếu ngược từ HIS</span>
          </button>
        </div>
      </div>

      {/* TAB 1: QUÉT HÀNG LOẠT THEO ĐỢT KHÁM */}
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
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${(batchSummary.surgeryPartial || 0) > 0 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
              <StatCard tone="navy" icon={Users} label="Tổng BN tầm soát" value={batchSummary.total} sub="Danh sách trong đợt khám" />
              <StatCard tone="teal" icon={ShieldCheck} label="Khớp mã HIS thành công"
                value={<>{batchSummary.found}<span className="text-[13px] font-semibold font-sans">({batchSummary.total ? Math.round((batchSummary.found / batchSummary.total) * 100) : 0}%)</span></>}
                sub={<><CheckCircle2 className="w-3.5 h-3.5 text-[var(--teal-deep)]" /> Tìm thấy hồ sơ bệnh viện</>} />
              <StatCard tone="gold" icon={Stethoscope} label="Đã mổ (xác nhận)"
                value={<>{batchSummary.surgeryExact || 0}{batchSummary.found > 0 && <span className="text-[13px] font-semibold font-sans">({Math.round(((batchSummary.surgeryExact || 0) / batchSummary.found) * 100)}%)</span>}</>}
                sub={<><ShieldCheck className="w-3.5 h-3.5 text-[var(--gold-deep)]" /> Khớp CCCD → tự động xác nhận</>} />
              {(batchSummary.surgeryPartial || 0) > 0 && (
                <StatCard tone="amber" icon={AlertTriangle} label="Chờ xác nhận"
                  value={<>{batchSummary.surgeryPartial}<span className="text-[13px] font-semibold font-sans">(cần duyệt)</span></>}
                  sub={<><AlertTriangle className="w-3.5 h-3.5 text-[var(--amber)]" /> Chỉ khớp Tên + Tuổi, chưa CCCD</>} />
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
                    { n: 1, chip: "bg-[var(--navy)] text-white", t: "So khớp Hành chính", tbl: "QLyCapThe", d: "Đối chiếu Họ tên · Năm sinh · SĐT trên bảng" },
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
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface-soft)] flex-wrap gap-2">
                <span className="font-bold text-[14px] text-[var(--ink)] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--teal-deep)]" />
                  Danh sách Bệnh nhân ({filteredBatchResults.length} / {batchResults.length} BN)
                </span>
                <span className="text-[11.5px] text-[var(--teal-deep)] font-semibold bg-[var(--teal-soft)] px-3 py-1 rounded-full border border-[var(--teal)]/25">
                  ⚡ Tự động cập nhật hồ sơ khi quét
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left border-collapse">
                  <thead className="bg-[var(--surface-soft)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mute)]">
                    <tr>
                      <th className="py-3 px-4 border-b border-[var(--line)]">Họ và tên / Mã BN</th>
                      <th className="py-3 px-4 border-b border-[var(--line)]">Mã HIS</th>
                      <th className="py-3 px-4 border-b border-[var(--line)]">Mức khớp</th>
                      <th className="py-3 px-4 border-b border-[var(--line)]">Trạng thái HIS</th>
                      <th className="py-3 px-4 border-b border-[var(--line)]">Chi tiết / Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] text-[var(--ink-soft)] divide-y divide-[var(--line-soft)] bg-white">
                    {batchLoading && batchResults.length === 0 ? (
                      <SkeletonTable rows={6} cols={5} />
                    ) : filteredBatchResults.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-14 text-center text-[var(--mute)] font-medium">
                          {batchResults.length === 0 ? "Không tìm thấy bệnh nhân nào trong đợt khám này." : "Không có bệnh nhân nào khớp với bộ lọc đang chọn."}
                        </td>
                      </tr>
                    ) : (
                      filteredBatchResults.map((r, i) => (
                        <tr key={i} className={`transition-colors border-b border-[var(--line-soft)] group ${
                          r.hasSurgery && r.matchType === "partial" && !r.confirmed
                            ? "bg-[var(--amber-soft)]/60 hover:bg-[var(--amber-soft)]"
                            : "hover:bg-[var(--surface-soft)]"
                        }`}>
                          <td className="py-3.5 px-4 align-middle">
                            <div className="font-bold text-[var(--ink)] group-hover:text-[var(--navy)] text-[14px]">{r.hoTen}</div>
                            <div className="font-mono text-[11.5px] font-bold text-[var(--navy)] mt-0.5"><span className="text-[var(--mute-soft)] font-normal">BN-</span>{(r.maBN || "").replace(/^BN-?/i, "") || "—"}</div>
                          </td>
                          <td className="py-3.5 px-4 align-middle font-mono font-bold text-[var(--navy)] text-xs">
                            {r.maHIS ? (
                              <span className="px-2.5 py-1 rounded-md bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)] font-mono">
                                {r.maHIS}
                              </span>
                            ) : (
                              <span className="text-[var(--mute-soft)] font-normal">—</span>
                            )}
                          </td>
                          {/* Cột mức khớp */}
                          <td className="py-3.5 px-4 align-middle">
                            {r.found ? (
                              r.matchType === "exact" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[var(--teal-soft)] text-[var(--teal-deep)] border border-[var(--teal)]/30">
                                  <ShieldCheck className="w-3 h-3" /> CCCD khớp
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[var(--amber-soft)] text-[var(--amber-deep)] border border-[var(--amber)]/30">
                                  <AlertTriangle className="w-3 h-3" /> Tên + Tuổi
                                </span>
                              )
                            ) : (
                              <span className="text-[var(--mute-soft)] text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 align-middle">
                            {r.found ? (
                              r.hasSurgery ? (
                                r.matchType === "exact" || r.confirmed ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--gold-soft)] text-[var(--gold-deep)] border border-[var(--gold-line)]">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã mổ / Điều trị
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--amber-soft)] text-[var(--amber-deep)] border border-[var(--amber)]/30">
                                    <ShieldQuestion className="w-3.5 h-3.5" /> Chờ xác nhận
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--teal-soft)] text-[var(--teal-deep)] border border-[var(--teal)]/30">
                                  <Check className="w-3.5 h-3.5" /> Có hồ sơ HIS
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--surface-hover)] text-[var(--mute)] border border-[var(--line)]">
                                Chưa thấy trên HIS
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 align-middle text-xs text-[var(--ink-soft)] max-w-md">
                            {r.hasSurgery && r.matchType === "partial" && !r.confirmed ? (
                              <div className="flex flex-col gap-2">
                                <div className="text-[11px] text-[var(--amber-deep)] font-medium leading-relaxed">
                                  ⚠ Chỉ khớp Họ tên + Năm sinh, chưa xác minh CCCD. Cần xác nhận thủ công.
                                </div>
                                <button
                                  onClick={() => confirmPartialMatch(r)}
                                  disabled={confirmingId === r.id}
                                  className="px-3 py-1.5 bg-[var(--amber)] hover:bg-[var(--amber-deep)] text-white text-[11px] font-bold rounded-[var(--r-sm)] shadow-[var(--shadow-sm)] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 self-start cursor-pointer"
                                >
                                  {confirmingId === r.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                  Xác nhận đã mổ
                                </button>
                              </div>
                            ) : (
                              <span>{r.chiTiet || r.error || "—"}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-[var(--surface-soft)] border-t border-[var(--line)] px-5 py-3 flex items-center justify-between text-xs text-[var(--mute)] font-medium">
                <div>
                  Hiển thị <span className="font-mono font-bold text-[var(--ink)]">{filteredBatchResults.length > 0 ? 1 : 0}–{filteredBatchResults.length}</span> trong tổng số <span className="font-mono font-bold text-[var(--ink)]">{batchResults.length}</span> bệnh nhân
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <button disabled className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--line)] bg-white text-[var(--mute)] disabled:opacity-40">&lt;</button>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--navy)] text-white font-bold text-xs">1</button>
                  <button disabled className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--line)] bg-white text-[var(--mute)] disabled:opacity-40">&gt;</button>
                </div>
              </div>
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

          {/* Thống kê KPIs Tab 2 */}
          {revSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard tone="navy" icon={Database} label="Tổng ca mổ trên HIS" value={revSummary.totalHIS} sub="Danh sách phẫu thuật tháng" />
              <StatCard tone="teal" icon={UserCheck} label="Khớp BN tầm soát CSR"
                value={<>{revSummary.matchedCSR}<span className="text-[13px] font-semibold font-sans">({revSummary.totalHIS ? Math.round((revSummary.matchedCSR / revSummary.totalHIS) * 100) : 0}%)</span></>}
                sub={<><UserCheck className="w-3.5 h-3.5 text-[var(--teal-deep)]" /> Bệnh nhân đã đi tầm soát</>} />
              <StatCard tone="gold" icon={CheckCircle2} label="Đã liên kết vào CSR" value={revSummary.alreadyLinked}
                sub={<><CheckCircle2 className="w-3.5 h-3.5 text-[var(--gold-deep)]" /> Đã cập nhật mã hồ sơ HIS</>} />
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
                  { k: "unmatched", label: `Khách tự đến (${revList.filter((r) => !r.matchedCsr).length})`, on: "bg-[var(--ink-soft)] text-white" },
                  { k: "linked", label: `Đã liên kết (${revList.filter((r) => r.matchedCsr && r.matchedCsr.maBNHIS).length})`, on: "bg-[var(--gold)] text-white" },
                ] as const).map((f) => (
                  <button key={f.k} onClick={() => setRevFilterStatus(f.k)}
                    className={`px-3 py-1.5 rounded-[var(--r-sm)] text-[12px] font-bold transition-all whitespace-nowrap ${revFilterStatus === f.k ? `${f.on} shadow-[var(--shadow-sm)]` : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bảng kết quả Tab 2 */}
          {hasScannedRev && (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface-soft)] flex-wrap gap-2">
                <span className="font-bold text-[14px] text-[var(--ink)] flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[var(--navy)]" />
                  Danh sách phẫu thuật trên HIS ({filteredRevList.length} / {revList.length} ca)
                </span>
                <span className="text-[11.5px] text-[var(--teal-deep)] font-semibold bg-[var(--teal-soft)] px-3 py-1 rounded-full border border-[var(--teal)]/25">
                  💡 Ưu tiên hiển thị các ca khớp tầm soát
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left border-collapse">
                  <thead className="bg-[var(--surface-soft)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mute)]">
                    <tr>
                      <th className="py-3 px-4 border-b border-[var(--line)]">Mã HIS</th>
                      <th className="py-3 px-4 border-b border-[var(--line)]">BN trên HIS</th>
                      <th className="py-3 px-4 border-b border-[var(--line)]">Ngày mổ</th>
                      <th className="py-3 px-4 border-b border-[var(--line)]">Khoa / Chẩn đoán</th>
                      <th className="py-3 px-4 border-b border-[var(--line)]">Đối chiếu hệ thống tầm soát CSR</th>
                      <th className="py-3 px-4 border-b border-[var(--line)] text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] text-[var(--ink-soft)] divide-y divide-[var(--line-soft)] bg-white">
                    {revLoading && revList.length === 0 ? (
                      <SkeletonTable rows={6} cols={6} />
                    ) : filteredRevList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-14 text-center text-[var(--mute)] font-medium">
                          {revList.length === 0 ? "Không tìm thấy ca phẫu thuật nào trong tháng này trên HIS." : "Không có ca phẫu thuật nào khớp với bộ lọc ngày / từ khóa."}
                        </td>
                      </tr>
                    ) : (
                      filteredRevList
                        .sort((a, b) => (b.matchedCsr ? 1 : 0) - (a.matchedCsr ? 1 : 0))
                        .map((r, i) => (
                          <tr
                            key={i}
                            className={`transition-colors border-b border-[var(--line-soft)] group ${
                              r.matchedCsr
                                ? r.matchedCsr.matchType === "exact"
                                  ? "bg-[var(--teal-soft)]/40 hover:bg-[var(--teal-soft)]/70"
                                  : "bg-[var(--amber-soft)]/40 hover:bg-[var(--amber-soft)]/70"
                                : "hover:bg-[var(--surface-soft)]"
                            }`}
                          >
                            <td className="py-3.5 px-4 align-middle font-mono text-xs font-bold text-[var(--navy)]">
                              <span className="px-2.5 py-1 rounded-md bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)] font-mono">
                                {r.maHIS}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 align-middle">
                              <div className="text-[var(--ink)] font-bold group-hover:text-[var(--navy)] text-[14px]">{r.hoTen}</div>
                              <div className="text-xs text-[var(--mute-soft)] mt-0.5 font-mono">NS: {r.namSinh} | SĐT: {r.sdt || "—"}</div>
                            </td>
                            <td className="py-3.5 px-4 align-middle whitespace-nowrap font-mono text-xs font-semibold text-[var(--ink-soft)]">
                              {r.ngayMo ? fmtDate(r.ngayMo.slice(0, 10)) : "—"}
                            </td>
                            <td className="py-3.5 px-4 align-middle text-xs">
                              <div className="font-bold text-[var(--ink)]">Khoa: {r.khoaMo}</div>
                              <div className="text-[var(--mute)] max-w-xs truncate mt-0.5">{r.chanDoan || "—"}</div>
                            </td>
                            <td className="py-3.5 px-4 align-middle">
                              {r.matchedCsr ? (
                                <div className={`p-2.5 rounded-[var(--r-md)] border ${
                                  r.matchedCsr.matchType === "exact"
                                    ? "bg-[var(--teal-soft)] border-[var(--teal)]/40"
                                    : "bg-[var(--amber-soft)] border-[var(--amber)]/40"
                                }`}>
                                  <div className={`text-xs font-extrabold flex items-center gap-1.5 ${
                                    r.matchedCsr.matchType === "exact" ? "text-[var(--teal-deep)]" : "text-[var(--amber-deep)]"
                                  }`}>
                                    {r.matchedCsr.matchType === "exact" ? (
                                      <>
                                        <span className="w-2 h-2 rounded-full bg-[var(--teal)] animate-pulse" />
                                        <span>🎯 CCCD khớp: {r.matchedCsr.hoTen} (<span className="font-mono">{r.matchedCsr.maBN}</span>)</span>
                                      </>
                                    ) : (
                                      <>
                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[var(--amber)]" />
                                        <span>⚠ Tên+Tuổi: {r.matchedCsr.hoTen} (<span className="font-mono">{r.matchedCsr.maBN}</span>)</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="text-[11.5px] text-[var(--ink-soft)] mt-1 font-medium">
                                    Đợt: {r.matchedCsr.buoiKham?.xa} ({fmtDate(r.matchedCsr.buoiKham?.ngayKham)})
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs text-[var(--mute)] bg-[var(--surface-hover)] font-medium">
                                  ⚪ Khách tự đến BV / Khác
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap">
                              {r.matchedCsr ? (
                                r.matchedCsr.maBNHIS ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--surface-hover)] text-[var(--mute)] border border-[var(--line)]">
                                    ✔️ Đã liên kết
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => linkPatient(r)}
                                    disabled={linkingId === r.matchedCsr.id}
                                    className="btn btn-success px-4 py-2 text-xs font-bold rounded-[var(--r-md)] disabled:opacity-50 inline-flex items-center gap-1.5 ml-auto"
                                  >
                                    {linkingId === r.matchedCsr.id ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    )}
                                    Cập nhật ngay
                                  </button>
                                )
                              ) : (
                                <span className="text-xs text-[var(--mute-soft)] font-mono">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-[var(--surface-soft)] border-t border-[var(--line)] px-5 py-3 flex items-center justify-between text-xs text-[var(--mute)] font-medium">
                <div>
                  Hiển thị <span className="font-mono font-bold text-[var(--ink)]">{filteredRevList.length > 0 ? 1 : 0}–{filteredRevList.length}</span> trong tổng số <span className="font-mono font-bold text-[var(--ink)]">{revList.length}</span> ca phẫu thuật
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <button disabled className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--line)] bg-white text-[var(--mute)] disabled:opacity-40">&lt;</button>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--navy)] text-white font-bold text-xs">1</button>
                  <button disabled className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--line)] bg-white text-[var(--mute)] disabled:opacity-40">&gt;</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
