"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { Loader2, Search, SlidersHorizontal, Check, Save, X, Stethoscope, UserCog, ArrowLeft, Phone, PhoneCall, Send, Pencil, Clock } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useRealtimeEvent } from "@/lib/useRealtime";
import { parseDiag, ageOf, fmtDate, fmtTime, fmtBuoiKhamName, tomorrowISO, bhytLevel, statusOf, type HoSo } from "@/lib/csr";
import { DateField, StatusBadge, labelCls, Combobox } from "@/components/csr/fields";
import { Skeleton3Column, SkeletonList } from "@/components/layout/Skeleton";

interface BuoiKham { id: string; xa: string; diaDiem: string; ghiChu?: string | null; ngayKham: string; coSo?: { id: string; ten: string; cauHinhTruong?: string | null } }
const EMPTY = { bhyt: "", soTienBao: "", nhom: "", ngayHen: "", diemDon: "", gioDon: "", ghiChuTuVan: "" };

const PHUONG_AN_TU_VAN = [
  {
    key: "A",
    label: "Đồng ý điều trị tại BV",
    sub: "Lên lịch mổ & xếp xe đón bệnh nhân",
    activeClass: "bg-emerald-50 text-emerald-950 border-emerald-600 font-extrabold",
    badgeClass: "bg-emerald-600",
    tone: "bg-emerald-600 text-white border-emerald-600",
  },
  {
    key: "B",
    label: "Cần suy nghĩ thêm",
    sub: "Cần tư vấn thêm & hẹn liên hệ lại",
    activeClass: "bg-amber-50 text-amber-950 border-amber-600 font-extrabold",
    badgeClass: "bg-amber-600",
    tone: "bg-amber-500 text-white border-amber-500",
  },
  {
    key: "TheoDoi",
    label: "Theo dõi tại nhà",
    sub: "Chưa có chỉ định can thiệp tại viện",
    activeClass: "bg-sky-50 text-sky-950 border-sky-600 font-extrabold",
    badgeClass: "bg-sky-600",
    tone: "bg-sky-600 text-white border-sky-600",
  },
];

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

