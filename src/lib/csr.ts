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

// ── Trạng thái đợt khám theo ngày khám ────────────────────────────────────
// So sánh theo ngày ở múi giờ máy (khớp với fmtDate), không dùng UTC.
export type BuoiKhamPhase = "SapDienRa" | "DangDienRa" | "DaKetThuc";

/** Số ngày từ hôm nay tới ngày khám: âm = đã qua, 0 = hôm nay, dương = còn tới. */
export const daysUntil = (iso?: Date | string | null): number | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
};

export const phaseOf = (ngayKham?: Date | string | null): { key: BuoiKhamPhase; label: string; cls: string; hint: string } => {
  const d = daysUntil(ngayKham);
  if (d === 0) return { key: "DangDienRa", label: "Đang diễn ra", cls: "bg-[var(--teal-soft)] text-[var(--teal-deep)] border-[var(--teal)]", hint: "Khám hôm nay" };
  if (d != null && d > 0) return {
    key: "SapDienRa", label: "Sắp diễn ra", cls: "bg-[var(--navy-50)] text-[var(--navy)] border-[var(--navy-100)]",
    hint: d === 1 ? "Khám vào ngày mai" : `Còn ${d} ngày nữa mới tới ngày khám`,
  };
  return {
    key: "DaKetThuc", label: "Đã kết thúc", cls: "bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]",
    hint: d == null ? "Chưa có ngày khám" : `Đã qua ${Math.abs(d)} ngày`,
  };
};
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
  maBN: string; stt: number; hoTen: string; namSinh: number | null; ngaySinh?: Date | string | null; gioiTinh: string;
  cccd?: string | null; sdt: string | null; sdtNguoiNha?: string | null;
  diaChi?: string | null; khuPho?: string | null; xaPhuong?: string | null;
  benhSu?: boolean | null; loaiBenhSu?: string | null; loaiBenhSuKhac?: string | null;
  chieuCao?: string | null; canNang?: string | null;
  thiLucMP?: string | null; thiLucMT?: string | null;
  chanDoan: string; chanDoanKhac: string | null;
  chanDoanMP?: string | null; chanDoanKhacMP?: string | null;
  chanDoanMT?: string | null; chanDoanKhacMT?: string | null;
  khuyenNghi?: string | null; huongXuTri?: string | null; huongXuTriKhac?: string | null;
  bhyt: string | null; mucHuongBHYT?: number | null;
  benhLy?: string | null; loaiBenhLy?: string | null; loaiBenhLyKhac?: string | null;
  bacSiChiDinh?: string | null; nhanVienTuVan?: string | null;
  xacNhanDieuTri?: boolean | null; lyDoKhongDieuTri?: string | null;
  diemKham?: string | null;
  tuVanVienMa?: string | null; tuVanVien?: { hoTen: string } | null;
  ngayDieuTri: Date | string | null;
  buoiKham?: { ngayKham: Date | string; xa: string; diaDiem: string; bacSiKham?: string | null } | null;
}

const foldStr = (s?: string | null) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

