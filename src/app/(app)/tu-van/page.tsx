"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Loader2,
  Search,
  Check,
  Save,
  X,
  Stethoscope,
  Phone,
  MapPin,
  Users,
  Pencil,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  PhoneCall,
  Send,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useRealtimeEvent } from "@/lib/useRealtime";
import {
  ageOf,
  fmtDate,
  fmtTime,
  fmtBuoiKhamName,
  tomorrowISO,
  bhytLevel,
  statusOf,
  type HoSo,
} from "@/lib/csr";
import { StatusBadge, labelCls, Combobox, SectionHeader, Select, DateField } from "@/components/csr/fields";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";

type FilterKey = "" | "chuagoi" | "dagoi" | "nhomA" | "nhomB";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "", label: "Tất cả" },
  { key: "chuagoi", label: "Chưa gọi" },
  { key: "dagoi", label: "Đã gọi" },
  { key: "nhomA", label: "Đồng ý (A)" },
  { key: "nhomB", label: "Suy nghĩ (B)" },
];

/** Kiểm tra bệnh nhân đã được tư vấn sau khám hay chưa */
function isTuVanDone(p: HoSo): boolean {
  return !!p.nhom || !!p.ghiChuTuVan || (!!p.nhatKy && p.nhatKy.length > 0) || p.xacNhanDieuTri != null;
}

/** Tự động tách 2 ký tự giờ và phút cho ô nhập giờ đón 24h (HH:mm) */
function format24hTimeInput(val: string, prevVal: string): string {
  if (val.length < prevVal.length) {
    if (prevVal.endsWith(":") && !val.includes(":")) {
      return val.slice(0, 1);
    }
    return val;
  }

  const digits = val.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length === 1) return digits;
  if (digits.length === 2) {
    let hh = Number(digits);
    if (hh > 23) hh = 23;
    return `${String(hh).padStart(2, "0")}:`;
  }
  if (digits.length === 3) {
    let hh = Number(digits.slice(0, 2));
    if (hh > 23) hh = 23;
    let m1 = digits.slice(2, 3);
    if (Number(m1) > 5) m1 = "5";
    return `${String(hh).padStart(2, "0")}:${m1}`;
  }
  let hh = Number(digits.slice(0, 2));
  if (hh > 23) hh = 23;
  let mm = Number(digits.slice(2, 4));
  if (mm > 59) mm = 59;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Chuẩn hóa giờ 24h khi rời khỏi ô nhập (onBlur), tự động hoàn thành HH:mm */
function normalize24hOnBlur(val: string): string {
  if (!val || !val.trim()) return "";
  const cleaned = val.trim();
  const parts = cleaned.split(":");
  if (parts.length === 1) {
    const d = cleaned.replace(/\D/g, "");
    if (!d) return "";
    if (d.length === 1) return `0${d}:00`;
    if (d.length === 2) return `${d}:00`;
    if (d.length === 3) return `${d.slice(0, 2)}:0${d.slice(2)}`;
    if (d.length === 4) return `${d.slice(0, 2)}:${d.slice(2)}`;
  }
  let hh = parts[0].replace(/\D/g, "");
  let mm = parts[1].replace(/\D/g, "");
  if (!hh) return "";
  hh = String(Math.min(23, Number(hh))).padStart(2, "0");
  if (!mm) mm = "00";
  else if (mm.length === 1) mm = `0${mm}`; // 11:1 -> 11:01 (11 giờ 1 phút)
  else mm = String(Math.min(59, Number(mm.slice(0, 2)))).padStart(2, "0");
  return `${hh}:${mm}`;
}

const PHUONG_AN_TU_VAN = [
  {
    key: "A",
    label: "Đồng ý điều trị tại BV",
    sub: "Lên lịch mổ & xếp xe đón bệnh nhân",
    activeClass: "bg-emerald-50/90 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/30",
    badgeClass: "bg-emerald-600 text-white",
  },
  {
    key: "B",
    label: "Cần suy nghĩ thêm",
    sub: "Cần tư vấn thêm & hẹn liên hệ lại",
    activeClass: "bg-amber-50/90 border-amber-500 text-amber-950 ring-2 ring-amber-500/30",
    badgeClass: "bg-amber-600 text-white",
  },
  {
    key: "TheoDoi",
    label: "Theo dõi tại nhà",
    sub: "Chưa có chỉ định can thiệp tại viện",
    activeClass: "bg-sky-50/90 border-sky-500 text-sky-950 ring-2 ring-sky-500/30",
    badgeClass: "bg-sky-600 text-white",
  },
];

const EMPTY = { bhyt: "", soTienBao: "", nhom: "", ngayHen: "", diemDon: "", gioDon: "", ghiChuTuVan: "" };

function parseDiags(arrOrStr?: string | string[] | null, extra?: string | null): string[] {
  const result: string[] = [];
  if (arrOrStr) {
    try {
      const parsed = typeof arrOrStr === "string" ? JSON.parse(arrOrStr) : arrOrStr;
      if (Array.isArray(parsed)) {
        parsed.forEach((x) => x && result.push(String(x)));
      } else if (typeof parsed === "string" && parsed.trim() && parsed !== "[]" && parsed !== "null") {
        result.push(parsed.trim());
      }
    } catch {
      if (typeof arrOrStr === "string" && arrOrStr.trim() && arrOrStr !== "[]" && arrOrStr !== "null") {
        result.push(arrOrStr.trim());
      }
    }
  }
  if (extra && extra.trim() && !result.includes(extra.trim())) {
    result.push(extra.trim());
  }
  return result;
}

