// Types và helpers thuần client/server cho Tra cứu thẻ BHYT & Giải mã QR

export interface LichSuKCBRecord {
  maThe?: string;
  hoTen?: string;
  ngayVao?: string;
  ngayRa?: string;
  tenKhoa?: string;
  maCSKCB?: string;
  tenCSKCB?: string;
  kqDieuTri?: string;
  lyDoVV?: string;
  tinhTrangRV?: string;
  loaiKCB?: string;
}

export interface LichSuKTRecord {
  userKT?: string;
  maCSKCB?: string;
  tenCSKCB?: string;
  tenCSKCB_Display?: string;
  thoiGianKT?: string;
  thongBao?: string;
}

export interface ThongTinTheBHYT {
  maThe: string;
  mucHuong: string;
  tuNgay?: string;
  denNgay?: string;
  maDKBD?: string;
  tenDKBD?: string;
  hoTen?: string;
  ngaySinh?: string;
  diaChi?: string;
  gioiTinh?: string;
  cccd?: string;
  namNamLienTuc?: string;
  maSoBHXH?: string;
  maKV?: string;
  cqBHXH?: string;
  maKetQua?: string;
  ghiChu?: string;
  dsLichSuKCB?: LichSuKCBRecord[];
  dsLichSuKT?: LichSuKTRecord[];
}

export interface KetQuaTraCuuBHYT {
  success: boolean;
  the?: ThongTinTheBHYT;
  notification?: string;
  error?: string;
  raw?: unknown;
}

export interface ParsedQRResult {
  type: "CCCD" | "BHYT" | "CARD_ONLY" | "CCCD_ONLY" | "UNKNOWN";
  cccd?: string;
  maThe?: string;
  hoTen?: string;
  ngaySinhIso?: string;
  ngaySinhDisplay?: string;
  gioiTinh?: string;
  diaChi?: string;
  soCMND?: string;
  ngayCap?: string;
  maDKBD?: string;
}

/** Chuẩn hóa ngày sinh sang định dạng dd/mm/yyyy */
export function toDobBhxh(s: string): string {
  if (!s) return "";
  const trim = s.trim();
  // Format ISO YYYY-MM-DD hoặc ISO datetime YYYY-MM-DDTHH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}/.test(trim)) {
    const [y, m, d] = trim.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  // Format 8 số ddmmyyyy
  if (/^\d{8}$/.test(trim)) {
    return `${trim.slice(0, 2)}/${trim.slice(2, 4)}/${trim.slice(4)}`;
  }
  // Format dd/mm/yyyy
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trim)) {
    const [d, m, y] = trim.split("/");
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  // Format năm yyyy
  return trim;
}

/** Giải thích mã kết quả trả về từ Cổng Giám định BHXH */
export function explainMaKetQua(maKetQua?: string | null, ghiChu?: string | null): string {
  if (ghiChu && ghiChu.trim()) {
    return ghiChu.trim();
  }
  switch (maKetQua) {
    case "000":
      return "Thẻ còn giá trị sử dụng và hợp lệ.";
    case "001":
      return "Thẻ do cơ quan BHXH khác quản lý, còn giá trị sử dụng.";
    case "002":
      return "Thẻ do cơ quan BHXH khác quản lý, đã hết hạn sử dụng.";
    case "003":
      return "Thẻ BHYT đã hết hạn sử dụng.";
    case "004":
      return "Thẻ BHYT đã bị khóa / ngưng sử dụng.";
    case "010":
      return "Không tìm thấy thông tin thẻ trên Cổng BHXH.";
    case "050":
      return "Thẻ BHYT không tồn tại hoặc chưa đến ngày có giá trị sử dụng.";
    case "051":
      return "Mã thẻ BHYT không đúng định dạng.";
    case "052":
      return "Mã thẻ BHYT không tồn tại trong hệ thống quản lý.";
    case "053":
      return "Họ và tên bệnh nhân không khớp với thông tin thẻ BHYT.";
    case "054":
      return "Ngày sinh bệnh nhân không khớp với thông tin thẻ BHYT.";
    case "501":
      return "Phiên làm việc / Token BHXH không đúng hoặc đã hết hạn.";
    case "999":
      return "Lỗi hệ thống Cổng tiếp nhận BHXH.";
    default:
      return "Không tìm thấy thông tin thẻ BHYT hợp lệ trên cổng BHXH.";
  }
}

