import { PrismaClient } from "@prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";

function parse(url: string) {
  const m = url.match(/sqlserver:\/\/([^;:]+)(?::(\d+))?;?(.*)/)!;
  const p: Record<string, string> = {};
  m[3].split(";").forEach((x) => { const [k, v] = x.split("="); if (k && v) p[k.trim().toLowerCase()] = v.trim(); });
  return {
    server: m[1], port: m[2] ? +m[2] : 1433, database: p["database"], user: p["user"], password: p["password"],
    options: { encrypt: p["encrypt"] === "true", trustServerCertificate: p["trustservercertificate"] === "true" },
  };
}

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaMssql(parse(process.env.DATABASE_URL!)) });

  // Test what bacsi API produces
  const users = await prisma.nguoiDungCSR.findMany({
    where: {
      trangThai: "active",
      OR: [
        { vaiTro: "BacSi" },
        { vaiTro: { contains: "BacSi" } },
        { vaiTro: { contains: "Bác sỹ" } },
        { vaiTro: { contains: "Bác sĩ" } },
        { hoTen: { startsWith: "BS" } },
        { hoTen: { startsWith: "Bác sỹ" } },
        { hoTen: { startsWith: "Bác sĩ" } },
      ],
    },
    select: { maNV: true, hoTen: true, maHIS: true, coSoId: true },
    orderBy: { hoTen: "asc" },
  });

  console.log("=== Users returned by bacsi API ===");
  console.log(users);

  // Doctors in past buoiKham
  const bkDoctors = await prisma.buoiKham.findMany({
    where: { bacSiKham: { not: null } },
    select: { bacSiKham: true },
    distinct: ["bacSiKham"],
  });
  console.log("=== Doctors from BuoiKham ===");
  console.log(bkDoctors);

  // Doctors in HoSo
  const hsDoctors = await prisma.hoSoBenhNhan.findMany({
    where: { bacSiChiDinh: { not: null } },
    select: { bacSiChiDinh: true },
    distinct: ["bacSiChiDinh"],
  });
  console.log("=== Doctors from HoSo ===");
  console.log(hsDoctors);

  await prisma.$disconnect();
}

main().catch(console.error);
