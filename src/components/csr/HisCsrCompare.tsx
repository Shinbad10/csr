"use client";

import React from "react";
import { Check, X, Minus, AlertTriangle, ShieldQuestion, CheckCircle2, RefreshCw, MapPin } from "lucide-react";
import Modal from "@/components/layout/Modal";
import { fmtDate, type CsrCtXacNhan, type HisCtXacNhan } from "@/lib/csr";

// Dữ liệu đối chiếu HIS không có schema cố định — dùng bản ghi mở.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HisRow = Record<string, any>;

/** canhBao: khác nhau nhưng KHÔNG coi là lệch (vd. SĐT — BN hay đổi số / để số người nhà). */
type KetQua = "khop" | "lech" | "thieu" | "canhBao";

/** Nền dòng & màu chữ theo kết quả so — lệch đỏ, cảnh báo vàng. */
const nenDong = (kq: KetQua) => (kq === "lech" ? "bg-[var(--rose-soft)]/50" : kq === "canhBao" ? "bg-[var(--amber-soft)]/60" : "");
const chuKq = (kq: KetQua) => (kq === "lech" ? "text-[var(--rose)] font-semibold" : kq === "canhBao" ? "text-[var(--amber-deep)] font-semibold" : "");

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
/** Mã thẻ BHYT → 10 số cuối (mã số BHXH); thiếu số thì coi như không có. */
const soBhyt = (s?: string | null) => {
  const d = (s || "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : "";
};
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
    // Mã thẻ BHYT: so 10 số cuối (mã số BHXH — giữ nguyên khi đổi / gia hạn thẻ). Dùng khi một bên thiếu CCCD.
    { k: "Mã BHYT", his: r.bhyt, csr: m.bhyt, kq: so(soBhyt(r.bhyt), soBhyt(m.bhyt)), mono: true },
    // SĐT khác chỉ là cảnh báo: không tính "lệch", không chặn xác nhận
    { k: "SĐT", his: r.sdt, csr: m.sdt, kq: (so(soDt(r.sdt), soDt(m.sdt)) === "lech" ? "canhBao" : so(soDt(r.sdt), soDt(m.sdt))) as KetQua, mono: true },
    { k: "Địa chỉ", his: r.diaChi, csr: m.diaChi, kq: "thieu" as KetQua, chiXem: true },
  ];
}