/**
 * Tự động phục hồi chuỗi quét mã QR khi bị bộ gõ Tiếng Việt (Unikey/EVKey) làm biến dạng
 * Ví dụ: ĐN4838321436964 -> DN4838321436964, dấu | bị gõ thành \, đ thay cho 0...
 */
export function cleanMangledQR(qrData?: string | null): string {
  if (!qrData) return "";
  let str = qrData.trim().replace(/^\$|\$$/g, "").normalize("NFC");

  // 1. Nếu Unikey gõ nhầm chữ Đ ở đầu mã thẻ BHYT (VD: ĐN4838321436964 -> DN4838321436964)
  if (/^Đ[A-Z0-9]/i.test(str)) {
    str = "D" + str.slice(1);
  }

  // 2. Nếu Unikey biến dấu | thành \ hoặc / hoặc ¦ khi quét CCCD
  // Ví dụ: 083199006505\183832143\NGUYỄN VĂN A\...
  if (!str.includes("|") && /^\d{12}[\/\\¦]/.test(str)) {
    str = str.replace(/[\/\\¦]+/g, "|");
  }

  // 3. Phục hồi pipe và các trường số bị Unikey chèn tiếng Việt
  if (str.includes("|")) {
    const parts = str.split("|").map((s) => s.trim());
    // Trường 0: Số CCCD 12 số
    if (parts[0] && /^[\dđĐ]{12,14}$/i.test(parts[0])) {
      parts[0] = parts[0].replace(/đ/gi, "0").replace(/\D/g, "").slice(0, 12);
    }
    // Trường 3: Ngày sinh ddmmyyyy (8 số)
    if (parts[3] && /^[\dđĐ]{8,10}$/i.test(parts[3])) {
      parts[3] = parts[3].replace(/đ/gi, "0").replace(/\D/g, "").slice(0, 8);
    }
    str = parts.join("|");
  } else {
    // Mã thẻ BHYT đơn lẻ 15 ký tự hoặc CCCD 12 số bị biến dạng
    if (/^Đ[A-Z0-9]{14}$/i.test(str)) {
      str = "D" + str.slice(1);
    } else if (/^[\dđĐ]{12}$/i.test(str)) {
      str = str.replace(/đ/gi, "0");
    }
  }

  return str;
}

/**
 * Bộ giải mã chuỗi quét mã vạch / QR Code thông minh
 * Nhận diện chính xác CCCD/VNeID 7 trường hoặc 6 trường, thẻ BHYT có dấu |, thẻ BHYT 15 ký tự, CCCD 12 số
 */
