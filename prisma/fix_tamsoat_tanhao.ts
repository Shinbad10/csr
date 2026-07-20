/**
 * FIX script: Xóa và re-import đúng toàn bộ bệnh nhân TSTH-TH2024
 * Sửa 2 vấn đề:
 *  1. CĐ trống → benhLy="Chưa phát hiện bất thường" + trangThai="DaKham"
 *  2. chanDoanKhac chia rõ theo mắt: "MT: Đục TTT | MP: Mộng"
 *
 * Chạy: npx tsx prisma/fix_tamsoat_tanhao.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";

function parse(url: string) {
  const m = url.match(/sqlserver:\/\/([^;:]+)(?::(\d+))?;?(.*)/)!;
  const p: Record<string, string> = {};
  m[3].split(";").forEach((x) => { const [k, v] = x.split("="); if (k && v) p[k.trim().toLowerCase()] = v.trim(); });
  return { server: m[1], port: m[2] ? +m[2] : 1433, database: p["database"], user: p["user"], password: p["password"], options: { encrypt: p["encrypt"] === "true", trustServerCertificate: p["trustservercertificate"] === "true" } };
}

function gioiTinh(hoTen: string): string {
  return hoTen.toUpperCase().includes("THỊ") ? "Nữ" : "Nam";
}

function parseNgaySinh(raw: string): { ngaySinh: Date | null; namSinh: number | null } {
  if (!raw || !raw.trim()) return { ngaySinh: null, namSinh: null };
  if (/^\d{4}$/.test(raw.trim())) return { ngaySinh: null, namSinh: parseInt(raw.trim()) };
  const parts = raw.trim().split("/");
  if (parts.length === 3) {
    const [d, mo, y] = parts.map(Number);
    if (y && mo >= 1 && mo <= 12 && d >= 1) {
      const safeDay = Math.min(d, new Date(y, mo, 0).getDate());
      return { ngaySinh: new Date(y, mo - 1, safeDay), namSinh: y };
    }
    if (y) return { ngaySinh: null, namSinh: y };
  }
  return { ngaySinh: null, namSinh: null };
}

/**
 * Phân tích cột CĐ → chanDoan (JSON array chuẩn) + chanDoanKhac (chia rõ từng mắt)
 *
 * Format chanDoanKhac: "2M: Đục TTT"  |  "MT: Đục TTT | MP: Mộng"  |  "2M: Đục TTT; Hẹn BS Kiền"
 *
 * Ghi chú mắt:
 *  2M  → cả hai mắt
 *  MT  → mắt trái
 *  MP  → mắt phải
 *  (không tiền tố) → 2M (mặc định)
 *
 * Bệnh lý:
 *  Đ   → Đục thủy tinh thể (viết tắt: Đục TTT)
 *  M   → Mộng
 *  BS/BSK → Hẹn BS Kiền (ghi vào extras)
 */
interface ParsedCD {
  chanDoan: string;       // JSON array chuẩn: ["Đục thủy tinh thể","Mộng"]
  chanDoanKhac: string | null; // "MT: Đục TTT | MP: Mộng; Hẹn BS Kiền"
  benhLy: string;         // "Nghi ngờ bệnh lý" | "Chưa phát hiện bất thường"
}

function parseChanDoan(raw: string): ParsedCD {
  const EMPTY: ParsedCD = {
    chanDoan: "[]",
    chanDoanKhac: null,
    benhLy: "Chưa phát hiện bất thường",
  };
  if (!raw || !raw.trim()) return EMPTY;

  // Tách nhiều chẩn đoán bằng dấu phẩy
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);

  const condSet = new Set<string>(); // tập chẩn đoán chuẩn (không trùng)
  const eyeParts: string[] = [];    // "2M: Đục TTT" | "MT: Mộng"
  const extras: string[] = [];      // "Hẹn BS Kiền"

  for (const part of parts) {
    const u = part.toUpperCase().replace(/[\s()]/g, "");

    // Xác định mắt
    let eye = "2M";
    if (/^MT/.test(u)) eye = "MT";
    else if (/^MP/.test(u)) eye = "MP";

    // Đục thủy tinh thể
    if (u.includes("Đ") || u.includes("D\u0110")) {
      condSet.add("Đục thủy tinh thể");
      eyeParts.push(`${eye}: Đục TTT`);
    }

    // Mộng: kết thúc bằng M (MTM, MPM, 2MM) hoặc phần tách riêng là M
    if (/M$/.test(u) && !/^2M[ĐD]/.test(u)) {
      condSet.add("Mộng");
      eyeParts.push(`${eye}: Mộng`);
    }

    // Hẹn BS Kiền
    if (u.includes("BS") || u.includes("BSK")) {
      if (!extras.includes("Hẹn BS Kiền")) extras.push("Hẹn BS Kiền");
    }
  }

  if (condSet.size === 0 && extras.length === 0) return EMPTY;

  const chanDoan = JSON.stringify([...condSet]);
  const eyeStr = eyeParts.join(" | ");
  const chanDoanKhac = [eyeStr, ...extras].filter(Boolean).join("; ") || null;

  return {
    chanDoan,
    chanDoanKhac,
    benhLy: condSet.size > 0 ? "Nghi ngờ bệnh lý" : "Chưa phát hiện bất thường",
  };
}

