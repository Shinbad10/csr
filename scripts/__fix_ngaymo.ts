// Chuẩn hoá ngayMoThucTe về 00:00 UTC (bỏ phần giờ HIS). Mặc định CHẠY THỬ; thêm "--ghi" để ghi.
// Sao lưu giá trị cũ ra file JSON trước khi ghi.
import { writeFileSync } from "node:fs";
import sql from "mssql";
import { getCloudPrisma } from "@/lib/prisma";
import { getHisConfigOrNull } from "@/lib/his";

const GHI = process.argv.includes("--ghi");
const BACKUP = process.argv.find((a) => a.startsWith("--backup="))?.slice(9);

async function main() {
  const prisma = getCloudPrisma();
  const rows: { id: string; coSoId: string; maBNHIS: string | null; ngayMoThucTe: Date }[] = await prisma.$queryRawUnsafe(`
    SELECT h.id, h.coSoId, h.maBNHIS, h.ngayMoThucTe FROM HoSoBenhNhan h
    WHERE h.ngayMoThucTe IS NOT NULL AND CAST(h.ngayMoThucTe AS TIME) <> '00:00:00'`);
  const utcDay = (d: Date) => d.toISOString().slice(0, 10);
  const lech = rows.filter((r) => r.ngayMoThucTe.getUTCHours() >= 17);
  console.log(`Có giờ: ${rows.length} · trong đó hiện lệch +1 ngày (>=17h UTC): ${lech.length}`);

  // Ca đúng 17:00:00 có thể là "nửa đêm giờ VN" (ngày đúng = hôm sau) → đối chiếu sổ phòng mổ
  const ca17 = rows.filter((r) => r.ngayMoThucTe.toISOString().slice(11, 19) === "17:00:00");
  const ngayDich = new Map<string, string>();
  for (const r of rows) ngayDich.set(r.id, utcDay(r.ngayMoThucTe));
  for (const r of ca17) {
    const cfg = r.maBNHIS ? await getHisConfigOrNull(r.coSoId) : null;
    let soMo: string[] = [];
    if (cfg) {
      const pool = await new sql.ConnectionPool({ server: cfg.host, port: cfg.port, user: cfg.user, password: cfg.pass, database: cfg.dbName, options: { encrypt: true, trustServerCertificate: true } }).connect();
      const q = await pool.request().input("ma", sql.NVarChar, r.maBNHIS!).query(`SELECT CONVERT(VARCHAR(16), Ngaymo, 120) t FROM QLyPhongMo WITH (NOLOCK) WHERE MaBenhnhan = @ma ORDER BY Ngaymo`);
      soMo = q.recordset.map((x) => x.t);
      await pool.close();
    }
    const truoc = utcDay(r.ngayMoThucTe);
    const sau = utcDay(new Date(r.ngayMoThucTe.getTime() + 7 * 3600_000));
    const chon = soMo.some((t) => t.startsWith(sau)) && !soMo.some((t) => t.startsWith(truoc)) ? sau : truoc;
    ngayDich.set(r.id, chon);
    console.log(`Ca 17:00:00 ${r.coSoId} ${r.maBNHIS ?? "—"}: lưu ${r.ngayMoThucTe.toISOString()} · sổ mổ [${soMo.join(", ")}] → chọn ${chon}`);
  }

  const doi = rows.map((r) => ({ id: r.id, cu: r.ngayMoThucTe.toISOString(), moi: `${ngayDich.get(r.id)}T00:00:00.000Z` }));
  const thayDoiNgayHienThi = doi.filter((d) => new Date(new Date(d.cu).getTime() + 7 * 3600_000).toISOString().slice(0, 10) !== d.moi.slice(0, 10)).length;
  console.log(`Sẽ đổi ${doi.length} hồ sơ · ngày hiển thị (giờ VN) thay đổi ở ${thayDoiNgayHienThi} hồ sơ`);
  const vd = await prisma.hoSoBenhNhan.findFirst({ where: { maBNHIS: "26.014711" }, select: { id: true } });
  if (vd) console.log("Ví dụ 26.014711:", JSON.stringify(doi.find((d) => d.id === vd.id)));

  if (!GHI) { console.log("CHẠY THỬ — chưa ghi gì."); await prisma.$disconnect(); return; }
  if (!BACKUP) throw new Error("Thiếu --backup=<đường dẫn>");
  writeFileSync(BACKUP, JSON.stringify({ luc: new Date().toISOString(), cot: "HoSoBenhNhan.ngayMoThucTe", rows: doi }, null, 1));
  console.log(`Đã sao lưu ${doi.length} dòng → ${BACKUP}`);
  let n = 0;
  for (const d of doi) {
    // Chỉ ghi nếu giá trị vẫn đúng như lúc đọc (tránh đè lên thay đổi mới của người dùng)
    const r = await prisma.hoSoBenhNhan.updateMany({ where: { id: d.id, ngayMoThucTe: new Date(d.cu) }, data: { ngayMoThucTe: new Date(d.moi) } });
    n += r.count;
  }
  console.log(`Đã cập nhật ${n}/${doi.length} hồ sơ`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error("FAIL:", e instanceof Error ? e.message : e); process.exit(1); });
