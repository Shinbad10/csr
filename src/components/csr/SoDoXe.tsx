"use client";

import { useEffect, useState } from "react";
import { Bus, Check, Loader2, Pencil } from "lucide-react";
import Modal from "@/components/layout/Modal";
import { LOAI_XE, soDoGhe, type OGhe } from "@/lib/csr";

/** Người chiếm một ghế: bệnh nhân hoặc người nhà đi kèm của bệnh nhân đó. */
export interface NguoiTrenXe {
  key: string;
  loai: "bn" | "nn";
  ten: string;
  /** Bệnh nhân (hoặc bệnh nhân mà người nhà đi kèm) đã lên xe */
  daLenXe: boolean;
  onClick?: () => void;
}

/** "Nguyễn Thị Kim Anh" → "Kim Anh": ô ghế chỉ đủ chỗ cho 2 chữ cuối. */
function tenNgan(ten: string) {
  const w = ten.trim().split(/\s+/);
  return w.slice(-2).join(" ");
}

/** Sơ đồ ghế một đoàn xe. Xếp tự động theo thứ tự: bệnh nhân, rồi người nhà ngồi ngay sau. */
export function SoDoXe({
  soDoan,
  soCho,
  gioDon,
  nguoi,
  onChonXe,
  onSuaXe,
  dangLuu,
}: {
  soDoan: number;
  soCho: number | null;
  gioDon?: string | null;
  nguoi: NguoiTrenXe[];
  /** Chọn nhanh loại xe khi đoàn chưa có xe */
  onChonXe: (soCho: number) => void;
  onSuaXe: () => void;
  dangLuu?: boolean;
}) {
  const so = soCho ? soDoGhe(soCho) : null;
  const quaTai = so ? Math.max(0, nguoi.length - so.soGheKhach) : 0;
  const soBN = nguoi.filter((n) => n.loai === "bn").length;

  return (
    <section className="rounded-[14px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
      <header className="px-4 py-2.5 border-b border-[var(--line-soft)] flex items-center gap-2.5 flex-wrap">
        <span className="w-7 h-7 rounded-[8px] bg-[var(--navy-50)] text-[var(--navy)] flex items-center justify-center shrink-0">
          <Bus className="w-3.5 h-3.5" />
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-[var(--ink)]">
            Đoàn {soDoan}
            {soCho ? <span className="font-normal text-[var(--mute)]"> · Xe {soCho} chỗ</span> : null}
            {gioDon ? <span className="font-mono font-normal text-[var(--mute)]"> · {gioDon}</span> : null}
          </div>
          <div className="text-[11px] text-[var(--mute)]">
            <span className="font-mono">{soBN}</span> BN
            {nguoi.length > soBN && (
              <>
                {" "}+ <span className="font-mono">{nguoi.length - soBN}</span> người nhà
              </>
            )}
          </div>
        </div>
        {so && (
          <span
            className={`ml-auto font-mono text-[12px] font-semibold tabular-nums px-2 py-0.5 rounded-md ${
              quaTai ? "bg-[var(--rose-soft)] text-[var(--rose)]" : nguoi.length === so.soGheKhach ? "bg-[var(--teal-soft)] text-[var(--teal-deep)]" : "bg-[var(--surface-soft)] text-[var(--ink-soft)]"
            }`}
            title="Ghế đã dùng / ghế chở khách"
          >
            {nguoi.length}/{so.soGheKhach} ghế
          </span>
        )}
        <button
          type="button"
          onClick={onSuaXe}
          className={`${so ? "" : "ml-auto"} w-7 h-7 rounded-[8px] border border-[var(--line)] text-[var(--mute)] hover:text-[var(--navy)] hover:border-[var(--navy)]/40 flex items-center justify-center cursor-pointer transition-colors`}
          title="Đổi loại xe / giờ đón"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </header>

      {!so ? (
        <div className="px-4 py-6 text-center">
          <p className="text-[12.5px] text-[var(--amber-deep)] font-semibold">Đoàn chưa chọn xe</p>
          <p className="text-[11.5px] text-[var(--mute)] mt-0.5">Chọn loại xe để xếp ghế cho {nguoi.length} người</p>
          <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
            {LOAI_XE.map((n) => (
              <button
                key={n}
                type="button"
                disabled={dangLuu}
                onClick={() => onChonXe(n)}
                className="h-8 px-3 rounded-[9px] border border-[var(--line-strong)] bg-[var(--surface)] text-[12px] font-semibold text-[var(--ink-soft)] hover:border-[var(--navy)] hover:text-[var(--navy)] cursor-pointer transition-colors disabled:opacity-50"
              >
                <span className="font-mono">{n}</span> chỗ
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 overflow-x-auto">
          {/* Thân xe: đầu xe ở trên */}
          <div className="mx-auto w-max rounded-t-[28px] rounded-b-[14px] border-2 border-[var(--line-strong)] bg-[var(--surface-soft)]/50 px-3 pt-2 pb-3">
            <div className="text-center font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[var(--mute-soft)] mb-2">Đầu xe</div>
            <div className="space-y-1.5">
              {so.hang.map((row, ri) => (
                <div key={ri} className="flex gap-1.5">
                  {row.map((o, ci) => (
                    <Ghe key={ci} o={o} nguoi={typeof o === "number" ? nguoi[o - 1] : undefined} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {quaTai > 0 && (
            <div className="mt-3 rounded-[10px] border border-[var(--rose)]/25 bg-[var(--rose-soft)] px-3 py-2 text-[12px] text-[var(--rose)]">
              <b>Quá tải {quaTai} người</b> — cần thêm đoàn xe hoặc đổi xe lớn hơn:{" "}
              {nguoi.slice(so.soGheKhach).map((n) => (n.loai === "nn" ? `NN của ${tenNgan(n.ten)}` : tenNgan(n.ten))).join(", ")}
            </div>
          )}

          <div className="mt-3 flex items-center justify-center gap-3 flex-wrap text-[11px] text-[var(--mute)]">
            <ChuThich cls="bg-[var(--navy-50)] border-[var(--navy)]/25" label="Bệnh nhân" />
            <ChuThich cls="bg-[var(--teal-soft)] border-[var(--teal)]/40" label="Đã lên xe" />
            <ChuThich cls="bg-[var(--amber-soft)] border-[var(--amber)]/40" label="Người nhà" />
            <ChuThich cls="bg-[var(--surface)] border-dashed border-[var(--line-strong)]" label="Trống" />
          </div>
        </div>
      )}
    </section>
  );
}

function ChuThich({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded-[4px] border ${cls}`} />
      {label}
    </span>
  );
}

function Ghe({ o, nguoi }: { o: OGhe; nguoi?: NguoiTrenXe }) {
  const base = "w-[66px] h-[50px] rounded-[9px] border flex flex-col justify-between px-1.5 py-1 text-left";
  if (o === null) return <div className="w-[66px] h-[50px]" />;
  if (o === "taiXe")
    return (
      <div className={`${base} bg-[var(--ink-soft)] border-[var(--ink-soft)] text-white/90 items-center justify-center`}>
        <span className="text-[10.5px] font-semibold">Tài xế</span>
      </div>
    );
  if (!nguoi)
    return (
      <div className={`${base} bg-[var(--surface)] border-dashed border-[var(--line-strong)]`}>
        <span className="font-mono text-[9.5px] text-[var(--mute-soft)]">{o}</span>
      </div>
    );
  const cls =
    nguoi.loai === "nn"
      ? "bg-[var(--amber-soft)] border-[var(--amber)]/40 text-[var(--amber-deep)]"
      : nguoi.daLenXe
      ? "bg-[var(--teal-soft)] border-[var(--teal)]/40 text-[var(--teal-deep)]"
      : "bg-[var(--navy-50)] border-[var(--navy)]/25 text-[var(--navy)]";
  return (
    <button
      type="button"
      onClick={nguoi.onClick}
      title={nguoi.loai === "nn" ? `Người nhà của ${nguoi.ten}` : nguoi.ten}
      className={`${base} ${cls} cursor-pointer hover:brightness-95 transition`}
    >
      <span className="flex items-center justify-between w-full">
        <span className="font-mono text-[9.5px] opacity-70">{o}</span>
        {nguoi.loai === "bn" && nguoi.daLenXe && <Check className="w-2.5 h-2.5 stroke-[3]" />}
        {nguoi.loai === "nn" && <span className="font-mono text-[8.5px] font-bold">NN</span>}
      </span>
      <span className="text-[10.5px] font-semibold leading-tight truncate w-full">{tenNgan(nguoi.ten)}</span>
    </button>
  );
}

/** Hộp chọn loại xe + giờ đón cho một đoàn (thêm đoàn mới hoặc đổi xe). */
export function ChonXeModal({
  open,
  onClose,
  tieuDe,
  moTa,
  soChoBanDau,
  gioDonBanDau,
  onLuu,
}: {
  open: boolean;
  onClose: () => void;
  tieuDe: string;
  moTa?: string;
  soChoBanDau?: number | null;
  gioDonBanDau?: string | null;
  onLuu: (soCho: number, gioDon: string) => Promise<void>;
}) {
  const [soCho, setSoCho] = useState<number | null>(soChoBanDau ?? null);
  const [gioDon, setGioDon] = useState(gioDonBanDau || "");
  const [luu, setLuu] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSoCho(soChoBanDau ?? null);
    setGioDon(gioDonBanDau || "");
  }, [open, soChoBanDau, gioDonBanDau]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tieuDe}
      subtitle={moTa}
      icon={Bus}
      maxWidth="max-w-[520px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary h-9 px-4 text-[13px]">
            Huỷ
          </button>
          <button
            type="button"
            disabled={!soCho || luu}
            onClick={async () => {
              if (!soCho) return;
              setLuu(true);
              try {
                await onLuu(soCho, gioDon.trim());
              } finally {
                setLuu(false);
              }
            }}
            className="btn btn-primary h-9 px-4 text-[13px] inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {luu && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Lưu đoàn xe
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="text-[12px] font-semibold text-[var(--ink-soft)] mb-2">
            Loại xe <span className="text-[var(--rose)]">*</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {LOAI_XE.map((n) => {
              const on = soCho === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSoCho(n)}
                  className={`rounded-[12px] border px-3 py-2.5 text-left transition-all cursor-pointer ${
                    on ? "border-[var(--navy)] bg-[var(--navy-50)] shadow-[0_0_0_3px_var(--navy-100)]" : "border-[var(--line)] hover:border-[var(--line-strong)]"
                  }`}
                >
                  <div className={`font-mono text-[18px] font-bold leading-none ${on ? "text-[var(--navy)]" : "text-[var(--ink)]"}`}>{n}</div>
                  <div className="text-[11px] text-[var(--mute)] mt-1">chỗ · {n - 1} ghế khách</div>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[var(--ink-soft)] mb-1.5 block">Giờ đón</label>
          <input
            type="time"
            value={gioDon}
            onChange={(e) => setGioDon(e.target.value)}
            className="input-field h-10 font-mono w-40"
          />
        </div>
      </div>
    </Modal>
  );
}
