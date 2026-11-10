"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Printer, X } from "lucide-react";
import { parseDiag, type ToaThuoc } from "@/lib/csr";

/* Phiếu khám mắt — khổ A5 dọc, bố cục theo mẫu giấy của bệnh viện. Mở trong tab riêng, tự gọi hộp thoại in. */

interface PhieuData {
  hoSo: {
    id: string;
    maBN: string;
    hoTen: string;
    gioiTinh: string | null;
    ngaySinh: string | null;
    namSinh: number | null;
    diaChi: string | null;
    khuPho: string | null;
    xaPhuong: string | null;
    thiLucMP: string | null;
    thiLucMT: string | null;
    thiLucCoKinhMP: string | null;
    thiLucCoKinhMT: string | null;
    chanDoanMP: string | null;
    chanDoanMT: string | null;
    chanDoanKhacMP: string | null;
    chanDoanKhacMT: string | null;
    chanDoan: string | null;
    chanDoanKhac: string | null;
    loaiBenhLy: string | null;
    loaiBenhLyKhac: string | null;
    tienSuPhauThuat: string | null;
    huongXuTri: string | null;
    huongXuTriKhac: string | null;
    khuyenNghi: string | null;
    bacSiChiDinh: string | null;
    buoiKham: { id: string; ngayKham: string; xa: string | null; diaDiem: string | null; bacSiKham: string | null } | null;
  };
  benhVien: { ten: string; diaChi: string | null; dienThoai: string | null; email: string | null; website: string | null };
  toa: ToaThuoc;
}

const DTT = "Đục thủy tinh thể";
const MONG = "Mộng";

function ngaySinhVN(h: PhieuData["hoSo"]) {
  if (h.ngaySinh) {
    const d = new Date(h.ngaySinh);
    return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  }
  return h.namSinh ? String(h.namSinh) : "";
}

/** Dòng chấm để ghi tay khi không có dữ liệu */
function Cham({ className = "" }: { className?: string }) {
  return <span className={`flex-1 border-b border-dotted border-black/70 min-w-[2rem] translate-y-[-3px] ${className}`} aria-hidden="true" />;
}

function O({ on }: { on: boolean }) {
  return (
    <span className="inline-flex w-[13px] h-[13px] border border-black items-center justify-center text-[10px] leading-none font-bold align-middle" aria-label={on ? "có" : "không"}>
      {on ? "✓" : ""}
    </span>
  );
}

