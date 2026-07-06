"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Loader2, Search, UserPlus, SlidersHorizontal, RefreshCw, Check, Printer,
  LogOut, X, ScanLine, Save, ClipboardList, Pencil, Users,
  MapPin, Shield, Camera,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import {
  CHAN_DOAN, KHUYEN_NGHI, THI_LUC, parseDiag, ageOf, fmtTime, bhytLevel, statusOf, type HoSo,
} from "@/lib/csr";
import { type ThongTinTheBHYT } from "@/lib/bhxh";
import { Field, Select, ChoiceRow, PillGroup, SectionHeader, DateField, StatusBadge, labelCls } from "@/components/csr/fields";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import { CameraScannerModal } from "@/components/csr/CameraScannerModal";
import { Skeleton3Column, SkeletonList, SkeletonForm } from "@/components/layout/Skeleton";

interface BuoiKham { id: string; coSoId: string; coSo?: { ten: string }; ngayKham: string; xa: string; diaDiem: string; ghiChu?: string | null }

const EMPTY = { thiLucMP: "", thiLucMT: "", chanDoan: [] as string[], chanDoanKhac: "", khuyenNghi: "", sdt: "", nhom: "" };

function applyBhxhDataToForm(
  the: ThongTinTheBHYT,
  setHoTen: (v: string) => void,
  setNgaySinh: (v: string) => void,
  setGioiTinh: (v: string) => void,
  setDiaChi: (v: string) => void
) {
  if (the.hoTen) setHoTen(the.hoTen);
  if (the.ngaySinh) {
    const s = the.ngaySinh.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) setNgaySinh(s);
    else if (/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(s)) {
      const [, d, m, y] = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)!;
      setNgaySinh(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    } else if (/^\d{8}$/.test(s)) {
      setNgaySinh(`${s.slice(4)}-${s.slice(2, 4)}-${s.slice(0, 2)}`);
    }
  }
  if (the.gioiTinh) {
    const gt = the.gioiTinh.trim();
    if (/n[ữu]/i.test(gt) || gt === "2" || gt === "0") setGioiTinh("Nữ");
    else if (/nam/i.test(gt) || gt === "1") setGioiTinh("Nam");
    else setGioiTinh(gt);
  }
  if (the.diaChi) setDiaChi(the.diaChi);
}

