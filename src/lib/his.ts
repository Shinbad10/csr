import sql from "mssql";
import { getPrisma } from "./prisma";
import { triggerSync } from "./syncWorker";

export interface HISCheckResult {
  found: boolean;
  matchType?: "exact" | "partial"; // exact = CCCD hoặc BHYT khớp, partial = chỉ khớp họ tên + năm sinh
  matchReason?: string; // "Khớp CCCD" | "Khớp mã BHYT" | "Khớp Họ tên + Năm sinh"
  maHIS?: string;
  hoTenHIS?: string;
  namSinhHIS?: string;
  cccdHIS?: string;
  bhytHIS?: string;
  hasSurgery?: boolean;
  ngayMo?: string | null;
  khoaMo?: string | null;
  chanDoan?: string | null;
  bsDieutri?: string | null;
  chiTiet?: string;
  error?: string;
}

export async function getHisConfig(coSoId: string) {
  try {
    const coSo = await getPrisma().coSo.findUnique({
      where: { id: coSoId },
      select: {
        hisHost: true,
        hisPort: true,
        hisUser: true,
        hisPass: true,
        hisDbName: true,
      },
    });

    return {
      host: coSo?.hisHost || process.env.HIS_HOST || "192.168.10.250",
      port: parseInt(coSo?.hisPort || process.env.HIS_PORT || "1433", 10),
      user: coSo?.hisUser || process.env.HIS_USER || "reader",
      pass: coSo?.hisPass || process.env.HIS_PASS || "Admin@123",
      dbName: coSo?.hisDbName || process.env.HIS_DB || "shpt_phongKham",
    };
  } catch {
    return {
      host: process.env.HIS_HOST || "192.168.10.250",
      port: parseInt(process.env.HIS_PORT || "1433", 10),
      user: process.env.HIS_USER || "reader",
      pass: process.env.HIS_PASS || "Admin@123",
      dbName: process.env.HIS_DB || "shpt_phongKham",
    };
  }
}

// ── Chuẩn hoá để đối chiếu giữa CSR và HIS ────────────────────────────────
export const foldName = (s?: string | null) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Chỉ giữ chữ số. Dùng cho CCCD/CMND/BHYT */
export const foldId = (s?: string | null) => (s || "").replace(/\D/g, "");

/** 9 số cuối của SĐT — bỏ qua số 0 đầu, +84 và ký tự phân cách. */
export const foldPhone = (s?: string | null) => {
  const d = foldId(s);
  return d.length >= 9 ? d.slice(-9) : "";
};

