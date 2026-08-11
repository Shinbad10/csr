"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import { Plus, Search, Calendar, CalendarDays, MapPin, Loader2, Check, X, Stethoscope, Pencil, FolderOpen, Lock, FileSpreadsheet } from "lucide-react";
import { can } from "@/lib/permissions";
import { fmtDate, fmtBuoiKhamName, fmtBuoiKhamCode, phaseOf } from "@/lib/csr";
import { Field, DateField } from "@/components/csr/fields";
import { SkeletonTable } from "@/components/layout/Skeleton";
import ImportExcelModal from "@/components/csr/ImportExcelModal";
import { useToast } from "@/components/providers/ToastProvider";

interface CoSo { id: string; ten: string }
interface BuoiKham {
  id: string; coSo: CoSo; coSoId: string; ngayKham: string; xa: string; diaDiem: string;
  bacSiKham?: string | null; ghiChu?: string | null; _count: { hoSo: number };
  stats?: { nhomA: number; nhomB: number; daMo: number; chuaMo: number };
}

/** Nút vào đợt khám theo pha ngày khám.
 *  Hôm nay = hành động chính; đã qua vẫn mở được để bổ sung/sửa hồ sơ; tương lai thì khoá. */
function JoinAction({ b, block }: { b: BuoiKham; block?: boolean }) {
  const p = phaseOf(b.ngayKham);
  const size = block ? "py-2 px-3 text-[13px] flex-1 justify-center" : "py-1.5 px-3 text-xs";
  if (p.key === "SapDienRa") {
    return (
      <span title={p.hint} className={`btn ${size} font-bold inline-flex border border-[var(--line)] bg-[var(--surface-soft)] text-[var(--mute)] cursor-not-allowed`}>
        <Lock className="w-3.5 h-3.5" /> Chưa mở
      </span>
    );
  }
  if (p.key === "DaKetThuc") {
    return (
      <Link href={`/kham/${b.id}`} title={`${p.hint} — mở để xem và bổ sung hồ sơ`} className={`btn btn-secondary ${size} font-bold inline-flex`}>
        <FolderOpen className="w-3.5 h-3.5 text-[var(--ink-soft)]" /> Xem hồ sơ
      </Link>
    );
  }
  return (
    <Link href={`/kham/${b.id}`} className={`btn btn-primary ${size} font-bold inline-flex`}>
      <Stethoscope className="w-3.5 h-3.5 text-[var(--teal)]" /> Tham gia khám
    </Link>
  );
}

/** A/B liền khối cho đọc như một cụm, thay vì hai thẻ rời rạc. */
function NhomChip({ a, b }: { a: number; b: number }) {
  return (
    <div className="inline-flex rounded-[var(--r-sm)] overflow-hidden border border-[var(--line)] font-mono text-[11.5px] font-bold">
      <span className="px-2 py-0.5 bg-[var(--rose-soft)] text-[var(--rose)]" title="Nhóm A — đã chỉ định mổ">A {a}</span>
      <span className="px-2 py-0.5 bg-[var(--amber-soft)] text-[var(--amber)] border-l border-[var(--line)]" title="Nhóm B — theo dõi">B {b}</span>
    </div>
  );
}

