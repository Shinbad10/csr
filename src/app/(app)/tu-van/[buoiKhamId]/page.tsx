"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { Loader2, Search, SlidersHorizontal, Check, Save, X, Stethoscope, UserCog, ArrowLeft, Phone } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useRealtimeEvent } from "@/lib/useRealtime";
import { parseDiag, ageOf, fmtDate, fmtBuoiKhamName, tomorrowISO, bhytLevel, statusOf, type HoSo } from "@/lib/csr";
import { DateField, StatusBadge, labelCls, Combobox } from "@/components/csr/fields";
import { Skeleton3Column, SkeletonList } from "@/components/layout/Skeleton";

interface BuoiKham { id: string; xa: string; diaDiem: string; ghiChu?: string | null; ngayKham: string; coSo?: { id: string; ten: string; cauHinhTruong?: string | null } }
const EMPTY = { bhyt: "", soTienBao: "", nhom: "", ngayHen: "", diemDon: "", gioDon: "", ghiChuTuVan: "" };
const TIME_OPTS = Array.from({ length: 26 }).map((_, i) => `${String(Math.floor(i / 2) + 6).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`);

const PHUONG_AN_TU_VAN = [
  { key: "A", label: "Đồng ý điều trị tại BV", tone: "bg-emerald-600 text-white border-emerald-600" },
  { key: "B", label: "Cần suy nghĩ thêm", tone: "bg-amber-500 text-white border-amber-500" },
  { key: "TheoDoi", label: "Theo dõi tại nhà", tone: "bg-sky-600 text-white border-sky-600" },
];

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
    } catch {}
  }
  if (p.chanDoanKhac && !diags.includes(p.chanDoanKhac)) diags.push(p.chanDoanKhac);
  if (p.loaiBenhLy && p.loaiBenhLy !== "[]") {
    try {
      const arr = typeof p.loaiBenhLy === "string" ? JSON.parse(p.loaiBenhLy) : p.loaiBenhLy;
      if (Array.isArray(arr)) arr.forEach((item) => item && !diags.some((d) => d.includes(item)) && diags.push(item));
    } catch {}
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
      } catch {}

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

  const visible = useMemo(() => patients.filter((p) => {
    const isDone = !!p.nhom || p.xacNhanDieuTri != null;
    if (!filter) return true;
    if (filter === "chua") return !isDone;
    if (filter === "done") return isDone;
    return true;
  }), [patients, filter]);

  const FILTERS = [
    { key: "", label: "Tất cả" },
    { key: "chua", label: "Chưa tư vấn" },
    { key: "done", label: "Đã tư vấn" },
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
          <div className="px-3 pb-2 flex items-center justify-between">
            <div className="relative">
              <button onClick={() => setFilterOpen((v) => !v)} className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-[var(--r-sm)] border transition-colors ${filter ? "text-[var(--gold-deep)] bg-[var(--gold-soft)] border-[var(--gold-line)]" : "text-[var(--ink-soft)] bg-white border-[var(--line)] hover:bg-[var(--surface-hover)]"}`}><SlidersHorizontal className="w-3.5 h-3.5" /> Bộ lọc{filter ? " · 1" : ""}</button>
              {filterOpen && (<>
                <div className="fixed inset-0 z-20" onClick={() => setFilterOpen(false)} />
                <div className="absolute left-0 top-full mt-1 z-30 w-[210px] bg-white border border-[var(--line)] rounded-[var(--r-md)] shadow-[var(--shadow-lg)] p-1 animate-fade-in">
                  {FILTERS.map((ft) => <button key={ft.key} onClick={() => { setFilter(ft.key); setFilterOpen(false); }} className={`w-full text-left px-3 py-2 rounded-[var(--r-sm)] text-[12.5px] font-semibold flex items-center justify-between ${filter === ft.key ? "bg-[var(--navy-50)] text-[var(--navy)]" : "text-[var(--ink-soft)] hover:bg-[var(--surface-hover)]"}`}>{ft.label}{filter === ft.key && <Check className="w-3.5 h-3.5" />}</button>)}
                </div>
              </>)}
            </div>
            <span className="text-[12px] text-[var(--mute)] font-medium">{filter ? `${visible.length}/${patients.length}` : patients.length} BN</span>
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

                  // STT badge color
                  let sttBadgeCls = "bg-slate-100 text-slate-700 border-slate-200";
                  if (p.nhom === "A" || p.xacNhanDieuTri === true) {
                    sttBadgeCls = "bg-emerald-50 text-emerald-800 border-emerald-300";
                  } else if (p.nhom === "B" || p.xacNhanDieuTri === false) {
                    sttBadgeCls = "bg-amber-50 text-amber-800 border-amber-300";
                  } else if (p.nhom === "TheoDoi") {
                    sttBadgeCls = "bg-sky-50 text-sky-800 border-sky-300";
                  }

                  return (
                    <button
                      key={p.id}
                      onClick={() => pick(p)}
                      className={`w-full text-left rounded-lg border px-2.5 py-1.5 transition-all duration-150 relative cursor-pointer ${
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
                            ) : (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
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
                        </div>
                      </div>
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

              <div className="card p-5 space-y-5">
                <h3 className="font-serif text-[16px] font-semibold text-[var(--ink)] flex items-center gap-2"><UserCog className="w-4 h-4 text-[var(--teal-deep)]" /> Phương án & Kế hoạch điều trị</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div className="col-span-2">
                    <label className={labelCls}>Phương án / Quyết định của bệnh nhân *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
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
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-[13px] ${
                              active
                                ? `${opt.tone} shadow-sm ring-2 ring-offset-1 ring-slate-400`
                                : "bg-white border-[var(--line-strong)] text-[var(--ink-soft)] hover:bg-[var(--surface-soft)]"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {f.nhom === "A" ? (
                    <>
                      <div><label className={labelCls}>Số tiền dự kiến (đồng)</label><input inputMode="numeric" value={f.soTienBao ? new Intl.NumberFormat("vi-VN").format(Number(f.soTienBao)) : ""} onChange={(e) => setF((s) => ({ ...s, soTienBao: e.target.value.replace(/[^\d]/g, "") }))} className="input-field font-mono font-bold text-[var(--teal-deep)]" placeholder="VD: 5.000.000" /></div>
                      <div><label className={labelCls}>Ngày điều trị tại BV</label><DateField value={f.ngayHen} min={tomorrowISO()} onChange={(v) => setF((s) => ({ ...s, ngayHen: v }))} /></div>
                      <div className="grid grid-cols-[100px_1fr] gap-3 col-span-2 lg:col-span-1">
                        <div><label className={labelCls}>Giờ đón</label><Combobox value={f.gioDon} onChange={(v) => setF((s) => ({ ...s, gioDon: v }))} options={TIME_OPTS} placeholder="--:--" /></div>
                        <div><label className={labelCls}>Điểm đón</label><Combobox value={f.diemDon} onChange={(v) => setF((s) => ({ ...s, diemDon: v }))} options={uniqueDiemDon} placeholder="VD: Ngã ba xã / xe nhà…" /></div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 text-xs text-[var(--ink-soft)] flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
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
                  <div className="col-span-2">
                    <label className={labelCls}>Ghi chú tư vấn / Dặn dò bệnh nhân</label>
                    <textarea
                      value={f.ghiChuTuVan}
                      onChange={(e) => setF((s) => ({ ...s, ghiChuTuVan: e.target.value }))}
                      placeholder="Nhập ghi chú tư vấn, nguyện vọng, người liên hệ, hẹn gọi lại…"
                      rows={2}
                      className="input-field resize-none py-2"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="shrink-0 border-t border-[var(--line)] px-6 py-3 flex items-center justify-between gap-4">
              <span className="text-[12px] flex items-center gap-2 min-w-0">{dirty ? <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--amber)]"><span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-pulse" /> Chưa lưu</span> : <span className="inline-flex items-center gap-1.5 text-[var(--mute)]"><Check className="w-3.5 h-3.5 text-[var(--teal)]" /> Đã lưu</span>}{selected.tuVanVien && <span className="text-[var(--mute)] truncate hidden md:inline">· Người chốt: <b>{selected.tuVanVien.hoTen}</b></span>}</span>
              <button onClick={save} disabled={saving || !dirty || !f.nhom} className="btn btn-primary px-8 py-2.5 font-bold shrink-0 cursor-pointer">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[var(--teal)]" />} Lưu tư vấn</button>
            </div>
          </>) : <div className="flex-1 flex flex-col items-center justify-center text-[var(--mute)] text-center px-8 gap-2"><Stethoscope className="w-10 h-10 text-[var(--mute-soft)]" /><span className="text-[14px]">Chọn bệnh nhân trong hàng chờ để tư vấn điều trị.</span></div>}
        </main>
      </div>
    </div>
  );
}