export function appendHisNote(oldNote: string | null | undefined, newHisDetail: string): string {
  const clean = (oldNote || "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("[HIS]:"))
    .join("\n")
    .trim();
  const res = clean ? `${clean}\n[HIS]: ${newHisDetail}` : `[HIS]: ${newHisDetail}`;
  return res.slice(0, 950);
}

/** Tự dò tên bảng và tên cột thực tế trong bảng QLyCapThe của HIS SQL Server */
async function getQLyCapTheColumns(pool: sql.ConnectionPool): Promise<{
  tableName: string;
  cmndCol: string | null;
  bhytCol: string | null;
  addrCol: string | null;
  sdtCol: string | null;
}> {
  let tableName = "QLyCapThe";
  let cmndCol: string | null = null;
  let bhytCol: string | null = null;
  let addrCol: string | null = null;
  let sdtCol: string | null = null;

  try {
    const colRes = await pool.request().query(`
      SELECT c.name AS COLUMN_NAME, t.name AS TABLE_NAME
      FROM sys.columns c
      JOIN sys.tables t ON c.object_id = t.object_id
      WHERE LOWER(t.name) LIKE '%capthe%' OR LOWER(t.name) LIKE '%benhnhan%' OR LOWER(t.name) = 'dmbenhnhan'
      UNION
      SELECT COLUMN_NAME, TABLE_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE LOWER(TABLE_NAME) LIKE '%capthe%' OR LOWER(TABLE_NAME) LIKE '%benhnhan%' OR LOWER(TABLE_NAME) = 'dmbenhnhan'
    `);
    const records = colRes.recordset || [];

    const capTheRecord =
      records.find((r: any) => String(r.TABLE_NAME).toLowerCase() === "qlycapthe") ||
      records.find((r: any) => String(r.TABLE_NAME).toLowerCase().includes("capthe")) ||
      records[0];

    if (capTheRecord?.TABLE_NAME) {
      tableName = String(capTheRecord.TABLE_NAME);
    }

    const tableCols = records
      .filter((r: any) => String(r.TABLE_NAME).toLowerCase() === tableName.toLowerCase())
      .map((r: any) => String(r.COLUMN_NAME).trim());

    const findCol = (candidates: string[]) =>
      candidates.find((c) => tableCols.some((col) => col.toLowerCase() === c.toLowerCase())) ||
      tableCols.find((col) => candidates.some((c) => col.toLowerCase().includes(c.toLowerCase())));

    cmndCol =
      findCol([
        "CMND", "SoCMND", "CCCD", "SoCCCD", "CMT", "SoCMT",
        "So_CMND", "So_CCCD", "MaDinhDanh", "SoDinhDanh"
      ]) || null;

    bhytCol =
      findCol([
        "Sothe", "MaTheBHYT", "BHYT", "SoTheBHYT", "MaThe", "SoThe",
        "MatheBHYT", "TheBHYT", "MaTheBH", "SoBHYT", "Ma_The", "Ma_The_BHYT", "So_The", "So_The_BHYT"
      ]) || null;

    addrCol =
      findCol([
        "Diachi", "DiaChi", "ThuongTru", "NoiO", "DiaChiThuongTru", "DiaChi_ThuongTru", "DC"
      ]) || null;

    sdtCol =
      findCol([
        "Dienthoai", "DienThoai", "SDT", "SoDienThoai", "Phone", "Mobile", "Tel"
      ]) || null;
  } catch (err) {
    console.error("Error inspecting QLyCapThe columns:", err);
  }

  return { tableName, cmndCol, bhytCol, addrCol, sdtCol };
}

export async function checkHISForPatient(
  coSoId: string,
  hoTen: string,
  namSinh: number | string | null,
  cccd?: string | null,
  bhyt?: string | null,
  monthStr?: string | null
): Promise<HISCheckResult> {
  const config = await getHisConfig(coSoId);

  const dbConfig: sql.config = {
    user: config.user,
    password: config.pass,
    server: config.host,
    port: config.port,
    database: config.dbName,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
    connectionTimeout: 5000,
    requestTimeout: 10000,
  };

  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await new sql.ConnectionPool(dbConfig).connect();
    const { tableName, cmndCol, bhytCol, sdtCol } = await getQLyCapTheColumns(pool);

    const hoTenClean = (hoTen || "").trim();
    const namSinhStr = String(namSinh || "").trim();
    const cccdClean = (cccd || "").trim();
    const cccdDigits = foldId(cccdClean);
    const bhytClean = (bhyt || "").toUpperCase().trim();
    const bhytDigits = foldId(bhytClean);
    const bhytLast10 = bhytDigits.length >= 10 ? bhytDigits.slice(-10) : "";

    const cmndSelect = cmndCol ? `c.[${cmndCol}] as CMND,` : `NULL as CMND,`;
    const bhytSelect = bhytCol ? `c.[${bhytCol}] as Sothe,` : `NULL as Sothe,`;
    const sdtSelect = sdtCol ? `c.[${sdtCol}] as Dienthoai,` : `NULL as Dienthoai,`;

    const whereClauses: string[] = [];
    if (cmndCol) {
      whereClauses.push(`(c.[${cmndCol}] = @cccd AND @cccd <> '')`);
      whereClauses.push(`(REPLACE(c.[${cmndCol}], ' ', '') = @cccdDigits AND @cccdDigits <> '')`);
    }
    if (bhytCol) {
      whereClauses.push(`(c.[${bhytCol}] = @bhyt AND @bhyt <> '')`);
      whereClauses.push(`(c.[${bhytCol}] LIKE '%' + @bhytLast10 AND @bhytLast10 <> '')`);
    }
    whereClauses.push(`(LOWER(LTRIM(RTRIM(c.Hoten))) = LOWER(@hoTen) AND c.Namsinh = @namSinh)`);

    const whereSql = whereClauses.join(" OR ");

    // Truy vấn tổng hợp từ QLyCapThe (so khớp cả CCCD và mã thẻ BHYT)
    const query = `
      SELECT TOP 5
        c.Ma as maHIS,
        c.Hoten,
        c.Namsinh,
        ${cmndSelect}
        ${bhytSelect}
        ${sdtSelect}
        mo.Ngaymo,
        mo.Khoa as khoaMo,
        hsba.Chandoan_Ravien as chanDoanRavien,
        hsba.Chandoan_Vaovien as chanDoanVaovien,
        hsba.Ngayvao,
        hsba.Ngayra,
        bm.BsDieutri,
        bm.ChandoanChinh as chanDoanBM
      FROM [${tableName}] c
      LEFT JOIN QLyPhongMo mo ON c.Ma = mo.MaBenhnhan
      LEFT JOIN Noitru_HSBA hsba ON c.Ma = hsba.MaBenhnhan AND (mo.MaBenhAn = hsba.SoBenhAn OR mo.Ngaymo BETWEEN hsba.Ngayvao AND hsba.Ngayra)
      LEFT JOIN BN_Master bm ON c.Ma = bm.MaBN AND (mo.Ngaymo = bm.Ngay OR hsba.Ngayvao = bm.Ngay)
      WHERE ${whereSql}
      ORDER BY mo.Ngaymo DESC, hsba.Ngayvao DESC
    `;

    const req = pool.request();
    req.input("cccd", sql.NVarChar, cccdClean);
    req.input("cccdDigits", sql.NVarChar, cccdDigits);
    req.input("bhyt", sql.NVarChar, bhytClean);
    req.input("bhytLast10", sql.NVarChar, bhytLast10);
    req.input("hoTen", sql.NVarChar, hoTenClean);
    req.input("namSinh", sql.NVarChar, namSinhStr);

    const res = await req.query(query);
    const rows = res.recordset;

    if (!rows || rows.length === 0) {
      return {
        found: false,
        error: "Không tìm thấy hồ sơ bệnh nhân trên hệ thống HIS bệnh viện.",
      };
    }

    // Tìm thấy bệnh nhân trên HIS
    const first = rows[0];
    const maHIS = String(first.maHIS || "").trim();
    const hoTenHIS = String(first.Hoten || "").trim();
    const namSinhHIS = String(first.Namsinh || "").trim();
    const hisCccd = String(first.CMND || "").trim();
    const hisBhyt = String(first.Sothe || "").trim();

    // Xác định mức độ khớp:
    // 1. Khớp CCCD
    const hisCccdDigits = foldId(hisCccd);
    const isCccdMatch = Boolean(cccdDigits.length >= 9 && hisCccdDigits === cccdDigits);

    // 2. Khớp BHYT
    const hisBhytDigits = foldId(hisBhyt);
    const isBhytMatch = Boolean(
      (bhytClean.length >= 10 && (hisBhyt === bhytClean || hisBhyt.includes(bhytClean) || bhytClean.includes(hisBhyt))) ||
      (bhytLast10.length >= 10 && hisBhytDigits.endsWith(bhytLast10))
    );

    const isExact = isCccdMatch || isBhytMatch;
    const matchType: "exact" | "partial" = isExact ? "exact" : "partial";
    const matchReason = isCccdMatch ? "Khớp CCCD" : isBhytMatch ? "Khớp mã BHYT" : "Khớp Họ tên + Năm sinh";

    let surgeryRow = null;
    if (monthStr) {
      const parts = monthStr.split(/[-/]/);
      let targetYear = "";
      let targetMonth = "";
      if (parts[0].length === 4) {
        targetYear = parts[0];
        targetMonth = parts[1].padStart(2, "0");
      } else if (parts[1]?.length === 4) {
        targetYear = parts[1];
        targetMonth = parts[0].padStart(2, "0");
      }

      surgeryRow = rows.find((r) => {
        if (!r.Ngaymo) return false;
        const d = new Date(r.Ngaymo);
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const y = String(d.getFullYear());
        return (!targetYear || y === targetYear) && (!targetMonth || m === targetMonth);
      });
    }

    if (!surgeryRow) {
      surgeryRow = rows.find((r) => r.Ngaymo != null);
    }

    const hasSurgery = Boolean(surgeryRow && surgeryRow.Ngaymo);
    const targetRow = surgeryRow || first;

    const ngayMo = targetRow.Ngaymo ? new Date(targetRow.Ngaymo).toISOString() : null;
    const khoaMo = targetRow.khoaMo || null;
    const chanDoan = targetRow.chanDoanRavien || targetRow.chanDoanVaovien || targetRow.chanDoanBM || null;
    const bsDieutri = targetRow.BsDieutri || null;

    let chiTiet = `Bệnh nhân: ${hoTenHIS} (Mã HIS: ${maHIS}, NS: ${namSinhHIS})`;
    if (matchType === "exact") {
      chiTiet += ` [✓ ${matchReason}]`;
    } else {
      chiTiet += ` [⚠ Chỉ khớp Họ tên + Năm sinh, chưa xác minh CCCD/BHYT]`;
    }
    if (hasSurgery && ngayMo) {
      const dStr = new Date(ngayMo).toLocaleDateString("vi-VN");
      chiTiet += ` - Đã phẫu thuật ngày ${dStr} tại Khoa ${khoaMo || "KMTH"}`;
      if (chanDoan) chiTiet += ` (CĐ: ${chanDoan})`;
    } else {
      chiTiet += ` - Chưa ghi nhận lịch sử phẫu thuật trên HIS.`;
    }

    return {
      found: true,
      matchType,
      matchReason,
      maHIS,
      hoTenHIS,
      namSinhHIS,
      cccdHIS: hisCccd,
      bhytHIS: hisBhyt,
      hasSurgery,
      ngayMo,
      khoaMo,
      chanDoan,
      bsDieutri,
      chiTiet,
    };
  } catch (err: any) {
    console.error("HIS Connection Error:", err);
    return {
      found: false,
      error: `Lỗi kết nối HIS (${config.host}): ${err?.message || "Không xác định"}`,
    };
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch {}
    }
  }
}