export function parseQRData(qrData?: string | null): ParsedQRResult {
  if (!qrData) return { type: "UNKNOWN" };

  const raw = cleanMangledQR(qrData);
  if (!raw) return { type: "UNKNOWN" };

  // Trường hợp 1: Có dấu phân cách pipe "|"
  if (raw.includes("|")) {
    const parts = raw.split("|").map((p) => p.trim());
    let startIndex = 0;
    while (startIndex < parts.length && parts[startIndex] === "") startIndex++;
    const p = parts.slice(startIndex);

    // 1A. Định dạng CCCD / VNeID chuẩn BCA: Số CCCD (12 số) | Số CMND (nếu có) | Họ tên | Ngày sinh (ddmmyyyy) | Giới tính | Địa chỉ | Ngày cấp (8 số)
    if (p.length >= 5 && /^\d{12}$/.test(p[0])) {
      const cccd = p[0];
      const soCMND = p[1] || undefined;
      const hoTen = p[2] || "";
      const dobRaw = (p[3] || "").replace(/\s/g, "");
      let ngaySinhIso = "";
      let ngaySinhDisplay = "";

      if (/^\d{8}$/.test(dobRaw)) {
        const d = dobRaw.slice(0, 2);
        const m = dobRaw.slice(2, 4);
        const y = dobRaw.slice(4);
        ngaySinhIso = `${y}-${m}-${d}`;
        ngaySinhDisplay = `${d}/${m}/${y}`;
      } else if (/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(dobRaw)) {
        const [, d, m, y] = dobRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)!;
        ngaySinhIso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        ngaySinhDisplay = `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
      } else if (/^\d{4}$/.test(dobRaw)) {
        ngaySinhIso = `${dobRaw}-01-01`;
        ngaySinhDisplay = `01/01/${dobRaw}`;
      }

      const gtRaw = p[4] || "";
      const gioiTinh = /n[ữu]/i.test(gtRaw) || gtRaw === "2" ? "Nữ" : "Nam";
      const diaChi = p[5] || "";
      const ngayCap = p[6] || undefined;

      return {
        type: "CCCD",
        cccd,
        soCMND,
        hoTen,
        ngaySinhIso,
        ngaySinhDisplay,
        gioiTinh,
        diaChi,
        ngayCap,
      };
    }

    // 1B. Định dạng thẻ BHYT có dấu pipe: Mã thẻ (15 ký tự / bắt đầu bằng 2 chữ cái) | Họ tên | Ngày sinh | Giới tính | Mã CSKCB | Địa chỉ
    if (p.length >= 2 && (/^[A-Za-z]{2}\d/.test(p[0]) || p[0].length === 10 || p[0].length === 15)) {
      const maThe = p[0].toUpperCase();
      const hoTen = p[1] || "";
      const dobRaw = (p[2] || "").replace(/\s/g, "");
      let ngaySinhIso = "";
      let ngaySinhDisplay = "";

      if (/^\d{8}$/.test(dobRaw)) {
        const d = dobRaw.slice(0, 2);
        const m = dobRaw.slice(2, 4);
        const y = dobRaw.slice(4);
        ngaySinhIso = `${y}-${m}-${d}`;
        ngaySinhDisplay = `${d}/${m}/${y}`;
      } else if (/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(dobRaw)) {
        const [, d, m, y] = dobRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)!;
        ngaySinhIso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        ngaySinhDisplay = `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
      } else if (/^\d{4}$/.test(dobRaw)) {
        ngaySinhIso = `${dobRaw}-01-01`;
        ngaySinhDisplay = `01/01/${dobRaw}`;
      }

      const gtRaw = p[3] || "";
      const gioiTinh = /n[ữu]/i.test(gtRaw) || gtRaw === "2" ? "Nữ" : /nam/i.test(gtRaw) || gtRaw === "1" ? "Nam" : undefined;
      const maDKBD = p[4] || undefined;
      const diaChi = p[5] || "";

      return {
        type: "BHYT",
        maThe,
        hoTen,
        ngaySinhIso,
        ngaySinhDisplay,
        gioiTinh,
        maDKBD,
        diaChi,
      };
    }
  }

  // Trường hợp 2: Mã thẻ BHYT đơn lẻ (15 ký tự hoặc 10 số BHXH)
  if (/^[A-Za-z]{2}\d{13}$/.test(raw) || (/^[A-Za-z]{2}\d/.test(raw) && raw.length >= 10)) {
    return {
      type: "CARD_ONLY",
      maThe: raw.toUpperCase(),
    };
  }

  // Trường hợp 3: Số CCCD 12 chữ số
  if (/^\d{12}$/.test(raw)) {
    return {
      type: "CCCD_ONLY",
      cccd: raw,
    };
  }

  return { type: "UNKNOWN" };
}
