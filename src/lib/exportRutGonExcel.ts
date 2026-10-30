import ExcelJS from "exceljs";

export interface RutGonPatient {
  id?: string;
  stt?: number;
  hoTen: string;
  namSinh?: number | string | null;
  ngaySinh?: Date | string | null;
  sdt?: string | null;
  sdtNguoiNha?: string | null;
  diemDon?: string | null;
  gioDon?: string | null;
  nhom?: string | null;
  xacNhanDieuTri?: boolean | null;
  lyDoKhongDieuTri?: string | null;
  ghiChuTuVan?: string | null;
  bhyt?: string | null;
  mucHuongBHYT?: number | null;
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

/** Làm sạch số điện thoại: nếu trống hoặc chỉ toàn số 0 thì trả về chuỗi rỗng (không hiển thị số 0) */
export function cleanPhone(raw?: string | null, fallback?: string | null): string {
  const p1 = raw ? String(raw).trim() : "";
  if (p1 && !/^0+$/.test(p1)) return p1;
  const p2 = fallback ? String(fallback).trim() : "";
  if (p2 && !/^0+$/.test(p2)) return p2;
  return "";
}

/** Kiểm tra bệnh nhân có ý kiến / lý do bận việc (không đi mổ) */
export function isBanViec(p: RutGonPatient): boolean {
  const logs = p.nhatKy && p.nhatKy.length > 0
    ? [...p.nhatKy].sort((a, b) => new Date(b.ngay || 0).getTime() - new Date(a.ngay || 0).getTime())
    : [];
  const latestLog = logs[0]?.noiDung || "";
  const allText = `${p.lyDoKhongDieuTri || ""} ${p.ghiChuTuVan || ""} ${latestLog}`.toLowerCase();

  return (
    allText.includes("bận") ||
    allText.includes("ban viec") ||
    allText.includes("ban việc") ||
    allText.includes("ban ko di") ||
    allText.includes("ban k di") ||
    allText.includes("ban chua di") ||
    allText.includes("ban roi")
  );
}

/** Bệnh nhân có thẻ BHYT hết hạn (qua cổng tra cứu hoặc ghi nhận trong hồ sơ) */
export function isHetHanBHYT(p: RutGonPatient): boolean {
  if (p.mucHuongBHYT === 0) return true;
  const logs = p.nhatKy && p.nhatKy.length > 0
    ? [...p.nhatKy].sort((a, b) => new Date(b.ngay || 0).getTime() - new Date(a.ngay || 0).getTime())
    : [];
  const latestLog = logs[0]?.noiDung || "";
  const allText = `${latestLog} ${p.ghiChuTuVan || ""} ${p.lyDoKhongDieuTri || ""}`.toLowerCase();
  return (
    allText.includes("hết hạn bh") ||
    allText.includes("het han bh") ||
    allText.includes("hết hạn") ||
    allText.includes("het han")
  );
}

/** Bệnh nhân không có thẻ BHYT */
export function isKhongCoBHYT(p: RutGonPatient): boolean {
  if (isHetHanBHYT(p)) return false;
  const bhyt = (p.bhyt || "").trim();
  if (
    !bhyt ||
    bhyt === "Không có" ||
    bhyt === "0%" ||
    bhyt.toLowerCase() === "khong co" ||
    bhyt.toLowerCase().includes("không có") ||
    bhyt.toLowerCase().includes("khong co")
  ) {
    return true;
  }
  const logs = p.nhatKy && p.nhatKy.length > 0
    ? [...p.nhatKy].sort((a, b) => new Date(b.ngay || 0).getTime() - new Date(a.ngay || 0).getTime())
    : [];
  const latestLog = logs[0]?.noiDung || "";
  const allText = `${latestLog} ${p.ghiChuTuVan || ""} ${p.lyDoKhongDieuTri || ""}`.toLowerCase();
  return (
    allText.includes("không có bh") ||
    allText.includes("khong co bh") ||
    allText.includes("k có bh") ||
    allText.includes("k bhyt") ||
    allText.includes("không bhyt") ||
    allText.includes("khong bhyt")
  );
}

/** Bệnh nhân hết hạn thẻ HOẶC không có BHYT */
export function isHetHanHoacKhongBH(p: RutGonPatient): boolean {
  return isHetHanBHYT(p) || isKhongCoBHYT(p);
}

export function determineConciseStatus(p: RutGonPatient): {
  text: string;
  type: "XND" | "KNM" | "HET_HAN_BH" | "KHONG_BH" | "OTHER" | "NONE";
} {
  const isHetHan = isHetHanBHYT(p);
  const isKhongBH = isKhongCoBHYT(p);

  const logs = p.nhatKy && p.nhatKy.length > 0
    ? [...p.nhatKy].sort((a, b) => new Date(b.ngay || 0).getTime() - new Date(a.ngay || 0).getTime())
    : [];
  const latestLog = logs[0]?.noiDung || "";

  // Phương án đã chốt trên phiếu tư vấn mà KHÔNG phải đồng ý mổ
  const daChotChuaDongY = (!!p.nhom && p.nhom !== "A") || p.xacNhanDieuTri === false;

  let baseType: "XND" | "KNM" | "OTHER" | "NONE" = "NONE";
  let baseText = "";

  if (latestLog) {
    const lLower = latestLog.toLowerCase();
    if (
      lLower.includes("thuê bao") ||
      lLower.includes("thue bao") ||
      lLower.includes("không nghe máy") ||
      lLower.includes("khong nghe may") ||
      lLower === "knm"
    ) {
      baseType = "KNM";
      baseText = "KNM";
    } else if (/(không|khong|chưa|chua)\s+(đồng ý|dong y)|từ chối|tu choi/.test(lLower)) {
      baseType = "OTHER";
      baseText = "Không đồng ý mổ";
    } else if (
      lLower.includes("hỏi lại gia đình") ||
      lLower.includes("hỏi gia đình") ||
      lLower.includes("hoi lai gia dinh") ||
      lLower.includes("hoi gia dinh")
    ) {
      baseType = "OTHER";
      baseText = "Hỏi lại gia đình";
    } else if (
      !daChotChuaDongY &&
      (lLower.includes("đồng ý mổ") ||
        lLower.includes("dong y mo") ||
        lLower.includes("xác nhận đi") ||
        lLower.includes("xac nhan di") ||
        lLower === "xnđ" ||
        lLower === "xnd")
    ) {
      baseType = "XND";
      baseText = "XNĐ";
    }
  }

  if (baseType === "NONE") {
    if (p.nhom === "A" || p.xacNhanDieuTri === true) {
      baseType = "XND";
      baseText = "XNĐ";
    } else if (p.nhom === "HoiGiaDinh") {
      baseType = "OTHER";
      baseText = "Hỏi lại gia đình";
    } else if (p.nhom === "B") {
      baseType = "OTHER";
      baseText = p.lyDoKhongDieuTri?.trim() || "Cần suy nghĩ thêm";
    } else if (p.nhom === "TheoDoi") {
      baseType = "OTHER";
      baseText = "Theo dõi tại nhà";
    } else if (p.xacNhanDieuTri === false) {
      baseType = "OTHER";
      baseText = p.lyDoKhongDieuTri?.trim() || "Không đồng ý mổ";
    } else if (p.ghiChuTuVan?.trim()) {
      const gc = p.ghiChuTuVan.trim();
      const gcU = gc.toUpperCase();
      if (gcU === "XNĐ" || gcU === "XND") {
        baseType = "XND";
        baseText = "XNĐ";
      } else if (gcU === "KNM") {
        baseType = "KNM";
        baseText = "KNM";
      } else {
        baseType = "OTHER";
        baseText = gc;
      }
    }
  }

  // Nếu là bệnh nhân hết hạn BH hoặc không có BH
  if (isHetHan) {
    if (baseType === "XND") return { text: "XNĐ (Hết hạn BH)", type: "HET_HAN_BH" };
    if (baseType === "KNM") return { text: "KNM (Hết hạn BH)", type: "HET_HAN_BH" };
    return { text: "HẾT HẠN BH", type: "HET_HAN_BH" };
  }

  if (isKhongBH) {
    if (baseType === "XND") return { text: "XNĐ (Không có BH)", type: "KHONG_BH" };
    if (baseType === "KNM") return { text: "KNM (Không có BH)", type: "KHONG_BH" };
    return { text: "KHÔNG CÓ BH", type: "KHONG_BH" };
  }

  return { text: baseText, type: baseType };
}

function renderWorksheet(
  ws: ExcelJS.Worksheet,
  title: string,
  patients: RutGonPatient[]
) {
  ws.views = [{ showGridLines: true }];

  // Column widths: mở rộng cột ghi chú lên 26 để hiển thị đẹp XNĐ (Hết hạn BH)...
  ws.columns = [
    { key: "tt", width: 8 },
    { key: "hoTen", width: 30 },
    { key: "namSinh", width: 15 },
    { key: "sdt", width: 20 },
    { key: "ghiChu", width: 26 },
  ];

  // 1. Row 1: Title
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

  // Lọc bỏ bệnh nhân bận việc
  const validPatients = patients.filter((p) => !isBanViec(p));

  // Tách 2 nhóm: Có BHYT và Hết hạn / Không có BHYT (nhóm riêng)
  const groupCoBH = validPatients.filter((p) => !isHetHanHoacKhongBH(p));
  const groupKhongBH = validPatients.filter((p) => isHetHanHoacKhongBH(p));

  const renderTableSection = (list: RutGonPatient[]) => {
    // Header row
    const headerRow = ws.addRow(["TT", "Họ & Tên BN", "Năm sinh", "Số điện thoại", "Ghi chú"]);
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

    // Data rows
    list.forEach((p, idx) => {
      const status = determineConciseStatus(p);
      const birthYear = p.namSinh
        ? String(p.namSinh)
        : p.ngaySinh
        ? String(new Date(p.ngaySinh).getFullYear())
        : "";

      // Không hiển thị số 0 nếu không có SĐT
      const phone = cleanPhone(p.sdt, p.sdtNguoiNha);
      const nameUpper = (p.hoTen || "").toUpperCase().trim();

      const row = ws.addRow([idx + 1, nameUpper, birthYear, phone, status.text]);
      row.height = 22;

      const isYellow = status.type === "HET_HAN_BH";
      const isKhongBH = status.type === "KHONG_BH";

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = {
          name: "Arial",
          size: 11,
          color: { argb: "FF000000" },
          bold: colNumber === 5 || isYellow || isKhongBH,
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
            fgColor: { argb: "FFFFFF00" }, // Bright yellow cho thẻ hết hạn
          };
        } else if (isKhongBH) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFF2CC" }, // Vàng kem nhạt cho bệnh nhân không có BH
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
  };

  // Render danh sách chính (bệnh nhân có BHYT)
  if (groupCoBH.length > 0 || groupKhongBH.length === 0) {
    renderTableSection(groupCoBH);
  }

  // Render phần riêng cho bệnh nhân hết hạn hoặc không có BHYT
  if (groupKhongBH.length > 0) {
    // Khoảng cách 1 dòng trống nếu đã có bảng trước
    if (groupCoBH.length > 0) {
      const spacer = ws.addRow([]);
      spacer.height = 14;
    }

    // Banner tiêu đề nhóm riêng
    const bannerRow = ws.addRow(["BỆNH NHÂN HẾT HẠN HOẶC KHÔNG CÓ BHYT"]);
    bannerRow.height = 28;
    const rNum = bannerRow.number;
    ws.mergeCells(`A${rNum}:E${rNum}`);
    const bannerCell = ws.getCell(`A${rNum}`);
    bannerCell.font = {
      name: "Arial",
      size: 12,
      bold: true,
      color: { argb: "FFB45309" }, // Dark Amber
    };
    bannerCell.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    bannerCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF2CC" }, // Soft Amber fill
    };
    bannerCell.border = {
      top: { style: "medium", color: { argb: "FFD97706" } },
      bottom: { style: "medium", color: { argb: "FFD97706" } },
      left: { style: "medium", color: { argb: "FFD97706" } },
      right: { style: "medium", color: { argb: "FFD97706" } },
    };

    // Render bảng riêng
    renderTableSection(groupKhongBH);
  }
}

export async function buildRutGonExcelWorkbook(
  patients: RutGonPatient[],
  buoiKhamInfo?: BuoiKhamContext | null
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();

  // 1. Lọc bỏ các bệnh nhân có ý kiến bận việc ngay từ đầu
  const activePatients = patients.filter((p) => !isBanViec(p));

  const groups = new Map<string, RutGonPatient[]>();
  activePatients.forEach((p) => {
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
    const commonGio = activePatients.find((p) => p.gioDon)?.gioDon || buoiKhamInfo?.gioDon;
    const title = formatTitle(singleDiemDon, commonGio);
    const sheetName = (buoiKhamInfo?.xa || singleDiemDon || "DanhSach").slice(0, 31).replace(/[:\\/?*[\]]/g, "_");
    const ws = wb.addWorksheet(sheetName || "DanhSach");
    renderWorksheet(ws, title, activePatients);
  } else {
    const allTitle = formatTitle(buoiKhamInfo?.diaDiem || buoiKhamInfo?.xa, buoiKhamInfo?.gioDon);
    const wsAll = wb.addWorksheet("Tất cả điểm đón");
    renderWorksheet(wsAll, allTitle, activePatients);

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
