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

type FilterKey = "" | "chuatuvan" | "datuvan" | "nhomA" | "nhomB";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "", label: "Tất cả" },
  { key: "chuatuvan", label: "Chưa tư vấn" },
  { key: "datuvan", label: "Đã tư vấn" },
  { key: "nhomA", label: "Đồng ý (A)" },
  { key: "nhomB", label: "Suy nghĩ (B)" },
];

/** Kiểm tra bệnh nhân đã được tư vấn sau khám hay chưa */
function isTuVanDone(p: HoSo): boolean {
  return !!p.nhom || !!p.ghiChuTuVan || (!!p.nhatKy && p.nhatKy.length > 0) || p.xacNhanDieuTri != null;
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
    } catch {}
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
    } catch {}
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
    return patients.filter((p) => {
      const done = isTuVanDone(p);
      if (filter === "chuatuvan" && done) return false;
      if (filter === "datuvan" && !done) return false;
      if (filter === "nhomA" && p.nhom !== "A") return false;
      if (filter === "nhomB" && p.nhom !== "B") return false;
      return true;
    });
  }, [patients, filter]);

  // Bộ đếm nhanh trạng thái tư vấn
  const counts = useMemo(() => {
    const total = patients.length;
    const done = patients.filter(isTuVanDone).length;
    const pending = total - done;
    const nhomA = patients.filter((p) => p.nhom === "A").length;
    const nhomB = patients.filter((p) => p.nhom === "B").length;
    return { total, done, pending, nhomA, nhomB };
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
            className={`w-full xl:w-[350px] shrink-0 border-r border-[var(--line)] bg-white flex flex-col min-h-0 h-full fixed xl:static inset-y-0 left-0 z-40 transition-transform duration-200 ${
              showList ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
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

          {/* Filter Tabs */}
          <div className="px-3 pb-2.5">
            <div className="flex p-0.5 rounded-lg bg-[var(--surface-soft)] border border-[var(--line-soft)] text-[11px] gap-0.5 overflow-x-auto scrollbar-none">
              {FILTERS.map((ft) => {
                const active = filter === ft.key;
                const count =
                  ft.key === "chuatuvan"
                    ? counts.pending
                    : ft.key === "datuvan"
                    ? counts.done
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
                    className={`flex-1 py-1 px-1.5 rounded-md font-semibold text-center transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? "bg-white text-[var(--navy)] shadow-2xs font-bold"
                        : "text-[var(--mute)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {ft.label} <span className="font-mono text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
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
                const hasTv = isTuVanDone(p);

                // STT badge color
                let sttBadgeCls = "bg-slate-100 text-slate-700 border-slate-200";
                if (p.nhom === "A" || p.xacNhanDieuTri === true) {
                  sttBadgeCls = "bg-emerald-50 text-emerald-800 border-emerald-300";
                } else if (p.nhom === "B" || p.xacNhanDieuTri === false) {
                  sttBadgeCls = "bg-amber-50 text-amber-800 border-amber-300";
                } else if (p.nhom === "TheoDoi") {
                  sttBadgeCls = "bg-sky-50 text-sky-800 border-sky-300";
                } else if (hasTv) {
                  sttBadgeCls = "bg-teal-50 text-teal-800 border-teal-300";
                }

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      pick(p);
                      if (window.innerWidth < 1280) setShowList(false);
                    }}
                    className={`w-full text-left rounded-lg border px-2.5 py-2 transition-all duration-150 relative cursor-pointer ${
                      active
                        ? "border-[var(--navy)] bg-white shadow-xs border-l-[3.5px] border-l-[var(--navy)]"
                        : idx % 2 === 0
                        ? "bg-white border-[var(--line)] hover:border-[var(--navy-200)] hover:bg-slate-50"
                        : "bg-slate-50/80 border-[var(--line-soft)] hover:border-[var(--navy-200)] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {/* STT Box gọn gàng */}
                      <div
                        className={`w-8 h-8 rounded-lg font-mono flex flex-col items-center justify-center shrink-0 border ${sttBadgeCls} shadow-2xs`}
                      >
                        <span className="text-[7.5px] font-sans font-bold uppercase tracking-wider opacity-60 leading-none mb-0.5">STT</span>
                        <span className="text-[12px] font-black leading-none">{sttPadded}</span>
                      </div>

                      {/* Thông tin chính */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className={`text-[12.5px] font-bold truncate leading-tight ${active ? "text-[var(--navy)]" : "text-[var(--ink)]"}`}>
                            {p.hoTen}
                          </h4>

                          {/* Status Badge */}
                          {p.nhom === "A" || p.xacNhanDieuTri === true ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 shrink-0">
                              Đồng ý
                            </span>
                          ) : p.nhom === "B" || p.xacNhanDieuTri === false ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 shrink-0">
                              Suy nghĩ
                            </span>
                          ) : p.nhom === "TheoDoi" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-300 shrink-0">
                              Theo dõi
                            </span>
                          ) : hasTv ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-300 shrink-0">
                              Đã tư vấn
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
                              Chưa tư vấn
                            </span>
                          )}
                        </div>

                        {/* Dòng tóm tắt: Nhân khẩu + Chẩn đoán bệnh lý */}
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--mute)] mt-0.5 truncate">
                          {infoSub && <span>{infoSub}</span>}
                          {diags.length > 0 && (
                            <span className="text-rose-600 font-semibold truncate">
                              {infoSub ? "· " : ""}{diags.join(", ")}
                            </span>
                          )}
                        </div>

                        {/* Thẻ Note / Nhật ký cuộc gọi trực tiếp trên Thẻ tên */}
                        {p.nhatKy && p.nhatKy.length > 0 ? (
                          <div className="text-[10.5px] font-medium text-[var(--teal-deep)] flex items-center gap-1 mt-1 bg-teal-50/80 px-1.5 py-0.5 rounded border border-teal-200/80 truncate">
                            <PhoneCall className="w-3 h-3 text-[var(--teal)] shrink-0" />
                            <span className="truncate">Đã gọi {p.nhatKy.length} lần {p.nhatKy[0]?.ngay ? `(${fmtDate(p.nhatKy[0].ngay)})` : ""}</span>
                          </div>
                        ) : p.ghiChuTuVan ? (
                          <div className="text-[10.5px] text-[var(--ink-soft)] italic flex items-center gap-1 mt-1 truncate">
                            <span className="font-semibold text-[var(--navy)] shrink-0 font-sans not-italic">Note:</span>
                            <span className="truncate">{p.ghiChuTuVan}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
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
                <div className="bg-white border-b border-[var(--line)] px-4 sm:px-6 py-4 shadow-2xs space-y-3.5 shrink-0">
                  {/* Row 1: Patient Identity + Status Badge + Doctor Info */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="font-serif font-bold text-[18px] sm:text-[20px] text-[var(--ink)] uppercase tracking-tight">
                        {selected.hoTen}
                      </h2>
                      <span className="font-mono font-bold text-[var(--navy)] bg-[var(--surface-soft)] px-2.5 py-0.5 rounded-md border border-[var(--line)] text-xs shadow-2xs">
                        {selected.maBN}
                      </span>
                      <span className="text-xs font-semibold text-[var(--ink-soft)] bg-[var(--surface-soft)] px-2 py-0.5 rounded-md border border-[var(--line-soft)]">
                        {selected.gioiTinh} · {ageOf(selected)} tuổi
                      </span>

                      {/* Note Đã tư vấn / Chưa tư vấn sau khám trên Thẻ tên chính */}
                      {isTuVanDone(selected) ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-300 shadow-2xs flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-teal-600" />
                          <span>Đã tư vấn sau khám {selected.nhatKy?.length ? `(${selected.nhatKy.length} cuộc gọi)` : ""}</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-300 shadow-2xs flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-rose-600" />
                          <span>Chưa tư vấn sau khám</span>
                        </span>
                      )}

                      {selected.nhom === "A" || selected.xacNhanDieuTri === true ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
                          ✓ Đồng ý điều trị
                        </span>
                      ) : selected.nhom === "B" || selected.xacNhanDieuTri === false ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                          ⏳ Cần suy nghĩ
                        </span>
                      ) : selected.nhom === "TheoDoi" ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-300 shadow-2xs">
                          👁️ Theo dõi tại nhà
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 shadow-2xs">
                          Chưa chốt tư vấn
                        </span>
                      )}
                    </div>

                    {/* Bác sĩ khám & Khuyến nghị */}
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      {selected.bacSiChiDinh && (
                        <span className="text-[var(--ink-soft)]">
                          BS khám: <b className="text-[var(--navy)] font-semibold bg-[var(--surface-soft)] px-1.5 py-0.5 rounded border border-[var(--line-soft)]">BS. {selected.bacSiChiDinh}</b>
                        </span>
                      )}
                      <span className="text-[var(--ink-soft)]">
                        Chỉ định: <b className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">{selected.khuyenNghi || selected.huongXuTri || "Theo dõi"}</b>
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Medical Examination Snapshot (Thị lực + Chẩn đoán + Tiền sử) */}
                  <div className="rounded-xl border border-slate-200/90 bg-[var(--surface-bg)] p-3 sm:p-3.5 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    {/* Chẩn đoán & Thị lực 2 mắt */}
                    <div className="md:col-span-2 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--mute)]">Chẩn đoán:</span>
                          {getPatientDiags(selected).length > 0 ? (
                            <span className="font-bold text-[14px] text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200 shadow-2xs">
                              {getPatientDiags(selected).join(" · ")}
                            </span>
                          ) : (
                            <span className="text-[13px] text-[var(--mute)] italic">Chưa phát hiện bệnh lý</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--ink-soft)] font-medium flex-wrap">
                          <span>Thị lực MP: <b className="font-mono text-[var(--navy)] bg-white px-1.5 py-0.5 rounded border border-[var(--line-soft)]">{selected.thiLucMP || "—"}</b></span>
                          <span>·</span>
                          <span>Thị lực MT: <b className="font-mono text-[var(--navy)] bg-white px-1.5 py-0.5 rounded border border-[var(--line-soft)]">{selected.thiLucMT || "—"}</b></span>
                          {selected.matKham && <span>· Mắt khám: <b className="text-[var(--ink)] bg-white px-1.5 py-0.5 rounded border border-[var(--line-soft)]">{selected.matKham}</b></span>}
                        </div>
                      </div>
                    </div>

                    {/* Tiền sử & Thể trạng */}
                    <div className="text-xs text-[var(--ink-soft)] border-t md:border-t-0 md:border-l border-slate-200/80 md:pl-4 space-y-1">
                      <div>
                        <span className="text-[var(--mute)] font-medium">Tiền sử bệnh: </span>
                        <b className={selected.benhSu ? "text-amber-800" : "text-slate-600 font-normal"}>
                          {selected.benhSu ? (parseDiags(selected.loaiBenhSu, selected.loaiBenhSuKhac).join(", ") || "Có tiền sử bệnh") : "Không ghi nhận"}
                        </b>
                      </div>
                      <div>
                        <span className="text-[var(--mute)] font-medium">Thể trạng: </span>
                        <span className="font-medium text-[var(--ink)]">{[selected.chieuCao ? `${selected.chieuCao} cm` : null, selected.canNang ? `${selected.canNang} kg` : null].filter(Boolean).join(" · ") || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Patient Contact Strip */}
                  <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap text-xs text-[var(--ink-soft)]">
                    {selected.cccd && (
                      <div className="flex items-center gap-1">
                        <span className="text-[var(--mute)] font-medium">CCCD:</span>
                        <span className="font-mono font-bold text-[var(--ink)]">{selected.cccd}</span>
                      </div>
                    )}
                    {selected.bhyt && (
                      <div className="flex items-center gap-1">
                        <span className="text-[var(--mute)] font-medium">BHYT:</span>
                        <span className="font-mono font-bold text-[var(--teal-deep)]">{selected.bhyt} ({bhytLevel(selected.bhyt)})</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--mute)] font-medium">SĐT:</span>
                      {selected.sdt ? (
                        <a href={`tel:${selected.sdt}`} className="font-mono font-bold text-[var(--navy)] hover:text-[var(--teal-deep)] hover:underline inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[var(--teal)]" /> {selected.sdt}
                        </a>
                      ) : (
                        <span className="font-mono text-[var(--mute)]">—</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 truncate">
                      <span className="text-[var(--mute)] font-medium">Địa chỉ:</span>
                      <span className="truncate text-[var(--ink)] font-medium">{selected.diaChi || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* 2. CONSULTATION ACTION FORM */}
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="card p-4 sm:p-5 shadow-xs border border-[var(--line)] space-y-4.5 bg-white">
                    {/* Header & Quyết định */}
                    <div data-tour="tv-nhom">
                      <label className="text-[13px] font-bold text-[var(--ink)] uppercase tracking-wider block mb-2">
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
                              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                active
                                  ? `${opt.activeClass} shadow-xs`
                                  : "bg-[var(--surface-bg)] border-[var(--line)] text-[var(--ink-soft)] hover:bg-white hover:border-[var(--line-strong)]"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-[13.5px]">{opt.label}</span>
                                {active && (
                                  <span className={`w-5 h-5 rounded-full ${opt.badgeClass} flex items-center justify-center shrink-0 shadow-2xs`}>
                                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                  </span>
                                )}
                              </div>
                              <span className={`text-[11.5px] mt-1.5 leading-snug ${active ? "opacity-90 font-medium" : "text-[var(--mute)]"}`}>
                                {opt.sub}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Chi tiết kế hoạch đưa đón & viện phí (Chỉ mở khi Đồng ý điều trị tại BV) */}
                    {f.nhom === "A" ? (
                      <div className="pt-2 border-t border-[var(--line-soft)] animate-fade-in" data-tour="tv-lich">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                          <div>
                            <label className={labelCls}>Số tiền dự kiến (đồng)</label>
                            <div className="relative">
                              <input
                                inputMode="numeric"
                                value={f.soTienBao ? new Intl.NumberFormat("vi-VN").format(Number(f.soTienBao)) : ""}
                                onChange={(e) => setF((s) => ({ ...s, soTienBao: e.target.value.replace(/[^\d]/g, "") }))}
                                className="input-field font-mono font-bold text-[var(--teal-deep)] pr-12 text-[13.5px]"
                                placeholder="VD: 5.000.000"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)] text-[10px] font-bold uppercase">
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
                            <label className={labelCls}>Giờ đón (dự kiến)</label>
                            <input
                              type="text"
                              value={f.gioDon}
                              onChange={(e) => setF((s) => ({ ...s, gioDon: e.target.value }))}
                              placeholder="VD: 06:30"
                              className="input-field font-mono text-[13.5px] bg-white"
                            />
                          </div>

                          <div>
                            <label className={labelCls}>Điểm đón</label>
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
                      <div className="pt-2 border-t border-[var(--line-soft)] text-xs text-[var(--ink-soft)] flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 animate-fade-in">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${f.nhom === "B" ? "bg-amber-500" : f.nhom === "TheoDoi" ? "bg-sky-500" : "bg-slate-400"}`} />
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
                    <div className="pt-2 border-t border-[var(--line-soft)]">
                      <label className={labelCls}>Ghi chú tư vấn / Dặn dò bệnh nhân</label>
                      <textarea
                        value={f.ghiChuTuVan}
                        onChange={(e) => setF((s) => ({ ...s, ghiChuTuVan: e.target.value }))}
                        placeholder="Nhập ghi chú tư vấn, nguyện vọng của bệnh nhân, dặn dò trước khi lên viện, số người nhà liên hệ..."
                        rows={2}
                        className="input-field resize-none py-2 text-[13px] bg-white"
                      />
                    </div>
                  </div>

                  {/* 3. LỊCH SỬ GỌI ĐIỆN & NHẬT KÝ TƯ VẤN SAU KHÁM */}
                  <div className="card p-4 sm:p-5 shadow-xs border border-[var(--line)] space-y-4 bg-white">
                    <div className="flex items-center justify-between gap-2 border-b border-[var(--line-soft)] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--navy-50)] text-[var(--navy)] flex items-center justify-center shrink-0 border border-[var(--navy-100)]">
                          <PhoneCall className="w-4 h-4 text-[var(--navy)]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[14px] text-[var(--ink)] uppercase tracking-wider">
                            Lịch sử gọi điện & Nhật ký tư vấn
                          </h3>
                          <p className="text-[12px] text-[var(--mute)]">
                            Ghi nhận các cuộc gọi chăm sóc & tư vấn bệnh nhân sau khi đã khám
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[11.5px] font-bold px-2.5 py-1 rounded-full bg-[var(--surface-soft)] text-[var(--navy)] border border-[var(--line)]">
                        {selected.nhatKy?.length || 0} cuộc gọi
                      </span>
                    </div>

                    {/* Form nhập nhật ký gọi mới */}
                    <div className="space-y-2.5 bg-[var(--surface-bg)] p-3.5 rounded-xl border border-[var(--line-soft)]">
                      <label className="text-[12px] font-bold text-[var(--ink-soft)] uppercase tracking-wide flex items-center gap-1.5">
                        <Pencil className="w-3.5 h-3.5 text-[var(--teal-deep)]" />
                        Ghi nhật ký cuộc gọi mới
                      </label>

                      {/* Mẫu gợi ý nhanh */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-[var(--mute)] font-medium">Gợi ý nhanh:</span>
                        {[
                          "Đã gọi - Hẹn gọi lại",
                          "Đã gọi - Đồng ý mổ",
                          "Đã gọi - Cần suy nghĩ thêm",
                          "Thuê bao / Không nghe máy",
                          "Đã tư vấn qua người nhà",
                        ].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setCallNote((prev) => (prev ? `${prev} · ${tag}` : tag))}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--navy)] hover:text-[var(--navy)] hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2 items-start">
                        <textarea
                          value={callNote}
                          onChange={(e) => setCallNote(e.target.value)}
                          placeholder="Nhập nội dung cuộc gọi tư vấn, thông tin trao đổi với bệnh nhân hoặc người nhà..."
                          rows={2}
                          className="input-field flex-1 resize-none py-2 text-[13px] bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => saveCallLog()}
                          disabled={savingCallNote || !callNote.trim()}
                          className="btn btn-primary px-4 py-2 text-[12.5px] font-bold h-[62px] shrink-0 flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 shadow-xs"
                        >
                          {savingCallNote ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 text-[var(--teal)]" />
                          )}
                          <span>Gửi ghi chú</span>
                        </button>
                      </div>
                    </div>

                    {/* Danh sách nhật ký cuộc gọi đã lưu */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--mute)]">
                        Lịch sử cuộc gọi ({selected.nhatKy?.length || 0})
                      </span>
                      {selected.nhatKy && selected.nhatKy.length > 0 ? (
                        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                          {selected.nhatKy.map((log) => (
                            <div
                              key={log.id}
                              className="p-3 rounded-lg border border-[var(--line-soft)] bg-white text-[12.5px] space-y-1 hover:border-[var(--navy-100)] transition-colors shadow-2xs"
                            >
                              <div className="flex items-center justify-between text-[11px] text-[var(--mute)]">
                                <span className="font-semibold text-[var(--navy)] flex items-center gap-1">
                                  <PhoneCall className="w-3 h-3 text-[var(--teal-deep)]" />
                                  {log.nguoiGoi?.hoTen || "Tư vấn viên"}
                                </span>
                                <span className="font-mono">{fmtDate(log.ngay)} {fmtTime(log.ngay)}</span>
                              </div>
                              <p className="text-[13px] text-[var(--ink)] font-medium leading-relaxed whitespace-pre-wrap">
                                {log.noiDung}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-dashed border-[var(--line)] rounded-xl bg-slate-50 text-[12px] text-[var(--mute)]">
                          Chưa có lịch sử cuộc gọi nào. Hãy thêm nhật ký cuộc gọi đầu tiên ở trên.
                        </div>
                      )}
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