/** Trích xuất toàn bộ chẩn đoán bệnh lý mắt (Mắt phải, Mắt trái, Chung, ICD) */
function getPatientDiags(p: HoSo): string[] {
  const diags: string[] = [];

  // Mắt phải
  if (p.chanDoanMP) {
    try {
      const arr = typeof p.chanDoanMP === "string" ? JSON.parse(p.chanDoanMP) : p.chanDoanMP;
      if (Array.isArray(arr)) arr.forEach((item) => item && diags.push(`MP: ${item}`));
    } catch {
      diags.push(`MP: ${p.chanDoanMP}`);
    }
  }
  if (p.chanDoanKhacMP) diags.push(`MP: ${p.chanDoanKhacMP}`);

  // Mắt trái
  if (p.chanDoanMT) {
    try {
      const arr = typeof p.chanDoanMT === "string" ? JSON.parse(p.chanDoanMT) : p.chanDoanMT;
      if (Array.isArray(arr)) arr.forEach((item) => item && diags.push(`MT: ${item}`));
    } catch {
      diags.push(`MT: ${p.chanDoanMT}`);
    }
  }
  if (p.chanDoanKhacMT) diags.push(`MT: ${p.chanDoanKhacMT}`);

  // Chẩn đoán chung
  if (p.chanDoan && p.chanDoan !== "[]") {
    try {
      const arr = typeof p.chanDoan === "string" ? JSON.parse(p.chanDoan) : p.chanDoan;
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (item && !diags.some((d) => d.includes(item))) diags.push(item);
        });
      }
    } catch { }
  }
  if (p.chanDoanKhac && !diags.includes(p.chanDoanKhac)) diags.push(p.chanDoanKhac);

  // Loại bệnh lý ICD
  if (p.loaiBenhLy && p.loaiBenhLy !== "[]") {
    try {
      const arr = typeof p.loaiBenhLy === "string" ? JSON.parse(p.loaiBenhLy) : p.loaiBenhLy;
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (item && !diags.some((d) => d.includes(item))) diags.push(item);
        });
      }
    } catch { }
  }
  if (p.loaiBenhLyKhac && !diags.includes(p.loaiBenhLyKhac)) diags.push(p.loaiBenhLyKhac);

  return diags;
}

/** Kiểm tra xem bệnh nhân có chẩn đoán bệnh lý hay không */
function isBenhLyPatient(p: HoSo): boolean {
  // 1. Có chẩn đoán mắt phải / mắt trái / chung / ICD
  const diags = getPatientDiags(p);
  if (diags.length > 0) return true;

  // 2. Có phân loại bệnh lý khác Chưa phát hiện bất thường
  if (p.benhLy && p.benhLy !== "Chưa phát hiện bất thường" && p.benhLy !== "Bình thường") return true;

  // 3. Khuyến nghị hoặc Hướng xử trí là Phẫu thuật / Điều trị khác
  if (p.khuyenNghi === "Phẫu thuật" || p.huongXuTri === "Phẫu thuật" || p.huongXuTri === "Điều trị khác") return true;

  // 4. Có dữ liệu tư vấn / xác nhận điều trị từ trước
  if (p.nhom || p.xacNhanDieuTri != null) return true;

  return false;
}

/** Thứ tự ưu tiên sắp xếp theo loại tư vấn (Chưa gọi -> Đồng ý -> Suy nghĩ -> Theo dõi -> Đã tư vấn khác) */
function getPatientCategoryPriority(p: HoSo): number {
  const hasCall = !!(p.nhatKy && p.nhatKy.length > 0);
  if (!isTuVanDone(p) && !hasCall) return 1; // Chưa gọi & chưa tư vấn (Ưu tiên số 1)
  if (p.nhom === "A" || p.xacNhanDieuTri === true) return 2; // Đồng ý (A) lên trên Suy nghĩ
  if (p.nhom === "B" || p.xacNhanDieuTri === false) return 3; // Suy nghĩ (B)
  if (p.nhom === "TheoDoi") return 4; // Theo dõi
  return 5; // Đã tư vấn khác
}

