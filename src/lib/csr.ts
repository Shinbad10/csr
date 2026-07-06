// Hằng số & helper thuần dùng chung các màn CSR (SRS §6.4, §7). Không import React.

export const CHAN_DOAN = ["Đục thủy tinh thể", "Mộng", "Đục bao sau", "Khác"];   // SRS §7
export const KHUYEN_NGHI = ["Phẫu thuật", "Theo dõi"] as const;                  // SRS §7
export const BHYT = ["Không có", "100%", "95%", "80%", "Không rõ"] as const;     // SRS §7
export const NHOM = ["A", "B"] as const;                                         // A = đã chốt mổ · B = theo dõi
export const TT_DIEU_TRI = ["Đã mổ", "Hủy", "Không đến"] as const;              // SRS §7
export const THI_LUC = ["", "10/10", "8/10", "6/10", "5/10", "4/10", "3/10", "2/10", "1/10", "ĐNT 3m", "ĐNT 2m", "ĐNT 1m", "BBT", "ST(+)", "ST(-)"];

export const parseDiag = (raw: string | null): string[] => {
  try { const v = JSON.parse(raw || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
};
export const ageOf = (p: { ngaySinh?: Date | string | null; namSinh?: number | null }) => {
  if (p.ngaySinh) return new Date().getFullYear() - new Date(p.ngaySinh).getFullYear();
  return p.namSinh ? new Date().getFullYear() - p.namSinh : 0;
};
export const tomorrowISO = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
export const fmtDate = (iso?: Date | string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");
export const fmtTime = (iso?: Date | string | null) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// `bhyt` lưu MÃ THẺ. Mức hưởng suy từ ký tự thứ 3: 1·2·5→100% · 3→95% · 4→80%.
export const isCardNumber = (raw?: string | null) => !!raw && !(BHYT as readonly string[]).includes(raw.trim());
export function bhytLevel(raw?: string | null): string {
  const v = (raw || "").trim();
  if (!v) return "";
  if ((BHYT as readonly string[]).includes(v)) return v;
  const d = v.replace(/\s+/g, "").toUpperCase()[2];
  if ("125".includes(d)) return "100%";
  if (d === "3") return "95%";
  if (d === "4") return "80%";
  return "Không rõ";
}

// ── Hàng xuất dữ liệu (SRS §11.1) — dùng chung cho Excel (UC-08) & Google Sheet (UC-10/BR-15).
// Giữ HEADER và thứ tự cell khớp nhau để hai nơi không bao giờ lệch cột.
export const HOSO_HEADER = [
  "Cơ sở", "Ngày khám", "Xã", "Địa điểm khám", "Mã BN", "Mã BN HIS", "STT", "Họ tên", "Ngày sinh",
  "Giới tính", "SĐT", "Chẩn đoán", "Khuyến nghị", "Nhóm", "BHYT",
  "Tư vấn viên", "Người chốt cuối", "Số tiền báo", "Số tiền thực thu", "Ngày ĐK mổ",
  "Ngày mổ thực tế", "Trạng thái", "Ngày tái khám", "Số lần liên hệ", "Ghi chú mắt 2",
] as const;

const toISO = (d?: Date | string | null) => (d ? (typeof d === "string" ? d : d.toISOString()) : null);
// Tên nhân viên: ưu tiên tên từ quan hệ; admin là tài khoản tích hợp (không nằm trong bảng NV).
const staffName = (rel?: { hoTen: string } | null, ma?: string | null) =>
  rel?.hoTen || (ma === "admin" ? "Quản trị hệ thống" : ma || "");
// Nhãn nhóm A/B kèm ý nghĩa cho báo cáo.
const nhomLabel = (n?: string | null) =>
  n === "A" ? "A - Đồng ý mổ" : n === "B" ? "B - Suy nghĩ thêm" : n || "";

export interface HoSoExport {
  maBN: string; maBNHIS?: string | null; stt: number; hoTen: string; namSinh: number; ngaySinh?: Date | string | null; gioiTinh: string;
  sdt: string | null; sdtNguoiNha: string | null;
  chanDoan: string; chanDoanKhac: string | null; khuyenNghi: string | null;
  nhom: string | null; bhyt: string | null; tuVanVienMa?: string | null; nguoiChotCuoiMa?: string | null;
  tuVanVien?: { hoTen: string } | null; nguoiChotCuoi?: { hoTen: string } | null;
  soTienBao: number | null; soTienThucThu?: number | null;
  ngayDieuTri: Date | string | null; ngayMoThucTe?: Date | string | null;
  trangThai: string; ngayTaiKham?: Date | string | null; ghiChuMat2?: string | null;
  soLanLienHe?: number; // số lần liên hệ = số bản ghi NhatKyTheoDoi
  coSo?: { ten: string } | null;
  buoiKham?: { ngayKham: Date | string; xa: string; diaDiem: string } | null;
}

// Một dòng dữ liệu theo đúng thứ tự HOSO_HEADER. Giá trị rỗng = "" để Sheet/Excel hiển thị gọn.
// forSheet=true: ép SĐT thành text (dấu ' đầu) để Google Sheet không mất số 0 đầu.
export function hoSoToCells(h: HoSoExport, forSheet = false): (string | number)[] {
  const phone = (v: string | null) => (v ? (forSheet ? "'" + v : v) : "");
  return [
    h.coSo?.ten ?? "",
    fmtDate(toISO(h.buoiKham?.ngayKham)),
    h.buoiKham?.xa ?? "",
    h.buoiKham?.diaDiem ?? "",
    h.maBN,
    h.maBNHIS || "", // Mã BN HIS
    h.stt,
    h.hoTen,
    h.ngaySinh ? fmtDate(toISO(h.ngaySinh)) : (h.namSinh || ""),
    h.gioiTinh,
    phone(h.sdt),
    parseDiag(h.chanDoan).join(", ") + (h.chanDoanKhac ? ` (${h.chanDoanKhac})` : ""),
    h.khuyenNghi || "",
    nhomLabel(h.nhom),
    bhytLevel(h.bhyt),
    staffName(h.tuVanVien, h.tuVanVienMa),
    staffName(h.nguoiChotCuoi, h.nguoiChotCuoiMa),
    h.soTienBao ?? "",
    h.soTienThucThu ?? "",
    fmtDate(toISO(h.ngayDieuTri)),
    fmtDate(toISO(h.ngayMoThucTe)),
    statusOf(h.trangThai).label,
    fmtDate(toISO(h.ngayTaiKham)),
    h.soLanLienHe ?? 0,
    h.ghiChuMat2 || "",
  ];
}

// Nhãn + màu trạng thái hồ sơ (BR-08). teal = "sống/tốt", vàng = theo dõi, đỏ = hủy.
export const STATUS: Record<string, { label: string; cls: string }> = {
  TiepNhan:    { label: "Tiếp nhận",       cls: "bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" },
  DaKham:      { label: "Đã khám",         cls: "bg-[var(--navy-50)] text-[var(--navy)] border-[var(--navy-100)]" },
  TheoDoi:     { label: "Theo dõi",        cls: "bg-[var(--gold-soft)] text-[var(--gold-deep)] border-[var(--gold-line)]" },
  CoChiDinhMo: { label: "Có chỉ định mổ",  cls: "bg-[var(--navy-50)] text-[var(--navy)] border-[var(--navy-100)]" },
  NhomA:       { label: "Nhóm A",          cls: "bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" },
  NhomB:       { label: "Nhóm B",          cls: "bg-[var(--gold-soft)] text-[var(--gold-deep)] border-[var(--gold-line)]" },
  DaNhacLich:  { label: "Đã nhắc lịch",    cls: "bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" },
  DaDonVien:   { label: "Đã đón",          cls: "bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" },
  DaMoHauPhau: { label: "Đã mổ",           cls: "bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]" },
  HuyKhongDen: { label: "Hủy / Không đến", cls: "bg-[var(--rose-soft)] text-[var(--rose)] border-[var(--rose)]" },
};
export const statusOf = (t?: string | null) =>
  STATUS[t || ""] || { label: t || "—", cls: "bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" };

export interface HoSo {
  id: string; maBN: string; maBNHIS?: string | null; stt: number; buoiKhamId?: string; hoTen: string; gioiTinh: string;
  ngaySinh: string | null; namSinh: number; cccd: string | null; diaChi: string | null;
  sdt: string | null; sdtNguoiNha: string | null;
  thiLucMP: string | null; thiLucMT: string | null;
  chanDoan: string; chanDoanKhac: string | null; khuyenNghi: string | null;
  bhyt: string | null; soTienBao: number | null; ngayDieuTri: string | null;
  diemDon: string | null; gioDon?: string | null; nhom: string | null; followUpStatus?: string | null;
  daDon?: boolean; ngayMoThucTe?: string | null; soTienThucThu?: number | null;
  trangThaiDieuTri?: string | null; ngayTaiKham?: string | null; ghiChuMat2?: string | null;
  trangThai: string;
  tuVanVien?: { maNV: string; hoTen: string } | null;
  buoiKham?: { xa: string; diaDiem: string; ngayKham: string } | null;
  updatedAt?: string | null; updatedBy?: string | null;
}