const DAU: Record<KetQua, { icon: typeof Check; cls: string; nhan: string }> = {
  khop: { icon: Check, cls: "text-[var(--teal-deep)] bg-[var(--teal-soft)]", nhan: "Khớp" },
  lech: { icon: X, cls: "text-[var(--rose)] bg-[var(--rose-soft)]", nhan: "Lệch" },
  thieu: { icon: Minus, cls: "text-[var(--mute)] bg-[var(--surface-soft)]", nhan: "Thiếu" },
  canhBao: { icon: AlertTriangle, cls: "text-[var(--amber-deep)] bg-[var(--amber-soft)]", nhan: "Khác nhau — chỉ cảnh báo" },
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

/* ───────────── Chi tiết ca mổ HIS ↔ hồ sơ tầm soát CSR (bằng chứng để xác nhận đúng người) ───────────── */

export type ChiTietHis = HisCtXacNhan & { tenDichVu?: string | null; loaiPT?: string | null; ngayMo?: string | null };

/** "Phẫu thuật tán nhuyễn … (Phaco) có hoặc không đặt IOL_ IOL Mini 4" → "IOL Mini 4" (loại PT đã có nhãn riêng). */
function tenDvNgan(ten?: string | null) {
  const t = String(ten || "");
  const iol = t.match(/IOL[_\s:-]*(?:IOL\s*)?\(?([^()]+?)\)?\s*$/i)?.[1]?.trim();
  return iol && !/^có hoặc không/i.test(iol) ? `IOL ${iol}` : t;
}
/** "YYYY-MM-DD HH:mm[:ss]" hoặc ISO → "dd/mm/yyyy HH:mm" */
function fmtGio(v?: string | null) {
  if (!v) return "";
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return String(v);
  return `${m[3]}/${m[2]}/${m[1]}${m[4] && !(m[4] === "00" && m[5] === "00") ? ` ${m[4]}:${m[5]}` : ""}`;
}
const ngayCua = (v?: string | null) => (v ? String(v).slice(0, 10) : "");
const chanDoanMat = (ds: string[], khac?: string | null) => ds.map((x) => (x === "Khác" ? khac || "Khác" : x)).join(", ");

type DongChiTiet = { k: string; his: string; csr: string; kq?: KetQua; goiY?: string; hisTitle?: string; hisFull?: boolean };

/** Các dòng so sánh chi tiết. `kq` chỉ là gợi ý (khớp / cảnh báo), KHÔNG cộng vào số "lệch". */
export function chiTietRows(his: ChiTietHis, csr?: CsrCtXacNhan | null): DongChiTiet[] {
  const mp = csr ? chanDoanMat(csr.chanDoanMP, csr.khacMP) : "";
  const mt = csr ? chanDoanMat(csr.chanDoanMT, csr.khacMT) : "";
  // Mắt HIS mổ có chẩn đoán tương ứng bên CSR không
  const matMo = his.matMo || "";
  const mat = matMo === "Mắt phải" ? ["MP"] : matMo === "Mắt trái" ? ["MT"] : matMo === "Hai mắt" ? ["MP", "MT"] : [];
  const kqMat: KetQua = !csr || mat.length === 0 || (!mp && !mt) ? "thieu" : mat.every((e) => (e === "MP" ? mp : mt)) ? "khop" : "canhBao";
  // Ngày mổ HIS so với ngày hẹn mổ (CSR)
  const moNgay = ngayCua(his.gioMo || his.ngayMo);
  const hen = ngayCua(csr?.ngayDieuTri);
  const lechNgay = moNgay && hen ? Math.abs(new Date(moNgay).getTime() - new Date(hen).getTime()) / 86400000 : null;
  const kqNgay: KetQua = lechNgay == null ? "thieu" : lechNgay <= 3 ? "khop" : "canhBao";
  const dv = tenDvNgan(his.tenDichVu);
  const tien = his.soTienThucThu && his.soTienThucThu > 0 ? `${new Intl.NumberFormat("vi-VN").format(his.soTienThucThu)} đ` : "";
  const rows: DongChiTiet[] = [
    {
      k: "Phẫu thuật",
      his: [his.loaiPT, dv].filter(Boolean).join(" · "),
      hisTitle: his.tenDichVu || undefined,
      csr: [csr?.huongXuTri, csr?.nhom ? `Nhóm ${csr.nhom}` : ""].filter(Boolean).join(" · "),
    },
    {
      k: "Mắt mổ",
      his: matMo,
      csr: [mp && `MP: ${mp}`, mt && `MT: ${mt}`].filter(Boolean).join(" · "),
      kq: kqMat,
      goiY: kqMat === "khop" ? "Mắt mổ trùng mắt có chẩn đoán ở CSR" : kqMat === "canhBao" ? "Mắt mổ KHÁC mắt có chẩn đoán ở CSR — kiểm tra lại" : undefined,
    },
    {
      k: "Thời gian",
      his: [fmtGio(his.gioMo || his.ngayMo), his.phongMo].filter(Boolean).join(" · "),
      csr: hen ? `Hẹn mổ ${fmtDate(hen)}` : "",
      kq: kqNgay,
      goiY: kqNgay === "khop" ? "Mổ gần ngày hẹn (≤ 3 ngày)" : kqNgay === "canhBao" ? `Mổ cách ngày hẹn ${Math.round(lechNgay || 0)} ngày` : undefined,
    },
    { k: "Chẩn đoán", his: his.chanDoan || "", csr: "", hisFull: true },
    {
      k: "Nguồn / BS",
      his: [his.doiTuong && `Đối tượng ${his.doiTuong}`, his.bsDieuTri && `BS. ${his.bsDieuTri}`].filter(Boolean).join(" · "),
      csr: [csr?.tuVan && `TVV ${csr.tuVan}`, csr?.diemDon && `Đón: ${csr.diemDon}`].filter(Boolean).join(" · "),
    },
  ];
  if (tien) rows.push({ k: "Thực thu", his: tien, csr: "" });
  return rows;
}

/** Khối dòng chi tiết — cùng lưới cột với bảng định danh phía trên để mắt dò ngang. */
export function ChiTietCaMo({ his, csr, cot }: { his: ChiTietHis; csr?: CsrCtXacNhan | null; cot: string }) {
  const rows = chiTietRows(his, csr).filter((x) => x.his || x.csr);
  if (rows.length === 0) return null;
  return (
    <div className="mt-1.5">
      <div className={`grid ${cot} gap-x-2 pt-2 pb-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--mute)]`}>
        <span />
        <span>Ca mổ trên HIS</span>
        <span />
        <span>Hồ sơ tầm soát CSR</span>
      </div>
      {rows.map((x) => (
        <div key={x.k} className={`grid ${cot} gap-x-2 items-start py-1 border-t border-[var(--line-soft)] text-[12px]`} title={x.goiY}>
          <span className="text-[11px] font-semibold text-[var(--mute)] pt-px">{x.k}</span>
          <span className={`min-w-0 leading-snug text-[var(--ink)] ${x.hisFull ? "col-span-3" : ""}`} title={x.hisTitle}>
            {x.his || <span className="text-[var(--mute-soft)]">—</span>}
          </span>
          {!x.hisFull && (
            <>
              <span className="flex justify-center pt-px">{x.kq && x.kq !== "thieu" ? <Dau kq={x.kq} /> : null}</span>
              <span className={`min-w-0 leading-snug ${x.kq === "canhBao" ? "text-[var(--amber-deep)] font-semibold" : "text-[var(--ink)]"}`}>
                {x.csr || <span className="text-[var(--mute-soft)]">—</span>}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
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
  const dong = compareRows(r);
  const theo = (k: string) => dong.find((x) => x.k === k)!;
  const [ten, ns, cccd, sdt] = [theo("Họ tên"), theo("Ngày sinh"), theo("CCCD"), theo("SĐT")];
  const isPartial = m.matchType === "partial" || m.isKhuyetCccd;
  const isSecondEye = Boolean(r.isMat2 || (r.lanMo && r.lanMo >= 2));
  const val = (x: { kq: KetQua }, content: React.ReactNode, mono = false) => (
    <div className={DONG}>
      <Dau kq={x.kq} />
      <span className={`truncate ${mono ? "font-mono" : ""} ${chuKq(x.kq)}`}>{content}</span>
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
  const soCanhBao = rows.filter((x) => x.kq === "canhBao").length;
  // Chi tiết ca mổ HIS ↔ hồ sơ tầm soát (dịch vụ, mắt, giờ / phòng mổ, chẩn đoán, nguồn) để xác nhận chắc chắn
  const ctHis: ChiTietHis = { tenDichVu: row.tenDichVu, loaiPT: row.loaiPT, gioMo: row.ngayMoLocal, ngayMo: row.ngayMo, phongMo: row.phongMo, bsDieuTri: row.bsDieuTri, doiTuong: row.doiTuong, chanDoan: row.chanDoan || row.chanDoanRavien || row.chanDoanVaovien || row.chanDoanBM, matMo: row.matMo, soTienThucThu: row.soTienThucThu };

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
            {soCanhBao > 0 && <b className="text-[var(--amber-deep)]"> · {soCanhBao} cảnh báo</b>}
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
              <tr key={x.k} className={nenDong(x.kq)}>
                <td className="border-t border-[var(--line-soft)] py-2 pr-2 text-[12px] font-semibold text-[var(--mute)]">{x.k}</td>
                <td className={`border-t border-[var(--line-soft)] py-2 pr-2 text-[var(--ink)] ${x.mono ? "font-mono" : ""}`}>{x.his || <span className="text-[var(--mute-soft)]">—</span>}</td>
                <td className="border-t border-[var(--line-soft)] py-2 text-center">{!x.chiXem && <Dau kq={x.kq} />}</td>
                <td className={`border-t border-[var(--line-soft)] py-2 pl-2 text-[var(--ink)] ${x.mono ? "font-mono" : ""}`}>{x.csr || <span className="text-[var(--mute-soft)]">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ChiTietCaMo his={ctHis} csr={m.ct} cot="grid-cols-[110px_minmax(0,1fr)_34px_minmax(0,1fr)]" />
        {soLech > 0 && (
          <p className="mt-3 rounded-lg bg-[var(--rose-soft)] px-3 py-2 text-[12px] text-[var(--rose)]">
            Có {soLech} trường lệch — chỉ xác nhận khi chắc chắn là cùng một người (vd. CSR gõ sai số).
          </p>
        )}
        {soLech === 0 && soCanhBao > 0 && (
          <p className="mt-3 rounded-lg bg-[var(--amber-soft)] px-3 py-2 text-[12px] text-[var(--amber-deep)]">
            SĐT trên HIS và CSR khác nhau — chỉ là cảnh báo (BN có thể đổi số hoặc để số người nhà), vẫn xác nhận được.
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
            bhyt: x.his.bhyt,
            sdt: x.his.sdt,
            diaChi: x.his.diaChi,
            ngaySinh: "",
            matchedCsr: { ...x.csr, maBN: x.maBN },
          };
          // Địa chỉ chỉ để đối chiếu bằng mắt (cách ghi HIS/CSR khác nhau nên không chấm khớp/lệch)
          const fields = compareRows(r);
          const lech = fields.filter((c) => !c.chiXem && c.kq === "lech").length;
          const khop = fields.filter((c) => !c.chiXem && c.kq === "khop").length;
          const canhBao = fields.filter((c) => !c.chiXem && c.kq === "canhBao").length;
          const done = st === "xong";
          return (
            <div
              key={x.hoSoId}
              className={`rounded-[12px] border bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden ${
                done ? "border-[var(--teal)]/50" : lech ? "border-[var(--rose)]/40" : canhBao ? "border-[var(--amber)]/40" : "border-[var(--line)]"
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
                    {canhBao > 0 && <span className="rounded-md px-1.5 py-px bg-[var(--amber-soft)] text-[var(--amber-deep)]">{canhBao} cảnh báo</span>}
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
                        nenDong(c.kq) ? `${nenDong(c.kq)} -mx-2 px-2 rounded-md` : ""
                      }`}
                    >
                      <span className="text-[11px] font-semibold text-[var(--mute)]">{c.k}</span>
                      <span className={`${c.chiXem ? "leading-snug text-[12px]" : "truncate"} text-[var(--ink)] ${c.mono ? "font-mono" : ""}`}>{c.his || <span className="text-[var(--mute-soft)]">—</span>}</span>
                      <span className="flex justify-center">{!c.chiXem && <Dau kq={c.kq} />}</span>
                      <span className={`${c.chiXem ? "leading-snug text-[12px]" : "truncate"} ${!c.chiXem && chuKq(c.kq) ? chuKq(c.kq) : "text-[var(--ink)]"} ${c.mono ? "font-mono" : ""}`}>
                        {c.csr || <span className="text-[var(--mute-soft)]">—</span>}
                      </span>
                    </div>
                  ))}
                  <ChiTietCaMo
                    his={{ ...x.hisCt, tenDichVu: x.tenDichVu, loaiPT: x.loaiPT, ngayMo: x.ngayMo }}
                    csr={x.csrCt}
                    cot="grid-cols-[96px_minmax(0,1fr)_24px_minmax(0,1fr)]"
                  />
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
                    <span className={`text-[10.5px] text-center leading-snug ${lech ? "text-[var(--rose)] font-semibold" : canhBao ? "text-[var(--amber-deep)] font-semibold" : "text-[var(--mute)]"}`}>
                      {lech ? "Có trường lệch — kiểm tra kỹ" : canhBao ? "SĐT khác — chỉ cảnh báo" : "Ghi nhận đã mổ & tính tiến độ"}
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