// ── Modal tiếp nhận: quét thẻ BHYT / CCCD / VNeID ──────────────────────────
function RegisterModal({ buoiKham, onClose, onCreated }: { buoiKham: BuoiKham; onClose: () => void; onCreated: (p: HoSo) => void }) {
  const [hoTen, setHoTen] = useState("");
  const [bhyt, setBhyt] = useState("");
  const [gioiTinh, setGioiTinh] = useState("");
  const [cccd, setCccd] = useState("");
  const [ngaySinh, setNgaySinh] = useState("");
  const [sdt, setSdt] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [scan, setScan] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [lookup, setLookup] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [lookupMsg, setLookupMsg] = useState("");
  const [theBhyt, setTheBhyt] = useState<ThongTinTheBHYT | null>(null);

  // Tra cứu mã thẻ BHYT qua cổng BHXH theo CCCD + họ tên + ngày sinh.
  const lookupBhxh = async (ma: string, ten: string, dob: string) => {
    if (!ma.trim() || !ten.trim()) { setLookup("fail"); setLookupMsg("Cần CCCD/mã thẻ + họ tên để tra cứu"); return; }
    setLookup("loading"); setLookupMsg("Đang tra cứu BHYT…");
    try {
      const res = await fetch("/api/bhxh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cccd: ma.trim(), hoTen: ten.trim(), ngaySinh: dob }) });
      const r = await res.json();
      if (r.success && r.maThe) {
        setBhyt(String(r.maThe).toUpperCase());
        setTheBhyt(r.the || null);
        setLookup("ok");
        setLookupMsg(`Tìm thấy thẻ: ${r.maThe}`);
        if (r.the) applyBhxhDataToForm(r.the, setHoTen, setNgaySinh, setGioiTinh, setDiaChi);
      } else {
        setTheBhyt(null);
        setLookup("fail");
        setLookupMsg(r.error || "Không tìm thấy thẻ BHYT");
      }
    } catch { setTheBhyt(null); setLookup("fail"); setLookupMsg("Mất kết nối cổng BHXH"); }
  };

  // Decode QR CCCD/BHYT (pipe-delimited): cccd|cmnd|hoTen|ddmmyyyy|gioiTinh|diaChi
  const applyScan = useCallback((rawStr?: string) => {
    const target = (rawStr !== undefined ? rawStr : scan).trim();
    if (!target) return;
    const p = target.split("|").map((s) => s.trim());
    if (p.length >= 6) {
      const cccdV = p[0] || "", tenV = p[2] || "";
      let dobIso = "";
      if (/^\d{8}$/.test(p[3])) dobIso = `${p[3].slice(4)}-${p[3].slice(2, 4)}-${p[3].slice(0, 2)}`;
      setCccd(cccdV); setHoTen(tenV); if (dobIso) setNgaySinh(dobIso);
      setGioiTinh(/n[ữu]/i.test(p[4]) ? "Nữ" : "Nam");
      setDiaChi(p[5] || ""); setScan("");
      if (cccdV && tenV) lookupBhxh(cccdV, tenV, dobIso); // Tự động tra cứu BHYT luôn ngay sau khi quét CCCD
    } else if (/^[A-Za-z]{2}\d/.test(target)) {
      const maV = target.toUpperCase();
      setBhyt(maV); setScan("");
      if (hoTen || cccd) lookupBhxh(maV, hoTen || cccd, ngaySinh);
    } else {
      setCccd(target); setScan("");
      if (target.length === 12 && hoTen) lookupBhxh(target, hoTen, ngaySinh);
    }
  }, [scan, hoTen, cccd, ngaySinh]);

  // Tự động nhận diện & mapping khi chuỗi QR được nhập đủ (từ máy quét mã vạch hoặc paste, không cần phím Enter)
  useEffect(() => {
    if (!scan || !scan.trim()) return;
    const str = scan.trim();
    const p = str.split("|").map((s) => s.trim());

    // 1. Nếu là mã CCCD / VNeID (phát hiện có phân cách | và ít nhất 6 trường, CCCD đủ 12 số)
    if (p.length >= 6 && /^\d{12}$/.test(p[0])) {
      const timer = setTimeout(() => applyScan(str), 100);
      return () => clearTimeout(timer);
    }
    // 2. Nếu là mã thẻ BHYT (đúng 15 ký tự gồm 2 chữ cái + 13 số, VD: DN4838321436964)
    if (/^[A-Za-z]{2}\d{13}$/.test(str)) {
      const timer = setTimeout(() => applyScan(str), 100);
      return () => clearTimeout(timer);
    }
  }, [scan, applyScan]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!ngaySinh) { setErr("Vui lòng chọn ngày sinh"); return; }
    if (!gioiTinh) { setErr("Vui lòng chọn giới tính"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/csr/hoso", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buoiKhamId: buoiKham.id, hoTen, gioiTinh, ngaySinh, cccd, bhyt, sdt, diaChi,
          sdtNguoiNha: sdt ? undefined : "Chưa cung cấp",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Không thể lưu hồ sơ"); return; }
      onCreated(data);
    } catch { setErr("Mất kết nối máy chủ"); }
    finally { setSaving(false); }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={buoiKham.coSo?.ten || "Tiếp nhận bệnh nhân mới"}
      subtitle={<span className="font-mono flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[var(--teal-deep)] inline" /> {buoiKham.diaDiem} · Xã {buoiKham.xa}</span>}
      icon={UserPlus}
      maxWidth="max-w-[760px]"
      noPadding
    >
      <form onSubmit={submit} className="p-8 space-y-7 bg-white">
        {/* QR Scanner Card */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-[var(--navy)]/35 bg-gradient-to-br from-[var(--navy-50)]/60 via-[var(--surface-bg)] to-white p-4 shadow-sm transition-all focus-within:border-[var(--navy)] focus-within:ring-4 focus-within:ring-[var(--navy-100)]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] hover:from-[var(--navy-deep)] hover:to-[var(--navy)] text-white flex items-center justify-center shadow-md shadow-[var(--navy)]/20 shrink-0 ring-2 ring-white transition-all hover:scale-105 active:scale-95 group cursor-pointer"
              title="Bấm để mở Camera quét mã QR"
            >
              <Camera className="w-6 h-6 text-[var(--teal)] animate-pulse group-hover:scale-110 transition-transform" />
            </button>
            <div className="flex-1 min-w-0">
              <input
                value={scan}
                onChange={(e) => setScan(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyScan(scan); } }}
                placeholder="Quét mã QR trên thẻ BHYT / CCCD / VNeID (Tự động nhận diện & tra cứu)..."
                className="w-full bg-transparent text-[14.5px] font-mono font-bold text-[var(--navy-deep)] placeholder:text-[var(--mute)]/80 placeholder:font-sans placeholder:font-medium outline-none"
                autoFocus
              />
            </div>
            {scan && (
              <button
                type="button"
                onClick={() => setScan("")}
                className="p-2 text-[var(--mute)] hover:text-[var(--ink)] rounded-lg hover:bg-black/5 transition-colors"
                title="Xóa chuỗi quét"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[var(--navy)] text-white hover:bg-[var(--navy-deep)] transition-all flex items-center gap-1.5 font-bold text-[13px] shrink-0 shadow-sm hover:shadow"
              title="Quét bằng camera (Mobile/Tablet/PC)"
            >
              <Camera className="w-4 h-4 text-[var(--teal)] shrink-0 animate-pulse" />
              <span className="hidden sm:inline">Quét Camera</span>
            </button>
          </div>
          {lookup === "loading" && (
            <div className="mt-3.5 p-4 rounded-2xl bg-[var(--navy-50)]/70 border border-[var(--navy)]/20 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2.5 text-[13.5px] font-semibold text-[var(--navy)]">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" /> {lookupMsg}
              </div>
              <SkeletonForm fields={4} cols={2} />
            </div>
          )}
          {lookup === "fail" && (
            <div className="mt-3.5 p-3 rounded-xl bg-[var(--rose-soft)] border border-[var(--rose)]/30 flex items-center justify-between text-[13.5px] font-semibold text-[var(--rose)] animate-fade-in">
              <span className="flex items-center gap-2"><X className="w-4 h-4 shrink-0" /> {lookupMsg}</span>
              <button type="button" onClick={() => lookupBhxh(scan || cccd || bhyt, hoTen, ngaySinh)} className="text-[12px] font-bold underline hover:no-underline">Thử lại</button>
            </div>
          )}
          {lookup === "ok" && (
            <div className="mt-3.5 p-3 rounded-xl bg-[var(--teal-soft)]/50 border border-[var(--teal)]/40 flex items-center justify-between text-[13.5px] font-semibold text-[var(--teal-deep)] animate-fade-in">
              <span className="flex items-center gap-2"><Check className="w-4 h-4 shrink-0 stroke-[3]" /> {lookupMsg}</span>
              {theBhyt && <span className="font-mono bg-[var(--teal)] text-white px-2.5 py-0.5 rounded-md text-[11.5px]">Mã: {theBhyt.maThe}</span>}
            </div>
          )}
        </div>

        {err && (
          <div className="p-4 bg-[var(--rose-soft)] border border-[var(--rose)]/30 rounded-2xl text-[13.5px] font-semibold text-[var(--rose)] flex items-center gap-3.5 shadow-sm animate-shake">
            <div className="w-8 h-8 rounded-full bg-[var(--rose)] text-white flex items-center justify-center shrink-0 shadow-xs"><X className="w-4 h-4 stroke-[3]" /></div>
            <div><div className="font-bold">Không thể tiếp nhận</div><div className="text-[12.5px] font-normal opacity-90 mt-0.5">{err}</div></div>
          </div>
        )}

        <div className="space-y-6">
          <SectionHeader n={1} accent="Hành chính & Định danh" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-6"><Field label="Họ và tên" required><input value={hoTen} onChange={(e) => setHoTen(e.target.value)} required className="input-field font-semibold text-[15px]" placeholder="VD: NGUYỄN VĂN A" /></Field></div>
            <div className="md:col-span-3"><Select label="Giới tính" req opts={["Nam", "Nữ", "Khác"]} value={gioiTinh} onChange={setGioiTinh} /></div>
            <div className="md:col-span-3"><Field label="Ngày sinh" required><DateField value={ngaySinh} onChange={setNgaySinh} placeholder="dd/mm/yyyy" /></Field></div>
            <div className="md:col-span-6"><Field label="Số CCCD (12 số font-mono)"><input value={cccd} onChange={(e) => setCccd(e.target.value)} className="input-field font-mono font-bold tracking-wider text-[14.5px]" placeholder="000000000000" maxLength={12} /></Field></div>
            <div className="md:col-span-6"><Field label="Số điện thoại liên hệ"><input value={sdt} onChange={(e) => setSdt(e.target.value)} className="input-field font-mono font-semibold text-[14.5px]" placeholder="0900 000 000" /></Field></div>
            <div className="md:col-span-12"><Field label="Địa chỉ thường trú / Nơi ở hiện tại"><input value={diaChi} onChange={(e) => setDiaChi(e.target.value)} className="input-field" placeholder="Số nhà, đường, thôn/xấp, xã/phường..." /></Field></div>
          </div>
        </div>

        <div className="space-y-6 pt-2">
          <SectionHeader n={2} accent="Thông tin Thẻ BHYT & Tuyến khám" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-8">
              <Field label="Mã thẻ BHYT (15 ký tự)">
                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <input
                      value={bhyt}
                      onChange={(e) => { setBhyt(e.target.value.toUpperCase()); setLookup("idle"); setTheBhyt(null); }}
                      className="input-field font-mono uppercase font-bold text-[var(--navy-deep)] pr-9 tracking-wider text-[15px]"
                      placeholder="VD: DN4838321436964"
                      maxLength={15}
                    />
                    {bhyt && <button type="button" onClick={() => { setBhyt(""); setTheBhyt(null); setLookup("idle"); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)]"><X className="w-4 h-4" /></button>}
                  </div>
                  <button
                    type="button"
                    onClick={() => lookupBhxh(bhyt, hoTen, ngaySinh)}
                    disabled={!bhyt.trim() || lookup === "loading"}
                    className="btn btn-secondary px-5 font-bold shrink-0 border-[var(--line-strong)] hover:border-[var(--navy)] text-[var(--navy)]"
                  >
                    {lookup === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Tra cứu
                  </button>
                </div>
              </Field>
            </div>
            <div className="md:col-span-4">
              <Field label="Mức hưởng BHYT">
                <div className="h-10 px-3.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--line)] flex items-center justify-between font-mono font-bold text-[14px] text-[var(--navy-deep)]">
                  <span>{theBhyt?.mucHuong || bhytLevel(bhyt) || "Chưa xác định"}</span>
                  {bhyt && <span className="w-2 h-2 rounded-full bg-[var(--teal)] animate-pulse" />}
                </div>
              </Field>
            </div>

            {theBhyt && (
              <div className="md:col-span-12 p-4 rounded-2xl bg-gradient-to-br from-[var(--navy-50)] to-[var(--surface-bg)] border border-[var(--navy)]/20 text-[13.5px] text-[var(--navy-deep)] space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--navy)]/10 font-bold text-[14px]">
                  <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-[var(--teal-deep)]" /> Dữ liệu từ Cổng GĐ BHYT / BHXH Việt Nam</span>
                  <span className="font-mono text-[12px] bg-[var(--navy)] text-white px-2.5 py-0.5 rounded-md">Hợp lệ</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
                  <div><span className="text-[var(--mute)] font-medium">Họ tên trên thẻ:</span> <strong className="uppercase">{theBhyt.hoTen || "?"}</strong></div>
                  <div><span className="text-[var(--mute)] font-medium">Ngày sinh:</span> <strong className="font-mono">{theBhyt.ngaySinh || "?"}</strong></div>
                  <div><span className="text-[var(--mute)] font-medium">Hạn sử dụng:</span> <strong className="font-mono">{theBhyt.tuNgay || "?"} → {theBhyt.denNgay || "?"}</strong></div>
                  <div><span className="text-[var(--mute)] font-medium">Nơi ĐKBĐ:</span> <strong>{theBhyt.tenDKBD || "Chưa rõ"} ({theBhyt.maDKBD || ""})</strong></div>
                  {theBhyt.namNamLienTuc && <div className="sm:col-span-2 text-[12.5px] text-[var(--teal-deep)] font-semibold">✨ 5 năm liên tục từ: <span className="font-mono">{theBhyt.namNamLienTuc}</span></div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-[var(--line-soft)] mt-6">
          <button type="button" onClick={onClose} className="btn btn-secondary px-6 py-2.5 font-bold h-11 rounded-xl">Hủy bỏ</button>
          <button type="submit" disabled={saving} className="btn btn-primary px-8 py-2.5 font-bold h-11 rounded-xl shadow-lg shadow-[var(--navy)]/20 min-w-[160px] justify-center">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 stroke-[3] text-[var(--teal)]" /> Tiếp nhận mới</>}
          </button>
        </div>
      </form>
      <CameraScannerModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onScan={(text) => {
          setCameraOpen(false);
          applyScan(text);
        }}
      />
    </Modal>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex gap-1">
      <dt className="w-[64px] shrink-0 text-[var(--mute)]">{k}:</dt>
      <dd className={`flex-1 min-w-0 ${mono ? "font-mono text-[11px]" : ""}`}>{v}</dd>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// Sửa thông tin tiếp nhận của bệnh nhân (mở từ nút bút chì)
function EditInfoModal({ patient, onClose, onSaved }: { patient: HoSo; onClose: () => void; onSaved: () => void }) {
  const [hoTen, setHoTen] = useState(patient.hoTen);
  const [gioiTinh, setGioiTinh] = useState(patient.gioiTinh || "Nam");
  const [ngaySinh, setNgaySinh] = useState(patient.ngaySinh ? new Date(patient.ngaySinh).toISOString().slice(0, 10) : "");
  const [cccd, setCccd] = useState(patient.cccd || "");
  const [bhyt, setBhyt] = useState(patient.bhyt || "");
  const [sdt, setSdt] = useState(patient.sdt || "");
  const [diaChi, setDiaChi] = useState(patient.diaChi || "");
  const [scan, setScan] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [lookup, setLookup] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [lookupMsg, setLookupMsg] = useState("");
  const [theBhyt, setTheBhyt] = useState<ThongTinTheBHYT | null>(null);
  const [hisStatus, setHisStatus] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [hisMsg, setHisMsg] = useState("");
  const [hisData, setHisData] = useState<any>(null);

  const checkHIS = async () => {
    setHisStatus("loading"); setHisMsg("Đang đối chiếu HIS bệnh viện...");
    try {
      const res = await fetch("/api/his/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoSoId: patient.id }),
      });
      const r = await res.json();
      if (r.success && r.data) {
        setHisStatus("ok");
        setHisData(r.data);
        setHisMsg(r.data.chiTiet || `Mã HIS: ${r.data.maHIS}`);
        onSaved();
      } else {
        setHisStatus("fail");
        setHisMsg(r.message || r.error || "Không tìm thấy trên HIS");
      }
    } catch {
      setHisStatus("fail");
      setHisMsg("Lỗi kết nối máy chủ HIS");
    }
  };

  const lookupBhxh = async (ma: string, ten: string, dob: string) => {
    if (!ma.trim() || !ten.trim()) { setLookup("fail"); setLookupMsg("Cần CCCD/mã thẻ + họ tên để tra cứu"); return; }
    setLookup("loading"); setLookupMsg("Đang tra cứu BHYT…");
    try {
      const res = await fetch("/api/bhxh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cccd: ma.trim(), hoTen: ten.trim(), ngaySinh: dob }) });
      const r = await res.json();
      if (r.success && r.maThe) {
        setBhyt(String(r.maThe).toUpperCase());
        setTheBhyt(r.the || null);
        setLookup("ok");
        setLookupMsg(`Tìm thấy thẻ: ${r.maThe}`);
        if (r.the) applyBhxhDataToForm(r.the, setHoTen, setNgaySinh, setGioiTinh, setDiaChi);
      } else {
        setTheBhyt(null);
        setLookup("fail");
        setLookupMsg(r.error || "Không tìm thấy thẻ BHYT");
      }
    } catch { setTheBhyt(null); setLookup("fail"); setLookupMsg("Mất kết nối cổng BHXH"); }
  };

  const applyScan = useCallback((rawStr?: string) => {
    const target = (rawStr !== undefined ? rawStr : scan).trim();
    if (!target) return;
    const p = target.split("|").map((s) => s.trim());
    if (p.length >= 6) {
      const cccdV = p[0] || "", tenV = p[2] || "";
      let dobIso = "";
      if (/^\d{8}$/.test(p[3])) dobIso = `${p[3].slice(4)}-${p[3].slice(2, 4)}-${p[3].slice(0, 2)}`;
      setCccd(cccdV); setHoTen(tenV); if (dobIso) setNgaySinh(dobIso);
      setGioiTinh(/n[ữu]/i.test(p[4]) ? "Nữ" : "Nam");
      setDiaChi(p[5] || ""); setScan("");
      if (cccdV && tenV) lookupBhxh(cccdV, tenV, dobIso);
    } else if (/^[A-Za-z]{2}\d/.test(target)) {
      const maV = target.toUpperCase();
      setBhyt(maV); setScan("");
      if (hoTen || cccd) lookupBhxh(maV, hoTen || cccd, ngaySinh);
    } else {
      setCccd(target); setScan("");
      if (target.length === 12 && hoTen) lookupBhxh(target, hoTen, ngaySinh);
    }
  }, [scan, hoTen, cccd, ngaySinh]);

  useEffect(() => {
    if (!scan || !scan.trim()) return;
    const str = scan.trim();
    const p = str.split("|").map((s) => s.trim());
    if (p.length >= 6 && /^\d{12}$/.test(p[0])) {
      const timer = setTimeout(() => applyScan(str), 100);
      return () => clearTimeout(timer);
    }
    if (/^[A-Za-z]{2}\d{13}$/.test(str)) {
      const timer = setTimeout(() => applyScan(str), 100);
      return () => clearTimeout(timer);
    }
  }, [scan, applyScan]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const res = await fetch(`/api/csr/hoso/${patient.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoTen, gioiTinh, ngaySinh: ngaySinh || null, cccd, bhyt, sdt, diaChi }),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.error || "Không thể lưu"); return; }
      onSaved();
    } catch { setErr("Mất kết nối máy chủ"); }
    finally { setSaving(false); }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Sửa thông tin bệnh nhân"
      icon={Pencil}
      maxWidth="max-w-[650px]"
      noPadding
    >
      <form onSubmit={submit} className="px-6 py-5 space-y-4 bg-white">
        {err && <div className="p-3 bg-[var(--rose-soft)] border border-[var(--rose)] rounded-[var(--r-md)] text-[12px] font-semibold text-[var(--rose)]">{err}</div>}
        
        {/* Quét mã vạch */}
        <div className="p-3 bg-[var(--surface-hover)] rounded-[var(--r-lg)] border border-[var(--line-soft)] flex items-center gap-2.5">
          <button type="button" onClick={() => setCameraOpen(true)} className="w-8 h-8 rounded-lg bg-[var(--teal-soft)] text-[var(--teal-deep)] hover:bg-[var(--teal)] hover:text-white flex items-center justify-center shrink-0 font-bold text-xs transition-colors cursor-pointer" title="Quét bằng camera">QR</button>
          <input
            value={scan}
            onChange={(e) => setScan(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyScan(); } }}
            placeholder="Quét mã QR (CCCD hoặc BHYT)..."
            className="bg-transparent border-none outline-none text-[13.5px] w-full text-[var(--ink)] placeholder:text-[var(--mute)] min-w-0"
          />
          {scan && <button type="button" onClick={() => applyScan()} className="text-[12px] font-bold text-[var(--teal-deep)] hover:underline shrink-0">Áp dụng</button>}
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--teal-soft)] text-[var(--teal-deep)] hover:bg-[var(--teal)] hover:text-white transition-all flex items-center gap-1 font-bold text-[12px] shrink-0"
            title="Quét bằng camera (Mobile/Tablet)"
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Camera</span>
          </button>
        </div>

        <Field label="Họ và tên" required><input value={hoTen} onChange={(e) => setHoTen(e.target.value)} required className="input-field" /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          <Field label="Giới tính" required>
            <div className="flex items-center gap-5 h-[42px]">{["Nam", "Nữ", "Khác"].map((g) => <label key={g} className="flex items-center gap-1.5 cursor-pointer text-[14px]"><input type="radio" name="egt" checked={gioiTinh === g} onChange={() => setGioiTinh(g)} className="accent-[var(--navy)] w-4 h-4" />{g}</label>)}</div>
          </Field>
          <Field label="Ngày sinh"><DateField value={ngaySinh} onChange={setNgaySinh} /></Field>
          <Field label="CCCD"><input value={cccd} onChange={(e) => setCccd(e.target.value)} className="input-field font-mono" /></Field>
          <Field label="Điện thoại"><input value={sdt} onChange={(e) => setSdt(e.target.value)} className="input-field font-mono" /></Field>
        </div>

        <Field label="Mã thẻ BHYT (Tự động tra cứu quyền lợi BHXH)">
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <input
                value={bhyt}
                onChange={(e) => { setBhyt(e.target.value.toUpperCase()); setLookup("idle"); setTheBhyt(null); }}
                className="input-field h-10 font-mono uppercase font-bold text-[var(--navy-deep)] pr-9 text-[14.5px]"
                placeholder="VD: DN4838321436964"
              />
              {bhyt && <button type="button" onClick={() => { setBhyt(""); setTheBhyt(null); setLookup("idle"); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)]"><X className="w-4 h-4" /></button>}
            </div>
            <button
              type="button"
              onClick={() => lookupBhxh(bhyt, hoTen, ngaySinh)}
              disabled={!bhyt.trim() || lookup === "loading"}
              className="btn btn-secondary px-4 font-bold shrink-0 border-[var(--line-strong)] hover:border-[var(--navy)] text-[var(--navy)]"
            >
              {lookup === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Tra cứu
            </button>
          </div>
          {lookup === "ok" && (
            <div className="mt-2 text-[12.5px] font-semibold text-[var(--teal-deep)] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 stroke-[3]" /> {lookupMsg}
              </span>
              <span className="font-mono bg-[var(--teal)] text-white px-3 py-0.5 rounded-full text-[12px] font-bold shadow-sm">
                Mức hưởng: {theBhyt?.mucHuong || bhytLevel(bhyt)}
              </span>
            </div>
          )}
          {theBhyt && (
            <div className="p-3.5 rounded-xl bg-[var(--navy-50)]/80 border border-[var(--navy)]/20 text-[13px] text-[var(--navy-deep)] space-y-2 shadow-sm font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12.5px]">
                <div><span className="text-[var(--mute)] font-medium">Hạn sử dụng:</span> <strong className="font-mono">{theBhyt.tuNgay || "?"} → {theBhyt.denNgay || "?"}</strong></div>
                <div><span className="text-[var(--mute)] font-medium">Nơi ĐKBĐ:</span> <strong>{theBhyt.tenDKBD || "Chưa rõ"} ({theBhyt.maDKBD || ""})</strong></div>
              </div>
              {((theBhyt.hoTen && hoTen && theBhyt.hoTen.toLowerCase() !== hoTen.trim().toLowerCase()) ||
                (theBhyt.ngaySinh && ngaySinh && theBhyt.ngaySinh !== ngaySinh.split("-").reverse().join("/"))) && (
                <div className="p-2.5 rounded-lg bg-[var(--amber-soft)] border border-[var(--amber)]/40 text-[12px] font-semibold text-[var(--amber-deep)] flex items-start gap-2 mt-1">
                  <span>⚠️</span>
                  <span><strong>Lưu ý đối chiếu:</strong> Thông tin trên thẻ BHYT ({theBhyt.hoTen} · {theBhyt.ngaySinh}) có sai lệch so với dữ liệu nhập bên trên!</span>
                </div>
              )}
            </div>
          )}
          {lookup === "loading" && (
            <div className="mt-2.5 p-3 rounded-xl bg-[var(--navy-50)] border border-[var(--navy)]/20 space-y-2.5 animate-fade-in">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--navy)]">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" /> {lookupMsg}
              </div>
              <SkeletonForm fields={2} cols={2} />
            </div>
          )}
          {lookup === "fail" && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-[var(--rose-soft)] border border-[var(--rose)]/30 flex items-center gap-2 text-[13px] font-semibold text-[var(--rose)] animate-fade-in">
              <X className="w-4 h-4 shrink-0" /> {lookupMsg}
            </div>
          )}
          {lookup === "idle" && bhyt.trim() && (
            <div className="mt-2 text-[12.5px] font-semibold text-[var(--teal-deep)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)]" />
              <span>Mức hưởng dự kiến: {bhytLevel(bhyt)}</span>
            </div>
          )}
        </Field>

        <Field label="Địa chỉ"><input value={diaChi} onChange={(e) => setDiaChi(e.target.value)} className="input-field" /></Field>
        <div className="flex justify-end gap-3 pt-1"><button type="button" onClick={onClose} className="btn btn-secondary px-5 py-2.5 font-bold">Hủy</button><button type="submit" disabled={saving} className="btn btn-primary px-8 py-2.5 font-bold">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[var(--teal)]" />} Lưu</button></div>
      </form>
      <CameraScannerModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onScan={(text) => {
          setCameraOpen(false);
          applyScan(text);
        }}
      />
    </Modal>
  );
}

export default function ExamPage() {
  const { buoiKhamId } = useParams<{ buoiKhamId: string }>();
  const { data: session } = useSession();
  const { addToast } = useToast();

  const [buoiKham, setBuoiKham] = useState<BuoiKham | null>(null);
  const [patients, setPatients] = useState<HoSo[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReg, setShowReg] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const [f, setF] = useState(EMPTY);
  const [baseline, setBaseline] = useState(() => JSON.stringify(EMPTY));
  const dirty = JSON.stringify(f) !== baseline;

  const selected = useMemo(() => patients.find((p) => p.id === selId) || null, [patients, selId]);
  const isDone = selected && selected.trangThai !== "TiepNhan";
  const readOnly = !!isDone && !isEditing;

  const loadForm = useCallback((p: HoSo) => {
    const next = {
      thiLucMP: p.thiLucMP || "", thiLucMT: p.thiLucMT || "",
      chanDoan: parseDiag(p.chanDoan), chanDoanKhac: p.chanDoanKhac || "", khuyenNghi: p.khuyenNghi || "",
      sdt: p.sdt || "", nhom: p.nhom || "",
    };
    setF(next); setBaseline(JSON.stringify(next));
  }, []);

  const fetchPatients = useCallback(async (keepSel?: string, forceForm = false) => {
    const res = await fetch(`/api/csr/hoso?buoiKhamId=${buoiKhamId}&search=${encodeURIComponent(search)}`);
    const data: HoSo[] = res.ok ? await res.json() : [];
    setPatients(data);
    const next = data.find((p) => p.id === (keepSel ?? selId)) || data[0] || null;
    if (next) { if (forceForm || next.id !== selId) loadForm(next); setSelId(next.id); } else setSelId(null);
    return data;
  }, [buoiKhamId, search, selId, loadForm]);

  useEffect(() => {
    (async () => {
      const bk = await fetch("/api/csr/buoikham").then((r) => (r.ok ? r.json() : []));
      setBuoiKham((bk as BuoiKham[]).find((b) => b.id === buoiKhamId) || null);
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

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const pick = (p: HoSo) => {
    if (p.id === selId) return;
    if (dirty && !window.confirm("Có thay đổi chưa lưu. Chuyển bệnh nhân khác và bỏ thay đổi?")) return;
    setIsEditing(false);
    setSelId(p.id); loadForm(p);
  };

  const save = useCallback(async () => {
    if (!selected) return;
    if (f.chanDoan.includes("Khác") && !f.chanDoanKhac.trim()) { addToast({ type: "error", message: "Vui lòng nhập Chẩn đoán khác." }); return; }
    if (f.nhom === "A" && !f.sdt.trim()) { addToast({ type: "error", message: "Vui lòng nhập số điện thoại khi chọn nhóm A." }); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/csr/hoso/${selected.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thiLucMP: f.thiLucMP, thiLucMT: f.thiLucMT, chanDoan: f.chanDoan, chanDoanKhac: f.chanDoanKhac, khuyenNghi: f.khuyenNghi, sdt: f.sdt || undefined, nhom: f.nhom || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { addToast({ type: "error", message: data.error || "Không thể lưu" }); return; }
      addToast({ type: "success", title: `Đã lưu: ${selected.hoTen}`, message: "Cập nhật kết quả khám." });
      setIsEditing(false);
      await fetchPatients(selected.id, true);
    } catch { addToast({ type: "error", message: "Mất kết nối máy chủ" }); }
    finally { setSaving(false); }
  }, [selected, f, addToast, fetchPatients]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (selected && dirty && !saving) save(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [selected, dirty, saving, save]);

  const toggleChanDoan = (v: string) => setF((s) => ({ ...s, chanDoan: s.chanDoan.includes(v) ? s.chanDoan.filter((x) => x !== v) : [...s.chanDoan, v] }));

  const visible = useMemo(() => patients.filter((p) => {
    if (!filter) return true;
    if (filter === "TiepNhan") return p.trangThai === "TiepNhan";
    if (filter === "DaKham") return p.trangThai !== "TiepNhan";
    if (filter === "PhauThuat") return p.khuyenNghi === "Phẫu thuật";
    return true;
  }), [patients, filter]);
  const FILTERS = [{ key: "", label: "Tất cả" }, { key: "TiepNhan", label: "Tiếp nhận" }, { key: "DaKham", label: "Đã khám" }, { key: "PhauThuat", label: "Khuyến nghị mổ" }];

  const steps = useMemo(() => [
    { 
      label: "1. Tiếp nhận hồ sơ", 
      done: !!selected, 
      desc: selected ? `Mã BN: ${selected.maBN}` : "Chưa chọn bệnh nhân" 
    },
    { 
      label: "2. Đo thị lực", 
      done: !!(selected?.thiLucMP || selected?.thiLucMT), 
      desc: selected?.thiLucMP && selected?.thiLucMT ? `MP: ${selected.thiLucMP} · MT: ${selected.thiLucMT}` : "Chưa đo thị lực" 
    },
    { 
      label: "3. Khám lâm sàng", 
      done: !!(selected && (parseDiag(selected.chanDoan).length || selected.khuyenNghi)), 
      desc: selected?.khuyenNghi ? `Khuyến nghị: ${selected.khuyenNghi}` : selected?.chanDoan ? "Đã khám mắt" : "Chưa khám lâm sàng" 
    },
    { 
      label: "4. Tư vấn & Phân nhóm", 
      done: !!(selected?.nhom || (selected?.khuyenNghi && selected?.khuyenNghi !== "Phẫu thuật")), 
      desc: selected?.nhom ? `Đã xếp Nhóm ${selected.nhom}` : selected?.khuyenNghi && selected?.khuyenNghi !== "Phẫu thuật" ? `Hoàn tất (${selected.khuyenNghi})` : "Chưa phân nhóm" 
    },
  ], [selected]);
  const doneCount = steps.filter((s) => s.done).length;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-[var(--surface-bg)] overflow-hidden" suppressHydrationWarning>
        <PageHeader
          title="Đợt khám · Đang tải..."
          description="Đang truy xuất dữ liệu đợt khám và danh sách bệnh nhân..."
          guide={[]}
        />
        <Skeleton3Column />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--surface-bg)] overflow-hidden" suppressHydrationWarning>
      <PageHeader
        title={buoiKham ? `Đợt khám · Xã ${buoiKham.xa}` : "Đợt khám"}
        description={buoiKham ? `${buoiKham.coSo?.ten || ""} · ${buoiKham.diaDiem}` : "—"}
        guide={[
          { selector: '[data-tour="kh-reg"]', title: "Đăng ký bệnh nhân", desc: "Bấm nút ＋ này rồi quét mã QR trên thẻ BHYT / CCCD / VNeID để tự điền thông tin." },
          { selector: '[data-tour="kh-list"]', title: "Chọn bệnh nhân", desc: "Bấm vào tên trong danh sách để mở phiếu khám của bệnh nhân đó." },
          { selector: '[data-tour="kh-vision"]', title: "Đo thị lực", desc: "Chọn thị lực mắt phải (MP) và mắt trái (MT). (Chọn 1 bệnh nhân để thấy phần này)" },
          { selector: '[data-tour="kh-exam"]', title: "Khám mắt & khuyến nghị", desc: "Chọn chẩn đoán và khuyến nghị. Nếu chọn \"Phẫu thuật\" sẽ hiện thêm phần tư vấn & phân nhóm." },
          { selector: '[data-tour="kh-save"]', title: "Lưu kết quả khám", desc: "Bấm \"Lưu kết quả khám\" ở thanh dưới (hoặc Ctrl+S). Nếu đã khám xong, bấm \"Sửa kết quả\" để chỉnh lại." },
        ]}
        guideTip="Cột giữa hiển thị tiến độ 4 bước cho từng bệnh nhân đang chọn."
        actions={
          <>
            <Link href="/buoi-kham" className="btn btn-secondary px-3 py-1.5 text-[12.5px] font-semibold h-8 rounded-[var(--r-sm)] border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors">Các đợt khám</Link>
            <Link href={`/tu-van`} className="btn btn-secondary px-3 py-1.5 text-[12.5px] font-semibold h-8 rounded-[var(--r-sm)] border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors">Tư vấn & Phân nhóm</Link>
            <button onClick={() => fetchPatients(selId ?? undefined)} className="p-1.5 rounded text-[var(--mute)] hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--line)] transition-colors" title="Tải lại">
              <RefreshCw className="w-4 h-4" />
            </button>
          </>
        }
      />

      <div className="flex-1 flex flex-col xl:flex-row min-h-0 border-t border-[var(--line)] overflow-y-auto xl:overflow-hidden relative">
        {/* Mobile Floating Action Button (FAB) - Nút tròn biểu tượng ở phải */}
        <button
          onClick={() => setShowList(true)}
          className="xl:hidden fixed bottom-20 right-4 z-[900] w-14 h-14 rounded-full bg-[var(--navy)] text-white shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-center border-2 border-white/20 hover:scale-105 active:scale-95 transition-all group"
          title="Danh sách bệnh nhân"
        >
          <Users className="w-6 h-6 text-[var(--teal)] group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-[var(--rose)] text-white font-mono text-[11px] font-bold rounded-full flex items-center justify-center shadow-md border-2 border-white">
            {patients.length}
          </span>
        </button>

        {/* Backdrop */}
        {showList && <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[2px] transition-opacity xl:hidden" onClick={() => setShowList(false)} />}

        {/* COL 1 — danh sách (Drawer on mobile, Static on desktop) */}
        <aside className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${showList ? "translate-x-0" : "translate-x-full"} xl:static xl:translate-x-0 xl:w-[310px] xl:shrink-0 xl:border-r xl:border-[var(--line)] xl:shadow-none xl:z-0`}>
          <div className="px-4 py-3.5 flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface-bg)] xl:bg-white xl:py-4 xl:border-b-0">
            <h2 className="text-[13px] xl:text-[11px] font-extrabold uppercase tracking-[0.1em] xl:tracking-[0.12em] text-[var(--navy)] flex items-center gap-2 xl:block"><Users className="w-4 h-4 xl:hidden" /> <span className="xl:hidden">Danh sách bệnh nhân</span><span className="hidden xl:inline">Bệnh nhân</span></h2>
            <button onClick={() => setShowList(false)} className="p-1.5 rounded-full hover:bg-[var(--line-soft)] text-[var(--mute)] active:scale-90 transition-transform xl:hidden"><X className="w-5 h-5" /></button>
          </div>
          <div className="px-4 xl:px-3 pt-4 xl:pt-0 pb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mute)]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên, CCCD, BHYT"
                className="w-full h-10 rounded-full border border-[var(--line)] bg-[var(--surface-bg)] pl-9 pr-9 text-[13px] outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy-100)]" />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--navy)]" />}
            </div>
            <button data-tour="kh-reg" onClick={() => setShowReg(true)} title="Đăng ký bệnh nhân" className="w-10 h-10 shrink-0 rounded-full bg-[var(--teal)] text-white flex items-center justify-center hover:bg-[var(--teal-deep)] active:scale-95 transition-transform shadow-[var(--shadow-sm)]"><UserPlus className="w-[18px] h-[18px]" /></button>
          </div>
          <div className="px-3 pb-2 flex items-center justify-between">
            <div className="relative">
              <button onClick={() => setFilterOpen((v) => !v)} className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-[var(--r-sm)] border transition-colors ${filter ? "text-[var(--gold-deep)] bg-[var(--gold-soft)] border-[var(--gold-line)]" : "text-[var(--ink-soft)] bg-white border-[var(--line)] hover:bg-[var(--surface-hover)]"}`}><SlidersHorizontal className="w-3.5 h-3.5" /> Bộ lọc{filter ? " · 1" : ""}</button>
              {filterOpen && (<>
                <div className="fixed inset-0 z-20" onClick={() => setFilterOpen(false)} />
                <div className="absolute left-0 top-full mt-1 z-30 w-[180px] bg-white border border-[var(--line)] rounded-[var(--r-md)] shadow-[var(--shadow-lg)] p-1 animate-fade-in">
                  {FILTERS.map((ft) => <button key={ft.key} onClick={() => { setFilter(ft.key); setFilterOpen(false); }} className={`w-full text-left px-3 py-2 rounded-[var(--r-sm)] text-[12.5px] font-semibold flex items-center justify-between ${filter === ft.key ? "bg-[var(--navy-50)] text-[var(--navy)]" : "text-[var(--ink-soft)] hover:bg-[var(--surface-hover)]"}`}>{ft.label}{filter === ft.key && <Check className="w-3.5 h-3.5" />}</button>)}
                </div>
              </>)}
            </div>
            <span className="text-[12px] text-[var(--mute)] font-medium">{filter ? `${visible.length}/${patients.length}` : patients.length} BN</span>
          </div>
          <div data-tour="kh-list" className="flex-1 overflow-y-auto px-2 pb-3 space-y-1.5">
            {searching ? (
              <SkeletonList items={5} />
            ) : patients.length === 0 ? (
              <div className="flex flex-col items-center text-center text-[var(--mute)] text-[12.5px] py-16 px-6 gap-2"><UserPlus className="w-8 h-8 text-[var(--mute-soft)]" /><span>Chưa có bệnh nhân.<br />Nhấn <b className="text-[var(--teal-deep)]">＋</b> để đăng ký.</span></div>
            ) : visible.length === 0 ? (
              <div className="text-center text-[var(--mute)] text-[12.5px] py-14 px-6">Không khớp bộ lọc / tìm kiếm.</div>
            ) : visible.map((p) => {
              const active = selId === p.id; const st = statusOf(p.trangThai);
              return (
                <button key={p.id} onClick={() => { pick(p); setShowList(false); }} className={`w-full text-left rounded-[var(--r-md)] border px-3 py-2.5 transition-all duration-150 ${active ? "border-[var(--navy)] bg-[var(--navy-50)] shadow-[0_0_0_1px_var(--navy)]" : "border-[var(--line)] bg-white hover:border-[var(--navy-100)] hover:bg-[var(--surface-soft)]"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-bold text-[var(--ink)] truncate"><span className="text-[var(--mute)]">{p.stt}.</span> {p.hoTen}</span>
                    <span className="font-mono text-[11px] font-bold text-[var(--teal-deep)] shrink-0">{p.maBN.split("-").pop()}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-[11.5px] text-[var(--mute)]">{p.gioiTinh} · {ageOf(p)} tuổi</span>
                    <StatusBadge label={st.label} cls={st.cls} sm />
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* COL 2 — thông tin + timeline */}
        <section className="w-full xl:w-[380px] shrink-0 border-b xl:border-b-0 xl:border-r border-[var(--line)] bg-white flex flex-col h-auto xl:min-h-0">
          {selected ? (<>
            <div className="px-4 pt-4 pb-3">
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--navy)] mb-2">Thực hiện</h2>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif text-[19px] font-bold text-[var(--ink)] leading-tight uppercase">{selected.hoTen}</h3>
                <button onClick={() => setShowEdit(true)} title="Sửa thông tin bệnh nhân" className="p-1 rounded text-[var(--navy)] hover:bg-[var(--navy-50)] active:scale-90 transition-transform shrink-0"><Pencil className="w-4 h-4" /></button>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-[11px] font-bold text-[var(--navy)] bg-[var(--navy-50)] px-1.5 py-0.5 rounded">ID: {selected.maBN}</span>
                <StatusBadge label={statusOf(selected.trangThai).label} cls={statusOf(selected.trangThai).cls} sm />
              </div>
              <dl className="mt-3 space-y-1 text-[11.5px] text-[var(--ink-soft)]">
                <Row k="Giới tính" v={`${selected.gioiTinh} · ${ageOf(selected)} tuổi`} />
                <Row k="BHYT" v={selected.bhyt ? `${selected.bhyt} · ${bhytLevel(selected.bhyt)}` : "—"} mono />
                <Row k="CCCD" v={selected.cccd || "—"} mono />
                <Row k="SĐT" v={selected.sdt || "—"} mono />
                <Row k="Địa chỉ" v={selected.diaChi || "—"} />
              </dl>
            </div>
            <div className="xl:flex-1 xl:overflow-y-auto px-4 py-4 border-t border-[var(--line)]">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--ink)]"><ClipboardList className="w-4 h-4 text-[var(--navy)]" /> Các bước thực hiện</span>
                <span className="font-mono text-[11px] font-bold text-[var(--navy)] bg-[var(--navy-50)] px-2 py-0.5 rounded-[6px]">{doneCount}/{steps.length}</span>
              </div>
              <ol className="relative pl-1">
                <span className="absolute left-[9px] top-1 bottom-3 w-px bg-[var(--line)]" />
                {steps.map((s) => (
                  <li key={s.label} className="relative flex items-start gap-3 mb-4 last:mb-0">
                    <span className={`relative z-10 w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${s.done ? "bg-[var(--teal)] text-white shadow-2xs" : "bg-white border-2 border-[var(--line-strong)]"}`}>{s.done && <Check className="w-3 h-3 stroke-[3]" />}</span>
                    <div>
                      <div className={`text-[13px] font-bold leading-tight ${s.done ? "text-[var(--ink)]" : "text-[var(--mute)]"}`}>{s.label}</div>
                      <div className="text-[11px] font-medium text-[var(--mute)] mt-0.5">{s.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </>) : <div className="flex-1 flex items-center justify-center text-[var(--mute)] text-[13px] px-6 text-center">Chọn bệnh nhân để xem hồ sơ</div>}
        </section>

        {/* COL 3 — phiếu lâm sàng */}
        <main className="flex-1 min-w-0 flex flex-col bg-[var(--surface-bg)] min-h-[70vh] xl:min-h-0">
          {selected ? (<>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div data-tour="kh-vision" className="card p-0">
                <SectionHeader n={1} accent="Đo thị lực" />
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <Select label="1.1 Thị lực mắt phải (MP)" value={f.thiLucMP} onChange={(v) => setF((s) => ({ ...s, thiLucMP: v }))} opts={THI_LUC} disabled={readOnly} />
                  <Select label="1.2 Thị lực mắt trái (MT)" value={f.thiLucMT} onChange={(v) => setF((s) => ({ ...s, thiLucMT: v }))} opts={THI_LUC} disabled={readOnly} />
                </div>
              </div>
              <div data-tour="kh-exam" className="card p-0">
                <SectionHeader n={2} accent="Khám mắt" />
                <div className="p-5 space-y-5">
                  <div>
                    <label className={labelCls}>2.1 Chẩn đoán</label>
                    <PillGroup options={CHAN_DOAN} selected={f.chanDoan} onToggle={toggleChanDoan} disabled={readOnly} />
                    {f.chanDoan.includes("Khác") && <input value={f.chanDoanKhac} onChange={(e) => setF((s) => ({ ...s, chanDoanKhac: e.target.value }))} placeholder="Nhập chẩn đoán khác…" className="input-field mt-3" disabled={readOnly} />}
                  </div>
                  <div>
                    <label className={labelCls}>2.2 Khuyến nghị</label>
                    <ChoiceRow options={[...KHUYEN_NGHI]} value={f.khuyenNghi} onChange={(v) => {
                      setF((s) => ({ ...s, khuyenNghi: v, nhom: v === "Phẫu thuật" ? s.nhom : "" }));
                    }} disabled={readOnly} />
                  </div>
                </div>
              </div>
              {f.khuyenNghi === "Phẫu thuật" && (
                <div className="card p-0 mt-5">
                  <SectionHeader n={3} accent="Tư vấn" />
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    <div>
                      <label className={labelCls}>3.1 Chọn nhóm</label>
                      <ChoiceRow options={["A", "B"]} value={f.nhom} onChange={(v) => setF((s) => ({ ...s, nhom: v }))} render={(o) => o === "A" ? "Nhóm A (Đồng ý mổ)" : "Nhóm B (Suy nghĩ thêm)"} disabled={readOnly} />
                    </div>
                    <Field label="3.2 Số điện thoại" required={f.nhom === "A"}>
                      <input value={f.sdt} onChange={(e) => setF((s) => ({ ...s, sdt: e.target.value }))} placeholder="Nhập SĐT..." className="input-field font-mono" disabled={readOnly} />
                    </Field>
                  </div>
                </div>
              )}
            </div>
            <div data-tour="kh-save" className="p-4 border-t border-[var(--line)] bg-white flex items-center justify-between">
              <span className="text-[12px] flex items-center gap-2 min-w-0">
                {dirty ? <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--amber)]"><span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-pulse" /> Chưa lưu</span> : <span className="inline-flex items-center gap-1.5 text-[var(--mute)]"><Check className="w-3.5 h-3.5 text-[var(--teal)]" /> Đã lưu</span>}
              </span>
              {readOnly ? (
                <button onClick={() => setIsEditing(true)} className="btn btn-secondary px-8 py-2.5 font-bold"><Pencil className="w-4 h-4 text-[var(--navy)]" /> Sửa kết quả</button>
              ) : (
                <div className="flex items-center gap-3">
                  {!!isDone && isEditing && <button onClick={() => { setIsEditing(false); setF(JSON.parse(baseline)); }} className="font-semibold text-[13px] text-[var(--mute)] hover:text-[var(--ink)]">Hủy</button>}
                  <button onClick={save} disabled={saving || !dirty} className="btn btn-primary px-8 py-2.5 font-bold">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[var(--teal)]" />} Lưu kết quả khám</button>
                </div>
              )}
            </div>
          </>) : <div className="flex-1 flex items-center justify-center text-[var(--mute)] text-[14px] px-8 text-center">Chọn bệnh nhân hoặc đăng ký mới để nhập kết quả khám.</div>}
        </main>
      </div>

      {showReg && buoiKham && <RegisterModal buoiKham={buoiKham} onClose={() => setShowReg(false)} onCreated={(p) => { setShowReg(false); fetchPatients(p.id, true); }} />}
      {showEdit && selected && <EditInfoModal patient={selected} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); fetchPatients(selected.id, true); }} />}
    </div>
  );
}
