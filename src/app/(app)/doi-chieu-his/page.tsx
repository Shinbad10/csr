"use client";

import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { useToast } from "@/components/providers/ToastProvider";
import {
  Activity, RefreshCw, CheckCircle2, AlertCircle, Search,
  Calendar, Users, ArrowRight, ShieldCheck, Database, Check,
  Play, Download, UserCheck, Stethoscope, ClipboardList, Sparkles,
  ChevronRight, CalendarDays, ArrowUpRight, Filter, X
} from "lucide-react";
import { fmtDate } from "@/lib/csr";
import { Dropdown, StatusBadge } from "@/components/csr/fields";

interface BuoiKham {
  id: string;
  ngayKham: string;
  xa: string;
  diaDiem: string;
  _count?: { hoSo: number };
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
  const [batchFilterStatus, setBatchFilterStatus] = useState<"all" | "found" | "surgery" | "not_found">("all");

  // Tab 2: Reverse Check state (Mặc định chọn tháng hiện tại)
  const [revMonth, setRevMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [revLoading, setRevLoading] = useState<boolean>(false);
  const [revList, setRevList] = useState<any[]>([]);
  const [revSummary, setRevSummary] = useState<any>(null);
  const [hasScannedRev, setHasScannedRev] = useState<boolean>(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);

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
      map[b.id] = `${fmtDate(b.ngayKham)} · Xã ${b.xa}${countStr}`;
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
      setRevList(data.list || []);
      setRevSummary(data.summary || null);
      addToast({
        type: "success",
        message: `Đã tải ${data.summary?.totalHIS || 0} ca mổ từ HIS. Khớp ${data.summary?.matchedCSR || 0} BN trong hệ thống tầm soát!`,
      });
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối máy chủ" });
    } finally {
      setRevLoading(false);
    }
  };

  // Link single Reverse match
  const linkPatient = async (item: any) => {
    if (!item.matchedCsr) return;
    setLinkingId(item.matchedCsr.id);
    try {
      const res = await fetch("/api/his/link-reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoSoId: item.matchedCsr.id,
          maHIS: item.maHIS,
          ngayMo: item.ngayMo,
          khoaMo: item.khoaMo,
          chanDoan: item.chanDoan,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast({ type: "success", message: `Đã cập nhật Mã HIS & trạng thái Đã mổ cho ${item.matchedCsr.hoTen}!` });
        setRevList((prev) =>
          prev.map((r) =>
            r.maHIS === item.maHIS && r.matchedCsr ? { ...r, matchedCsr: { ...r.matchedCsr, maBNHIS: item.maHIS, daDon: true } } : r
          )
        );
      } else {
        addToast({ type: "error", message: data.error || "Lỗi khi cập nhật" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối" });
    } finally {
      setLinkingId(null);
    }
  };

  // Link all unlinked reverse matches
  const linkAllMatched = async () => {
    const unlinked = revList.filter((r) => r.matchedCsr && !r.matchedCsr.maBNHIS);
    if (unlinked.length === 0) {
      addToast({ type: "info", message: "Tất cả bệnh nhân khớp đều đã được liên kết HIS từ trước." });
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn cập nhật trạng thái "Đã mổ" và gắn Mã HIS cho ${unlinked.length} bệnh nhân khớp?`)) return;

    setRevLoading(true);
    try {
      const items = unlinked.map((item) => ({
        hoSoId: item.matchedCsr.id,
        maHIS: item.maHIS,
        ngayMo: item.ngayMo,
        khoaMo: item.khoaMo,
        chanDoan: item.chanDoan,
      }));
      const res = await fetch("/api/his/link-reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast({ type: "success", message: `Đã cập nhật thành công cho ${data.count} bệnh nhân!` });
        runReverseCheck();
      } else {
        addToast({ type: "error", message: data.error || "Lỗi khi cập nhật hàng loạt" });
      }
    } catch {
      addToast({ type: "error", message: "Lỗi kết nối" });
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
      if (batchFilterStatus === "found") return r.found;
      if (batchFilterStatus === "surgery") return r.hasSurgery;
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
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Đối chiếu máy chủ HIS Bệnh viện"
        description="Quét đối chiếu hàng loạt theo đợt khám & Đối chiếu ngược từ danh sách phẫu thuật trên hệ thống HIS."
        guide={[
          { selector: '[data-tour="his-tabs"]', title: "Chọn cách đối chiếu", desc: "Tab \"Quét theo Đợt khám\" để đối chiếu hàng loạt; tab \"Đối chiếu ngược từ HIS\" để dò từ danh sách mổ của bệnh viện." },
          { selector: '[data-tour="his-select"]', title: "Chọn đợt khám & tháng", desc: "Chọn đợt khám tầm soát và tháng phẫu thuật trên HIS." },
          { selector: '[data-tour="his-run"]', title: "Quét đối chiếu", desc: "Bấm \"Quét đối chiếu ngay\" để hệ thống kết nối HIS và so khớp mã bệnh nhân." },
          { title: "Đọc kết quả", desc: "Sau khi quét, các thẻ thống kê Tổng BN / Khớp mã HIS / Đã phẫu thuật sẽ hiện ngay bên dưới." },
        ]}
        guideTip="Đối chiếu giúp xác nhận bệnh nhân tầm soát đã thực sự được phẫu thuật tại bệnh viện."
      />

      {/* Navigation Tabs chuẩn theo company UI */}
      <div data-tour="his-tabs" className="flex border-b border-[var(--line)] gap-6">
        <button
          onClick={() => setTab("batch")}
          className={`pb-3 font-semibold text-[14px] flex items-center gap-2 border-b-2 transition-all ${
            tab === "batch"
              ? "border-[var(--navy)] text-[var(--navy)]"
              : "border-transparent text-[var(--mute)] hover:text-[var(--ink)]"
          }`}
        >
          <Activity className="w-4 h-4" />
          Quét theo Đợt khám (Hàng loạt)
        </button>
        <button
          onClick={() => setTab("reverse")}
          className={`pb-3 font-semibold text-[14px] flex items-center gap-2 border-b-2 transition-all ${
            tab === "reverse"
              ? "border-[var(--navy)] text-[var(--navy)]"
              : "border-transparent text-[var(--mute)] hover:text-[var(--ink)]"
          }`}
        >
          <Database className="w-4 h-4" />
          Đối chiếu ngược từ HIS (Danh sách mổ)
        </button>
      </div>

      {/* TAB 1: QUÉT HÀNG LOẠT THEO ĐỢT KHÁM */}
      {tab === "batch" && (
        <div className="space-y-6">
          {/* Card lọc & chọn buổi khám */}
          <div data-tour="his-select" className="card p-5 bg-white flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 flex-1">
              <div className="flex-1 min-w-[280px]">
                <label className="block text-[12px] font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
                  Chọn Đợt khám / Buổi khám
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

              <div className="w-full sm:w-[260px]">
                <label className="block text-[12px] font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
                  Tháng phẫu thuật HIS
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
              className="btn btn-primary h-[38px] px-6 shrink-0 shadow-sm flex items-center gap-2"
            >
              {batchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              {batchLoading ? "Đang kết nối HIS..." : "Quét đối chiếu ngay"}
            </button>
          </div>

          {/* Thống kê KPIs */}
          {batchSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card p-4 bg-white flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--navy-50)] text-[var(--navy)] flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider">Tổng BN tầm soát</div>
                  <div className="text-2xl font-bold font-mono text-[var(--ink)] mt-0.5">{batchSummary.total}</div>
                </div>
              </div>

              <div className="card p-4 bg-white flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--teal-soft)] text-[var(--teal-deep)] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider">Khớp mã HIS</div>
                  <div className="text-2xl font-bold font-mono text-[var(--teal-deep)] mt-0.5">{batchSummary.found}</div>
                </div>
              </div>

              <div className="card p-4 bg-white flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider">Đã phẫu thuật / Điều trị</div>
                  <div className="text-2xl font-bold font-mono text-purple-700 mt-0.5">{batchSummary.surgery}</div>
                </div>
              </div>
            </div>
          )}

          {/* Trạng thái trống (Chưa quét) */}
          {!hasScannedBatch && (
            <div className="card p-12 bg-[var(--surface-soft)] border-dashed border-[var(--line-strong)] text-center max-w-2xl mx-auto my-8">
              <div className="w-16 h-16 rounded-2xl bg-white border border-[var(--line)] shadow-sm flex items-center justify-center mx-auto mb-4 text-[var(--navy)]">
                <Sparkles className="w-8 h-8 text-[var(--teal)]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[var(--ink)] mb-2">
                Sẵn sàng đối chiếu dữ liệu HIS tự động
              </h3>
              <p className="text-[14px] text-[var(--text-muted)] max-w-md mx-auto leading-relaxed mb-6">
                Chọn một buổi khám tầm soát ở trên và nhấn <strong className="text-[var(--ink)]">Quét đối chiếu ngay</strong>. Hệ thống sẽ tự động tìm kiếm mã HIS, lịch sử khám và thông tin phẫu thuật của từng bệnh nhân trên máy chủ bệnh viện.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--navy)] bg-[var(--navy-50)] px-3.5 py-2 rounded-full">
                💡 Cập nhật tự động mã BN HIS và trạng thái phẫu thuật vào hệ thống
              </div>
            </div>
          )}

          {/* Bộ lọc nhanh Tab 1 */}
          {hasScannedBatch && batchResults.length > 0 && (
            <div className="card p-3.5 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm border border-[var(--line)]">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
                <input
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                  placeholder="Tìm theo tên BN, mã BN, mã HIS..."
                  className="input-field pl-9 h-[36px] text-xs"
                />
                {batchSearch && (
                  <button onClick={() => setBatchSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--mute)] hover:text-[var(--ink)]">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 bg-[var(--surface-bg)] p-1 rounded-xl border border-[var(--line-soft)] shrink-0 overflow-x-auto">
                <button
                  onClick={() => setBatchFilterStatus("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    batchFilterStatus === "all" ? "bg-[var(--navy)] text-white shadow-sm" : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
                >
                  Tất cả ({batchResults.length})
                </button>
                <button
                  onClick={() => setBatchFilterStatus("found")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    batchFilterStatus === "found" ? "bg-[var(--teal)] text-white shadow-sm" : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
                >
                  Khớp HIS ({batchResults.filter((r) => r.found).length})
                </button>
                <button
                  onClick={() => setBatchFilterStatus("surgery")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    batchFilterStatus === "surgery" ? "bg-purple-600 text-white shadow-sm" : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
                >
                  Đã mổ/Điều trị ({batchResults.filter((r) => r.hasSurgery).length})
                </button>
                <button
                  onClick={() => setBatchFilterStatus("not_found")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    batchFilterStatus === "not_found" ? "bg-[var(--navy)] text-white shadow-sm" : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
                >
                  Chưa thấy ({batchResults.filter((r) => !r.found).length})
                </button>
              </div>
            </div>
          )}

          {/* Bảng kết quả Tab 1 */}
          {hasScannedBatch && (
            <div className="card p-0 overflow-hidden bg-white">
              <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface-soft)]">
                <span className="font-bold text-[14px] text-[var(--ink)] flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[var(--navy)]" />
                  Danh sách kết quả đối chiếu ({filteredBatchResults.length} / {batchResults.length} bệnh nhân)
                </span>
                {batchLoading && (
                  <span className="text-xs font-semibold text-[var(--navy)] flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang đồng bộ...
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[var(--surface-soft)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mute)]">
                    <tr>
                      <th className="py-3 px-3.5 border-b border-[var(--line)]">Họ và tên / Mã BN</th>
                      <th className="py-3 px-3.5 border-b border-[var(--line)]">Mã HIS</th>
                      <th className="py-3 px-3.5 border-b border-[var(--line)]">Trạng thái HIS</th>
                      <th className="py-3 px-3.5 border-b border-[var(--line)]">Chi tiết phẫu thuật / Điều trị</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] text-[var(--ink-soft)] divide-y divide-[var(--line-soft)] bg-white">
                    {filteredBatchResults.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-[var(--mute)]">
                          {batchResults.length === 0 ? "Không tìm thấy bệnh nhân nào trong đợt khám này." : "Không có bệnh nhân nào khớp với bộ lọc."}
                        </td>
                      </tr>
                    ) : (
                      filteredBatchResults.map((r, i) => (
                        <tr key={i} className="hover:bg-[var(--surface-soft)] transition-colors border-b border-[var(--line-soft)] group">
                          <td className="py-3.5 px-3.5 align-middle">
                            <div className="font-bold text-[var(--ink)] group-hover:text-[var(--navy)] text-[13px]">{r.hoTen}</div>
                            <div className="font-mono text-[11.5px] font-bold text-[var(--navy)] mt-0.5"><span className="text-[var(--mute-soft)] font-normal">BN-</span>{(r.maBN || "").replace(/^BN-?/i, "") || "—"}</div>
                          </td>
                          <td className="py-3.5 px-3.5 align-middle font-mono font-bold text-[var(--navy)] text-[11.5px]">
                            {r.maHIS || <span className="text-[var(--mute)] font-normal">—</span>}
                          </td>
                          <td className="py-3.5 px-3.5 align-middle">
                            {r.found ? (
                              r.hasSurgery ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-bold bg-[#f3eaf8] text-[#7c3aed] border border-[#7c3aed]/20">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã mổ / Điều trị
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-bold bg-[var(--teal-soft)] text-[var(--teal-deep)] border border-[var(--teal)]/20">
                                  <Check className="w-3.5 h-3.5" /> Có hồ sơ HIS
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-bold bg-[var(--line-soft)] text-[var(--mute)] border border-[var(--line)]">
                                Chưa thấy trên HIS
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3.5 align-middle text-xs text-[var(--ink-soft)] max-w-md">
                            {r.chiTiet || r.error || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-[var(--surface-soft)] border-t border-[var(--line)] px-4 py-3 flex items-center justify-between text-xs text-[var(--mute)] font-medium">
                <div>
                  Hiển thị <span className="font-mono font-bold text-[var(--ink)]">{filteredBatchResults.length > 0 ? 1 : 0}–{filteredBatchResults.length}</span> trong tổng số <span className="font-mono font-bold text-[var(--ink)]">{batchResults.length}</span> bệnh nhân
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <button disabled className="w-7 h-7 rounded flex items-center justify-center border border-[var(--line)] bg-white text-[var(--mute)] disabled:opacity-40">&lt;</button>
                  <button className="w-7 h-7 rounded flex items-center justify-center bg-[var(--navy)] text-white font-bold text-xs">1</button>
                  <button disabled className="w-7 h-7 rounded flex items-center justify-center border border-[var(--line)] bg-white text-[var(--mute)] disabled:opacity-40">&gt;</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ĐỐI CHIẾU NGƯỢC TỪ HIS */}
      {tab === "reverse" && (
        <div className="space-y-6">
          <div className="card p-5 bg-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="w-full sm:w-[260px]">
              <label className="block text-[12px] font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5">
                Tháng phẫu thuật trên HIS
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
                className="btn btn-primary h-[38px] px-5 shadow-sm flex items-center gap-2"
              >
                {revLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {revLoading ? "Đang tải HIS..." : "Tải danh sách mổ HIS & Tìm kiếm"}
              </button>

              {revList.some((r) => r.matchedCsr && !r.matchedCsr.maBNHIS) && (
                <button
                  onClick={linkAllMatched}
                  disabled={revLoading}
                  className="btn btn-success h-[38px] px-5 shadow-sm flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Cập nhật toàn bộ BN khớp ({revList.filter((r) => r.matchedCsr && !r.matchedCsr.maBNHIS).length})
                </button>
              )}
            </div>
          </div>

          {/* Thống kê KPIs */}
          {revSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card p-4 bg-white flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--navy-50)] text-[var(--navy)] flex items-center justify-center shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider">Tổng ca mổ trên HIS</div>
                  <div className="text-2xl font-bold font-mono text-[var(--ink)] mt-0.5">{revSummary.totalHIS}</div>
                </div>
              </div>

              <div className="card p-4 bg-white flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--teal-soft)] text-[var(--teal-deep)] flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider">Khớp BN tầm soát CSR</div>
                  <div className="text-2xl font-bold font-mono text-[var(--teal-deep)] mt-0.5">{revSummary.matchedCSR}</div>
                </div>
              </div>

              <div className="card p-4 bg-white flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider">Đã liên kết vào CSR</div>
                  <div className="text-2xl font-bold font-mono text-purple-700 mt-0.5">{revSummary.alreadyLinked}</div>
                </div>
              </div>
            </div>
          )}

          {/* Trạng thái trống */}
          {!hasScannedRev && (
            <div className="card p-12 bg-[var(--surface-soft)] border-dashed border-[var(--line-strong)] text-center max-w-2xl mx-auto my-8">
              <div className="w-16 h-16 rounded-2xl bg-white border border-[var(--line)] shadow-sm flex items-center justify-center mx-auto mb-4 text-[var(--navy)]">
                <Database className="w-8 h-8 text-[var(--navy)]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[var(--ink)] mb-2">
                Đối chiếu ngược từ danh sách phẫu thuật HIS
              </h3>
              <p className="text-[14px] text-[var(--text-muted)] max-w-md mx-auto leading-relaxed mb-6">
                Chọn tháng phẫu thuật ở trên và nhấn <strong className="text-[var(--ink)]">Tải danh sách mổ HIS & Tìm kiếm</strong>. Hệ thống sẽ kéo toàn bộ danh sách phẫu thuật từ HIS và tự động so khớp với các bệnh nhân đã đi tầm soát trong hệ thống CSR.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--teal-deep)] bg-[var(--teal-soft)] px-3.5 py-2 rounded-full">
                💡 Tự động tìm ra bệnh nhân mổ trên HIS để chốt danh sách hiệu quả
              </div>
            </div>
          )}

          {/* Bộ lọc nhanh Tab 2: Lọc theo ngày, từ khóa, trạng thái */}
          {hasScannedRev && revList.length > 0 && (
            <div className="card p-3.5 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm border border-[var(--line)]">
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                {/* Search box */}
                <div className="relative min-w-[220px] flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
                  <input
                    value={revSearch}
                    onChange={(e) => setRevSearch(e.target.value)}
                    placeholder="Tìm theo tên BN, mã HIS, SĐT..."
                    className="input-field pl-9 h-[36px] text-xs"
                  />
                  {revSearch && (
                    <button onClick={() => setRevSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--mute)] hover:text-[var(--ink)]">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Date filter (Lọc theo ngày mổ bằng Dropdown thông minh) */}
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

              {/* Status pills */}
              <div className="flex items-center gap-1.5 bg-[var(--surface-bg)] p-1 rounded-xl border border-[var(--line-soft)] shrink-0 overflow-x-auto">
                <button
                  onClick={() => setRevFilterStatus("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    revFilterStatus === "all" ? "bg-[var(--navy)] text-white shadow-sm" : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
                >
                  Tất cả ({revList.length})
                </button>
                <button
                  onClick={() => setRevFilterStatus("matched")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    revFilterStatus === "matched" ? "bg-[var(--teal)] text-white shadow-sm" : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
                >
                  🎯 Khớp BN ({revList.filter((r) => r.matchedCsr).length})
                </button>
                <button
                  onClick={() => setRevFilterStatus("unmatched")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    revFilterStatus === "unmatched" ? "bg-[var(--navy)] text-white shadow-sm" : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
                >
                  ⚪ Khách tự đến ({revList.filter((r) => !r.matchedCsr).length})
                </button>
                <button
                  onClick={() => setRevFilterStatus("linked")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    revFilterStatus === "linked" ? "bg-purple-600 text-white shadow-sm" : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
                >
                  ✔️ Đã liên kết ({revList.filter((r) => r.matchedCsr && r.matchedCsr.maBNHIS).length})
                </button>
              </div>
            </div>
          )}

          {/* Bảng kết quả ngược */}
          {hasScannedRev && (
            <div className="card p-0 overflow-hidden bg-white">
              <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface-soft)] flex-wrap gap-2">
                <span className="font-bold text-[14px] text-[var(--ink)] flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[var(--navy)]" />
                  Danh sách phẫu thuật trên HIS ({filteredRevList.length} / {revList.length} ca)
                </span>
                <span className="text-xs text-[var(--teal-deep)] font-medium bg-[var(--teal-soft)] px-2.5 py-1 rounded-full">
                  💡 Ưu tiên hiển thị các ca khớp với hệ thống tầm soát
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[var(--surface-soft)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mute)]">
                    <tr>
                      <th className="py-3 px-3.5 border-b border-[var(--line)]">Mã HIS</th>
                      <th className="py-3 px-3.5 border-b border-[var(--line)]">BN trên HIS</th>
                      <th className="py-3 px-3.5 border-b border-[var(--line)]">Ngày mổ</th>
                      <th className="py-3 px-3.5 border-b border-[var(--line)]">Khoa / Chẩn đoán</th>
                      <th className="py-3 px-3.5 border-b border-[var(--line)]">Đối chiếu với hệ thống tầm soát CSR</th>
                      <th className="py-3 px-3.5 border-b border-[var(--line)] text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] text-[var(--ink-soft)] divide-y divide-[var(--line-soft)] bg-white">
                    {filteredRevList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[var(--mute)]">
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
                              r.matchedCsr ? "bg-[var(--teal-soft)]/30 hover:bg-[var(--teal-soft)]/50" : "hover:bg-[var(--surface-soft)]"
                            }`}
                          >
                            <td className="py-3.5 px-3.5 align-middle font-mono text-[11.5px] font-bold text-[var(--navy)]">{r.maHIS}</td>
                            <td className="py-3.5 px-3.5 align-middle">
                              <div className="text-[var(--ink)] font-bold group-hover:text-[var(--navy)] text-[13px]">{r.hoTen}</div>
                              <div className="text-xs text-[var(--mute)] mt-0.5 font-mono">NS: {r.namSinh} | SĐT: {r.sdt || "—"}</div>
                            </td>
                            <td className="py-3.5 px-3.5 align-middle whitespace-nowrap font-mono text-xs">
                              {r.ngayMo ? fmtDate(r.ngayMo.slice(0, 10)) : "—"}
                            </td>
                            <td className="py-3.5 px-3.5 align-middle text-xs">
                              <div className="font-semibold text-[var(--ink)]">Khoa: {r.khoaMo}</div>
                              <div className="text-[var(--mute)] max-w-xs truncate mt-0.5">{r.chanDoan || "—"}</div>
                            </td>
                            <td className="py-3.5 px-3.5 align-middle">
                              {r.matchedCsr ? (
                                <div className="p-2 rounded-[var(--r-md)] bg-white border border-[var(--teal)]/40 shadow-[var(--shadow-sm)]">
                                  <div className="text-xs font-bold text-[var(--teal-deep)] flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[var(--teal)] animate-pulse" />
                                    🎯 Khớp BN: {r.matchedCsr.hoTen} (<span className="font-mono">{r.matchedCsr.maBN}</span>)
                                  </div>
                                  <div className="text-[11px] text-[var(--mute)] mt-0.5">
                                    Đợt: {r.matchedCsr.buoiKham?.xa} ({fmtDate(r.matchedCsr.buoiKham?.ngayKham)})
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-[var(--mute)] italic">⚪ Khách tự đến BV / Khác</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3.5 align-middle text-right whitespace-nowrap">
                              {r.matchedCsr ? (
                                r.matchedCsr.maBNHIS ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-xs font-bold bg-[var(--line-soft)] text-[var(--mute)] border border-[var(--line)]">
                                    ✔️ Đã liên kết
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => linkPatient(r)}
                                    disabled={linkingId === r.matchedCsr.id}
                                    className="btn btn-primary px-3 py-1.5 text-xs font-bold rounded-[var(--r-sm)] shadow-sm transition-all disabled:opacity-50 inline-flex items-center gap-1 ml-auto"
                                  >
                                    {linkingId === r.matchedCsr.id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-[var(--teal)]" />
                                    )}
                                    Cập nhật ngay
                                  </button>
                                )
                              ) : (
                                <span className="text-xs text-[var(--mute)] font-mono">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-[var(--surface-soft)] border-t border-[var(--line)] px-4 py-3 flex items-center justify-between text-xs text-[var(--mute)] font-medium">
                <div>
                  Hiển thị <span className="font-mono font-bold text-[var(--ink)]">{filteredRevList.length > 0 ? 1 : 0}–{filteredRevList.length}</span> trong tổng số <span className="font-mono font-bold text-[var(--ink)]">{revList.length}</span> ca phẫu thuật
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <button disabled className="w-7 h-7 rounded flex items-center justify-center border border-[var(--line)] bg-white text-[var(--mute)] disabled:opacity-40">&lt;</button>
                  <button className="w-7 h-7 rounded flex items-center justify-center bg-[var(--navy)] text-white font-bold text-xs">1</button>
                  <button disabled className="w-7 h-7 rounded flex items-center justify-center border border-[var(--line)] bg-white text-[var(--mute)] disabled:opacity-40">&gt;</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
