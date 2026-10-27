// Hằng số & helper thuần dùng chung các màn CSR (SRS §6.4, §7). Không import React.

export const CHAN_DOAN = ["Đục thủy tinh thể", "Mộng", "Đục bao sau", "Khác"];   // SRS §7
export const KHUYEN_NGHI = ["Phẫu thuật", "Theo dõi"] as const;                  // SRS §7
export const BHYT = ["Không có", "100%", "95%", "80%", "Không rõ"] as const;     // SRS §7
export const NHOM = ["A", "B"] as const;                                         // A = đã chốt mổ · B = theo dõi
export const TT_DIEU_TRI = ["Đã mổ", "Hủy", "Không đến"] as const;              // SRS §7
export const THI_LUC = ["", "10/10", "8/10", "6/10", "5/10", "4/10", "3/10", "2/10", "1/10", "ĐNT 3m", "ĐNT 2m", "ĐNT 1m", "BBT", "ST(+)", "ST(-)"];

/**
 * Phân loại Nhóm CSR chuẩn cho bệnh nhân (theo quy tắc nghiệp vụ CSR chuẩn hóa):
 * - Có bệnh lý (hasPathology): bệnh nhân có chẩn đoán/khuyến nghị/hướng xử trí/bệnh lý bất thường.
 * - Nhóm A: Có chỉ định và đã đồng ý/chốt mổ (nhom === 'A', xacNhanDieuTri === true, hoặc trạng thái thuộc [NhomA, DaNhacLich, DaDonVien, DaMoHauPhau]).
 * - Nhóm B: Có chỉ định/bệnh lý nhưng chưa đồng ý hoặc theo dõi (hasPathology && !isNhomA).
/**
 * Phân định thời điểm phẫu thuật so với ngày khám tầm soát CSR:
 * - isDaMo: Mổ trong hoặc sau đợt khám tầm soát (tính vào chỉ số hiệu quả CSR)
 * - isDaMoTruoc: Đã từng mổ trước khi đợt khám tầm soát diễn ra (tách riêng để đánh giá khách quan)
 * - isDaDenTruoc: Đã từng đến viện trước ngày khám
 */
/**
 * Kiểm tra tính hợp lệ của ca phẫu thuật khi đưa vào số liệu báo cáo CSR:
 * Quy tắc nghiệp vụ:
 * - Số liệu báo cáo chỉ tính:
 *   1. Khớp CCCD + Họ tên + Ngày sinh (hoặc năm sinh) giữa HIS và CSR.
 *   2. VÀ xác nhận thủ công nếu 1 trong 2 giữa HIS và CSR khuyết CCCD.
 * - Trường hợp CCCD bị lệch/xung đột hoặc chưa xác nhận khi khuyết CCCD thì KHÔNG tính vào báo cáo.
 */
export function isReportValidSurgery(h: {
  ngayMoThucTe?: Date | string | null;
  trangThaiDieuTri?: string | null;
  trangThai?: string | null;
  cccd?: string | null;
  ghiChuMat2?: string | null;
  maBNHIS?: string | null;
  hoTen?: string | null;
}): boolean {
  const hasRawSurgery =
    Boolean(h.ngayMoThucTe) ||
    h.trangThaiDieuTri === "Đã mổ" ||
    h.trangThai === "DaMoHauPhau";
  if (!hasRawSurgery) return false;

  const note = h.ghiChuMat2 || "";

  // 1. Nếu có cảnh báo lệch/xung đột CCCD mà chưa được người dùng xác nhận đè -> TUYỆT ĐỐI LOẠI BỎ
  if (
    note.includes("CCCD lệch") &&
    !note.includes("Đã xác nhận") &&
    !note.includes("Xác nhận thủ công")
  ) {
    return false;
  }

  // 2. Khớp CCCD / BHYT chính xác từ đối chiếu HIS
  if (note.includes("[✓ Khớp CCCD]") || note.includes("[✓ Khớp mã BHYT]")) {
    return true;
  }

  // 3. Đã được người dùng bấm "Xác nhận" thủ công (đặc biệt khi 1 trong 2 bên khuyết CCCD)
  if (
    note.includes("Đã xác nhận") ||
    note.includes("Xác nhận thủ công") ||
    note.includes("[✓ Đã xác nhận khớp HIS]")
  ) {
    return true;
  }

  // 4. Nếu ghi chú chỉ khớp Họ tên + Năm sinh (chưa xác minh CCCD / khuyết CCCD) mà CHƯA có xác nhận
  if (note.includes("[⚠ Khớp Họ tên") || note.includes("[⚠")) {
    return false;
  }

  // 5. Nếu hồ sơ có số CCCD chuẩn (>= 9 số) và có mã HIS, không có ghi chú cảnh báo lệch
  const cccdDigits = (h.cccd || "").replace(/\D/g, "");
  if (cccdDigits.length >= 9) {
    return true;
  }

  // 6. Khuyết CCCD (CCCD rỗng hoặc < 9 số) nhưng chưa có xác nhận thủ công -> KHÔNG TÍNH
  return false;
}

