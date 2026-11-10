"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Pill, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/layout/Modal";
import { useToast } from "@/components/providers/ToastProvider";
import type { ThuocToa } from "@/lib/csr";

const O_NHAP =
  "w-full h-8 px-2 rounded-[6px] border border-[var(--line-strong)] bg-[var(--surface)] text-[13px] text-[var(--ink)] placeholder:text-[var(--mute)] outline-none focus:border-[var(--navy)] focus:shadow-[0_0_0_3px_var(--navy-50)]";
const NUT_ICON =
  "w-7 h-7 inline-flex items-center justify-center rounded-[6px] text-[var(--mute)] hover:text-[var(--navy)] hover:bg-[var(--navy-50)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer";

const DONG_TRONG: ThuocToa = { ten: "", soLuong: "", cachDung: "" };

/**
 * Toa thuốc mặc định của CƠ SỞ ĐANG LÀM VIỆC (chọn ở thanh trên cùng): in kèm phiếu khám
 * của mọi đợt khám thuộc cơ sở. Muốn sửa toa cơ sở khác thì đổi cơ sở làm việc.
 */
export default function ToaThuocModal({
  open,
  onClose,
  coSoId,
  cosos,
}: {
  open: boolean;
  onClose: () => void;
  coSoId: string;
  cosos: { id: string; ten: string }[];
}) {
  const { addToast } = useToast();
  const cs = coSoId;
  const [thuoc, setThuoc] = useState<ThuocToa[]>([]);
  const [loiDan, setLoiDan] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !cs) return;
    let huy = false;
    fetch(`/api/csr/coso/${encodeURIComponent(cs)}/toa-thuoc`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject((await r.json().catch(() => null))?.error || `Lỗi HTTP ${r.status}`)))
      .then((d: { thuoc: ThuocToa[]; loiDan: string }) => {
        if (huy) return;
        setThuoc(d.thuoc.length ? d.thuoc : [{ ...DONG_TRONG }]);
        setLoiDan(d.loiDan || "");
      })
      .catch((e) => !huy && addToast({ type: "error", message: String(e) }))
      .finally(() => !huy && setLoading(false));
    return () => {
      huy = true;
    };
  }, [open, cs, addToast]);

  const sua = (i: number, k: keyof ThuocToa, v: string) => setThuoc((ds) => ds.map((t, j) => (j === i ? { ...t, [k]: v } : t)));
  const doiCho = (i: number, j: number) =>
    setThuoc((ds) => {
      const x = [...ds];
      [x[i], x[j]] = [x[j], x[i]];
      return x;
    });

  const luu = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/csr/coso/${encodeURIComponent(cs)}/toa-thuoc`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thuoc: thuoc.filter((t) => t.ten.trim()), loiDan }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) throw new Error(d?.error || `Lỗi HTTP ${res.status}`);
      addToast({ type: "success", message: `Đã lưu toa thuốc (${d.thuoc.length} thuốc) — phiếu khám in ra sẽ kèm toa này` });
      onClose();
    } catch (e) {
      addToast({ type: "error", message: e instanceof Error ? e.message : "Lỗi lưu toa thuốc" });
    } finally {
      setSaving(false);
    }
  };

  const tenCs = cosos.find((c) => c.id === cs)?.ten || cs;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Toa thuốc mặc định"
      subtitle={`In kèm phiếu khám của mọi đợt khám thuộc ${tenCs}`}
      icon={Pill}
      maxWidth="max-w-[1040px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary h-9 px-4 text-[13px] font-semibold">
            Huỷ
          </button>
          <button type="button" onClick={luu} disabled={saving || loading || !cs} className="btn btn-primary h-9 px-4 text-[13px] font-semibold disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Lưu toa thuốc
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-[13px] text-[var(--mute)]">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải toa thuốc…
          </div>
        ) : (
          <>
            <div className="rounded-[10px] border border-[var(--line)] overflow-hidden">
              <div className="hidden sm:grid grid-cols-[28px_minmax(0,1.2fr)_minmax(0,0.5fr)_minmax(0,2.3fr)_96px] gap-2 px-3 py-2 bg-[var(--surface-soft)] border-b border-[var(--line)] font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--mute)]">
                <span>#</span>
                <span>Tên thuốc</span>
                <span>Số lượng</span>
                <span>Cách dùng</span>
                <span />
              </div>
              {thuoc.map((t, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[28px_minmax(0,1fr)_88px] sm:grid-cols-[28px_minmax(0,1.2fr)_minmax(0,0.5fr)_minmax(0,2.3fr)_96px] gap-2 px-3 py-2 border-b border-[var(--line-soft)] last:border-b-0 items-start"
                >
                  <span className="font-mono text-[12px] font-bold text-[var(--navy)] pt-1.5 tabular-nums">{i + 1}.</span>
                  <input value={t.ten} onChange={(e) => sua(i, "ten", e.target.value)} placeholder="VD: Natriclorid 0.9%" aria-label={`Tên thuốc ${i + 1}`} className={O_NHAP} />
                  <div className="sm:hidden flex items-center justify-end gap-0.5 row-span-3">
                    <button type="button" className={NUT_ICON} onClick={() => doiCho(i, i - 1)} disabled={i === 0} aria-label="Lên trên"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button type="button" className={NUT_ICON} onClick={() => doiCho(i, i + 1)} disabled={i === thuoc.length - 1} aria-label="Xuống dưới"><ArrowDown className="w-3.5 h-3.5" /></button>
                    <button type="button" className={`${NUT_ICON} hover:!text-[var(--rose)]`} onClick={() => setThuoc((ds) => ds.filter((_, j) => j !== i))} aria-label="Xoá thuốc"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <input value={t.soLuong} onChange={(e) => sua(i, "soLuong", e.target.value)} placeholder="VD: 1 lọ" aria-label={`Số lượng thuốc ${i + 1}`} className={`${O_NHAP} col-start-2 sm:col-start-auto`} />
                  <input value={t.cachDung} onChange={(e) => sua(i, "cachDung", e.target.value)} placeholder="VD: Nhỏ 2 mắt, ngày 3–4 lần, mỗi lần 1 giọt" aria-label={`Cách dùng thuốc ${i + 1}`} className={`${O_NHAP} col-start-2 sm:col-start-auto`} />
                  <div className="hidden sm:flex items-center justify-end gap-0.5">
                    <button type="button" className={NUT_ICON} onClick={() => doiCho(i, i - 1)} disabled={i === 0} aria-label="Lên trên" title="Lên trên"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button type="button" className={NUT_ICON} onClick={() => doiCho(i, i + 1)} disabled={i === thuoc.length - 1} aria-label="Xuống dưới" title="Xuống dưới"><ArrowDown className="w-3.5 h-3.5" /></button>
                    <button type="button" className={`${NUT_ICON} hover:!text-[var(--rose)]`} onClick={() => setThuoc((ds) => ds.filter((_, j) => j !== i))} aria-label="Xoá thuốc" title="Xoá"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
              {thuoc.length === 0 && <div className="px-3 py-4 text-[12.5px] text-[var(--mute)]">Chưa có thuốc nào — phiếu khám sẽ in dòng trống để bác sĩ ghi tay.</div>}
            </div>
            <button
              type="button"
              onClick={() => setThuoc((ds) => [...ds, { ...DONG_TRONG }])}
              disabled={thuoc.length >= 30}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-dashed border-[var(--line-strong)] text-[12.5px] font-semibold text-[var(--navy)] hover:bg-[var(--navy-50)] cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm thuốc
            </button>

            <label className="block">
              <span className="block text-[12px] font-semibold text-[var(--ink-soft)] mb-1">Lời dặn mặc định</span>
              <textarea
                value={loiDan}
                onChange={(e) => setLoiDan(e.target.value)}
                rows={3}
                placeholder="VD: Tái khám sau 1 tháng hoặc khi mắt đỏ, nhức, nhìn mờ tăng."
                className="w-full px-2.5 py-2 rounded-[6px] border border-[var(--line-strong)] bg-[var(--surface)] text-[13px] text-[var(--ink)] placeholder:text-[var(--mute)] outline-none focus:border-[var(--navy)] resize-y"
              />
              <span className="block mt-1 text-[11.5px] text-[var(--mute)]">Để trống thì phiếu khám in dòng chấm để bác sĩ ghi tay.</span>
            </label>
          </>
        )}
      </div>
    </Modal>
  );
}
