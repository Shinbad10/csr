import ExcelJS from "exceljs";

export interface RutGonPatient {
  id?: string;
  stt?: number;
  hoTen: string;
  namSinh?: number | string | null;
  ngaySinh?: Date | string | null;
  sdt?: string | null;
  diemDon?: string | null;
  gioDon?: string | null;
  nhom?: string | null;
  xacNhanDieuTri?: boolean | null;
  lyDoKhongDieuTri?: string | null;
  ghiChuTuVan?: string | null;
  bhyt?: string | null;
  nhatKy?: Array<{
    noiDung: string;
    ngay?: Date | string | null;
  }>;
}

export interface BuoiKhamContext {
  xa?: string | null;
  diaDiem?: string | null;
  ngayKham?: Date | string | null;
  gioDon?: string | null;
}

export function determineConciseStatus(p: RutGonPatient): {
  text: string;
  type: "XND" | "KNM" | "HET_HAN_BH" | "OTHER" | "NONE";
} {
  const logs = p.nhatKy && p.nhatKy.length > 0
    ? [...p.nhatKy].sort((a, b) => new Date(b.ngay || 0).getTime() - new Date(a.ngay || 0).getTime())
    : [];
  const latestLog = logs[0]?.noiDung || "";

  const allText = `${latestLog} ${p.ghiChuTuVan || ""} ${p.lyDoKhongDieuTri || ""}`.toLowerCase();
  // Tra cứu cổng BHXH đã ghi thẻ hết hạn (mucHuongBHYT = 0)
  if ((p as { mucHuongBHYT?: number | null }).mucHuongBHYT === 0) return { text: "HẾT HẠN BH", type: "HET_HAN_BH" };
  if (allText.includes("hết hạn bh") || allText.includes("het han bh") || allText.includes("hết hạn") || allText.includes("het han")) {
    return { text: "HẾT HẠN BH", type: "HET_HAN_BH" };
  }

  // Phương án đã chốt trên phiếu tư vấn mà KHÔNG phải đồng ý mổ
  const daChotChuaDongY = (!!p.nhom && p.nhom !== "A") || p.xacNhanDieuTri === false;

  if (latestLog) {
    const lLower = latestLog.toLowerCase();
    if (
      lLower.includes("thuê bao") ||
      lLower.includes("thue bao") ||
      lLower.includes("không nghe máy") ||
      lLower.includes("khong nghe may") ||
      lLower === "knm"
    ) {
      return { text: "KNM", type: "KNM" };
    }
    // Phải xét PHỦ ĐỊNH trước: "Đã gọi - Không đồng ý mổ" cũng chứa cụm "đồng ý mổ"
    if (/(không|khong|chưa|chua)\s+(đồng ý|dong y)|từ chối|tu choi/.test(lLower)) {
      return { text: "Không đồng ý mổ", type: "OTHER" };
    }
    if (
      lLower.includes("hỏi lại gia đình") ||
      lLower.includes("hỏi gia đình") ||
      lLower.includes("hoi lai gia dinh") ||
      lLower.includes("hoi gia dinh")
    ) {
      return { text: "Hỏi lại gia đình", type: "OTHER" };
    }
    if (
      !daChotChuaDongY &&
      (lLower.includes("đồng ý mổ") ||
        lLower.includes("dong y mo") ||
        lLower.includes("xác nhận đi") ||
        lLower.includes("xac nhan di") ||
        lLower === "xnđ" ||
        lLower === "xnd")
    ) {
      return { text: "XNĐ", type: "XND" };
    }
  }

  if (p.nhom === "A" || p.xacNhanDieuTri === true) {
    return { text: "XNĐ", type: "XND" };
  }
  if (p.nhom === "HoiGiaDinh") {
    return { text: "Hỏi lại gia đình", type: "OTHER" };
  }
  if (p.nhom === "B") {
    return { text: p.lyDoKhongDieuTri?.trim() || "Cần suy nghĩ thêm", type: "OTHER" };
  }
  if (p.nhom === "TheoDoi") {
    return { text: "Theo dõi tại nhà", type: "OTHER" };
  }
  if (p.xacNhanDieuTri === false) {
    return { text: p.lyDoKhongDieuTri?.trim() || "Không đồng ý mổ", type: "OTHER" };
  }
  if (p.ghiChuTuVan?.trim()) {
    const gc = p.ghiChuTuVan.trim();
    const gcU = gc.toUpperCase();
    if (gcU === "XNĐ" || gcU === "XND") return { text: "XNĐ", type: "XND" };
    if (gcU === "KNM") return { text: "KNM", type: "KNM" };
    return { text: gc, type: "OTHER" };
  }

  return { text: "", type: "NONE" };
}