export async function batchCheckHISForPatients(
  coSoId: string,
  patients: Array<{
    id: string;
    hoTen: string;
    namSinh: number | string | null;
    cccd?: string | null;
    bhyt?: string | null;
    buoiKham?: { ngayKham: Date | string } | null;
    nhom?: string | null;
    khuyenNghi?: string | null;
    ghiChuMat2?: string | null;
    daDon?: boolean;
    trangThaiDieuTri?: string | null;
    ngayMoThucTe?: Date | string | null;
  }>,
  monthStr?: string | null
) {
  const config = await getHisConfig(coSoId);
  const dbConfig: sql.config = {
    user: config.user,
    password: config.pass,
    server: config.host,
    port: config.port,
    database: config.dbName,
    options: { encrypt: true, trustServerCertificate: true },
    connectionTimeout: 5000,
    requestTimeout: 30000,
  };

  let pool: sql.ConnectionPool | null = null;
  const results = [];
  try {
    pool = await new sql.ConnectionPool(dbConfig).connect();
    const prisma = getPrisma();
    const { tableName, cmndCol, bhytCol, sdtCol } = await getQLyCapTheColumns(pool);

    const cmndSelect = cmndCol ? `c.[${cmndCol}] as CMND,` : `NULL as CMND,`;
    const bhytSelect = bhytCol ? `c.[${bhytCol}] as Sothe,` : `NULL as Sothe,`;
    const sdtSelect = sdtCol ? `c.[${sdtCol}] as Dienthoai,` : `NULL as Dienthoai,`;

    for (const p of patients) {
      try {
        const hoTenClean = (p.hoTen || "").trim();
        const namSinhStr = String(p.namSinh || "").trim();
        const cccdClean = (p.cccd || "").trim();
        const cccdDigits = foldId(cccdClean);
        const bhytClean = (p.bhyt || "").toUpperCase().trim();
        const bhytDigits = foldId(bhytClean);
        const bhytLast10 = bhytDigits.length >= 10 ? bhytDigits.slice(-10) : "";
        const mStr = monthStr || (p.buoiKham?.ngayKham ? new Date(p.buoiKham.ngayKham).toISOString().slice(0, 7) : null);

        const whereClauses: string[] = [];
        if (cmndCol) {
          whereClauses.push(`(c.[${cmndCol}] = @cccd AND @cccd <> '')`);
          whereClauses.push(`(REPLACE(c.[${cmndCol}], ' ', '') = @cccdDigits AND @cccdDigits <> '')`);
        }
        if (bhytCol) {
          whereClauses.push(`(c.[${bhytCol}] = @bhyt AND @bhyt <> '')`);
          whereClauses.push(`(c.[${bhytCol}] LIKE '%' + @bhytLast10 AND @bhytLast10 <> '')`);
        }
        whereClauses.push(`(LOWER(LTRIM(RTRIM(c.Hoten))) = LOWER(@hoTen) AND c.Namsinh = @namSinh)`);

        const whereSql = whereClauses.join(" OR ");

        const query = `
          SELECT TOP 5
            c.Ma as maHIS, c.Hoten, c.Namsinh, ${cmndSelect} ${bhytSelect} ${sdtSelect}
            mo.Ngaymo, mo.Khoa as khoaMo,
            hsba.Chandoan_Ravien as chanDoanRavien, hsba.Chandoan_Vaovien as chanDoanVaovien,
            hsba.Ngayvao, hsba.Ngayra, bm.BsDieutri, bm.ChandoanChinh as chanDoanBM
          FROM [${tableName}] c
          LEFT JOIN QLyPhongMo mo ON c.Ma = mo.MaBenhnhan
          LEFT JOIN Noitru_HSBA hsba ON c.Ma = hsba.MaBenhnhan AND (mo.MaBenhAn = hsba.SoBenhAn OR mo.Ngaymo BETWEEN hsba.Ngayvao AND hsba.Ngayra)
          LEFT JOIN BN_Master bm ON c.Ma = bm.MaBN AND (mo.Ngaymo = bm.Ngay OR hsba.Ngayvao = bm.Ngay)
          WHERE ${whereSql}
          ORDER BY mo.Ngaymo DESC, hsba.Ngayvao DESC
        `;
        const req = pool.request();
        req.input("cccd", sql.NVarChar, cccdClean);
        req.input("cccdDigits", sql.NVarChar, cccdDigits);
        req.input("bhyt", sql.NVarChar, bhytClean);
        req.input("bhytLast10", sql.NVarChar, bhytLast10);
        req.input("hoTen", sql.NVarChar, hoTenClean);
        req.input("namSinh", sql.NVarChar, namSinhStr);

        const res = await req.query(query);
        const rows = res.recordset;

        if (!rows || rows.length === 0) {
          results.push({ id: p.id, hoTen: p.hoTen, found: false });
          continue;
        }

        const first = rows[0];
        const maHIS = String(first.maHIS || "").trim();
        const hoTenHIS = String(first.Hoten || "").trim();
        const namSinhHIS = String(first.Namsinh || "").trim();
        const hisCccd = String(first.CMND || "").trim();
        const hisBhyt = String(first.Sothe || "").trim();

        // Xác định mức độ khớp: CCCD hoặc BHYT -> exact
        const hisCccdDigits = foldId(hisCccd);
        const isCccdMatch = Boolean(cccdDigits.length >= 9 && hisCccdDigits === cccdDigits);
        const hisBhytDigits = foldId(hisBhyt);
        const isBhytMatch = Boolean(
          (bhytClean.length >= 10 && (hisBhyt === bhytClean || hisBhyt.includes(bhytClean) || bhytClean.includes(hisBhyt))) ||
          (bhytLast10.length >= 10 && hisBhytDigits.endsWith(bhytLast10))
        );

        const isExact = isCccdMatch || isBhytMatch;
        const matchType: "exact" | "partial" = isExact ? "exact" : "partial";
        const matchReason = isCccdMatch ? "Khớp CCCD" : isBhytMatch ? "Khớp mã BHYT" : "Khớp Họ tên + Năm sinh";

        let surgeryRow = null;
        if (mStr) {
          const parts = mStr.split(/[-/]/);
          let targetYear = "", targetMonth = "";
          if (parts[0].length === 4) { targetYear = parts[0]; targetMonth = parts[1].padStart(2, "0"); }
          else if (parts[1]?.length === 4) { targetYear = parts[1]; targetMonth = parts[0].padStart(2, "0"); }

          surgeryRow = rows.find((r) => {
            if (!r.Ngaymo) return false;
            const d = new Date(r.Ngaymo);
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const y = String(d.getFullYear());
            return (!targetYear || y === targetYear) && (!targetMonth || m === targetMonth);
          });
        }
        if (!surgeryRow) surgeryRow = rows.find((r) => r.Ngaymo != null);

        const hasSurgery = Boolean(surgeryRow && surgeryRow.Ngaymo);
        const targetRow = surgeryRow || first;
        const ngayMo = targetRow.Ngaymo ? new Date(targetRow.Ngaymo).toISOString() : null;
        const khoaMo = targetRow.khoaMo || null;
        const chanDoan = targetRow.chanDoanRavien || targetRow.chanDoanVaovien || targetRow.chanDoanBM || null;

        let chiTiet = `Bệnh nhân: ${hoTenHIS} (Mã HIS: ${maHIS}, NS: ${namSinhHIS})`;
        if (matchType === "exact") {
          chiTiet += ` [✓ ${matchReason}]`;
        } else {
          chiTiet += ` [⚠ Chỉ khớp Họ tên + Năm sinh, chưa xác minh CCCD/BHYT]`;
        }
        if (hasSurgery && ngayMo) {
          const dStr = new Date(ngayMo).toLocaleDateString("vi-VN");
          chiTiet += ` - Đã phẫu thuật ngày ${dStr} tại Khoa ${khoaMo || "KMTH"}`;
          if (chanDoan) chiTiet += ` (CĐ: ${chanDoan})`;
        } else {
          chiTiet += ` - Chưa ghi nhận lịch sử phẫu thuật trên HIS.`;
        }

        // Cập nhật DB: tự động gán "Đã mổ" khi matchType === "exact" (CCCD hoặc BHYT khớp)
        const updateData: any = { maBNHIS: maHIS };
        if (hasSurgery && matchType === "exact") {
          if (p.nhom === "A" || p.khuyenNghi === "Phẫu thuật" || !p.nhom) {
            updateData.daDon = true;
            updateData.trangThaiDieuTri = "Đã mổ";
            updateData.trangThai = "DaMoHauPhau";
            if (ngayMo) updateData.ngayMoThucTe = new Date(ngayMo);
            else if (!p.ngayMoThucTe) updateData.ngayMoThucTe = new Date();
          }
          updateData.followUpStatus = "Đã chốt";
        }
        if (chiTiet) {
          updateData.ghiChuMat2 = appendHisNote(p.ghiChuMat2, chiTiet);
        }

        await prisma.hoSoBenhNhan.update({
          where: { id: p.id },
          data: updateData,
        });

        await prisma.nhatKyTheoDoi.deleteMany({
          where: { hoSoId: p.id, noiDung: { startsWith: "[⚡ Đối chiếu HIS]" } },
        });

        try {
          await prisma.syncQueue.create({ data: { hoSoId: p.id } });
        } catch {}

        results.push({ id: p.id, hoTen: p.hoTen, found: true, matchType, matchReason, maHIS, cccdHIS: hisCccd, bhytHIS: hisBhyt, hasSurgery, chiTiet });
      } catch (e: any) {
        results.push({ id: p.id, hoTen: p.hoTen, found: false, error: e?.message || "Lỗi khi tra cứu BN này" });
      }
    }
    triggerSync();
  } catch (err: any) {
    console.error("Batch HIS Connection Error:", err);
    throw new Error(`Lỗi kết nối HIS (${config.host}): ${err?.message || "Không xác định"}`);
  } finally {
    if (pool) {
      try { await pool.close(); } catch {}
    }
  }
  return results;
}

