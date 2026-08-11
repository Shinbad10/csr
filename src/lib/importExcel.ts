// Nhập danh sách bệnh nhân lịch sử từ Excel (giai đoạn chưa dùng phần mềm).
// Hàm thuần, nhận vào AOA (array-of-arrays) do phía client đọc bằng `xlsx`.
//
// Định dạng thực tế của file:
//   Trạm y tế xã Lương Hòa (Phong Mỹ cũ - Giồng Trôm cũ)   <- dòng tiêu đề khối
//   STT | Họ Tên | Năm Sinh | CĐ | BHYT | SĐT              <- dòng header
//   1   | Nguyễn Văn Thời | 20/03/1951 | ...               <- dữ liệu
//   (dòng trống)
//   Trạm y tế xã Lương Hòa (Lương Hòa cũ - Giồng Trôm cũ)  <- khối kế tiếp
//
// Một sheet chứa NHIỀU khối; mỗi khối = một đợt khám.

export type Cell = string | number | boolean | Date | null | undefined;
export type Aoa = Cell[][];

export interface ImportRow {
  /** STT trong file gốc — chỉ để đối chiếu, hệ thống tự đánh lại STT khi lưu */
  sttGoc: number | null;
  hoTen: string;
  /** ISO yyyy-mm-dd; null khi file chỉ có năm sinh */
  ngaySinh: string | null;
  namSinh: number | null;
  chanDoan: string[];
  /** Luôn giữ nguyên văn ô CĐ để không mất thông tin khi ánh xạ thiếu */
  chanDoanKhac: string;
  bacSiChiDinh: string;
  mucHuongBHYT: number | null;
  sdt: string;
  /** Cảnh báo từng dòng, hiện ở màn xem trước */
  warnings: string[];
}

export interface ImportBlock {
  /** Tên lấy từ dòng tiêu đề phía trên header */
  tieuDe: string;
  /** Dòng (0-based) của header trong sheet — để báo lỗi cho người dùng dò lại */
  headerRow: number;
  rows: ImportRow[];
  /** Dòng nằm trong khối nhưng không phải bệnh nhân (tiêu đề lạc, dòng tổng cộng…) */
  boQua: number;
}

export interface ParseResult {
  blocks: ImportBlock[];
  /** Dòng TRÔNG GIỐNG dữ liệu bệnh nhân nhưng không nằm dưới header nào —
   *  thường là bảng thiếu dòng header. Phải báo, tuyệt đối không bỏ im lặng. */
  orphanRows: number;
  /** Vài dòng mẫu để người dùng dò lại trong file */
  orphanSample: { dong: number; noiDung: string }[];
}

// ── Chuẩn hoá ô ───────────────────────────────────────────────────────────
const txt = (c: Cell): string => {
  if (c == null) return "";
  if (c instanceof Date) return c.toISOString().slice(0, 10);
  return String(c).replace(/\s+/g, " ").trim();
};

const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

/** Ngày mốc của Excel là 1899-12-30 (đã tính cả lỗi năm nhuận 1900 của Lotus). */
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const fromExcelSerial = (n: number): Date | null => {
  if (!Number.isFinite(n) || n < 1 || n > 2958465) return null;
  return new Date(EXCEL_EPOCH + Math.round(n) * 86_400_000);
};

const YEAR_MIN = 1900;
const YEAR_MAX = new Date().getFullYear();

/** Ô "Năm Sinh" có 3 dạng: ngày đầy đủ, số serial Excel, hoặc chỉ mỗi năm. */
export function parseNgaySinh(c: Cell): { ngaySinh: string | null; namSinh: number | null; warning?: string } {
  // Trống vẫn nhập được (cột namSinh cho phép NULL) — chỉ ghi chú để người dùng bổ sung sau
  if (c == null || txt(c) === "") return { ngaySinh: null, namSinh: null, warning: "Chưa có năm sinh — vẫn nhập, bổ sung sau" };

  if (c instanceof Date) {
    const y = c.getFullYear();
    return { ngaySinh: c.toISOString().slice(0, 10), namSinh: y };
  }

  if (typeof c === "number") {
    // Số 4 chữ số trong khoảng năm hợp lệ là NĂM SINH, không phải serial Excel
    if (c >= YEAR_MIN && c <= YEAR_MAX && Number.isInteger(c)) return { ngaySinh: null, namSinh: c };
    const d = fromExcelSerial(c);
    if (d) return { ngaySinh: d.toISOString().slice(0, 10), namSinh: d.getUTCFullYear() };
    return { ngaySinh: null, namSinh: null, warning: `Không đọc được năm sinh "${c}"` };
  }

  const s = txt(c);
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const day = +d, mon = +m, year = +y;
    if (mon >= 1 && mon <= 12 && day >= 1 && day <= 31 && year >= YEAR_MIN && year <= YEAR_MAX)
      return { ngaySinh: `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`, namSinh: year };
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return { ngaySinh: s, namSinh: +iso[1] };

  const yOnly = s.match(/^(\d{4})$/);
  if (yOnly && +yOnly[1] >= YEAR_MIN && +yOnly[1] <= YEAR_MAX)
    return { ngaySinh: null, namSinh: +yOnly[1] };

  return { ngaySinh: null, namSinh: null, warning: `Không đọc được năm sinh "${s}"` };
}

