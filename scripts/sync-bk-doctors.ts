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

  await prisma.buoiKham.update({
    where: { id: "ĐK-260822-01" },
    data: { bacSiKham: "Võ Thanh Trường" },
  });

  await prisma.buoiKham.update({
    where: { id: "ĐK-260824-01" },
    data: { bacSiKham: "Võ Thanh Trường, Lê Thanh Trường" },
  });

  await prisma.buoiKham.update({
    where: { id: "ĐK-260825-01" },
    data: { bacSiKham: "Lâm Đức Thiện" },
  });

  // Clean trailing spaces in bacSiChiDinh for HoSo
  const hos = await prisma.hoSoBenhNhan.findMany({
    where: { bacSiChiDinh: { not: null } },
    select: { id: true, bacSiChiDinh: true },
  });

  for (const h of hos) {
    if (h.bacSiChiDinh && h.bacSiChiDinh !== h.bacSiChiDinh.trim()) {
      await prisma.hoSoBenhNhan.update({
        where: { id: h.id },
        data: { bacSiChiDinh: h.bacSiChiDinh.trim() },
      });
    }
  }

  const allBk = await prisma.buoiKham.findMany({
    select: { id: true, xa: true, bacSiKham: true },
  });
  console.log("=== Updated BuoiKham List ===");
  console.log(allBk);

  await prisma.$disconnect();
}

main().catch(console.error);