function renderWorksheet(
  ws: ExcelJS.Worksheet,
  title: string,
  patients: RutGonPatient[]
) {
  ws.views = [{ showGridLines: true }];

  // Row 1: Title
  ws.mergeCells("A1:E1");
  const titleCell = ws.getCell("A1");
  titleCell.value = title;
  titleCell.font = {
    name: "Arial",
    size: 16,
    bold: true,
    color: { argb: "FFFF0000" }, // Red
  };
  titleCell.alignment = {
    vertical: "middle",
    horizontal: "left",
    indent: 0.5,
  };
  ws.getRow(1).height = 36;

  // Row 2: Headers
  const headerRow = ws.getRow(2);
  headerRow.values = ["TT", "Họ & Tên BN", "Năm sinh", "Số điện thoại", "Ghi chú"];
  headerRow.height = 26;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF004B87" }, // Blue
    };
    cell.font = {
      name: "Arial",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  });

  // Column widths
  ws.columns = [
    { key: "tt", width: 8 },
    { key: "hoTen", width: 30 },
    { key: "namSinh", width: 15 },
    { key: "sdt", width: 20 },
    { key: "ghiChu", width: 20 },
  ];

  // Data rows
  patients.forEach((p, idx) => {
    const status = determineConciseStatus(p);
    const birthYear = p.namSinh
      ? String(p.namSinh)
      : p.ngaySinh
      ? String(new Date(p.ngaySinh).getFullYear())
      : "";

    const phone = p.sdt ? String(p.sdt).trim() : "";
    const nameUpper = (p.hoTen || "").toUpperCase().trim();

    const row = ws.addRow([idx + 1, nameUpper, birthYear, phone, status.text]);
    row.height = 22;

    const isYellow = status.type === "HET_HAN_BH";

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = {
        name: "Arial",
        size: 11,
        color: { argb: "FF000000" },
        bold: colNumber === 5 || isYellow,
      };

      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };

      if (colNumber === 2) {
        cell.alignment = { vertical: "middle", horizontal: "left", indent: 0.5 };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }

      if (isYellow) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFF00" }, // Bright yellow
        };
      } else if (colNumber === 5) {
        if (status.type === "XND") {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF4B084" }, // Peach / Salmon
          };
        } else if (status.type === "KNM") {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9E1F2" }, // Light Blue
          };
        }
      }
    });
  });
}

export async function buildRutGonExcelWorkbook(
  patients: RutGonPatient[],
  buoiKhamInfo?: BuoiKhamContext | null
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();

  const groups = new Map<string, RutGonPatient[]>();
  patients.forEach((p) => {
    const key = p.diemDon?.trim() || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  });

  const distinctDiemDon = Array.from(groups.keys()).filter(Boolean);

  const formatTitle = (diemDon?: string | null, gioDon?: string | null) => {
    const loc = diemDon || buoiKhamInfo?.diaDiem || buoiKhamInfo?.xa || "DANH SÁCH BỆNH NHÂN";
    const time = (gioDon || buoiKhamInfo?.gioDon || "").trim();
    if (time) {
      const cleanTime = time.toUpperCase().replace(":", "H");
      return `${loc.toUpperCase()} ĐÓN ${cleanTime}`;
    }
    return loc.toUpperCase();
  };

  if (distinctDiemDon.length <= 1) {
    const singleDiemDon = distinctDiemDon[0] || "";
    const commonGio = patients.find((p) => p.gioDon)?.gioDon || buoiKhamInfo?.gioDon;
    const title = formatTitle(singleDiemDon, commonGio);
    const sheetName = (buoiKhamInfo?.xa || singleDiemDon || "DanhSach").slice(0, 31).replace(/[:\\/?*[\]]/g, "_");
    const ws = wb.addWorksheet(sheetName || "DanhSach");
    renderWorksheet(ws, title, patients);
  } else {
    const allTitle = formatTitle(buoiKhamInfo?.diaDiem || buoiKhamInfo?.xa, buoiKhamInfo?.gioDon);
    const wsAll = wb.addWorksheet("Tất cả điểm đón");
    renderWorksheet(wsAll, allTitle, patients);

    groups.forEach((groupPatients, diemDonKey) => {
      const gDiem = diemDonKey || "Chưa xếp điểm đón";
      const gGio = groupPatients.find((p) => p.gioDon)?.gioDon || buoiKhamInfo?.gioDon;
      const gTitle = formatTitle(diemDonKey, gGio);
      const cleanSheetName = gDiem.slice(0, 30).replace(/[:\\/?*[\]]/g, "_");
      const wsGroup = wb.addWorksheet(cleanSheetName);
      renderWorksheet(wsGroup, gTitle, groupPatients);
    });
  }

  return wb;
}