function parseBHYT(raw: string): number | null {
  const n = parseInt(raw.replace("?", "").trim());
  return (n === 100 || n === 95 || n === 80) ? n : null;
}

/** Lấy phần số điện thoại đầu tiên, bỏ ghi chú thêm ("0945... con" → "0945...") */
function parseSdt(raw: string): string | null {
  const m = raw.trim().match(/^(0\d{9,10})/);
  return m ? m[1] : (raw.trim() || null);
}

function genMaBN(stt: number): string {
  return `BT-TSTH-${String(stt).padStart(3, "0")}`;
}

// ─────────────────────────────────────────────────────────────────
//  Raw data [stt, hoTen, namSinhRaw, chanDoanRaw, bhytRaw, sdtRaw]
//  Bổ sung thêm hàng ở đây nếu có thêm data
// ─────────────────────────────────────────────────────────────────
const RAW: [number, string, string, string, string, string][] = [
  [1,"NGUYỄN THỊ NGỌC EM","25/08/1952","","",""],
  [2,"NGUYỄN THỊ BA","16/05/1947","","",""],
  [3,"TRẦN THỊ ĐẸP","03/06/1949","","",""],
  [4,"LÊ THỊ LẼ","29/06/1949","2MĐ","100","0768842371"],
  [5,"HỒ VĂN XE","12/07/1952","MTĐ","100","0906392207"],
  [6,"NGUYỄN VĂN NHÁNH","10/10/1949","2MĐ","100",""],
  [7,"ĐOÀN THỊ VẸN","07/12/1972","","",""],
  [8,"LÊ VĂN RÉP","24/03/1945","","",""],
  [9,"PHẠM THỊ ĐẸP","12/05/1965","MPĐ","100","0945404533"],
  [10,"TRỊNH THỊ LẠC","07/07/1970","","",""],
  [11,"LÊ THỊ REN","07/08/1950","2MĐ","100","0353653703"],
  [12,"NGUYỄN THỊ NỚP","12/11/1951","2MĐ","100",""],
  [13,"NGUYỄN THỊ BÌNH","","","",""],
  [14,"NGUYỄN VĂN TUẤN","19/02/1954","2MĐ","100","0378165471"],
  [15,"NGUYỄN THỊ TIẾM","15/12/1949","","",""],
  [16,"HUỲNH THỊ HỒNG","16/02/1958","","",""],
  [17,"BÙI VĂN CỬNG","03/03/1953","2MĐ","100","0348152062"],
  [18,"LÊ THỊ MAI","01/01/1947","2MĐ","100","0368348104"],
  [19,"PHẠM VĂN MINH","27/07/1957","","",""],
  [20,"DANH ĐÈO","20/12/1981","","",""],
  [21,"TRẦN THỊ CHẮN","01/01/1963","","",""],
  [22,"NGUYỄN THỊ CHANH","05/07/1947","2MĐ","100","0356046589"],
  [23,"NGUYỄN NGỌC RE","10/10/1962","2MĐ","100","0917641933"],
  [24,"LÊ VĂN ĐỠ","27/10/1963","","",""],
  [25,"TRỊNH VĂN NHA","04/06/1964","","",""],
  [26,"NGÔ THỊ THÚY","20/12/1961","2MĐ","100",""],
  [27,"NGUYỄN VĂN LONG","05/11/1962","MPĐ","100","0358298095"],
  [28,"NGUYỄN THỊ LẠT","01/08/1958","2MĐ","100","0358279304"],
  [29,"NGUYỄN VĂN SẾT","24/04/1941","","",""],
  [30,"ĐẶNG THỊ RỈ","15/07/1939","","",""],
  [31,"NGUYỄN THỊ ĐẸP","16/01/1952","2MĐ","100",""],
  [32,"NGUYỄN THỊ PHƯƠNG","13/05/1972","","",""],
  [33,"TRẦN THỊ KIM QUYÊN","30/10/1980","","",""],
  [34,"NGÔ THỊ QUYÊN","01/02/1943","","",""],
  [35,"HUỲNH TẤN THANH","07/12/1980","","",""],
  [36,"NGUYỄN THỊ TRÚC","28/08/1990","","",""],
  [37,"ĐẶNG THỊ HOÀNG","28/08/1971","2MĐBS","",""],
  [38,"NGUYỄN THỊ HẠNH","01/01/1948","2MĐ","100","0366227834"],
  [39,"BÙI HỮU TÀI","13/10/1986","","",""],
  [40,"PHẠM THỊ LIÊN","","2MĐ","100",""],
  [41,"TRẦN QUỐC TUẤN","01/01/1972","","",""],
  [42,"NGUYỄN THỊ TƯỜNG","05/02/1962","","",""],
  [43,"PHAN VĂN KHẢI","1965","2MĐ","100","0365225185"],
  [44,"LÊ THỊ THANH THỦY","15/08/1972","2MĐ","KBH",""],
  [45,"LÊ THỊ DIỆU","20/20/1975","2MĐ","100?","0372717423"],
  [46,"NGUYỄN THỊ LỆ","15/08/1955","","",""],
  [47,"HÀ THỊ LIÊN","06/01/1956","2MĐ","100",""],
  [48,"LÊ THỊ LEM","15/08/1949","2MĐ","100","0372410100"],
  [49,"NGUYỄN THỊ HIỀN","21/02/1990","","",""],
  [50,"LÊ THỊ ÁNH","15/01/1944","2MĐ","100",""],
  [51,"LÂM THỊ ĐẸP","1958","2MĐ","100",""],
  [52,"NGUYỄN THỊ XUÂN","07/05/1950","","",""],
  [53,"NGUYỄN THỊ TRẮC","16/02/1962","","",""],
  [54,"NGUYỄN VĂN BÉ NĂM","20/12/1968","2MĐ","100",""],
  [55,"NGUYỄN HOÀNG DÂN","09/06/1967","2MĐ(BSK)","100","0335429889"],
  [56,"TRẦN THỊ KIM DUNG","18/08/1985","","",""],
  [57,"NGUYỄN THỊ XUÂN","1945","MPĐ","100","0868524638"],
  [58,"NGUYỄN VĂN ĐIỆP","01/03/1953","2MĐ","100","0379480576"],
  [59,"NGUYỄN VĂN DŨNG","02/03/1962","2MĐ","100","0327420965"],
  [60,"NGUYỄN THỊ TUYẾT","15/07/1961","2MĐ","100",""],
  [61,"ĐỖ THỊ THỦY","12/03/1958","2MĐ","100","0357409054"],
  [62,"HUỲNH THỊ TUYẾT","15/07/1962","2MĐ","100",""],
  [63,"PHẠM THỊ HỮU TÂM","","","",""],
  [64,"NGUYỄN VĂN HỒNG","07/03/1964","2MĐ","100","0352615674"],
  [65,"PHẠM THỊ RO","1967","2MĐ","100","0792195088"],
  [66,"CHÂU VĂN LƯ","15/02/1957","MPĐ","100","0398452464"],
  [67,"NGUYỄN THỊ CHIẾN","18/04/1961","2MĐ","100",""],
  [68,"PHẠM TRUNG HIẾU","14/06/1962","2MĐ","100",""],
  [69,"NGUYỄN THỊ PHƯỢNG","07/03/1963","2MĐ","100","0834397205"],
  [70,"NGUYỄN THỊ MỨC","05/05/1959","MTĐ","100",""],
  [71,"LÊ THỊ PHẤN","08/04/1960","2MĐ","100",""],
  [72,"NGUYỄN VĂN CHÂU","20/12/1955","2MĐ","100",""],
  [73,"NGUYỄN THỊ LO","10/04/1954","2MĐ","100",""],
  [74,"NGUYỄN VĂN CHÍNH","01/12/1956","","",""],
  [75,"NGUYỄN THỊ TO","10/10/1957","","",""],
  [76,"ĐOÀN THỊ CA","09/10/1949","","",""],
  [77,"NGUYỄN THỊ THU","01/01/1973","","",""],
  [78,"VÕ THỊ TUYẾT","29/12/1974","","",""],
  [79,"NGUYỄN THỊ ĐỐ","07/08/1947","2MĐ","HH",""],
  [80,"TRẦN KHẮC ƯU","15/10/1954","2MĐ","100","0365885315"],
  [81,"NGUYỄN THỊ DỢT","30/10/1954","2MĐ","100",""],
  [82,"NGUYỄN THỊ LIÊN","24/07/1950","2MĐ","100",""],
  [83,"ĐẶNG THỊ BÉ","09/04/1945","","",""],
  [84,"CHÂU THỊ CẦM","06/10/1958","","",""],
  [85,"NGUYỄN THỊ BÉ TƯ","","","",""],
  [86,"NGUYỄN THỊ PHA","1967","2MĐ","100","0375522183"],
  [87,"TRẦN THỊ NHÀNH","01/04/1960","2MĐ","100","0382153883"],
  [88,"TRẦN THỊ ĐẸP","1961","2MĐ","80",""],
  [89,"NGUYỄN THỊ CẨM","01/03/1947","2MĐ","100","0394376949"],
  [90,"NGUYỄN VĂN BÊN","21/12/1954","","100",""],
  [91,"PHAN THỊ HÀ","1956","2MĐBS","",""],
  [92,"ĐẶNG THỊ HÀ","10/08/1972","2MĐ","100",""],
  [93,"NGUYỄN VĂN DỨT","12/02/1970","2MĐ","100","0339562685"],
  [94,"TRẦN NGỌC NHÂN","05/06/1976","","",""],
  [95,"NGUYỄN VĂN RÓT","15/07/1970","2MĐ, MTM","100","0334483115"],
  [96,"NGUYỄN THỊ NHIỀU","20/10/1955","MPĐBS","",""],
  [97,"NGUYỄN THỊ HOÀNG","08/08/1948","MPĐ","100",""],
  [98,"HUỲNH VĂN KHỞI","10/05/1955","2MĐBS","",""],
  [99,"NGUYỄN THỊ LIÊN","16/09/1967","","",""],
  [100,"PHẠM VĂN HÙNG","07/07/1968","","",""],
  [101,"NGUYỄN THỊ BÉ CHÍNH","08/03/1978","","",""],
  [102,"HỒ THỊ NA","10/11/1968","","",""],
  [103,"TRƯƠNG THỊ TRƯNG","18/06/1968","","",""],
  [104,"NGUYỄN VĂN PHẤN","11/12/1965","MPĐ","100","0374438271"],
  [105,"PHAN VÕ CHÂU NGHI","19/10/2010","","",""],
  [106,"PHẠM VĂN HÙNG","03/03/1965","MTĐ","100",""],
  [107,"NGUYỄN VĂN SANG","16/05/1950","MPĐ","100",""],
  [108,"PHẠM VĂN RU","11/09/1963","2MĐ","KBH",""],
  [109,"NGUYỄN THỊ HỒNG THU","07/08/1963","2MĐ","100","0383356471"],
  [110,"LÊ THỊ ÁNH HỒNG","","","",""],
  [111,"PHAN THỊ THỦY","12/09/1962","2MĐ","KBH",""],
  [112,"NGUYỄN THỊ HỒNG THẮM","08/01/1976","2MĐ","100",""],
  [113,"NGUYỄN THỊ HIỀN","1953","2MĐ, 2MM","100",""],
  [114,"LÊ THỊ RI","1949","2MĐ","100","0923982691"],
  [115,"TRẦN THỊ LIÊM","","","",""],
  [116,"NGUYỄN THỊ THU","1960","2MĐ","100",""],
  [117,"NGUYỄN THỊ KIM LOAN","1954","2MĐ","100","0933018073"],
  [118,"NGUYỄN THỊ BUÔN","1957","2MĐ","100",""],
  [119,"DƯƠNG MỘNG TRINH","1985","","",""],
  [120,"HUỲNH VĂN HÙNG","1968","","",""],
  [121,"NGUYỄN THỊ TIẾN","","","",""],
  [122,"NGUYỄN THỊ TÍM","","","",""],
  [123,"ĐẶNG THỊ ĐẦM","1947","MPĐ (BSK)","100",""],
  [124,"HUỲNH THỊ ÁNH HỒNG","1958","2MĐ","100","0348031061"],
  [125,"NGUYỄN THỊ VÂN","1963","2MĐ","100","0987516455"],
  [126,"TRỊNH THỊ PHỈ","1937","","",""],
  [127,"TRẦN THỊ CHẲNG","1963","","",""],
  [128,"NGUYỄN THỊ THAI","1964","MTĐ","100","0369504547"],
  [129,"ĐOÀN THỊ VẸN","1972","","",""],
  [130,"NGUYỄN THỊ ĐÈO","1964","2MĐ","100","0328676014"],
  [131,"ĐẶNG VĂN THẢO","1954","","",""],
  [132,"NGUYỄN THỊ TỚI","1951","2MĐ","100",""],
  [133,"TRỊNH VĂN MAI","1964","","",""],
  [134,"NGUYỄN THỊ GÁI","1969","2MĐ","100","0842668289"],
  [135,"NGUYỄN THỊ NHẪN","1950","2MĐ","100",""],
  // ── Rows 136-140 từ data gốc (phần bị cắt khi paste HTML) ──
  [136,"PHẠM VĂN BÉ NĂM","1965","","",""],
  [137,"NGUYỄN THỊ NGUYỆT","1956","2MĐ","100",""],
  [138,"TRẦN THỊ BÌNH","1960","","",""],
  [139,"LÊ THỊ LINH","1967","2MĐ","100",""],
  [140,"NGUYỄN VĂN SANG","1952","MTĐ","100",""],
  // ══ Thêm hàng còn lại vào đây nếu có thêm data ══
];

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaMssql(parse(process.env.DATABASE_URL!)) });
  const buoiId = "TSTH-TH2024";

  console.log("🗑️  Xóa toàn bộ bệnh nhân cũ trong buổi khám TSTH-TH2024...");
  const del = await prisma.hoSoBenhNhan.deleteMany({ where: { buoiKhamId: buoiId } });
  console.log(`   → Đã xóa ${del.count} records`);

  let created = 0, noNamSinh = 0;

  for (const [stt, hoTen, namSinhRaw, chanDoanRaw, bhytRaw, sdtRaw] of RAW) {
    const { ngaySinh, namSinh } = parseNgaySinh(namSinhRaw);
    if (!namSinh) noNamSinh++;

    const { chanDoan, chanDoanKhac, benhLy } = parseChanDoan(chanDoanRaw);
    const mucHuongBHYT = parseBHYT(bhytRaw);
    const gt = gioiTinh(hoTen);
    const sdt = parseSdt(sdtRaw);

    // BHYT không rõ → ghi chú
    const bhytNote = bhytRaw.trim().toUpperCase();
    const bhytGhiChu = bhytNote === "KBH" ? "Không có BHYT" : bhytNote === "HH" ? "BHYT Hưu hưởng" : null;
    const chanDoanKhacFinal = [chanDoanKhac, bhytGhiChu].filter(Boolean).join("; ") || null;

    const maBN = genMaBN(stt);
    const coBenhLy = benhLy === "Nghi ngờ bệnh lý";

    await prisma.hoSoBenhNhan.create({
      data: {
        maBN, stt, buoiKhamId: buoiId, coSoId: "BT",
        hoTen: hoTen.trim(), gioiTinh: gt,
        ngaySinh, namSinh: namSinh ?? 1900,
        sdt, sdtNguoiNha: null,
        mucHuongBHYT, xaPhuong: "Tân Hào",
        // Chẩn đoán
        chanDoan,
        chanDoanKhac: chanDoanKhacFinal,
        // Bệnh lý
        benhLy,
        // Khuyến nghị chỉ cho những người CÓ bệnh lý
        khuyenNghi: coBenhLy ? "Phẫu thuật" : null,
        // Tất cả đã qua khám tầm soát → DaKham
        trangThai: "DaKham",
        createdBy: "ADMIN", syncStatus: "SYNCED",
      },
    });
    created++;

    // Log đẹp
    const cdLabel = chanDoanKhac ?? (coBenhLy ? "Có bệnh lý" : "Chưa phát hiện bệnh lý");
    process.stdout.write(
      `  [${String(stt).padStart(3)}] ${hoTen.padEnd(30)} │ ${cdLabel.padEnd(30)} │ ${gt} │ ${namSinh ?? "?"}\n`
    );
  }

  console.log("\n══════════════════════════════════════════════════════════");
  console.log(`✅ Re-import xong: ${created} bệnh nhân`);
  console.log(`⚠️  Thiếu năm sinh (namSinh=1900): ${noNamSinh} — cần nhập tay`);
  console.log("══════════════════════════════════════════════════════════");
  console.log("\n📌 Ví dụ chanDoanKhac sau fix:");
  console.log("   2MĐ      → chanDoanKhac: \"2M: Đục TTT\"");
  console.log("   MTĐ      → chanDoanKhac: \"MT: Đục TTT\"");
  console.log("   2MĐ,MTM  → chanDoanKhac: \"2M: Đục TTT | MT: Mộng\"");
  console.log("   2MĐBS    → chanDoanKhac: \"2M: Đục TTT; Hẹn BS Kiền\"");
  console.log("   (trống)  → benhLy: \"Chưa phát hiện bất thường\"");

  await prisma["$disconnect"]();
}
main().catch((e) => { console.error(e); process.exit(1); });