export default function TuVanSessionPage() {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [patients, setPatients] = useState<HoSo[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"loai" | "stt">("loai");

  const [f, setF] = useState(EMPTY);
  const [baseline, setBaseline] = useState(() => JSON.stringify(EMPTY));
  const dirty = JSON.stringify(f) !== baseline;
  const [showList, setShowList] = useState(false);

  const [bks, setBks] = useState<any[]>([]);
  const [selBk, setSelBk] = useState<string>("");
  const [showBkModal, setShowBkModal] = useState(false);
  const [bkSearch, setBkSearch] = useState("");
  const bkLabels = useMemo(() => Object.fromEntries(bks.map((b) => [b.id, `${fmtDate(b.ngayKham)} · ${fmtBuoiKhamName(b)}`])), [bks]);

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

  const selected = useMemo(() => patients.find((p) => p.id === selId) || null, [patients, selId]);
  const uniqueDiemDon = useMemo(() => Array.from(new Set(patients.map((p) => p.diemDon).filter(Boolean))) as string[], [patients]);

  const [callNote, setCallNote] = useState("");
  const [savingCallNote, setSavingCallNote] = useState(false);

  const visible = useMemo(() => {
    const filtered = patients.filter((p) => {
      const called = !!(p.nhatKy && p.nhatKy.length > 0);
      const isA = p.nhom === "A" || p.xacNhanDieuTri === true;
      if (filter === "chuagoi" && called) return false;
      if (filter === "dagoi" && !called) return false;
      if (filter === "nhomA" && !isA) return false;
      if (filter === "nhomB" && isA) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "loai") {
        const prioA = getPatientCategoryPriority(a);
        const prioB = getPatientCategoryPriority(b);
        if (prioA !== prioB) return prioA - prioB;
      }
      return (a.stt ?? 0) - (b.stt ?? 0);
    });
  }, [patients, filter, sortBy]);

  // Bộ đếm nhanh trạng thái tư vấn & gọi điện
  const counts = useMemo(() => {
    const total = patients.length;
    const called = patients.filter((p) => !!(p.nhatKy && p.nhatKy.length > 0)).length;
    const uncalled = total - called;
    const nhomA = patients.filter((p) => p.nhom === "A" || p.xacNhanDieuTri === true).length;
    const nhomB = total - nhomA;
    return { total, called, uncalled, nhomA, nhomB };
  }, [patients]);

  const saveCallLog = async (presetText?: string) => {
    const textToSave = (presetText || callNote).trim();
    if (!selected || !textToSave) return;
    setSavingCallNote(true);
    try {
      const res = await fetch("/api/csr/nhatky", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoSoId: selected.id,
          noiDung: textToSave,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: data.error || "Lỗi lưu nhật ký gọi" });
        return;
      }
      setCallNote("");
      addToast({ type: "success", message: `Đã lưu nhật ký gọi cho ${selected.hoTen}` });
      await fetchPatients(selected.id, true);
    } catch {
      addToast({ type: "error", message: "Mất kết nối máy chủ" });
    } finally {
      setSavingCallNote(false);
    }
  };

  const curPatientIndex = visible.findIndex((p) => p.id === selId);
  const prevPatient = curPatientIndex > 0 ? visible[curPatientIndex - 1] : null;
  const nextPatient = curPatientIndex >= 0 && curPatientIndex < visible.length - 1 ? visible[curPatientIndex + 1] : null;

  const loadForm = useCallback((p: HoSo) => {
    const next = {
      bhyt: p.bhyt || "",
      soTienBao: p.soTienBao != null ? String(p.soTienBao) : "",
      nhom: p.nhom || (p.xacNhanDieuTri === true ? "A" : p.xacNhanDieuTri === false ? "B" : ""),
      ngayHen: p.ngayDieuTri ? new Date(p.ngayDieuTri).toISOString().slice(0, 10) : "",
      diemDon: p.diemDon || "",
      gioDon: p.gioDon || "",
      ghiChuTuVan: p.ghiChuTuVan || "",
    };
    setF(next);
    setBaseline(JSON.stringify(next));
  }, []);

  const fetchPatients = useCallback(
    async (keepSel?: string, forceForm = false) => {
      if (!selBk) {
        setPatients([]);
        return;
      }
      const res = await fetch(`/api/csr/hoso?buoiKhamId=${selBk}&search=${encodeURIComponent(search)}`);
      const all: HoSo[] = res.ok ? await res.json() : [];
      // Tải tất cả các bệnh nhân có chẩn đoán bệnh lý
      const data = all.filter(isBenhLyPatient);
      setPatients(data);
      // Ưu tiên: ID giữ nguyên -> Bệnh nhân chưa tư vấn đầu tiên -> Bệnh nhân đầu tiên
      const next =
        data.find((p) => p.id === (keepSel ?? selId)) ||
        data.find((p) => !isTuVanDone(p)) ||
        data[0] ||
        null;
      if (next) {
        if (forceForm || next.id !== selId) loadForm(next);
        setSelId(next.id);
      } else {
        setSelId(null);
      }
    },
    [search, selId, loadForm, selBk]
  );

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
          // Bắt buộc yêu cầu chọn đợt khám ngay khi vào trang
          setSelBk("");
          setShowBkModal(true);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selBk) {
      setLoading(true);
      fetchPatients().finally(() => setLoading(false));
    }
  }, [selBk]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!loading && selBk) {
        setSearching(true);
        fetchPatients(undefined, true).finally(() => setSearching(false));
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Cập nhật danh sách tư vấn thời gian thực (SSE)
  useRealtimeEvent(["hoso_change", "buoikham_change", "nhatky_change"], (evt) => {
    if (evt.type === "buoikham_change") {
      fetch("/api/csr/buoikham")
        .then((r) => r.json())
        .then((data) => {
          setBks(data);
        });
    }
    if (selBk && (evt.type === "hoso_change" || evt.type === "nhatky_change")) {
      fetchPatients(selId ?? undefined, false);
    }
  }, [selBk, selId, fetchPatients]);

  const pick = async (p: HoSo) => {
    if (p.id === selId) return;
    if (
      dirty &&
      !(await confirm({
        title: "Bỏ thay đổi chưa lưu?",
        message: `Phiếu tư vấn đang có thay đổi chưa lưu.\nChuyển sang ${p.hoTen} sẽ mất các thay đổi này.`,
        confirmLabel: "Chuyển & bỏ thay đổi",
        cancelLabel: "Ở lại",
      }))
    )
      return;
    setSelId(p.id);
    loadForm(p);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/csr/hoso/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bhyt: f.bhyt,
          soTienBao: f.soTienBao ? Number(f.soTienBao) : null,
          nhom: f.nhom || null,
          xacNhanDieuTri: f.nhom === "A" ? true : f.nhom === "B" ? false : null,
          ngayDieuTri: f.nhom === "A" ? (f.ngayHen || null) : null,
          diemDon: f.nhom === "A" ? (f.diemDon || null) : null,
          gioDon: f.nhom === "A" ? (f.gioDon || null) : null,
          ghiChuTuVan: f.ghiChuTuVan || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: d.error || "Lỗi lưu dữ liệu" });
        return;
      }
      setBaseline(JSON.stringify(f));
      addToast({ type: "success", message: `Đã lưu tư vấn: ${selected.hoTen}` });
      await fetchPatients(selected.id, true);

      // Tự động chuyển ca tiếp theo chưa tư vấn
      const nextPending = visible.find((p) => p.id !== selected.id && !p.nhom && p.xacNhanDieuTri == null);
      if (nextPending) {
        pick(nextPending);
      }
    } catch {
      addToast({ type: "error", message: "Mất kết nối máy chủ" });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !bks.length) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--navy)]" />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[var(--surface-bg)] overflow-hidden h-full">
      <PageHeader
        title="Tư vấn điều trị"
        description="Tư vấn phương án điều trị, chi phí và lịch đón bệnh viện cho các ca bệnh lý từ đợt khám."
        actions={
          <button
            data-tour="tv-bk"
            onClick={() => setShowBkModal(true)}
            className="btn btn-secondary px-3 py-1.5 text-[12px] sm:text-[12.5px] font-semibold min-h-[34px] rounded-lg border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 text-[var(--ink)] text-left shadow-2xs cursor-pointer"
          >
            <CalendarDays className="w-4 h-4 shrink-0 text-[var(--teal-deep)]" />
            <span className="truncate max-w-[200px] sm:max-w-none">
              {selBk ? bkLabels[selBk] : "Chọn đợt khám..."}
            </span>
          </button>
        }
      />

      {/* Modal Chọn Đợt Khám */}
      <Modal
        open={showBkModal}
        onClose={() => setShowBkModal(false)}
        title={<>Chọn <span className="italic font-normal text-[var(--teal)]">đợt khám</span></>}
        subtitle="Lấy danh sách bệnh nhân bệnh lý để tư vấn điều trị"
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
              className="w-full h-11 rounded-[var(--r-md)] border border-[var(--line)] bg-white pl-10 pr-4 text-[13.5px] font-medium text-[var(--ink)] outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)] placeholder:text-[var(--mute-soft)] transition-all shadow-xs"
            />
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
                className={`w-full text-left p-4 rounded-[var(--r-lg)] transition-all duration-200 flex items-center gap-4 border cursor-pointer ${active
                    ? "bg-white border-[var(--navy)] shadow-md ring-1 ring-[var(--navy)]"
                    : "bg-white border-[var(--line)] shadow-xs hover:border-[var(--line-strong)] hover:shadow-sm"
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-[var(--r-md)] flex items-center justify-center shrink-0 border transition-colors ${active
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
              <CalendarDays className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-[13px] font-medium">Không tìm thấy đợt khám phù hợp</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Main 2-Column Split View */}
      {!selBk ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[var(--surface-bg)] animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)] flex items-center justify-center shadow-xs mb-4">
            <CalendarDays className="w-8 h-8 text-[var(--teal-deep)]" />
          </div>
          <h3 className="font-serif font-bold text-[18px] text-[var(--ink)]">Chưa chọn đợt khám</h3>
          <p className="text-[13px] text-[var(--mute)] max-w-md mt-1.5 leading-relaxed">
            Vui lòng chọn một đợt khám tầm soát để tải danh sách bệnh nhân có chẩn đoán bệnh lý và tiến hành tư vấn điều trị.
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
        <div className="flex-1 min-h-0 flex flex-col xl:flex-row overflow-hidden relative">
          {/* Mobile Backdrop Overlay */}
          {showList && (
            <div
              onClick={() => setShowList(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 xl:hidden animate-fade-in"
            />
          )}

          {/* COL 1 — Patient Queue Sidebar */}
          <aside
            className={`w-full xl:w-[350px] shrink-0 border-r border-[var(--line)] bg-white flex flex-col min-h-0 h-full fixed xl:static inset-y-0 left-0 z-40 transition-transform duration-200 ${showList ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
              }`}
          >
            {/* Header */}
            <div className="p-3 border-b border-[var(--line)] flex items-center justify-between gap-2 shrink-0 bg-[var(--surface-soft)]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-[var(--navy-50)] text-[var(--navy)] flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 text-[var(--navy)]" />
                </div>
                <h3 className="font-bold text-[12px] uppercase tracking-wider text-[var(--ink)] truncate">
                  BỆNH NHÂN BỆNH LÝ ({counts.total})
                </h3>
              </div>
              <button
                onClick={() => setShowList(false)}
                className="p-1 rounded-md hover:bg-slate-200 text-[var(--mute)] xl:hidden cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Box */}
            <div className="px-3 pt-2.5 pb-2 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tên, mã, SĐT…"
                  className="w-full h-9 rounded-lg border border-[var(--line)] bg-[var(--surface-bg)] pl-9 pr-8 text-[13px] outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)]"
                />
                {searching ? (
                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--navy)]" />
                ) : search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Sort & Filter Bar */}
            <div className="px-3 pb-2.5 space-y-1.5">
              {/* Filter Tabs */}
              <div className="flex p-0.5 rounded-lg bg-[var(--surface-soft)] border border-[var(--line-soft)] text-[11px] gap-0.5 overflow-x-auto scrollbar-none">
                {FILTERS.map((ft) => {
                  const active = filter === ft.key;
                  const count =
                    ft.key === "chuagoi"
                      ? counts.uncalled
                      : ft.key === "dagoi"
                        ? counts.called
                        : ft.key === "nhomA"
                          ? counts.nhomA
                          : ft.key === "nhomB"
                            ? counts.nhomB
                            : counts.total;
                  return (
                    <button
                      key={ft.key}
                      type="button"
                      onClick={() => setFilter(ft.key)}
                      className={`flex-1 py-1 px-1.5 rounded-md font-semibold text-center transition-all cursor-pointer whitespace-nowrap ${active
                          ? "bg-white text-[var(--navy)] shadow-2xs font-bold"
                          : "text-[var(--mute)] hover:text-[var(--ink)]"
                        }`}
                    >
                      {ft.label} <span className="font-mono text-[10px] opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Sắp xếp Toggle */}
              <div className="flex items-center justify-between text-[11px] text-[var(--mute)] px-0.5 pt-0.5">
                <span className="font-semibold text-[11px] text-[var(--ink-soft)]">Sắp xếp:</span>
                <div className="flex items-center gap-0.5 bg-[var(--surface-soft)] p-0.5 rounded-md border border-[var(--line-soft)]">
                  <button
                    type="button"
                    onClick={() => setSortBy("loai")}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${sortBy === "loai"
                        ? "bg-white text-[var(--navy)] shadow-2xs font-bold"
                        : "text-[var(--mute)] hover:text-[var(--ink)]"
                      }`}
                  >
                    Theo loại
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("stt")}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${sortBy === "stt"
                        ? "bg-white text-[var(--navy)] shadow-2xs font-bold"
                        : "text-[var(--mute)] hover:text-[var(--ink)]"
                      }`}
                  >
                    Theo STT
                  </button>
                </div>
              </div>
            </div>

            {/* Patients List with Zebra Striping */}
            <div data-tour="tv-list" className="flex-1 overflow-y-auto px-2 pb-3 space-y-1.5">
              {patients.length === 0 ? (
                <div className="flex flex-col items-center text-center text-[var(--mute)] text-[12.5px] py-16 px-6 gap-2">
                  <Stethoscope className="w-8 h-8 text-[var(--mute-soft)]" />
                  <span>Không có bệnh nhân nào phát hiện bệnh lý trong đợt khám này.</span>
                </div>
              ) : visible.length === 0 ? (
                <div className="text-center text-[var(--mute)] text-[12.5px] py-14 px-6">
                  Không khớp bộ lọc.
                </div>
              ) : (
                visible.map((p, idx) => {
                  const active = selId === p.id;
                  const diags = getPatientDiags(p);
                  const sttPadded = String(p.stt ?? idx + 1).padStart(2, "0");
                  const age = ageOf(p);
                  const infoSub = [
                    p.gioiTinh || null,
                    age > 0 ? `${age}t` : null,
                    p.bhyt ? `BH ${bhytLevel(p.bhyt)}` : null,
                  ].filter(Boolean).join(" · ");

                  const hasCallLog = !!(p.nhatKy && p.nhatKy.length > 0);
                  const latestCallLog = hasCallLog ? p.nhatKy![0] : null;

                  let cardBgCls = "";
                  if (active) {
                    cardBgCls = "bg-indigo-50/75 border-2 border-[#002b7f] shadow-sm ring-2 ring-indigo-500/15";
                  } else if (hasCallLog) {
                    cardBgCls = "bg-emerald-50/25 border border-emerald-300/80 hover:border-emerald-500 hover:shadow-xs shadow-2xs";
                  } else {
                    cardBgCls = "bg-rose-50/15 border border-rose-200/90 hover:border-rose-400 hover:shadow-xs shadow-2xs";
                  }

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        pick(p);
                        if (window.innerWidth < 1280) setShowList(false);
                      }}
                      className={`w-full text-left rounded-xl px-3 py-2.5 transition-all duration-150 relative cursor-pointer space-y-1.5 ${cardBgCls}`}
                    >
                      {/* Dòng 1: STT nhỏ + Tên bệnh nhân + Badges trạng thái */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-[11px] font-extrabold text-[#031da6] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/90 shrink-0">
                            #{sttPadded}
                          </span>
                          <h4 className={`text-[14px] font-extrabold truncate leading-tight ${active ? "text-[#031da6]" : "text-slate-900"}`}>
                            {p.hoTen}
                          </h4>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-1 shrink-0">
                          {p.nhom === "A" || p.xacNhanDieuTri === true ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs">
                              Đồng ý
                            </span>
                          ) : p.nhom === "B" || p.xacNhanDieuTri === false ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                              Suy nghĩ
                            </span>
                          ) : p.nhom === "TheoDoi" ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-100 text-sky-950 border border-sky-300 shadow-2xs">
                              Theo dõi
                            </span>
                          ) : null}

                          {hasCallLog ? (
                            <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-2xs flex items-center gap-0.5">
                              ✓ Đã gọi
                            </span>
                          ) : (
                            <span className="text-[10.5px] font-extrabold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300 shadow-2xs flex items-center gap-0.5">
                              📞 Chưa gọi
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dòng 2: Tóm tắt thông tin: Giới tính · Tuổi · BHYT · Chẩn đoán bệnh lý */}
                      <div className="flex items-center gap-1.5 text-[12px] text-slate-600 font-semibold truncate">
                        {infoSub && <span className="shrink-0">{infoSub}</span>}
                        {diags.length > 0 && (
                          <span className="text-rose-700 font-extrabold truncate">
                            {infoSub ? "· " : ""}{diags.join(", ")}
                          </span>
                        )}
                      </div>

                      {/* Dòng 3 & 4: Ghi chú tư vấn & Nhật ký cuộc gọi gần nhất */}
                      {(p.ghiChuTuVan || (hasCallLog && latestCallLog?.noiDung)) ? (
                        <div className="pt-1.5 border-t border-slate-200/70 space-y-1">
                          {p.ghiChuTuVan && (
                            <div className="text-[12px] font-medium text-slate-800 flex items-center gap-1.5 truncate">
                              <span className="font-extrabold text-[#031da6] shrink-0 font-sans not-italic">Note TV:</span>
                              <span className="truncate italic text-slate-700" title={p.ghiChuTuVan}>{p.ghiChuTuVan}</span>
                            </div>
                          )}

                          {hasCallLog && latestCallLog?.noiDung ? (
                            <div className="text-[12px] font-semibold text-emerald-950 flex items-center gap-1.5 truncate">
                              <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-extrabold text-emerald-950 shrink-0 font-sans not-italic">Gọi:</span>
                              <span className="truncate text-slate-900" title={latestCallLog.noiDung}>{latestCallLog.noiDung}</span>
                              {latestCallLog.ngay && (
                                <span className="text-[10px] text-slate-400 shrink-0 font-mono ml-auto font-medium">({fmtDate(latestCallLog.ngay)})</span>
                              )}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-[11.5px] text-rose-700 italic flex items-center gap-1 pt-1 border-t border-slate-200/70 truncate">
                          <span className="font-bold text-rose-800 shrink-0 font-sans not-italic">Note:</span>
                          <span className="truncate font-sans not-italic font-medium">Chưa gọi điện</span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* COL 2 — Consultation Workspace */}
          <main className="flex-1 min-w-0 flex flex-col min-h-0 bg-[var(--surface-bg)] overflow-hidden">
            {selected ? (
              <>
                <div className="flex-1 overflow-y-auto">
                  {/* 1. UNIFIED CLINICAL & PATIENT MEDICAL HEADER CARD */}
                  <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shadow-xs space-y-3.5 shrink-0">
                    {/* Row 1: Patient Identity + Status Badge + Doctor Info */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="font-serif font-black text-[20px] sm:text-[22px] text-slate-900 tracking-tight">
                          {selected.hoTen}
                        </h2>
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 text-[13px] shadow-2xs">
                          {selected.maBN}
                        </span>
                        <span className="text-[13px] font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {selected.gioiTinh} · {ageOf(selected)} tuổi
                        </span>

                        {/* Note Đã tư vấn / Chưa tư vấn sau khám trên Thẻ tên chính */}
                        {isTuVanDone(selected) ? (
                          <span className="text-[12.5px] font-bold px-3 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-300 shadow-2xs flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-teal-600 stroke-[3]" />
                            <span>Đã tư vấn sau khám {selected.nhatKy?.length ? `(${selected.nhatKy.length} cuộc gọi)` : ""}</span>
                          </span>
                        ) : (
                          <span className="text-[12.5px] font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border border-rose-300 shadow-2xs flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                            <span>Chưa tư vấn sau khám</span>
                          </span>
                        )}

                        {selected.nhom === "A" || selected.xacNhanDieuTri === true ? (
                          <span className="text-[12.5px] font-extrabold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                            ✓ Đồng ý điều trị
                          </span>
                        ) : selected.nhom === "B" || selected.xacNhanDieuTri === false ? (
                          <span className="text-[12.5px] font-extrabold px-3 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                            ⏳ Cần suy nghĩ
                          </span>
                        ) : selected.nhom === "TheoDoi" ? (
                          <span className="text-[12.5px] font-extrabold px-3 py-1 rounded-lg bg-sky-100 text-sky-900 border border-sky-300 shadow-2xs">
                            👁️ Theo dõi tại nhà
                          </span>
                        ) : (
                          <span className="text-[12.5px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs">
                            Chưa chốt tư vấn
                          </span>
                        )}
                      </div>

                      {/* Bác sĩ khám & Khuyến nghị */}
                      <div className="flex items-center gap-3 text-[13px] flex-wrap">
                        {selected.bacSiChiDinh && (
                          <span className="text-slate-600 font-medium">
                            BS khám: <b className="text-indigo-900 font-bold bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-200">BS. {selected.bacSiChiDinh}</b>
                          </span>
                        )}
                        <span className="text-slate-600 font-medium">
                          Chỉ định: <b className="text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-bold">{selected.khuyenNghi || selected.huongXuTri || "Phẫu thuật"}</b>
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Medical Examination Snapshot (Thị lực + Chẩn đoán + Tiền sử) */}
                    <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center">
                      {/* Chẩn đoán & Thị lực 2 mắt */}
                      <div className="md:col-span-2 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11.5px] font-black uppercase tracking-wider text-slate-500">Chẩn đoán:</span>
                            {getPatientDiags(selected).length > 0 ? (
                              <span className="font-extrabold text-[14.5px] text-rose-700 bg-white px-2.5 py-0.5 rounded-lg border border-rose-200 shadow-2xs">
                                {getPatientDiags(selected).join(" · ")}
                              </span>
                            ) : (
                              <span className="text-[13.5px] text-slate-500 italic">Chưa phát hiện bệnh lý</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[13px] text-slate-700 font-semibold flex-wrap">
                            <span>Thị lực MP: <b className="font-mono font-bold text-indigo-900 bg-white px-2 py-0.5 rounded border border-slate-200">{selected.thiLucMP || "—"}</b></span>
                            <span>·</span>
                            <span>Thị lực MT: <b className="font-mono font-bold text-indigo-900 bg-white px-2 py-0.5 rounded border border-slate-200">{selected.thiLucMT || "—"}</b></span>
                            {selected.matKham && <span>· Mắt khám: <b className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{selected.matKham}</b></span>}
                          </div>
                        </div>
                      </div>

                      {/* Tiền sử & Thể trạng */}
                      <div className="text-[13px] text-slate-700 border-t md:border-t-0 md:border-l border-slate-200 md:pl-4 space-y-1">
                        <div>
                          <span className="text-slate-500 font-semibold">Tiền sử bệnh: </span>
                          <b className={selected.benhSu ? "text-amber-900 font-bold" : "text-slate-600 font-semibold"}>
                            {selected.benhSu ? (parseDiags(selected.loaiBenhSu, selected.loaiBenhSuKhac).join(", ") || "Có tiền sử bệnh") : "Không ghi nhận"}
                          </b>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold">Thể trạng: </span>
                          <span className="font-bold text-slate-800">{[selected.chieuCao ? `${selected.chieuCao} cm` : null, selected.canNang ? `${selected.canNang} kg` : null].filter(Boolean).join(" · ") || "—"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Patient Contact Strip */}
                    <div className="flex items-center gap-x-6 gap-y-2 flex-wrap text-[13.5px] text-slate-700 font-medium">
                      {selected.cccd && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-bold">CCCD:</span>
                          <span className="font-mono font-extrabold text-slate-900">{selected.cccd}</span>
                        </div>
                      )}
                      {selected.bhyt && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-bold">BHYT:</span>
                          <span className="font-mono font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{selected.bhyt} ({bhytLevel(selected.bhyt)})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-bold">SĐT:</span>
                        {selected.sdt ? (
                          <a href={`tel:${selected.sdt}`} className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 hover:underline inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-indigo-600" /> {selected.sdt}
                          </a>
                        ) : (
                          <span className="font-mono text-slate-400">—</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-500 font-bold">Địa chỉ:</span>
                        <span className="truncate text-slate-900 font-semibold">{selected.diaChi || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. CONSULTATION ACTION FORM (Asymmetric 2-column layout: wide decision form + balanced 520px call log) */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-4 items-start">
                    {/* CỘT TRÁI: PHƯƠNG ÁN & KẾ HOẠCH ĐIỀU TRỊ */}
                    <div className="card p-4 sm:p-5 shadow-xs border border-[var(--line)] space-y-4.5 bg-white h-full flex flex-col justify-between">
                      {/* Header & Quyết định */}
                      <div data-tour="tv-nhom">
                        <label className="text-[13.5px] sm:text-[14px] font-extrabold text-[#031da6] uppercase tracking-wider block mb-2.5">
                          Phương án / Quyết định của bệnh nhân *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {PHUONG_AN_TU_VAN.map((opt) => {
                            const active = f.nhom === opt.key;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => {
                                  setF((s) => ({
                                    ...s,
                                    nhom: opt.key,
                                    ngayHen: opt.key === "A" && !s.ngayHen ? tomorrowISO() : s.ngayHen,
                                  }));
                                }}
                                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${active
                                    ? `${opt.activeClass} shadow-sm ring-2 ring-indigo-500/20`
                                    : "bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-400 hover:shadow-2xs"
                                  }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-extrabold text-[14.5px]">{opt.label}</span>
                                  {active && (
                                    <span className={`w-5.5 h-5.5 rounded-full ${opt.badgeClass} flex items-center justify-center shrink-0 shadow-2xs`}>
                                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                    </span>
                                  )}
                                </div>
                                <span className={`text-[12px] mt-2 leading-snug ${active ? "opacity-95 font-semibold" : "text-slate-500 font-medium"}`}>
                                  {opt.sub}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Chi tiết kế hoạch đưa đón & viện phí (Chỉ mở khi Đồng ý điều trị tại BV) */}
                      {f.nhom === "A" ? (
                        <div className="pt-3 border-t border-slate-200 animate-fade-in" data-tour="tv-lich">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[12.5px] font-bold text-slate-800 uppercase tracking-wider mb-1 block">
                                Số tiền dự kiến (đồng)
                              </label>
                              <div className="relative">
                                <input
                                  inputMode="numeric"
                                  value={f.soTienBao ? new Intl.NumberFormat("vi-VN").format(Number(f.soTienBao)) : ""}
                                  onChange={(e) => setF((s) => ({ ...s, soTienBao: e.target.value.replace(/[^\d]/g, "") }))}
                                  className="w-full h-10 px-3 font-mono font-bold text-teal-800 bg-white border border-slate-300 rounded-lg text-[14px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs pr-12"
                                  placeholder="VD: 5.000.000"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-bold uppercase">
                                  VNĐ
                                </span>
                              </div>
                            </div>

                            <div>
                              <DateField
                                label="Ngày điều trị tại BV"
                                value={f.ngayHen}
                                onChange={(v) => setF((s) => ({ ...s, ngayHen: v }))}
                                min={tomorrowISO()}
                              />
                            </div>

                            <div>
                              <label className="text-[12.5px] font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Giờ đón (dự kiến)</span>
                              </label>
                              <div className="space-y-1.5">
                                <div className="relative">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={f.gioDon}
                                    onChange={(e) => {
                                      const next = format24hTimeInput(e.target.value, f.gioDon);
                                      setF((s) => ({ ...s, gioDon: next }));
                                    }}
                                    onBlur={() => {
                                      setF((s) => ({ ...s, gioDon: normalize24hOnBlur(s.gioDon) }));
                                    }}
                                    placeholder="06:30 (24h)"
                                    maxLength={5}
                                    className="w-full h-10 px-3 pl-9 font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-xl text-[14px] outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs transition-all"
                                  />
                                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {["06:00", "06:30", "07:00", "07:30", "08:00", "13:30", "14:00"].map((t) => {
                                    const active = f.gioDon === t;
                                    return (
                                      <button
                                        key={t}
                                        type="button"
                                        onClick={() => setF((s) => ({ ...s, gioDon: active ? "" : t }))}
                                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                          active
                                            ? "bg-[#031da6] text-white border-[#031da6] shadow-2xs font-extrabold"
                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                                        }`}
                                      >
                                        {t}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="text-[12.5px] font-bold text-slate-800 uppercase tracking-wider mb-1 block">
                                Điểm đón
                              </label>
                              <Combobox
                                value={f.diemDon}
                                onChange={(v) => setF((s) => ({ ...s, diemDon: v }))}
                                options={uniqueDiemDon}
                                placeholder="Chọn hoặc nhập điểm đón…"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-3 border-t border-slate-200 text-[12.5px] text-slate-700 font-medium flex items-center gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-dashed border-slate-300 animate-fade-in">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${f.nhom === "B" ? "bg-amber-500" : f.nhom === "TheoDoi" ? "bg-sky-500" : "bg-slate-400"}`} />
                          <span>
                            {f.nhom === "B"
                              ? "Bệnh nhân cần suy nghĩ thêm — Thông tin lịch đón và viện phí được tạm khóa. Vui lòng ghi lại lý do/hẹn gọi lại vào ô ghi chú bên dưới."
                              : f.nhom === "TheoDoi"
                                ? "Bệnh nhân theo dõi tại nhà — Không cần xếp lịch đưa đón tại viện. Vui lòng nhập dặn dò tái khám vào ô ghi chú bên dưới."
                                : "Vui lòng chọn quyết định điều trị của bệnh nhân."}
                          </span>
                        </div>
                      )}

                      {/* GHI CHÚ TƯ VẤN */}
                      <div className="pt-3 border-t border-slate-200">
                        <label className="text-[12.5px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 block">
                          Ghi chú tư vấn / Dặn dò bệnh nhân
                        </label>
                        <textarea
                          value={f.ghiChuTuVan}
                          onChange={(e) => setF((s) => ({ ...s, ghiChuTuVan: e.target.value }))}
                          placeholder="Nhập ghi chú tư vấn, nguyện vọng của bệnh nhân, dặn dò trước khi lên viện, số người nhà liên hệ..."
                          rows={2}
                          className="w-full p-3 rounded-lg border border-slate-300 text-[13.5px] font-medium bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* CỘT PHẢI: LỊCH SỬ GỌI ĐIỆN & NHẬT KÝ TƯ VẤN (RỘNG 520PX THOẢI MÁI) */}
                    <div className="card p-4 sm:p-5 shadow-xs border border-slate-200 space-y-4 bg-white h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#031da6] flex items-center justify-center shrink-0 border border-indigo-200 shadow-2xs">
                            <PhoneCall className="w-4.5 h-4.5 text-[#031da6]" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-[14px] text-slate-900 uppercase tracking-wider truncate">
                              Lịch sử gọi điện & Nhật ký tư vấn
                            </h3>
                            <p className="text-[12px] text-slate-500 font-medium truncate">
                              Ghi nhận các cuộc gọi chăm sóc bệnh nhân
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-[12px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-indigo-900 border border-slate-200 shrink-0">
                          {selected.nhatKy?.length || 0} cuộc gọi
                        </span>
                      </div>

                      {/* Layout dọc trong cột phải */}
                      <div className="flex flex-col gap-4 items-stretch flex-1">
                        {/* Ghi nhật ký cuộc gọi mới */}
                        <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                          <div className="space-y-2.5">
                            <label className="text-[12.5px] font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                              <Pencil className="w-4 h-4 text-teal-700" />
                              Ghi nhật ký cuộc gọi mới
                            </label>

                            {/* Mẫu gợi ý nhanh — Chọn 1 nút duy nhất, nhấn lại để tắt/xoá */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {[
                                "Đã gọi - Hẹn gọi lại",
                                "Đã gọi - Đồng ý mổ",
                                "Đã gọi - Cần suy nghĩ thêm",
                                "Thuê bao / Không nghe máy",
                                "Đã tư vấn qua người nhà",
                              ].map((tag) => {
                                const isSelected = callNote === tag;
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setCallNote(isSelected ? "" : tag)}
                                    className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shadow-2xs ${isSelected
                                        ? "bg-[#018a7f] text-white font-extrabold border-[#018a7f] shadow-xs"
                                        : "bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                                      }`}
                                  >
                                    {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="flex flex-col gap-2.5">
                              <textarea
                                value={callNote}
                                onChange={(e) => setCallNote(e.target.value)}
                                placeholder="Nhập nội dung cuộc gọi tư vấn với bệnh nhân hoặc người nhà..."
                                rows={2}
                                className="w-full p-3 rounded-lg border border-slate-300 text-[13.5px] font-medium bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 resize-none shadow-2xs min-h-[64px]"
                              />
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => saveCallLog()}
                                  disabled={savingCallNote || !callNote.trim()}
                                  className="btn px-4 py-2 text-[13px] font-extrabold shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shadow-sm bg-[#018a7f] hover:bg-[#016e65] text-white rounded-lg active:scale-95"
                                >
                                  {savingCallNote ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                  ) : (
                                    <Send className="w-4 h-4 text-white" />
                                  )}
                                  <span>Gửi ghi chú</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cột 2: Danh sách nhật ký cuộc gọi đã lưu */}
                        <div className="space-y-2.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex flex-col h-full min-h-[190px]">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-extrabold uppercase tracking-wider text-slate-600">
                              Lịch sử cuộc gọi ({selected.nhatKy?.length || 0})
                            </span>
                            {selected.nhatKy && selected.nhatKy.length > 0 && (
                              <span className="text-[11.5px] font-bold text-teal-900 bg-teal-100 px-2.5 py-0.5 rounded-md border border-teal-300">
                                Đã gọi {selected.nhatKy.length} lần
                              </span>
                            )}
                          </div>

                          {selected.nhatKy && selected.nhatKy.length > 0 ? (
                            <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1 flex-1">
                              {selected.nhatKy.map((log) => (
                                <div
                                  key={log.id}
                                  className="p-3 rounded-xl border border-slate-200 bg-white text-[13.5px] space-y-1 hover:border-indigo-300 transition-colors shadow-2xs"
                                >
                                  <div className="flex items-center justify-between text-[12px] text-slate-500">
                                    <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                                      <PhoneCall className="w-3.5 h-3.5 text-teal-700" />
                                      {log.nguoiGoi?.hoTen || "Tư vấn viên"}
                                    </span>
                                    <span className="font-mono font-bold">{fmtDate(log.ngay)} {fmtTime(log.ngay)}</span>
                                  </div>
                                  <p className="text-[13.5px] text-slate-900 font-semibold leading-relaxed whitespace-pre-wrap">
                                    {log.noiDung}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-300 rounded-xl bg-white text-[13px] text-slate-500 gap-1.5 font-medium">
                              <Phone className="w-6 h-6 text-slate-400" />
                              <span>Chưa có lịch sử cuộc gọi nào. Hãy chọn nút gợi ý hoặc nhập ghi chú cuộc gọi ở trên.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Unified Action Bar */}
                <div
                  data-tour="tv-save"
                  className="px-2 sm:px-4 py-1.5 sm:py-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.375rem)] border-t border-[var(--line)] bg-white/95 backdrop-blur-sm sticky bottom-0 z-30 flex items-center justify-between gap-1.5 sm:gap-2 shadow-lg shrink-0"
                >
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
                        {counts.total}
                      </span>
                    </button>

                    {/* Bộ phím chuyển ca Trước / Sau nhanh cho Mobile */}
                    <div className="xl:hidden flex items-center gap-0.5 border border-[var(--line)] rounded-lg p-0.5 bg-[var(--surface-soft)] shrink-0">
                      <button
                        type="button"
                        onClick={() => prevPatient && pick(prevPatient)}
                        disabled={!prevPatient}
                        className="p-1 rounded text-[var(--ink-soft)] hover:bg-white disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                        title="Ca trước"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <span className="text-[9.5px] sm:text-[10px] font-mono font-bold px-0.5 text-[var(--mute)]">
                        {curPatientIndex >= 0 ? `${curPatientIndex + 1}/${visible.length}` : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => nextPatient && pick(nextPatient)}
                        disabled={!nextPatient}
                        className="p-1 rounded text-[var(--ink-soft)] hover:bg-white disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                        title="Ca tiếp"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="hidden md:inline-flex text-[11px] sm:text-[12px] items-center gap-1 min-w-0 truncate">
                      {dirty ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--amber)] truncate">
                          <span className="w-2 h-2 rounded-full bg-[var(--amber)] animate-pulse shrink-0" /> Có thay đổi chưa lưu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold truncate">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Đã lưu vào hệ thống
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={save}
                      disabled={saving || !dirty || !f.nhom}
                      className="btn btn-primary px-4 sm:px-7 py-1.5 font-bold h-8 sm:h-9 text-[12px] sm:text-[13px] shrink-0 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[var(--teal)]" />}
                      <span>Lưu tư vấn</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                <div className="flex-1 flex flex-col items-center justify-center text-[var(--mute)] text-center px-6 py-12 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--navy-50)] text-[var(--navy)] flex items-center justify-center border border-[var(--navy-100)] shadow-2xs">
                    <Stethoscope className="w-7 h-7 text-[var(--teal-deep)]" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <div className="font-bold text-[15px] text-[var(--ink)]">
                      {counts.total > 0 ? "Chưa chọn bệnh nhân" : "Chưa có bệnh nhân bệnh lý"}
                    </div>
                    <div className="text-[12.5px] text-[var(--mute)] leading-relaxed">
                      {counts.total > 0
                        ? `Đợt khám có ${counts.total} bệnh nhân có chẩn đoán bệnh lý. Bấm nút bên dưới để mở danh sách chọn ca.`
                        : "Đợt khám này chưa có bệnh nhân nào được chẩn đoán bệnh lý."}
                    </div>
                  </div>
                  {counts.total > 0 ? (
                    <button
                      type="button"
                      onClick={() => setShowList(true)}
                      className="btn btn-primary px-5 py-2.5 font-bold rounded-xl shadow-md flex items-center gap-2 mt-2 cursor-pointer active:scale-95"
                    >
                      <Users className="w-4 h-4 text-[var(--teal)]" />
                      <span>Mở danh sách bệnh nhân ({counts.total})</span>
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
                      {counts.total}
                    </span>
                  </button>
                  <span className="text-[11.5px] text-[var(--mute)] font-medium">Chưa chọn ca</span>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