export default function InPhieuKham({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  /** ?nhung=1: trang Khám nạp phiếu vào khung ẩn để mở thẳng hộp thoại in (không mở tab mới) */
  const nhung = useSearchParams().get("nhung") === "1";
  const [data, setData] = useState<PhieuData | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const baoCha = (msg: Record<string, unknown>) => {
      if (nhung && window.parent !== window) window.parent.postMessage({ nguon: "phieu-kham", ...msg }, window.location.origin);
    };
    fetch(`/api/csr/hoso/${encodeURIComponent(id)}/phieu-kham`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject((await r.json().catch(() => null))?.error || `Lỗi HTTP ${r.status}`)))
      .then((d: PhieuData) => {
        setData(d);
        document.title = `Phiếu khám - ${d.hoSo.hoTen}`;
        // đợi ảnh logo + font rồi mới mở hộp thoại in
        setTimeout(() => {
          baoCha({ loai: "san-sang" });
          window.print();
        }, 400);
      })
      .catch((e) => {
        setErr(String(e));
        baoCha({ loai: "loi", loi: String(e) });
      });
  }, [id, nhung]);

  if (err) return <div className="p-8 text-[14px] text-[var(--rose)]">Không mở được phiếu khám: {err}</div>;
  if (!data)
    return (
      <div className="p-8 flex items-center gap-2 text-[14px] text-[var(--mute)]">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang chuẩn bị phiếu khám…
      </div>
    );

  const { hoSo: h, benhVien: bv, toa } = data;
  const mp = parseDiag(h.chanDoanMP);
  const mt = parseDiag(h.chanDoanMT);
  // Bệnh khác: mọi chẩn đoán ngoài Đục TTT / Mộng, ghi rõ mắt; cộng mã ICD nếu cơ sở dùng bộ ICD
  const benhKhac = [
    ...mp.filter((x) => x !== DTT && x !== MONG).map((x) => (x === "Khác" ? `${h.chanDoanKhacMP || "Khác"} (MP)` : `${x} (MP)`)),
    ...mt.filter((x) => x !== DTT && x !== MONG).map((x) => (x === "Khác" ? `${h.chanDoanKhacMT || "Khác"} (MT)` : `${x} (MT)`)),
    ...parseDiag(h.loaiBenhLy).map((x) => (x === "Khác" ? h.loaiBenhLyKhac || "Khác" : x)),
  ].filter(Boolean);
  const tl = [h.thiLucMP || h.thiLucMT ? `Thị lực KK: MP ${h.thiLucMP || "—"}, MT ${h.thiLucMT || "—"}` : "", h.thiLucCoKinhMP || h.thiLucCoKinhMT ? `CK: MP ${h.thiLucCoKinhMP || "—"}, MT ${h.thiLucCoKinhMT || "—"}` : ""]
    .filter(Boolean)
    .join(" · ");
  const huong = h.huongXuTri === "Điều trị khác" && h.huongXuTriKhac ? h.huongXuTriKhac : h.huongXuTri || h.khuyenNghi || "";
  const tienSu = parseDiag(h.tienSuPhauThuat).join(", ");
  const ghiChu = [tl, huong && `Hướng xử trí: ${huong}`, tienSu && `Tiền sử PT: ${tienSu}`].filter(Boolean).join(" · ");
  const diaChi = h.diaChi || [h.khuPho, h.xaPhuong].filter(Boolean).join(", ");
  const nk = h.buoiKham?.ngayKham ? new Date(h.buoiKham.ngayKham) : new Date();
  const bacSi = h.bacSiChiDinh || h.buoiKham?.bacSiKham?.split(/[,;\n]/)[0]?.trim() || "";
  const gioi = (h.gioiTinh || "").toLowerCase();

  return (
    <div className="min-h-screen bg-[#e9ebf1] print:bg-white">
      <style>{`
        /* Phiếu khổ A5. Lề trang 0 (lề nằm trong phiếu) để trình duyệt không in ngày giờ / URL.
           Máy in đang để A4 thì chọn Paper size = A5 trong hộp thoại in (Chrome nhớ cho lần sau). */
        @page { size: A5 portrait; margin: 0; }
        @media print { html, body { overflow: visible !important; height: auto !important; background: #fff !important; } }
        .phieu { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; color: #000; }
      `}</style>

      {/* Thanh thao tác — ẩn khi in và khi nạp trong khung ẩn */}
      <div data-nhung={nhung} className="print:hidden data-[nhung=true]:hidden sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-2 bg-[var(--surface)] border-b border-[var(--line)]">
        <div className="text-[13px] text-[var(--ink-soft)] truncate">
          Phiếu khám · <b className="text-[var(--ink)]">{h.hoTen}</b> <span className="font-mono text-[12px] text-[var(--mute)]">{h.maBN}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => window.print()} className="btn btn-primary h-8 px-3 text-[12.5px] font-semibold">
            <Printer className="w-3.5 h-3.5" /> In phiếu
          </button>
          <button type="button" onClick={() => window.close()} className="btn btn-secondary h-8 px-3 text-[12.5px] font-semibold">
            <X className="w-3.5 h-3.5" /> Đóng
          </button>
        </div>
      </div>

      {/* Trang A5 (148 × 210mm) */}
      <div className="phieu mx-auto my-6 print:my-0 w-[148mm] min-h-[210mm] bg-white shadow-[var(--shadow-md)] print:shadow-none px-[10mm] py-[9mm] print:px-[10mm] print:py-[9mm] print:w-auto print:min-h-0 text-[12.5px] leading-[1.45]">
        {/* Đầu phiếu: logo + thông tin bệnh viện của đợt khám */}
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="w-[18mm] h-[18mm] object-contain shrink-0" />
          <div className="min-w-0 text-[11px] leading-[1.45]">
            <div className="text-[12.5px] font-bold uppercase">{bv.ten}</div>
            {bv.diaChi && <div>Địa chỉ: {bv.diaChi}</div>}
            {bv.website && <div>Website: {bv.website}</div>}
            {bv.dienThoai && <div>Hotline: {bv.dienThoai}</div>}
            {bv.email && <div>Email: {bv.email}</div>}
          </div>
        </div>

        <h1 className="mt-4 mb-3 text-center text-[17px] font-bold tracking-wide">PHIẾU KHÁM MẮT</h1>

        <div className="space-y-1.5">
          <div className="flex items-baseline gap-1">
            <span className="shrink-0">Họ tên BN:</span>
            <span className="flex-1 font-bold uppercase border-b border-dotted border-black/70 px-1">{h.hoTen}</span>
            <span className="shrink-0 ml-2">Ngày sinh:</span>
            <span className="w-[22mm] text-center border-b border-dotted border-black/70">{ngaySinhVN(h)}</span>
            <span className="shrink-0 ml-2">
              <span className={gioi === "nam" ? "font-bold underline" : "text-black/50"}>Nam</span>/
              <span className={gioi.startsWith("n") && gioi !== "nam" ? "font-bold underline" : "text-black/50"}>Nữ</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="shrink-0">Địa chỉ:</span>
            {diaChi ? <span className="flex-1 border-b border-dotted border-black/70 px-1">{diaChi}</span> : <Cham />}
          </div>
        </div>

        {/* Chẩn đoán: nhãn đứng riêng bên trái, mỗi bệnh một cột (tên bệnh không xuống dòng), MP / MT thẳng hàng */}
        <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-x-4">
          <span className="font-bold whitespace-nowrap">Chẩn đoán:</span>
          {[
            { ten: "Đục thể thủy tinh (Cườm khô)", ma: DTT },
            { ten: "Mộng thịt (Kéo mây)", ma: MONG },
          ].map((b) => (
            <div key={b.ma} className="min-w-0">
              <div className="font-bold whitespace-nowrap">{b.ten}</div>
              {(["MP", "MT"] as const).map((m) => (
                <div key={m} className="mt-1 flex items-center gap-1.5">
                  <span className="w-6 shrink-0">{m}</span>
                  <O on={(m === "MP" ? mp : mt).includes(b.ma)} />
                  <Cham />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-baseline gap-1">
            <span className="shrink-0">Bệnh khác:</span>
            {benhKhac.length ? <span className="flex-1 border-b border-dotted border-black/70 px-1">{benhKhac.join("; ")}</span> : <Cham />}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="shrink-0">Ghi chú:</span>
            {ghiChu ? <span className="flex-1 border-b border-dotted border-black/70 px-1">{ghiChu}</span> : <Cham />}
          </div>
        </div>

        {/* Toa thuốc mặc định của cơ sở */}
        <h2 className="mt-5 mb-2 text-center text-[16px] font-bold tracking-wide">TOA THUỐC</h2>
        {toa.thuoc.length > 0 ? (
          <ol className="space-y-2">
            {toa.thuoc.map((t, i) => (
              <li key={i}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-bold">
                    {i + 1}. {t.ten}
                  </span>
                  {t.soLuong && <span className="shrink-0 font-bold">Số lượng: {t.soLuong}</span>}
                </div>
                {t.cachDung && <div className="pl-4">{t.cachDung}</div>}
              </li>
            ))}
          </ol>
        ) : (
          <div className="space-y-4 pt-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex">
                <Cham />
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex">
              <Cham />
            </div>
          ))}
        </div>

        {/* Lời dặn + ngày / bác sĩ */}
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <div className="font-bold italic">Lời dặn:</div>
            {toa.loiDan ? (
              <div className="mt-1 whitespace-pre-line">{toa.loiDan}</div>
            ) : (
              <div className="mt-3 space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex">
                    <Cham />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="italic">
              Ngày {String(nk.getDate()).padStart(2, "0")} tháng {String(nk.getMonth() + 1).padStart(2, "0")} năm {nk.getFullYear()}
            </div>
            <div className="mt-0.5 font-bold">Bác sĩ</div>
            <div className="h-[16mm]" />
            <div className="font-semibold">{bacSi}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