/** Tiến độ mổ dạng "đã mổ / cần mổ" kèm thanh — gọn và nói được tỉ lệ hơn 2 con số rời. */
function MoProgress({ done, waiting }: { done: number; waiting: number }) {
  const need = done + waiting;
  if (need === 0) return <span className="text-[var(--mute-soft)]">—</span>;
  const pct = Math.round((done / need) * 100);
  return (
    <div className="inline-flex flex-col items-center gap-1 min-w-[72px]" title={`Đã mổ ${done}/${need} ca chỉ định (${pct}%)`}>
      <span className="font-mono text-[11.5px] font-bold text-[var(--ink-soft)]">
        {done}<span className="text-[var(--mute-soft)] font-normal">/{need}</span>
      </span>
      <span className="w-full h-1 rounded-full bg-[var(--line)] overflow-hidden">
        <span className="block h-full bg-[var(--teal)] rounded-full" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

function readCosoCookie(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.split("; ").find((r) => r.startsWith("selected_coso_id="));
  return m ? m.split("=")[1] : "";
}

export default function BuoiKhamPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const canManage = can(session?.user?.role, "buoikham.manage");

  const [list, setList] = useState<BuoiKham[]>([]);
  const [cosos, setCosos] = useState<CoSo[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [coSoId, setCoSoId] = useState("");
  const [ngayKham, setNgayKham] = useState("");
  const [xa, setXa] = useState("");
  const [diaDiem, setDiaDiem] = useState("");
  const [bacSiKham, setBacSiKham] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  const [importOpen, setImportOpen] = useState(false);
  const [editModal, setEditModal] = useState<BuoiKham | null>(null);
  const [editXa, setEditXa] = useState("");
  const [editDiaDiem, setEditDiaDiem] = useState("");
  const [editGhiChu, setEditGhiChu] = useState("");
  const [editNgayKham, setEditNgayKham] = useState("");
  const [editBacSiKham, setEditBacSiKham] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState("");

  const openEditModal = (b: BuoiKham) => {
    setEditXa(b.xa || "");
    setEditDiaDiem(b.diaDiem || "");
    setEditGhiChu(b.ghiChu || "");
    setEditNgayKham(b.ngayKham ? new Date(b.ngayKham).toISOString().slice(0, 10) : "");
    setEditBacSiKham(b.bacSiKham || "");
    setEditErr("");
    setEditModal(b);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    setEditSaving(true);
    setEditErr("");
    try {
      const res = await fetch(`/api/csr/buoikham/${editModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xa: editXa,
          diaDiem: editDiaDiem,
          ghiChu: editGhiChu,
          ngayKham: editNgayKham || undefined,
          bacSiKham: editBacSiKham,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể lưu thông tin");
      }
      addToast({ type: "success", title: "Thành công", message: "Đã cập nhật thông tin đợt khám" });
      setEditModal(null);
      await load();
    } catch (err) {
      setEditErr(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setEditSaving(false);
    }
  };

  const load = useCallback(async () => {
    const [bk, cs] = await Promise.all([fetch("/api/csr/buoikham"), fetch("/api/csr/coso")]);
    if (bk.ok) setList(await bk.json());
    if (cs.ok) {
      const data: CoSo[] = await cs.json();
      setCosos(data);
      const active = readCosoCookie() || session?.user?.coSoId || data[0]?.id || "";
      setCoSoId(active);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { (async () => { await load(); })(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const res = await fetch("/api/csr/buoikham", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coSoId, ngayKham, xa, diaDiem, bacSiKham, ghiChu }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Không thể tạo"); return; }
      setOpen(false); setNgayKham(""); setXa(""); setDiaDiem(""); setBacSiKham(""); setGhiChu("");
      addToast({ type: "success", title: "Đã tạo đợt khám", message: `Xã ${data.xa}` });
      load();
    } catch { setErr("Mất kết nối máy chủ"); }
    finally { setSaving(false); }
  };

  const filtered = list.filter((b) =>
    [b.xa, b.diaDiem, b.ghiChu, b.coSo?.ten].some((s) => (s || "").toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-110px)]">
      <PageHeader
        title="Đợt khám tầm soát"
        description="Quản lý và tổ chức các đợt khám tầm soát tại cộng đồng."
        guide={[
          { selector: '[data-tour="bk-create"]', title: "Tổ chức đợt khám mới", desc: "Bấm nút này, nhập ngày khám, xã/phường, địa điểm rồi lưu (cần quyền quản lý)." },
          { selector: '[data-tour="bk-search"]', title: "Tìm đợt khám", desc: "Gõ vào đây để lọc nhanh theo xã, địa điểm hoặc tên bệnh viện." },
          { selector: '[data-tour="bk-table"]', title: "Theo dõi tiến độ", desc: "Cột SL BN, Phân nhóm (A/B) và Tiến độ mổ cho biết tình hình từng đợt khám." },
          { selector: '[data-tour="bk-join"]', title: "Vào khám bệnh nhân", desc: "Chỉ đợt khám diễn ra HÔM NAY mới bấm \"Tham gia khám\" được. Đợt đã kết thúc mở bằng \"Xem hồ sơ\" để bổ sung, đợt chưa tới ngày thì khoá." },
        ]}
        guideTip="Các số liệu trong bảng tự cập nhật theo dữ liệu khám thực tế."
        actions={
          canManage && (
            <>
              <button onClick={() => setImportOpen(true)} title="Nhập danh sách bệnh nhân các đợt khám cũ từ file Excel" className="btn btn-secondary px-3 py-2 font-bold text-[13px]">
                <FileSpreadsheet className="w-4 h-4 text-[var(--teal-deep)]" /> Nhập Excel
              </button>
              <button data-tour="bk-create" onClick={() => setOpen(true)} className="btn btn-primary px-4 py-2 font-bold text-[13px]">
                <Plus className="w-4 h-4" /> Tổ chức đợt khám
              </button>
            </>
          )
        }
      />

      <div className="flex-1 flex flex-col min-h-0 card p-0">
        <div className="bg-[var(--surface-bg)] border-b border-[var(--line-soft)] p-3.5">
          <div data-tour="bk-search" className="relative w-full sm:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo xã, địa điểm, bệnh viện…"
              className="input-field pl-9 bg-white" />
          </div>
        </div>

        <div data-tour="bk-table" className="flex-1 min-h-0 overflow-auto">
          {/* Mobile: danh sách thẻ (bảng 9 cột không dùng được trên điện thoại) */}
          <div className="md:hidden divide-y divide-[var(--line-soft)] bg-white">
            {loading ? (
              <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--navy)]" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-[var(--mute)] text-[13px]">Chưa có đợt khám nào.</div>
            ) : filtered.map((b) => (
              <div key={b.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-[14px] text-[var(--ink)]">{fmtBuoiKhamName(b)}</div>
                    <div className="font-mono text-[11px] font-bold text-[var(--navy)] mt-0.5">{fmtBuoiKhamCode(b.id)}</div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[var(--mute)]">
                      <Calendar className="w-3.5 h-3.5" /> {fmtDate(b.ngayKham)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10.5px] font-bold border ${phaseOf(b.ngayKham).cls}`}>
                      {phaseOf(b.ngayKham).label}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-[12px] text-[var(--ink-soft)]">
                  <MapPin className="w-3.5 h-3.5 text-[var(--mute)] shrink-0 mt-0.5" /><span className="leading-tight">{b.diaDiem}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 font-mono text-[11.5px] font-bold bg-[var(--navy-50)] text-[var(--navy)] rounded-[4px] border border-[var(--navy-100)]">{b._count?.hoSo ?? 0} BN</span>
                  <NhomChip a={b.stats?.nhomA ?? 0} b={b.stats?.nhomB ?? 0} />
                  <span className="px-1.5 py-0.5 font-mono text-[11.5px] font-bold bg-[var(--teal-soft)] text-[var(--teal-deep)] rounded-[4px] border border-[var(--teal)]/20 inline-flex items-center gap-1" title="Đã mổ / cần mổ">
                    <Check className="w-3 h-3 text-[var(--teal)]" /> {b.stats?.daMo ?? 0}/{(b.stats?.daMo ?? 0) + (b.stats?.chuaMo ?? 0)}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => openEditModal(b)}
                      className="btn btn-outline py-2 px-3 text-xs inline-flex items-center gap-1 font-semibold"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[var(--ink-soft)]" /> Sửa
                    </button>
                  )}
                  <JoinAction b={b} block />
                </div>
              </div>
            ))}
          </div>

          <table className="hidden md:table w-full min-w-[850px] text-left border-collapse">
            <thead className="bg-[var(--surface-soft)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mute)]">
              <tr className="[&>th]:whitespace-nowrap">
                <th className="py-3 px-3.5 border-b border-[var(--line)] w-[50px] text-center">STT</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)]">Đợt khám</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)]">Địa điểm</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)] text-center">SL BN</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)] text-center">Phân nhóm</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)] text-center">Tiến độ mổ</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)]">Ngày khám</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)] text-center">Trạng thái</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-[var(--ink-soft)] divide-y divide-[var(--line-soft)] bg-white">
              {loading ? (
                <SkeletonTable rows={5} cols={9} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center text-[var(--mute)]">Chưa có đợt khám nào.</td></tr>
              ) : filtered.map((b, i) => (
                <tr key={b.id} className={`transition-colors group ${phaseOf(b.ngayKham).key === "DangDienRa" ? "bg-[var(--teal-softer)] hover:bg-[var(--teal-soft)]" : "hover:bg-[var(--surface-soft)]"}`}>
                  <td className="py-3.5 px-3.5 text-center align-middle font-mono font-bold text-[var(--navy)] text-[11.5px]">
                    <span className="text-[var(--mute-soft)] font-normal">#</span>{String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                    <div className="font-bold text-[var(--ink)] group-hover:text-[var(--navy)] text-[13px]" title={fmtBuoiKhamName(b)}>{fmtBuoiKhamName(b)}</div>
                    <div className="font-mono text-[11px] font-bold text-[var(--navy)] mt-0.5">{fmtBuoiKhamCode(b.id)}</div>
                  </td>
                  <td className="py-3.5 px-3.5 align-middle">
                    <div className="flex items-start gap-1.5 max-w-[240px]"><MapPin className="w-3.5 h-3.5 text-[var(--mute)] shrink-0 mt-0.5" /><span className="text-[12px] leading-tight truncate" title={b.diaDiem}>{b.diaDiem}</span></div>
                  </td>
                  <td className="py-3.5 px-3.5 align-middle text-center font-mono font-bold text-[14px] text-[var(--navy)]">{b._count?.hoSo ?? 0}</td>
                  <td className="py-3.5 px-3.5 align-middle text-center">
                    <NhomChip a={b.stats?.nhomA ?? 0} b={b.stats?.nhomB ?? 0} />
                  </td>
                  <td className="py-3.5 px-3.5 align-middle text-center">
                    <MoProgress done={b.stats?.daMo ?? 0} waiting={b.stats?.chuaMo ?? 0} />
                  </td>
                  <td className="py-3.5 px-3.5 align-middle whitespace-nowrap"><div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[var(--mute)]" /><span className="font-mono text-xs">{fmtDate(b.ngayKham)}</span></div></td>
                  <td className="py-3.5 px-3.5 align-middle text-center whitespace-nowrap">
                    <span title={phaseOf(b.ngayKham).hint} className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${phaseOf(b.ngayKham).cls}`}>
                      {phaseOf(b.ngayKham).label}
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 align-middle whitespace-nowrap">
                    <div data-tour="bk-join" className="flex items-center justify-end gap-2">
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          className="btn btn-outline py-1.5 px-2.5 text-xs inline-flex items-center gap-1 hover:border-[var(--navy)]"
                          title="Chỉnh sửa đợt khám"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[var(--ink-soft)]" /> Sửa
                        </button>
                      )}
                      <JoinAction b={b} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="shrink-0 bg-[var(--surface-soft)] border-t border-[var(--line)] px-4 py-3 flex items-center justify-between gap-3 flex-wrap text-xs text-[var(--mute)] font-medium">
          <div>
            Hiển thị <span className="font-mono font-bold text-[var(--ink)]">{filtered.length > 0 ? 1 : 0}–{filtered.length}</span> trong tổng số <span className="font-mono font-bold text-[var(--ink)]">{list.length}</span> đợt khám
          </div>
          <div className="flex items-center gap-1 font-mono">
            <button disabled className="w-7 h-7 rounded flex items-center justify-center border border-[var(--line)] bg-white text-[var(--mute)] disabled:opacity-40">&lt;</button>
            <button className="w-7 h-7 rounded flex items-center justify-center bg-[var(--navy)] text-white font-bold text-xs">1</button>
            <button disabled className="w-7 h-7 rounded flex items-center justify-center border border-[var(--line)] bg-white text-[var(--mute)] disabled:opacity-40">&gt;</button>
          </div>
        </div>
      </div>

      <ImportExcelModal open={importOpen} onClose={() => setImportOpen(false)} onDone={() => { setImportOpen(false); load(); }} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tổ chức đợt khám mới"
        subtitle="Tạo lịch khám tầm soát cộng đồng tại cơ sở y tế"
        icon={CalendarDays}
        maxWidth="max-w-[600px]"
        noPadding
      >
        <form onSubmit={create} className="p-4 sm:p-7 space-y-5 bg-white">
          {err && (
            <div className="p-3.5 bg-[var(--rose-soft)] border border-[var(--rose)]/30 rounded-xl text-[13px] font-semibold text-[var(--rose)] flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" /> {err}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Ngày khám" required>
              <DateField value={ngayKham} onChange={setNgayKham} placeholder="dd/mm/yyyy" />
            </Field>
            <Field label="Xã / phường" required>
              <input value={xa} onChange={(e) => setXa(e.target.value)} required className="input-field h-10" placeholder="VD: Vĩnh Thạnh" />
            </Field>
          </div>

          <Field label="Địa điểm khám (= Điểm khám trên phiếu)" required>
            <input value={diaDiem} onChange={(e) => setDiaDiem(e.target.value)} required className="input-field h-10" placeholder="VD: Trạm y tế / UBND xã…" />
          </Field>

          <Field label="Ghi chú đợt khám">
            <textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={3} className="input-field resize-none py-2.5" placeholder="Ghi chú thêm về công tác chuẩn bị, nhân sự..." />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line-soft)] mt-6">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary px-6 py-2.5 font-bold h-11 rounded-xl">Hủy bỏ</button>
            <button type="submit" disabled={saving || !ngayKham || !xa || !diaDiem} className="btn btn-primary px-8 py-2.5 font-bold h-11 rounded-xl shadow-lg">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-[var(--teal)] stroke-[3]" />} Tạo đợt khám
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title="Chỉnh sửa thông tin Đợt khám"
        subtitle={`Cập nhật thông tin cho đợt khám ${fmtBuoiKhamCode(editModal?.id)}`}
        icon={Pencil}
        maxWidth="max-w-[600px]"
        noPadding
      >
        <form onSubmit={handleSaveEdit} className="p-4 sm:p-7 space-y-5 bg-white">
          {editErr && (
            <div className="p-3.5 bg-[var(--rose-soft)] border border-[var(--rose)]/30 rounded-xl text-[13px] font-semibold text-[var(--rose)] flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" /> {editErr}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Ngày khám" required>
              <DateField value={editNgayKham} onChange={setEditNgayKham} placeholder="dd/mm/yyyy" />
            </Field>
            <Field label="Xã / phường" required>
              <input value={editXa} onChange={(e) => setEditXa(e.target.value)} required className="input-field h-10" placeholder="VD: Vĩnh Thạnh" />
            </Field>
          </div>

          <Field label="Địa điểm khám (= Điểm khám trên phiếu)" required>
            <input value={editDiaDiem} onChange={(e) => setEditDiaDiem(e.target.value)} required className="input-field h-10" placeholder="VD: Trạm y tế / UBND xã…" />
          </Field>

          <Field label="Ghi chú đợt khám (Tên hiển thị)">
            <textarea value={editGhiChu} onChange={(e) => setEditGhiChu(e.target.value)} rows={3} className="input-field resize-none py-2.5" placeholder="Ghi chú thêm hoặc tên đợt khám cụ thể..." />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line-soft)] mt-6">
            <button type="button" onClick={() => setEditModal(null)} className="btn btn-secondary px-6 py-2.5 font-bold h-11 rounded-xl">Hủy bỏ</button>
            <button type="submit" disabled={editSaving || !editNgayKham || !editXa || !editDiaDiem} className="btn btn-primary px-8 py-2.5 font-bold h-11 rounded-xl shadow-lg">
              {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-[var(--teal)] stroke-[3]" />} Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

