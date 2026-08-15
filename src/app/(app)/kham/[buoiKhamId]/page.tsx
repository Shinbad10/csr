"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Loader2, Search, UserPlus, SlidersHorizontal, RefreshCw, Check, Printer,
  LogOut, X, ScanLine, Save, ClipboardList, Pencil, Users,
  MapPin, Shield, Camera, AlertTriangle, ArrowUpDown, ChevronRight, ChevronDown, CheckCircle2, Clock, Sparkles, UserCheck,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useRealtimeEvent } from "@/lib/useRealtime";
import {
  CHAN_DOAN, KHUYEN_NGHI, THI_LUC, parseDiag, ageOf, fmtDate, fmtBuoiKhamName, bhytLevel, statusOf, type HoSo,
} from "@/lib/csr";
import {
  BENH_SU_OPTIONS, BENH_LY_OPTIONS, LOAI_BENH_LY_OPTIONS, HUONG_XU_TRI, MUC_HUONG_BHYT,
  huongXuTriToKhuyenNghi, parseFieldConfig, isFieldOn, type FieldConfig,
} from "@/lib/formFields";
import { type ThongTinTheBHYT } from "@/lib/bhxh";
import { Field, Select, ChoiceRow, PillGroup, MultiSelect, SectionHeader, DateField, StatusBadge, labelCls } from "@/components/csr/fields";
import PageHeader from "@/components/layout/PageHeader";
import Modal from "@/components/layout/Modal";
import { CameraScannerModal } from "@/components/csr/CameraScannerModal";
import { BarcodeScannerInput } from "@/components/csr/BarcodeScannerInput";
import { Skeleton3Column, SkeletonList, SkeletonForm } from "@/components/layout/Skeleton";

interface BuoiKham { id: string; coSoId: string; coSo?: { id: string; ten: string; cauHinhTruong?: string | null }; ngayKham: string; xa: string; diaDiem: string; bacSiKham?: string | null; ghiChu?: string | null }

const CO_KHONG = ["Có", "Không"];
/** Boolean? ⇄ "Có" / "Không" / "" cho ChoiceRow */
const boolToChoice = (v?: boolean | null) => (v == null ? "" : v ? "Có" : "Không");
const choiceToBool = (v: string) => (v === "" ? null : v === "Có");
const mucHuongFromThe = (bhyt?: string | null) => {
  const n = parseInt(bhytLevel(bhyt), 10);
  return Number.isFinite(n) ? String(n) : "";
};

const EMPTY = {
  thiLucMP: "", thiLucMT: "", matKham: "",
  chanDoanMP: [] as string[], chanDoanKhacMP: "",
  chanDoanMT: [] as string[], chanDoanKhacMT: "",
  chanDoan: [] as string[], chanDoanKhac: "",
  khuyenNghi: "", sdt: "", nhom: "",
  // Phiếu khám sàng lọc nhãn khoa
  benhSu: "", loaiBenhSu: [] as string[], loaiBenhSuKhac: "",
  chieuCao: "", canNang: "",
  benhLy: "", loaiBenhLy: [] as string[], loaiBenhLyKhac: "",
  huongXuTri: "", huongXuTriKhac: "",
  // Bác sỹ chỉ định & Điểm khám lấy từ đợt khám hoặc chọn qua autocomplete
  bacSiChiDinh: "",
  nhanVienTuVan: "",
  xacNhanDieuTri: "", lyDoKhongDieuTri: "",
  ngayDieuTri: "",
  ghiChuTuVan: "",
};

function applyBhxhDataToForm(
  the: ThongTinTheBHYT,
  setHoTen: (v: string) => void,
  setNgaySinh: (v: string) => void,
  setGioiTinh: (v: string) => void,
  setDiaChi: (v: string) => void,
  setCccd?: (v: string) => void
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
  // Chỉ điền khi cổng BHXH thực sự trả CCCD; caller tự quyết định có ghi đè số đang có không
  if (the.cccd && setCccd) setCccd(the.cccd);
}