// Một dòng dữ liệu theo đúng thứ tự HOSO_HEADER. Giá trị rỗng = "" để Sheet/Excel hiển thị gọn.
// forSheet=true: ép SĐT thành text (dấu ' đầu) để Google Sheet không mất số 0 đầu.
export function hoSoToCells(h: HoSoExport, forSheet = false): (string | number)[] {
  const phone = (v: string | null) => (v ? (forSheet ? "'" + v : v) : "");

  const icd = parseDiag(h.loaiBenhLy ?? "[]");        // mã ICD (bộ mới)
  const cds = parseDiag(h.chanDoan);                  // chẩn đoán rút gọn (bộ cũ)
  const mp = parseDiag(h.chanDoanMP ?? null);
  const mt = parseDiag(h.chanDoanMT ?? null);

  const allDiags = [...icd, ...cds, ...mp, ...mt];

  const hasDucTTT = (s: string) => {
    const f = foldStr(s);
    return f.includes("duc thuy tinh the") || f.includes("dtt") || s.startsWith("H25");
  };

  const hasMong = (s: string) => {
    const f = foldStr(s);
    return f.includes("mong");
  };

  const isKnown = (s: string) => hasDucTTT(s) || hasMong(s);

  // Yes/No: kiểm tra trên toàn bộ các nguồn chẩn đoán
  const ducTTT = allDiags.some(hasDucTTT);
  const mong = allDiags.some(hasMong);
  const khac = allDiags.some((x) => x.trim() !== "" && !isKnown(x))
    || Boolean(h.loaiBenhLyKhac?.trim())
    || Boolean(h.chanDoanKhac?.trim())
    || Boolean(h.chanDoanKhacMP?.trim())
    || Boolean(h.chanDoanKhacMT?.trim());

  // Chi tiết chẩn đoán: gộp mã ICD + chẩn đoán mắt, thay "Khác" bằng nội dung ghi rõ.
  const detailItems: string[] = [];
  icd.forEach((x) => detailItems.push(x === "Khác" ? (h.loaiBenhLyKhac || "Khác") : x));
  cds.forEach((x) => detailItems.push(x === "Khác" ? (h.chanDoanKhac || "Khác") : x));
  if (detailItems.length === 0) {
    mp.forEach((x) => detailItems.push(x === "Khác" ? (h.chanDoanKhacMP || "Khác (MP)") : `${x} (MP)`));
    mt.forEach((x) => detailItems.push(x === "Khác" ? (h.chanDoanKhacMT || "Khác (MT)") : `${x} (MT)`));
  }
  const detail = Array.from(new Set(detailItems.filter(Boolean))).join(", ");

  const coBenhLy = h.benhLy === "Nghi ngờ bệnh lý" || ducTTT || mong || khac || allDiags.length > 0;

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
    h.namSinh || (h.ngaySinh ? new Date(h.ngaySinh).getFullYear() : "") || "", // 6  Năm sinh
    h.gioiTinh,                                        // 7  Giới tính
    phone(h.sdt),                                      // 8  Số điện thoại
    mucHuong ?? "",                                    // 9  BHYT (%)
    coBenhLy ? "CÓ" : "KHÔNG",                         // 10 Có bệnh lý
    YN(ducTTT),                                        // 11 Đục thủy tinh thể
    YN(mong),                                          // 12 Mộng
    YN(khac),                                          // 13 Khác
    detail,                                            // 14 Chi tiết chẩn đoán
    h.bacSiChiDinh || h.buoiKham?.bacSiKham || "",      // 15 Bác sỹ khám
    h.nhanVienTuVan || staffName(h.tuVanVien, h.tuVanVienMa), // 16 Nhân viên tư vấn
    xacNhan,                                           // 17 Xác nhận điều trị
    h.ngayDieuTri ? fmtDate(toISO(h.ngayDieuTri)) : "", // 18 Ngày điều trị dự kiến
    h.maBN,                                            // 19 Mã BN (khoá)
  ];
}

