// BR-08: suy trạng thái hồ sơ từ dữ liệu đã nhập (SRS §8). Hàm thuần.

interface Patch {
  chanDoan?: unknown;
  khuyenNghi?: string | null;
  nhom?: string | null;
  ngayDieuTri?: string | Date | null;
  soTienBao?: number | null;
  daNhacLich?: boolean; // cờ kích hoạt "Đã nhắc lịch" (không lưu vào DB)
  daDon?: boolean;
  ngayMoThucTe?: string | Date | null;
  trangThaiDieuTri?: string | null;
  trangThai?: string;
}

// Khử dấu + chuẩn hoá để so khớp ổn định bất kể NFC/NFD (tiếng Việt).
const fold = (s?: string | null) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const hasDiag = (v: unknown) => {
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") { try { const a = JSON.parse(v); return Array.isArray(a) && a.length > 0; } catch { return v !== "" && v !== "[]"; } }
  return false;
};

export function inferNextState(current: string, p: Patch): string {
  const kn = fold(p.khuyenNghi);            // "phau thuat" | "theo doi" | ""
  const ttdt = fold(p.trangThaiDieuTri);    // "da mo" | "huy" | "khong den"

  // Lâm sàng
  if (current === "TiepNhan" || current === "DaKham") {
    if (kn === "phau thuat") {
      if (p.ngayDieuTri) return "NhomA";          // tư vấn cùng lúc → chốt mổ
      if (p.nhom === "B" || p.soTienBao != null) return "NhomB";
      return "CoChiDinhMo";
    }
    if (kn === "theo doi") return "TheoDoi";
    if (hasDiag(p.chanDoan)) return "DaKham";     // có chẩn đoán, chưa khuyến nghị
  }

  // Tư vấn & phân nhóm
  if (current === "CoChiDinhMo" || current === "NhomB") {
    if (p.ngayDieuTri) return "NhomA";            // BR-04
    if (p.nhom === "B" || p.soTienBao != null) return "NhomB";
  }

  // Điều trị tại BV
  if (current === "NhomA" || current === "DaNhacLich" || current === "DaDonVien" || current === "DaMoHauPhau") {
    if (ttdt === "huy" || ttdt === "khong den") return "HuyKhongDen";
    if (p.ngayMoThucTe || ttdt === "da mo") return "DaMoHauPhau";
    if (p.daDon === true) return "DaDonVien";
    if (p.daNhacLich === true && current === "NhomA") return "DaNhacLich"; // nhắc lịch mổ
  }

  return p.trangThai || current;
}