export function checkSurgeryTiming(
  h: {
    ngayMoThucTe?: Date | string | null;
    trangThaiDieuTri?: string | null;
    trangThai?: string | null;
    buoiKham?: { ngayKham?: Date | string | null } | null;
    buoiKhamNgayKham?: Date | string | null;
    cccd?: string | null;
    ghiChuMat2?: string | null;
    maBNHIS?: string | null;
    hoTen?: string | null;
  },
  buoiKhamDateOverride?: Date | string | null
) {
  const isPriorMarked =
    h.trangThaiDieuTri === "Đã mổ trước đây" ||
    h.trangThai === "DaMoTruocDay";

  const isPriorVisitMarked = h.trangThaiDieuTri === "Đã đến trước đây";

  const khamDateStr = buoiKhamDateOverride || h.buoiKham?.ngayKham || h.buoiKhamNgayKham;
  let isDatePrior = false;
  if (h.ngayMoThucTe && khamDateStr) {
    const moDate = new Date(h.ngayMoThucTe);
    const khamDate = new Date(khamDateStr);
    const dMo = new Date(moDate.getFullYear(), moDate.getMonth(), moDate.getDate()).getTime();
    const dKham = new Date(khamDate.getFullYear(), khamDate.getMonth(), khamDate.getDate()).getTime();
    if (dMo < dKham) {
      isDatePrior = true;
    }
  }

  const isDaMoTruoc = isPriorMarked || isDatePrior;
  const hasRawSurgery =
    Boolean(h.ngayMoThucTe) ||
    h.trangThaiDieuTri === "Đã mổ" ||
    h.trangThai === "DaMoHauPhau" ||
    isDaMoTruoc;

  // CHỈ tính vào số liệu báo cáo ("Đã mổ") nếu:
  // - Khớp CCCD + Họ tên + Ngày sinh
  // - VÀ đã xác nhận nếu 1 trong 2 giữa HIS và CSR khuyết CCCD
  const isValidReportMatch = isReportValidSurgery(h);
  const hasSurgery = hasRawSurgery && (isDaMoTruoc || isValidReportMatch);
  const isDaMo = hasRawSurgery && !isDaMoTruoc && isValidReportMatch;

  return {
    hasSurgery,
    isDaMo,
    isDaMoTruoc,
    isDaDenTruoc: isPriorVisitMarked,
    isValidReportMatch,
  };
}

/**
 * Phân loại Nhóm CSR chuẩn cho bệnh nhân (theo quy tắc nghiệp vụ CSR chuẩn hóa):
 * - Có bệnh lý (hasPathology): bệnh nhân có chẩn đoán/khuyến nghị/hướng xử trí/bệnh lý bất thường.
 * - Nhóm A: Có chỉ định và đã đồng ý/chốt mổ (nhom === 'A', xacNhanDieuTri === true, hoặc trạng thái thuộc [NhomA, DaNhacLich, DaDonVien, DaMoHauPhau]).
 * - Nhóm B: Có chỉ định/bệnh lý nhưng chưa đồng ý hoặc theo dõi (hasPathology && !isNhomA).
 * - Đã mổ (isDaMo): Mổ sau ngày tầm soát (thuộc hiệu quả CSR). Mổ trước ngày khám được gắn cờ isDaMoTruoc.
 */
