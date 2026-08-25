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

  // 1. Check all users in NguoiDungCSR
  const users = await prisma.nguoiDungCSR.findMany();
  console.log("=== Users in NguoiDungCSR ===");
  console.log(users.map(u => ({ maNV: u.maNV, hoTen: u.hoTen, vaiTro: u.vaiTro, tenDangNhap: u.tenDangNhap, trangThai: u.trangThai })));

  // 2. Check doctors in BuoiKham
  const buoiKhams = await prisma.buoiKham.findMany({ select: { id: true, bacSiKham: true } });
  console.log("=== Doctors in BuoiKham ===");
  console.log(buoiKhams);

  // 3. Check doctors in HoSoBenhNhan
  const doctorsInHoSo = await prisma.hoSoBenhNhan.groupBy({
    by: ["bacSiChiDinh"],
    _count: { _all: true },
  });
  console.log("=== Doctors in HoSoBenhNhan ===");
  console.log(doctorsInHoSo);

  await prisma.$disconnect();
}

main().catch(console.error);
