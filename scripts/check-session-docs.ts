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

  const sessions = ["ĐK-260822-01", "ĐK-260824-01", "ĐK-260825-01"];
  for (const sId of sessions) {
    const bk = await prisma.buoiKham.findUnique({ where: { id: sId } });
    const docs = await prisma.hoSoBenhNhan.groupBy({
      by: ["bacSiChiDinh"],
      where: { buoiKhamId: sId, bacSiChiDinh: { not: null } },
      _count: { _all: true },
    });
    console.log(`Session ${sId} (${bk?.xa}):`, docs);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
