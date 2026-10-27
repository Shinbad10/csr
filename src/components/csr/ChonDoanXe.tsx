"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { cleanDiemDon, parseDoanXe, parseThongTinNguoiNha, XE_MAC_DINH, fmtDate } from "@/lib/csr";
import { useRealtimeEvent } from "@/lib/useRealtime";
import { useToast } from "@/components/providers/ToastProvider";
import { ChonXeModal } from "@/components/csr/SoDoXe";

type XeDoan = { id: string; ngayDon: string; diemDon: string; soDoan: number; soCho: number; gioDon: string | null };
type HoSoTram = { id: string; diemDon?: string | null; gioDon?: string | null; ghiChuTuVan?: string | null; sdtNguoiNha?: string | null };

/**
 * Chọn đoàn xe cho một bệnh nhân tại điểm đón + ngày đón — cùng dữ liệu với trang Đoàn xe:
 * mỗi đoàn hiện loại xe (bảng DoanXe, chưa chọn = 16 chỗ) và số ghế đã dùng (bệnh nhân + người nhà cả trạm).
 */
export default function ChonDoanXe({
  ngayDon,
  diemDon,
  coSoId,
  hoSoId,
  doanHienTai,
  soChoCuaBN,
  gioDon,
  onChonDoan,
}: {
  ngayDon: string;
  diemDon: string;
  coSoId?: string | null;
  /** Hồ sơ đang sửa — không đếm bản đã lưu, thay bằng số liệu trên form */
  hoSoId?: string | null;
  doanHienTai: number;
  /** Số ghế bệnh nhân này chiếm (1 + người nhà đi kèm) theo form hiện tại */
  soChoCuaBN: number;
  gioDon?: string | null;
  onChonDoan: (soDoan: number) => void;
}) {
  const { addToast } = useToast();
  const tram = cleanDiemDon(diemDon);
  const [items, setItems] = useState<HoSoTram[]>([]);
  const [xeList, setXeList] = useState<XeDoan[]>([]);
  const [dangTai, setDangTai] = useState(false);
  const [chonXe, setChonXe] = useState<{ soDoan: number; soCho: number; gioDon: string | null; moi: boolean } | null>(null);
  const reqId = useRef(0);

  const nap = useCallback(async () => {
    if (!ngayDon || !diemDon) return;
    const id = ++reqId.current;
    setDangTai(true);
    try {
      const sp = new URLSearchParams({ ngay: ngayDon, diemDon: tram });
      const [r1, r2] = await Promise.all([fetch(`/api/csr/doan-xe?${sp}`), fetch("/api/csr/doan-xe/xe")]);
      const [j1, j2] = await Promise.all([r1.json().catch(() => ({})), r2.json().catch(() => ({}))]);
      if (id !== reqId.current) return;
      setItems(Array.isArray(j1.items) ? (j1.items as HoSoTram[]).filter((it) => cleanDiemDon(it.diemDon) === tram) : []);
      setXeList(Array.isArray(j2.items) ? (j2.items as XeDoan[]).filter((x) => x.ngayDon === ngayDon && x.diemDon === tram) : []);
    } catch {
      /* giữ số liệu cũ */
    } finally {
      if (id === reqId.current) setDangTai(false);
    }
  }, [ngayDon, diemDon, tram]);

  useEffect(() => {
    const t = setTimeout(nap, 250);
    return () => clearTimeout(t);
  }, [nap]);

  const hen = useRef<ReturnType<typeof setTimeout> | null>(null);
  useRealtimeEvent(["hoso_change"], () => {
    if (hen.current) clearTimeout(hen.current);
    hen.current = setTimeout(nap, 800);
  });

  const cacDoan = useMemo(() => {
    const set = new Set<number>([1, doanHienTai]);
    items.forEach((it) => it.id !== hoSoId && set.add(parseDoanXe(it)));
    xeList.forEach((x) => set.add(x.soDoan));
    return Array.from(set).sort((a, b) => a - b);
  }, [items, xeList, doanHienTai, hoSoId]);

  const xeCua = (d: number) => xeList.find((x) => x.soDoan === d) || null;
  const gheDaDung = (d: number) => {
    let n = 0;
    for (const it of items) {
      if (it.id === hoSoId || parseDoanXe(it) !== d) continue;
      const nn = parseThongTinNguoiNha(it.sdtNguoiNha, it.ghiChuTuVan);
      n += 1 + (nn.coDiCung ? nn.soLuongDiCung : 0);
    }
    if (d === doanHienTai) n += soChoCuaBN;
    return n;
  };
  const gioCua = (d: number) =>
    xeCua(d)?.gioDon || items.find((it) => it.id !== hoSoId && parseDoanXe(it) === d && it.gioDon)?.gioDon || (d === doanHienTai ? gioDon : null) || null;

  const luuXe = async (soDoan: number, soCho: number, gio: string) => {
    const res = await fetch("/api/csr/doan-xe/xe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coSoId: coSoId || undefined, ngayDon, diemDon: tram, soDoan, soCho, gioDon: gio || null }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      addToast({ type: "error", message: json.error || "Không lưu được đoàn xe" });
      return false;
    }
    await nap();
    return true;
  };

  return (
    <div className="mt-2.5">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11.5px] font-semibold text-[var(--ink-soft)]">
          Đoàn xe tại trạm
          {ngayDon && <span className="font-normal text-[var(--mute)]"> · <span className="font-mono">{fmtDate(ngayDon)}</span></span>}
        </span>
        {dangTai && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--mute)]" />}
      </div>
      <div className="flex items-stretch gap-2 flex-wrap">
        {cacDoan.map((d) => {
          const xe = xeCua(d);
          const soCho = xe?.soCho ?? XE_MAC_DINH;
          const ghe = soCho - 1;
          const dung = gheDaDung(d);
          const gio = gioCua(d);
          const active = d === doanHienTai;
          return (
            <div
              key={d}
              role="button"
              tabIndex={0}
              onClick={() => onChonDoan(d)}
              onKeyDown={(e) => e.key === "Enter" && onChonDoan(d)}
              className={`flex items-center gap-2.5 pl-2.5 pr-1 py-1.5 rounded-[10px] border transition-all cursor-pointer ${
                active ? "border-[var(--navy)] bg-[var(--navy-50)]" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]"
              }`}
            >
              <span className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${active ? "border-[var(--navy)]" : "border-[var(--line-strong)]"}`}>
                {active && <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[12.5px] font-semibold ${active ? "text-[var(--navy)]" : "text-[var(--ink)]"}`}>Đoàn {d}</span>
                  <span
                    className={`font-mono text-[10.5px] font-semibold tabular-nums ${dung > ghe ? "text-[var(--rose)]" : "text-[var(--mute)]"}`}
                    title="Ghế đã dùng / ghế chở khách (gồm người nhà)"
                  >
                    {dung}/{ghe}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--mute)] whitespace-nowrap">
                  Xe <span className="font-mono">{soCho}</span> chỗ{gio ? <> · <span className="font-mono">{gio}</span></> : null}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setChonXe({ soDoan: d, soCho, gioDon: gio, moi: false });
                }}
                className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[var(--mute-soft)] hover:text-[var(--navy)] hover:bg-[var(--surface)] cursor-pointer transition-colors"
                title="Đổi loại xe / giờ đón của đoàn"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setChonXe({ soDoan: Math.max(...cacDoan) + 1, soCho: XE_MAC_DINH, gioDon: null, moi: true })}
          className="px-3 min-h-[46px] rounded-[10px] text-[12px] font-semibold text-[var(--mute)] hover:text-[var(--navy)] border border-dashed border-[var(--line-strong)] hover:border-[var(--navy)]/40 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
          title="Thêm một đoàn xe nữa cho điểm đón này"
        >
          <Plus className="w-3.5 h-3.5" /> Thêm đoàn xe
        </button>
      </div>

      {chonXe && (
        <ChonXeModal
          key={`${chonXe.soDoan}-${chonXe.moi}`}
          open
          onClose={() => setChonXe(null)}
          tieuDe={chonXe.moi ? `Thêm Đoàn ${chonXe.soDoan}` : `Xe của Đoàn ${chonXe.soDoan}`}
          moTa={`${tram}${ngayDon ? ` · ${fmtDate(ngayDon)}` : ""}${chonXe.moi ? " — bệnh nhân này sẽ được xếp vào đoàn mới" : ""}`}
          soChoBanDau={chonXe.soCho}
          gioDonBanDau={chonXe.gioDon}
          onLuu={async (soCho, gio) => {
            const ok = await luuXe(chonXe.soDoan, soCho, gio);
            if (!ok) return;
            if (chonXe.moi) onChonDoan(chonXe.soDoan);
            addToast({ type: "success", message: chonXe.moi ? `Đã thêm Đoàn ${chonXe.soDoan} (xe ${soCho} chỗ)` : `Đã lưu xe ${soCho} chỗ cho Đoàn ${chonXe.soDoan}` });
            setChonXe(null);
          }}
        />
      )}
    </div>
  );
}