// ── Modal tiếp nhận: quét thẻ BHYT / CCCD / VNeID ──────────────────────────
function RegisterModal({ buoiKham, cfg, onClose, onCreated }: { buoiKham: BuoiKham; cfg: FieldConfig; onClose: () => void; onCreated: (p: HoSo) => void }) {
  const [hoTen, setHoTen] = useState("");
  const [bhyt, setBhyt] = useState("");
  const [gioiTinh, setGioiTinh] = useState("");
  const [cccd, setCccd] = useState("");
  const [ngaySinh, setNgaySinh] = useState("");
  const [sdt, setSdt] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [khuPho, setKhuPho] = useState("");
  const [xaPhuong, setXaPhuong] = useState("");
  const [mucHuong, setMucHuong] = useState("");
  const [scan, setScan] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [dupWarning, setDupWarning] = useState<string | null>(null);
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
        // CCCD: chỉ điền khi ô đang trống, không đè số nhân viên tiếp nhận đã nhập tay
        if (r.the) applyBhxhDataToForm(r.the, setHoTen, setNgaySinh, setGioiTinh, setDiaChi, (v) => setCccd((prev) => prev.trim() || v));
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
      const cccdV = (p[0] || "").replace(/\D/g, "").slice(0, 12), tenV = p[2] || "";
      // Ngày sinh trên QR CCCD/VNeID: chuẩn BCA là ddmmyyyy (8 số), nhưng một số đầu đọc trả dd/mm/yyyy hoặc chỉ yyyy
      const dobRaw = (p[3] || "").replace(/\s/g, "");
      let dobIso = "";
      if (/^\d{8}$/.test(dobRaw)) dobIso = `${dobRaw.slice(4)}-${dobRaw.slice(2, 4)}-${dobRaw.slice(0, 2)}`;
      else if (/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(dobRaw)) {
        const [, d, m, y] = dobRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)!;
        dobIso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      } else if (/^\d{4}$/.test(dobRaw)) dobIso = `${dobRaw}-01-01`;
      setCccd(cccdV); setHoTen(tenV); if (dobIso) setNgaySinh(dobIso);
      // Giới tính trên thẻ: "Nam" / "Nữ"; chỉ khi khớp "Nữ" mới là Nữ, còn lại mặc định Nam
      setGioiTinh(/n[ữu]/i.test(p[4] || "") ? "Nữ" : "Nam");
      setDiaChi(p[5] || ""); setScan("");
      if (cccdV && tenV) lookupBhxh(cccdV, tenV, dobIso); // Tự động tra cứu BHYT luôn ngay sau khi quét CCCD
    } else if (/^[A-Za-z]{2}\d/.test(target)) {
      const maV = target.toUpperCase();
      setBhyt(maV); setScan("");
      if (hoTen || cccd) lookupBhxh(maV, hoTen || cccd, ngaySinh);
    } else if (/^\d{9,12}$/.test(target)) {
      const cccdV = target.replace(/\D/g, "").slice(0, 12);
      setCccd(cccdV); setScan("");
      if (hoTen) lookupBhxh(cccdV, hoTen, ngaySinh);
    } else {
      // Chuỗi quét rác hoặc địa chỉ bị ngắt dở -> bỏ qua, tuyệt đối không ghi đè vào Số CCCD
      setScan("");
      return;
    }
  }, [scan, hoTen, cccd, ngaySinh]);

  const handleCccdChange = (val: string) => {
    if (val.includes("|")) { applyScan(val); return; }
    setCccd(val.replace(/\D/g, "").slice(0, 12));
  };
  const handleHoTenChange = (val: string) => {
    if (val.includes("|")) { applyScan(val); return; }
    setHoTen(val);
  };
  const handleBhytChange = (val: string) => {
    if (val.includes("|")) { applyScan(val); return; }
    setBhyt(val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15));
    setLookup("idle"); setTheBhyt(null);
  };
  const handleSdtChange = (val: string) => {
    if (val.includes("|")) { applyScan(val); return; }
    setSdt(val.replace(/[^0-9\s.+]/g, "").slice(0, 15));
  };
  const handleDiaChiChange = (val: string) => {
    if (val.includes("|")) { applyScan(val); return; }
    setDiaChi(val);
  };

  const handleResetForm = () => {
    setHoTen("");
    setBhyt("");
    setGioiTinh("Nam");
    setCccd("");
    setNgaySinh("");
    setSdt("");
    setDiaChi("");
    setKhuPho("");
    setXaPhuong("");
    setMucHuong("");
    setScan("");
    setTheBhyt(null);
    setLookup("idle");
    setLookupMsg("");
    setErr("");
    setDupWarning(null);
  };

  // Mức hưởng suy tự động từ mã thẻ mỗi khi thẻ đổi
  useEffect(() => { const m = mucHuongFromThe(bhyt); if (m) setMucHuong(m); }, [bhyt]);

  const submit = async (e?: React.FormEvent, forceCreate = false) => {
    if (e) e.preventDefault();
    setErr("");
    if (!forceCreate) setDupWarning(null);
    if (!ngaySinh) { setErr("Vui lòng chọn ngày sinh"); return; }
    if (!gioiTinh) { setErr("Vui lòng chọn giới tính"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/csr/hoso", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buoiKhamId: buoiKham.id, hoTen, gioiTinh, ngaySinh, cccd, bhyt, sdt, diaChi,
          mucHuongBHYT: mucHuong || undefined,
          khuPho: isFieldOn(cfg, "khuPho") ? khuPho : undefined,
          xaPhuong: isFieldOn(cfg, "xaPhuong") ? xaPhuong : undefined,
          sdtNguoiNha: sdt ? undefined : "Chưa cung cấp",
          forceCreate,
          boQuaTrung: forceCreate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 || data.isDuplicate || (data.error && data.error.includes("Bệnh nhân đã có trong buổi khám"))) {
          setDupWarning(data.error || "Bệnh nhân này đã có trong danh sách buổi khám hôm nay.");
          return;
        }
        setErr(data.error || "Không thể lưu hồ sơ");
        return;
      }
      onCreated(data);
    } catch { setErr("Mất kết nối máy chủ"); }
    finally { setSaving(false); }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={buoiKham.coSo?.ten || "Tiếp nhận bệnh nhân mới"}
      subtitle={<span className="font-mono flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[var(--teal-deep)] inline" /> {fmtBuoiKhamName(buoiKham)}</span>}
      icon={UserPlus}
      maxWidth="max-w-[760px]"
      noPadding
    >
      <form onSubmit={submit} className="p-3.5 sm:px-5 sm:py-3 space-y-2.5 bg-[var(--surface-bg)]">
        {/* QR Scanner Card (Đã cách ly re-render và chống nhảy tab Tiếng Việt) */}
        <BarcodeScannerInput
          onScan={(text) => applyScan(text)}
          onOpenCamera={() => setCameraOpen(true)}
          lookupStatus={lookup}
          lookupMsg={lookupMsg}
          onRetryLookup={() => lookupBhxh(cccd || bhyt, hoTen, ngaySinh)}
          theBhytMa={theBhyt?.maThe}
          autoFocus={true}
          onClear={handleResetForm}
        />

        {err && (
          <div className="p-4 bg-[var(--rose-soft)] border border-[var(--rose)]/30 rounded-2xl text-[13.5px] font-semibold text-[var(--rose)] flex items-center gap-3.5 shadow-sm animate-shake">
            <div className="w-8 h-8 rounded-full bg-[var(--rose)] text-white flex items-center justify-center shrink-0 shadow-xs"><X className="w-4 h-4 stroke-[3]" /></div>
            <div><div className="font-bold">Không thể tiếp nhận</div><div className="text-[12.5px] font-normal opacity-90 mt-0.5">{err}</div></div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-2.5">
          {/* Row 1: Họ và tên * (6) | Mã thẻ BH (6) */}
          <div className="sm:col-span-6">
            <Field label="Họ và tên" required>
              <input value={hoTen} onChange={(e) => handleHoTenChange(e.target.value)} required className="input-field font-semibold text-[15px]" placeholder="VD: NGUYỄN VĂN A" />
            </Field>
          </div>
          <div className="sm:col-span-6">
            <Field label="Mã thẻ BH">
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <input
                    value={bhyt}
                    onChange={(e) => handleBhytChange(e.target.value)}
                    className="input-field font-mono uppercase font-bold text-[var(--navy-deep)] pr-8 tracking-wider text-[14.5px]"
                    placeholder="VD: DN4838321436964"
                    maxLength={15}
                  />
                  {bhyt && <button type="button" onClick={() => { setBhyt(""); setTheBhyt(null); setLookup("idle"); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"><X className="w-4 h-4" /></button>}
                </div>
                <button
                  type="button"
                  onClick={() => lookupBhxh(bhyt, hoTen, ngaySinh)}
                  disabled={!bhyt.trim() || lookup === "loading"}
                  className="btn btn-secondary px-3.5 font-bold shrink-0 border-[var(--line-strong)] hover:border-[var(--navy)] text-[var(--navy)] text-[13px]"
                  title="Tra cứu BHYT"
                >
                  {lookup === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </button>
              </div>
            </Field>
          </div>

          {/* Row 2: Giới tính * (6) | CCCD (6 - bỏ required) */}
          <div className="sm:col-span-6">
            <Field label="Giới tính" required>
              <div className="flex items-center gap-5 h-10 px-1">
                {["Nam", "Nữ", "Khác"].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="radio" name="gioiTinh" checked={gioiTinh === g} onChange={() => setGioiTinh(g)} className="w-4.5 h-4.5 accent-[var(--teal-deep)] cursor-pointer" />
                    <span className="text-[14px] font-medium text-[var(--ink)]">{g}</span>
                  </label>
                ))}
              </div>
            </Field>
          </div>
          <div className="sm:col-span-6">
            <Field label="CCCD">
              <input value={cccd} onChange={(e) => handleCccdChange(e.target.value)} className="input-field font-mono font-bold tracking-wider text-[14.5px]" placeholder="000000000000" maxLength={12} />
            </Field>
          </div>

          {/* Row 3: Ngày sinh * (6) | Điện thoại (6) */}
          <div className="sm:col-span-6">
            <Field label="Ngày sinh" required>
              <DateField value={ngaySinh} onChange={setNgaySinh} placeholder="dd/mm/yyyy" />
            </Field>
          </div>
          <div className="sm:col-span-6">
            <Field label="Điện thoại">
              <input value={sdt} onChange={(e) => handleSdtChange(e.target.value)} className="input-field font-mono font-semibold text-[14.5px]" placeholder="0900 000 000" />
            </Field>
          </div>

          {/* Row 4: Địa chỉ (12) - Đã bỏ khu phố, xã phường */}
          {isFieldOn(cfg, "diaChi") && (
            <div className="sm:col-span-12">
              <Field label="Địa chỉ">
                <input value={diaChi} onChange={(e) => handleDiaChiChange(e.target.value)} className="input-field" placeholder="Số nhà, đường, thôn/ấp..." />
              </Field>
            </div>
          )}

          {/* Nếu có nhập BHYT hoặc có thông tin tra cứu -> hiển thị Mức hưởng & kết quả tra cứu */}
          {(bhyt.trim().length > 0 || theBhyt) && (
            <div className="sm:col-span-6">
              <Select label="Mức hưởng BHYT (%)" req value={mucHuong} onChange={setMucHuong} opts={MUC_HUONG_BHYT.map(String)} placeholder="Chọn mức hưởng…" />
            </div>
          )}

          {theBhyt && (
            <div className="sm:col-span-12 p-3.5 rounded-xl bg-gradient-to-br from-[var(--navy-50)] to-[var(--surface-bg)] border border-[var(--navy)]/20 text-[13px] text-[var(--navy-deep)] space-y-2 shadow-xs animate-fade-in">
              <div className="flex items-center justify-between pb-1.5 border-b border-[var(--navy)]/10 font-bold text-[13.5px]">
                <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-[var(--teal-deep)]" /> Dữ liệu BHYT / BHXH hợp lệ</span>
                <span className="font-mono text-[11.5px] bg-[var(--navy)] text-white px-2 py-0.5 rounded-md">OK</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12.5px]">
                <div><span className="text-[var(--mute)] font-medium">Họ tên trên thẻ:</span> <strong className="uppercase">{theBhyt.hoTen || "?"}</strong></div>
                <div><span className="text-[var(--mute)] font-medium">Ngày sinh:</span> <strong className="font-mono">{theBhyt.ngaySinh || "?"}</strong></div>
                <div><span className="text-[var(--mute)] font-medium">Hạn sử dụng:</span> <strong className="font-mono">{theBhyt.tuNgay || "?"} → {theBhyt.denNgay || "?"}</strong></div>
                <div><span className="text-[var(--mute)] font-medium">Nơi ĐKBĐ:</span> <strong>{theBhyt.tenDKBD || "Chưa rõ"} ({theBhyt.maDKBD || ""})</strong></div>
                {theBhyt.namNamLienTuc && <div className="sm:col-span-2 text-[12px] text-[var(--teal-deep)] font-semibold">✨ 5 năm liên tục từ: <span className="font-mono">{theBhyt.namNamLienTuc}</span></div>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={handleResetForm}
            className="btn btn-secondary px-4 py-2.5 font-bold h-11 rounded-xl text-[var(--mute)] hover:text-[var(--rose)] border border-dashed hover:border-[var(--rose)]/40 flex items-center gap-1.5 cursor-pointer transition-all text-[13px]"
            title="Xóa trắng toàn bộ form để nhập lại từ đầu"
          >
            <RefreshCw className="w-4 h-4" /> Làm mới form
          </button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="btn btn-secondary px-6 py-2.5 font-bold h-11 rounded-xl">Hủy bỏ</button>
            <button type="submit" disabled={saving} className="btn btn-primary px-8 py-2.5 font-bold h-11 rounded-xl shadow-lg shadow-[var(--navy)]/20 min-w-[160px] justify-center">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 stroke-[3] text-[var(--teal)]" /> Tiếp nhận mới</>}
            </button>
          </div>
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

      {/* Modal Confirm Cảnh Báo Trùng Lặp Bệnh Nhân */}
      {dupWarning && (
        <Modal
          open={true}
          onClose={() => setDupWarning(null)}
          title="Cảnh báo trùng lặp bệnh nhân"
          icon={AlertTriangle}
          maxWidth="max-w-[500px]"
          className="!z-[1100]"
          footer={
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={handleResetForm}
                className="btn btn-secondary h-10 px-4 text-[13px] font-bold border-[var(--rose)]/30 text-[var(--rose)] hover:bg-[var(--rose-soft)] hover:border-[var(--rose)]/50 cursor-pointer"
              >
                Không lưu & Reset form
              </button>
              <button
                type="button"
                onClick={() => submit(undefined, true)}
                disabled={saving}
                className="btn h-10 px-5 text-[13px] font-bold text-white cursor-pointer bg-[var(--amber-deep)] hover:bg-[var(--amber-ink)] shadow-[var(--shadow-sm)] active:scale-[0.98]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                Tiếp tục lưu
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-[14px]">
            <div className="flex items-start gap-3.5 p-4 rounded-[var(--r-lg)] bg-[var(--amber-soft)] border border-[var(--amber)]/25 border-l-[3px] border-l-[var(--amber)] shadow-[var(--shadow-xs)]">
              <AlertTriangle className="w-5 h-5 text-[var(--amber-deep)] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="font-bold text-[14.5px] text-[var(--amber-ink)]">Phát hiện hồ sơ đã tồn tại</div>
                <div className="mt-1 text-[13px] leading-relaxed text-[var(--ink-soft)] break-words">{dupWarning}</div>
              </div>
            </div>

            <p className="text-[var(--ink)] leading-relaxed font-medium">
              Anh/chị có chắc chắn muốn tiếp tục lưu hồ sơ mới này vào danh sách khám không?
            </p>
          </div>
        </Modal>
      )}
    </Modal>
  );
}

/** Giá trị chỉ-đọc suy từ đợt khám / tài khoản — hiển thị gọn, không giả dạng ô nhập. */
function Meta({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5 min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--mute)] shrink-0">{k}</dt>
      <dd className={`text-[13px] font-semibold text-[var(--ink)] truncate ${mono ? "font-mono" : ""}`}>{v}</dd>
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
function EditInfoModal({ patient, cfg, onClose, onSaved }: { patient: HoSo; cfg: FieldConfig; onClose: () => void; onSaved: () => void }) {
  const [hoTen, setHoTen] = useState(patient.hoTen);
  const [gioiTinh, setGioiTinh] = useState(patient.gioiTinh || "Nam");
  const [ngaySinh, setNgaySinh] = useState(patient.ngaySinh ? new Date(patient.ngaySinh).toISOString().slice(0, 10) : "");
  const [cccd, setCccd] = useState(patient.cccd || "");
  const [bhyt, setBhyt] = useState(patient.bhyt || "");
  const [sdt, setSdt] = useState(patient.sdt || "");
  const [diaChi, setDiaChi] = useState(patient.diaChi || "");
  const [khuPho, setKhuPho] = useState(patient.khuPho || "");
  const [xaPhuong, setXaPhuong] = useState(patient.xaPhuong || "");
  const [mucHuong, setMucHuong] = useState(patient.mucHuongBHYT != null ? String(patient.mucHuongBHYT) : mucHuongFromThe(patient.bhyt));
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
        // CCCD: chỉ điền khi ô đang trống, không đè số nhân viên tiếp nhận đã nhập tay
        if (r.the) applyBhxhDataToForm(r.the, setHoTen, setNgaySinh, setGioiTinh, setDiaChi, (v) => setCccd((prev) => prev.trim() || v));
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
      const cccdV = (p[0] || "").replace(/\D/g, "").slice(0, 12), tenV = p[2] || "";
      const dobRaw = (p[3] || "").replace(/\s/g, "");
      let dobIso = "";
      if (/^\d{8}$/.test(dobRaw)) dobIso = `${dobRaw.slice(4)}-${dobRaw.slice(2, 4)}-${dobRaw.slice(0, 2)}`;
      else if (/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(dobRaw)) {
        const [, d, m, y] = dobRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)!;
        dobIso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      } else if (/^\d{4}$/.test(dobRaw)) dobIso = `${dobRaw}-01-01`;
      setCccd(cccdV); setHoTen(tenV); if (dobIso) setNgaySinh(dobIso);
      setGioiTinh(/n[ữu]/i.test(p[4] || "") ? "Nữ" : "Nam");
      setDiaChi(p[5] || ""); setScan("");
      if (cccdV && tenV) lookupBhxh(cccdV, tenV, dobIso);
    } else if (/^[A-Za-z]{2}\d/.test(target)) {
      const maV = target.toUpperCase();
      setBhyt(maV); setScan("");
      if (hoTen || cccd) lookupBhxh(maV, hoTen || cccd, ngaySinh);
    } else if (/^\d{9,12}$/.test(target)) {
      const cccdV = target.replace(/\D/g, "").slice(0, 12);
      setCccd(cccdV); setScan("");
      if (hoTen) lookupBhxh(cccdV, hoTen, ngaySinh);
    } else {
      // Chuỗi quét rác hoặc địa chỉ bị ngắt dở -> bỏ qua, tuyệt đối không ghi đè vào Số CCCD
      setScan("");
      return;
    }
  }, [scan, hoTen, cccd, ngaySinh]);

  const handleCccdChange = (val: string) => {
    if (val.includes("|")) { applyScan(val); return; }
    setCccd(val.replace(/\D/g, "").slice(0, 12));
  };
  const handleHoTenChange = (val: string) => {
    if (val.includes("|")) { applyScan(val); return; }
    setHoTen(val);
  };
  const handleBhytChange = (val: string) => {
    if (val.includes("|")) { applyScan(val); return; }
    setBhyt(val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15));
    setLookup("idle"); setTheBhyt(null);
  };
  const handleSdtChange = (val: string) => {
    if (val.includes("|")) { applyScan(val); return; }
    setSdt(val.replace(/[^0-9\s.+]/g, "").slice(0, 15));
  };

  // Mức hưởng suy tự động từ mã thẻ mỗi khi thẻ đổi
  useEffect(() => { const m = mucHuongFromThe(bhyt); if (m) setMucHuong(m); }, [bhyt]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      const res = await fetch(`/api/csr/hoso/${patient.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoTen, gioiTinh, ngaySinh: ngaySinh || null, cccd, bhyt, sdt, diaChi,
          mucHuongBHYT: mucHuong || null,
          ...(isFieldOn(cfg, "khuPho") ? { khuPho } : {}),
          ...(isFieldOn(cfg, "xaPhuong") ? { xaPhuong } : {}),
        }),
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
      <form onSubmit={submit} className="px-6 py-3.5 space-y-3 bg-white">
        {err && <div className="p-3 bg-[var(--rose-soft)] border border-[var(--rose)] rounded-[var(--r-md)] text-[12px] font-semibold text-[var(--rose)]">{err}</div>}

        {/* Quét mã vạch (Tối ưu cách ly re-render và khóa phím tắt Tiếng Việt) */}
        <BarcodeScannerInput
          onScan={(text) => applyScan(text)}
          onOpenCamera={() => setCameraOpen(true)}
          compact={true}
          autoFocus={false}
        />

        <Field label="Họ và tên" required><input value={hoTen} onChange={(e) => handleHoTenChange(e.target.value)} required className="input-field" /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          <Field label="Giới tính" required>
            <div className="flex items-center gap-5 h-[42px]">{["Nam", "Nữ", "Khác"].map((g) => <label key={g} className="flex items-center gap-1.5 cursor-pointer text-[14px]"><input type="radio" name="egt" checked={gioiTinh === g} onChange={() => setGioiTinh(g)} className="accent-[var(--navy)] w-4 h-4" />{g}</label>)}</div>
          </Field>
          <Field label="Ngày sinh"><DateField value={ngaySinh} onChange={setNgaySinh} /></Field>
          <Field label="CCCD"><input value={cccd} onChange={(e) => handleCccdChange(e.target.value)} className="input-field font-mono" /></Field>
          <Field label="Điện thoại"><input value={sdt} onChange={(e) => handleSdtChange(e.target.value)} className="input-field font-mono" /></Field>
        </div>

        <Field label="Mã thẻ BHYT (Tự động tra cứu quyền lợi BHXH)">
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <input
                value={bhyt}
                onChange={(e) => handleBhytChange(e.target.value)}
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

        <Select label="Mức hưởng BHYT (%)" req value={mucHuong} onChange={setMucHuong} opts={MUC_HUONG_BHYT.map(String)} placeholder="Chọn mức hưởng…" />

        {isFieldOn(cfg, "diaChi") && (
          <Field label="Địa chỉ"><input value={diaChi} onChange={(e) => setDiaChi(e.target.value)} className="input-field" placeholder="Số nhà, đường, thôn/ấp..." /></Field>
        )}
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
  const confirm = useConfirm();

  const [buoiKham, setBuoiKham] = useState<BuoiKham | null>(null);
  const [patients, setPatients] = useState<HoSo[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReg, setShowReg] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"queue" | "stt_asc" | "stt_desc" | "latest">("queue");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const [f, setF] = useState(EMPTY);
  const [baseline, setBaseline] = useState(() => JSON.stringify(EMPTY));
  const dirty = JSON.stringify(f) !== baseline;

  // Cấu hình bật/tắt trường phiếu khám của cơ sở
  const [cfg, setCfg] = useState<FieldConfig>({});

  // Tên người đăng nhập — điền sẵn "Nhân viên tư vấn" cho hồ sơ chưa có
  const sessionName = useRef("");
  useEffect(() => { sessionName.current = session?.user?.name || ""; }, [session]);

  const selected = useMemo(() => patients.find((p) => p.id === selId) || null, [patients, selId]);
  const isDone = selected && selected.trangThai !== "TiepNhan";
  const readOnly = !!isDone && !isEditing;

  /** Khuyến nghị hiệu lực: nếu bật "Hướng xử trí" thì suy từ đó, không thì dùng trường cũ. */
  const effKhuyenNghi = isFieldOn(cfg, "huongXuTri") ? huongXuTriToKhuyenNghi(f.huongXuTri) : f.khuyenNghi;

  const loadForm = useCallback((p: HoSo) => {
    // Parse chẩn đoán theo MP và MT nếu có
    const cdMP = parseDiag(p.chanDoanMP ?? null);
    const cdMT = parseDiag(p.chanDoanMT ?? null);
    let cdKhacMP = p.chanDoanKhacMP || "";
    let cdKhacMT = p.chanDoanKhacMT || "";

    // Fallback nếu dữ liệu cũ chưa tách riêng MP/MT
    if (cdMP.length === 0 && cdMT.length === 0) {
      const allDiag = parseDiag(p.chanDoan);
      allDiag.forEach((d) => {
        if (d.includes("(MP)") || d.startsWith("MP:")) {
          cdMP.push(d.replace(" (MP)", "").replace(/^MP:\s*/, "").trim());
        } else if (d.includes("(MT)") || d.startsWith("MT:")) {
          cdMT.push(d.replace(" (MT)", "").replace(/^MT:\s*/, "").trim());
        } else if (p.matKham === "Mắt phải") {
          cdMP.push(d);
        } else if (p.matKham === "Mắt trái") {
          cdMT.push(d);
        } else {
          cdMP.push(d);
        }
      });
      if (p.chanDoanKhac) {
        if (p.matKham === "Mắt trái") cdKhacMT = p.chanDoanKhac;
        else cdKhacMP = p.chanDoanKhac;
      }
    }

    const next = {
      thiLucMP: p.thiLucMP || "", thiLucMT: p.thiLucMT || "",
      matKham: p.matKham || "",
      chanDoanMP: cdMP, chanDoanKhacMP: cdKhacMP,
      chanDoanMT: cdMT, chanDoanKhacMT: cdKhacMT,
      chanDoan: parseDiag(p.chanDoan), chanDoanKhac: p.chanDoanKhac || "", khuyenNghi: p.khuyenNghi || "",
      sdt: p.sdt || "", nhom: p.nhom || "",
      benhSu: boolToChoice(p.benhSu), loaiBenhSu: parseDiag(p.loaiBenhSu ?? "[]"), loaiBenhSuKhac: p.loaiBenhSuKhac || "",
      chieuCao: p.chieuCao || "", canNang: p.canNang || "",
      benhLy: p.benhLy || "", loaiBenhLy: parseDiag(p.loaiBenhLy ?? "[]"), loaiBenhLyKhac: p.loaiBenhLyKhac || "",
      huongXuTri: p.huongXuTri || "", huongXuTriKhac: p.huongXuTriKhac || "",
      bacSiChiDinh: p.bacSiChiDinh || buoiKham?.bacSiKham || "",
      nhanVienTuVan: p.nhanVienTuVan || sessionName.current || session?.user?.name || "",
      xacNhanDieuTri: boolToChoice(p.xacNhanDieuTri), lyDoKhongDieuTri: p.lyDoKhongDieuTri || "",
      ngayDieuTri: p.ngayDieuTri ? new Date(p.ngayDieuTri).toISOString().slice(0, 10) : "",
      ghiChuTuVan: p.ghiChuTuVan || "",
    };
    setF(next); setBaseline(JSON.stringify(next));
  }, [buoiKham?.bacSiKham, session?.user?.name]);

  const fetchPatients = useCallback(async (keepSel?: string, forceForm = false) => {
    const targetId = decodeURIComponent(buoiKhamId || "").normalize("NFC");
    const res = await fetch(`/api/csr/hoso?buoiKhamId=${encodeURIComponent(targetId)}&search=${encodeURIComponent(search)}`);
    const data: HoSo[] = res.ok ? await res.json() : [];
    setPatients(data);
    const next = data.find((p) => p.id === (keepSel ?? selId)) || data[0] || null;
    if (next) { if (forceForm || next.id !== selId) loadForm(next); setSelId(next.id); } else setSelId(null);
    return data;
  }, [buoiKhamId, search, selId, loadForm]);

  useEffect(() => {
    (async () => {
      const targetId = decodeURIComponent(buoiKhamId || "").normalize("NFC");
      let cur: BuoiKham | null = null;
      try {
        const res = await fetch(`/api/csr/buoikham/${encodeURIComponent(targetId)}`);
        if (res.ok) cur = await res.json();
      } catch { }

      if (!cur) {
        const bk = await fetch("/api/csr/buoikham").then((r) => (r.ok ? r.json() : []));
        cur = (bk as BuoiKham[]).find((b) =>
          b.id.normalize("NFC") === targetId || decodeURIComponent(b.id || "").normalize("NFC") === targetId
        ) || null;
      }
      setBuoiKham(cur);

      // Cấu hình trường của cơ sở tổ chức đợt khám này
      if (cur?.coSo?.cauHinhTruong) {
        setCfg(parseFieldConfig(cur.coSo.cauHinhTruong));
      } else if (cur?.coSoId) {
        const cosos = await fetch("/api/csr/coso?all=1").then((r) => (r.ok ? r.json() : []));
        const coSo = (cosos as { id: string; cauHinhTruong?: string | null }[]).find((c) => c.id === cur?.coSoId);
        setCfg(parseFieldConfig(coSo?.cauHinhTruong));
      }

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

  // Lắng nghe sự kiện SSE thời gian thực khi có bệnh nhân mới tiếp nhận hoặc cập nhật kết quả khám từ máy khác
  useRealtimeEvent("hoso_change", (evt) => {
    const targetId = decodeURIComponent(buoiKhamId || "").normalize("NFC");
    if (evt.buoiKhamId && decodeURIComponent(evt.buoiKhamId).normalize("NFC") !== targetId) {
      return;
    }

    if (evt.action === "create") {
      // Có bệnh nhân mới vừa được tiếp nhận từ máy khác
      fetchPatients(selId ?? undefined, false);
      if (evt.data?.hoTen) {
        addToast({
          type: "info",
          title: "Bệnh nhân mới",
          message: `${evt.data.hoTen} (${evt.data.maBN || "vừa tiếp nhận"}) đã vào danh sách`,
        });
      }
    } else if (evt.action === "update") {
      // Có cập nhật thông tin khám / trạng thái từ máy khác
      setPatients((prev) => {
        if (evt.data && evt.data.id) {
          return prev.map((p) => (p.id === evt.data.id ? { ...p, ...evt.data } : p));
        }
        return prev;
      });

      // Nếu bệnh nhân được cập nhật là người đang mở trên màn hình
      if (evt.hoSoId && evt.hoSoId === selId) {
        // Chỉ nạp lại form nếu bác sĩ trên máy này CHƯA gõ thay đổi dở dang (tránh mất draft)
        if (!dirty && evt.data) {
          loadForm(evt.data);
        }
      }
      // Đồng bộ ngầm lại toàn bộ danh sách để đảm bảo nhất quán
      fetchPatients(selId ?? undefined, false);
    }
  }, [buoiKhamId, selId, dirty, fetchPatients, loadForm, addToast]);

  const pick = async (p: HoSo) => {
    if (p.id === selId) return;
    if (dirty && !(await confirm({
      title: "Bỏ thay đổi chưa lưu?",
      message: `Phiếu khám của ${selected?.hoTen || "bệnh nhân hiện tại"} đang có thay đổi chưa lưu.\nChuyển sang ${p.hoTen} sẽ mất các thay đổi này.`,
      confirmLabel: "Chuyển & bỏ thay đổi",
      cancelLabel: "Ở lại",
    }))) return;
    setIsEditing(false);
    setSelId(p.id); loadForm(p);
  };

  const save = useCallback(async () => {
    if (!selected) return;
    const on = (k: string) => isFieldOn(cfg, k);

    if (on("benhSu") && on("loaiBenhSu") && f.benhSu === "Có" && f.loaiBenhSu.length === 0) { addToast({ type: "error", message: "Có bệnh sử: chọn ít nhất một Loại bệnh sử." }); return; }
    if (on("loaiBenhSu") && f.loaiBenhSu.includes("Khác") && !f.loaiBenhSuKhac.trim()) { addToast({ type: "error", message: "Vui lòng nhập Loại bệnh sử khác." }); return; }
    if (on("chanDoan") && f.chanDoanMP.includes("Khác") && !f.chanDoanKhacMP.trim()) { addToast({ type: "error", message: "Vui lòng nhập Chẩn đoán khác cho Mắt phải." }); return; }
    if (on("chanDoan") && f.chanDoanMT.includes("Khác") && !f.chanDoanKhacMT.trim()) { addToast({ type: "error", message: "Vui lòng nhập Chẩn đoán khác cho Mắt trái." }); return; }
    if (!on("chanDoan") && on("benhLy") && on("loaiBenhLy") && f.benhLy === "Nghi ngờ bệnh lý" && f.loaiBenhLy.length === 0) { addToast({ type: "error", message: "Nghi ngờ bệnh lý: chọn ít nhất một Loại bệnh lý." }); return; }
    if (!on("chanDoan") && on("loaiBenhLy") && f.loaiBenhLy.includes("Khác") && !f.loaiBenhLyKhac.trim()) { addToast({ type: "error", message: "Vui lòng ghi rõ Loại bệnh lý khác." }); return; }
    if (on("huongXuTri") && f.huongXuTri === "Điều trị khác" && !f.huongXuTriKhac.trim()) { addToast({ type: "error", message: "Vui lòng ghi rõ nội dung Điều trị khác." }); return; }
    if (on("xacNhanDieuTri") && f.xacNhanDieuTri === "Không" && !f.lyDoKhongDieuTri.trim()) { addToast({ type: "error", message: "Xác nhận điều trị = KHÔNG: vui lòng ghi rõ lý do." }); return; }
    if (f.nhom === "A" && !f.sdt.trim()) { addToast({ type: "error", message: "Vui lòng nhập số điện thoại khi chọn nhóm A." }); return; }

    // Chỉ gửi các trường đang BẬT để không ghi đè dữ liệu của trường đã tắt
    const payload: Record<string, unknown> = { sdt: f.sdt || undefined, nhom: f.nhom || undefined };
    if (on("thiLuc")) { payload.thiLucMP = f.thiLucMP; payload.thiLucMT = f.thiLucMT; }
    if (on("chanDoan")) {
      const unified: string[] = [];
      f.chanDoanMP.forEach((d) => unified.push(d === "Khác" && f.chanDoanKhacMP ? `MP: ${f.chanDoanKhacMP}` : `${d} (MP)`));
      f.chanDoanMT.forEach((d) => unified.push(d === "Khác" && f.chanDoanKhacMT ? `MT: ${f.chanDoanKhacMT}` : `${d} (MT)`));

      let effMat = "";
      if (f.chanDoanMP.length > 0 && f.chanDoanMT.length > 0) effMat = "Hai mắt";
      else if (f.chanDoanMP.length > 0) effMat = "Mắt phải";
      else if (f.chanDoanMT.length > 0) effMat = "Mắt trái";

      payload.chanDoanMP = f.chanDoanMP;
      payload.chanDoanKhacMP = f.chanDoanKhacMP || null;
      payload.chanDoanMT = f.chanDoanMT;
      payload.chanDoanKhacMT = f.chanDoanKhacMT || null;
      payload.chanDoan = unified.length > 0 ? unified : f.chanDoan;
      payload.chanDoanKhac = [f.chanDoanKhacMP, f.chanDoanKhacMT].filter(Boolean).join("; ") || f.chanDoanKhac || null;
      payload.matKham = effMat || f.matKham || null;
      payload.benhLy = (f.chanDoanMP.length > 0 || f.chanDoanMT.length > 0) ? "Nghi ngờ bệnh lý" : "Chưa phát hiện bất thường";
    } else {
      if (on("benhLy")) payload.benhLy = f.benhLy || null;
      if (on("loaiBenhLy")) { payload.loaiBenhLy = f.loaiBenhLy; payload.loaiBenhLyKhac = f.loaiBenhLyKhac; }
    }
    if (on("huongXuTri")) { payload.huongXuTri = f.huongXuTri || null; payload.huongXuTriKhac = f.huongXuTriKhac; }
    else if (on("khuyenNghi")) payload.khuyenNghi = f.khuyenNghi;
    if (on("benhSu")) payload.benhSu = choiceToBool(f.benhSu);
    if (on("loaiBenhSu")) { payload.loaiBenhSu = f.loaiBenhSu; payload.loaiBenhSuKhac = f.loaiBenhSuKhac; }
    if (on("chieuCao")) payload.chieuCao = f.chieuCao;
    if (on("canNang")) payload.canNang = f.canNang;
    payload.bacSiChiDinh = buoiKham?.bacSiKham || f.bacSiChiDinh || selected.bacSiChiDinh || null;
    if (on("diemKham")) payload.diemKham = buoiKham?.diaDiem || null;
    if (on("nhanVienTuVan")) payload.nhanVienTuVan = f.nhanVienTuVan || sessionName.current || session?.user?.name || null;
    if (on("xacNhanDieuTri")) { payload.xacNhanDieuTri = choiceToBool(f.xacNhanDieuTri); payload.lyDoKhongDieuTri = f.lyDoKhongDieuTri; }
    if (on("ngayDieuTri")) payload.ngayDieuTri = f.ngayDieuTri || null;
    payload.ghiChuTuVan = f.ghiChuTuVan || null;

    setSaving(true);
    try {
      const res = await fetch(`/api/csr/hoso/${selected.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { addToast({ type: "error", message: data.error || "Không thể lưu" }); return; }
      addToast({ type: "success", title: `Đã lưu: ${selected.hoTen}`, message: "Cập nhật kết quả khám." });
      setIsEditing(false);
      await fetchPatients(selected.id, true);
    } catch { addToast({ type: "error", message: "Mất kết nối máy chủ" }); }
    finally { setSaving(false); }
  }, [selected, f, cfg, buoiKham, addToast, fetchPatients]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (selected && dirty && !saving) save(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [selected, dirty, saving, save]);

  /** Bật/tắt 1 giá trị trong trường đa chọn (chanDoan / loaiBenhSu / loaiBenhLy). */
  const toggleMulti = (key: "chanDoan" | "loaiBenhSu" | "loaiBenhLy") => (v: string) =>
    setF((s) => ({ ...s, [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v] }));
  const toggleChanDoanMP = (v: string) =>
    setF((s) => ({ ...s, chanDoanMP: s.chanDoanMP.includes(v) ? s.chanDoanMP.filter((x) => x !== v) : [...s.chanDoanMP, v] }));
  const toggleChanDoanMT = (v: string) =>
    setF((s) => ({ ...s, chanDoanMT: s.chanDoanMT.includes(v) ? s.chanDoanMT.filter((x) => x !== v) : [...s.chanDoanMT, v] }));

  const SORT_OPTS = [
    { key: "queue", label: "Ưu tiên ca chờ khám", desc: "Ca chưa khám lên đầu (xếp theo STT)" },
    { key: "stt_asc", label: "Theo số STT (1 → N)", desc: "Số thứ tự tăng dần từ 001" },
    { key: "stt_desc", label: "Theo số STT (N → 1)", desc: "Số thứ tự giảm dần" },
    { key: "latest", label: "Mới tiếp nhận lên đầu", desc: "Người vừa đăng ký lên trước" },
  ] as const;

  const counts = useMemo(() => {
    const total = patients.length;
    const waiting = patients.filter((p) => p.trangThai === "TiepNhan").length;
    const done = patients.filter((p) => p.trangThai !== "TiepNhan").length;
    const surgery = patients.filter((p) => p.khuyenNghi === "Phẫu thuật" || p.nhom === "A").length;
    return { total, waiting, done, surgery };
  }, [patients]);

  const nextWaitingPatient = useMemo(() => {
    return patients.find((p) => p.trangThai === "TiepNhan" && p.id !== selId) || patients.find((p) => p.trangThai === "TiepNhan") || null;
  }, [patients, selId]);

  const sortedPatients = useMemo(() => {
    const arr = [...patients];
    if (sortBy === "queue") {
      return arr.sort((a, b) => {
        const isWaitingA = a.trangThai === "TiepNhan";
        const isWaitingB = b.trangThai === "TiepNhan";
        if (isWaitingA && !isWaitingB) return -1;
        if (!isWaitingA && isWaitingB) return 1;
        return (a.stt ?? 0) - (b.stt ?? 0);
      });
    }
    if (sortBy === "stt_asc") {
      return arr.sort((a, b) => (a.stt ?? 0) - (b.stt ?? 0));
    }
    if (sortBy === "stt_desc") {
      return arr.sort((a, b) => (b.stt ?? 0) - (a.stt ?? 0));
    }
    if (sortBy === "latest") {
      return arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    return arr;
  }, [patients, sortBy]);

  const visible = useMemo(() => {
    return sortedPatients.filter((p) => {
      // 1. Lọc theo Tab
      if (filter === "TiepNhan" && p.trangThai !== "TiepNhan") return false;
      if (filter === "DaKham" && p.trangThai === "TiepNhan") return false;
      if (filter === "PhauThuat" && p.khuyenNghi !== "Phẫu thuật" && p.nhom !== "A") return false;

      // 2. Lọc theo ô tìm kiếm thông minh
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const sttStr = String(p.stt ?? "");
        const sttPad = sttStr.padStart(3, "0");
        const matchStt = sttStr === q || sttPad === q || (p.maBN && p.maBN.toLowerCase().includes(q));
        const matchName = (p.hoTen || "").toLowerCase().includes(q);
        const matchCccd = (p.cccd || "").includes(q);
        const matchBhyt = (p.bhyt || "").toLowerCase().includes(q);
        const matchSdt = (p.sdt || "").includes(q);
        return matchStt || matchName || matchCccd || matchBhyt || matchSdt;
      }
      return true;
    });
  }, [sortedPatients, filter, search]);

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
      done: !!(selected && (parseDiag(selected.chanDoan).length || selected.benhLy || selected.khuyenNghi)),
      desc: selected?.khuyenNghi ? `Khuyến nghị: ${selected.khuyenNghi}` : selected?.benhLy ? selected.benhLy : selected?.chanDoan ? "Đã khám mắt" : "Chưa khám lâm sàng"
    },
    {
      label: "4. Tư vấn & Phân nhóm",
      done: !!(selected?.nhom || (selected?.khuyenNghi && selected?.khuyenNghi !== "Phẫu thuật")),
      desc: selected?.nhom ? `Đã xếp Nhóm ${selected.nhom}` : selected?.khuyenNghi && selected?.khuyenNghi !== "Phẫu thuật" ? `Hoàn tất (${selected.khuyenNghi})` : "Chưa phân nhóm"
    },
  ], [selected]);
  const doneCount = steps.filter((s) => s.done).length;

  // Khối nào thực sự hiển thị (theo cấu hình trường của cơ sở) — dùng để đánh số mục
  const showBenhSu = isFieldOn(cfg, "benhSu") || isFieldOn(cfg, "loaiBenhSu");
  const showDauHieu = isFieldOn(cfg, "chieuCao") || isFieldOn(cfg, "canNang");
  const showThiLuc = isFieldOn(cfg, "thiLuc");
  const showChiSo = showDauHieu || showThiLuc; // gộp "Dấu hiệu" + "Đo thị lực" vào 1 thẻ
  // Danh mục ICD giờ là select box nên không còn phình chiều cao -> lưới 2 cột cố định
  const showIcd = isFieldOn(cfg, "loaiBenhLy") && (!isFieldOn(cfg, "benhLy") || f.benhLy === "Nghi ngờ bệnh lý");
  // Loại bệnh sử: luôn hiện, khoá khi chưa chọn "Có"; bắt buộc chọn ≥1 khi đã chọn "Có"
  const lockLoaiBenhSu = isFieldOn(cfg, "benhSu") && f.benhSu !== "Có";
  const needLoaiBenhSu = isFieldOn(cfg, "benhSu") && f.benhSu === "Có";
  // Tư vấn & phân nhóm: luôn hiện để thấy trước các bước, chỉ khoá khi chưa chỉ định mổ
  const lockTuVan = effKhuyenNghi !== "Phẫu thuật";

  // Số thứ tự mục tính theo khối đang hiện, tránh nhảy số khi cơ sở tắt bớt trường
  const secNo = useMemo(() => {
    let i = 0;
    const m = { benhSu: 0, chiSo: 0, ketLuan: 0, tuVan: 0 };
    if (showBenhSu) m.benhSu = ++i;
    if (showChiSo) m.chiSo = ++i;
    m.ketLuan = ++i;
    m.tuVan = ++i;
    return m;
  }, [showBenhSu, showChiSo]);

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
        title={buoiKham ? `Đợt khám · ${fmtBuoiKhamName(buoiKham)}` : "Đợt khám"}
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
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <Link href="/buoi-kham" className="btn btn-secondary px-2.5 sm:px-3 py-1 text-[11.5px] sm:text-[12.5px] font-semibold h-7 sm:h-8 rounded-[var(--r-sm)] border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors">
              <span className="sm:inline hidden">Các đợt khám</span>
              <span className="sm:hidden inline">Đợt khám</span>
            </Link>
            <Link href={`/tu-van`} className="btn btn-secondary px-2.5 sm:px-3 py-1 text-[11.5px] sm:text-[12.5px] font-semibold h-7 sm:h-8 rounded-[var(--r-sm)] border border-[var(--line)] hover:bg-[var(--surface-hover)] transition-colors">
              <span className="sm:inline hidden">Tư vấn & Phân nhóm</span>
              <span className="sm:hidden inline">Tư vấn</span>
            </Link>
            <button onClick={() => fetchPatients(selId ?? undefined)} className="p-1 sm:p-1.5 rounded text-[var(--mute)] hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--line)] transition-colors" title="Tải lại">
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        }
      />

      <div className="flex-1 flex flex-col xl:flex-row min-h-0 border-t border-[var(--line)] overflow-y-auto xl:overflow-hidden relative">
        {/* Backdrop for Mobile Patient Drawer */}
        {showList && <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[2px] transition-opacity xl:hidden" onClick={() => setShowList(false)} />}

        {/* COL 1 — danh sách (Drawer on mobile, Static on desktop) */}
        <aside className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[360px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${showList ? "translate-x-0" : "translate-x-full"} xl:static xl:translate-x-0 xl:w-[320px] xl:shrink-0 xl:border-r xl:border-[var(--line)] xl:shadow-none xl:z-0`}>
          {/* Header */}
          <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-[var(--line)] bg-white">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[var(--navy)]" />
              <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-[var(--navy)]">Bệnh nhân</span>
              <span className="font-mono text-[10.5px] font-bold bg-[var(--surface-soft)] text-[var(--ink-soft)] px-1.5 py-0.2 rounded-full">
                {counts.total}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                data-tour="kh-reg"
                onClick={() => setShowReg(true)}
                title="Tiếp nhận bệnh nhân mới"
                className="h-7 px-2 rounded-md bg-[var(--teal)] text-white hover:bg-[var(--teal-deep)] flex items-center gap-1 text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tiếp nhận</span>
              </button>
              <button onClick={() => setShowList(false)} className="p-1 rounded-md hover:bg-[var(--surface-soft)] text-[var(--mute)] xl:hidden">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Ô tìm kiếm gọn gàng */}
          <div className="px-3 pt-2 pb-1.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--mute)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="STT, Tên, BHYT, CCCD…"
                className="w-full h-8 rounded-lg border border-[var(--line)] bg-[var(--surface-bg)]/80 pl-8 pr-7 text-[12px] outline-none focus:border-[var(--navy)] focus:bg-white focus:ring-1 focus:ring-[var(--navy-100)] transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {searching && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-[var(--navy)]" />}
            </div>
          </div>

          {/* Dải Tab Lọc Nhanh (Segmented Control 4 ô đều nhau 100% width) */}
          <div className="px-3 py-1">
            <div className="p-0.5 bg-[var(--surface-soft)] rounded-lg flex items-center gap-0.5 text-[11px] border border-[var(--line-soft)]">
              <button
                type="button"
                onClick={() => setFilter("")}
                className={`flex-1 py-1 rounded-md font-semibold text-center transition-all cursor-pointer truncate ${!filter
                  ? "bg-white text-[var(--navy)] shadow-2xs font-bold"
                  : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
              >
                Tất cả <span className="font-mono text-[10px] opacity-75">{counts.total}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter("TiepNhan")}
                className={`flex-1 py-1 rounded-md font-semibold text-center transition-all cursor-pointer truncate ${filter === "TiepNhan"
                  ? "bg-white text-[var(--teal-deep)] shadow-2xs font-bold"
                  : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
              >
                Chờ <span className="font-mono text-[10px] opacity-75">{counts.waiting}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter("DaKham")}
                className={`flex-1 py-1 rounded-md font-semibold text-center transition-all cursor-pointer truncate ${filter === "DaKham"
                  ? "bg-white text-[var(--navy)] shadow-2xs font-bold"
                  : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
              >
                Đã khám <span className="font-mono text-[10px] opacity-75">{counts.done}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter("PhauThuat")}
                className={`flex-1 py-1 rounded-md font-semibold text-center transition-all cursor-pointer truncate ${filter === "PhauThuat"
                  ? "bg-white text-[var(--rose)] shadow-2xs font-bold"
                  : "text-[var(--mute)] hover:text-[var(--ink)]"
                  }`}
              >
                Cần mổ <span className="font-mono text-[10px] opacity-75">{counts.surgery}</span>
              </button>
            </div>
          </div>

          {/* Thanh công cụ phụ: Sắp xếp + Nút Khám ca kế tiếp */}
          <div className="px-3 py-1 flex items-center justify-between text-[11px] text-[var(--mute)] border-b border-[var(--line-soft)]">
            {/* Dropdown Sắp xếp */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortMenuOpen((v) => !v)}
                className="flex items-center gap-1 text-[var(--ink-soft)] hover:text-[var(--navy)] cursor-pointer py-0.5 rounded transition-colors font-medium"
                title="Thay đổi cách sắp xếp danh sách"
              >
                <ArrowUpDown className="w-3 h-3 text-[var(--teal-deep)]" />
                <span className="truncate max-w-[130px]">{SORT_OPTS.find((s) => s.key === sortBy)?.label || "Sắp xếp"}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>

              {sortMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSortMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-40 w-[210px] bg-white border border-[var(--line-strong)] rounded-lg shadow-[var(--shadow-lg)] p-1 animate-dropdown">
                    {SORT_OPTS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.key);
                          setSortMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-[11.5px] flex items-center justify-between cursor-pointer ${sortBy === opt.key ? "bg-[var(--navy-50)] text-[var(--navy)] font-bold" : "text-[var(--ink-soft)] hover:bg-[var(--surface-hover)]"
                          }`}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.key && <Check className="w-3.5 h-3.5 text-[var(--navy)]" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Nút Gọi ca tiếp theo */}
            <button
              type="button"
              onClick={() => {
                if (nextWaitingPatient) {
                  pick(nextWaitingPatient);
                } else {
                  addToast({ type: "info", message: "Không còn bệnh nhân nào đang chờ khám!" });
                }
              }}
              disabled={!nextWaitingPatient}
              className={`flex items-center gap-0.5 font-bold transition-all cursor-pointer ${nextWaitingPatient ? "text-[var(--teal-deep)] hover:underline active:scale-95" : "text-[var(--mute-soft)] cursor-not-allowed"
                }`}
              title={nextWaitingPatient ? `Gọi ca tiếp: ${nextWaitingPatient.hoTen} (STT ${String(nextWaitingPatient.stt).padStart(2, "0")})` : "Đã hết ca chờ"}
            >
              <span>Ca tiếp</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Danh sách thẻ bệnh nhân */}
          <div data-tour="kh-list" className="flex-1 overflow-y-auto p-2 space-y-1 bg-[var(--surface-bg)]/40">
            {searching ? (
              <SkeletonList items={5} />
            ) : patients.length === 0 ? (
              <div className="flex flex-col items-center text-center text-[var(--mute)] text-[12px] py-14 px-4 gap-1.5">
                <UserPlus className="w-6 h-6 text-[var(--mute-soft)]" />
                <span>Chưa có bệnh nhân.</span>
              </div>
            ) : visible.length === 0 ? (
              <div className="text-center text-[var(--mute)] text-[12px] py-10 px-4 bg-white rounded-lg border border-[var(--line-soft)]">
                Không khớp bộ lọc.
              </div>
            ) : (
              visible.map((p) => {
                const active = selId === p.id;
                const isWaiting = p.trangThai === "TiepNhan";
                const st = statusOf(p.trangThai);
                const sttPadded = String(p.stt ?? 0).padStart(2, "0");
                const diags = parseDiag(p.chanDoan);

                // Badge màu cho STT
                let sttBadgeCls = "bg-[var(--navy-50)] text-[var(--navy)] border-[var(--navy)]/15";
                if (p.nhom === "A" || p.khuyenNghi === "Phẫu thuật") {
                  sttBadgeCls = "bg-[var(--rose-soft)] text-[var(--rose)] border-[var(--rose)]/25";
                } else if (p.nhom === "B") {
                  sttBadgeCls = "bg-[var(--amber-soft)] text-[var(--amber-deep)] border-[var(--amber)]/25";
                } else if (!isWaiting) {
                  sttBadgeCls = "bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]/15";
                }

                // Tóm tắt kết quả (nếu có)
                let diagSummary = "";
                if (!isWaiting) {
                  if (diags.length > 0) diagSummary = diags[0];
                  else if (p.benhLy) diagSummary = p.benhLy;
                  else if (p.khuyenNghi) diagSummary = p.khuyenNghi;
                }

                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      pick(p);
                      setShowList(false);
                    }}
                    className={`w-full text-left rounded-lg border px-2.5 py-1.5 transition-all duration-150 relative cursor-pointer ${active
                      ? "border-[var(--navy)] bg-white shadow-xs border-l-[3px] border-l-[var(--navy)]"
                      : isWaiting
                        ? "border-[var(--line)] bg-white hover:border-[var(--navy-200)] hover:bg-slate-50"
                        : "border-[var(--line-soft)] bg-white/75 hover:bg-white hover:border-[var(--line)] opacity-85 hover:opacity-100"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Số thứ tự STT rõ ràng */}
                      <div
                        className={`w-8 h-8 rounded-lg font-mono flex flex-col items-center justify-center shrink-0 border ${sttBadgeCls} shadow-2xs`}
                      >
                        <span className="text-[7.5px] font-sans font-bold uppercase tracking-wider opacity-60 leading-none mb-0.5">STT</span>
                        <span className="text-[12px] font-black leading-none">{sttPadded}</span>
                      </div>

                      {/* Thông tin chính */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className={`text-[12.5px] font-bold truncate leading-tight ${active ? "text-[var(--navy)]" : "text-[var(--ink)]"}`}>
                            {p.hoTen}
                          </h4>
                          <StatusBadge label={st.label} cls={st.cls} sm />
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--mute)] mt-0.5 truncate">
                          <span>{p.gioiTinh} · {ageOf(p)}t</span>
                          {p.mucHuongBHYT ? <span>· BH {p.mucHuongBHYT}%</span> : p.bhyt ? <span>· {bhytLevel(p.bhyt)}</span> : null}
                          {diagSummary && <span className="text-[var(--teal-deep)] font-semibold truncate">· {diagSummary}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* COL 2 — thông tin + timeline (Hiển thị cố định trên Desktop, trên Mobile có strip thu gọn riêng) */}
        <section className="hidden xl:flex xl:w-[380px] xl:shrink-0 xl:border-r border-[var(--line)] bg-white flex-col h-auto xl:min-h-0">
          {selected ? (<>
            <div className="px-4 pt-4 pb-3">
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--navy)] mb-2">Thực hiện</h2>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif text-[19px] font-bold text-[var(--ink)] leading-tight uppercase">{selected.hoTen}</h3>
                <button onClick={() => setShowEdit(true)} title="Sửa thông tin bệnh nhân" className="p-1 rounded text-[var(--navy)] hover:bg-[var(--navy-50)] active:scale-90 transition-transform shrink-0"><Pencil className="w-4 h-4" /></button>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-[11.5px] font-extrabold text-[var(--teal-deep)] bg-[var(--teal-soft)] border border-[var(--teal)]/25 px-2 py-0.5 rounded">
                  STT: {String(selected.stt ?? 0).padStart(2, "0")}
                </span>
                <span className="font-mono text-[11px] font-bold text-[var(--navy)] bg-[var(--navy-50)] border border-[var(--navy)]/15 px-1.5 py-0.5 rounded">
                  ID: {selected.maBN}
                </span>
                <StatusBadge label={statusOf(selected.trangThai).label} cls={statusOf(selected.trangThai).cls} sm />
              </div>
              <dl className="mt-3 space-y-1 text-[11.5px] text-[var(--ink-soft)]">
                <Row k="Giới tính" v={`${selected.gioiTinh} · ${ageOf(selected)} tuổi`} />
                <Row k="BHYT" v={selected.bhyt ? `${selected.bhyt} · ${selected.mucHuongBHYT ? `${selected.mucHuongBHYT}%` : bhytLevel(selected.bhyt)}` : "—"} mono />
                <Row k="CCCD" v={selected.cccd || "—"} mono />
                <Row k="SĐT" v={selected.sdt || "—"} mono />
                <Row k="Địa chỉ" v={selected.diaChi || "—"} />
                {isFieldOn(cfg, "khuPho") && <Row k="Khu phố" v={selected.khuPho || "—"} />}
                {isFieldOn(cfg, "xaPhuong") && <Row k="Xã/Phường" v={selected.xaPhuong || "—"} />}
              </dl>

              {/* Bối cảnh đợt khám: suy tự động từ đợt khám + tài khoản đăng nhập.
                  Để ở cột hồ sơ thay vì dựng thành ô nhập trong phiếu khám. */}
              <dl className="mt-3 pt-3 border-t border-[var(--line-soft)] flex flex-wrap gap-x-5 gap-y-1.5">
                <Meta k="Ngày khám" v={fmtDate(buoiKham?.ngayKham)} mono />
                {isFieldOn(cfg, "diemKham") && <Meta k="Điểm khám" v={buoiKham?.diaDiem || "—"} />}
                <Meta k="Xã khám" v={buoiKham?.xa || "—"} />
                <Meta k="Bác sĩ khám" v={buoiKham?.bacSiKham || selected.bacSiChiDinh || "—"} />
                {isFieldOn(cfg, "nhanVienTuVan") && (
                  <Meta k="NV tư vấn" v={f.nhanVienTuVan || session?.user?.name || "—"} />
                )}
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
            {/* Thanh thông tin bệnh nhân thu gọn riêng cho Mobile */}
            <div className="xl:hidden bg-white border-b border-[var(--line)] px-3 py-2 shrink-0 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setShowList(true)}
                    className="h-8 px-2 rounded-lg bg-[var(--teal-soft)] text-[var(--teal-deep)] border border-[var(--teal)]/25 font-mono font-extrabold text-xs flex items-center gap-1 shrink-0 active:scale-95 transition-transform"
                    title="Mở danh sách bệnh nhân"
                  >
                    <span className="text-[8px] font-sans font-bold opacity-70">STT</span>
                    <span>{String(selected.stt ?? 0).padStart(2, "0")}</span>
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-[13.5px] text-[var(--ink)] truncate leading-tight uppercase">{selected.hoTen}</h3>
                      <StatusBadge label={statusOf(selected.trangThai).label} cls={statusOf(selected.trangThai).cls} sm />
                    </div>
                    <div className="text-[11px] text-[var(--mute)] truncate font-medium mt-0.5">
                      <span>{selected.gioiTinh} · {ageOf(selected)}t</span>
                      {selected.mucHuongBHYT ? <span> · BH {selected.mucHuongBHYT}%</span> : selected.bhyt ? <span> · {bhytLevel(selected.bhyt)}</span> : null}
                      {selected.sdt && <span> · {selected.sdt}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEdit(true)}
                    title="Sửa thông tin"
                    className="p-1.5 rounded-md hover:bg-[var(--surface-soft)] text-[var(--navy)] border border-[var(--line)]"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMobileDetail((v) => !v)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-colors flex items-center gap-1 ${showMobileDetail
                      ? "bg-[var(--navy)] text-white border-[var(--navy)]"
                      : "bg-white text-[var(--ink-soft)] border-[var(--line)] hover:bg-[var(--surface-soft)]"
                      }`}
                  >
                    <span>Tiến độ ({doneCount}/4)</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showMobileDetail ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Accordion mở rộng chi tiết hồ sơ & các bước trên mobile */}
              {showMobileDetail && (
                <div className="pt-2.5 mt-2 border-t border-[var(--line-soft)] animate-fade-in space-y-3 pb-1">
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-[var(--ink-soft)] bg-[var(--surface-soft)]/50 p-2.5 rounded-lg border border-[var(--line-soft)]">
                    <Row k="CCCD" v={selected.cccd || "—"} mono />
                    <Row k="SĐT" v={selected.sdt || "—"} mono />
                    <div className="col-span-2">
                      <Row k="Địa chỉ" v={selected.diaChi || "—"} />
                    </div>
                    {isFieldOn(cfg, "khuPho") && <Row k="Khu phố" v={selected.khuPho || "—"} />}
                    {isFieldOn(cfg, "xaPhuong") && <Row k="Xã/Phường" v={selected.xaPhuong || "—"} />}
                    <Row k="Bác sĩ khám" v={buoiKham?.bacSiKham || selected.bacSiChiDinh || "—"} />
                    {isFieldOn(cfg, "nhanVienTuVan") && <Row k="NV tư vấn" v={f.nhanVienTuVan || session?.user?.name || "—"} />}
                  </dl>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[var(--ink)]">
                        <ClipboardList className="w-3.5 h-3.5 text-[var(--navy)]" /> Các bước thực hiện
                      </span>
                      <span className="font-mono text-[10.5px] font-bold text-[var(--navy)] bg-[var(--navy-50)] px-1.5 py-0.2 rounded">
                        {doneCount}/{steps.length}
                      </span>
                    </div>
                    <ol className="relative pl-1">
                      <span className="absolute left-[8px] top-1 bottom-2 w-px bg-[var(--line)]" />
                      {steps.map((s) => (
                        <li key={s.label} className="relative flex items-start gap-2.5 mb-2 last:mb-0">
                          <span
                            className={`relative z-10 w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${s.done ? "bg-[var(--teal)] text-white shadow-2xs" : "bg-white border-2 border-[var(--line-strong)]"
                              }`}
                          >
                            {s.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                          <div>
                            <div className={`text-[12px] font-bold leading-tight ${s.done ? "text-[var(--ink)]" : "text-[var(--mute)]"}`}>
                              {s.label}
                            </div>
                            <div className="text-[10.5px] font-medium text-[var(--mute)]">{s.desc}</div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>

            <div className="@container flex-1 overflow-y-auto p-3 sm:p-4">
              <div className="grid grid-cols-1 @3xl:grid-cols-2 gap-3 sm:gap-4">
                {showBenhSu && (
                  <div className="card p-0">
                    <SectionHeader n={secNo.benhSu} accent="Bệnh sử của bản thân" />
                    <div className="p-4 space-y-4">
                      {isFieldOn(cfg, "benhSu") && (
                        <div>
                          <label className={labelCls}>Có bệnh sử không?</label>
                          <ChoiceRow options={CO_KHONG} value={f.benhSu} onChange={(v) => setF((s) => ({ ...s, benhSu: v, loaiBenhSu: v === "Có" ? s.loaiBenhSu : [] }))} disabled={readOnly} />
                        </div>
                      )}
                      {/* Luôn hiện để thấy trước danh mục; chỉ mở khoá khi đã chọn "Có" */}
                      {isFieldOn(cfg, "loaiBenhSu") && (
                        <div>
                          <label className={labelCls}>
                            Loại bệnh sử {needLoaiBenhSu && <span className="text-[var(--rose)]">*</span>}{" "}
                            <span className="font-normal text-[var(--mute)]">
                              · {lockLoaiBenhSu ? "chọn \"Có\" ở trên để mở" : "chọn nhiều"}
                            </span>
                          </label>
                          <PillGroup options={BENH_SU_OPTIONS} selected={f.loaiBenhSu} onToggle={toggleMulti("loaiBenhSu")} disabled={readOnly || lockLoaiBenhSu} />
                          {f.loaiBenhSu.includes("Khác") && (
                            <input
                              value={f.loaiBenhSuKhac}
                              onChange={(e) => setF((s) => ({ ...s, loaiBenhSuKhac: e.target.value }))}
                              placeholder="Ghi rõ loại bệnh sử khác…"
                              className="input-field mt-2.5"
                              disabled={readOnly || lockLoaiBenhSu}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dấu hiệu + Đo thị lực gộp 1 thẻ: cả hai chỉ có 2 ô, tách ra tốn 2 tiêu đề */}
                {showChiSo && (
                  <div data-tour="kh-vision" className="@container card p-0">
                    <SectionHeader n={secNo.chiSo} accent={showDauHieu && showThiLuc ? "Dấu hiệu & thị lực" : showThiLuc ? "Đo thị lực" : "Dấu hiệu"} />
                    <div className="p-4 grid grid-cols-1 @sm:grid-cols-2 gap-x-5 gap-y-3.5">
                      {isFieldOn(cfg, "chieuCao") && (
                        <Field label="Chiều cao (cm)">
                          <input inputMode="numeric" value={f.chieuCao} onChange={(e) => setF((s) => ({ ...s, chieuCao: e.target.value.replace(/[^\d]/g, "") }))} className="input-field font-mono" placeholder="VD: 160" disabled={readOnly} />
                        </Field>
                      )}
                      {isFieldOn(cfg, "canNang") && (
                        <Field label="Cân nặng (kg)">
                          <input inputMode="numeric" value={f.canNang} onChange={(e) => setF((s) => ({ ...s, canNang: e.target.value.replace(/[^\d]/g, "") }))} className="input-field font-mono" placeholder="VD: 55 (không số lẻ)" disabled={readOnly} />
                        </Field>
                      )}
                      {showThiLuc && (<>
                        <Select label="Thị lực mắt phải (MP)" value={f.thiLucMP} onChange={(v) => setF((s) => ({ ...s, thiLucMP: v }))} opts={THI_LUC} disabled={readOnly} />
                        <Select label="Thị lực mắt trái (MT)" value={f.thiLucMT} onChange={(v) => setF((s) => ({ ...s, thiLucMT: v }))} opts={THI_LUC} disabled={readOnly} />
                      </>)}
                    </div>
                  </div>
                )}

                {/* Kết luận ban đầu */}
                <div data-tour="kh-exam" className="@container card p-0">
                  <SectionHeader n={secNo.ketLuan} accent="Kết luận ban đầu" />
                  <div className="p-4 space-y-4">
                    {/* Chỉ hiển thị bộ mã ICD nếu cơ sở TẮT trường Chẩn đoán nhãn khoa */}
                    {!isFieldOn(cfg, "chanDoan") && isFieldOn(cfg, "benhLy") && (
                      <div>
                        <label className={labelCls}>Bệnh lý</label>
                        <ChoiceRow options={BENH_LY_OPTIONS} value={f.benhLy} onChange={(v) => setF((s) => ({ ...s, benhLy: v, loaiBenhLy: v === "Nghi ngờ bệnh lý" ? s.loaiBenhLy : [], loaiBenhLyKhac: v === "Nghi ngờ bệnh lý" ? s.loaiBenhLyKhac : "" }))} disabled={readOnly} />
                      </div>
                    )}

                    {!isFieldOn(cfg, "chanDoan") && showIcd && (
                      <div>
                        <label className={labelCls}>Loại bệnh lý <span className="text-[var(--rose)]">*</span> <span className="font-normal text-[var(--mute)]">· theo mã ICD, chọn nhiều</span></label>
                        <MultiSelect
                          options={LOAI_BENH_LY_OPTIONS}
                          selected={f.loaiBenhLy}
                          onToggle={toggleMulti("loaiBenhLy")}
                          disabled={readOnly}
                          placeholder="Chọn mã ICD…"
                          searchPlaceholder="Gõ mã hoặc tên bệnh (VD: H25, glocom)…"
                        />
                        {f.loaiBenhLy.includes("Khác") && (
                          <input value={f.loaiBenhLyKhac} onChange={(e) => setF((s) => ({ ...s, loaiBenhLyKhac: e.target.value }))} placeholder="Ghi rõ loại bệnh lý khác…" className="input-field mt-3" disabled={readOnly} />
                        )}
                      </div>
                    )}

                    {/* Chẩn đoán tách biệt theo từng mắt (MP / MT) */}
                    {isFieldOn(cfg, "chanDoan") && (
                      <div className="space-y-2.5">
                        <label className={labelCls}>Chẩn đoán bệnh lý mắt <span className="font-normal text-[var(--mute)]">· chọn bệnh lý cho từng mắt (MP / MT)</span></label>
                        <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3 items-start">
                          {/* Mắt phải (MP) */}
                          <div className="bg-[var(--surface-soft)]/50 border border-[var(--line-soft)] rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-[var(--navy)] flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[var(--teal)]" />
                                Mắt phải (MP)
                              </span>
                              {f.chanDoanMP.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setF((s) => ({ ...s, chanDoanMP: [], chanDoanKhacMP: "" }))}
                                  className="text-[10.5px] text-[var(--mute)] hover:text-[var(--rose)] cursor-pointer"
                                  disabled={readOnly}
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                            <PillGroup options={CHAN_DOAN} selected={f.chanDoanMP} onToggle={toggleChanDoanMP} disabled={readOnly} />
                            {f.chanDoanMP.includes("Khác") && (
                              <input
                                value={f.chanDoanKhacMP}
                                onChange={(e) => setF((s) => ({ ...s, chanDoanKhacMP: e.target.value }))}
                                placeholder="Ghi rõ chẩn đoán Mắt phải…"
                                className="input-field mt-1.5"
                                disabled={readOnly}
                              />
                            )}
                          </div>

                          {/* Mắt trái (MT) */}
                          <div className="bg-[var(--surface-soft)]/50 border border-[var(--line-soft)] rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-[var(--navy)] flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
                                Mắt trái (MT)
                              </span>
                              {f.chanDoanMT.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setF((s) => ({ ...s, chanDoanMT: [], chanDoanKhacMT: "" }))}
                                  className="text-[10.5px] text-[var(--mute)] hover:text-[var(--rose)] cursor-pointer"
                                  disabled={readOnly}
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                            <PillGroup options={CHAN_DOAN} selected={f.chanDoanMT} onToggle={toggleChanDoanMT} disabled={readOnly} />
                            {f.chanDoanMT.includes("Khác") && (
                              <input
                                value={f.chanDoanKhacMT}
                                onChange={(e) => setF((s) => ({ ...s, chanDoanKhacMT: e.target.value }))}
                                placeholder="Ghi rõ chẩn đoán Mắt trái…"
                                className="input-field mt-1.5"
                                disabled={readOnly}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hướng xử trí thay cho Khuyến nghị (chỉ hiện 1 trong 2) */}
                    {isFieldOn(cfg, "huongXuTri") ? (
                      <div>
                        <label className={labelCls}>Hướng xử trí <span className="text-[var(--rose)]">*</span></label>
                        <ChoiceRow options={HUONG_XU_TRI} value={f.huongXuTri} onChange={(v) => setF((s) => ({ ...s, huongXuTri: v, nhom: v === "Phẫu thuật" ? s.nhom : "", huongXuTriKhac: v === "Điều trị khác" ? s.huongXuTriKhac : "" }))} disabled={readOnly} />
                        {f.huongXuTri === "Điều trị khác" && (
                          <input value={f.huongXuTriKhac} onChange={(e) => setF((s) => ({ ...s, huongXuTriKhac: e.target.value }))} placeholder="Ghi rõ hướng điều trị khác…" className="input-field mt-3" disabled={readOnly} />
                        )}
                      </div>
                    ) : isFieldOn(cfg, "khuyenNghi") && (
                      <div>
                        <label className={labelCls}>Khuyến nghị</label>
                        <ChoiceRow options={[...KHUYEN_NGHI]} value={f.khuyenNghi} onChange={(v) => setF((s) => ({ ...s, khuyenNghi: v, nhom: v === "Phẫu thuật" ? s.nhom : "" }))} disabled={readOnly} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Tư vấn & phân nhóm — luôn hiện để thấy trước các bước còn lại,
                    chỉ khoá khi hướng xử trí/khuyến nghị chưa phải Phẫu thuật.
                    Gom cả Xác nhận điều trị + Ngày điều trị dự kiến vào đây: cả hai
                    chỉ có nghĩa với ca đã chốt mổ. */}
                <div className="@container card p-0">
                  <SectionHeader n={secNo.tuVan} accent="Tư vấn & phân nhóm" />
                  <div className="p-4 space-y-4">
                    {lockTuVan && (
                      <p className="text-[11.5px] text-[var(--mute)] leading-relaxed">
                        Chọn <b className="font-bold text-[var(--ink-soft)]">Phẫu thuật</b> ở mục {secNo.ketLuan} để mở phần này.
                      </p>
                    )}
                    <div className="grid grid-cols-1 @lg:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <label className={labelCls}>Chọn nhóm</label>
                        <ChoiceRow options={["A", "B"]} value={f.nhom} onChange={(v) => setF((s) => ({ ...s, nhom: v }))} render={(o) => o === "A" ? "Nhóm A (Đồng ý mổ)" : "Nhóm B (Suy nghĩ thêm)"} disabled={readOnly || lockTuVan} />
                      </div>
                      <Field label="Số điện thoại" required={f.nhom === "A"}>
                        <input value={f.sdt} onChange={(e) => setF((s) => ({ ...s, sdt: e.target.value }))} placeholder="Nhập SĐT..." className="input-field font-mono" disabled={readOnly || lockTuVan} />
                      </Field>
                      <Field label="Ngày điều trị dự kiến" required={f.nhom === "A"}>
                        <DateField value={f.ngayDieuTri} onChange={(v) => setF((s) => ({ ...s, ngayDieuTri: v }))} disabled={readOnly || lockTuVan} placeholder="dd/mm/yyyy" />
                      </Field>
                    </div>

                    {isFieldOn(cfg, "xacNhanDieuTri") && (
                      <div>
                        <label className={labelCls}>Xác nhận điều trị <span className="text-[var(--rose)]">*</span></label>
                        <ChoiceRow options={CO_KHONG} value={f.xacNhanDieuTri} onChange={(v) => setF((s) => ({ ...s, xacNhanDieuTri: v, lyDoKhongDieuTri: v === "Không" ? s.lyDoKhongDieuTri : "" }))} disabled={readOnly || lockTuVan} />
                        {f.xacNhanDieuTri === "Không" && (
                          <input value={f.lyDoKhongDieuTri} onChange={(e) => setF((s) => ({ ...s, lyDoKhongDieuTri: e.target.value }))} placeholder="Bắt buộc: ghi rõ lý do không điều trị…" className="input-field mt-2.5" disabled={readOnly || lockTuVan} />
                        )}
                      </div>
                    )}

                    <div>
                      <Field label="Ghi chú " >
                        <textarea
                          value={f.ghiChuTuVan}
                          onChange={(e) => setF((s) => ({ ...s, ghiChuTuVan: e.target.value }))}
                          placeholder="Nhập ghi chú tư vấn hoặc dặn dò bệnh nhân…"
                          rows={2}
                          className="input-field resize-none py-2"
                          disabled={readOnly || lockTuVan}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div data-tour="kh-save" className="px-3 sm:px-4 py-2 sm:py-3 border-t border-[var(--line)] bg-white/95 backdrop-blur-sm sticky bottom-0 z-20 flex items-center justify-between gap-2 shadow-md">
              <div className="flex items-center gap-2 min-w-0">
                {/* Nút mở danh sách bệnh nhân trên mobile tích hợp vào bottom bar */}
                <button
                  type="button"
                  onClick={() => setShowList(true)}
                  className="xl:hidden h-8 sm:h-9 px-2.5 rounded-lg bg-[var(--navy-50)] hover:bg-[var(--navy-100)] border border-[var(--navy)]/20 text-[var(--navy)] font-bold text-[11.5px] flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-[var(--teal-deep)]" />
                  <span>DS ({counts.total})</span>
                </button>

                <span className="text-[12px] flex items-center gap-1.5 min-w-0 truncate">
                  {dirty ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-[var(--amber)] text-[11px] sm:text-[12px] truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] animate-pulse shrink-0" /> Chưa lưu
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[var(--mute)] text-[11px] sm:text-[12px] truncate">
                      <Check className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" /> Đã lưu
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {readOnly ? (
                  <button onClick={() => setIsEditing(true)} className="btn btn-secondary px-3.5 sm:px-6 py-2 font-bold h-8 sm:h-9 text-[12px] sm:text-[13px]">
                    <Pencil className="w-3.5 h-3.5 text-[var(--navy)]" /> Sửa kết quả
                  </button>
                ) : (
                  <>
                    {!!isDone && isEditing && (
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setF(JSON.parse(baseline));
                        }}
                        className="btn btn-secondary px-2.5 sm:px-4 py-1.5 text-[11.5px] sm:text-[12.5px] font-semibold h-8 sm:h-9"
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      onClick={save}
                      disabled={saving || !dirty}
                      className="btn btn-primary px-3.5 sm:px-6 py-1.5 font-bold h-8 sm:h-9 text-[12px] sm:text-[13px] shrink-0"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[var(--teal)]" />}
                      <span>Lưu kết quả khám</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </>) : <div className="flex-1 flex items-center justify-center text-[var(--mute)] text-[14px] px-8 text-center">Chọn bệnh nhân hoặc đăng ký mới để nhập kết quả khám.</div>}
        </main>
      </div>

      {showReg && buoiKham && <RegisterModal buoiKham={buoiKham} cfg={cfg} onClose={() => setShowReg(false)} onCreated={(p) => { setShowReg(false); fetchPatients(p.id, true); }} />}
      {showEdit && selected && <EditInfoModal patient={selected} cfg={cfg} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); fetchPatients(selected.id, true); }} />}
    </div>
  );
}
