import { getPrisma } from "../src/lib/prisma";

async function main() {
  const prisma = getPrisma();
  const res = await prisma.hoSoBenhNhan.updateMany({
    where: {
      OR: [
        { trangThaiDieuTri: "Đã mổ" },
        { ngayMoThucTe: { not: null } }
      ],
      trangThai: { not: "DaMoHauPhau" },
      trangThaiDieuTri: { notIn: ["Hủy", "Không đến"] }
    },
    data: {
      trangThai: "DaMoHauPhau"
    }
  });
  console.log("Updated count:", res.count);
}

main().catch(console.error);
