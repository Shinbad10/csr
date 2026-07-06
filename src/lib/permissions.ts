/**
 * RBAC — nguồn chân lý duy nhất cho 4 vai trò VISI (SRS §3).
 * Module thuần (không import next/*) → dùng được ở cả client lẫn route handler.
 * Server không bao giờ tin client: mọi mutation đều gọi can() trong handler.
 */

export type Role = "CSKH" | "TuVanVien" | "KeToan" | "QuanLy";

export type Capability =
  | "buoikham.manage" // tạo / quản lý buổi khám
  | "hoso.create" // tiếp nhận bệnh nhân
  | "hoso.clinical" // lâm sàng + tư vấn, phân nhóm A/B
  | "hoso.treatment" // cập nhật điều trị tại BV
  | "hoso.followup" // theo dõi nhóm B, nhắc lịch
  | "report.export" // xuất Excel + thống kê
  | "admin.masterdata"; // quản trị cơ sở / tài khoản

const MATRIX: Record<Role, Capability[]> = {
  CSKH: ["buoikham.manage", "hoso.create", "hoso.treatment", "hoso.followup"],
  TuVanVien: ["hoso.clinical", "hoso.followup"],
  KeToan: ["report.export"],
  QuanLy: [
    "buoikham.manage", "hoso.create", "hoso.clinical", "hoso.treatment",
    "hoso.followup", "report.export", "admin.masterdata",
  ],
};

export function normalizeRole(raw?: string | null): Role {
  switch (raw) {
    case "QuanLy":
    case "Admin":
      return "QuanLy";
    case "TuVanVien":
    case "BacSi":
      return "TuVanVien";
    case "KeToan":
      return "KeToan";
    case "CSKH":
      return "CSKH";
    default:
      return "CSKH";
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
  CSKH: "CSKH",
  TuVanVien: "Tư vấn viên",
  KeToan: "Kế toán",
  QuanLy: "Quản lý",
};

export function roleLabel(raw?: string | null): string {
  return ROLE_LABEL[normalizeRole(raw)];
}