// Tìm kiếm thủ công trong HIS theo từ khoá (họ tên / CCCD / mã thẻ BHYT / mã HIS)
export async function searchHIS(coSoId: string, keyword: string) {
  const kw = (keyword || "").trim();
  if (!kw) return [];
  const config = await getHisConfig(coSoId);
  const dbConfig: sql.config = {
    user: config.user,
    password: config.pass,
    server: config.host,
    port: config.port,
    database: config.dbName,
    options: { encrypt: true, trustServerCertificate: true },
    connectionTimeout: 5000,
    requestTimeout: 20000,
  };

  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await new sql.ConnectionPool(dbConfig).connect();
    const { tableName, cmndCol, bhytCol, addrCol, sdtCol } = await getQLyCapTheColumns(pool);
    const cmndSelect = cmndCol ? `c.[${cmndCol}] as cccd,` : `NULL as cccd,`;
    const bhytSelect = bhytCol ? `c.[${bhytCol}] as bhyt,` : `NULL as bhyt,`;
    const sdtSelect = sdtCol ? `c.[${sdtCol}] as sdt,` : `NULL as sdt,`;
    const addrSelect = addrCol ? `c.[${addrCol}] as diaChi,` : `NULL as diaChi,`;

    const whereClauses = [`LOWER(c.Hoten) LIKE LOWER(@kw)`];
    if (cmndCol) whereClauses.push(`c.[${cmndCol}] LIKE @kw`);
    if (bhytCol) whereClauses.push(`c.[${bhytCol}] LIKE @kw`);
    whereClauses.push(`c.Ma = @kwRaw`);
    const whereSql = whereClauses.join(" OR ");

    const req = pool.request();
    req.input("kw", sql.NVarChar, `%${kw}%`);
    req.input("kwRaw", sql.NVarChar, kw);

    const query = `
      SELECT TOP 30
        c.Ma as maHIS,
        c.Hoten as hoTen,
        c.Namsinh as namSinh,
        ${cmndSelect}
        ${bhytSelect}
        ${sdtSelect}
        ${addrSelect}
        mo.Ngaymo as ngayMo,
        mo.Khoa as khoaMo,
        hsba.Chandoan_Ravien as chanDoanRavien,
        hsba.Chandoan_Vaovien as chanDoanVaovien,
        bm.BsDieutri as bsDieuTri,
        bm.ChandoanChinh as chanDoanBM
      FROM [${tableName}] c
      LEFT JOIN QLyPhongMo mo ON c.Ma = mo.MaBenhnhan
      LEFT JOIN Noitru_HSBA hsba ON c.Ma = hsba.MaBenhnhan AND (mo.MaBenhAn = hsba.SoBenhAn OR mo.Ngaymo BETWEEN hsba.Ngayvao AND hsba.Ngayra)
      LEFT JOIN BN_Master bm ON c.Ma = bm.MaBN AND (mo.Ngaymo = bm.Ngay OR hsba.Ngayvao = bm.Ngay)
      WHERE ${whereSql}
      ORDER BY mo.Ngaymo DESC
    `;

    const res = await req.query(query);
    const rows = res.recordset || [];

    return rows.map((r: any) => {
      const ngayMo = r.ngayMo ? new Date(r.ngayMo).toISOString() : null;
      return {
        maHIS: String(r.maHIS || "").trim(),
        hoTen: String(r.hoTen || "").trim(),
        namSinh: String(r.namSinh || "").trim(),
        cccd: String(r.cccd || "").trim(),
        bhyt: String(r.bhyt || "").trim(),
        sdt: String(r.sdt || "").trim(),
        diaChi: String(r.diaChi || "").trim(),
        ngayMo,
        khoaMo: r.khoaMo || "KMTH",
        chanDoan: r.chanDoanRavien || r.chanDoanVaovien || r.chanDoanBM || "",
        bsDieuTri: r.bsDieuTri || "",
        hasSurgery: Boolean(ngayMo),
      };
    });
  } catch (err: any) {
    console.error("HIS Search Error:", err);
    throw new Error(`Lỗi tìm kiếm HIS (${config.host}): ${err?.message || "Không xác định"}`);
  } finally {
    if (pool) {
      try { await pool.close(); } catch {}
    }
  }
}

