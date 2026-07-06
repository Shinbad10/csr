import { getPrisma } from "./prisma";

// BR-14: ghi nhật ký kiểm toán cho master data + sửa hồ sơ.
export async function audit(
  nguoiDung: string,
  bang: string,
  banGhiId: string,
  hanhDong: "them" | "sua" | "xoa" | "ngung_hoat_dong",
  thayDoi: unknown
) {
  try {
    await getPrisma().auditLog.create({
      data: { bang, banGhiId, hanhDong, nguoiDung, thayDoi: JSON.stringify(thayDoi ?? {}) },
    });
  } catch (e) {
    console.error("[audit] ghi log thất bại:", e);
  }
}
