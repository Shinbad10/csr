"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, Search, SlidersHorizontal, Check, Save, X, Stethoscope, UserCog, Shield, Phone, CreditCard, MapPin, User, Users, Pencil, CalendarDays } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { BHYT, NHOM, parseDiag, ageOf, fmtDate, tomorrowISO, bhytLevel, isCardNumber, statusOf, type HoSo } from "@/lib/csr";
import { Dropdown, Select, DateField, ChoiceRow, StatusBadge, labelCls, Combobox } from "@/components/csr/fields";
import PageHeader from "@/components/layout/PageHeader";

const FILTERS = [
  { key: "", label: "Tất cả" },
  { key: "chuaxong", label: "Chưa phân nhóm" },
  { key: "xong", label: "Đã phân nhóm" },
];

const TIME_OPTS = ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "13:30", "14:00"];

const EMPTY = { bhyt: "", soTienBao: "", nhom: "", ngayHen: "", diemDon: "", gioDon: "" };

export default function TuVanSessionPage() {
  const { addToast } = useToast();
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
  const [showList, setShowList] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  const selected = useMemo(() => patients.find((p) => p.id === selId) || null, [patients, selId]);
  const isDone = selected && !!selected.nhom;
  const readOnly = !!isDone && !isEditing;
  const uniqueDiemDon = useMemo(() => Array.from(new Set(patients.map((p) => p.diemDon).filter(Boolean))) as string[], [patients]);

  const visible = useMemo(() => {
    return patients.filter((p) => {
      if (filter === "chuaxong" && p.nhom) return false;
      if (filter === "xong" && !p.nhom) return false;
      return true;
    });
  }, [patients, filter]);

  const loadForm = useCallback((p: HoSo) => {
    const next = { bhyt: p.bhyt || "", soTienBao: p.soTienBao != null ? String(p.soTienBao) : "", nhom: p.nhom || "", ngayHen: p.ngayDieuTri ? new Date(p.ngayDieuTri).toISOString().slice(0, 10) : "", diemDon: p.diemDon || "", gioDon: p.gioDon || "" };
    setF(next); setBaseline(JSON.stringify(next));
  }, []);

  const fetchPatients = useCallback(async (keepSel?: string, forceForm = false) => {
    if (!selBk) { setPatients([]); return; }
    const res = await fetch(`/api/csr/hoso?buoiKhamId=${selBk}&search=${encodeURIComponent(search)}`);
    const all: HoSo[] = res.ok ? await res.json() : [];
    const data = all.filter((p) => p.khuyenNghi === "Phẫu thuật");
    setPatients(data);
    const next = data.find((p) => p.id === (keepSel ?? selId)) || data[0] || null;
    if (next) { if (forceForm || next.id !== selId) loadForm(next); setSelId(next.id); } else setSelId(null);
  }, [search, selId, loadForm, selBk]);

  useEffect(() => {
    fetch("/api/csr/buoikham").then(r => r.json()).then(data => {
      setBks(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selBk) {
      setLoading(true);
      fetchPatients().finally(() => setLoading(false));
    }
  }, [selBk]); // Note: intentional missing fetchPatients from deps to avoid loop if it changes often, but it's safe if fetchPatients uses useCallback

  useEffect(() => {
    const t = setTimeout(() => { if (!loading && selBk) fetchPatients(undefined, true); }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const pick = (p: HoSo) => {
    if (p.id === selId) return;
    if (dirty && !window.confirm("Có thay đổi chưa lưu. Chuyển bệnh nhân khác và bỏ thay đổi?")) return;
    setIsEditing(false);
    setSelId(p.id); loadForm(p);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/csr/hoso/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bhyt: f.bhyt, soTienBao: f.soTienBao ? Number(f.soTienBao) : null, nhom: f.nhom || null, ngayDieuTri: f.ngayHen || null, diemDon: f.diemDon, gioDon: f.gioDon }) });
      const data = await res.json();
      if (!res.ok) { addToast({ type: "error", message: data.error || "Không thể lưu" }); return; }
      addToast({ type: "success", title: `Đã phân nhóm: ${selected.hoTen}`, message: `Bệnh nhân được xếp vào Nhóm ${f.nhom}.` });
      setIsEditing(false);
      await fetchPatients(selected.id, true);
    } catch { addToast({ type: "error", message: "Mất kết nối máy chủ" }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[var(--navy)]" /></div>;

  return (
    <div className="flex-1 flex flex-col bg-[var(--surface-bg)] overflow-hidden">
      <PageHeader 
        title="Tư vấn phẫu thuật" 
        description="Tư vấn bệnh nhân có khuyến nghị phẫu thuật từ đợt khám."
        actions={
          <div className="flex items-center gap-3">
            <button onClick={() => setShowBkModal(true)} className="btn btn-secondary px-3 py-1.5 text-[12.5px] font-semibold h-8 rounded-[var(--r-sm)] border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 text-[var(--ink)]">
              <CalendarDays className="w-4 h-4 text-[var(--navy)]" /> 
              {selBk ? bkLabels[selBk] : "Chọn đợt khám..."}
            </button>
            <button onClick={() => setShowList(true)} className="lg:hidden btn btn-secondary px-3 py-1.5 text-[12.5px] font-semibold h-8 rounded-[var(--r-sm)] border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-1.5 text-[var(--navy)]"><Users className="w-4 h-4" /> Bệnh nhân <span className="bg-[var(--rose)] text-white text-[10px] px-1.5 rounded-full">{patients.length}</span></button>
          </div>
        }
      />

      {showBkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[560px] flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--line-soft)] flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-[var(--line)] bg-[var(--surface-bg)] flex items-center justify-center shrink-0 shadow-sm">
                  <CalendarDays className="w-5 h-5 text-[var(--ink)]" />
                </div>
                <div>
                  <h2 className="font-serif text-[20px] font-bold text-[var(--ink)] leading-tight">Chọn đợt khám</h2>
                  <p className="text-[13px] text-[var(--mute)] mt-0.5">Lấy danh sách bệnh nhân theo từng đợt</p>
                </div>
              </div>
              <button onClick={() => setShowBkModal(false)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--surface-hover)] text-[var(--mute)] hover:text-[var(--ink)] active:scale-90 transition-colors" title="Đóng">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-[var(--line-soft)] bg-[var(--surface-bg)]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
                <input 
                  autoFocus 
                  placeholder="Tìm theo xã, địa điểm hoặc mã đợt khám..." 
                  value={bkSearch} 
                  onChange={(e) => setBkSearch(e.target.value)} 
                  className="w-full h-11 rounded-xl border border-[var(--line)] bg-white pl-10 pr-4 text-[13.5px] outline-none focus:border-[var(--navy)] focus:ring-1 focus:ring-[var(--navy)] transition-colors shadow-sm" 
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[var(--surface-bg)]">
              {filteredBks.map(b => {
                const active = selBk === b.id;
                return (
                  <button key={b.id} onClick={() => { setSelBk(b.id); setShowBkModal(false); }} className={`w-full text-left p-4 rounded-[16px] transition-all duration-200 flex items-center gap-4 border bg-white ${active ? "border-[var(--navy)] shadow-md ring-1 ring-[var(--navy)]" : "border-[var(--line)] shadow-sm hover:border-[var(--mute-soft)] hover:shadow-md"}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-colors ${active ? "bg-[var(--navy-50)] border-transparent text-[var(--navy)]" : "bg-[var(--surface-bg)] border-[var(--line)] text-[var(--mute)]"}`}>
                      {active ? <Check className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[15px] truncate text-[var(--ink)]">{b.xa}</span>
                        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 bg-[var(--surface-bg)] border border-[var(--line)] text-[var(--mute)]">{b.id}</span>
                      </div>
                      <div className="text-[13px] text-[var(--mute)] mt-1.5 flex items-center gap-4">
                        <span className="flex items-center gap-1.5 shrink-0"><CalendarDays className="w-3.5 h-3.5" /> {fmtDate(b.ngayKham)}</span>
                        {b.diaDiem && <span className="flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{b.diaDiem}</span></span>}
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredBks.length === 0 && (
                <div className="text-center py-14 flex flex-col items-center justify-center text-[var(--mute)]">
                  <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-[var(--line-soft)] flex items-center justify-center mb-4 text-[var(--mute-soft)]"><Search className="w-6 h-6" /></div>
                  <div className="font-bold text-[15px] text-[var(--ink)]">Không tìm thấy đợt khám</div>
                  <div className="text-[13.5px] mt-1.5">Thử thay đổi từ khóa tìm kiếm.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col xl:flex-row min-h-0 border-t border-[var(--line)] overflow-y-auto xl:overflow-hidden relative">
        {/* Backdrop */}
        {showList && <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[2px] transition-opacity xl:hidden" onClick={() => setShowList(false)} />}

        {/* COL 1 — List */}
        <aside className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${showList ? "translate-x-0" : "translate-x-full"} xl:static xl:translate-x-0 xl:w-[340px] xl:shrink-0 xl:border-r xl:border-[var(--line)] xl:shadow-none xl:z-0`}>
          <div className="px-4 py-3.5 flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface-bg)] xl:bg-white xl:py-4 xl:border-b-0">
            <h2 className="text-[13px] xl:text-[11px] font-extrabold uppercase tracking-[0.1em] xl:tracking-[0.12em] text-[var(--navy)] flex items-center gap-2 xl:block"><Users className="w-4 h-4 xl:hidden" /> <span className="xl:hidden">Bệnh nhân chờ tư vấn</span><span className="hidden xl:inline">Bệnh nhân</span></h2>
            <button onClick={() => setShowList(false)} className="p-1.5 rounded-full hover:bg-[var(--line-soft)] text-[var(--mute)] active:scale-90 transition-transform xl:hidden"><X className="w-5 h-5" /></button>
          </div>
          <div className="px-4 xl:px-3 pt-4 xl:pt-0 pb-3 flex items-center justify-between">
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
          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1.5">
            {patients.length === 0 ? <div className="flex flex-col items-center text-center text-[var(--mute)] text-[12.5px] py-16 px-6 gap-2"><Stethoscope className="w-8 h-8 text-[var(--mute-soft)]" /><span>Không có BN nào được khuyến nghị phẫu thuật.</span></div>
              : visible.length === 0 ? <div className="text-center text-[var(--mute)] text-[12.5px] py-14 px-6">Không khớp bộ lọc.</div>
                : visible.map((p) => {
                  const active = selId === p.id; return (
                <button key={p.id} onClick={() => { pick(p); if (window.innerWidth < 1024) setShowList(false); }} className={`w-full text-left rounded-[var(--r-md)] border px-3 py-2.5 transition-all duration-150 ${active ? "border-[var(--teal)] bg-[var(--teal-soft)] shadow-[0_0_0_1px_var(--teal)]" : "border-[var(--line)] bg-white hover:border-[var(--line-strong)] hover:bg-[var(--surface-hover)]"}`}>
                      <div className="flex items-center justify-between gap-2"><span className="text-[13.5px] font-bold text-[var(--ink)] truncate">{p.stt}. {p.hoTen}</span><span className="font-mono text-[11px] font-bold text-[var(--teal-deep)] shrink-0">{p.maBN.split("-").pop()}</span></div>
                      <div className="text-[11px] text-[var(--mute)] mt-0.5 truncate">{p.gioiTinh} · {ageOf(p)}t {p.buoiKham?.xa ? `· Xã ${p.buoiKham.xa}` : ""}</div>
                      <div className="flex items-center gap-1.5 mt-1.5"><StatusBadge label={statusOf(p.trangThai).label} cls={statusOf(p.trangThai).cls} sm />{p.nhom && !p.trangThai.startsWith("Nhom") && <StatusBadge label={`Nhóm ${p.nhom}`} cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm />}</div>
                    </button>);
                })}
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col min-h-0 bg-white">
          {selected ? (<>
            <div className="flex-1 overflow-y-auto pb-32">
              {/* --- Patient Profile --- */}
              <div className="p-6 pb-0">
                <div className="relative bg-[var(--surface-soft)] border border-[var(--line-soft)] rounded-[var(--r-lg)] p-5 overflow-hidden shadow-[var(--shadow-sm)]">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--teal-soft)] rounded-bl-full opacity-50 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="font-serif text-[26px] font-bold text-[var(--ink)] uppercase tracking-tight">{selected.hoTen}</h2>
                        {selected.nhom && !selected.trangThai.startsWith("Nhom") && <StatusBadge label={`Nhóm ${selected.nhom}`} cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" />}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 mt-5 text-[13px] text-[var(--ink-soft)]">
                      <div>
                        <div className="text-[10px] font-bold text-[var(--mute)] uppercase tracking-wider mb-1.5">Mã bệnh nhân</div>
                        <div className="font-mono font-bold text-[var(--navy)] bg-[var(--navy-50)] inline-flex px-2 py-0.5 rounded border border-[var(--navy-100)]">{selected.maBN}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-[var(--mute)] uppercase tracking-wider mb-1.5">Giới tính & Tuổi</div>
                        <div className="font-semibold text-[13.5px] text-[var(--ink)]">{selected.gioiTinh} <span className="text-[var(--mute)] px-0.5">·</span> {ageOf(selected)} tuổi</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-[var(--mute)] uppercase tracking-wider mb-1.5">Số CCCD & BHYT</div>
                        <div className="font-mono font-medium text-[var(--ink)]">{selected.cccd || "—"}</div>
                        {selected.bhyt && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="font-mono text-[11.5px] text-[var(--mute)]">{selected.bhyt}</span>
                            <span className="px-1.5 py-0.5 rounded-[var(--r-sm)] text-[10px] font-bold bg-gradient-to-r from-[var(--teal-soft)] to-[var(--teal-50)] text-[var(--teal-deep)] border border-[var(--teal)] shadow-sm">{bhytLevel(selected.bhyt)}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-[var(--mute)] uppercase tracking-wider mb-1.5">Điện thoại</div>
                        {selected.sdt ? (
                          <a href={`tel:${selected.sdt}`} className="font-mono font-bold text-[var(--navy)] hover:text-[var(--teal-deep)] hover:underline inline-flex items-center gap-1.5 bg-[var(--navy-50)] hover:bg-[var(--teal-soft)] px-2 py-0.5 rounded border border-[var(--navy-100)] hover:border-[var(--teal)] transition-all shadow-sm">
                            <Phone className="w-3.5 h-3.5" />
                            {selected.sdt}
                          </a>
                        ) : (
                          <div className="font-mono font-medium text-[var(--mute)]">—</div>
                        )}
                      </div>
                      <div className="col-span-2 md:col-span-4 border-t border-[var(--line-soft)] pt-3">
                        <div className="text-[10px] font-bold text-[var(--mute)] uppercase tracking-wider mb-1">Địa chỉ thường trú</div>
                        <div className="font-medium truncate" title={[selected.diaChi, selected.buoiKham?.xa].filter(Boolean).join(", ") || "—"}>{[selected.diaChi, selected.buoiKham?.xa].filter(Boolean).join(", ") || "—"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Consultation Form --- */}
              <div className="px-6 py-6">
                <div className="flex items-center gap-2 mb-6">
                  <UserCog className="w-4 h-4" /><h3 className="font-bold text-[13px] uppercase tracking-wide">Tư vấn & Phân nhóm</h3>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <label className={labelCls}>2.1 Chọn nhóm</label>
                      <ChoiceRow options={NHOM} value={f.nhom} onChange={(v) => setF((s) => ({ ...s, nhom: v }))} render={(o) => o === "A" ? "Nhóm A (Đồng ý mổ)" : "Nhóm B (Suy nghĩ thêm)"} disabled={readOnly} />
                    </div>
                    <div>
                      <label className={labelCls}>Số tiền dự kiến</label>
                      <input disabled={readOnly} inputMode="numeric" value={f.soTienBao} onChange={(e) => setF((s) => ({ ...s, soTienBao: e.target.value.replace(/[^\d]/g, "") }))} className="input-field font-mono" placeholder="VD: 5000000" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <DateField disabled={readOnly} label="2.2 Ngày điều trị" value={f.ngayHen} onChange={(v) => setF((s) => ({ ...s, ngayHen: v }))} min={tomorrowISO()} />
                    <Select disabled={readOnly} label="2.3 Giờ đón (dự kiến)" value={f.gioDon} onChange={(v) => setF((s) => ({ ...s, gioDon: v }))} opts={TIME_OPTS} placeholder="Chọn giờ…" />
                    <div className="md:col-span-2">
                      <label className={labelCls}>2.4 Điểm đón</label>
                      <Combobox disabled={readOnly} value={f.diemDon} onChange={(v) => setF((s) => ({ ...s, diemDon: v }))} options={uniqueDiemDon} placeholder="Chọn hoặc nhập điểm đón…" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-bg)] flex justify-between items-center z-10 shrink-0">
              <span className="text-[12.5px] flex items-center gap-2">
                {dirty ? <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--amber)]"><span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-pulse" /> Chưa lưu</span> : <span className="inline-flex items-center gap-1.5 text-[var(--mute)]"><Check className="w-3.5 h-3.5 text-[var(--teal)]" /> Đã lưu</span>}
              </span>
              {readOnly ? (
                <button onClick={() => setIsEditing(true)} className="btn btn-secondary px-6 py-2.5 font-bold"><Pencil className="w-4 h-4 text-[var(--navy)]" /> Sửa phân nhóm</button>
              ) : (
                <div className="flex items-center gap-3">
                  {!!isDone && isEditing && <button onClick={() => { setIsEditing(false); setF(JSON.parse(baseline)); }} className="font-semibold text-[13px] text-[var(--mute)] hover:text-[var(--ink)]">Hủy</button>}
                  <button onClick={save} disabled={saving || !dirty || !f.nhom} className="btn btn-primary px-6 py-2.5 font-bold">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[var(--teal)]" />} Lưu phân nhóm</button>
                </div>
              )}
            </div>
          </>) : <div className="flex-1 flex flex-col items-center justify-center text-[var(--mute)] text-center px-8 gap-2"><Stethoscope className="w-10 h-10 text-[var(--mute-soft)]" /><span className="text-[14px]">Chọn bệnh nhân trong hàng chờ để tư vấn & phân nhóm.</span></div>}
        </main>
      </div>
    </div>
  );
}
