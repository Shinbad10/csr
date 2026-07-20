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
export const fmtBuoiKhamName = (b?: { ghiChu?: string | null; diaDiem?: string | null; xa?: string | null } | null): string => {
  if (!b) return "—";
  const ghiChu = (b.ghiChu || "").trim();
  const diaDiem = (b.diaDiem || "").trim();
  const xa = (b.xa || "").trim();
  if (ghiChu && ghiChu.toLowerCase() !== "test" && ghiChu !== xa) return ghiChu;
  if (diaDiem && diaDiem.toLowerCase() !== "test" && diaDiem !== xa) return diaDiem;
  if (xa) return `BV - Xã ${xa}`;
  return ghiChu || diaDiem || "Đợt khám";
};

export const fmtBuoiKhamCode = (id?: string | null): string => {
  if (!id) return "—";
  if (id.startsWith("ĐK-")) return id;
  if (id.startsWith("BK")) return `ĐK-${id.slice(2)}`;
  return `ĐK-${id.slice(0, 8).toUpperCase()}`;
};


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

// ── Hàng xuất dữ liệu — dùng chung cho Excel (UC-08) & Google Sheet (UC-10/BR-15).
// 18 cột theo mẫu báo cáo phiếu sàng lọc + cột "Mã BN" ở cuối làm KHOÁ upsert cho Sheet.
// Giữ HEADER và thứ tự cell khớp nhau để hai nơi không bao giờ lệch cột.
export const HOSO_HEADER = [
  "Xã", "Điểm xã", "Ngày khám", "Mã định danh", "Họ tên bệnh nhân", "Năm sinh",
  "Giới tính", "Số điện thoại", "BHYT", "Có bệnh lý",
  "Đục thủy tinh thể", "Mộng", "Khác", "Chi tiết chẩn đoán",
  "Bác sỹ khám", "Nhân viên tư vấn", "Xác nhận điều trị", "Ngày điều trị dự kiến",
  "Mã BN", // cột kỹ thuật — khoá upsert Google Sheet, kế toán có thể ẩn
] as const;

const toISO = (d?: Date | string | null) => (d ? (typeof d === "string" ? d : d.toISOString()) : null);
// Tên nhân viên: ưu tiên tên từ quan hệ; admin là tài khoản tích hợp (không nằm trong bảng NV).
const staffName = (rel?: { hoTen: string } | null, ma?: string | null) =>
  rel?.hoTen || (ma === "admin" ? "Quản trị hệ thống" : ma || "");
const YN = (b: boolean) => (b ? "YES" : "NO");

export interface HoSoExport {
  maBN: string; stt: number; hoTen: string; namSinh: number; ngaySinh?: Date | string | null; gioiTinh: string;
  cccd?: string | null; sdt: string | null;
  chanDoan: string; chanDoanKhac: string | null;
  bhyt: string | null; mucHuongBHYT?: number | null;
  benhLy?: string | null; loaiBenhLy?: string | null; loaiBenhLyKhac?: string | null;
  bacSiChiDinh?: string | null; nhanVienTuVan?: string | null;
  xacNhanDieuTri?: boolean | null; lyDoKhongDieuTri?: string | null;
  diemKham?: string | null;
  tuVanVienMa?: string | null; tuVanVien?: { hoTen: string } | null;
  ngayDieuTri: Date | string | null;
  buoiKham?: { ngayKham: Date | string; xa: string; diaDiem: string } | null;
}