/** Kiểm tra bệnh nhân đã được tư vấn sau khám hay chưa */
function isTuVanDone(p: HoSo): boolean {
  return !!p.nhom || !!p.ghiChuTuVan || (!!p.nhatKy && p.nhatKy.length > 0) || p.xacNhanDieuTri != null;
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

function getPatientDiags(p: HoSo): string[] {
  const diags: string[] = [];
  if (p.chanDoanMP) {
    try {
      const arr = typeof p.chanDoanMP === "string" ? JSON.parse(p.chanDoanMP) : p.chanDoanMP;
      if (Array.isArray(arr)) arr.forEach((item) => item && diags.push(`MP: ${item}`));
    } catch { diags.push(`MP: ${p.chanDoanMP}`); }
  }
  if (p.chanDoanKhacMP) diags.push(`MP: ${p.chanDoanKhacMP}`);
  if (p.chanDoanMT) {
    try {
      const arr = typeof p.chanDoanMT === "string" ? JSON.parse(p.chanDoanMT) : p.chanDoanMT;
      if (Array.isArray(arr)) arr.forEach((item) => item && diags.push(`MT: ${item}`));
    } catch { diags.push(`MT: ${p.chanDoanMT}`); }
  }
  if (p.chanDoanKhacMT) diags.push(`MT: ${p.chanDoanKhacMT}`);
  if (p.chanDoan && p.chanDoan !== "[]") {
    try {
      const arr = typeof p.chanDoan === "string" ? JSON.parse(p.chanDoan) : p.chanDoan;
      if (Array.isArray(arr)) arr.forEach((item) => item && !diags.some((d) => d.includes(item)) && diags.push(item));
    } catch { }
  }
  if (p.chanDoanKhac && !diags.includes(p.chanDoanKhac)) diags.push(p.chanDoanKhac);
  if (p.loaiBenhLy && p.loaiBenhLy !== "[]") {
    try {
      const arr = typeof p.loaiBenhLy === "string" ? JSON.parse(p.loaiBenhLy) : p.loaiBenhLy;
      if (Array.isArray(arr)) arr.forEach((item) => item && !diags.some((d) => d.includes(item)) && diags.push(item));
    } catch { }
  }
  if (p.loaiBenhLyKhac && !diags.includes(p.loaiBenhLyKhac)) diags.push(p.loaiBenhLyKhac);
  return diags;
}

function isBenhLyPatient(p: HoSo): boolean {
  const diags = getPatientDiags(p);
  if (diags.length > 0) return true;
  if (p.benhLy && p.benhLy !== "Chưa phát hiện bất thường" && p.benhLy !== "Bình thường") return true;
  if (p.khuyenNghi === "Phẫu thuật" || p.huongXuTri === "Phẫu thuật" || p.huongXuTri === "Điều trị khác") return true;
  if (p.nhom || p.xacNhanDieuTri != null) return true;
  return false;
}

function Info({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="bg-white border border-[var(--line-soft)] rounded-[var(--r-md)] px-3.5 py-2.5 shadow-[var(--shadow-sm)]">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--mute)]">{label}</div>
      <div className={`text-[13.5px] font-semibold text-[var(--ink)] mt-0.5 ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
    </div>
  );
}

export default function TuVanSessionPage() {
  const { buoiKhamId } = useParams<{ buoiKhamId: string }>();
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [buoiKham, setBuoiKham] = useState<BuoiKham | null>(null);
  const [patients, setPatients] = useState<HoSo[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"loai" | "stt">("loai");

  const [f, setF] = useState(EMPTY);
  const [baseline, setBaseline] = useState(() => JSON.stringify(EMPTY));
  const dirty = JSON.stringify(f) !== baseline;
  const selected = useMemo(() => patients.find((p) => p.id === selId) || null, [patients, selId]);
  const uniqueDiemDon = useMemo(() => Array.from(new Set(patients.map((p) => p.diemDon).filter(Boolean))) as string[], [patients]);

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
    setF(next); setBaseline(JSON.stringify(next));
  }, []);

  const fetchPatients = useCallback(async (keepSel?: string, forceForm = false) => {
    const targetId = decodeURIComponent(buoiKhamId || "").normalize("NFC");
    const res = await fetch(`/api/csr/hoso?buoiKhamId=${encodeURIComponent(targetId)}&search=${encodeURIComponent(search)}`);
    const all: HoSo[] = res.ok ? await res.json() : [];
    const data = all.filter(isBenhLyPatient);
    setPatients(data);
    const next = data.find((p) => p.id === (keepSel ?? selId)) || data[0] || null;
    if (next) { if (forceForm || next.id !== selId) loadForm(next); setSelId(next.id); } else setSelId(null);
  }, [buoiKhamId, search, selId, loadForm]);

  useEffect(() => {
    (async () => {
      const targetId = decodeURIComponent(buoiKhamId || "").normalize("NFC");
      let cur: BuoiKham | null = null;
      try {
        const res = await fetch(`/api/csr/buoikham/${encodeURIComponent(targetId)}`);
        if (res.ok) cur = await res.json();
      } catch { }

      if (!cur) {
        const bk: BuoiKham[] = await fetch("/api/csr/buoikham").then((r) => (r.ok ? r.json() : []));
        cur = bk.find((b) =>
          b.id.normalize("NFC") === targetId || decodeURIComponent(b.id || "").normalize("NFC") === targetId
        ) || null;
      }
      setBuoiKham(cur);
      await fetchPatients();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buoiKhamId]);
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => { setSearching(true); fetchPatients(selId ?? undefined).finally(() => setSearching(false)); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Cập nhật danh sách tư vấn thời gian thực (SSE)
  useRealtimeEvent("hoso_change", (evt) => {
    const targetId = decodeURIComponent(buoiKhamId || "").normalize("NFC");
    if (evt.buoiKhamId && decodeURIComponent(evt.buoiKhamId).normalize("NFC") !== targetId) {
      return;
    }
    fetchPatients(selId ?? undefined, false);
  }, [buoiKhamId, selId, fetchPatients]);

  const pick = async (p: HoSo) => {
    if (p.id === selId) return;
    if (dirty && !(await confirm({
      title: "Bỏ thay đổi chưa lưu?",
      message: `Phiếu tư vấn đang có thay đổi chưa lưu.\nChuyển sang ${p.hoTen} sẽ mất các thay đổi này.`,
      confirmLabel: "Chuyển & bỏ thay đổi",
      cancelLabel: "Ở lại",
    }))) return;
    setSelId(p.id); loadForm(p);
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
          ngayDieuTri: f.ngayHen || null,
          diemDon: f.diemDon,
          gioDon: f.gioDon,
          ghiChuTuVan: f.ghiChuTuVan || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { addToast({ type: "error", message: data.error || "Không thể lưu" }); return; }
      addToast({ type: "success", message: `Đã lưu tư vấn: ${selected.hoTen}` });
      await fetchPatients(selected.id, true);
    } catch { addToast({ type: "error", message: "Mất kết nối máy chủ" }); }
    finally { setSaving(false); }
  };

  const [callNote, setCallNote] = useState("");
  const [savingCallNote, setSavingCallNote] = useState(false);

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
      if (!res.ok) { addToast({ type: "error", message: data.error || "Không thể lưu nhật ký" }); return; }
      setCallNote("");
      addToast({ type: "success", message: `Đã lưu nhật ký gọi: ${selected.hoTen}` });
      await fetchPatients(selected.id, true);
    } catch { addToast({ type: "error", message: "Mất kết nối máy chủ" }); }
    finally { setSavingCallNote(false); }
  };

  const visible = useMemo(() => {
    const filtered = patients.filter((p) => {
      const called = !!(p.nhatKy && p.nhatKy.length > 0);
      const isA = p.nhom === "A" || p.xacNhanDieuTri === true;
      if (!filter) return true;
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

  const FILTERS = [
    { key: "", label: "Tất cả" },
    { key: "chuagoi", label: "Chưa gọi" },
    { key: "dagoi", label: "Đã gọi" },
    { key: "nhomA", label: "Đồng ý (A)" },
    { key: "nhomB", label: "Suy nghĩ (B)" },
  ];

  if (loading) {
    return (
      <div className="h-full min-h-0 flex flex-col gap-4">
        <PageHeader
          title="Tư vấn điều trị · Đang tải..."
          description="Đang truy xuất danh sách bệnh nhân cần tư vấn..."
        />
        <Skeleton3Column />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Link href="/buoi-kham" className="p-1.5 -ml-1.5 rounded-[var(--r-md)] text-[var(--mute)] hover:bg-[var(--surface-hover)] hover:text-[var(--navy)]" title="Về danh sách đợt khám">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <>Tư vấn <span className="italic text-[var(--teal-deep)]">điều trị</span></>
          </div>
        }
        description={buoiKham ? `Đợt khám: ${fmtBuoiKhamName(buoiKham)} · ${fmtDate(buoiKham.ngayKham)}` : "—"}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        <aside className="w-full lg:w-[330px] shrink-0 max-lg:h-[42vh] card p-0 flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 pt-4 pb-3"><h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--navy)]">Bệnh nhân ({patients.length})</h2></div>
          <div className="px-3 pb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên, mã, SĐT…" className="w-full h-10 rounded-full border border-[var(--line)] bg-[var(--surface-bg)] pl-9 pr-9 text-[13px] outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)]" />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--navy)]" />}
            </div>
          </div>
          <div className="px-3 pb-2 flex items-center justify-between gap-2">
            <div className="relative">
              <button onClick={() => setFilterOpen((v) => !v)} className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-[var(--r-sm)] border transition-colors ${filter ? "text-[var(--gold-deep)] bg-[var(--gold-soft)] border-[var(--gold-line)]" : "text-[var(--ink-soft)] bg-white border-[var(--line)] hover:bg-[var(--surface-hover)]"}`}><SlidersHorizontal className="w-3.5 h-3.5" /> Bộ lọc{filter ? " · 1" : ""}</button>
              {filterOpen && (<>
                <div className="fixed inset-0 z-20" onClick={() => setFilterOpen(false)} />
                <div className="absolute left-0 top-full mt-1 z-30 w-[210px] bg-white border border-[var(--line)] rounded-[var(--r-md)] shadow-[var(--shadow-lg)] p-1 animate-fade-in">
                  {FILTERS.map((ft) => <button key={ft.key} onClick={() => { setFilter(ft.key); setFilterOpen(false); }} className={`w-full text-left px-3 py-2 rounded-[var(--r-sm)] text-[12.5px] font-semibold flex items-center justify-between ${filter === ft.key ? "bg-[var(--navy-50)] text-[var(--navy)]" : "text-[var(--ink-soft)] hover:bg-[var(--surface-hover)]"}`}>{ft.label}{filter === ft.key && <Check className="w-3.5 h-3.5" />}</button>)}
                </div>
              </>)}
            </div>

            {/* Sắp xếp Toggle */}
            <div className="flex items-center gap-0.5 bg-[var(--surface-soft)] p-0.5 rounded-md border border-[var(--line-soft)] text-[10.5px]">
              <button
                type="button"
                onClick={() => setSortBy("loai")}
                className={`px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${sortBy === "loai"
                    ? "bg-white text-[var(--navy)] shadow-2xs font-bold"
                    : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
              >
                Loại
              </button>
              <button
                type="button"
                onClick={() => setSortBy("stt")}
                className={`px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${sortBy === "stt"
                    ? "bg-white text-[var(--navy)] shadow-2xs font-bold"
                    : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
              >
                STT
              </button>
            </div>
          </div>
          <div data-tour="tvs-list" className="flex-1 overflow-y-auto px-2 pb-3 space-y-1.5">
            {searching ? <SkeletonList items={5} />
              : patients.length === 0 ? <div className="flex flex-col items-center text-center text-[var(--mute)] text-[12.5px] py-16 px-6 gap-2"><Stethoscope className="w-8 h-8 text-[var(--mute-soft)]" /><span>Đợt khám này chưa có BN nào phát hiện bệnh lý.</span></div>
                : visible.length === 0 ? <div className="text-center text-[var(--mute)] text-[12.5px] py-14 px-6">Không khớp bộ lọc.</div>
                  : visible.map((p, idx) => {
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

                    // Thẻ tên chuẩn UI/UX — Viền 4 cạnh đồng đều, tinh tế, KHÔNG dùng vệt màu 1 bên
                    let cardBgCls = "";
                    if (active) {
                      cardBgCls = "bg-indigo-50/75 border-2 border-[#002b7f] shadow-sm ring-2 ring-indigo-500/15";
                    } else if (hasCallLog) {
                      // Đã gọi: Nền trắng viền nhạt Xanh Emerald đồng đều 4 cạnh
                      cardBgCls = "bg-emerald-50/25 border border-emerald-300/80 hover:border-emerald-500 hover:shadow-xs shadow-2xs";
                    } else {
                      // Chưa gọi: Nền trắng viền nhạt Đỏ Hồng đồng đều 4 cạnh
                      cardBgCls = "bg-rose-50/15 border border-rose-200/90 hover:border-rose-400 hover:shadow-xs shadow-2xs";
                    }

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => pick(p)}
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
                  })}
          </div>
        </aside>

        <main className="flex-1 min-w-0 card p-0 flex flex-col min-h-0">
          {selected ? (<>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* COMPACT PATIENT HEADER STRIP */}
              <div className="bg-[var(--surface-soft)] border border-[var(--line-soft)] rounded-[var(--r-lg)] p-4 shadow-2xs flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="font-serif font-bold text-[19px] text-[var(--ink)] uppercase tracking-tight">{selected.hoTen}</h2>
                    <span className="font-mono font-bold text-[var(--navy)] bg-white px-2.5 py-0.5 rounded-[var(--r-sm)] border border-[var(--line)] text-xs shadow-2xs">{selected.maBN}</span>

                    {/* Badge đã tư vấn sau khám */}
                    {isTuVanDone(selected) ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-300 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-teal-600" />
                        <span>Đã tư vấn sau khám {selected.nhatKy?.length ? `(${selected.nhatKy.length} cuộc gọi)` : ""}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-300 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-rose-600" />
                        <span>Chưa tư vấn sau khám</span>
                      </span>
                    )}

                    {selected.nhom === "A" || selected.xacNhanDieuTri === true ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">Đồng ý điều trị</span>
                    ) : selected.nhom === "B" || selected.xacNhanDieuTri === false ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">Cần suy nghĩ</span>
                    ) : selected.nhom === "TheoDoi" ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-300">Theo dõi tại nhà</span>
                    ) : null}
                    <span className="text-xs font-bold text-[var(--ink-soft)] bg-white px-2 py-0.5 rounded-[var(--r-sm)] border border-[var(--line-soft)]">{selected.gioiTinh} · {ageOf(selected)} tuổi</span>
                  </div>
                  {getPatientDiags(selected).length > 0 && (
                    <div className="text-[12px] font-bold text-[var(--rose)] bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                      Chẩn đoán: {getPatientDiags(selected).join(" · ")}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap text-xs text-[var(--ink-soft)] pt-1.5 border-t border-[var(--line-soft)]/80">
                  {selected.cccd && (
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--mute)] font-semibold">CCCD:</span>
                      <span className="font-mono font-bold text-[var(--ink)]">{selected.cccd}</span>
                    </div>
                  )}
                  {selected.bhyt && (
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--mute)] font-semibold">BHYT:</span>
                      <span className="font-mono font-bold text-[var(--teal-deep)] bg-white px-1.5 py-0.5 rounded border border-[var(--line)]">{selected.bhyt} <span className="text-[10px] text-[var(--teal)]">({bhytLevel(selected.bhyt)})</span></span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--mute)] font-semibold">Điện thoại:</span>
                    {selected.sdt ? (
                      <a href={`tel:${selected.sdt}`} className="font-mono font-bold text-[var(--navy)] hover:text-[var(--teal-deep)] inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[var(--line)]">
                        <Phone className="w-3 h-3 text-[var(--teal)]" /> {selected.sdt}
                      </a>
                    ) : (
                      <span className="font-mono text-[var(--mute)]">—</span>
                    )}
                  </div>
                  <div className="flex items-start sm:items-center gap-1.5 flex-1 min-w-[280px]">
                    <span className="text-[var(--mute)] font-semibold shrink-0">Địa chỉ:</span>
                    <span className="font-medium text-[var(--ink)] leading-relaxed break-words">
                      {selected.diaChi || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* --- Clinical Results Card --- */}
              <div data-tour="tvs-clinical" className="card p-0 border-[var(--gold-line)] overflow-hidden shadow-[var(--shadow-sm)]">
                <div className="bg-[var(--gold-soft)] px-5 py-3 border-b border-[var(--gold-line)] flex items-center justify-between">
                  <h3 className="font-serif text-[15px] font-bold text-[var(--gold-deep)] flex items-center gap-2"><Stethoscope className="w-[18px] h-[18px]" /> Kết quả khám lâm sàng</h3>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[var(--gold-50)]">
                  <Info label="Thị lực Mắt phải (MP)" value={selected.thiLucMP} />
                  <Info label="Thị lực Mắt trái (MT)" value={selected.thiLucMT} />
                  <Info label="Khuyến nghị điều trị" value={selected.khuyenNghi} />
                  <div className="md:col-span-3"><Info label="Chẩn đoán chi tiết" value={getPatientDiags(selected).join(", ") || "—"} /></div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-4 items-start">
                {/* CỘT TRÁI: PHƯƠNG ÁN & KẾ HOẠCH ĐIỀU TRỊ */}
                <div className="card p-4 sm:p-5 shadow-xs border border-slate-200 space-y-4.5 bg-white h-full flex flex-col justify-between">
                  <h3 className="font-serif text-[16px] font-black text-slate-900 flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-[#031da6]" /> Phương án & Kế hoạch điều trị
                  </h3>
                  <div className="grid grid-cols-1 gap-y-4">
                    <div>
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
                              onClick={() => setF((s) => ({
                                ...s,
                                nhom: opt.key,
                                ngayHen: opt.key === "A" && !s.ngayHen ? tomorrowISO() : s.ngayHen,
                              }))}
                              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${active
                                  ? `${opt.tone} shadow-sm ring-2 ring-indigo-500/20 font-bold`
                                  : "bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-400 hover:shadow-2xs"
                                }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-extrabold text-[14.5px]">{opt.label}</span>
                                {active && (
                                  <span className="w-5.5 h-5.5 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
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

                    {f.nhom === "A" ? (
                      <div className="pt-3 border-t border-slate-200 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[12.5px] font-bold text-slate-800 uppercase tracking-wider mb-1 block">
                              Số tiền dự kiến (đồng)
                            </label>
                            <input
                              inputMode="numeric"
                              value={f.soTienBao ? new Intl.NumberFormat("vi-VN").format(Number(f.soTienBao)) : ""}
                              onChange={(e) => setF((s) => ({ ...s, soTienBao: e.target.value.replace(/[^\d]/g, "") }))}
                              className="w-full h-10 px-3 font-mono font-bold text-teal-800 bg-white border border-slate-300 rounded-lg text-[14px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
                              placeholder="VD: 5.000.000"
                            />
                          </div>
                          <div>
                            <DateField
                              label="Ngày điều trị tại BV"
                              value={f.ngayHen}
                              min={tomorrowISO()}
                              onChange={(v) => setF((s) => ({ ...s, ngayHen: v }))}
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
                              placeholder="VD: Ngã ba xã / xe nhà…"
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
                    <div className="pt-3 border-t border-slate-200">
                      <label className="text-[12.5px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 block">
                        Ghi chú tư vấn / Dặn dò bệnh nhân
                      </label>
                      <textarea
                        value={f.ghiChuTuVan}
                        onChange={(e) => setF((s) => ({ ...s, ghiChuTuVan: e.target.value }))}
                        placeholder="Nhập ghi chú tư vấn, nguyện vọng, người liên hệ, hẹn gọi lại…"
                        rows={2}
                        className="w-full p-3 rounded-lg border border-slate-300 text-[13.5px] font-medium bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none shadow-2xs"
                      />
                    </div>
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
                            placeholder="Nhập nội dung cuộc gọi tư vấn..."
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

            <div className="shrink-0 border-t border-[var(--line)] px-6 py-3 flex items-center justify-between gap-4 bg-white sticky bottom-0 z-20">
              <span className="text-[12.5px] flex items-center gap-2 min-w-0 font-medium">
                {dirty ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Chưa lưu
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 font-bold">
                    <Check className="w-4 h-4 text-teal-600 stroke-[3]" /> Đã lưu
                  </span>
                )}
                {selected.tuVanVien && (
                  <span className="text-slate-600 truncate hidden md:inline">
                    · Người chốt: <b className="text-slate-900 font-bold">{selected.tuVanVien.hoTen}</b>
                  </span>
                )}
              </span>
              <button
                onClick={save}
                disabled={saving || !dirty || !f.nhom}
                className="btn btn-primary px-8 py-2.5 font-bold text-[13.5px] shrink-0 cursor-pointer disabled:opacity-40 shadow-sm bg-[#002b7f] hover:bg-[#001f5c] text-white rounded-lg active:scale-95 flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Save className="w-4 h-4 text-white" />
                )}
                <span>Lưu tư vấn</span>
              </button>
            </div>
          </>) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center px-8 gap-3 font-medium">
              <Stethoscope className="w-12 h-12 text-slate-300" />
              <span className="text-[15px]">Chọn bệnh nhân trong hàng chờ để tư vấn điều trị.</span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
