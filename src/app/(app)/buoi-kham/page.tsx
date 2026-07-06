"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import { Plus, Search, Calendar, CalendarDays, MapPin, Loader2, Check, X, Stethoscope } from "lucide-react";
import { can } from "@/lib/permissions";
import { fmtDate } from "@/lib/csr";
import { Field, DateField } from "@/components/csr/fields";
import { SkeletonTable } from "@/components/layout/Skeleton";
import { useToast } from "@/components/providers/ToastProvider";

interface CoSo { id: string; ten: string }
interface BuoiKham {
  id: string; coSo: CoSo; coSoId: string; ngayKham: string; xa: string; diaDiem: string;
  ghiChu?: string | null; _count: { hoSo: number };
  stats?: { nhomA: number; nhomB: number; daMo: number; chuaMo: number };
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
  const [ghiChu, setGhiChu] = useState("");

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
        body: JSON.stringify({ coSoId, ngayKham, xa, diaDiem, ghiChu }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Không thể tạo"); return; }
      setOpen(false); setNgayKham(""); setXa(""); setDiaDiem(""); setGhiChu("");
      addToast({ type: "success", title: "Đã tạo đợt khám", message: `Xã ${data.xa}` });
      load();
    } catch { setErr("Mất kết nối máy chủ"); }
    finally { setSaving(false); }
  };

  const filtered = list.filter((b) =>
    [b.xa, b.diaDiem, b.coSo?.ten].some((s) => (s || "").toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="h-[calc(100vh-110px)] flex flex-col gap-4">
      <PageHeader
        title="Đợt khám tầm soát"
        description="Quản lý và tổ chức các đợt khám tầm soát tại cộng đồng."
        guide={[
          { selector: '[data-tour="bk-create"]', title: "Tổ chức đợt khám mới", desc: "Bấm nút này, nhập ngày khám, xã/phường, địa điểm rồi lưu (cần quyền quản lý)." },
          { selector: '[data-tour="bk-search"]', title: "Tìm đợt khám", desc: "Gõ vào đây để lọc nhanh theo xã, địa điểm hoặc tên bệnh viện." },
          { selector: '[data-tour="bk-table"]', title: "Theo dõi tiến độ", desc: "Cột SL BN, Phân nhóm (A/B) và Trạng thái mổ cho biết tình hình từng đợt khám." },
          { selector: '[data-tour="bk-join"]', title: "Vào khám bệnh nhân", desc: "Bấm \"Tham gia khám\" ở cột thao tác để tiếp nhận và khám cho đợt khám đó." },
        ]}
        guideTip="Các số liệu trong bảng tự cập nhật theo dữ liệu khám thực tế."
        actions={
          canManage && (
            <button data-tour="bk-create" onClick={() => setOpen(true)} className="btn btn-primary px-4 py-2 font-bold text-[13px]">
              <Plus className="w-4 h-4" /> Tổ chức đợt khám
            </button>
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

        <div className="overflow-x-auto">
          <table data-tour="bk-table" className="w-full text-left border-collapse">
            <thead className="bg-[var(--surface-soft)] text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mute)]">
              <tr>
                <th className="py-3 px-3.5 border-b border-[var(--line)] w-[50px] text-center">STT</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)]">Đợt khám</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)]">Bệnh viện</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)]">Địa điểm</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)] text-center">SL BN</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)] text-center">Phân nhóm</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)] text-center">Trạng thái mổ</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)]">Ngày khám</th>
                <th className="py-3 px-3.5 border-b border-[var(--line)] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-[var(--ink-soft)] divide-y divide-[var(--line-soft)] bg-white">
              {loading ? (
                <SkeletonTable rows={5} cols={9} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center text-[var(--mute)]">Chưa có đợt khám nào.</td></tr>
              ) : filtered.map((b, i) => (
                <tr key={b.id} className="hover:bg-[var(--surface-soft)] transition-colors group">
                  <td className="py-3.5 px-3.5 text-center align-middle font-mono font-bold text-[var(--navy)] text-[11.5px]">
                    <span className="text-[var(--mute-soft)] font-normal">#</span>{String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="py-3.5 px-3.5 align-middle">
                    <div className="font-bold text-[var(--ink)] group-hover:text-[var(--navy)] text-[13px]">BV - Xã {b.xa}</div>
                    <div className="font-mono text-[11px] font-bold text-[var(--navy)] mt-0.5"><span className="text-[var(--mute-soft)] font-normal">ĐK-</span>{b.id.slice(0, 8).toUpperCase()}</div>
                  </td>
                  <td className="py-3.5 px-3.5 align-middle font-semibold text-[var(--navy)] text-xs">{b.coSo?.ten}</td>
                  <td className="py-3.5 px-3.5 align-middle">
                    <div className="flex items-start gap-1.5 max-w-[200px]"><MapPin className="w-3.5 h-3.5 text-[var(--mute)] shrink-0 mt-0.5" /><span className="text-[12px] leading-tight truncate" title={b.diaDiem}>{b.diaDiem}</span></div>
                  </td>
                  <td className="py-3.5 px-3.5 align-middle text-center font-mono font-bold text-[14px] text-[var(--navy)]">{b._count?.hoSo ?? 0}</td>
                  <td className="py-3.5 px-3.5 align-middle text-center">
                    <div className="inline-flex items-center gap-1.5 font-mono text-[11.5px] font-bold">
                      <span className="px-1.5 py-0.5 bg-[var(--rose-soft)] text-[var(--rose)] rounded-[4px] border border-[var(--rose)]/20" title="Nhóm A (chỉ định mổ)">
                        A: {b.stats?.nhomA ?? 0}
                      </span>
                      <span className="px-1.5 py-0.5 bg-[var(--amber-soft)] text-[var(--amber)] rounded-[4px] border border-[var(--amber)]/20" title="Nhóm B (theo dõi)">
                        B: {b.stats?.nhomB ?? 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3.5 align-middle text-center">
                    <div className="inline-flex items-center gap-1.5 font-mono text-[11.5px] font-bold">
                      <span className="px-1.5 py-0.5 bg-[var(--teal-soft)] text-[var(--teal-deep)] rounded-[4px] border border-[var(--teal)]/20 flex items-center gap-1" title="Đã phẫu thuật">
                        <Check className="w-3 h-3 text-[var(--teal)]" /> {b.stats?.daMo ?? 0}
                      </span>
                      <span className="px-1.5 py-0.5 bg-[var(--surface-soft)] text-[var(--mute)] rounded-[4px] border border-[var(--line)]" title="Chưa phẫu thuật / Chờ mổ">
                        Chờ: {b.stats?.chuaMo ?? 0}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3.5 align-middle"><div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[var(--mute)]" /><span className="font-mono text-xs">{fmtDate(b.ngayKham)}</span></div></td>
                  <td className="py-3.5 px-3.5 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <Link data-tour="bk-join" href={`/kham/${b.id}`} className="btn btn-primary py-1.5 px-3 text-xs font-bold inline-flex">
                        <Stethoscope className="w-3.5 h-3.5 text-[var(--teal)]" /> Tham gia khám
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-[var(--surface-soft)] border-t border-[var(--line)] px-4 py-3 flex items-center justify-between text-xs text-[var(--mute)] font-medium">
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tổ chức đợt khám mới"
        subtitle="Tạo lịch khám tầm soát cộng đồng tại cơ sở y tế"
        icon={CalendarDays}
        maxWidth="max-w-[600px]"
        noPadding
      >
        <form onSubmit={create} className="p-7 space-y-5 bg-white">
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

          <Field label="Địa điểm khám" required>
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
    </div>
  );
}
