"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Loader2, Search, UserPlus, SlidersHorizontal, RefreshCw, Check, Printer,
  LogOut, X, ScanLine, Save, ClipboardList, Pencil, Users,
  MapPin,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import {
  CHAN_DOAN, KHUYEN_NGHI, THI_LUC, parseDiag, ageOf, fmtTime, bhytLevel, statusOf, type HoSo,
} from "@/lib/csr";
import { type ThongTinTheBHYT } from "@/lib/bhxh";
import { Field, Select, ChoiceRow, PillGroup, SectionHeader, DateField, StatusBadge, labelCls } from "@/components/csr/fields";
import PageHeader from "@/components/layout/PageHeader";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--navy-ink)]/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-[760px] bg-white rounded-[24px] shadow-2xl border border-[var(--line)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 bg-gradient-to-br from-[var(--surface-bg)] to-white border-b border-[var(--line-soft)] rounded-t-[24px] shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-white flex items-center justify-center shadow-lg shadow-[var(--navy)]/20 shrink-0 ring-4 ring-[var(--navy-50)]">
              <UserPlus className="w-6 h-6 text-[var(--teal)]" />
            </div>
            <div>
              <h2 className="font-serif text-[21px] font-bold text-[var(--ink)] tracking-tight">
                {buoiKham.coSo?.ten || "Tiếp nhận bệnh nhân mới"}
              </h2>
              <p className="font-mono text-[13px] text-[var(--mute)] mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--teal-deep)]" /> {buoiKham.diaDiem} · Xã {buoiKham.xa}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--mute)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] active:scale-95 transition-all" title="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={submit} className="flex-1 overflow-y-auto px-8 py-6 space-y-7 rounded-b-[24px]">
          {/* QR Scanner Card */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-[var(--navy)]/35 bg-gradient-to-br from-[var(--navy-50)]/60 via-[var(--surface-bg)] to-white p-4 shadow-sm transition-all focus-within:border-[var(--navy)] focus-within:ring-4 focus-within:ring-[var(--navy-100)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] text-white flex items-center justify-center shadow-md shadow-[var(--navy)]/20 shrink-0 ring-2 ring-white">
                <ScanLine className="w-6 h-6 text-[var(--teal)] animate-pulse" />
              </div>
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
            </div>
          </div>

          {err && (
            <div className="p-3.5 bg-[var(--rose-soft)] border border-[var(--rose)]/30 rounded-xl text-[13px] font-semibold text-[var(--rose)] flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" /> {err}
            </div>
          )}

          {/* Section 1: Thông tin hành chính */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-black uppercase tracking-widest text-[var(--navy)] bg-[var(--navy-50)] px-3 py-1 rounded-full border border-[var(--navy)]/15">Thông tin hành chính</span>
              <div className="h-px bg-[var(--line-soft)] flex-1" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
              <div className="sm:col-span-5">
                <Field label="Họ và tên bệnh nhân" required>
                  <input value={hoTen} onChange={(e) => setHoTen(e.target.value)} required className="input-field h-10 font-bold text-[14.5px]" placeholder="VD: NGUYỄN VĂN A" />
                </Field>
              </div>
              <div className="sm:col-span-4">
                <Field label="Ngày sinh" required>
                  <DateField value={ngaySinh} onChange={setNgaySinh} placeholder="dd/mm/yyyy" />
                </Field>
              </div>
              <div className="sm:col-span-3">
                <Field label="Giới tính" required>
                  <ChoiceRow options={["Nam", "Nữ", "Khác"]} value={gioiTinh} onChange={setGioiTinh} />
                </Field>
              </div>
              <div className="sm:col-span-12">
                <Field label="Địa chỉ cư trú">
                  <input value={diaChi} onChange={(e) => setDiaChi(e.target.value)} className="input-field h-10" placeholder="Số nhà, đường, thôn/ấp, xã/phường, quận/huyện..." />
                </Field>
              </div>
            </div>
          </div>

          {/* Section 2: Định danh & BHYT */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-black uppercase tracking-widest text-[var(--teal-deep)] bg-[var(--teal-soft)] px-3 py-1 rounded-full border border-[var(--teal)]/20">Định danh & BHYT</span>
              <div className="h-px bg-[var(--line-soft)] flex-1" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Số CCCD / Định danh cá nhân">
                <input value={cccd} onChange={(e) => setCccd(e.target.value)} className="input-field h-10 font-mono font-medium" placeholder="Nhập 12 số CCCD..." />
              </Field>
              <Field label="Điện thoại liên hệ">
                <input value={sdt} onChange={(e) => setSdt(e.target.value)} className="input-field h-10 font-mono font-medium" placeholder="VD: 0912345678" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Mã thẻ BHYT (Tự động tra cứu quyền lợi BHXH)">
                  <div className="flex gap-2.5">
                    <div className="relative flex-1">
                      <input
                        value={bhyt}
                        onChange={(e) => { setBhyt(e.target.value.toUpperCase()); setLookup("idle"); setTheBhyt(null); }}
                        className="input-field h-10 font-mono uppercase font-bold text-[var(--navy-deep)] pr-9 text-[14.5px]"
                        placeholder="VD: DN4838321436964"
                      />
                      {lookup === "loading" && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--navy)]" />}
                    </div>
                    <button
                      type="button"
                      onClick={() => lookupBhxh(bhyt || cccd, hoTen, ngaySinh)}
                      disabled={lookup === "loading"}
                      title="Tra cứu thẻ BHYT theo CCCD/Mã thẻ"
                      className="btn btn-secondary px-5 h-10 shrink-0 flex items-center gap-2 font-bold rounded-xl shadow-sm"
                    >
                      {lookup === "loading" ? <Loader2 className="w-4 h-4 animate-spin text-[var(--navy)]" /> : <><Search className="w-4 h-4 text-[var(--navy)]" /> Tra cứu BHYT</>}
                    </button>
                  </div>

                  {lookup === "ok" && (
                    <div className="mt-2.5 space-y-2 animate-fade-in">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-[var(--teal-soft)] to-white border border-[var(--teal)]/30 flex items-center justify-between text-[13px] text-[var(--teal-deep)] shadow-sm font-medium">
                        <span className="flex items-center gap-2 font-bold">
                          <Check className="w-4 h-4 stroke-[3]" /> {lookupMsg}
                        </span>
                        <span className="font-mono bg-[var(--teal)] text-white px-3 py-0.5 rounded-full text-[12px] font-bold shadow-sm">
                          Mức hưởng: {theBhyt?.mucHuong || bhytLevel(bhyt)}
                        </span>
                      </div>
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
                    </div>
                  )}
                  {lookup === "loading" && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-[var(--navy-50)] border border-[var(--navy)]/20 flex items-center gap-2 text-[13px] font-semibold text-[var(--navy)] animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" /> {lookupMsg}
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
              </div>
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
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--navy-ink)]/45 backdrop-blur-sm p-4">
      <div className="w-full max-w-[650px] bg-white rounded-[var(--r-xl)] shadow-[var(--shadow-lg)] animate-fade-in border border-[var(--line)] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--line)] rounded-t-[var(--r-xl)] bg-white"><h2 className="font-serif text-[18px] font-semibold text-[var(--ink)]">Sửa thông tin bệnh nhân</h2><button onClick={onClose} className="p-1.5 rounded-full text-[var(--mute)] hover:bg-[var(--surface-hover)]"><X className="w-5 h-5" /></button></div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4 rounded-b-[var(--r-xl)] bg-white max-h-[82vh] overflow-y-auto">
          {err && <div className="p-3 bg-[var(--rose-soft)] border border-[var(--rose)] rounded-[var(--r-md)] text-[12px] font-semibold text-[var(--rose)]">{err}</div>}
          
          {/* Quét mã vạch */}
          <div className="p-3 bg-[var(--surface-hover)] rounded-[var(--r-lg)] border border-[var(--line-soft)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--teal-soft)] text-[var(--teal-deep)] flex items-center justify-center shrink-0 font-bold">QR</div>
            <input
              value={scan}
              onChange={(e) => setScan(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyScan(); } }}
              placeholder="Quét mã QR (CCCD hoặc BHYT) vào đây để điền tự động..."
              className="bg-transparent border-none outline-none text-[13.5px] w-full text-[var(--ink)] placeholder:text-[var(--mute)]"
            />
            {scan && <button type="button" onClick={() => applyScan()} className="text-[12px] font-bold text-[var(--teal-deep)] hover:underline shrink-0">Áp dụng</button>}
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
                {lookup === "loading" && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--navy)]" />}
              </div>
              <button
                type="button"
                onClick={() => lookupBhxh(bhyt || cccd, hoTen, ngaySinh)}
                disabled={lookup === "loading"}
                title="Tra cứu thẻ BHYT theo CCCD/Mã thẻ"
                className="btn btn-secondary px-4 h-10 shrink-0 flex items-center gap-2 font-bold rounded-xl shadow-sm"
              >
                {lookup === "loading" ? <Loader2 className="w-4 h-4 animate-spin text-[var(--navy)]" /> : <><Search className="w-4 h-4 text-[var(--navy)]" /> Tra cứu BHYT</>}
              </button>
              <button
                type="button"
                onClick={() => checkHIS()}
                disabled={hisStatus === "loading"}
                title="Đối chiếu lịch sử khám & phẫu thuật trên HIS bệnh viện"
                className="btn px-4 h-10 shrink-0 flex items-center gap-1.5 font-bold rounded-xl shadow-sm bg-gradient-to-r from-[var(--amber-soft)] to-white border border-[var(--amber)] text-[var(--amber-deep)] hover:bg-[var(--amber)] hover:text-white transition-all"
              >
                {hisStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin text-[var(--amber-deep)]" /> : <>⚡ Đối chiếu HIS</>}
              </button>
            </div>

            {hisStatus !== "idle" && (
              <div className={`mt-2.5 p-3 rounded-xl border text-[13px] font-medium shadow-sm flex items-center justify-between animate-fade-in ${hisStatus === "ok" ? "bg-gradient-to-r from-[var(--amber-soft)] to-white border-[var(--amber)] text-[var(--amber-deep)]" : "bg-[var(--rose-soft)] border-[var(--rose)] text-[var(--rose)]"}`}>
                <span className="flex items-center gap-2 font-bold">
                  {hisStatus === "ok" ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />} {hisMsg}
                </span>
                {hisData?.hasSurgery && (
                  <span className="bg-[var(--amber-deep)] text-white px-3 py-0.5 rounded-full text-[12px] font-bold shadow-sm">
                    ĐÃ PHẪU THUẬT
                  </span>
                )}
              </div>
            )}

            {lookup === "ok" && (
              <div className="mt-2.5 space-y-2 animate-fade-in">
                <div className="p-3 rounded-xl bg-gradient-to-r from-[var(--teal-soft)] to-white border border-[var(--teal)]/30 flex items-center justify-between text-[13px] text-[var(--teal-deep)] shadow-sm font-medium">
                  <span className="flex items-center gap-2 font-bold">
                    <Check className="w-4 h-4 stroke-[3]" /> {lookupMsg}
                  </span>
                  <span className="font-mono bg-[var(--teal)] text-white px-3 py-0.5 rounded-full text-[12px] font-bold shadow-sm">
                    Mức hưởng: {theBhyt?.mucHuong || bhytLevel(bhyt)}
                  </span>
                </div>
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
              </div>
            )}
            {lookup === "loading" && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-[var(--navy-50)] border border-[var(--navy)]/20 flex items-center gap-2 text-[13px] font-semibold text-[var(--navy)] animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" /> {lookupMsg}
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
      </div>
    </div>
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
    { label: "Đo thị lực", done: !!(selected?.thiLucMP || selected?.thiLucMT) },
    { label: "Khám mắt", done: !!(selected && (parseDiag(selected.chanDoan).length || selected.khuyenNghi)) },
  ], [selected]);
  const doneCount = steps.filter((s) => s.done).length;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-9 h-9 animate-spin text-[var(--navy)]" /></div>;

  return (
    <div className="flex-1 flex flex-col bg-[var(--surface-bg)] overflow-hidden">
      <PageHeader
        title={buoiKham ? `Đợt khám · Xã ${buoiKham.xa}` : "Đợt khám"}
        description={buoiKham ? `${buoiKham.coSo?.ten || ""} · ${buoiKham.diaDiem}` : "—"}
        actions={
          <>
            <button onClick={() => setShowList(true)} className="xl:hidden btn btn-secondary px-3 py-1.5 text-[12.5px] font-semibold h-8 rounded-[var(--r-sm)] border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-1.5 text-[var(--navy)]"><Users className="w-4 h-4" /> Bệnh nhân <span className="bg-[var(--rose)] text-white text-[10px] px-1.5 rounded-full">{patients.length}</span></button>
            <Link href="/buoi-kham" className="btn btn-secondary px-3 py-1.5 text-[12.5px] font-semibold h-8 rounded-[var(--r-sm)] border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors">Các đợt khám</Link>
            <Link href={`/tu-van`} className="btn btn-secondary px-3 py-1.5 text-[12.5px] font-semibold h-8 rounded-[var(--r-sm)] border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors">Tư vấn & Phân nhóm</Link>
            <button onClick={() => fetchPatients(selId ?? undefined)} className="p-1.5 rounded text-[var(--mute)] hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--line)] transition-colors" title="Tải lại">
              <RefreshCw className="w-4 h-4" />
            </button>
          </>
        }
      />

      <div className="flex-1 flex flex-col xl:flex-row min-h-0 border-t border-[var(--line)] overflow-y-auto xl:overflow-hidden relative">
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
            <button onClick={() => setShowReg(true)} title="Đăng ký bệnh nhân" className="w-10 h-10 shrink-0 rounded-full bg-[var(--teal)] text-white flex items-center justify-center hover:bg-[var(--teal-deep)] active:scale-95 transition-transform shadow-[var(--shadow-sm)]"><UserPlus className="w-[18px] h-[18px]" /></button>
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
          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1.5">
            {patients.length === 0 ? (
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
                <span className="font-mono text-[11px] text-[var(--mute)]">{doneCount}/2</span>
              </div>
              <ol className="relative pl-1">
                <span className="absolute left-[9px] top-1 bottom-3 w-px bg-[var(--line)]" />
                {steps.map((s) => (
                  <li key={s.label} className="relative flex items-start gap-3 mb-4 last:mb-0">
                    <span className={`relative z-10 w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${s.done ? "bg-[var(--teal)] text-white" : "bg-white border-2 border-[var(--line-strong)]"}`}>{s.done && <Check className="w-3 h-3 stroke-[3]" />}</span>
                    <div><div className={`text-[13px] font-bold ${s.done ? "text-[var(--ink)]" : "text-[var(--mute)]"}`}>{s.label}</div><div className="text-[10.5px] text-[var(--mute)] mt-0.5">{s.done ? fmtTime(selected.updatedAt) : "Chưa thực hiện"}</div></div>
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
              <div className="card p-0">
                <SectionHeader n={1} accent="Đo thị lực" />
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <Select label="1.1 Thị lực mắt phải (MP)" value={f.thiLucMP} onChange={(v) => setF((s) => ({ ...s, thiLucMP: v }))} opts={THI_LUC} disabled={readOnly} />
                  <Select label="1.2 Thị lực mắt trái (MT)" value={f.thiLucMT} onChange={(v) => setF((s) => ({ ...s, thiLucMT: v }))} opts={THI_LUC} disabled={readOnly} />
                </div>
              </div>
              <div className="card p-0">
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
            <div className="p-4 border-t border-[var(--line)] bg-white flex items-center justify-between">
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
