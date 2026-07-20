// Registry trường của Phiếu khám sàng lọc bệnh lý nhãn khoa (≥18 tuổi).
// Thuần TS, không import React — dùng chung cho màn Khám, Quản trị và API.
// Nguồn: bảng khai báo 24 trường (Excel). Trường `alwaysOn` = BẮT BUỘC, không tắt được.

export const BENH_SU_OPTIONS = [
  "Tăng huyết áp", "Đái tháo đường", "Phổi tắc nghẽn mạn tính", "Hen phế quản",
  "Ung thư", "Suy tim", "Thoái hóa khớp", "Bệnh thận mạn", "Nhồi máu cơ tim",
  "Đột quỵ", "Trầm cảm", "Rối loạn lo âu", "Sa sút trí tuệ",
] as const;

export const BENH_LY_OPTIONS = ["Chưa phát hiện bất thường", "Nghi ngờ bệnh lý"] as const;

// 16 mã ICD + "Khác" (ghi chú)
export const LOAI_BENH_LY_OPTIONS = [
  "H15 - Bệnh của củng mạc",
  "H16 - Viêm giác mạc",
  "H17 - Sẹo và đục giác mạc",
  "H18 - Bệnh khác của giác mạc",
  "H19 - Bệnh củng mạc và giác mạc trong các phân loại nơi khác",
  "H20 - Viêm mống mắt thể mi",
  "H21 - Bệnh khác của mống mắt và thể mi",
  "H22 - Bệnh của mống mắt và thể mi trong bệnh phân loại nơi khác",
  "H25 - Đục thủy tinh thể chưa phẫu thuật",
  "H35.3 - Thoái hóa hoàng điểm và vùng cực sau",
  "H36.0 - Bệnh võng mạc đái tháo đường",
  "H40 - Glôcôm",
  "H46 - Viêm thị thần kinh",
  "H52 - Tật khúc xạ",
  "H53.2 - Song thị",
  "H53.5 - Rối loạn sắc giác",
  "Khác",
] as const;

export const HUONG_XU_TRI = ["Theo dõi", "Phẫu thuật", "Điều trị khác"] as const;

export const MUC_HUONG_BHYT = [100, 95, 80] as const;

/** "Hướng xử trí" → `khuyenNghi` (giữ nguyên luồng Tư vấn / Theo dõi / Báo cáo). */
export const huongXuTriToKhuyenNghi = (v?: string | null): string | null =>
  !v ? null : v === "Phẫu thuật" ? "Phẫu thuật" : "Theo dõi";

export type FieldType = "text" | "date" | "number" | "select" | "multiselect" | "boolean" | "readonly";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  /** Bắt buộc nhập */
  required?: boolean;
  /** Luôn bật — không cho tắt trong cài đặt cơ sở */
  alwaysOn?: boolean;
  hint?: string;
  options?: readonly string[];
}

export interface FieldGroup {
  key: string;
  title: string;
  fields: FieldDef[];
}