// ── Cấu trúc mẫu xuất Excel Khám Sức Khỏe (101 cột) — điền thông tin hành chính & khám mắt, các cột khác để trống ──
export const KHAM_SUC_KHOE_HEADER = [
  // 1. Thông tin hành chính
  "Họ tên",
  "Giới tính\n(0 - Nữ, 1 - Nam)",
  "Sinh ngày",
  "CCCD/định danh",
  "Ngày cấp định danh",
  "Nơi cấp định danh",
  "Chỗ ở hiện tại",
  "Số điện thoại",
  "Lý do khám sức khỏe",

  // 2. Tiền sử bệnh
  "Có bệnh hay bị thương trong 5 năm qua\n(0 - Không; 1 - Có)",
  "Có bệnh thần kinh hay bị thương ở đầu\n(0 - Không; 1 - Có)",
  "Bệnh mắt hoặc giảm thị lực (trừ trường hợp đeo kính thuốc)\n(0 - Không; 1 - Có)",
  "Bệnh ở tai, giảm sức nghe hoặc thăng bằng\n(0 - Không; 1 - Có)",
  "Bệnh ở tim, hoặc nhồi máu cơ tim, các bệnh tim mạch khác\n(0 - Không; 1 - Có)",
  "Phẫu thuật can thiệp tim - mạch (thay van, bắc cầu nối, tạo hình mạch, máy tạo nhịp, đặt stent mạch, ghép tim)\n(0 - Không; 1 - Có)",
  "Tăng huyết áp\n(0 - Không; 1 - Có)",
  "Khó thở\n(0 - Không; 1 - Có)",
  "Bệnh phổi, hen, khí phế thũng, viêm phế quản mạn tính\n(0 - Không; 1 - Có)",
  "Bệnh thận, lọc máu\n(0 - Không; 1 - Có)",
  "Nghiện rượu, bia\n(0 - Không; 1 - Có)",
  "Đái tháo đường hoặc kiểm soát tăng đường huyết\n(0 - Không; 1 - Có)",
  "Bệnh tâm thần\n(0 - Không; 1 - Có)",
  "Mất ý thức, rối loạn ý thức\n(0 - Không; 1 - Có)",
  "Ngất, chóng mặt\n(0 - Không; 1 - Có)",
  "Bệnh tiêu hóa\n(0 - Không; 1 - Có)",
  "Rối loạn giấc ngủ, ngừng thở khi ngủ, ngủ rũ ban ngày, ngáy to\n(0 - Không; 1 - Có)",
  "Tai biến mạch máu não hoặc liệt\n(0 - Không; 1 - Có)",
  "Bệnh hoặc tổn thương cột sống\n(0 - Không; 1 - Có)",
  "Sử dụng rượu thường xuyên, liên tục\n(0 - Không; 1 - Có)",
  "Sử dụng ma túy và chất gây nghiện\n(0 - Không; 1 - Có)",
  "Bệnh khác (ghi rõ)\n(0 - Không; 1 - Có)",
  "Bệnh đang điều trị\n(0 - Không; 1 - Có)",
  "Ghi rõ bệnh đang điều trị (nếu có)",
  "Các thuốc đang dùng và liều lượng (nếu có)",
  "Tiền sử thai sản\n(Đối với phụ nữ)",

  // 3. Khám thể lực
  "Chiều cao",
  "Cân nặng",
  "Chỉ số BMI",
  "Mạch",
  "Huyết áp\n(..... mmHg)",
  "Phân loại thể lực",

  // 4. Khám lâm sàng
  // Tuần hoàn
  "Bác sĩ\n(Khám tuần hoàn)",
  "Tuần hoàn",
  "Phân loại tuần hoàn",

  // Hô hấp
  "Bác sĩ\n(Khám hô hấp)",
  "Hô hấp",
  "Phân loại Hô hấp",

  // Tiêu hóa
  "Bác sĩ\n(Khám tiêu hóa)",
  "Tiêu hóa",
  "Phân loại tiêu hóa",

  // Thận - Tiết niệu
  "Bác sĩ\n(Khám Thận - tiết niệu)",
  "Thận - Tiết niệu",
  "Phân loại Thận - tiết niệu",

  // Cơ xương khớp
  "Bác sĩ\n(Khám Cơ xương khớp)",
  "Cơ xương khớp",
  "Phân loại Cơ xương khớp",

  // Thần kinh
  "Bác sĩ\n(Khám Thần kinh)",
  "Thần kinh",
  "Phân loại Thần kinh",

  // Tâm thần
  "Bác sĩ\n(Khám Tâm thần)",
  "Tâm thần",
  "Phân loại Tâm thần",

  // Ngoại khoa
  "Bác sĩ\n(Khám Ngoại khoa)",
  "Ngoại khoa",
  "Phân loại ngoại khoa",

  // Da liễu
  "Bác sĩ\n(Khám Da liễu)",
  "Da liễu",
  "Phân loại Da liễu",

  // Sản phụ khoa
  "Bác sĩ\n(Khám Sản phụ khoa)",
  "Sản phụ khoa",
  "Phân loại Sản phụ khoa",

  // MẮT (CHUYÊN KHOA MẮT - ĐIỀN ĐỦ THÔNG TIN)
  "Bác sĩ\n(Khám Mắt)",
  "Mắt phải\n(không kính)",
  "Mắt trái\n(không kính)",
  "Mắt phải\n(có kính)",
  "Mắt trái\n(có kính)",
  "Các bệnh về mắt\n(Nếu có)",
  "Phân loại mắt",

  // Tai mũi họng
  "Bác sĩ\n(Khám Tai mũi họng)",
  "Tai trái\n(nói thường)",
  "Tai phải\n(nói thường)",
  "Tai trái\n(nói thầm)",
  "Tai phải\n(nói thầm)",
  "Các bệnh về tai mũi họng\n(Nếu có)",
  "Phân loại tai mũi họng",

  // Răng hàm mặt
  "Bác sĩ\n(Khám Răng hàm mặt)",
  "Hàm trên",
  "Hàm dưới",
  "Các bệnh về răng hàm mặt\n(Nếu có)",
  "Phân loại răng hàm mặt",

  // 5. Cận lâm sàng & Kết luận
  // Xét nghiệm máu
  "Bác sĩ\n(Xét nghiệm máu)",
  "Huyết học\n(Xét nghiệm máu)",
  "Sinh hóa máu\n(Xét nghiệm máu)",

  // Xét nghiệm nước tiểu
  "Bác sĩ\n(Xét nghiệm nước tiểu)",
  "Tổng phân tích nước tiểu (máy tự động)\n(Xét nghiệm nước tiểu)",
  "Khác (nếu có)\n(Xét nghiệm nước tiểu)",

  // Chẩn đoán hình ảnh
  "Bác sĩ\n(Chẩn đoán hình ảnh)",
  "Chẩn đoán hình ảnh\n(XQ tim phổi thẳng)",

  // Kết luận
  "Bác sĩ\n(Kết luận)",
  "Phân loại sức khỏe\n(Kết luận)",
  "Các bệnh, tật\n(nếu có)",
] as const;