// ── Cột CĐ ────────────────────────────────────────────────────────────────
// MT = mắt trái · MP = mắt phải · 2M = hai mắt · M = mắt (độc nhất)
// Đ = đục thủy tinh thể · M (đứng sau) = mộng · ĐBS = đục bao sau
// "(BS.Tên)" là BÁC SĨ chỉ định — phân biệt với hậu tố BS nhờ dấu chấm.
const DUC = "Đục thủy tinh thể";
const MONG = "Mộng";
const BAO_SAU = "Đục bao sau";
const KHAC = "Khác";

/** Từ hay đi kèm mã chẩn đoán, không phải bệnh riêng — không tính là phần dư. */
const QUALIFIERS = ["kep", "doc nhat", "tu di", "1", "2", "mt", "mp"];

export function parseChanDoan(raw: string): { chanDoan: string[]; bacSi: string; residue: string } {
  let s = txt(raw);
  if (!s) return { chanDoan: [], bacSi: "", residue: "" };

  // 1. Bóc tên bác sĩ: "(BS.Kiền)" / "(BS. K)" — có dấu chấm sau BS
  let bacSi = "";
  s = s.replace(/\(\s*BS\s*\.\s*([^)]*)\)/gi, (_m, name) => {
    const n = txt(name);
    if (n && !bacSi) bacSi = `BS. ${n}`;
    return " ";
  });

  const found = new Set<string>();
  // 2. Bóc mã theo thứ tự: ĐBS trước (dài hơn) rồi mới tới Đ / M đơn
  const eat = (re: RegExp, label: string) => {
    s = s.replace(re, () => { found.add(label); return " "; });
  };
  eat(/(?:2M|MT|MP|M)\s*[ĐD]\s*BS\b/gi, BAO_SAU);
  eat(/(?:2M|MT|MP|M)\s*[ĐD](?!\p{L})/giu, DUC);
  eat(/(?:2M|MT|MP)\s*M(?!\p{L})/giu, MONG);

  // 3. Phần dư: bỏ dấu câu, số thứ tự, mũi tên và các từ bổ nghĩa đã biết
  let residue = s
    .replace(/[(),.;:\-–—>=/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (residue) {
    const kept = residue
      .split(" ")
      .filter((w) => w && !QUALIFIERS.includes(fold(w)) && !/^\d+$/.test(w));
    residue = kept.join(" ").trim();
  }
  if (residue) found.add(KHAC);

  // Giữ thứ tự ổn định để so sánh/kiểm thử dễ
  const order = [DUC, MONG, BAO_SAU, KHAC];
  return { chanDoan: order.filter((x) => found.has(x)), bacSi, residue };
}

// ── Cột BHYT ──────────────────────────────────────────────────────────────
/** "100" → 100 · "100 KC" → 100 (hậu tố bị bỏ, có cảnh báo) · "KBH"/"HH" → null */
export function parseBhyt(raw: string): { mucHuong: number | null; warning?: string } {
  const s = txt(raw);
  if (!s) return { mucHuong: null };
  const m = s.match(/(\d{2,3})/);
  if (!m) return { mucHuong: null, warning: `BHYT "${s}" không phải mức hưởng — bỏ qua` };
  const n = +m[1];
  if (![100, 95, 80].includes(n)) return { mucHuong: null, warning: `Mức hưởng "${s}" không hợp lệ — bỏ qua` };
  const extra = s.replace(m[1], "").replace(/[?\s]/g, "");
  return extra
    ? { mucHuong: n, warning: `Ghi chú BHYT "${extra}" không có chỗ lưu — chỉ giữ mức ${n}%` }
    : { mucHuong: n };
}

// ── Cột SĐT ───────────────────────────────────────────────────────────────
/** Bóc chữ số; "0865232960 tự đi" → số + cảnh báo phần chữ, "lãng tai" → không có số.
 *  Lấy CỤM số liền nhau đầu tiên có độ dài hợp lệ — không gộp tất cả chữ số trong ô,
 *  vì "96449478 (4 ngày có BH)" sẽ bị dính số 4 của phần ghi chú thành số sai. */
export function parseSdt(raw: string): { sdt: string; warning?: string } {
  const s = txt(raw);
  if (!s) return { sdt: "" };
  const groups = s.match(/\d+/g) || [];
  const phone = groups.find((g) => g.length >= 9 && g.length <= 11) || "";
  if (!phone) return { sdt: "", warning: `SĐT "${s}" không hợp lệ — để trống` };
  const rest = txt(s.replace(phone, " ").replace(/[()+\-.]/g, " "));
  return rest ? { sdt: phone, warning: `Ghi chú SĐT "${rest}" không có chỗ lưu` } : { sdt: phone };
}

/**
 * Đọc tháng từ TÊN SHEET: "Th07.2026" · "T7-2026" · "Tháng 7 2026" · "07/2026" → "2026-07".
 * File thực tế đặt mỗi tháng một sheet, nên đây là nguồn ngày đáng tin nhất.
 */
export function parseSheetMonth(sheetName: string): string {
  const s = fold(sheetName);
  // Bắt cặp số tháng–năm theo mọi kiểu phân cách; tháng có thể đứng trước hoặc sau
  const mThenY = s.match(/(?:th?a?n?g?)?\s*(\d{1,2})\s*[.\-_/ ]\s*(\d{4})/);
  if (mThenY) {
    const mo = +mThenY[1], yr = +mThenY[2];
    if (mo >= 1 && mo <= 12 && yr >= 1900 && yr <= 2200) return `${yr}-${String(mo).padStart(2, "0")}`;
  }
  const yThenM = s.match(/(\d{4})\s*[.\-_/ ]\s*(\d{1,2})/);
  if (yThenM) {
    const yr = +yThenM[1], mo = +yThenM[2];
    if (mo >= 1 && mo <= 12 && yr >= 1900 && yr <= 2200) return `${yr}-${String(mo).padStart(2, "0")}`;
  }
  return "";
}

/** Số ngày của tháng "yyyy-mm" (0 nếu chuỗi không hợp lệ). */
export function daysInMonth(ym: string): number {
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  if (!m) return 0;
  return new Date(+m[1], +m[2], 0).getDate();
}

// ── Nhận diện khối ────────────────────────────────────────────────────────
const HEADER_KEYS = { hoTen: ["ho ten", "hoten", "ho va ten"], namSinh: ["nam sinh", "ngay sinh", "namsinh"] };

/** Dòng có cả "Họ Tên" và "Năm Sinh" là header; trả về vị trí từng cột. */
function readHeader(row: Cell[]): Record<string, number> | null {
  const idx: Record<string, number> = {};
  row.forEach((c, i) => {
    const k = fold(txt(c));
    if (!k) return;
    if (HEADER_KEYS.hoTen.includes(k)) idx.hoTen = i;
    else if (HEADER_KEYS.namSinh.includes(k)) idx.namSinh = i;
    else if (k === "stt") idx.stt = i;
    else if (k === "cd" || k === "chan doan") idx.cd = i;
    else if (k === "bhyt") idx.bhyt = i;
    else if (k === "sdt" || k === "so dien thoai" || k === "dien thoai") idx.sdt = i;
  });
  return idx.hoTen != null && idx.namSinh != null ? idx : null;
}

const nonEmpty = (row: Cell[]) => row.some((c) => txt(c) !== "");

/** Dòng có ô ngày/năm sinh hợp lệ + một ô chữ dài => trông như dữ liệu bệnh nhân. */
function looksLikePatientRow(row: Cell[]): boolean {
  let hasDate = false;
  let hasName = false;
  for (const c of row) {
    const s = txt(c);
    if (!s) continue;
    if (!hasDate) {
      const r = parseNgaySinh(c);
      if (r.namSinh != null) { hasDate = true; continue; }
    }
    if (!hasName && /\p{L}/u.test(s) && s.split(" ").length >= 2 && !/^\d/.test(s)) hasName = true;
  }
  return hasDate && hasName;
}

/** Tiêu đề khối = dòng không rỗng gần nhất phía trên, bỏ qua dòng trống. */
function findTitle(aoa: Aoa, before: number): string {
  for (let j = before - 1; j >= 0 && j >= before - 3; j--) {
    const prev = aoa[j] || [];
    if (readHeader(prev)) break;
    const cells = prev.map(txt).filter(Boolean);
    if (cells.length > 0) return cells.join(" ").trim();
  }
  return "";
}

/** Đọc liên tiếp các dòng bệnh nhân từ `start` theo bộ cột `idx`. */
function collectRows(aoa: Aoa, start: number, idx: Record<string, number>, covered: boolean[]) {
  const rows: ImportRow[] = [];
  let boQua = 0;
  let maxStt = 0;
  let r = start;

  for (; r < aoa.length; r++) {
    const row = aoa[r] || [];
    if (readHeader(row)) break;                 // chạm header của khối sau
    if (!nonEmpty(row)) { covered[r] = true; continue; }

    const hoTen = txt(row[idx.hoTen]);
    const sttCell = idx.stt != null ? txt(row[idx.stt]) : "";
    const nsCell = txt(row[idx.namSinh]);

    // Dòng tiêu đề khối sau, "Tổng cộng", ghi chú lạc… không có cả STT lẫn năm sinh
    if (!hoTen || (!sttCell && !nsCell) || /^(tong|cong|ghi chu)\b/.test(fold(hoTen))) {
      covered[r] = true;
      boQua++;
      continue;
    }

    // STT tụt về 1 sau khi đã chạy cao hơn => bảng MỚI bị thiếu dòng header.
    // Không cắt ở đây thì bệnh nhân bảng sau bị gán nhầm vào đợt khám trước.
    const sttNum = /^\d+$/.test(sttCell) ? +sttCell : null;
    if (sttNum === 1 && maxStt > 1) break;
    if (sttNum != null) maxStt = Math.max(maxStt, sttNum);

    covered[r] = true;

    const warnings: string[] = [];
    const ns = parseNgaySinh(row[idx.namSinh]);
    if (ns.warning) warnings.push(ns.warning);

    const cdRaw = idx.cd != null ? txt(row[idx.cd]) : "";
    const cd = parseChanDoan(cdRaw);

    const bh = idx.bhyt != null ? parseBhyt(txt(row[idx.bhyt])) : { mucHuong: null as number | null };
    if ("warning" in bh && bh.warning) warnings.push(bh.warning);

    const ph = idx.sdt != null ? parseSdt(txt(row[idx.sdt])) : { sdt: "" };
    if ("warning" in ph && ph.warning) warnings.push(ph.warning);

    rows.push({
      sttGoc: sttNum,
      hoTen,
      ngaySinh: ns.ngaySinh,
      namSinh: ns.namSinh,
      chanDoan: cd.chanDoan,
      chanDoanKhac: cdRaw,
      bacSiChiDinh: cd.bacSi,
      mucHuongBHYT: bh.mucHuong,
      sdt: ph.sdt,
      warnings,
    });
  }

  // Dừng vì header thì hết khối; dừng vì STT reset thì còn bảng nữa ở `r`
  const restartAt = r < aoa.length && !readHeader(aoa[r] || []) && rows.length > 0 ? r : null;
  return { rows, boQua, end: r, restartAt };
}

/**
 * Tách sheet thành các khối đợt khám.
 * Hai mốc: DÒNG HEADER, và STT quay về 1 (bảng nối tiếp bị thiếu header).
 * Không phụ thuộc ô merge nên file có merge hay không đều chạy.
 */
export function parseSheet(aoa: Aoa): ParseResult {
  const blocks: ImportBlock[] = [];
  /** Đánh dấu dòng đã được một khối nào đó xử lý, để dò dòng mồ côi ở cuối */
  const covered = new Array(aoa.length).fill(false);

  for (let i = 0; i < aoa.length; i++) {
    const idx = readHeader(aoa[i] || []);
    if (!idx) continue;
    covered[i] = true;

    let cursor = i + 1;
    let titleFrom = i;                          // khối đầu lấy tiêu đề phía trên header
    let end = cursor;

    // Lặp: mỗi lần STT tụt về 1 là mở một khối mới dùng lại đúng bộ cột đó
    for (;;) {
      const { rows, boQua, end: e, restartAt } = collectRows(aoa, cursor, idx, covered);
      end = e;
      if (rows.length > 0) {
        blocks.push({
          tieuDe: findTitle(aoa, titleFrom) || `Khối dòng ${titleFrom + 1}`,
          headerRow: titleFrom,
          rows,
          boQua,
        });
      }
      if (restartAt == null) break;
      cursor = restartAt;
      titleFrom = restartAt;                    // tiêu đề nằm ngay trên bảng nối tiếp
    }

    i = end - 1;                                // nhảy tới ngay trước header kế tiếp
  }

  // Dòng giống dữ liệu bệnh nhân nhưng không nằm dưới header nào — bảng thiếu header.
  const orphanSample: { dong: number; noiDung: string }[] = [];
  let orphanRows = 0;
  for (let i = 0; i < aoa.length; i++) {
    if (covered[i]) continue;
    const row = aoa[i] || [];
    if (!nonEmpty(row) || !looksLikePatientRow(row)) continue;
    orphanRows++;
    if (orphanSample.length < 3)
      orphanSample.push({ dong: i + 1, noiDung: row.map(txt).filter(Boolean).slice(0, 4).join(" · ") });
  }

  return { blocks, orphanRows, orphanSample };
}
