/*
  Quan hệ "an toàn" khi trả dữ liệu ra trình duyệt.
  `include: { coSo: true }` gửi kèm thông tin kết nối HIS / cổng BHXH của cơ sở; quan hệ người dùng
  đầy đủ gửi kèm matKhauHash. Mọi API trả JSON cho trình duyệt dùng các select dưới đây thay thế.
*/

/** Cơ sở: chỉ thông tin hiển thị + cấu hình trường phiếu khám. */
export const COSO_AN_TOAN = {
  select: { id: true, ten: true, diaChi: true, trangThai: true, cauHinhTruong: true },
} as const;

/** Người dùng: chỉ định danh & vai trò, không có tên đăng nhập / mật khẩu. */
export const NGUOI_DUNG_AN_TOAN = {
  select: { maNV: true, hoTen: true, vaiTro: true, coSoId: true },
} as const;
