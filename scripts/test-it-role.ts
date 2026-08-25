import { getPrisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { can, isCorporate, normalizeRole } from "../src/lib/permissions";

async function main() {
  const prisma = getPrisma();

  console.log("=== Testing IT Role Permissions Matrix ===");
  console.log("normalizeRole('IT'):", normalizeRole("IT"));
  console.log("isCorporate('IT'):", isCorporate("IT"));
  console.log("can('IT', 'admin.users'):", can("IT", "admin.users"));
  console.log("can('IT', 'admin.masterdata'):", can("IT", "admin.masterdata"));
  console.log("can('IT', 'buoikham.manage'):", can("IT", "buoikham.manage"));
  console.log("can('IT', 'hoso.clinical'):", can("IT", "hoso.clinical"));
  console.log("can('IT', 'report.export'):", can("IT", "report.export"));

  // Check or upsert test IT user
  const itUser = await prisma.nguoiDungCSR.upsert({
    where: { maNV: "IT-BT-01" },
    update: {
      hoTen: "Quản trị IT Bến Tre",
      vaiTro: "IT",
      coSoId: "BT",
      trangThai: "active",
      matKhauHash: await bcrypt.hash("123456", 10),
    },
    create: {
      maNV: "IT-BT-01",
      hoTen: "Quản trị IT Bến Tre",
      tenDangNhap: "it.bt",
      vaiTro: "IT",
      coSoId: "BT",
      trangThai: "active",
      matKhauHash: await bcrypt.hash("123456", 10),
    },
  });

  console.log("=== Seeded / Verified IT User ===");
  console.log(itUser);
}

main().catch(console.error).finally(() => process.exit());
