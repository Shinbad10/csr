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
  soTienThucThu?: number | null;
  tenDichVu?: string | null;
  loaiPhauThuat?: string | null;
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
  const lines = (oldNote || "").split("\n");
  const filtered: string[] = [];
  let inHisBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("[HIS]:") || trimmed.startsWith("[HIS]")) {
      inHisBlock = true;
      continue;
    }
    if (inHisBlock && (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed === "")) {
      continue;
    } else {
      inHisBlock = false;
    }
    filtered.push(line);
  }

  const clean = filtered.join("\n").trim();
  const formattedHisNote = `[HIS]: ${newHisDetail}`;
  const res = clean ? `${clean}\n\n${formattedHisNote}` : formattedHisNote;
  return res.slice(0, 980);
}

/** Truy vấn thực thu dịch vụ & tạm ứng của bệnh nhân từ HIS (PhieuthuDichvu + TKBenhnhan + BN_CTDichvu), tự động kiểm tra cấu trúc bảng để tránh lỗi Invalid column */
export async function fetchHisRevenue(pool: sql.ConnectionPool, maHIS: string): Promise<number | null> {
  if (!maHIS) return null;
  const cleanMa = maHIS.trim();
  const noDotMa = cleanMa.replace(/\./g, "");

  try {
    // Kiếm tra sự tồn tại của các cột trong bảng trước khi truy vấn
    const colCheck = await pool.request().query(`
      SELECT 
        OBJECT_ID('PhieuthuDichvu') as hasPT,
        OBJECT_ID('TKBenhnhan') as hasTK,
        OBJECT_ID('BN_CTDichvu') as hasCT,
        COL_LENGTH('PhieuthuDichvu', 'Thucthu') as ptThucthu,
        COL_LENGTH('TKBenhnhan', 'Thucthu') as tkThucthu,
        COL_LENGTH('TKBenhnhan', 'Sotien') as tkSotien,
        COL_LENGTH('BN_CTDichvu', 'Thanhtien') as dvThanhtien,
        COL_LENGTH('BN_CTDichvu', 'Sotien') as dvSotien,
        COL_LENGTH('BN_CTDichvu', 'Dongia') as dvDongia,
        COL_LENGTH('BN_CTDichvu', 'DonGia') as dvDonGia,
        COL_LENGTH('BN_CTDichvu', 'Soluong') as dvSoluong
    `);

    const cols = colCheck.recordset?.[0] || {};

    let ptQuery = "SELECT 0 as revPhieuThu";
    if (cols.hasPT && cols.ptThucthu) {
      ptQuery = `
        SELECT ISNULL(SUM(ISNULL(TRY_CAST(pt.Thucthu AS bigint), 0)), 0) as revPhieuThu
        FROM PhieuthuDichvu pt WITH (NOLOCK)
        WHERE (pt.Mabenhnhan = @maHIS OR REPLACE(pt.Mabenhnhan, '.', '') = @maHISNoDot OR pt.Mabenhnhan = @maHISNoDot)
          AND NOT (CAST(pt.Trangthai AS nvarchar(50)) IN (N'Đã_Hủy', N'Đã hủy', '2'))
      `;
    }

    let tkCol = cols.tkThucthu ? "Thucthu" : cols.tkSotien ? "Sotien" : null;
    let tkQuery = "SELECT 0 as revTamUng";
    if (cols.hasTK && tkCol) {
      tkQuery = `
        SELECT ISNULL(SUM(ISNULL(TRY_CAST(${tkCol} AS bigint), 0)), 0) as revTamUng
        FROM TKBenhnhan WITH (NOLOCK)
        WHERE (Mabenhnhan = @maHIS OR REPLACE(Mabenhnhan, '.', '') = @maHISNoDot OR Mabenhnhan = @maHISNoDot)
          AND (Trangthai IS NULL OR CAST(Trangthai AS nvarchar(50)) NOT IN (N'Đã_Hủy', N'Đã hủy', '2'))
      `;
    }

    let dvExpr = "0";
    if (cols.dvThanhtien) {
      dvExpr = "TRY_CAST(dv.Thanhtien AS bigint)";
    } else if (cols.dvSotien) {
      dvExpr = "TRY_CAST(dv.Sotien AS bigint)";
    } else if (cols.dvDongia || cols.dvDonGia) {
      const gCol = cols.dvDongia ? "dv.Dongia" : "dv.DonGia";
      const qCol = cols.dvSoluong ? "ISNULL(TRY_CAST(dv.Soluong AS bigint), 1)" : "1";
      dvExpr = `(TRY_CAST(${gCol} AS bigint) * ${qCol})`;
    }

    let dvQuery = "SELECT 0 as revCTDichVu";
    if (cols.hasCT) {
      dvQuery = `
        SELECT ISNULL(SUM(ISNULL(${dvExpr}, 0)), 0) as revCTDichVu
        FROM BN_CTDichvu dv WITH (NOLOCK)
        WHERE (dv.MaBN = @maHIS OR REPLACE(dv.MaBN, '.', '') = @maHISNoDot OR dv.MaBN = @maHISNoDot)
          AND (dv.Trangthai IS NULL OR CAST(dv.Trangthai AS nvarchar(50)) NOT IN (N'Đã_Hủy', N'Đã hủy', '2'))
      `;
    }

    const fullQuery = `
      SELECT 
        (${ptQuery}) as revPhieuThu,
        (${tkQuery}) as revTamUng,
        (${dvQuery}) as revCTDichVu
    `;

    const revRes = await pool.request()
      .input("maHIS", sql.NVarChar, cleanMa)
      .input("maHISNoDot", sql.NVarChar, noDotMa)
      .query(fullQuery);

    const row = revRes.recordset?.[0];
    const ptVal = row?.revPhieuThu ? Number(row.revPhieuThu) : 0;
    const tuVal = row?.revTamUng ? Number(row.revTamUng) : 0;
    const dvVal = row?.revCTDichVu ? Number(row.revCTDichVu) : 0;
    const maxVal = Math.max(ptVal, tuVal, dvVal);
    return maxVal > 0 ? maxVal : null;
  } catch (err) {
    console.error("Error fetching HIS revenue:", err);
    return null;
  }
}

