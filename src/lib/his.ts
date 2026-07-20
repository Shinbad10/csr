import sql from "mssql";
import { getPrisma } from "./prisma";
import { triggerSync } from "./syncWorker";

export interface HISCheckResult {
  found: boolean;
  matchType?: "exact" | "partial"; // exact = CCCD khớp, partial = chỉ khớp họ tên + năm sinh
  maHIS?: string;
  hoTenHIS?: string;
  namSinhHIS?: string;
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

export function appendHisNote(oldNote: string | null | undefined, newHisDetail: string): string {
  const clean = (oldNote || "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("[HIS]:"))
    .join("\n")
    .trim();
  const res = clean ? `${clean}\n[HIS]: ${newHisDetail}` : `[HIS]: ${newHisDetail}`;
  return res.slice(0, 950); // Giữ dưới 1000 ký tự để tránh lỗi tràn cột NVARCHAR(1000) trên SQL Server
}

export async function checkHISForPatient(
  coSoId: string,
  hoTen: string,
  namSinh: number | string,
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

    const hoTenClean = hoTen.trim();
    const namSinhStr = String(namSinh).trim();
    const cccdClean = cccd?.trim() || "";

    // Truy vấn tổng hợp từ QLyCapThe, QLyPhongMo, Noitru_HSBA và BN_Master
    const query = `
      SELECT TOP 5
        c.Ma as maHIS,
        c.Hoten,
        c.Namsinh,
        c.CMND,
        c.Dienthoai,
        mo.Ngaymo,
        mo.Khoa as khoaMo,
        hsba.Chandoan_Ravien as chanDoanRavien,
        hsba.Chandoan_Vaovien as chanDoanVaovien,
        hsba.Ngayvao,
        hsba.Ngayra,
        bm.BsDieutri,
        bm.ChandoanChinh as chanDoanBM
      FROM QLyCapThe c
      LEFT JOIN QLyPhongMo mo ON c.Ma = mo.MaBenhnhan
      LEFT JOIN Noitru_HSBA hsba ON c.Ma = hsba.MaBenhnhan AND (mo.MaBenhAn = hsba.SoBenhAn OR mo.Ngaymo BETWEEN hsba.Ngayvao AND hsba.Ngayra)
      LEFT JOIN BN_Master bm ON c.Ma = bm.MaBN AND (mo.Ngaymo = bm.Ngay OR hsba.Ngayvao = bm.Ngay)
      WHERE (c.CMND = @cccd AND @cccd <> '')
         OR (LOWER(LTRIM(RTRIM(c.Hoten))) = LOWER(@hoTen) AND c.Namsinh = @namSinh)
      ORDER BY mo.Ngaymo DESC, hsba.Ngayvao DESC
    `;

    const req = pool.request();
    req.input("cccd", sql.NVarChar, cccdClean);
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

    // Xác định mức độ khớp: exact (CCCD trùng) vs partial (chỉ họ tên + năm sinh)
    const hisCccd = String(first.CMND || "").trim();
    const matchType: "exact" | "partial" = (cccdClean && hisCccd && cccdClean === hisCccd) ? "exact" : "partial";

    // Kiểm tra xem có bản ghi mổ/phẫu thuật nào không
    // Ưu tiên bản ghi có Ngaymo trong tháng yêu cầu (nếu có monthStr)
    let surgeryRow = null;
    if (monthStr) {
      // monthStr dạng YYYY-MM hoặc MM/YYYY
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

    // Nếu không khớp chính xác tháng, lấy bản ghi mổ mới nhất (nếu có)
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
    if (matchType === "partial") chiTiet += ` [⚠ Chỉ khớp Họ tên + Năm sinh, chưa xác minh CCCD]`;
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
      maHIS,
      hoTenHIS,
      namSinhHIS,
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
    namSinh: number | string;
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

    for (const p of patients) {
      try {
        const hoTenClean = p.hoTen.trim();
        const namSinhStr = String(p.namSinh).trim();
        const cccdClean = p.cccd?.trim() || "";
        const mStr = monthStr || (p.buoiKham?.ngayKham ? new Date(p.buoiKham.ngayKham).toISOString().slice(0, 7) : null);

        const query = `
          SELECT TOP 5
            c.Ma as maHIS, c.Hoten, c.Namsinh, c.CMND, c.Dienthoai,
            mo.Ngaymo, mo.Khoa as khoaMo,
            hsba.Chandoan_Ravien as chanDoanRavien, hsba.Chandoan_Vaovien as chanDoanVaovien,
            hsba.Ngayvao, hsba.Ngayra, bm.BsDieutri, bm.ChandoanChinh as chanDoanBM
          FROM QLyCapThe c
          LEFT JOIN QLyPhongMo mo ON c.Ma = mo.MaBenhnhan
          LEFT JOIN Noitru_HSBA hsba ON c.Ma = hsba.MaBenhnhan AND (mo.MaBenhAn = hsba.SoBenhAn OR mo.Ngaymo BETWEEN hsba.Ngayvao AND hsba.Ngayra)
          LEFT JOIN BN_Master bm ON c.Ma = bm.MaBN AND (mo.Ngaymo = bm.Ngay OR hsba.Ngayvao = bm.Ngay)
          WHERE (c.CMND = @cccd AND @cccd <> '')
             OR (LOWER(LTRIM(RTRIM(c.Hoten))) = LOWER(@hoTen) AND c.Namsinh = @namSinh)
          ORDER BY mo.Ngaymo DESC, hsba.Ngayvao DESC
        `;
        const req = pool.request();
        req.input("cccd", sql.NVarChar, cccdClean);
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

        // Xác định mức độ khớp: exact (CCCD trùng) vs partial (chỉ họ tên + năm sinh)
        const hisCccd = String(first.CMND || "").trim();
        const matchType: "exact" | "partial" = (cccdClean && hisCccd && cccdClean === hisCccd) ? "exact" : "partial";

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
        if (matchType === "partial") chiTiet += ` [⚠ Chỉ khớp Họ tên + Năm sinh, chưa xác minh CCCD]`;
        if (hasSurgery && ngayMo) {
          const dStr = new Date(ngayMo).toLocaleDateString("vi-VN");
          chiTiet += ` - Đã phẫu thuật ngày ${dStr} tại Khoa ${khoaMo || "KMTH"}`;
          if (chanDoan) chiTiet += ` (CĐ: ${chanDoan})`;
        } else {
          chiTiet += ` - Chưa ghi nhận lịch sử phẫu thuật trên HIS.`;
        }

        // Cập nhật DB: chỉ tự động gán "Đã mổ" khi matchType === "exact" (CCCD khớp).
        // matchType === "partial" (chỉ họ tên + năm sinh) → chỉ gán mã HIS, KHÔNG tự chuyển trạng thái.
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

        // Xoá rác nhật ký liên hệ
        await prisma.nhatKyTheoDoi.deleteMany({
          where: { hoSoId: p.id, noiDung: { startsWith: "[⚡ Đối chiếu HIS]" } },
        });

        try {
          await prisma.syncQueue.create({ data: { hoSoId: p.id } });
        } catch {}

        results.push({ id: p.id, hoTen: p.hoTen, found: true, matchType, maHIS, hasSurgery, chiTiet });
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

// Tìm kiếm thủ công trong HIS theo từ khoá (họ tên / CCCD / mã HIS) — dùng khi đối chiếu tự động không khớp.
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

    // Tự dò cột địa chỉ trong bảng QLyCapThe (mỗi HIS đặt tên khác nhau: Diachi/DiaChi/NoiO/ThuongTru…)
    let addrCol = "";
    try {
      const colRes = await pool.request().query(`
        SELECT TOP 1 COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'QLyCapThe'
          AND (COLUMN_NAME LIKE '%iachi%' OR COLUMN_NAME LIKE '%uongtru%' OR COLUMN_NAME LIKE '%noio%' OR COLUMN_NAME LIKE '%diachi%')
        ORDER BY CASE WHEN COLUMN_NAME LIKE '%iachi%' THEN 0 ELSE 1 END
      `);
      addrCol = colRes.recordset?.[0]?.COLUMN_NAME || "";
    } catch {}
    // Tên cột lấy từ INFORMATION_SCHEMA (cột thật) nên an toàn để nội suy; bọc [] cho chắc.
    const addrSelect = addrCol ? `c.[${addrCol}] as diaChi,` : `NULL as diaChi,`;

    const req = pool.request();
    req.input("kw", sql.NVarChar, `%${kw}%`);
    req.input("kwRaw", sql.NVarChar, kw);

    const query = `
      SELECT TOP 30
        c.Ma as maHIS,
        c.Hoten as hoTen,
        c.Namsinh as namSinh,
        c.CMND as cccd,
        c.Dienthoai as sdt,
        ${addrSelect}
        mo.Ngaymo as ngayMo,
        mo.Khoa as khoaMo,
        hsba.Chandoan_Ravien as chanDoanRavien,
        hsba.Chandoan_Vaovien as chanDoanVaovien,
        bm.BsDieutri as bsDieuTri,
        bm.ChandoanChinh as chanDoanBM
      FROM QLyCapThe c
      LEFT JOIN QLyPhongMo mo ON c.Ma = mo.MaBenhnhan
      LEFT JOIN Noitru_HSBA hsba ON c.Ma = hsba.MaBenhnhan AND (mo.MaBenhAn = hsba.SoBenhAn OR mo.Ngaymo BETWEEN hsba.Ngayvao AND hsba.Ngayra)
      LEFT JOIN BN_Master bm ON c.Ma = bm.MaBN AND (mo.Ngaymo = bm.Ngay OR hsba.Ngayvao = bm.Ngay)
      WHERE LOWER(c.Hoten) LIKE LOWER(@kw) OR c.CMND LIKE @kw OR c.Ma = @kwRaw
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
        c.CMND as cccd,
        c.Dienthoai as sdt,
        mo.Ngaymo as ngayMo,
        mo.Khoa as khoaMo,
        hsba.Chandoan_Ravien as chanDoanRavien,
        hsba.Chandoan_Vaovien as chanDoanVaovien,
        bm.BsDieutri as bsDieuTri,
        bm.ChandoanChinh as chanDoanBM
      FROM QLyPhongMo mo
      JOIN QLyCapThe c ON mo.MaBenhnhan = c.Ma
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
      syncedCount++;
    } catch (e) {
      // Bỏ qua nếu lỗi trùng maNV
      console.error(`Sync doctor upsert error (${doc.ten}):`, e);
    }
  }

  return { syncedCount, doctors: Array.from(syncedNames) };
}
