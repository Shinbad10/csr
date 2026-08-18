// Danh mục mã Cơ sở Khám chữa bệnh (CSKCB) / Nơi đăng ký ban đầu (ĐKBĐ) BHYT
// Tham chiếu Cổng Tiếp nhận Dữ liệu Giám định BHYT (BHXH Việt Nam)

export const CSKCB_MAP: Record<string, string> = {
  // Bến Tre (Mã tỉnh 83)
  "83001": "Bệnh viện Đa khoa tỉnh Bến Tre",
  "83009": "Bệnh viện Nguyễn Đình Chiểu",
  "83674": "Bệnh viện Mắt Sáng Tiền - Bến Tre",
  "83521": "Bệnh viện Lao và Bệnh phổi Bến Tre",
  "83522": "Bệnh viện Y học Cổ truyền Bến Tre",
  "83523": "Bệnh viện Tâm thần Bến Tre",
  "83002": "Trung tâm Y tế Huyện Châu Thành (Bến Tre)",
  "83003": "Trung tâm Y tế Huyện Chợ Lách",
  "83004": "Trung tâm Y tế Huyện Mỏ Cày Nam",
  "83005": "Trung tâm Y tế Huyện Mỏ Cày Bắc",
  "83006": "Trung tâm Y tế Huyện Giồng Trôm",
  "83007": "Trung tâm Y tế Huyện Bình Đại",
  "83008": "Trung tâm Y tế Huyện Ba Tri",
  "83010": "Trung tâm Y tế Huyện Thạnh Phú",
  "83011": "Trung tâm Y tế TP. Bến Tre",

  // Tiền Giang (Mã tỉnh 82)
  "82001": "Bệnh viện Đa khoa Trung tâm Tiền Giang",
  "82005": "Bệnh viện Phụ sản Tiền Giang",
  "82007": "Bệnh viện Quân y 120",
  "82015": "Bệnh viện Đa khoa Khu vực Gò Công",
  "82016": "Bệnh viện Đa khoa Khu vực Cai Lậy",

  // TP. Hồ Chí Minh (Mã tỉnh 79)
  "79001": "Bệnh viện Chợ Rẫy",
  "79008": "Bệnh viện Nhân dân 115",
  "79010": "Bệnh viện Nhân dân Gia Định",
  "79011": "Bệnh viện Đại học Y Dược TP.HCM",
  "79013": "Bệnh viện Từ Dũ",
  "79014": "Bệnh viện Hùng Vương",
  "79015": "Bệnh viện Mắt TP.HCM",
  "79016": "Bệnh viện Tai Mũi Họng TP.HCM",
  "79017": "Bệnh viện Răng Hàm Mặt TP.HCM",
  "79018": "Bệnh viện Da Liễu TP.HCM",
  "79020": "Bệnh viện Nhi Đồng 1",
  "79021": "Bệnh viện Nhi Đồng 2",
  "79457": "Bệnh viện Nhi Đồng Thành phố",
  "79022": "Bệnh viện Bệnh Nhiệt đới TP.HCM",
  "79024": "Bệnh viện Ung Bướu TP.HCM",
  "79025": "Bệnh viện Chấn thương Chỉnh hình TP.HCM",
  "79026": "Bệnh viện Bình Dân",
  "79027": "Bệnh viện Trưng Vương",
  "79028": "Bệnh viện Nguyễn Tri Phương",
  "79029": "Bệnh viện Thống Nhất",
  "79034": "Bệnh viện Quân y 175",

  // Cần Thơ (Mã tỉnh 92)
  "92001": "Bệnh viện Đa khoa Trung ương Cần Thơ",
  "92002": "Bệnh viện Đa khoa TP. Cần Thơ",
  "92008": "Bệnh viện Nhi đồng Cần Thơ",
  "92010": "Bệnh viện Trường ĐH Y Dược Cần Thơ",
  "92015": "Bệnh viện Mắt Răng Hàm Mặt Cần Thơ",

  // Hà Nội & Tuyến Trung Ương (Mã tỉnh 01)
  "01001": "Bệnh viện Bạch Mai",
  "01002": "Bệnh viện Hữu nghị Việt Đức",
  "01003": "Bệnh viện K (K1, K2, K3)",
  "01004": "Bệnh viện E",
  "01005": "Bệnh viện Nhi Trung ương",
  "01006": "Bệnh viện Phụ sản Trung ương",
  "01007": "Bệnh viện Mắt Trung ương",
  "01008": "Bệnh viện Tai Mũi Họng Trung ương",
  "01015": "Bệnh viện Việt Đức",
  "01018": "Bệnh viện Trung ương Quân đội 108",

  // Các tỉnh lân cận
  "66001": "Bệnh viện Đa khoa tỉnh Long An",
  "74001": "Bệnh viện Đa khoa tỉnh Bình Dương",
  "75001": "Bệnh viện Đa khoa tỉnh Đồng Nai",
  "84001": "Bệnh viện Đa khoa tỉnh Trà Vinh",
  "86001": "Bệnh viện Đa khoa tỉnh Vĩnh Long",
  "89001": "Bệnh viện Đa khoa tỉnh An Giang",
  "91001": "Bệnh viện Đa khoa tỉnh Kiên Giang",
  "94001": "Bệnh viện Đa khoa tỉnh Sóc Trăng",
  "95001": "Bệnh viện Đa khoa tỉnh Bạc Liêu",
  "96001": "Bệnh viện Đa khoa tỉnh Cà Mau",
};

/** Lấy tên hiển thị của Cơ sở khám chữa bệnh theo mã 5 số */
export function getTenCSKCB(ma?: string | null, tenFallback?: string | null): string {
  if (!ma) return tenFallback || "Chưa xác định";
  const clean = ma.trim();
  return CSKCB_MAP[clean] || tenFallback || `CSKCB ${clean}`;
}