export async function getHISSurgeryList(coSoId: string, monthStr?: string | null) {
  const config = await getHisConfig(coSoId);
  const dbConfig: sql.config = {
    user: config.user,
    password: config.pass,
    server: config.host,
    port: config.port,
    database: config.dbName,
    options: { encrypt: true, trustServerCertificate: true },
    connectionTimeout: 5000,
    requestTimeout: 20000,
  };

  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await new sql.ConnectionPool(dbConfig).connect();
    const { tableName, cmndCol, bhytCol, sdtCol } = await getQLyCapTheColumns(pool);
    const cmndSelect = cmndCol ? `c.[${cmndCol}] as cccd,` : `NULL as cccd,`;
    const bhytSelect = bhytCol ? `c.[${bhytCol}] as bhyt,` : `NULL as bhyt,`;
    const sdtSelect = sdtCol ? `c.[${sdtCol}] as sdt,` : `NULL as sdt,`;

    let monthFilter = "";
    const req = pool.request();
    if (monthStr) {
      const parts = monthStr.split(/[-/]/);
      let targetYear = "", targetMonth = "";
      if (parts[0].length === 4) { targetYear = parts[0]; targetMonth = parts[1]; }
      else if (parts[1]?.length === 4) { targetYear = parts[1]; targetMonth = parts[0]; }
      if (targetYear && targetMonth) {
        req.input("yr", sql.Int, parseInt(targetYear, 10));
        req.input("mo", sql.Int, parseInt(targetMonth, 10));
        monthFilter = " AND YEAR(mo.Ngaymo) = @yr AND MONTH(mo.Ngaymo) = @mo";
      }
    }

    const query = `
      SELECT TOP 500
        c.Ma as maHIS,
        c.Hoten as hoTen,
        c.Namsinh as namSinh,
        ${cmndSelect}
        ${bhytSelect}
        ${sdtSelect}
        mo.Ngaymo as ngayMo,
        mo.Khoa as khoaMo,
        hsba.Chandoan_Ravien as chanDoanRavien,
        hsba.Chandoan_Vaovien as chanDoanVaovien,
        bm.BsDieutri as bsDieuTri,
        bm.ChandoanChinh as chanDoanBM
      FROM QLyPhongMo mo
      JOIN [${tableName}] c ON mo.MaBenhnhan = c.Ma
      LEFT JOIN Noitru_HSBA hsba ON c.Ma = hsba.MaBenhnhan AND (mo.MaBenhAn = hsba.SoBenhAn OR mo.Ngaymo BETWEEN hsba.Ngayvao AND hsba.Ngayra)
      LEFT JOIN BN_Master bm ON c.Ma = bm.MaBN AND (mo.Ngaymo = bm.Ngay OR hsba.Ngayvao = bm.Ngay)
      WHERE mo.Ngaymo IS NOT NULL ${monthFilter}
      ORDER BY mo.Ngaymo DESC
    `;

    const res = await req.query(query);
    const rows = res.recordset || [];

    return rows.map((r: any) => ({
      maHIS: String(r.maHIS || "").trim(),
      hoTen: String(r.hoTen || "").trim(),
      namSinh: String(r.namSinh || "").trim(),
      cccd: String(r.cccd || "").trim(),
      bhyt: String(r.bhyt || "").trim(),
      sdt: String(r.sdt || "").trim(),
      ngayMo: r.ngayMo ? new Date(r.ngayMo).toISOString() : null,
      khoaMo: r.khoaMo || "KMTH",
      chanDoan: r.chanDoanRavien || r.chanDoanVaovien || r.chanDoanBM || "",
      bsDieuTri: r.bsDieuTri || "",
    }));
  } catch (err: any) {
    console.error("HIS Surgery List Error:", err);
    throw new Error(`Lỗi lấy danh sách mổ HIS (${config.host}): ${err?.message || "Không xác định"}`);
  } finally {
    if (pool) {
      try { await pool.close(); } catch {}
    }
  }
}

