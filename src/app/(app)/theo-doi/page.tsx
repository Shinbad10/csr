"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, Search, Check, Save, PhoneCall, CalendarClock, Clock, User, Shield, CreditCard, Send, X, Users, ClipboardList, Phone, CalendarDays, MapPin } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { parseDiag, ageOf, fmtDate, fmtTime, statusOf, bhytLevel, TT_DIEU_TRI, type HoSo } from "@/lib/csr";
import { Dropdown, StatusBadge, DateField, ChoiceRow, labelCls } from "@/components/csr/fields";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";

const FOLLOW = ["", "Đang follow-up", "Quá 28 ngày–chuyển CSKH", "Đã chốt", "Ngừng"];
const EMPTY_DIEUTRI = { daDon: false, ngayMoThucTe: "", soTienThucThu: "", trangThaiDieuTri: "", ngayTaiKham: "", ghiChuMat2: "" };

interface NhatKy { id: string; ngay: string; noiDung: string; nguoiGoi?: { hoTen: string } }
interface HoSoDetail extends HoSo { nhatKy?: NhatKy[] }

export default function TheoDoiPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState<"A" | "B">("A");
  const [rows, setRows] = useState<HoSo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<HoSoDetail | null>(null);
  const [stats, setStats] = useState({ tong: 0, chiDinh: 0, daDen: 0, chuaDen: 0, quaHan: 0 });

  const [bks, setBks] = useState<any[]>([]);
  const [selBk, setSelBk] = useState<string>("");
  const [showBkModal, setShowBkModal] = useState(true);
  const [bkSearch, setBkSearch] = useState("");
  const bkLabels = useMemo(() => Object.fromEntries(bks.map((b) => [b.id, `${fmtDate(b.ngayKham)} · ${b.xa}`])), [bks]);

  const filteredBks = useMemo(() => {
    if (!bkSearch.trim()) return bks;
    const q = bkSearch.toLowerCase();
    return bks.filter(b => b.id.toLowerCase().includes(q) || b.xa.toLowerCase().includes(q) || (b.diaDiem && b.diaDiem.toLowerCase().includes(q)));
  }, [bks, bkSearch]);

  useEffect(() => {
    fetch("/api/csr/buoikham").then(r => r.json()).then(data => {
      setBks(data);
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

  const load = useCallback(async (keepId?: string) => {
    if (!selBk) { setRows([]); setSel(null); return; }
    setLoading(true);
    const res = await fetch(`/api/csr/hoso?buoiKhamId=${selBk}&search=${encodeURIComponent(search)}`);
    const all: HoSo[] = res.ok ? await res.json() : [];

    let data: HoSo[] = [];
    if (tab === "B") {
      data = all.filter((r) => r.nhom === "B" || r.trangThai === "NhomB");
    } else {
      data = all.filter((r) => ["NhomA", "DaNhacLich", "DaDonVien", "DaMoHauPhau", "HuyKhongDen"].includes(r.trangThai)).sort((a, b) => (a.ngayDieuTri || "").localeCompare(b.ngayDieuTri || ""));
    }

    setRows(data);
    const next = data.find((p) => p.id === (keepId ?? sel?.id)) || data[0] || null;
    if (next && next.id !== sel?.id) {
      openDetail(next);
    } else if (!next) {
      setSel(null);
    }

    const today = new Date().toISOString().slice(0, 10);
    const tong = all.length;
    const chiDinh = all.filter(p => p.nhom).length;
    const daDen = all.filter(p => p.daDon).length;
    const chuaDen = chiDinh - daDen;
    const quaHan = all.filter(p => !p.daDon && p.ngayDieuTri && p.ngayDieuTri < today).length;
    setStats({ tong, chiDinh, daDen, chuaDen, quaHan });

    setLoading(false);
  }, [tab, search, sel?.id, selBk]);

  useEffect(() => {
    const t = setTimeout(() => { load(); }, 250);
    return () => clearTimeout(t);
  }, [search, tab, selBk]);

  const openDetail = async (p: HoSo) => {
    const res = await fetch(`/api/csr/hoso/${p.id}`);
    const detail: HoSoDetail = res.ok ? await res.json() : p;
    setSel(detail);
    setNote("");
    setFstatus(detail.followUpStatus || "");
    setF({
      daDon: !!detail.daDon,
      ngayMoThucTe: detail.ngayMoThucTe ? new Date(detail.ngayMoThucTe).toISOString().slice(0, 10) : (detail.ngayDieuTri ? new Date(detail.ngayDieuTri).toISOString().slice(0, 10) : ""),
      soTienThucThu: detail.soTienThucThu != null ? String(detail.soTienThucThu) : (detail.soTienBao != null ? String(detail.soTienBao) : ""),
      trangThaiDieuTri: detail.trangThaiDieuTri || "",
      ngayTaiKham: detail.ngayTaiKham ? new Date(detail.ngayTaiKham).toISOString().slice(0, 10) : "",
      ghiChuMat2: detail.ghiChuMat2 || "",
    });
    setIsEditingDieuTri(false);
  };

  const addNote = async () => {
    if (!sel || !note.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/csr/nhatky", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hoSoId: sel.id, noiDung: note, followUpStatus: fstatus || undefined }) });
      const d = await res.json();
      if (!res.ok) { addToast({ type: "error", message: d.error || "Lỗi" }); return; }
      addToast({ type: "success", message: "Đã thêm nhật ký liên hệ." });
      await openDetail(sel);
    } catch { addToast({ type: "error", message: "Mất kết nối" }); }
    finally { setSavingNote(false); }
  };

  const saveDieuTri = async () => {
    if (!sel) return;
    setSavingDieuTri(true);
    try {
      const res = await fetch(`/api/csr/hoso/${sel.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          daDon: f.daDon, ngayMoThucTe: f.ngayMoThucTe || null, soTienThucThu: f.soTienThucThu ? Number(f.soTienThucThu) : null,
          trangThaiDieuTri: f.trangThaiDieuTri || null, ngayTaiKham: f.ngayTaiKham || null, ghiChuMat2: f.ghiChuMat2,
        })
      });
      const d = await res.json();
      if (!res.ok) { addToast({ type: "error", message: d.error || "Lỗi" }); return; }
      addToast({ type: "success", title: `Đã lưu: ${sel.hoTen}`, message: "Cập nhật thông tin tiếp nhận/điều trị." });
      await load(sel.id);
      setIsEditingDieuTri(false);
    } catch { addToast({ type: "error", message: "Mất kết nối" }); }
    finally { setSavingDieuTri(false); }
  };

  const dirtyDieuTri = useMemo(() => {
    if (!sel) return false;
    const isDaDon = !!sel.daDon;
    const isNgayMo = sel.ngayMoThucTe ? new Date(sel.ngayMoThucTe).toISOString().slice(0, 10) : (sel.ngayDieuTri ? new Date(sel.ngayDieuTri).toISOString().slice(0, 10) : "");
    const isTien = sel.soTienThucThu != null ? String(sel.soTienThucThu) : (sel.soTienBao != null ? String(sel.soTienBao) : "");
    const isTrangThai = sel.trangThaiDieuTri || "";
    const isNgayTaiKham = sel.ngayTaiKham ? new Date(sel.ngayTaiKham).toISOString().slice(0, 10) : "";
    const isGhiChu = sel.ghiChuMat2 || "";

    return f.daDon !== isDaDon || f.ngayMoThucTe !== isNgayMo || f.soTienThucThu !== isTien || f.trangThaiDieuTri !== isTrangThai || f.ngayTaiKham !== isNgayTaiKham || f.ghiChuMat2 !== isGhiChu;
  }, [f, sel]);

  return (
    <div className="flex-1 flex flex-col bg-[var(--surface-bg)] overflow-hidden">
      <PageHeader
        title="Theo dõi A/B"
        description="Theo dõi nhóm B (chăm sóc) và nhóm A (nhắc lịch & cập nhật bệnh viện)."
        guide={[
          { selector: '[data-tour="td-bk"]', title: "Chọn đợt khám", desc: "Bấm vào đây để tải danh sách bệnh nhân cần theo dõi." },
          { selector: '[data-tour="td-tabs"]', title: "Chọn nhóm theo dõi", desc: "Tab \"Nhóm A (Mổ)\" để nhắc lịch & cập nhật bệnh viện; \"Nhóm B (K/N)\" để chăm sóc, tư vấn lại." },
          { selector: '[data-tour="td-list"]', title: "Chọn bệnh nhân", desc: "Bấm vào tên để xem chi tiết và lịch sử liên hệ." },
          { selector: '[data-tour="td-note"]', title: "Ghi nhật ký liên hệ", desc: "Nhập kết quả gọi điện rồi bấm \"Ghi nhận liên hệ\"." },
          { selector: '[data-tour="td-treat"]', title: "Cập nhật điều trị (Nhóm A)", desc: "Đánh dấu \"Đã đến bệnh viện\", nhập ngày mổ, số tiền, trạng thái rồi lưu." },
        ]}
        guideTip="Nút ⚡ Đối chiếu HIS tự lấy dữ liệu mổ từ hệ thống bệnh viện."
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/doi-chieu-his" className="btn btn-secondary px-3 py-1.5 text-[12.5px] font-semibold h-8 rounded-[var(--r-sm)] border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-1.5 text-[var(--navy)] bg-blue-50/50">
              ⚡ Đối chiếu HIS hàng loạt
            </Link>
            <button data-tour="td-bk" onClick={() => setShowBkModal(true)} className="btn btn-secondary px-3 py-1.5 text-[12.5px] font-semibold h-8 rounded-[var(--r-sm)] border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 text-[var(--ink)]">
              <CalendarDays className="w-4 h-4 text-[var(--navy)]" />
              {selBk ? bkLabels[selBk] : "Chọn đợt khám..."}
            </button>
            <button onClick={() => setShowList(true)} className="xl:hidden btn btn-secondary px-3 py-1.5 text-[12.5px] font-semibold h-8 rounded-[var(--r-sm)] border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-1.5 text-[var(--navy)]"><Users className="w-4 h-4" /> Bệnh nhân <span className="bg-[var(--rose)] text-white text-[10px] px-1.5 rounded-full">{rows.length}</span></button>
          </div>
        }
      />

      {/* --- STATS BANNER (Compact Strip - No truncation, wraps cleanly) --- */}
      <div className="px-5 py-2.5 border-b border-[var(--line)] bg-[var(--surface-soft)] text-xs shrink-0 font-medium">
        <div className="flex items-center gap-x-6 gap-y-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--mute)] uppercase text-[10px] font-bold tracking-wider">Tổng BN:</span>
            <span className="font-mono font-bold text-[var(--navy)] text-sm">{stats.tong}</span>
          </div>
          <div className="h-3.5 w-px bg-[var(--line)] hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--mute)] uppercase text-[10px] font-bold tracking-wider">Chỉ định (A/B):</span>
            <span className="font-mono font-bold text-[var(--teal-deep)] text-sm">{stats.chiDinh}</span> <span className="text-[11px] text-[var(--mute)]">/ {stats.tong}</span>
          </div>
          <div className="h-3.5 w-px bg-[var(--line)] hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--mute)] uppercase text-[10px] font-bold tracking-wider">Nhóm A (Đã đến BV):</span>
            <span className="font-mono font-bold text-[var(--green)] text-sm">{stats.daDen}</span>
          </div>
          <div className="h-3.5 w-px bg-[var(--line)] hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--mute)] uppercase text-[10px] font-bold tracking-wider">Nhóm A (Chưa đến):</span>
            <span className="font-mono font-bold text-[var(--amber)] text-sm">{stats.chuaDen}</span>
          </div>
          <div className="h-3.5 w-px bg-[var(--line)] hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--mute)] uppercase text-[10px] font-bold tracking-wider">Nhóm A (Quá hạn):</span>
            <span className="font-mono font-bold text-[var(--rose)] text-sm">{stats.quaHan}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row min-h-0 border-t border-[var(--line)] overflow-y-auto xl:overflow-hidden relative">
        {/* Backdrop */}
        {showList && <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[2px] transition-opacity xl:hidden" onClick={() => setShowList(false)} />}

        {/* COL 1 — List */}
        <aside className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${showList ? "translate-x-0" : "translate-x-full"} xl:static xl:translate-x-0 xl:w-[360px] xl:shrink-0 xl:border-r xl:border-[var(--line)] xl:shadow-none xl:z-0`}>
          <div data-tour="td-tabs" className="p-3 border-b border-[var(--line)] bg-[var(--surface-bg)] flex gap-2">
            <button onClick={() => { setTab("A"); setSel(null); }} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-bold transition-all ${tab === "A" ? "bg-[var(--navy)] text-white shadow-md" : "bg-white border border-[var(--line)] text-[var(--mute)] hover:bg-[var(--surface-hover)]"}`}><CalendarClock className="w-4 h-4" /> Nhóm A (Mổ)</button>
            <button onClick={() => { setTab("B"); setSel(null); }} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-bold transition-all ${tab === "B" ? "bg-[var(--navy)] text-white shadow-md" : "bg-white border border-[var(--line)] text-[var(--mute)] hover:bg-[var(--surface-hover)]"}`}><PhoneCall className="w-4 h-4" /> Nhóm B (K/N)</button>
          </div>
          <div className="px-4 py-3.5 flex items-center justify-between border-b border-[var(--line-soft)] xl:hidden">
            <h2 className="text-[13px] font-extrabold uppercase tracking-[0.1em] text-[var(--navy)] flex items-center gap-2"><Users className="w-4 h-4" /> Danh sách bệnh nhân</h2>
            <button onClick={() => setShowList(false)} className="p-1.5 rounded-full hover:bg-[var(--line-soft)] text-[var(--mute)] active:scale-90 transition-transform"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên, mã, SĐT…" className="w-full h-10 rounded-xl border border-[var(--line)] bg-[var(--surface-bg)] pl-9 pr-4 text-[13px] outline-none focus:border-[var(--navy)] focus:ring-1 focus:ring-[var(--navy)]" />
            </div>
          </div>
          <div data-tour="td-list" className="flex-1 overflow-y-auto px-2 pb-3 space-y-1.5">
            {loading ? <div className="py-14 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--navy)]" /></div>
              : rows.length === 0 ? <div className="text-center text-[var(--mute)] text-[12.5px] py-14 px-6">Không khớp tìm kiếm hoặc chưa có bệnh nhân.</div>
                : rows.map((p) => {
                  const active = sel?.id === p.id;
                  return (
                    <button key={p.id} onClick={() => { openDetail(p); if (window.innerWidth < 1280) setShowList(false); }} className={`w-full text-left rounded-[16px] border px-3 py-2.5 transition-all duration-150 ${active ? "border-[var(--navy)] bg-[var(--navy-50)] shadow-md ring-1 ring-[var(--navy)]" : "border-[var(--line)] bg-white hover:border-[var(--line-strong)] hover:shadow-sm"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[13.5px] font-bold truncate ${active ? "text-[var(--navy)]" : "text-[var(--ink)]"}`}>{p.hoTen}</span>
                        <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 ${active ? "text-[var(--navy)] bg-white/50" : "text-[var(--teal-deep)] bg-[var(--surface-bg)]"}`}>{p.maBN.split("-").pop()}</span>
                      </div>
                      <div className="text-[11.5px] text-[var(--mute)] mt-1 flex items-center justify-between">
                        <span className="truncate">{parseDiag(p.chanDoan).join(", ") || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 justify-between">
                        <StatusBadge label={statusOf(p.trangThai).label} cls={statusOf(p.trangThai).cls} sm />
                        {tab === "A" ? <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--mute)]"><CalendarClock className="w-3.5 h-3.5" />{fmtDate(p.ngayDieuTri)}</span>
                          : <span className="text-[11px] text-[var(--mute)]">{p.followUpStatus || "Chưa LH"}</span>}
                      </div>
                    </button>
                  );
                })}
          </div>
        </aside>

        {/* COL 2 — Details */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0 bg-white">
          {sel ? (<>
            <div className="flex-1 flex flex-col min-h-0">
              {/* COMPACT PATIENT HEADER STRIP (FULL INFO - NO TRUNCATION) */}
              <div className="bg-[var(--surface-soft)] border-b border-[var(--line)] px-5 py-3 shrink-0 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="font-serif font-bold text-[19px] text-[var(--ink)] uppercase tracking-tight">{sel.hoTen}</h2>
                    <span className="font-mono font-bold text-[var(--navy)] bg-white px-2.5 py-0.5 rounded-[var(--r-sm)] border border-[var(--line)] text-xs shadow-2xs">{sel.maBN}</span>
                    {sel.maBNHIS && (
                      <span className="font-mono font-bold text-[var(--teal-deep)] bg-[var(--teal-soft)] px-2.5 py-0.5 rounded-[var(--r-sm)] border border-[var(--teal)] text-xs shadow-2xs">HIS: {sel.maBNHIS}</span>
                    )}
                    {sel.nhom && <StatusBadge label={`Nhóm ${sel.nhom}`} cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm />}
                    <span className="text-xs font-bold text-[var(--ink-soft)] bg-white px-2 py-0.5 rounded-[var(--r-sm)] border border-[var(--line-soft)]">{sel.gioiTinh} · {ageOf(sel)} tuổi</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <button onClick={() => checkHisPatient(sel)} disabled={checkingHis} title="Đối chiếu HIS" className="btn px-3 py-1 h-7 text-xs font-bold rounded-[var(--r-sm)] bg-gradient-to-r from-[var(--amber-soft)] to-white border border-[var(--amber)] text-[var(--amber-deep)] hover:bg-[var(--amber)] hover:text-white transition-all flex items-center gap-1.5 shadow-2xs">
                      {checkingHis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>⚡ Đối chiếu HIS</>}
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
                      <span className="font-mono font-bold text-[var(--teal-deep)] bg-white px-1.5 py-0.5 rounded border border-[var(--line)]">{sel.bhyt} <span className="text-[10px] text-[var(--teal)]">({bhytLevel(sel.bhyt)})</span></span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--mute)] font-semibold">Điện thoại:</span>
                    {sel.sdt ? (
                      <a href={`tel:${sel.sdt}`} className="font-mono font-bold text-[var(--navy)] hover:text-[var(--teal-deep)] inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[var(--line)]">
                        <Phone className="w-3 h-3 text-[var(--teal)]" /> {sel.sdt}
                      </a>
                    ) : (
                      <span className="font-mono text-[var(--mute)]">—</span>
                    )}
                  </div>
                  <div className="flex items-start sm:items-center gap-1.5 flex-1 min-w-[280px]">
                    <span className="text-[var(--mute)] font-semibold shrink-0">Địa chỉ:</span>
                    <span className="font-medium text-[var(--ink)] leading-relaxed break-words">
                      {[sel.diaChi, sel.buoiKham?.xa].filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col xl:flex-row min-h-0 border-b border-[var(--line)] overflow-y-auto xl:overflow-hidden">
                {/* --- NHẬT KÝ LIÊN HỆ --- */}
                <div data-tour="td-note" className={`p-6 xl:border-r border-[var(--line)] flex flex-col min-h-0 ${tab === "A" ? "xl:w-[400px] shrink-0 bg-[var(--surface-bg)]" : "w-full"}`}>
                  <div className="flex items-center gap-2 mb-6">
                    <PhoneCall className="w-4 h-4 text-[var(--navy)]" /><h3 className="font-bold text-[13px] uppercase tracking-wide">Nhật ký liên hệ</h3>
                  </div>
                  <div className="space-y-4">
                    {tab === "B" && (
                      <div>
                        <label className="text-[12.5px] font-bold text-[var(--ink-soft)] block mb-1">Cập nhật trạng thái follow-up</label>
                        <Dropdown value={fstatus} placeholder="Giữ nguyên trạng thái hiện tại" mono={false} options={FOLLOW} onChange={setFstatus} />
                      </div>
                    )}
                    <div>
                      <label className="text-[12.5px] font-bold text-[var(--ink-soft)] block mb-1">Thêm nhật ký mới</label>
                      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="input-field resize-none" placeholder="Nhập kết quả gọi điện, ý kiến bệnh nhân…" />
                    </div>
                    <button onClick={addNote} disabled={savingNote || !note.trim()} className="btn btn-secondary w-full py-2.5 font-bold border border-[var(--line-strong)] shadow-sm bg-white hover:bg-[var(--surface-hover)]">{savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-[var(--navy)]" />} Ghi nhận liên hệ</button>
                    <div className="pt-6 mt-6 border-t border-[var(--line)] flex-1 flex flex-col min-h-0">
                      <h4 className="text-[11.5px] font-extrabold uppercase tracking-wider text-[var(--mute)] mb-3 shrink-0">Lịch sử liên hệ</h4>
                      <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                        {(sel.nhatKy || []).length === 0 ? <div className="text-[12.5px] text-[var(--mute)]">Chưa có lịch sử liên hệ.</div>
                          : sel.nhatKy!.map((n) => (
                            <div key={n.id} className="text-[13px] bg-white border border-[var(--line-soft)] rounded-[var(--r-md)] p-3 shadow-sm">
                              <div className="text-[var(--ink)] leading-snug">{n.noiDung}</div>
                              <div className="text-[11px] text-[var(--mute)] mt-1.5 flex items-center justify-between">
                                <span className="font-semibold">{n.nguoiGoi?.hoTen}</span>
                                <span className="font-mono">{fmtTime(n.ngay)}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- TIẾP NHẬN & ĐIỀU TRỊ (CHỈ NHÓM A) --- */}
                {tab === "A" && (
                  <div data-tour="td-treat" className="flex-1 p-6 relative flex flex-col min-h-0 xl:overflow-y-auto">
                    <div className="flex items-center gap-2 mb-6 shrink-0">
                      <ClipboardList className="w-4 h-4 text-[var(--teal-deep)]" /><h3 className="font-bold text-[13px] uppercase tracking-wide">Tiếp nhận & Điều trị tại BV</h3>
                    </div>

                    {/* Read-only overlay */}
                    {!isEditingDieuTri && !sel.daDon && !sel.ngayMoThucTe && !sel.soTienThucThu && (
                      <div className="absolute inset-0 z-10 bg-white/40 flex items-center justify-center backdrop-blur-[1px]">
                        <button onClick={() => setIsEditingDieuTri(true)} className="btn btn-primary px-6 py-2.5 font-bold shadow-lg shadow-[var(--teal-soft)]"><Check className="w-4 h-4 text-white" /> Cập nhật Tiếp Nhận</button>
                      </div>
                    )}

                    <div className={`space-y-6 ${!isEditingDieuTri ? "opacity-70 pointer-events-none" : ""}`}>
                      <div className="flex items-center gap-3 p-4 bg-[var(--surface-bg)] border border-[var(--line-strong)] rounded-xl cursor-pointer hover:bg-white transition-colors" onClick={() => isEditingDieuTri && setF(s => ({ ...s, daDon: !s.daDon }))}>
                        <input type="checkbox" checked={f.daDon} onChange={(e) => setF(s => ({ ...s, daDon: e.target.checked }))} className="w-5 h-5 rounded text-[var(--teal)] focus:ring-[var(--teal-soft)]" />
                        <label className="font-bold text-[14.5px] cursor-pointer select-none">Bệnh nhân ĐÃ ĐẾN BỆNH VIỆN</label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                        <DateField label="Ngày mổ thực tế" value={f.ngayMoThucTe} onChange={(v) => setF(s => ({ ...s, ngayMoThucTe: v }))} />
                        <div>
                          <label className={labelCls}>Số tiền thực thu (VNĐ)</label>
                          <input type="number" placeholder="Nhập số tiền..." value={f.soTienThucThu} onChange={(e) => setF(s => ({ ...s, soTienThucThu: e.target.value }))} className="input-field" />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Trạng thái điều trị</label>
                          <ChoiceRow options={TT_DIEU_TRI} value={f.trangThaiDieuTri} onChange={(v) => setF(s => ({ ...s, trangThaiDieuTri: v }))} render={(o) => o} />
                        </div>
                        <DateField label="Hẹn tái khám" value={f.ngayTaiKham} onChange={(v) => setF(s => ({ ...s, ngayTaiKham: v }))} />
                        <div className="md:col-span-2">
                          <label className={labelCls}>Ghi chú (nhóm tài liệu mặt 2)</label>
                          <textarea rows={2} placeholder="Sức khỏe, thuốc, dặn dò..." value={f.ghiChuMat2} onChange={(e) => setF(s => ({ ...s, ghiChuMat2: e.target.value }))} className="input-field resize-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Bar (Only for Group A when editing) */}
            {tab === "A" && (
              <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-bg)] flex justify-between items-center z-10 shrink-0">
                <span className="text-[12.5px] flex items-center gap-2">
                  {dirtyDieuTri ? <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--amber)]"><span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-pulse" /> Chưa lưu</span> : <span className="inline-flex items-center gap-1.5 text-[var(--mute)]"><Check className="w-3.5 h-3.5 text-[var(--teal)]" /> Đã lưu</span>}
                </span>
                {!isEditingDieuTri ? (
                  <button onClick={() => setIsEditingDieuTri(true)} className="btn btn-secondary px-6 py-2.5 font-bold border-[var(--line-strong)]"><Check className="w-4 h-4 text-[var(--navy)]" /> Cập nhật Tiếp Nhận</button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setIsEditingDieuTri(false); openDetail(sel); }} className="font-semibold text-[13px] text-[var(--mute)] hover:text-[var(--ink)]">Hủy</button>
                    <button onClick={saveDieuTri} disabled={savingDieuTri || !dirtyDieuTri} className="btn btn-primary px-6 py-2.5 font-bold shadow-md shadow-[var(--teal-soft)]">{savingDieuTri ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-white" />} Lưu tiếp nhận</button>
                  </div>
                )}
              </div>
            )}
          </>) : <div className="flex-1 flex flex-col items-center justify-center text-[var(--mute)] text-center px-8 gap-2"><PhoneCall className="w-10 h-10 text-[var(--mute-soft)]" /><span className="text-[14px]">Chọn bệnh nhân từ danh sách để xem & gọi điện.</span></div>}
        </main>
      </div>
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
              className="w-full h-11 rounded-[var(--r-md)] border border-[var(--line)] bg-white pl-10 pr-4 text-[13.5px] font-medium text-[var(--ink)] outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)] placeholder:text-[var(--mute-soft)] transition-all shadow-xs" 
            />
          </div>
        </div>

        {/* List */}
        <div className="p-4 space-y-2.5 bg-[var(--surface-soft)] min-h-[300px] max-h-[60vh] overflow-y-auto">
          {filteredBks.map(b => {
            const active = selBk === b.id;
            return (
              <button key={b.id} onClick={() => { setSelBk(b.id); setShowBkModal(false); }} className={`w-full text-left p-4 rounded-[var(--r-lg)] transition-all duration-200 flex items-center gap-4 border ${active ? "bg-white border-[var(--navy)] shadow-md ring-1 ring-[var(--navy)]" : "bg-white border-[var(--line)] shadow-xs hover:border-[var(--line-strong)] hover:shadow-sm"}`}>
                <div className={`w-10 h-10 rounded-[var(--r-md)] flex items-center justify-center shrink-0 border transition-colors ${active ? "bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] border-transparent text-white shadow-xs" : "bg-[var(--navy-50)] border-[var(--navy-100)] text-[var(--navy)]"}`}>
                  {active ? <Check className="w-5 h-5 text-[var(--teal)]" /> : <MapPin className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[15px] truncate text-[var(--ink)]">{b.xa}</span>
                    <span className="font-mono text-[11.5px] font-bold px-2 py-0.5 rounded-[var(--r-sm)] shrink-0 bg-[var(--navy-50)] text-[var(--navy)] border border-[var(--navy-100)]">{b.id}</span>
                  </div>
                  <div className="text-[13px] text-[var(--mute)] mt-1.5 flex items-center gap-4 font-medium">
                    <span className="flex items-center gap-1.5 shrink-0 font-mono"><CalendarDays className="w-3.5 h-3.5 text-[var(--teal-deep)]" /> {fmtDate(b.ngayKham)}</span>
                    {b.diaDiem && <span className="flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5 text-[var(--navy)] shrink-0" /> <span className="truncate">{b.diaDiem}</span></span>}
                  </div>
                </div>
              </button>
            );
          })}
          {filteredBks.length === 0 && (
            <div className="text-center py-14 flex flex-col items-center justify-center text-[var(--mute)]">
              <div className="w-12 h-12 rounded-[var(--r-lg)] bg-white shadow-xs border border-[var(--line)] flex items-center justify-center mb-4 text-[var(--mute)]"><Search className="w-6 h-6" /></div>
              <div className="font-bold text-[15px] text-[var(--ink)] font-serif">Không tìm thấy đợt khám</div>
              <div className="text-[13px] mt-1 text-[var(--mute)]">Thử thay đổi từ khóa tìm kiếm của bạn.</div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
