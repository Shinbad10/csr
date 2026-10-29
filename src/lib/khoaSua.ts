/**
 * Khoá sửa dữ liệu khám sau ngày khám.
 * Đợt khám đã qua ngày → chỉ Quản trị viên / Quản lý được sửa thông tin đợt và PHIẾU KHÁM của hồ sơ
 * (hành chính + lâm sàng). Phần tư vấn, xếp xe, người nhà, theo dõi, điều trị vẫn mở cho người có quyền
 * vì các việc này diễn ra SAU ngày khám. Module thuần — dùng chung client & route handler.
 */
import { can } from "./permissions";
import { ngayVN } from "./csr";

/** Đợt khám đã qua ngày (so theo ngày giờ Việt Nam, không phụ thuộc múi giờ máy chủ). */
export function dotDaQuaNgay(ngayKham?: Date | string | null): boolean {
  const nk = ngayVN(ngayKham);
  return !!nk && nk < ngayVN(new Date());
}

/** BuoiKham.trangThai khi Quản trị viên mở khoá đợt đã qua ngày cho người có quyền sửa lại. */
export const DOT_MO_KHOA = "moKhoa";

/** Đợt đang bị khoá sửa: đã qua ngày VÀ chưa được Quản trị viên mở khoá. */
export function dotBiKhoa(bk?: { ngayKham?: Date | string | null; trangThai?: string | null } | null): boolean {
  return !!bk && dotDaQuaNgay(bk.ngayKham) && bk.trangThai !== DOT_MO_KHOA;
}

/** Quản trị viên (IT) và Quản lý toàn hệ thống được sửa dữ liệu khám đã qua ngày. */
export function duocSuaSauNgayKham(role?: string | null): boolean {
  return can(role, "admin.users");
}

export const THONG_BAO_KHOA =
  "Đợt khám đã qua ngày và đang khoá — chỉ Quản trị viên được sửa, hoặc nhờ Quản trị viên mở khoá đợt khám";

/** Trường thuộc phiếu khám (hành chính + lâm sàng) — bị khoá sau ngày khám. */
export const TRUONG_PHIEU_KHAM = [
  "hoTen", "gioiTinh", "ngaySinh", "namSinh", "cccd", "bhyt", "mucHuongBHYT",
  "diaChi", "khuPho", "xaPhuong", "diemKham", "stt",
  "thiLucMP", "thiLucMT", "doKinhMP", "doKinhMT", "matKham",
  "chanDoan", "chanDoanKhac", "chanDoanMP", "chanDoanKhacMP", "chanDoanMT", "chanDoanKhacMT",
  "khuyenNghi", "huongXuTri", "huongXuTriKhac",
  "benhSu", "loaiBenhSu", "loaiBenhSuKhac", "chieuCao", "canNang",
  "benhLy", "loaiBenhLy", "loaiBenhLyKhac", "bacSiChiDinh",
] as const;

/** Chuẩn hoá để so sánh: rỗng → null, mảng → JSON, ngày → YYYY-MM-DD, chuỗi số giữ nguyên. */
export function chuan(v: unknown): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (v instanceof Date) return ngayVN(v);
  if (Array.isArray(v)) return v.length ? JSON.stringify(v) : null;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t || t === "[]") return null;
    if (/^\d{4}-\d{2}-\d{2}(T|$)/.test(t)) return ngayVN(t);
    return t;
  }
  return String(v);
}

/** Trường hệ thống — không ghi vào lịch sử thay đổi. */
const KHONG_GHI_LICH_SU = new Set(["updatedBy", "updatedAt", "createdBy", "createdAt", "id", "coSoId", "buoiKhamId", "syncStatus"]);

/**
 * Giá trị CŨ → MỚI của mọi trường mà `update` thực sự đổi so với bản đang lưu — để ghi nhật ký,
 * giữ lại thông tin cũ cho đối chiếu. Giá trị lưu dạng chuỗi đã chuẩn hoá (null = trống).
 */
export function soSanhCuMoi(
  update: Record<string, unknown>,
  current: Record<string, unknown>
): Record<string, { cu: string | null; moi: string | null }> {
  const out: Record<string, { cu: string | null; moi: string | null }> = {};
  for (const [k, v] of Object.entries(update)) {
    if (KHONG_GHI_LICH_SU.has(k) || v === undefined) continue;
    const cu = chuan(current[k]);
    const moi = chuan(v);
    if (cu !== moi) out[k] = { cu, moi };
  }
  return out;
}

/**
 * Các trường phiếu khám mà `body` thực sự làm thay đổi so với bản đang lưu.
 * Form có thể gửi lại nguyên giá trị cũ — chỉ tính khi khác.
 */
export function truongPhieuKhamBiDoi(body: Record<string, unknown>, current: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const f of TRUONG_PHIEU_KHAM) {
    if (body[f] === undefined) continue;
    let moi = chuan(body[f]);
    let cu = chuan(current[f]);
    if (f === "hoTen") {
      moi = moi?.toUpperCase() ?? null;
      cu = cu?.toUpperCase() ?? null;
    }
    if (moi !== cu) out.push(f);
  }
  return out;
}
