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

  // 1. Update HoSoBenhNhan where bacSiChiDinh is 'Lê Thanh Trường' -> 'Võ Thanh Trường'
  const hsUpdated = await prisma.hoSoBenhNhan.updateMany({
    where: { bacSiChiDinh: "Lê Thanh Trường" },
    data: { bacSiChiDinh: "Võ Thanh Trường" },
  });
  console.log("Updated HoSo count:", hsUpdated.count);

  // Also fix any lowercase 'Võ thanh trường' -> 'Võ Thanh Trường'
  const hsLower = await prisma.hoSoBenhNhan.updateMany({
    where: { bacSiChiDinh: "Võ thanh trường" },
    data: { bacSiChiDinh: "Võ Thanh Trường" },
  });
  console.log("Updated HoSo lower count:", hsLower.count);

  // 2. Update BuoiKham ĐK-260824-01 to 'Võ Thanh Trường'
  await prisma.buoiKham.update({
    where: { id: "ĐK-260824-01" },
    data: { bacSiKham: "Võ Thanh Trường" },
  });
  console.log("Updated BuoiKham ĐK-260824-01");

  // 3. Delete any NguoiDungCSR with 'Lê Thanh Trường'
  const userDel = await prisma.nguoiDungCSR.deleteMany({
    where: { hoTen: "Lê Thanh Trường" },
  });
  console.log("Deleted NguoiDungCSR count:", userDel.count);

  // 4. Verify all doctors in HoSoBenhNhan
  const hsDocs = await prisma.hoSoBenhNhan.groupBy({
    by: ["bacSiChiDinh"],
    _count: { _all: true },
  });
  console.log("Current doctors in HoSoBenhNhan:", hsDocs);

  // 5. Verify all doctors in BuoiKham
  const bkDocs = await prisma.buoiKham.findMany({
    select: { id: true, bacSiKham: true },
  });
  console.log("Current doctors in BuoiKham:", bkDocs);

  await prisma.$disconnect();
}

main().catch(console.error);