export async function fetchHisDoctorsFromCoSo(coSoId: string): Promise<{ ma: string; ten: string; coSoId: string }[]> {
  const config = await getHisConfig(coSoId);
  const dbConfig: sql.config = {
    user: config.user,
    password: config.pass,
    server: config.host,
    port: config.port,
    database: config.dbName,
    options: { encrypt: true, trustServerCertificate: true },
    connectionTimeout: 4000,
    requestTimeout: 8000,
  };

  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await new sql.ConnectionPool(dbConfig).connect();
    const query = `
      SELECT DISTINCT 
        Ma as ma,
        LTRIM(RTRIM(Ten)) as ten
      FROM DMNhanSu
      WHERE (
        Loai = N'Bác_Sĩ' OR Loai = N'Bác Sĩ' OR Loai LIKE N'%Bác%Sĩ%'
        OR Chucvu LIKE N'%Bác%Sĩ%' OR Chuyenmon LIKE N'%Bác%Sĩ%'
      )
      AND Ten IS NOT NULL
      AND LTRIM(RTRIM(Ten)) <> ''
    `;
    const res = await pool.query(query);
    const rows = res.recordset || [];
    return rows
      .map((r: any) => ({
        ma: String(r.ma || "").trim(),
        ten: String(r.ten || "").trim(),
        coSoId,
      }))
      .filter((d) => d.ten.length > 0);
  } catch (err: any) {
    console.error(`Lỗi lấy danh sách bác sĩ HIS (${coSoId} - ${config.host}):`, err?.message || err);
    return [];
  } finally {
    if (pool) {
      try { await pool.close(); } catch {}
    }
  }
}

