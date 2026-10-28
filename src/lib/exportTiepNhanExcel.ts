import ExcelJS from "exceljs";
import { bhytLevel, classifyCSRNhom, fmtBuoiKhamName, parseDiag, stripDoanXeTag } from "./csr";
import { determineConciseStatus, type RutGonPatient } from "./exportRutGonExcel";

/**
 * Mẫu TIẾP NHẬN — "DANH SÁCH BỆNH CHỈ ĐỊNH PHẪU THUẬT TẦM SOÁT": mỗi đợt khám một sheet gồm
 * DANH SÁCH ĐĂNG KÝ (nhóm A) và DANH SÁCH KHÔNG ĐĂNG KÝ (nhóm B, ghi chú = lý do).
 */
export interface TiepNhanPatient extends RutGonPatient {
  buoiKhamId?: string | null;
  ngayDieuTri?: Date | string | null;
  mucHuongBHYT?: number | null;
  bhyt?: string | null;
  chanDoan?: string | null;
  chanDoanMP?: string | null;
  chanDoanMT?: string | null;
  chanDoanKhac?: string | null;
  chanDoanKhacMP?: string | null;
  chanDoanKhacMT?: string | null;
  matKham?: string | null;
  benhLy?: string | null;
  khuyenNghi?: string | null;
  huongXuTri?: string | null;
  trangThai?: string | null;
  nhanVienTuVan?: string | null;
  bacSiChiDinh?: string | null;
  diaChi?: string | null;
  xaPhuong?: string | null;
  tuVanVien?: { hoTen?: string | null } | null;
  buoiKham?: {
    id?: string;
    ngayKham?: Date | string | null;
    xa?: string | null;
    diaDiem?: string | null;
    ghiChu?: string | null;
    bacSiKham?: string | null;
  } | null;
}

const FONT = "Times New Roman";
const XANH = "FF0070C0";
const VIEN = { style: "thin" as const, color: { argb: "FF000000" } };
const VIEN_DU = { top: VIEN, bottom: VIEN, left: VIEN, right: VIEN };
const SO_COT = 14; // A..N

const ddmmyyyy = (d?: Date | string | null) => {
  if (!d) return "";
  const x = new Date(d);
  if (isNaN(x.getTime())) return "";
  return x.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
};

/** M1/2M = bệnh 2 mắt (mổ mắt 1); M1/MP, M1/MT = chỉ một mắt. */
function kyHieuMat(p: TiepNhanPatient): string {
  const mp = parseDiag(p.chanDoanMP ?? null).length > 0 || !!p.chanDoanKhacMP;
  const mt = parseDiag(p.chanDoanMT ?? null).length > 0 || !!p.chanDoanKhacMT;
  if (mp && mt) return "M1/2M";
  if (mp) return "M1/MP";
  if (mt) return "M1/MT";
  const mk = (p.matKham || "").toLowerCase();
  if (mk.includes("hai") || mk.includes("2")) return "M1/2M";
  if (mk.includes("phải")) return "M1/MP";
  if (mk.includes("trái")) return "M1/MT";
  return "";
}

const bhytPct = (p: TiepNhanPatient) => (p.mucHuongBHYT ? `${p.mucHuongBHYT}%` : bhytLevel(p.bhyt));
const namSinh = (p: TiepNhanPatient) => (p.namSinh ? String(p.namSinh) : p.ngaySinh ? String(new Date(p.ngaySinh).getFullYear()) : "");
const nguoiTuVan = (p: TiepNhanPatient) => p.nhanVienTuVan || p.tuVanVien?.hoTen || "";
const bacSi = (p: TiepNhanPatient) => p.bacSiChiDinh || p.buoiKham?.bacSiKham || "";