export function classifyCSRNhom(h: {
  nhom?: string | null;
  xacNhanDieuTri?: boolean | null;
  chanDoanMP?: string | null;
  chanDoanMT?: string | null;
  chanDoan?: string | null;
  chanDoanKhacMP?: string | null;
  chanDoanKhacMT?: string | null;
  chanDoanKhac?: string | null;
  benhLy?: string | null;
  khuyenNghi?: string | null;
  huongXuTri?: string | null;
  trangThai?: string | null;
  ngayMoThucTe?: Date | string | null;
  daDon?: boolean | null;
  ngayDenBV?: Date | string | null;
  trangThaiDieuTri?: string | null;
  buoiKham?: { ngayKham?: Date | string | null } | null;
  buoiKhamNgayKham?: Date | string | null;
  cccd?: string | null;
  ghiChuMat2?: string | null;
  maBNHIS?: string | null;
  hoTen?: string | null;
}) {
  const hasPathology =
    Boolean(h.nhom) ||
    h.xacNhanDieuTri != null ||
    (Boolean(h.chanDoanMP) && h.chanDoanMP !== "[]" && h.chanDoanMP !== "") ||
    (Boolean(h.chanDoanMT) && h.chanDoanMT !== "[]" && h.chanDoanMT !== "") ||
    (Boolean(h.chanDoan) && h.chanDoan !== "[]" && h.chanDoan !== "") ||
    Boolean(h.chanDoanKhacMP) ||
    Boolean(h.chanDoanKhacMT) ||
    Boolean(h.chanDoanKhac) ||
    (Boolean(h.benhLy) && h.benhLy !== "Chưa phát hiện bất thường" && h.benhLy !== "Bình thường") ||
    h.khuyenNghi === "Phẫu thuật" ||
    h.huongXuTri === "Phẫu thuật" ||
    h.huongXuTri === "Điều trị khác";

  const { isDaMo, isDaMoTruoc, isDaDenTruoc } = checkSurgeryTiming(h);

  const isDaDen =
    Boolean(h.daDon) ||
    Boolean(h.ngayDenBV) ||
    h.trangThai === "DaDonVien" ||
    isDaDenTruoc ||
    isDaMo;

  const isDenKhongMo =
    (Boolean(h.daDon) ||
      Boolean(h.ngayDenBV) ||
      h.trangThai === "DaDonVien" ||
      isDaDenTruoc) &&
    !isDaMo &&
    !isDaMoTruoc;

  if (!hasPathology) {
    return { hasPathology: false, isNhomA: false, isNhomB: false, isDaMo, isDaMoTruoc, isDaDen, isDenKhongMo };
  }

  const isNhomA =
    h.nhom === "A" ||
    h.xacNhanDieuTri === true ||
    h.trangThai === "NhomA" ||
    h.trangThai === "DaNhacLich" ||
    h.trangThai === "DaDonVien" ||
    h.trangThai === "DaMoHauPhau";

  const isNhomB = !isNhomA;

  return { hasPathology: true, isNhomA, isNhomB, isDaMo, isDaMoTruoc, isDaDen, isDenKhongMo };
}

// Trạng thái chỉ phát sinh khi bác sĩ đã chỉ định phẫu thuật (xem inferNextState).
const TRANG_THAI_CHI_DINH = ["CoChiDinhMo", "NhomA", "NhomB", "DaNhacLich", "DaDonVien", "DaMoHauPhau", "HuyKhongDen"];

/**
 * Các bước phễu "Số liệu quan trọng thống kê" (trang Báo cáo). Mỗi bước là tập con của bước trước
 * để tỷ lệ không vượt 100%:
 * - Chỉ định: bác sĩ chỉ định phẫu thuật (khuyến nghị/hướng xử trí "Phẫu thuật", đã phân nhóm A/B).
 * - Dự kiến: người đồng ý lên BV mổ (Nhóm A).
 * - Đã lên: đã đón / đến viện (= đã mổ + đến không mổ).
 * - Mắt 2: người đã mổ có ca mổ mắt thứ hai — HIS có ≥2 lần Phaco (`isPhaco2Lan`) hoặc ghi chú "Mắt 2".
 */
export function classifyCSRFunnel(
  h: Parameters<typeof classifyCSRNhom>[0] & { ghiChuMat2?: string | null },
  isPhaco2Lan = false
) {
  const c = classifyCSRNhom(h);
  const isDaLen = c.isDaMo || c.isDenKhongMo;
  const isDuKien = c.isNhomA || isDaLen;
  const isChiDinh =
    isDuKien ||
    h.khuyenNghi === "Phẫu thuật" ||
    h.huongXuTri === "Phẫu thuật" ||
    h.nhom === "A" ||
    h.nhom === "B" ||
    TRANG_THAI_CHI_DINH.includes(h.trangThai || "");
  const isMat2 = c.isDaMo && (isPhaco2Lan || /m[ắa]t\s*2/i.test(h.ghiChuMat2 || ""));

  return { ...c, isChiDinh, isDuKien, isDaLen, isMat2 };
}

