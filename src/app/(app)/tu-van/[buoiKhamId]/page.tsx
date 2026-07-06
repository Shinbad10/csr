"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { Loader2, Search, SlidersHorizontal, Check, Save, X, Stethoscope, UserCog, ArrowLeft, RefreshCw, Phone } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { BHYT, NHOM, parseDiag, ageOf, fmtDate, tomorrowISO, bhytLevel, isCardNumber, statusOf, type HoSo } from "@/lib/csr";
import { Dropdown, DateField, ChoiceRow, StatusBadge, labelCls, Combobox } from "@/components/csr/fields";

interface BuoiKham { id: string; xa: string; diaDiem: string; ngayKham: string; coSo?: { ten: string } }
const EMPTY = { bhyt: "", soTienBao: "", nhom: "", ngayHen: "", diemDon: "", gioDon: "" };
const TIME_OPTS = Array.from({ length: 26 }).map((_, i) => `${String(Math.floor(i / 2) + 6).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`);

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
    const next = { bhyt: p.bhyt || "", soTienBao: p.soTienBao != null ? String(p.soTienBao) : "", nhom: p.nhom || "", ngayHen: p.ngayDieuTri ? new Date(p.ngayDieuTri).toISOString().slice(0, 10) : "", diemDon: p.diemDon || "", gioDon: p.gioDon || "" };
    setF(next); setBaseline(JSON.stringify(next));
  }, []);

  const fetchPatients = useCallback(async (keepSel?: string, forceForm = false) => {
    const res = await fetch(`/api/csr/hoso?buoiKhamId=${buoiKhamId}&search=${encodeURIComponent(search)}`);
    const all: HoSo[] = res.ok ? await res.json() : [];
    const data = all.filter((p) => p.khuyenNghi === "Phẫu thuật");
    setPatients(data);
    const next = data.find((p) => p.id === (keepSel ?? selId)) || data[0] || null;
    if (next) { if (forceForm || next.id !== selId) loadForm(next); setSelId(next.id); } else setSelId(null);
  }, [buoiKhamId, search, selId, loadForm]);

  useEffect(() => {
    (async () => {
      const bk: BuoiKham[] = await fetch("/api/csr/buoikham").then((r) => (r.ok ? r.json() : []));
      setBuoiKham(bk.find((b) => b.id === buoiKhamId) || null);
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

  const pick = (p: HoSo) => { if (p.id === selId) return; if (dirty && !window.confirm("Có thay đổi chưa lưu. Chuyển bệnh nhân khác?")) return; setSelId(p.id); loadForm(p); };

  const save = async () => {
    if (!selected) return;
    if (f.nhom === "A" && !f.ngayHen) { addToast({ type: "error", message: "Nhóm A bắt buộc nhập Ngày điều trị." }); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/csr/hoso/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bhyt: f.bhyt, soTienBao: f.soTienBao ? Number(f.soTienBao) : null, nhom: f.nhom || null, ngayDieuTri: f.ngayHen || null, diemDon: f.diemDon, gioDon: f.gioDon }) });
      const data = await res.json();
      if (!res.ok) { addToast({ type: "error", message: data.error || "Không thể lưu" }); return; }
      addToast({ type: "success", title: `Đã lưu: ${selected.hoTen}`, message: "Cập nhật tư vấn & phân nhóm." });
      await fetchPatients(selected.id, true);
    } catch { addToast({ type: "error", message: "Mất kết nối máy chủ" }); }
    finally { setSaving(false); }
  };

  const visible = useMemo(() => patients.filter((p) => { if (!filter) return true; if (filter === "chua") return !p.nhom; return p.nhom === filter; }), [patients, filter]);
  const FILTERS = [{ key: "", label: "Tất cả" }, { key: "chua", label: "Chưa phân nhóm" }, { key: "A", label: "Nhóm A · đã chốt mổ" }, { key: "B", label: "Nhóm B · theo dõi" }];

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[var(--navy)]" /></div>;

  return (
    <div className="h-[calc(100vh-110px)] flex flex-col gap-4">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Link href="/buoi-kham" className="p-1.5 -ml-1.5 rounded-[var(--r-md)] text-[var(--mute)] hover:bg-[var(--surface-hover)] hover:text-[var(--navy)]" title="Về danh sách đợt khám">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <>Tư vấn <span className="italic text-[var(--teal-deep)]">& phân nhóm</span></>
          </div>
        }
        description={buoiKham ? `Đợt khám: BV - Xã ${buoiKham.xa}, ${buoiKham.diaDiem} · ${fmtDate(buoiKham.ngayKham)}` : "—"}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        <aside className="w-full lg:w-[330px] shrink-0 max-lg:h-[42vh] card p-0 flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 pt-4 pb-3"><h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--navy)]">Bệnh nhân</h2></div>
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
          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1.5">
            {patients.length === 0 ? <div className="flex flex-col items-center text-center text-[var(--mute)] text-[12.5px] py-16 px-6 gap-2"><Stethoscope className="w-8 h-8 text-[var(--mute-soft)]" /><span>Đợt khám này chưa có BN nào được khuyến nghị phẫu thuật.</span></div>
              : visible.length === 0 ? <div className="text-center text-[var(--mute)] text-[12.5px] py-14 px-6">Không khớp bộ lọc.</div>
                : visible.map((p) => {
                  const active = selId === p.id; const cds = parseDiag(p.chanDoan); return (
                    <button key={p.id} onClick={() => pick(p)} className={`w-full text-left rounded-[var(--r-md)] border px-3 py-2.5 transition-all ${active ? "border-[var(--navy)] bg-[var(--navy-50)] shadow-[0_0_0_1px_var(--navy)]" : "border-[var(--line)] bg-white hover:border-[var(--navy-100)] hover:bg-[var(--surface-soft)]"}`}>
                      <div className="flex items-center justify-between gap-2"><span className="text-[13.5px] font-bold text-[var(--ink)] truncate">{p.stt}. {p.hoTen}</span><span className="font-mono text-[11px] font-bold text-[var(--teal-deep)] shrink-0">{p.maBN.split("-").pop()}</span></div>
                      <div className="text-[11px] text-[var(--mute)] mt-0.5 truncate">{p.gioiTinh} · {ageOf(p)}t · {cds.join(", ") || "—"}</div>
                      <div className="flex items-center gap-1.5 mt-1.5"><StatusBadge label={statusOf(p.trangThai).label} cls={statusOf(p.trangThai).cls} sm />{p.nhom && !p.trangThai.startsWith("Nhom") && <StatusBadge label={`Nhóm ${p.nhom}`} cls="bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" sm />}</div>
                    </button>);
                })}
          </div>
        </aside>

        <main className="flex-1 min-w-0 card p-0 flex flex-col min-h-0">
          {selected ? (<>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* --- Patient Profile Card --- */}
              <div className="relative bg-[var(--surface-soft)] border border-[var(--line-soft)] rounded-[var(--r-lg)] p-5 overflow-hidden shadow-[var(--shadow-sm)]">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--teal-soft)] rounded-bl-full opacity-50 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <h2 className="font-serif text-[22px] font-bold text-[var(--ink)] uppercase tracking-tight">{selected.hoTen}</h2>
                      <StatusBadge label={statusOf(selected.trangThai).label} cls={statusOf(selected.trangThai).cls} />
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
                      <div className="font-medium truncate" title={selected.diaChi || "—"}>{selected.diaChi || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Clinical Results Card --- */}
              <div className="card p-0 border-[var(--gold-line)] overflow-hidden shadow-[var(--shadow-sm)]">
                <div className="bg-[var(--gold-soft)] px-5 py-3 border-b border-[var(--gold-line)] flex items-center justify-between">
                  <h3 className="font-serif text-[15px] font-bold text-[var(--gold-deep)] flex items-center gap-2"><Stethoscope className="w-[18px] h-[18px]" /> Kết quả khám lâm sàng</h3>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[var(--gold-50)]">
                  <Info label="Thị lực Mắt phải (MP)" value={selected.thiLucMP} />
                  <Info label="Thị lực Mắt trái (MT)" value={selected.thiLucMT} />
                  <Info label="Khuyến nghị điều trị" value={selected.khuyenNghi} />
                  <div className="md:col-span-3"><Info label="Chẩn đoán chi tiết" value={[...parseDiag(selected.chanDoan), selected.chanDoanKhac].filter(Boolean).join(", ")} /></div>
                </div>
              </div>

              <div className="card p-5 space-y-5">
                <h3 className="font-serif text-[16px] font-semibold text-[var(--ink)] flex items-center gap-2"><UserCog className="w-4 h-4 text-[var(--teal-deep)]" /> Tư vấn & phân nhóm</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <label className={labelCls}>BHYT <span className="font-normal text-[var(--mute)]">· tự động từ mã thẻ</span></label>
                    {f.bhyt ? (
                      <div className="input-field flex items-center justify-between gap-2 bg-[var(--surface-soft)]">
                        <span className="inline-flex items-center gap-2 min-w-0"><span className="font-bold text-[var(--teal-deep)]">{bhytLevel(f.bhyt) || "Không rõ"}</span>{isCardNumber(f.bhyt) && <span className="font-mono text-[11px] text-[var(--mute)] truncate">· thẻ {f.bhyt}</span>}</span>
                        <button type="button" onClick={() => setF((s) => ({ ...s, bhyt: "" }))} className="shrink-0 text-[var(--mute)] hover:text-[var(--rose)]"><X className="w-4 h-4" /></button>
                      </div>
                    ) : <Dropdown value="" placeholder="Chưa có thẻ — chọn mức hưởng…" options={[...BHYT]} onChange={(v) => setF((s) => ({ ...s, bhyt: v }))} />}
                  </div>
                  <div><label className={labelCls}>Số tiền báo</label><input inputMode="numeric" value={f.soTienBao} onChange={(e) => setF((s) => ({ ...s, soTienBao: e.target.value.replace(/[^\d]/g, "") }))} className="input-field font-mono" placeholder="VD: 5000000" /></div>
                  <div className="col-span-2"><label className={labelCls}>Phân nhóm</label><ChoiceRow options={[...NHOM]} value={f.nhom} onChange={(v) => setF((s) => ({ ...s, nhom: v, ngayHen: v === "A" && !s.ngayHen ? tomorrowISO() : s.ngayHen }))} render={(o) => (o === "A" ? "Nhóm A (Đồng ý mổ)" : "Nhóm B (Suy nghĩ thêm)")} /></div>
                  <div><label className={labelCls}>Ngày điều trị (ĐK mổ){f.nhom === "A" && <span className="text-[var(--rose)]"> *</span>}<span className="font-normal text-[var(--mute)]"> · mặc định ngày mai</span></label><DateField value={f.ngayHen} min={tomorrowISO()} onChange={(v) => setF((s) => ({ ...s, ngayHen: v }))} /></div>
                  <div className="grid grid-cols-[100px_1fr] gap-3 col-span-2 lg:col-span-1">
                    <div><label className={labelCls}>Giờ đón</label><Combobox value={f.gioDon} onChange={(v) => setF((s) => ({ ...s, gioDon: v }))} options={TIME_OPTS} placeholder="--:--" /></div>
                    <div><label className={labelCls}>Điểm đón</label><Combobox value={f.diemDon} onChange={(v) => setF((s) => ({ ...s, diemDon: v }))} options={uniqueDiemDon} placeholder="VD: Ngã ba xã / xe nhà…" /></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="shrink-0 border-t border-[var(--line)] px-6 py-3 flex items-center justify-between gap-4">
              <span className="text-[12px] flex items-center gap-2 min-w-0">{dirty ? <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--amber)]"><span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-pulse" /> Chưa lưu</span> : <span className="inline-flex items-center gap-1.5 text-[var(--mute)]"><Check className="w-3.5 h-3.5 text-[var(--teal)]" /> Đã lưu</span>}{selected.tuVanVien && <span className="text-[var(--mute)] truncate hidden md:inline">· Người chốt: <b>{selected.tuVanVien.hoTen}</b></span>}</span>
              <button onClick={save} disabled={saving || !dirty} className="btn btn-primary px-8 py-2.5 font-bold shrink-0">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[var(--teal)]" />} Lưu tư vấn</button>
            </div>
          </>) : <div className="flex-1 flex flex-col items-center justify-center text-[var(--mute)] text-center px-8 gap-2"><Stethoscope className="w-10 h-10 text-[var(--mute-soft)]" /><span className="text-[14px]">Chọn bệnh nhân trong hàng chờ để tư vấn & phân nhóm.</span></div>}
        </main>
      </div>
    </div>
  );
}
