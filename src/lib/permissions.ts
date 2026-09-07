/**
 * RBAC — nguồn chân lý duy nhất cho 4 vai trò VISI (SRS §3).
 * Module thuần (không import next/*) → dùng được ở cả client lẫn route handler.
 * Server không bao giờ tin client: mọi mutation đều gọi can() trong handler.
 */

export type Role = "MKT" | "TuVanVien" | "KeToan" | "HCNS" | "QuanLy" | "IT";

export type Capability =
  | "buoikham.view" // xem danh sách đợt khám
  | "buoikham.manage" // tạo / quản lý buổi khám
  | "tamsoat.view" // xem danh sách tầm soát
  | "hoso.create" // tiếp nhận bệnh nhân
  | "hoso.clinical" // lâm sàng + tư vấn, phân nhóm A/B
  | "hoso.treatment" // cập nhật điều trị tại BV
  | "hoso.followup" // theo dõi nhóm B, nhắc lịch
  | "report.export" // xuất Excel + thống kê
  | "admin.users" // quản lý tài khoản cơ sở / đơn vị
  | "admin.masterdata"; // quản trị cơ sở / toàn hệ thống

const MATRIX: Record<Role, Capability[]> = {
  MKT: [
    "buoikham.view",
    "buoikham.manage",
    "tamsoat.view",
    "hoso.create",
    "hoso.clinical",
    "hoso.treatment",
    "hoso.followup",
    "report.export",
  ],
  TuVanVien: [
    "buoikham.view",
    "buoikham.manage",
    "tamsoat.view",
    "hoso.create",
    "hoso.clinical",
    "hoso.treatment",
    "hoso.followup",
    "report.export",
  ],
  KeToan: [
    "buoikham.view",
    "report.export",
  ],
  HCNS: [
    "buoikham.view",
    "tamsoat.view",
    "report.export",
  ],
  IT: [
    "buoikham.view",
    "buoikham.manage",
    "tamsoat.view",
    "hoso.create",
    "hoso.clinical",
    "hoso.treatment",
    "hoso.followup",
    "report.export",
    "admin.users",
  ],
  QuanLy: [
    "buoikham.view",
    "buoikham.manage",
    "tamsoat.view",
    "hoso.create",
    "hoso.clinical",
    "hoso.treatment",
    "hoso.followup",
    "report.export",
    "admin.users",
    "admin.masterdata",
  ],
};

export function normalizeRole(raw?: string | null): Role {
  switch (raw) {
    case "QuanLy":
    case "Admin":
      return "QuanLy";
    case "IT":
      return "IT";
    case "TuVanVien":
    case "BacSi":
      return "TuVanVien";
    case "KeToan":
      return "KeToan";
    case "HCNS":
    case "HanhChinh":
    case "HanhChinhNhanSu":
    case "HC-NS":
      return "HCNS";
    case "MKT":
    case "Marketing":
    case "CSKH":
      return "MKT";
    default:
      return "MKT";
  }
}

export function can(role: string | null | undefined, cap: Capability): boolean {
  return MATRIX[normalizeRole(role)].includes(cap);
}

export function canAny(role: string | null | undefined, caps: Capability[]): boolean {
  return caps.some((c) => can(role, c));
}

export function isCorporate(role: string | null | undefined): boolean {
  return normalizeRole(role) === "QuanLy";
}

export const ROLE_LABEL: Record<Role, string> = {
  MKT: "Marketing (MKT)",
  TuVanVien: "Tư vấn viên",
  KeToan: "Kế toán",
  HCNS: "Hành chính Nhân sự (HCNS)",
  QuanLy: "Quản lý (Toàn hệ thống)",
  IT: "Quản trị viên IT (Đơn vị)",
};

export function roleLabel(raw?: string | null): string {
  if (raw === "BacSi" || raw === "Bác sĩ" || raw === "Bác sỹ") return "Bác sĩ";
  if (raw === "IT") return "Quản trị IT";
  if (raw === "MKT" || raw === "Marketing" || raw === "CSKH") return "MKT";
  if (raw === "HCNS" || raw === "HanhChinh" || raw === "HanhChinhNhanSu" || raw === "HC-NS") return "Hành chính Nhân sự (HCNS)";
  return ROLE_LABEL[normalizeRole(raw)] || raw || "Nhân viên";
}