/** Truy vấn chi tiết dịch vụ phẫu thuật (Phaco, Mộng, Lác...) của bệnh nhân từ BN_CTDichvu + DMDichvuCM */
export async function fetchHisSurgeryDetail(
  pool: sql.ConnectionPool,
  maHIS: string
): Promise<{
  hasSurgery: boolean;
  ngayMo: string | null;
  tenDichVu: string | null;
  loaiPhauThuat: string | null;
} | null> {
  if (!maHIS) return null;
  const cleanMa = maHIS.trim();
  const noDotMa = cleanMa.replace(/\./g, "");

  try {
    const res = await pool.request()
      .input("maHIS", sql.NVarChar, cleanMa)
      .input("maHISNoDot", sql.NVarChar, noDotMa)
      .query(`
        SELECT TOP 1
          dv.Ngaylap as ngayMo,
          dm.Ten as tenDichVu,
          CASE 
            WHEN dv.MaDV LIKE 'PT.PC%' AND (dm.Ten LIKE '%phaco%' OR dm.Ten LIKE '%Phaco%' OR dm.Ten LIKE '%PHACO%') THEN N'Phaco'
            WHEN dv.MaDV LIKE 'PT.M%' AND (dm.Ten LIKE N'%mộng%' OR dm.Ten LIKE N'%Mộng%') THEN N'Mộng'
            WHEN dv.MaDV LIKE 'PT.L%' AND (dm.Ten LIKE N'%lác%' OR dm.Ten LIKE N'%Lác%') THEN N'Lác'
            ELSE N'Phẫu thuật khác'
          END as loaiPhauThuat
        FROM BN_CTDichvu dv WITH (NOLOCK)
        INNER JOIN DMDichvuCM dm WITH (NOLOCK) ON dm.Ma = dv.MaDV
        WHERE (dv.Nhom = 'PT' OR dv.MaDV LIKE 'PT.%')
          AND (dv.MaBN = @maHIS OR REPLACE(dv.MaBN, '.', '') = @maHISNoDot OR dv.MaBN = @maHISNoDot)
        ORDER BY dv.Ngaylap DESC;
      `);

    const first = res.recordset?.[0];
    if (!first) return null;

    return {
      hasSurgery: true,
      ngayMo: first.ngayMo ? new Date(first.ngayMo).toISOString() : null,
      tenDichVu: String(first.tenDichVu || "").trim() || null,
      loaiPhauThuat: String(first.loaiPhauThuat || "").trim() || null,
    };
  } catch (err) {
    console.error("Error fetching HIS surgery detail:", err);
    return null;
  }
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
        hsba.Ngayvao as ngayVao,
        hsba.Ngayra as ngayRa,
        hsba.Chandoan_Ravien as chanDoanRavien,
        hsba.Chandoan_Vaovien as chanDoanVaovien,
        bm.Ngay as ngayKham,
        bm.BsDieutri,
        bm.ChandoanChinh as chanDoanBM
      FROM [${tableName}] c WITH (NOLOCK)
      LEFT JOIN Noitru_HSBA hsba WITH (NOLOCK) ON c.Ma = hsba.MaBenhnhan
      LEFT JOIN BN_Master bm WITH (NOLOCK) ON c.Ma = bm.MaBN
      WHERE ${whereSql}
      ORDER BY hsba.Ngayvao DESC, bm.Ngay DESC
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

    // Lọc qua danh sách ứng viên từ HIS để chọn người khớp chuẩn nhất & KHÔNG XUNG ĐỘT CCCD / BHYT
    let matchedRow: any = null;
    let matchType: "exact" | "partial" = "partial";
    let matchReason = "";

    for (const r of rows) {
      const candidateCccdDigits = foldId(r.CMND);
      const candidateBhytDigits = foldId(r.Sothe);
      const candidateBhytLast10 = candidateBhytDigits.length >= 10 ? candidateBhytDigits.slice(-10) : "";
      const candidateNameFold = foldName(r.Hoten);
      const candidateNamSinh = String(r.Namsinh || "").trim();

      // Kiểm tra xung đột thông tin định danh:
      // 1. Xung đột CCCD: nếu cả 2 bên đều có CCCD (>=9 số) mà không giống nhau -> XUNG ĐỘT
      const hasCccdConflict = Boolean(
        cccdDigits.length >= 9 &&
        candidateCccdDigits.length >= 9 &&
        cccdDigits !== candidateCccdDigits
      );

      // 2. Xung đột BHYT: nếu cả 2 bên đều có BHYT (>=10 số) mà 10 số cuối không giống nhau -> XUNG ĐỘT
      const hasBhytConflict = Boolean(
        bhytLast10.length >= 10 &&
        candidateBhytLast10.length >= 10 &&
        bhytLast10 !== candidateBhytLast10
      );

      if (hasCccdConflict || hasBhytConflict) {
        // Loại bỏ ứng viên này vì trùng Tên + Năm sinh nhưng khác CCCD hoặc khác BHYT!
        continue;
      }

      const isCccdMatch = Boolean(cccdDigits.length >= 9 && candidateCccdDigits === cccdDigits);
      const isBhytMatch = Boolean(bhytLast10.length >= 10 && candidateBhytLast10 === bhytLast10);
      const isNameYearMatch = Boolean(
        foldName(hoTenClean) === candidateNameFold &&
        (namSinhStr === candidateNamSinh || !namSinhStr || !candidateNamSinh)
      );

      if (isCccdMatch) {
        matchedRow = r;
        matchType = "exact";
        matchReason = "Khớp CCCD";
        break;
      }

      if (isBhytMatch) {
        matchedRow = r;
        matchType = "exact";
        matchReason = "Khớp mã BHYT";
        break;
      }

      if (isNameYearMatch && !matchedRow) {
        matchedRow = r;
        matchType = "partial";
        matchReason = "Khớp Họ tên + Năm sinh";
      }
    }

    if (!matchedRow) {
      return {
        found: false,
        error: "Không tìm thấy hồ sơ khớp trên HIS (các hồ sơ trùng tên đều khác CCCD hoặc BHYT).",
      };
    }

    const maHIS = String(matchedRow.maHIS || "").trim();
    const hoTenHIS = String(matchedRow.Hoten || "").trim();
    const namSinhHIS = String(matchedRow.Namsinh || "").trim();
    const hisCccd = String(matchedRow.CMND || "").trim();
    const hisBhyt = String(matchedRow.Sothe || "").trim();

    // Lấy tổng số tiền thực thu & tạm ứng từ HIS (bỏ qua phiếu hủy)
    const soTienThucThu = await fetchHisRevenue(pool, maHIS);
    // Lấy chi tiết phẫu thuật từ BN_CTDichvu + DMDichvuCM
    const surgDetail = await fetchHisSurgeryDetail(pool, maHIS);

    const targetRow = matchedRow;
    const ngayMoRaw = surgDetail?.ngayMo || targetRow.ngayVao || targetRow.ngayRa || targetRow.ngayKham;
    const ngayMo = ngayMoRaw ? new Date(ngayMoRaw).toISOString() : null;
    const khoaMo = "KMTH";
    const chanDoan = targetRow.chanDoanRavien || targetRow.chanDoanVaovien || targetRow.chanDoanBM || null;
    const bsDieutri = targetRow.BsDieutri || null;
    const hasSurgery = Boolean(surgDetail?.hasSurgery || targetRow.ngayVao || targetRow.ngayRa || (soTienThucThu != null && soTienThucThu > 0));
    const tenDichVu = surgDetail?.tenDichVu || null;
    const loaiPhauThuat = surgDetail?.loaiPhauThuat || null;

    let chiTiet = `${hoTenHIS} (Mã HIS: ${maHIS}, NS: ${namSinhHIS}) ${matchType === "exact" ? `[✓ ${matchReason}]` : `[⚠ Khớp Họ tên+Năm sinh]`}`;
    if (hasSurgery && ngayMo) {
      const dStr = new Date(ngayMo).toLocaleDateString("vi-VN");
      chiTiet += `\n• Loại mổ: ${loaiPhauThuat || "Phẫu thuật"} (Ngày mổ: ${dStr})`;
      if (tenDichVu) chiTiet += `\n• Chi tiết PT: ${tenDichVu}`;
      if (chanDoan) chiTiet += `\n• Chẩn đoán: ${chanDoan}`;
      if (khoaMo) chiTiet += `\n• Khoa: ${khoaMo}`;
    } else {
      chiTiet += `\n• Trạng thái: Chưa ghi nhận lịch sử mổ trên HIS`;
    }
    if (soTienThucThu != null && soTienThucThu > 0) {
      chiTiet += `\n• Thực thu HIS: ${new Intl.NumberFormat("vi-VN").format(soTienThucThu)} VNĐ`;
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
      soTienThucThu,
      tenDichVu,
      loaiPhauThuat,
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
            hsba.Ngayvao as ngayVao, hsba.Ngayra as ngayRa,
            hsba.Chandoan_Ravien as chanDoanRavien, hsba.Chandoan_Vaovien as chanDoanVaovien,
            bm.Ngay as ngayKham, bm.BsDieutri, bm.ChandoanChinh as chanDoanBM
          FROM [${tableName}] c WITH (NOLOCK)
          LEFT JOIN Noitru_HSBA hsba WITH (NOLOCK) ON c.Ma = hsba.MaBenhnhan
          LEFT JOIN BN_Master bm WITH (NOLOCK) ON c.Ma = bm.MaBN
          WHERE ${whereSql}
          ORDER BY hsba.Ngayvao DESC, bm.Ngay DESC
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

        // Lọc qua danh sách ứng viên từ HIS để chọn người khớp chuẩn nhất & KHÔNG XUNG ĐỘT CCCD / BHYT
        let matchedRow: any = null;
        let matchType: "exact" | "partial" = "partial";
        let matchReason = "";

        for (const r of rows) {
          const candidateCccdDigits = foldId(r.CMND);
          const candidateBhytDigits = foldId(r.Sothe);
          const candidateBhytLast10 = candidateBhytDigits.length >= 10 ? candidateBhytDigits.slice(-10) : "";
          const candidateNameFold = foldName(r.Hoten);
          const candidateNamSinh = String(r.Namsinh || "").trim();

          // Kiểm tra xung đột thông tin định danh:
          // 1. Xung đột CCCD: nếu cả 2 bên đều có CCCD (>=9 số) mà không giống nhau -> XUNG ĐỘT
          const hasCccdConflict = Boolean(
            cccdDigits.length >= 9 &&
            candidateCccdDigits.length >= 9 &&
            cccdDigits !== candidateCccdDigits
          );

          // 2. Xung đột BHYT: nếu cả 2 bên đều có BHYT (>=10 số) mà 10 số cuối không giống nhau -> XUNG ĐỘT
          const hasBhytConflict = Boolean(
            bhytLast10.length >= 10 &&
            candidateBhytLast10.length >= 10 &&
            bhytLast10 !== candidateBhytLast10
          );

          if (hasCccdConflict || hasBhytConflict) {
            // Loại bỏ ứng viên này vì trùng Tên + Năm sinh nhưng khác CCCD hoặc khác BHYT!
            continue;
          }

          const isCccdMatch = Boolean(cccdDigits.length >= 9 && candidateCccdDigits === cccdDigits);
          const isBhytMatch = Boolean(bhytLast10.length >= 10 && candidateBhytLast10 === bhytLast10);
          const isNameYearMatch = Boolean(
            foldName(hoTenClean) === candidateNameFold &&
            (namSinhStr === candidateNamSinh || !namSinhStr || !candidateNamSinh)
          );

          if (isCccdMatch) {
            matchedRow = r;
            matchType = "exact";
            matchReason = "Khớp CCCD";
            break;
          }

          if (isBhytMatch) {
            matchedRow = r;
            matchType = "exact";
            matchReason = "Khớp mã BHYT";
            break;
          }

          if (isNameYearMatch && !matchedRow) {
            matchedRow = r;
            matchType = "partial";
            matchReason = "Khớp Họ tên + Năm sinh";
          }
        }

        if (!matchedRow) {
          results.push({ id: p.id, hoTen: p.hoTen, found: false });
          continue;
        }

        const maHIS = String(matchedRow.maHIS || "").trim();
        const hoTenHIS = String(matchedRow.Hoten || "").trim();
        const namSinhHIS = String(matchedRow.Namsinh || "").trim();
        const hisCccd = String(matchedRow.CMND || "").trim();
        const hisBhyt = String(matchedRow.Sothe || "").trim();

        // Lấy tổng số tiền thực thu & tạm ứng từ HIS (bỏ qua phiếu hủy)
        const soTienThucThu = await fetchHisRevenue(pool, maHIS);
        // Lấy chi tiết phẫu thuật từ BN_CTDichvu + DMDichvuCM
        const surgDetail = await fetchHisSurgeryDetail(pool, maHIS);

        const targetRow = matchedRow;
        const ngayMoRaw = surgDetail?.ngayMo || targetRow.ngayVao || targetRow.ngayRa || targetRow.ngayKham;
        const ngayMo = ngayMoRaw ? new Date(ngayMoRaw).toISOString() : null;
        const khoaMo = "KMTH";
        const chanDoan = targetRow.chanDoanRavien || targetRow.chanDoanVaovien || targetRow.chanDoanBM || null;
        const hasSurgery = Boolean(surgDetail?.hasSurgery || targetRow.ngayVao || targetRow.ngayRa || (soTienThucThu != null && soTienThucThu > 0));
        const tenDichVu = surgDetail?.tenDichVu || null;
        const loaiPhauThuat = surgDetail?.loaiPhauThuat || null;

        let chiTiet = `${hoTenHIS} (Mã HIS: ${maHIS}, NS: ${namSinhHIS}) ${matchType === "exact" ? `[✓ ${matchReason}]` : `[⚠ Khớp Họ tên+Năm sinh]`}`;
        if (hasSurgery && ngayMo) {
          const dStr = new Date(ngayMo).toLocaleDateString("vi-VN");
          chiTiet += `\n• Loại mổ: ${loaiPhauThuat || "Phẫu thuật"} (Ngày mổ: ${dStr})`;
          if (tenDichVu) chiTiet += `\n• Chi tiết PT: ${tenDichVu}`;
          if (chanDoan) chiTiet += `\n• Chẩn đoán: ${chanDoan}`;
          if (khoaMo) chiTiet += `\n• Khoa: ${khoaMo}`;
        } else {
          chiTiet += `\n• Trạng thái: Chưa ghi nhận lịch sử mổ trên HIS`;
        }
        if (soTienThucThu != null && soTienThucThu > 0) {
          chiTiet += `\n• Thực thu HIS: ${new Intl.NumberFormat("vi-VN").format(soTienThucThu)} VNĐ`;
        }

        // Cập nhật DB: Có mã HIS = Đã đến bệnh viện
        const updateData: any = { maBNHIS: maHIS, daDon: true };
        if (hasSurgery) {
          if (ngayMo) {
            updateData.ngayMoThucTe = new Date(ngayMo);
          } else if (!p.ngayMoThucTe) {
            updateData.ngayMoThucTe = new Date();
          }

          const moDate = ngayMo ? new Date(ngayMo) : (p.ngayMoThucTe ? new Date(p.ngayMoThucTe) : null);
          const khamDateStr = p.buoiKham?.ngayKham;
          const khamDate = khamDateStr ? new Date(khamDateStr) : null;

          let isPriorSurgery = false;
          if (moDate && khamDate) {
            const dMo = new Date(moDate.getFullYear(), moDate.getMonth(), moDate.getDate()).getTime();
            const dKham = new Date(khamDate.getFullYear(), khamDate.getMonth(), khamDate.getDate()).getTime();
            if (dMo < dKham) {
              isPriorSurgery = true;
            }
          }

          if (isPriorSurgery) {
            updateData.trangThaiDieuTri = "Đã mổ trước đây";
            updateData.trangThai = "DaMoTruocDay";
          } else {
            updateData.trangThaiDieuTri = "Đã mổ";
            updateData.trangThai = "DaMoHauPhau";
          }
          updateData.followUpStatus = "Đã chốt";
        }
        if (soTienThucThu != null && soTienThucThu > 0) {
          updateData.soTienThucThu = soTienThucThu;
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
        hsba.Ngayvao as ngayVao,
        hsba.Ngayra as ngayRa,
        hsba.Chandoan_Ravien as chanDoanRavien,
        hsba.Chandoan_Vaovien as chanDoanVaovien,
        bm.Ngay as ngayKham,
        bm.BsDieutri as bsDieuTri,
        bm.ChandoanChinh as chanDoanBM,
        (
          SELECT ISNULL(SUM(ISNULL(TRY_CAST(pt.Thucthu AS bigint), 0)), 0)
          FROM PhieuthuDichvu pt WITH (NOLOCK)
          WHERE pt.Mabenhnhan = c.Ma
            AND NOT (CAST(pt.Trangthai AS nvarchar(50)) IN (N'Đã_Hủy', N'Đã hủy', '2'))
        ) as tongThucThu
      FROM [${tableName}] c WITH (NOLOCK)
      LEFT JOIN Noitru_HSBA hsba WITH (NOLOCK) ON c.Ma = hsba.MaBenhnhan
      LEFT JOIN BN_Master bm WITH (NOLOCK) ON c.Ma = bm.MaBN
      WHERE ${whereSql}
      ORDER BY hsba.Ngayvao DESC, bm.Ngay DESC
    `;

    const res = await req.query(query);
    const rows = res.recordset || [];

    const mapped = [];
    for (const r of rows) {
      const maHIS = String(r.maHIS || "").trim();
      const revVal = await fetchHisRevenue(pool, maHIS);
      const surgDetail = await fetchHisSurgeryDetail(pool, maHIS);

      const ngayMoRaw = surgDetail?.ngayMo || r.ngayVao || r.ngayRa || r.ngayKham;
      const ngayMo = ngayMoRaw ? new Date(ngayMoRaw).toISOString() : null;
      const ngayKham = r.ngayKham ? new Date(r.ngayKham).toISOString() : null;
      const chanDoan = r.chanDoanRavien || r.chanDoanVaovien || r.chanDoanBM || "";
      const soTienThucThu = revVal || (r.tongThucThu != null && Number(r.tongThucThu) > 0 ? Number(r.tongThucThu) : null);
      const hasSurgery = Boolean(surgDetail?.hasSurgery || r.ngayVao || r.ngayRa || (soTienThucThu != null && soTienThucThu > 0));

      mapped.push({
        maHIS,
        hoTen: String(r.hoTen || "").trim(),
        namSinh: String(r.namSinh || "").trim(),
        cccd: String(r.cccd || "").trim(),
        bhyt: String(r.bhyt || "").trim(),
        sdt: String(r.sdt || "").trim(),
        diaChi: String(r.diaChi || "").trim(),
        ngayMo,
        ngayKham,
        khoaMo: "KMTH",
        chanDoan,
        bsDieuTri: r.bsDieuTri || "",
        soTienThucThu,
        tenDichVu: surgDetail?.tenDichVu || null,
        loaiPhauThuat: surgDetail?.loaiPhauThuat || null,
        hasSurgery,
      });
    }
    return mapped;
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