/** Tỉnh xuất hiện nhiều nhất ở cuối địa chỉ bệnh nhân ("…, Tỉnh Lâm Đồng" → "Lâm Đồng"). */
function tinhPhoBien(ds: TiepNhanPatient[]): string {
  const dem = new Map<string, number>();
  for (const p of ds) {
    const cuoi = (p.diaChi || "").split(",").pop()?.trim() || "";
    const t = cuoi.replace(/^(tỉnh|thành phố|tp\.?)\s+/i, "").trim();
    if (t) dem.set(t, (dem.get(t) || 0) + 1);
  }
  return [...dem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function oKe(cell: ExcelJS.Cell, canh: "left" | "center" = "center") {
  cell.border = VIEN_DU;
  cell.font = { name: FONT, size: 11 };
  cell.alignment = { vertical: "middle", horizontal: canh, wrapText: true };
}

function hangTieuDeCot(ws: ExcelJS.Worksheet, nhanTuVan: string, gopGhiChu: boolean) {
  const cot = [
    "TT", "Ngày\nđăng ký phẫu\nthuật", "Ngày\nTầm soát", "Họ & Tên BN", "Năm sinh", "Loại\nPhẫu thuật", "Mắt",
    nhanTuVan, "Bác sĩ\ntầm soát", "Thực thu\n+ BHYT", "Số điện thoại", "Địa điểm", "Tên Phường xã", "Ghi chú",
  ];
  const row = ws.addRow(gopGhiChu ? [...cot.slice(0, 11), "Ghi chú", "", ""] : cot);
  row.height = 42;
  if (gopGhiChu) ws.mergeCells(row.number, 12, row.number, SO_COT);
  row.eachCell({ includeEmpty: true }, (cell, c) => {
    if (c > SO_COT) return;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: XANH } };
    cell.font = { name: FONT, size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = VIEN_DU;
  });
}

function hangTieuDeMuc(ws: ExcelJS.Worksheet, chu: string) {
  const row = ws.addRow([chu]);
  row.height = 30;
  ws.mergeCells(row.number, 1, row.number, SO_COT);
  const c = row.getCell(1);
  c.font = { name: FONT, size: 18, bold: false };
  c.alignment = { vertical: "middle", horizontal: "center" };
  c.border = VIEN_DU;
}

function renderSheet(ws: ExcelJS.Worksheet, ds: TiepNhanPatient[]) {
  const bk = ds[0]?.buoiKham;
  ws.columns = [
    { width: 5 }, { width: 12 }, { width: 12 }, { width: 26 }, { width: 10 }, { width: 11 }, { width: 9 },
    { width: 19 }, { width: 19 }, { width: 10 }, { width: 15 }, { width: 18 }, { width: 18 }, { width: 30 },
  ];

  // Tiêu đề + thông tin đợt
  ws.mergeCells(1, 1, 1, 10);
  const t = ws.getCell(1, 1);
  t.value = "DANH SÁCH BỆNH CHỈ ĐỊNH PHẪU THUẬT TẦM SOÁT";
  t.font = { name: FONT, size: 16, bold: true, color: { argb: "FF1F3864" } };
  t.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 28;
  const thongTin: [string, string][] = [
    ["Ngày khám:", ddmmyyyy(bk?.ngayKham)],
    ["Tỉnh thành:", tinhPhoBien(ds)],
    ["Bs tư vấn:", bk?.bacSiKham || ""],
  ];
  thongTin.forEach(([nhan, gt], i) => {
    const r = 2 + i;
    ws.mergeCells(r, 2, r, 3);
    ws.mergeCells(r, 4, r, 6);
    const a = ws.getCell(r, 2);
    a.value = nhan;
    a.font = { name: FONT, size: 12, bold: true, color: { argb: "FF1F3864" } };
    a.alignment = { vertical: "middle", horizontal: "center" };
    const b = ws.getCell(r, 4);
    b.value = gt;
    b.font = { name: FONT, size: 12 };
    b.alignment = { vertical: "middle", horizontal: "left" };
    ws.getRow(r).height = 20;
  });

  const sapXep = (a: TiepNhanPatient, b: TiepNhanPatient) => (a.stt ?? 0) - (b.stt ?? 0);
  const dangKy = ds.filter((p) => classifyCSRNhom(p).isNhomA).sort(sapXep);
  const khongDangKy = ds.filter((p) => {
    const c = classifyCSRNhom(p);
    return c.hasPathology && !c.isNhomA;
  }).sort(sapXep);

  const coSo = (p: TiepNhanPatient, i: number, nhanTuVan: string) => [
    i + 1,
    ddmmyyyy(p.ngayDieuTri),
    ddmmyyyy(p.buoiKham?.ngayKham),
    (p.hoTen || "").toUpperCase().trim(),
    namSinh(p),
    "", // Loại phẫu thuật — chưa lưu trong hệ thống
    kyHieuMat(p),
    nhanTuVan,
    bacSi(p),
    bhytPct(p),
    p.sdt ? String(p.sdt).trim() : "",
  ];

  // DANH SÁCH ĐĂNG KÝ
  hangTieuDeMuc(ws, "DANH SÁCH ĐĂNG KÝ");
  hangTieuDeCot(ws, "Người tư vấn", false);
  dangKy.forEach((p, i) => {
    // Địa điểm / Tên phường xã = của đợt tầm soát mà bệnh nhân tham gia
    const row = ws.addRow([
      ...coSo(p, i, nguoiTuVan(p)),
      p.buoiKham?.diaDiem?.trim() || "",
      p.buoiKham?.xa?.trim() || p.xaPhuong || "",
      stripDoanXeTag(p.ghiChuTuVan),
    ]);
    row.height = 20;
    for (let c = 1; c <= SO_COT; c++) oKe(row.getCell(c), c === 14 ? "left" : "center");
  });

  // DANH SÁCH KHÔNG ĐĂNG KÝ
  hangTieuDeMuc(ws, "DANH SÁCH KHÔNG ĐĂNG KÝ");
  hangTieuDeCot(ws, "Tư vấn", true);
  khongDangKy.forEach((p, i) => {
    const lyDo = (p.lyDoKhongDieuTri?.trim() || determineConciseStatus(p).text || stripDoanXeTag(p.ghiChuTuVan)).toUpperCase();
    const row = ws.addRow([...coSo(p, i, nguoiTuVan(p)), lyDo, "", ""]);
    row.height = 20;
    ws.mergeCells(row.number, 12, row.number, SO_COT);
    for (let c = 1; c <= SO_COT; c++) oKe(row.getCell(c));
  });

  ws.views = [{ state: "frozen", ySplit: 0, showGridLines: true }];
  ws.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
}

/** Tên sheet Excel hợp lệ (≤ 31 ký tự, không : \ / ? * [ ]) và không trùng. */
function tenSheet(ten: string, daDung: Set<string>): string {
  const goc = (ten || "Dot kham").replace(/[:\\/?*[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 31) || "Dot kham";
  let ket = goc;
  for (let i = 2; daDung.has(ket.toLowerCase()); i++) {
    const hau = ` (${i})`;
    ket = goc.slice(0, 31 - hau.length) + hau;
  }
  daDung.add(ket.toLowerCase());
  return ket;
}

/** Mỗi đợt khám một sheet (xuất một đợt → một sheet). */
export async function buildTiepNhanExcelWorkbook(patients: TiepNhanPatient[]): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  const theoDot = new Map<string, TiepNhanPatient[]>();
  for (const p of patients) {
    const k = p.buoiKhamId || p.buoiKham?.id || "";
    if (!theoDot.has(k)) theoDot.set(k, []);
    theoDot.get(k)!.push(p);
  }
  // Đợt theo ngày khám tăng dần
  const cacDot = [...theoDot.values()].sort(
    (a, b) => new Date(a[0]?.buoiKham?.ngayKham || 0).getTime() - new Date(b[0]?.buoiKham?.ngayKham || 0).getTime()
  );
  const daDung = new Set<string>();
  for (const ds of cacDot) {
    const ws = wb.addWorksheet(tenSheet(fmtBuoiKhamName(ds[0]?.buoiKham), daDung));
    renderSheet(ws, ds);
  }
  if (cacDot.length === 0) renderSheet(wb.addWorksheet("Danh sach"), []);
  return wb;
}