export const parseDiag = (raw: string | null): string[] => {
  try { const v = JSON.parse(raw || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
};
export const ageOf = (p: { ngaySinh?: Date | string | null; namSinh?: number | null }) => {
  if (p.ngaySinh) return new Date().getFullYear() - new Date(p.ngaySinh).getFullYear();
  return p.namSinh ? new Date().getFullYear() - p.namSinh : 0;
};
/**
 * Tên tư vấn viên của hồ sơ: ưu tiên ô "Nhân viên tư vấn" trên phiếu khám; trống thì lấy tài khoản
 * đã phân nhóm A/B ở màn Tư vấn (tuVanVienMa) — cùng quy tắc với cột Google Sheet.
 */
export const tenTuVanVien = (h: { nhanVienTuVan?: string | null; tuVanVien?: { hoTen?: string | null } | null }) =>
  (h.nhanVienTuVan?.trim() || h.tuVanVien?.hoTen?.trim() || "").replace(/\s+/g, " ");
/** Giá trị lọc "chưa ghi nhận tư vấn viên" cho báo cáo chi tiết. */
export const TVV_TRONG = "__none__";
/** Ngày sinh đầy đủ dd/mm/yyyy; dữ liệu lịch sử chỉ có năm sinh thì trả về năm. */
export const fmtNgaySinh = (p: { ngaySinh?: Date | string | null; namSinh?: number | null }) => {
  if (p.ngaySinh) {
    return new Date(p.ngaySinh).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  return p.namSinh ? String(p.namSinh) : "";
};
/** "NS 12/03/1948 (78 tuổi)" — hiện đủ ngày sinh lẫn tuổi để phân biệt BN trùng tên, trùng năm sinh. */
export const fmtSinhTuoi = (p: { ngaySinh?: Date | string | null; namSinh?: number | null }) => {
  const ns = fmtNgaySinh(p);
  if (!ns) return "";
  const age = ageOf(p);
  return age > 0 ? `NS ${ns} (${age} tuổi)` : `NS ${ns}`;
};
export const tomorrowISO = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
export const fmtDate = (iso?: Date | string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");

/** Tách chuỗi danh sách bác sĩ thành mảng các tên bác sĩ */
export function parseDoctorList(raw?: string | null): string[] {
  if (!raw) return [];
  const clean = raw.trim();
  if (!clean) return [];
  if (clean.startsWith("[") && clean.endsWith("]")) {
    try {
      const arr = JSON.parse(clean);
      if (Array.isArray(arr)) return arr.map((s) => String(s).trim()).filter(Boolean);
    } catch {}
  }
  return clean.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
}

/** Ghép mảng các tên bác sĩ thành chuỗi phân tách bằng dấu phẩy */
export function formatDoctorList(list: string[]): string {
  return list.filter(Boolean).join(", ");
}

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
  // Địa điểm khám là tên chính của đợt. Ghi chú chỉ dùng khi thiếu địa điểm — nhiều cơ sở ghi danh
  // sách thành viên đoàn vào ghi chú, đưa lên làm tên thì không nhận ra đợt ở đâu.
  if (diaDiem && diaDiem.toLowerCase() !== "test" && diaDiem !== xa) return diaDiem;
  if (xa) return `BV - Xã ${xa}`;
  if (ghiChu && ghiChu.toLowerCase() !== "test") return ghiChu;
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
  "Xã", "Điểm xã", "Ngày khám", "Mã định danh", "Họ tên bệnh nhân", "Năm sinh", "Tuổi",
  "Giới tính", "Số điện thoại", "BHYT", "Có bệnh lý",
  "Đục thủy tinh thể", "Mộng", "Khác", "Chi tiết chẩn đoán",
  "Bác sỹ khám", "Nhân viên tư vấn", "Xác nhận điều trị", "Ngày điều trị dự kiến",
  "Ngày đến BV", "Ngày mổ thực tế", "Trạng thái điều trị", "Thực thu HIS", "Mã BN HIS", "Ghi chú",
  "Mã BN", // cột kỹ thuật — khoá upsert Google Sheet, kế toán có thể ẩn
] as const;

const toISO = (d?: Date | string | null) => (d ? (typeof d === "string" ? d : d.toISOString()) : null);
// Tên nhân viên: ưu tiên tên từ quan hệ; admin là tài khoản tích hợp (không nằm trong bảng NV).
const staffName = (rel?: { hoTen: string } | null, ma?: string | null) =>
  rel?.hoTen || (ma === "admin" ? "Quản trị hệ thống" : ma || "");
const YN = (b: boolean) => (b ? "YES" : "NO");

export interface HoSoExport {
  maBN: string; maBNHIS?: string | null; stt: number; hoTen: string; namSinh: number | null; ngaySinh?: Date | string | null; gioiTinh: string;
  cccd?: string | null; sdt: string | null; sdtNguoiNha?: string | null;
  diaChi?: string | null; khuPho?: string | null; xaPhuong?: string | null;
  benhSu?: boolean | null; loaiBenhSu?: string | null; loaiBenhSuKhac?: string | null;
  chieuCao?: string | null; canNang?: string | null;
  thiLucMP?: string | null; thiLucMT?: string | null; doKinhMP?: string | null; doKinhMT?: string | null;
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
  daDon?: boolean | null;
  ngayDenBV?: Date | string | null;
  ngayMoThucTe?: Date | string | null;
  trangThaiDieuTri?: string | null;
  soTienThucThu?: number | null;
  ghiChuMat2?: string | null;
  ghiChuTuVan?: string | null;
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

  const age = ageOf(h) || (h.namSinh ? new Date().getFullYear() - h.namSinh : "");

  const actualNgayMo = h.ngayMoThucTe ? fmtDate(toISO(h.ngayMoThucTe)) : "";
  const actualNgayDen = h.ngayDenBV
    ? fmtDate(toISO(h.ngayDenBV))
    : actualNgayMo
    ? actualNgayMo
    : h.daDon
    ? fmtDate(toISO(new Date()))
    : "";

  const soTienStr = h.soTienThucThu != null && Number(h.soTienThucThu) > 0
    ? new Intl.NumberFormat("vi-VN").format(Number(h.soTienThucThu)) + " VNĐ"
    : "";

  const ghiChuStr = [h.ghiChuTuVan, h.ghiChuMat2].filter(Boolean).join(" | ");

  const maHisMatch = ghiChuStr.match(/(?:Mã HIS:\s*|maHIS:\s*)([A-Za-z0-9.]+)/i);
  const maBNHIS = h.maBNHIS || (maHisMatch ? maHisMatch[1] : "");

  return [
    h.buoiKham?.xa ?? "",                              // 1  Xã
    h.diemKham || h.buoiKham?.diaDiem || "",           // 2  Điểm xã
    fmtDate(toISO(h.buoiKham?.ngayKham)),              // 3  Ngày khám
    h.cccd || "",                                      // 4  Mã định danh
    h.hoTen,                                           // 5  Họ tên bệnh nhân
    h.namSinh || (h.ngaySinh ? new Date(h.ngaySinh).getFullYear() : "") || "", // 6  Năm sinh
    age || "",                                         // 7  Tuổi
    h.gioiTinh,                                        // 8  Giới tính
    phone(h.sdt),                                      // 9  Số điện thoại
    mucHuong ?? "",                                    // 10 BHYT (%)
    coBenhLy ? "CÓ" : "KHÔNG",                         // 11 Có bệnh lý
    YN(ducTTT),                                        // 12 Đục thủy tinh thể
    YN(mong),                                          // 13 Mộng
    YN(khac),                                          // 14 Khác
    detail,                                            // 15 Chi tiết chẩn đoán
    h.bacSiChiDinh || h.buoiKham?.bacSiKham || "",      // 16 Bác sỹ khám
    h.nhanVienTuVan || staffName(h.tuVanVien, h.tuVanVienMa), // 17 Nhân viên tư vấn
    xacNhan,                                           // 18 Xác nhận điều trị
    h.ngayDieuTri ? fmtDate(toISO(h.ngayDieuTri)) : "", // 19 Ngày điều trị dự kiến
    actualNgayDen,                                     // 20 Ngày đến BV
    actualNgayMo,                                      // 21 Ngày mổ thực tế
    h.trangThaiDieuTri || "",                          // 22 Trạng thái điều trị
    soTienStr,                                         // 23 Thực thu HIS
    maBNHIS,                                           // 24 Mã BN HIS
    ghiChuStr,                                         // 25 Ghi chú
    h.maBN,                                            // 26 Mã BN (khoá)
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

  // Chỗ ở hiện tại: Chỉ lấy thông tin địa chỉ thực tế của bệnh nhân
  const choO = h.diaChi || [h.khuPho, h.xaPhuong].filter(Boolean).join(", ") || "";

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
  DaMoTruocDay: { label: "Mổ trước đây",    cls: "bg-purple-50 text-purple-700 border-purple-300" },
  DaDenTruocDay: { label: "Đến trước đây",  cls: "bg-indigo-50 text-indigo-700 border-indigo-300" },
  HuyKhongDen: { label: "Hủy / Không đến", cls: "bg-[var(--rose-soft)] text-[var(--rose)] border-[var(--rose)]" },
};
export const statusOf = (t?: string | null) =>
  STATUS[t || ""] || { label: t || "—", cls: "bg-[var(--surface-hover)] text-[var(--mute)] border-[var(--line)]" };

export interface HoSo {
  id: string; maBN: string; maBNHIS?: string | null; stt: number; buoiKhamId?: string; coSoId?: string; hoTen: string; gioiTinh: string;
  ngaySinh: string | null; namSinh: number | null; cccd: string | null; diaChi: string | null;
  sdt: string | null; sdtNguoiNha: string | null;
  thiLucMP: string | null; thiLucMT: string | null; doKinhMP?: string | null; doKinhMT?: string | null;
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
  daDon?: boolean; ngayDenBV?: string | null; ngayMoThucTe?: string | null; soTienThucThu?: number | null;
  trangThaiDieuTri?: string | null; ngayTaiKham?: string | null; ghiChuMat2?: string | null;
  ghiChuTuVan?: string | null;
  isPhaco2Lan?: boolean;
  trangThai: string;
  tuVanVien?: { maNV: string; hoTen: string } | null;
  buoiKham?: { xa: string; diaDiem: string; ngayKham: string } | null;
  nhatKy?: { id: string; ngay: string; noiDung: string; nguoiGoi?: { hoTen: string } | null }[];
  createdAt?: string | null;
  updatedAt?: string | null; updatedBy?: string | null;
}

/**
 * Chuẩn hóa tên điểm đón / trạm y tế (loại bỏ hậu tố - Đoàn 1, [Đoàn 2], [Đoàn 3]...)
 */
export function cleanDiemDon(diemDon?: string | null): string {
  if (!diemDon) return "Chưa xác định điểm đón";
  return (
    diemDon
      .replace(/\s*[-–—(]\s*(?:đoàn|doan)\s*\d+\s*\)?/gi, "")
      .replace(/\s*\[\s*(?:đoàn|doan)\s*\d+\s*\]/gi, "")
      .trim() || "Chưa xác định điểm đón"
  );
}

/**
 * Phân tích bệnh nhân thuộc Đoàn mấy (Đoàn 1, Đoàn 2, Đoàn 3,... linh động, mặc định 1)
 */
/** Loại xe đón (số chỗ, tính cả ghế tài xế). */
export const LOAI_XE = [4, 7, 16, 29, 35, 45] as const;
/** Đoàn chưa chọn xe được coi là xe 16 chỗ. */
export const XE_MAC_DINH = 16;

/** Một ô trên sơ đồ ghế: số ghế khách (1…n), ghế tài xế, hoặc khoảng trống (lối đi / cần số). */
export type OGhe = number | "taiXe" | null;

/**
 * Sơ đồ ghế của xe `soCho` chỗ (nhìn từ trên, đầu xe ở trên, tài xế bên trái).
 * Hàng đầu: tài xế + 1 ghế (xe ≤ 7 chỗ) hoặc 2 ghế phụ. Các hàng sau: xe ≤ 7 chỗ 3 ghế liền,
 * xe 16 chỗ 2 + lối đi + 1, xe ≥ 29 chỗ 2 + lối đi + 2; hàng cuối dư 1 ghế thì thành băng ghế liền.
 */
export function soDoGhe(soCho: number): { hang: OGhe[][]; soGheKhach: number } {
  const soGheKhach = Math.max(0, soCho - 1);
  const xeNho = soCho <= 7;
  const cot = xeNho ? 3 : soCho <= 16 ? 4 : 5;
  const loiDi = xeNho ? -1 : 2; // vị trí cột lối đi
  const gheMoiHang = loiDi >= 0 ? cot - 1 : cot;

  const hang: OGhe[][] = [];
  let so = 0;
  const truoc = Math.min(xeNho ? 1 : 2, soGheKhach);
  const dau: OGhe[] = Array(cot).fill(null);
  dau[0] = "taiXe";
  for (let i = 0; i < truoc; i++) dau[cot - truoc + i] = ++so;
  hang.push(dau);

  while (so < soGheKhach) {
    const conLai = soGheKhach - so;
    const row: OGhe[] = Array(cot).fill(null);
    if (loiDi >= 0 && conLai === gheMoiHang + 1) {
      for (let c = 0; c < cot; c++) row[c] = ++so; // băng ghế cuối
    } else {
      const n = Math.min(gheMoiHang, conLai);
      let dat = 0;
      for (let c = 0; c < cot && dat < n; c++) {
        if (c === loiDi) continue;
        row[c] = ++so;
        dat++;
      }
    }
    hang.push(row);
  }
  return { hang, soGheKhach };
}

export function parseDoanXe(p?: {
  ghiChuTuVan?: string | null;
  diemDon?: string | null;
  gioDon?: string | null;
} | null): number {
  if (!p) return 1;
  const note = p.ghiChuTuVan || "";
  const diem = p.diemDon || "";
  const combined = `${note} ${diem}`;

  // 1. Kiểm tra tag chuẩn [Đoàn X] hoặc [Doan X]
  const tagMatch = combined.match(/\[\s*(?:đoàn|doan)\s*(\d+)\s*\]/i);
  if (tagMatch) {
    const num = parseInt(tagMatch[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // 2. Kiểm tra từ khóa "Đoàn X" hoặc "Doan X"
  const wordMatch = combined.match(/(?:đoàn|doan)\s*(\d+)/i);
  if (wordMatch) {
    const num = parseInt(wordMatch[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }

  return 1;
}

/**
 * Xóa tag [Đoàn X] khỏi ghi chú tư vấn để hiển thị sạch
 */
export function stripDoanXeTag(ghiChu?: string | null): string {
  if (!ghiChu) return "";
  return ghiChu
    .replace(/\[\s*(?:đoàn|doan)\s*\d+\s*\]/gi, "")
    .trim();
}

/**
 * Định dạng ghi chú kèm tag [Đoàn X]
 */
export function formatGhiChuWithDoanXe(
  existingGhiChu: string | null | undefined,
  targetDoan: number
): string {
  const stripped = stripDoanXeTag(existingGhiChu);
  const tag = `[Đoàn ${targetDoan}]`;
  return stripped ? `${tag} ${stripped}` : tag;
}

/**
 * Đề xuất giờ đón kế tiếp cho Đoàn tiếp theo (ví dụ 05:15 -> 06:15 / 06:30)
 */
export function suggestNextTime(timeStr?: string | null, stepMinutes = 60): string {
  if (!timeStr || !timeStr.includes(":")) return "06:30";
  const [hStr, mStr] = timeStr.trim().split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return "06:30";
  let totalMin = h * 60 + m + stepMinutes;
  totalMin = Math.round(totalMin / 15) * 15;
  const nextH = Math.floor(totalMin / 60) % 24;
  const nextM = totalMin % 60;
  return `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`;
}

/**
 * Bảng màu đồng nhất cho các Đoàn xe (Đoàn 1, 2, 3, 4, 5...)
 */
export function getDoanColor(doan: number): {
  bg: string;
  text: string;
  border: string;
  activeBg: string;
  ring: string;
  badge: string;
} {
  switch (doan) {
    case 1:
      return {
        bg: "bg-blue-50 text-blue-800",
        text: "text-blue-700",
        border: "border-blue-200",
        activeBg: "bg-blue-600 text-white",
        ring: "ring-blue-300",
        badge: "bg-blue-100 text-blue-800 border-blue-200",
      };
    case 2:
      return {
        bg: "bg-purple-50 text-purple-800",
        text: "text-purple-700",
        border: "border-purple-200",
        activeBg: "bg-purple-600 text-white",
        ring: "ring-purple-300",
        badge: "bg-purple-100 text-purple-800 border-purple-200",
      };
    case 3:
      return {
        bg: "bg-amber-50 text-amber-900",
        text: "text-amber-700",
        border: "border-amber-200",
        activeBg: "bg-amber-600 text-white",
        ring: "ring-amber-300",
        badge: "bg-amber-100 text-amber-900 border-amber-200",
      };
    case 4:
      return {
        bg: "bg-emerald-50 text-emerald-900",
        text: "text-emerald-700",
        border: "border-emerald-200",
        activeBg: "bg-emerald-600 text-white",
        ring: "ring-emerald-300",
        badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
      };
    case 5:
      return {
        bg: "bg-rose-50 text-rose-900",
        text: "text-rose-700",
        border: "border-rose-200",
        activeBg: "bg-rose-600 text-white",
        ring: "ring-rose-300",
        badge: "bg-rose-100 text-rose-900 border-rose-200",
      };
    default: {
      const palette = [
        { bg: "bg-cyan-50 text-cyan-900", text: "text-cyan-700", border: "border-cyan-200", activeBg: "bg-cyan-600 text-white", ring: "ring-cyan-300", badge: "bg-cyan-100 text-cyan-900 border-cyan-200" },
        { bg: "bg-indigo-50 text-indigo-900", text: "text-indigo-700", border: "border-indigo-200", activeBg: "bg-indigo-600 text-white", ring: "ring-indigo-300", badge: "bg-indigo-100 text-indigo-900 border-indigo-200" },
        { bg: "bg-teal-50 text-teal-900", text: "text-teal-700", border: "border-teal-200", activeBg: "bg-teal-600 text-white", ring: "ring-teal-300", badge: "bg-teal-100 text-teal-900 border-teal-200" },
        { bg: "bg-orange-50 text-orange-900", text: "text-orange-700", border: "border-orange-200", activeBg: "bg-orange-600 text-white", ring: "ring-orange-300", badge: "bg-orange-100 text-orange-900 border-orange-200" },
      ];
      return palette[(doan - 6) % palette.length];
    }
  }
}

export interface ThongTinNguoiNha {
  hasNguoiNha: boolean;
  coDiCung: boolean;
  soLuongDiCung: number;
  sdt: string;
  tenQuanHe: string;
  raw: string;
  displayLabel: string;
}

/**
 * Trích xuất thông tin người nhà đi kèm từ sdtNguoiNha và ghiChuTuVan
 */
export function parseThongTinNguoiNha(
  sdtNguoiNha?: string | null,
  ghiChuTuVan?: string | null
): ThongTinNguoiNha {
  const raw = (sdtNguoiNha || "").trim();
  const rawLower = raw.toLowerCase();
  const ghiChuLower = (ghiChuTuVan || "").toLowerCase();

  const isDefault =
    rawLower === "" ||
    rawLower === "0" ||
    rawLower.includes("chưa cung cấp") ||
    rawLower.includes("không có") ||
    rawLower.includes("chưa có");

  const combined = `${rawLower} ${ghiChuLower}`;

  const hasKeywordDiCung =
    combined.includes("đi kèm") ||
    combined.includes("đi cùng") ||
    combined.includes("đi với") ||
    combined.includes("kèm người") ||
    combined.includes("người nhà đi") ||
    combined.includes("người đi cùng") ||
    combined.includes("người đi kèm");

  const coDiCung = hasKeywordDiCung || (!isDefault && raw !== "");

  const countMatch = combined.match(/(\d+)\s*(?:người|chỗ)/i);
  const soLuongDiCung = coDiCung ? (countMatch ? parseInt(countMatch[1], 10) : 1) : 0;

  const phoneMatch = raw.match(/(0\d{8,10})/);
  const sdt = phoneMatch ? phoneMatch[1] : "";

  let tenQuanHe = raw
    .replace(/(0\d{8,10})/, "")
    .replace(/\(?\d+\s*người(?:\s*nhà)?(?:\s*đi\s*(?:kèm|cùng))?\)?/gi, "")
    .replace(/đi\s*(?:kèm|cùng|với)\s*(?:xe)?/gi, "")
    .replace(/người nhà\s*:/gi, "")
    .replace(/người nhà/gi, "")
    .replace(/[-–—():]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (isDefault) {
    tenQuanHe = "";
  } else if (!tenQuanHe && !sdt && raw) {
    tenQuanHe = raw;
  }

  const hasNguoiNha = (!isDefault && raw !== "") || (coDiCung && soLuongDiCung > 0);

  let displayLabel = "";
  if (hasNguoiNha) {
    const parts: string[] = [];
    if (coDiCung) {
      parts.push(`${soLuongDiCung} người đi kèm`);
    }
    if (tenQuanHe) {
      parts.push(tenQuanHe);
    }
    displayLabel = parts.join(" · ") || (sdt ? `Người nhà: ${sdt}` : "Có người nhà");
  }

  return {
    hasNguoiNha,
    coDiCung,
    soLuongDiCung,
    sdt,
    tenQuanHe,
    raw,
    displayLabel,
  };
}

/**
 * Đóng gói chuỗi thông tin người nhà để lưu vào trường sdtNguoiNha
 */
export function formatThongTinNguoiNha(
  coDiCung: boolean,
  soLuong: number,
  tenQuanHe?: string | null,
  sdt?: string | null
): string | null {
  const cleanPhone = (sdt || "").trim();
  const cleanRel = (tenQuanHe || "").trim();
  if (coDiCung) {
    const qty = Math.max(1, soLuong || 1);
    const label = `${qty} người nhà đi kèm${cleanRel ? ` - ${cleanRel}` : ""}`;
    if (cleanPhone) return `${cleanPhone} (${label})`;
    return label;
  }
  if (cleanPhone || cleanRel) {
    if (cleanPhone && cleanRel) return `${cleanPhone} (${cleanRel})`;
    return cleanPhone || cleanRel;
  }
  return null;
}



