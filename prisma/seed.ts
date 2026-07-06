import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";
import bcrypt from "bcryptjs";

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
  const hash = await bcrypt.hash("123456", 10);

  await prisma.coSo.upsert({ where: { id: "CS01" }, update: {}, create: { id: "CS01", ten: "Bệnh viện Mắt VISI Sông Tiền", diaChi: "Bến Tre" } });
  await prisma.coSo.upsert({ where: { id: "CS02" }, update: {}, create: { id: "CS02", ten: "Bệnh viện Mắt VISI Cần Thơ", diaChi: "Cần Thơ" } });

  const users = [
    { maNV: "NV01", hoTen: "Quản trị viên", vaiTro: "QuanLy", coSoId: null, tenDangNhap: "admin" },
    { maNV: "NV02", hoTen: "Nhân viên CSKH", vaiTro: "CSKH", coSoId: "CS01", tenDangNhap: "cskh" },
    { maNV: "NV03", hoTen: "Tư vấn viên", vaiTro: "TuVanVien", coSoId: "CS01", tenDangNhap: "tuvan" },
    { maNV: "NV04", hoTen: "Kế toán", vaiTro: "KeToan", coSoId: "CS01", tenDangNhap: "ketoan" },
  ];
  for (const u of users) {
    await prisma.nguoiDungCSR.upsert({ where: { maNV: u.maNV }, update: { matKhauHash: hash, vaiTro: u.vaiTro, coSoId: u.coSoId }, create: { ...u, matKhauHash: hash } });
  }

  for (const ten of ["Bệnh viện Mắt VISI Sông Tiền", "Bệnh viện Mắt VISI Cần Thơ", "MSG - Thốt Nốt"]) {
    await prisma.danhMucBenhVien.upsert({ where: { ten }, update: {}, create: { ten } });
  }

  console.log("Seed xong: 2 cơ sở, 4 tài khoản (mật khẩu 123456): admin/cskh/tuvan/ketoan");
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