export const FIELD_GROUPS: FieldGroup[] = [
  {
    key: "hanhChinh",
    title: "Thông tin hành chính",
    fields: [
      { key: "cccd", label: "Mã số định danh (CCCD/CMND)", type: "text", required: true, alwaysOn: true },
      { key: "hoTen", label: "Họ tên", type: "text", required: true, alwaysOn: true },
      { key: "gioiTinh", label: "Giới tính", type: "select", required: true, alwaysOn: true, options: ["Nam", "Nữ"] },
      { key: "ngaySinh", label: "Ngày sinh", type: "date", required: true, alwaysOn: true, hint: "Đầy đủ dd/mm/yyyy; nếu chỉ có năm sinh thì lấy ngày 01/01" },
      { key: "bhyt", label: "Số thẻ BHYT", type: "text", hint: "Nếu không có thì bỏ trống" },
      { key: "mucHuongBHYT", label: "Mức hưởng BHYT", type: "number", required: true, alwaysOn: true, hint: "% hưởng: 100 / 95 / 80" },
      { key: "diaChi", label: "Chỗ ở hiện nay", type: "text", hint: "Địa chỉ tạm trú (nơi ở thực tế)" },
      { key: "khuPho", label: "Khu phố (Ấp)", type: "text" },
      { key: "xaPhuong", label: "Xã/Phường (nơi ở)", type: "text" },
      { key: "sdt", label: "Số điện thoại", type: "text", required: true, alwaysOn: true, hint: "Bệnh nhân / người nhà / hàng xóm" },
    ],
  },
  {
    key: "benhSu",
    title: "Bệnh sử của bản thân",
    fields: [
      { key: "benhSu", label: "Bệnh sử", type: "boolean", hint: "CÓ / KHÔNG" },
      { key: "loaiBenhSu", label: "Loại bệnh sử", type: "multiselect", options: BENH_SU_OPTIONS },
    ],
  },
  {
    key: "dauHieu",
    title: "Dấu hiệu",
    fields: [
      { key: "chieuCao", label: "Chiều cao (cm)", type: "text" },
      { key: "canNang", label: "Cân nặng (kg)", type: "text", hint: "Không lấy số thập phân" },
    ],
  },
  {
    key: "ketLuan",
    title: "Kết luận ban đầu",
    fields: [
      { key: "benhLy", label: "Bệnh lý", type: "select", options: BENH_LY_OPTIONS },
      { key: "loaiBenhLy", label: "Loại bệnh lý", type: "multiselect", required: true, options: LOAI_BENH_LY_OPTIONS, hint: "Bắt buộc khi Bệnh lý = Nghi ngờ bệnh lý" },
      { key: "huongXuTri", label: "Hướng xử trí", type: "select", required: true, options: HUONG_XU_TRI },
    ],
  },
  {
    key: "doanKham",
    title: "Thông tin đoàn khám",
    fields: [
      { key: "bacSiChiDinh", label: "Bác sỹ cho chỉ định", type: "readonly", required: true, hint: "Tự lấy từ đợt khám (nhập 1 lần khi tổ chức đợt)" },
      { key: "nhanVienTuVan", label: "Nhân viên tư vấn", type: "text", required: true },
      { key: "xacNhanDieuTri", label: "Xác nhận điều trị", type: "boolean", required: true, hint: "CÓ / KHÔNG — bắt buộc ghi lý do nếu KHÔNG" },
      { key: "ngayDieuTri", label: "Ngày điều trị dự kiến", type: "date", required: true, alwaysOn: true, hint: "Nhập ở màn Tư vấn & phân nhóm (BR-04)" },
      { key: "ngayKham", label: "Ngày khám", type: "readonly", alwaysOn: true, hint: "Tự lấy từ đợt khám" },
      { key: "diemKham", label: "Điểm khám", type: "readonly", required: true, hint: "Tự lấy từ Địa điểm của đợt khám (1 xã nhiều điểm → tạo nhiều đợt)" },
      { key: "xa", label: "Xã thực hiện khám", type: "readonly", alwaysOn: true, hint: "Tự lấy từ đợt khám" },
    ],
  },
  {
    key: "lamSang",
    title: "Lâm sàng (bộ cũ)",
    fields: [
      { key: "thiLuc", label: "Đo thị lực (MP / MT)", type: "select" },
      { key: "chanDoan", label: "Chẩn đoán (Đục thủy tinh thể, Mộng…)", type: "multiselect" },
      { key: "khuyenNghi", label: "Khuyến nghị (Phẫu thuật / Theo dõi)", type: "select" },
    ],
  },
];

/** Tra nhanh FieldDef theo key. */
export const FIELD_BY_KEY: Record<string, FieldDef> = Object.fromEntries(
  FIELD_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f]))
);

export type FieldConfig = Record<string, boolean>;

/** Đọc JSON cấu hình của cơ sở. Thiếu key ⇒ mặc định BẬT. */
export function parseFieldConfig(raw?: string | null): FieldConfig {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as FieldConfig) : {};
  } catch {
    return {};
  }
}

/** Trường có đang bật cho cơ sở này không? Trường `alwaysOn` luôn bật. */
export function isFieldOn(cfg: FieldConfig, key: string): boolean {
  if (FIELD_BY_KEY[key]?.alwaysOn) return true;
  return cfg[key] !== false;
}
