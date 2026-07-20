import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";

function parse(url: string) {
  const m = url.match(/sqlserver:\/\/([^;:]+)(?::(\d+))?;?(.*)/)!;
  const p: Record<string, string> = {};
  m[3].split(";").forEach((x) => { const [k, v] = x.split("="); if (k && v) p[k.trim().toLowerCase()] = v.trim(); });
  return { server: m[1], port: m[2] ? +m[2] : 1433, database: p["database"], user: p["user"], password: p["password"], options: { encrypt: p["encrypt"] === "true", trustServerCertificate: p["trustservercertificate"] === "true" } };
}

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaMssql(parse(process.env.DATABASE_URL!)) });

  // Liệt kê trước khi xóa
  const buoiList = await prisma.buoiKham.findMany({ select: { id: true, xa: true, ngayKham: true, coSoId: true } });
  console.log("Các buổi khám sẽ bị xóa:");
  buoiList.forEach(b => console.log(`  - ${b.id} | ${b.xa} | ${b.ngayKham?.toISOString().slice(0,10)} | ${b.coSoId}`));

  const del1 = await prisma.hoSoBenhNhan.deleteMany({});
  console.log(`\n✅ Đã xóa HoSoBenhNhan: ${del1.count} records`);

  const del2 = await prisma.buoiKham.deleteMany({});
  console.log(`✅ Đã xóa BuoiKham: ${del2.count} records`);

  await prisma["\$disconnect"]();
}
main().catch(console.error);