export async function syncHisDoctors(targetCoSoId?: string | null): Promise<{ syncedCount: number; doctors: string[] }> {
  const prisma = getPrisma();
  const where: any = { trangThai: "active" };
  if (targetCoSoId) where.id = targetCoSoId;

  const cosos = await prisma.coSo.findMany({ where });
  const allDoctors: { ma: string; ten: string; coSoId: string }[] = [];

  await Promise.allSettled(
    cosos.map(async (cs) => {
      if (!cs.hisHost) return;
      const docs = await fetchHisDoctorsFromCoSo(cs.id);
      allDoctors.push(...docs);
    })
  );

  let syncedCount = 0;
  const syncedNames = new Set<string>();

  for (const doc of allDoctors) {
    const maClean = doc.ma || `BS_${Math.random().toString(36).slice(2, 8)}`;
    const tenClean = doc.ten;
    syncedNames.add(tenClean);

    const maNV = `HIS-${doc.coSoId}-${maClean}`.slice(0, 50);
    const tenDangNhap = `his_bs_${maClean}_${doc.coSoId}`.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 50);

    try {
      // 1. Kiểm tra xem đã có bác sĩ trùng tên nhập tay trên CSR (đang để trống maHIS) chưa
      const existingManual = await prisma.nguoiDungCSR.findFirst({
        where: {
          hoTen: { equals: tenClean },
        },
      });

      if (existingManual) {
        // Cập nhật bổ sung mã HIS vào bản ghi hiện có
        try {
          await (prisma.nguoiDungCSR as any).update({
            where: { maNV: existingManual.maNV },
            data: {
              maHIS: doc.ma || maClean,
              vaiTro: "BacSi",
              trangThai: "active",
            },
          });
        } catch {
          await prisma.nguoiDungCSR.update({
            where: { maNV: existingManual.maNV },
            data: {
              vaiTro: "BacSi",
              trangThai: "active",
            },
          });
        }
      } else {
        try {
          await (prisma.nguoiDungCSR as any).upsert({
            where: { tenDangNhap },
            create: {
              maNV,
              maHIS: doc.ma || maClean,
              hoTen: tenClean,
              vaiTro: "BacSi",
              coSoId: doc.coSoId,
              tenDangNhap,
              matKhauHash: "HIS_EXTERNAL_SYNC",
              trangThai: "active",
            },
            update: {
              maHIS: doc.ma || maClean,
              hoTen: tenClean,
              vaiTro: "BacSi",
              coSoId: doc.coSoId,
              trangThai: "active",
            },
          });
        } catch {
          await prisma.nguoiDungCSR.upsert({
            where: { tenDangNhap },
            create: {
              maNV,
              hoTen: tenClean,
              vaiTro: "BacSi",
              coSoId: doc.coSoId,
              tenDangNhap,
              matKhauHash: "HIS_EXTERNAL_SYNC",
              trangThai: "active",
            },
            update: {
              hoTen: tenClean,
              vaiTro: "BacSi",
              coSoId: doc.coSoId,
              trangThai: "active",
            },
          });
        }
      }
      syncedCount++;
    } catch (e) {
      console.error(`Sync doctor upsert error (${doc.ten}):`, e);
    }
  }

  return { syncedCount, doctors: Array.from(syncedNames) };
}
