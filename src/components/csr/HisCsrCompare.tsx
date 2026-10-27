"use client";

import React from "react";
import { Check, X, Minus, ShieldQuestion, CheckCircle2, RefreshCw, MapPin } from "lucide-react";
import Modal from "@/components/layout/Modal";
import { fmtDate } from "@/lib/csr";

// Dữ liệu đối chiếu HIS không có schema cố định — dùng bản ghi mở.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HisRow = Record<string, any>;

type KetQua = "khop" | "lech" | "thieu";

/* ── Chuẩn hoá để so (cùng quy tắc với máy chủ: bỏ dấu, CCCD bù số 0 đầu, SĐT 9 số cuối) ── */
const boDau = (s?: string | null) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
const soCccd = (s?: string | null) => {
  const d = (s || "").replace(/\D/g, "");
  return d.length === 10 || d.length === 11 ? d.padStart(12, "0") : d;
};
const soDt = (s?: string | null) => {
  const d = (s || "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : "";
};
/** "dd/mm/yyyy" của ngày sinh CSR (lưu 00:00 UTC) — đủ 2 chữ số như HIS, để "4/4/1956" không bị coi là lệch "04/04/1956". */
const ngaySinhCsr = (v?: string | null) => {
  if (!v) return "";
  const t = new Date(v);
  if (Number.isNaN(t.getTime())) return "";
  const iso = t.toISOString().slice(0, 10);
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
};

function so(a: string, b: string): KetQua {
  if (!a || !b) return "thieu";
  return a === b ? "khop" : "lech";
}

/** Danh sách trường so sánh HIS ↔ CSR cho một dòng. */
export function compareRows(r: HisRow) {
  const m = r.matchedCsr || {};
  const nsHis = r.ngaySinh || "";
  const nsCsr = ngaySinhCsr(m.ngaySinh);
  // Có ngày sinh đầy đủ cả hai bên thì so cả ngày; không thì so năm sinh
  const ns =
    nsHis && nsCsr
      ? so(nsHis, nsCsr)
      : so(String(r.namSinh || "").trim(), String(m.namSinh || "").trim());
  return [
    { k: "Họ tên", his: r.hoTen, csr: m.hoTen, kq: so(boDau(r.hoTen), boDau(m.hoTen)) },
    { k: "Ngày sinh", his: nsHis || r.namSinh, csr: nsCsr || m.namSinh, kq: ns },
    { k: "CCCD", his: r.cccd, csr: m.cccd, kq: so(soCccd(r.cccd), soCccd(m.cccd)), mono: true },
    { k: "SĐT", his: r.sdt, csr: m.sdt, kq: so(soDt(r.sdt), soDt(m.sdt)), mono: true },
    { k: "Địa chỉ", his: r.diaChi, csr: m.diaChi, kq: "thieu" as KetQua, chiXem: true },
  ];
}

const DAU: Record<KetQua, { icon: typeof Check; cls: string; nhan: string }> = {
  khop: { icon: Check, cls: "text-[var(--teal-deep)] bg-[var(--teal-soft)]", nhan: "Khớp" },
  lech: { icon: X, cls: "text-[var(--rose)] bg-[var(--rose-soft)]", nhan: "Lệch" },
  thieu: { icon: Minus, cls: "text-[var(--mute)] bg-[var(--surface-soft)]", nhan: "Thiếu" },
};

function Dau({ kq }: { kq: KetQua }) {
  const d = DAU[kq];
  const Icon = d.icon;
  return (
    <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${d.cls}`} title={d.nhan}>
      <Icon className="h-2.5 w-2.5" strokeWidth={3} />
    </span>
  );
}

/* Hai cột HIS và CSR trong bảng dùng CÙNG khung dòng (5 dòng, cao bằng nhau) để mắt so ngang
   từng trường mà không phải dò. */
const DONG = "flex h-[18px] items-center gap-1.5 min-w-0";

/** Cột "Bệnh nhân trên HIS": tên · ngày sinh · CCCD · SĐT · địa chỉ. */
export function HisSideCell({ r }: { r: HisRow }) {
  const age = r.namSinh ? new Date().getFullYear() - Number(r.namSinh) : null;
  return (
    <div className="min-w-0 text-[11.5px] text-[var(--ink-soft)]">
      <div className={DONG}>
        <span className="truncate text-[13px] font-semibold text-[var(--ink)]">{r.hoTen}</span>
      </div>
      <div className={DONG}>
        <span className="font-mono">{r.ngaySinh || r.namSinh || "—"}</span>
        {age ? <span className="text-[var(--mute)]">· {age} tuổi</span> : null}
      </div>
      <div className={`${DONG} font-mono`}>{r.cccd || <span className="text-[var(--mute-soft)]">—</span>}</div>
      <div className={`${DONG} font-mono`}>{r.sdt || <span className="text-[var(--mute-soft)]">—</span>}</div>
      <div className={`${DONG} text-[10.5px] text-[var(--mute)]`} title={r.diaChi || undefined}>
        <span className="truncate">{r.diaChi || "—"}</span>
      </div>
    </div>
  );
}

/** Cột "Hồ sơ CSR": cùng 4 trường như HIS, mỗi trường có dấu khớp / lệch; dòng cuối là cách khớp + lần khám. */
export function CsrSideCell({ r }: { r: HisRow }) {
  const m = r.matchedCsr;
  const [ten, ns, cccd, sdt] = compareRows(r);
  const isPartial = m.matchType === "partial" || m.isKhuyetCccd;
  const isSecondEye = Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
  const val = (x: { kq: KetQua }, content: React.ReactNode, mono = false) => (
    <div className={DONG}>
      <Dau kq={x.kq} />
      <span className={`truncate ${mono ? "font-mono" : ""} ${x.kq === "lech" ? "text-[var(--rose)] font-semibold" : ""}`}>{content}</span>
    </div>
  );
  return (
    <div className="min-w-0 text-[11.5px] text-[var(--ink-soft)]">
      <div className={DONG}>
        <Dau kq={ten.kq} />
        <span className={`truncate text-[13px] font-semibold ${ten.kq === "lech" ? "text-[var(--rose)]" : "text-[var(--ink)]"}`}>{m.hoTen}</span>
        <span className="shrink-0 font-mono text-[11px] font-bold text-[var(--navy)]">{m.maBN}</span>
      </div>
      {val(ns, ns.csr || "—", true)}
      {val(cccd, m.cccd || "—", true)}
      {val(sdt, m.sdt || "—", true)}
      <div className={`${DONG} text-[10.5px] text-[var(--mute)]`}>
        <span
          className={`shrink-0 rounded px-1 font-bold ${
            isPartial ? "bg-[var(--amber-soft)] text-[var(--amber-deep)]" : "bg-[var(--teal-soft)] text-[var(--teal-deep)]"
          }`}
          title={isPartial ? "Thiếu CCCD ở HIS hoặc CSR — chỉ khớp Họ tên + Năm sinh, cần xác nhận" : undefined}
        >
          {isPartial ? "Tên + NS" : m.matchReason?.replace(/^Khớp\s*/, "") || "Khớp"}
        </span>
        <span className="truncate">
          Khám {m.buoiKham?.ngayKham ? fmtDate(m.buoiKham.ngayKham) : "—"} · {m.buoiKham?.xa || m.buoiKham?.diaDiem || "—"}
          {isSecondEye && <b className="text-[#7c3aed]"> · Mắt 2</b>}
        </span>
      </div>
    </div>
  );
}

/** Hộp thoại xác nhận: HIS và CSR đặt cạnh nhau, đủ thông tin để quyết định đúng người. */
export function HisCsrCompareModal({
  row,
  onClose,
  onConfirm,
  loading,
}: {
  row: HisRow | null;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  if (!row) return null;
  const m = row.matchedCsr || {};
  const rows = compareRows(row);
  const soLech = rows.filter((x) => x.kq === "lech").length;
  const soKhop = rows.filter((x) => x.kq === "khop").length;
  const extra = [
    {
      k: "Khám / mổ",
      his: `${row.loaiPT || "Phẫu thuật"} ${row.tenDichVu ? `· ${row.tenDichVu}` : ""}${row.matMo ? ` · ${row.matMo}` : ""}`,
      csr: `Khám ${m.buoiKham?.ngayKham ? fmtDate(m.buoiKham.ngayKham) : "—"}${m.matKham ? ` · ${m.matKham}` : ""}`,
    },
    {
      k: "Ngày / nơi",
      his: `Mổ ${row.ngayMoLocal ? fmtDate(String(row.ngayMoLocal).slice(0, 10)) : "—"}${row.phongMo ? ` · ${row.phongMo}` : ""}`,
      csr: m.buoiKham?.xa || m.buoiKham?.diaDiem || "—",
    },
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title="Xác nhận đúng bệnh nhân"
      subtitle="Chỉ khớp Họ tên + Năm sinh — kiểm tra từng trường trước khi ghi nhận đã mổ"
      icon={ShieldQuestion}
      maxWidth="max-w-[760px]"
      noPadding
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="text-[12px] text-[var(--mute)]">
            <b className="text-[var(--teal-deep)]">{soKhop} khớp</b>
            {soLech > 0 && <b className="text-[var(--rose)]"> · {soLech} lệch</b>}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn btn-secondary h-9 px-4 rounded-lg text-[13px] font-semibold">
              Huỷ
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white bg-[var(--teal-deep)] hover:bg-[var(--teal)] inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Đúng người — xác nhận đã mổ
            </button>
          </div>
        </div>
      }
    >
      <div className="p-5">
        <table className="w-full text-[13px] border-separate border-spacing-0">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-wider text-[var(--mute)]">
              <th className="w-[110px] pb-2 text-left font-bold"></th>
              <th className="pb-2 text-left font-bold">
                HIS <span className="font-mono normal-case text-[var(--navy)]">{row.maHIS}</span>
              </th>
              <th className="w-[34px] pb-2"></th>
              <th className="pb-2 text-left font-bold">
                CSR <span className="font-mono normal-case text-[var(--navy)]">{m.maBN}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.k} className={x.kq === "lech" ? "bg-[var(--rose-soft)]/40" : ""}>
                <td className="border-t border-[var(--line-soft)] py-2 pr-2 text-[12px] font-semibold text-[var(--mute)]">{x.k}</td>
                <td className={`border-t border-[var(--line-soft)] py-2 pr-2 text-[var(--ink)] ${x.mono ? "font-mono" : ""}`}>{x.his || <span className="text-[var(--mute-soft)]">—</span>}</td>
                <td className="border-t border-[var(--line-soft)] py-2 text-center">{!x.chiXem && <Dau kq={x.kq} />}</td>
                <td className={`border-t border-[var(--line-soft)] py-2 pl-2 text-[var(--ink)] ${x.mono ? "font-mono" : ""}`}>{x.csr || <span className="text-[var(--mute-soft)]">—</span>}</td>
              </tr>
            ))}
            {extra.map((x) => (
              <tr key={x.k}>
                <td className="border-t border-[var(--line-soft)] py-2 pr-2 text-[12px] font-semibold text-[var(--mute)]">{x.k}</td>
                <td className="border-t border-[var(--line-soft)] py-2 pr-2 text-[12.5px] text-[var(--ink-soft)]">{x.his}</td>
                <td className="border-t border-[var(--line-soft)]"></td>
                <td className="border-t border-[var(--line-soft)] py-2 pl-2 text-[12.5px] text-[var(--ink-soft)]">{x.csr}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {soLech > 0 && (
          <p className="mt-3 rounded-lg bg-[var(--rose-soft)] px-3 py-2 text-[12px] text-[var(--rose)]">
            Có {soLech} trường lệch — chỉ xác nhận khi chắc chắn là cùng một người (vd. CSR gõ sai số, HIS đổi SĐT).
          </p>
        )}
      </div>
    </Modal>
  );
}

/* ───────────── Danh sách ca cần xác nhận ngay sau khi đối chiếu (bảng tiến trình) ───────────── */

export interface XacNhanEntry {
  dot: string;
  x: import("@/lib/hisReconcile").XacNhanItem;
}

/** Hai cột HIS ↔ CSR cho từng ca, xác nhận tại chỗ — khỏi sang trang Đối chiếu dữ liệu HIS. */
export function XacNhanListModal({ entries, onClose }: { entries: XacNhanEntry[]; onClose: () => void }) {
  const [state, setState] = React.useState<Record<string, "dang" | "xong" | string>>({});
  if (entries.length === 0) return null;
  const xong = Object.values(state).filter((v) => v === "xong").length;

  const xacNhan = async ({ x }: XacNhanEntry) => {
    setState((s) => ({ ...s, [x.hoSoId]: "dang" }));
    try {
      const res = await fetch("/api/his/link-reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoSoId: x.hoSoId,
          maHIS: x.his.maHIS,
          ngayMo: x.ngayMo,
          tenDichVu: x.tenDichVu,
          loaiPT: x.loaiPT,
          confirmed: true,
          isKhuyetCccd: true,
        }),
      });
      const d = await res.json().catch(() => null);
      setState((s) => ({ ...s, [x.hoSoId]: res.ok ? "xong" : d?.error || `Lỗi HTTP ${res.status}` }));
    } catch {
      setState((s) => ({ ...s, [x.hoSoId]: "Mất kết nối máy chủ" }));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Ca cần xác nhận"
      subtitle="Có ca mổ trên HIS nhưng chỉ khớp Họ tên + Năm sinh (một bên thiếu CCCD) — so từng trường rồi xác nhận"
      icon={ShieldQuestion}
      maxWidth="max-w-[1180px]"
      noPadding
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <span className="text-[12px] text-[var(--mute)]">
            Đã xác nhận <b className="font-mono text-[var(--teal-deep)]">{xong}</b>/<span className="font-mono">{entries.length}</span> ca
          </span>
          <button type="button" onClick={onClose} className="btn btn-secondary h-9 px-4 rounded-lg text-[13px] font-semibold">
            Đóng
          </button>
        </div>
      }
    >
      <div className="max-h-[72vh] overflow-y-auto custom-scrollbar bg-[var(--surface-soft)] p-4 space-y-3">
        {entries.map((e) => {
          const { x } = e;
          const st = state[x.hoSoId];
          const r: HisRow = {
            hoTen: x.his.hoTen,
            namSinh: x.his.namSinh,
            cccd: x.his.cccd,
            sdt: x.his.sdt,
            diaChi: x.his.diaChi,
            ngaySinh: "",
            matchedCsr: { ...x.csr, maBN: x.maBN },
          };
          // Địa chỉ chỉ để đối chiếu bằng mắt (cách ghi HIS/CSR khác nhau nên không chấm khớp/lệch)
          const fields = compareRows(r);
          const lech = fields.filter((c) => !c.chiXem && c.kq === "lech").length;
          const khop = fields.filter((c) => !c.chiXem && c.kq === "khop").length;
          const done = st === "xong";
          return (
            <div
              key={x.hoSoId}
              className={`rounded-[12px] border bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden ${
                done ? "border-[var(--teal)]/50" : lech ? "border-[var(--rose)]/40" : "border-[var(--line)]"
              }`}
            >
              {/* Đầu thẻ: người · mã · lần khám / ca mổ · tóm tắt khớp */}
              <div className={`flex items-start gap-3 px-4 py-2.5 border-b border-[var(--line-soft)] ${done ? "bg-[var(--teal-softer)]" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-[15px] font-semibold text-[var(--ink)] truncate">{x.csr.hoTen}</div>
                  {/* Đủ tên đoàn + điểm khám (cho xuống dòng, không cắt) để biết BN đến từ đợt nào */}
                  <div className="mt-1 text-[11.5px] leading-snug text-[var(--ink-soft)]">
                    <span className="font-mono text-[11px] text-[var(--mute)]">Khám {x.ngayKham ? fmtDate(x.ngayKham) : "—"}</span>
                    <span className="text-[var(--mute-soft)]"> · </span>
                    <span className="font-semibold">{e.dot}</span>
                  </div>
                  {x.diaDiem && x.diaDiem.trim() !== e.dot.trim() && (
                    <div className="mt-0.5 flex items-start gap-1 text-[11px] leading-snug text-[var(--mute)]">
                      <MapPin className="w-3 h-3 mt-px shrink-0" />
                      <span>{x.diaDiem}</span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[11px] text-[var(--ink-soft)]">
                    Mổ <b className="text-[var(--ink)]">{x.ngayMo ? fmtDate(x.ngayMo.slice(0, 10)) : "—"}</b> · HIS <b className="text-[var(--navy)]">{x.his.maHIS}</b>
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1.5 text-[10.5px] font-bold">
                    <span className="rounded-md px-1.5 py-px bg-[var(--teal-soft)] text-[var(--teal-deep)]">{khop} khớp</span>
                    {lech > 0 && <span className="rounded-md px-1.5 py-px bg-[var(--rose-soft)] text-[var(--rose)]">{lech} lệch</span>}
                  </div>
                </div>
              </div>

              {/* Bảng so sánh có nhãn trường */}
              <div className="flex items-stretch">
                <div className="flex-1 min-w-0 px-4 py-2">
                  <div className="grid grid-cols-[96px_minmax(0,1fr)_24px_minmax(0,1fr)] gap-x-2 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--mute)] pb-1">
                    <span />
                    <span>Trên HIS</span>
                    <span />
                    <span>Hồ sơ CSR</span>
                  </div>
                  {fields.map((c) => (
                    <div
                      key={c.k}
                      className={`grid grid-cols-[96px_minmax(0,1fr)_24px_minmax(0,1fr)] gap-x-2 items-center py-1 border-t border-[var(--line-soft)] text-[12.5px] ${
                        c.kq === "lech" ? "bg-[var(--rose-soft)]/50 -mx-2 px-2 rounded-md" : ""
                      }`}
                    >
                      <span className="text-[11px] font-semibold text-[var(--mute)]">{c.k}</span>
                      <span className={`${c.chiXem ? "leading-snug text-[12px]" : "truncate"} text-[var(--ink)] ${c.mono ? "font-mono" : ""}`}>{c.his || <span className="text-[var(--mute-soft)]">—</span>}</span>
                      <span className="flex justify-center">{!c.chiXem && <Dau kq={c.kq} />}</span>
                      <span className={`${c.chiXem ? "leading-snug text-[12px]" : "truncate"} ${c.kq === "lech" && !c.chiXem ? "text-[var(--rose)] font-semibold" : "text-[var(--ink)]"} ${c.mono ? "font-mono" : ""}`}>
                        {c.csr || <span className="text-[var(--mute-soft)]">—</span>}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Thao tác */}
                <div className="w-[150px] shrink-0 border-l border-[var(--line-soft)] flex flex-col items-center justify-center gap-1.5 px-3">
                  {done ? (
                    <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--teal-deep)]">
                      <CheckCircle2 className="w-4 h-4" /> Đã xác nhận
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => xacNhan(e)}
                      disabled={st === "dang"}
                      className="w-full h-9 rounded-[10px] text-[12.5px] font-semibold text-white bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] shadow-[var(--navy-shadow)] hover:brightness-110 inline-flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {st === "dang" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      Đúng người
                    </button>
                  )}
                  {!done && (
                    <span className={`text-[10.5px] text-center leading-snug ${lech ? "text-[var(--rose)] font-semibold" : "text-[var(--mute)]"}`}>
                      {lech ? "Có trường lệch — kiểm tra kỹ" : "Ghi nhận đã mổ & tính tiến độ"}
                    </span>
                  )}
                  {st && st !== "dang" && st !== "xong" && <span className="text-[10.5px] text-[var(--rose)] text-center">{st}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