// Một dòng dữ liệu theo đúng thứ tự HOSO_HEADER. Giá trị rỗng = "" để Sheet/Excel hiển thị gọn.
// forSheet=true: ép SĐT thành text (dấu ' đầu) để Google Sheet không mất số 0 đầu.
export function hoSoToCells(h: HoSoExport, forSheet = false): (string | number)[] {
  const phone = (v: string | null) => (v ? (forSheet ? "'" + v : v) : "");

  const icd = parseDiag(h.loaiBenhLy ?? "[]");        // mã ICD (bộ mới)
  const cds = parseDiag(h.chanDoan);                  // chẩn đoán rút gọn (bộ cũ)

  // Yes/No: ưu tiên mã ICD, bổ sung bằng bộ chẩn đoán cũ.
  const ducTTT = icd.some((x) => x.startsWith("H25")) || cds.includes("Đục thủy tinh thể");
  const mong = cds.includes("Mộng"); // danh mục ICD không có mục "Mộng"
  const khac = icd.some((x) => !x.startsWith("H25") && x !== "Khác")
    || icd.includes("Khác")
    || cds.some((x) => x !== "Đục thủy tinh thể" && x !== "Mộng");

  // Chi tiết chẩn đoán: gộp mã ICD + chẩn đoán cũ, thay "Khác" bằng nội dung ghi rõ.
  const detail = Array.from(new Set([
    ...icd.map((x) => (x === "Khác" ? (h.loaiBenhLyKhac || "Khác") : x)),
    ...cds.map((x) => (x === "Khác" ? (h.chanDoanKhac || "Khác") : x)),
  ])).join(", ");

  const coBenhLy = h.benhLy === "Nghi ngờ bệnh lý" || icd.length > 0 || cds.length > 0;

  // Mức hưởng BHYT dạng số (100/95/80); suy từ mã thẻ nếu chưa lưu.
  const mucHuong = h.mucHuongBHYT ?? (() => {
    const n = parseInt(bhytLevel(h.bhyt), 10);
    return Number.isFinite(n) ? n : null;
  })();

  const xacNhan = h.xacNhanDieuTri == null ? ""
    : h.xacNhanDieuTri ? "YES"
    : `NO${h.lyDoKhongDieuTri ? ` — ${h.lyDoKhongDieuTri}` : ""}`;

  return [
    h.buoiKham?.xa ?? "",                              // 1  Xã
    h.diemKham || h.buoiKham?.diaDiem || "",           // 2  Điểm xã
    fmtDate(toISO(h.buoiKham?.ngayKham)),              // 3  Ngày khám
    h.cccd || "",                                      // 4  Mã định danh
    h.hoTen,                                           // 5  Họ tên bệnh nhân
    h.namSinh || "",                                   // 6  Năm sinh
    h.gioiTinh,                                        // 7  Giới tính
    phone(h.sdt),                                      // 8  Số điện thoại
    mucHuong ?? "",                                    // 9  BHYT (%)
    coBenhLy ? "CÓ" : "KHÔNG",                         // 10 Có bệnh lý
    YN(ducTTT),                                        // 11 Đục thủy tinh thể
    YN(mong),                                          // 12 Mộng
    YN(khac),                                          // 13 Khác
    detail,                                            // 14 Chi tiết chẩn đoán
    h.bacSiChiDinh || "",                              // 15 Bác sỹ khám
    h.nhanVienTuVan || staffName(h.tuVanVien, h.tuVanVienMa), // 16 Nhân viên tư vấn
    xacNhan,                                           // 17 Xác nhận điều trị
    h.ngayDieuTri ? fmtDate(toISO(h.ngayDieuTri)) : "", // 18 Ngày điều trị dự kiến
    h.maBN,                                            // 19 Mã BN (khoá)
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
  // Phiếu khám sàng lọc nhãn khoa
  mucHuongBHYT?: number | null; khuPho?: string | null; xaPhuong?: string | null;
  benhSu?: boolean | null; loaiBenhSu?: string | null;
  chieuCao?: string | null; canNang?: string | null;
  benhLy?: string | null; loaiBenhLy?: string | null; loaiBenhLyKhac?: string | null;
  huongXuTri?: string | null; huongXuTriKhac?: string | null;
  bacSiChiDinh?: string | null; nhanVienTuVan?: string | null;
  xacNhanDieuTri?: boolean | null; lyDoKhongDieuTri?: string | null; diemKham?: string | null;
  bhyt: string | null; soTienBao: number | null; ngayDieuTri: string | null;
  diemDon: string | null; gioDon?: string | null; nhom: string | null; followUpStatus?: string | null;
  daDon?: boolean; ngayMoThucTe?: string | null; soTienThucThu?: number | null;
  trangThaiDieuTri?: string | null; ngayTaiKham?: string | null; ghiChuMat2?: string | null;
  trangThai: string;
  tuVanVien?: { maNV: string; hoTen: string } | null;
  buoiKham?: { xa: string; diaDiem: string; ngayKham: string } | null;
  updatedAt?: string | null; updatedBy?: string | null;
}
