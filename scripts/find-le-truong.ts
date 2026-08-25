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

  const leTruongUsers = await prisma.nguoiDungCSR.findMany({
    where: { hoTen: { contains: "Lê Thanh Trường" } },
  });
  console.log("Users Lê Thanh Trường:", leTruongUsers);

  const leTruongBk = await prisma.buoiKham.findMany({
    where: { bacSiKham: { contains: "Lê Thanh Trường" } },
  });
  console.log("BuoiKham Lê Thanh Trường:", leTruongBk);

  const leTruongHs = await prisma.hoSoBenhNhan.findMany({
    where: { bacSiChiDinh: { contains: "Lê Thanh Trường" } },
  });
  console.log("HoSo Lê Thanh Trường:", leTruongHs);

  await prisma.$disconnect();
}

main().catch(console.error);
