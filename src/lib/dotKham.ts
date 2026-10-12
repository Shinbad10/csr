/*
  Xoá mềm đợt khám (BuoiKham.trangThai = "deleted"): đợt và các hồ sơ bệnh nhân trong đợt bị ẩn khỏi
  mọi danh sách, bảng điều khiển, báo cáo, xuất Excel, đoàn xe… nhưng KHÔNG mất dữ liệu.
  Chỉ Quản lý (toàn hệ thống) và Quản trị viên (IT — trong đơn vị của mình) được xoá.
*/

export const DOT_KHAM_DA_XOA = "deleted";

/** Điều kiện where cho BuoiKham: chỉ đợt chưa bị xoá. */
export const DOT_CON_HIEU_LUC = { trangThai: { not: DOT_KHAM_DA_XOA } };

/** Điều kiện where cho HoSoBenhNhan: chỉ hồ sơ thuộc đợt chưa bị xoá. */
export const HOSO_CUA_DOT_CON_HIEU_LUC = { buoiKham: DOT_CON_HIEU_LUC };