export function hoSoToKhamSucKhoeCells(h: HoSoExport): (string | number)[] {
  const icd = parseDiag(h.loaiBenhLy ?? "[]");
  const cds = parseDiag(h.chanDoan);
  const mp = parseDiag(h.chanDoanMP ?? null);
  const mt = parseDiag(h.chanDoanMT ?? null);
  const allDiags = [...icd, ...cds, ...mp, ...mt];

  const hasDucTTT = (s: string) => {
    const f = foldStr(s);
    return f.includes("duc thuy tinh the") || f.includes("dtt") || s.startsWith("H25");
  };
  const hasMong = (s: string) => {
    const f = foldStr(s);
    return f.includes("mong");
  };
  const isKnown = (s: string) => hasDucTTT(s) || hasMong(s);
  const ducTTT = allDiags.some(hasDucTTT);
  const mong = allDiags.some(hasMong);
  const khac = allDiags.some((x) => x.trim() !== "" && !isKnown(x))
    || Boolean(h.loaiBenhLyKhac?.trim())
    || Boolean(h.chanDoanKhac?.trim())
    || Boolean(h.chanDoanKhacMP?.trim())
    || Boolean(h.chanDoanKhacMT?.trim());

  const detailItems: string[] = [];
  icd.forEach((x) => detailItems.push(x === "Khác" ? (h.loaiBenhLyKhac || "Khác") : x));
  cds.forEach((x) => detailItems.push(x === "Khác" ? (h.chanDoanKhac || "Khác") : x));
  if (detailItems.length === 0) {
    mp.forEach((x) => detailItems.push(x === "Khác" ? (h.chanDoanKhacMP || "Khác (MP)") : `${x} (MP)`));
    mt.forEach((x) => detailItems.push(x === "Khác" ? (h.chanDoanKhacMT || "Khác (MT)") : `${x} (MT)`));
  }
  const detail = Array.from(new Set(detailItems.filter(Boolean))).join(", ");
  const coBenhLy = h.benhLy === "Nghi ngờ bệnh lý" || ducTTT || mong || khac || allDiags.length > 0;

  // Giới tính (0 - Nữ, 1 - Nam)
  const gt = h.gioiTinh === "Nam" ? 1 : (h.gioiTinh === "Nữ" ? 0 : "");

  // Ngày sinh dạng dd/mm/yyyy
  const ngaySinhStr = h.ngaySinh
    ? fmtDate(h.ngaySinh)
    : (h.namSinh ? `01/01/${h.namSinh}` : "");

  // Chỗ ở hiện tại
  const choO = [h.diaChi, h.khuPho, h.xaPhuong || h.buoiKham?.xa].filter(Boolean).join(", ") || h.diaChi || "";

  // Bác sĩ khám
  const bacSi = h.bacSiChiDinh || h.buoiKham?.bacSiKham || "";

  // BMI
  const chieuCaoNum = parseFloat(h.chieuCao || "");
  const canNangNum = parseFloat(h.canNang || "");
  const bmi = (chieuCaoNum > 0 && canNangNum > 0)
    ? Number((canNangNum / Math.pow(chieuCaoNum / 100, 2)).toFixed(1))
    : "";

  // Tiền sử bệnh
  const loaiBS = (h.loaiBenhSu || "").toString();

  return [
    // 1. Thông tin hành chính
    h.hoTen || "",                                                          // Họ tên
    gt,                                                                     // Giới tính (0 - Nữ, 1 - Nam)
    ngaySinhStr,                                                            // Sinh ngày
    h.cccd || "",                                                           // CCCD/định danh
    "",                                                                     // Ngày cấp định danh
    "",                                                                     // Nơi cấp định danh
    choO,                                                                   // Chỗ ở hiện tại
    h.sdt || "",                                                            // Số điện thoại
    "Khám sức khỏe người cao tuổi",                                         // Lý do khám sức khỏe

    // 2. Tiền sử bệnh
    h.benhSu ? 1 : 0,                                                       // Có bệnh hay bị thương trong 5 năm qua
    "",                                                                     // Có bệnh thần kinh hay bị thương ở đầu
    coBenhLy ? 1 : 0,                                                       // Bệnh mắt hoặc giảm thị lực
    "",                                                                     // Bệnh ở tai...
    "",                                                                     // Bệnh ở tim...
    "",                                                                     // Phẫu thuật can thiệp tim - mạch...
    loaiBS.includes("Tăng huyết áp") ? 1 : 0,                                // Tăng huyết áp
    "",                                                                     // Khó thở
    (loaiBS.includes("Hen phế quản") || loaiBS.includes("Phổi tắc nghẽn")) ? 1 : 0, // Bệnh phổi, hen...
    loaiBS.includes("Bệnh thận mạn") ? 1 : 0,                               // Bệnh thận, lọc máu
    "",                                                                     // Nghiện rượu, bia
    loaiBS.includes("Đái tháo đường") ? 1 : 0,                              // Đái tháo đường...
    (loaiBS.includes("Trầm cảm") || loaiBS.includes("Rối loạn lo âu")) ? 1 : 0, // Bệnh tâm thần
    "",                                                                     // Mất ý thức, rối loạn ý thức
    "",                                                                     // Ngất, chóng mặt
    "",                                                                     // Bệnh tiêu hóa
    "",                                                                     // Rối loạn giấc ngủ...
    loaiBS.includes("Đột quỵ") ? 1 : 0,                                     // Tai biến mạch máu não hoặc liệt
    loaiBS.includes("Thoái hóa khớp") ? 1 : 0,                              // Bệnh hoặc tổn thương cột sống
    "",                                                                     // Sử dụng rượu thường xuyên...
    "",                                                                     // Sử dụng ma túy...
    h.loaiBenhSuKhac ? 1 : 0,                                               // Bệnh khác (ghi rõ)
    "",                                                                     // Bệnh đang điều trị
    h.loaiBenhSuKhac || "",                                                 // Ghi rõ bệnh đang điều trị (nếu có)
    "",                                                                     // Các thuốc đang dùng và liều lượng
    "",                                                                     // Tiền sử thai sản

    // 3. Khám thể lực
    h.chieuCao || "",                                                       // Chiều cao
    h.canNang || "",                                                        // Cân nặng
    bmi,                                                                    // Chỉ số BMI
    "",                                                                     // Mạch
    "",                                                                     // Huyết áp
    "",                                                                     // Phân loại thể lực

    // 4. Khám lâm sàng
    // Tuần hoàn
    "", "", "",
    // Hô hấp
    "", "", "",
    // Tiêu hóa
    "", "", "",
    // Thận - Tiết niệu
    "", "", "",
    // Cơ xương khớp
    "", "", "",
    // Thần kinh
    "", "", "",
    // Tâm thần
    "", "", "",
    // Ngoại khoa
    "", "", "",
    // Da liễu
    "", "", "",
    // Sản phụ khoa
    "", "", "",

    // MẮT (CHUYÊN KHOA MẮT - ĐIỀN ĐỦ THÔNG TIN)
    bacSi,                                                                  // Bác sĩ (Khám Mắt)
    h.thiLucMP || "",                                                       // Mắt phải (không kính)
    h.thiLucMT || "",                                                       // Mắt trái (không kính)
    "",                                                                     // Mắt phải (có kính)
    "",                                                                     // Mắt trái (có kính)
    detail || (coBenhLy ? "Nghi ngờ bệnh lý mắt" : "Bình thường"),          // Các bệnh về mắt (Nếu có)
    !coBenhLy ? "Loại I" : (h.huongXuTri === "Phẫu thuật" ? "Chỉ định phẫu thuật" : "Theo dõi"), // Phân loại mắt

    // Tai mũi họng
    "", "", "", "", "", "", "",
    // Răng hàm mặt
    "", "", "", "", "",

    // 5. Cận lâm sàng & Kết luận
    // Xét nghiệm máu
    "", "", "",
    // Xét nghiệm nước tiểu
    "", "", "",
    // Chẩn đoán hình ảnh
    "", "",
    // Kết luận
    bacSi,                                                                  // Bác sĩ (Kết luận)
    !coBenhLy ? "Loại I" : "Loại II",                                       // Phân loại sức khỏe (Kết luận)
    detail || (coBenhLy ? "Bệnh về mắt" : "Không"),                         // Các bệnh, tật (nếu có)
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
  ngaySinh: string | null; namSinh: number | null; cccd: string | null; diaChi: string | null;
  sdt: string | null; sdtNguoiNha: string | null;
  thiLucMP: string | null; thiLucMT: string | null;
  matKham?: string | null;
  chanDoanMP?: string | null; chanDoanKhacMP?: string | null;
  chanDoanMT?: string | null; chanDoanKhacMT?: string | null;
  chanDoan: string; chanDoanKhac: string | null; khuyenNghi: string | null;
  // Phiếu khám sàng lọc nhãn khoa
  mucHuongBHYT?: number | null; khuPho?: string | null; xaPhuong?: string | null;
  benhSu?: boolean | null; loaiBenhSu?: string | null; loaiBenhSuKhac?: string | null;
  chieuCao?: string | null; canNang?: string | null;
  benhLy?: string | null; loaiBenhLy?: string | null; loaiBenhLyKhac?: string | null;
  huongXuTri?: string | null; huongXuTriKhac?: string | null;
  bacSiChiDinh?: string | null; nhanVienTuVan?: string | null;
  xacNhanDieuTri?: boolean | null; lyDoKhongDieuTri?: string | null; diemKham?: string | null;
  bhyt: string | null; soTienBao: number | null; ngayDieuTri: string | null;
  diemDon: string | null; gioDon?: string | null; nhom: string | null; followUpStatus?: string | null;
  daDon?: boolean; ngayMoThucTe?: string | null; soTienThucThu?: number | null;
  trangThaiDieuTri?: string | null; ngayTaiKham?: string | null; ghiChuMat2?: string | null;
  ghiChuTuVan?: string | null;
  trangThai: string;
  tuVanVien?: { maNV: string; hoTen: string } | null;
  buoiKham?: { xa: string; diaDiem: string; ngayKham: string } | null;
  createdAt?: string | null;
  updatedAt?: string | null; updatedBy?: string | null;
}
