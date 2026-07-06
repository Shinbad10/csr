import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { fmtDate, parseDiag, statusOf, bhytLevel } from "@/lib/csr";

// Từ điển tên trường bằng tiếng Việt chuẩn
const FIELD_NAMES: Record<string, string> = {
  maBN: "Mã bệnh nhân",
  hoTen: "Họ và tên",
  gioiTinh: "Giới tính",
  ngaySinh: "Ngày sinh",
  namSinh: "Năm sinh",
  sdt: "Số điện thoại",
  sdtNguoiNha: "SĐT người nhà",
  cccd: "Số CCCD / Định danh",
  diaChi: "Địa chỉ cư trú",
  chanDoan: "Chẩn đoán lâm sàng",
  chanDoanKhac: "Chẩn đoán khác",
  khuyenNghi: "Khuyến nghị điều trị",
  thiLucMP: "Thị lực mắt phải",
  thiLucMT: "Thị lực mắt trái",
  nhom: "Phân nhóm điều trị",
  bhyt: "Mức hưởng BHYT",
  soTienBao: "Chi phí báo bệnh nhân",
  soTienThucThu: "Chi phí thực thu",
  trangThaiDieuTri: "Kết quả điều trị viện",
  daDon: "Trạng thái đón viện",
  ngayDieuTri: "Ngày hẹn phẫu thuật",
  ngayMoThucTe: "Ngày phẫu thuật thực tế",
  ngayTaiKham: "Ngày hẹn tái khám",
  diemDon: "Điểm đón bệnh nhân",
  gioDon: "Giờ đón bệnh nhân",
  followUpStatus: "Trạng thái theo dõi CSKH",
  ghiChuMat2: "Ghi chú nội bộ / Kết quả HIS",
  trangThai: "Trạng thái quy trình",
  maBNHIS: "Mã bệnh nhân HIS",
  hoTenHIS: "Họ tên trên HIS",
  namSinhHIS: "Năm sinh trên HIS",
  tuVanVienMa: "Tư vấn viên phụ trách",
  nguoiPhuTrachMa: "Người phụ trách CSKH",
  nguoiChotCuoiMa: "Người chốt hồ sơ",
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const prisma = getPrisma();

  try {
    const hoSo = await prisma.hoSoBenhNhan.findUnique({
      where: { id },
      include: {
        buoiKham: { include: { nguoiTaoRef: { include: { coSo: true } }, coSo: true } },
        coSo: true,
        tuVanVien: true,
        nguoiPhuTrach: true,
        nguoiChotCuoi: true,
        nhatKy: { include: { nguoiGoi: { include: { coSo: true } } }, orderBy: { ngay: "desc" } },
      },
    });

    if (!hoSo) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

    const audits = await prisma.auditLog.findMany({
      where: { bang: "HoSoBenhNhan", banGhiId: id },
      orderBy: { thoiDiem: "desc" },
    });

    // Lấy toàn bộ danh sách người dùng trong hệ thống để đối chiếu chính xác "Ai là người thao tác"
    const users = await prisma.nguoiDungCSR.findMany({
      select: { maNV: true, hoTen: true, vaiTro: true, coSo: { select: { ten: true } } },
    });
    const userMap = new Map<string, { hoTen: string; vaiTro: string; khoa: string }>();
    for (const u of users) {
      userMap.set(u.maNV, { hoTen: u.hoTen, vaiTro: u.vaiTro || "Nhân viên", khoa: u.coSo?.ten || "" });
    }
    // Cấu hình các tài khoản đặc biệt / hệ thống
    userMap.set("admin", { hoTen: "Quản trị hệ thống", vaiTro: "Quản lý", khoa: "Quản trị" });
    userMap.set("HIS", { hoTen: "Hệ thống HIS Bệnh viện", vaiTro: "Máy chủ HIS", khoa: "Đồng bộ tự động" });
    userMap.set("SYSTEM_HIS", { hoTen: "Hệ thống HIS Bệnh viện", vaiTro: "Máy chủ HIS", khoa: "Đồng bộ tự động" });
    userMap.set("system", { hoTen: "Hệ thống tự động", vaiTro: "Hệ thống", khoa: "CSR" });

    const getUserInfo = (ma?: string | null) => {
      if (!ma) return { name: "Hệ thống / CSKH", maNV: "SYSTEM", role: "Hệ thống", khoa: "", isSystem: true };
      const u = userMap.get(ma);
      if (u) {
        return {
          name: u.hoTen,
          maNV: ma,
          role: u.vaiTro,
          khoa: u.khoa,
          isSystem: ma === "HIS" || ma === "SYSTEM_HIS" || ma === "system",
        };
      }
      return { name: ma, maNV: ma, role: "Nhân viên", khoa: "", isSystem: false };
    };

    const events: Array<{
      id: string;
      time: string;
      userInfo: { name: string; maNV: string; role: string; khoa: string; isSystem: boolean };
      action: string;
      type: "create" | "clinical" | "group" | "his" | "surgery" | "log" | "edit";
      changes?: Array<{ fieldLabel: string; displayValue: string }>;
      message?: string;
      badge?: { label: string; cls: string };
    }> = [];

    // 1. Mốc Khởi tạo hồ sơ ban đầu (Luôn hiển thị chính xác người tạo từ DB)
    const creatorInfo = hoSo.buoiKham?.nguoiTaoRef
      ? {
          name: hoSo.buoiKham.nguoiTaoRef.hoTen,
          maNV: hoSo.buoiKham.nguoiTaoRef.maNV,
          role: hoSo.buoiKham.nguoiTaoRef.vaiTro || "CSKH",
          khoa: hoSo.buoiKham.nguoiTaoRef.coSo?.ten || hoSo.buoiKham.coSo?.ten || "Tiếp nhận",
          isSystem: false,
        }
      : getUserInfo(hoSo.createdBy);

    events.push({
      id: `create-${hoSo.id}`,
      time: hoSo.createdAt.toISOString(),
      userInfo: creatorInfo,
      action: "➕ Tiếp nhận & Khởi tạo hồ sơ bệnh nhân mới",
      type: "create",
      changes: [
        { fieldLabel: "Mã bệnh nhân", displayValue: hoSo.maBN },
        { fieldLabel: "STT khám", displayValue: `Số ${hoSo.stt}` },
        { fieldLabel: "Họ và tên", displayValue: hoSo.hoTen },
        { fieldLabel: "Giới tính · Tuổi", displayValue: `${hoSo.gioiTinh} · ${hoSo.namSinh ? new Date().getFullYear() - hoSo.namSinh + " tuổi" : ""}` },
        { fieldLabel: "Số điện thoại", displayValue: hoSo.sdt || hoSo.sdtNguoiNha || "Chưa cung cấp" },
        { fieldLabel: "Số CCCD", displayValue: hoSo.cccd || "Chưa cung cấp" },
        { fieldLabel: "Buổi khám", displayValue: `Xã ${hoSo.buoiKham?.xa || ""} (${fmtDate(hoSo.buoiKham?.ngayKham)})` },
        { fieldLabel: "Địa chỉ cư trú", displayValue: hoSo.diaChi || "—" },
      ],
      badge: { label: "Khởi tạo", cls: "badge-blue" },
    });

    // 2. Các nhật ký liên hệ / tương tác CSKH (từ NhatKyTheoDoi)
    for (const nk of hoSo.nhatKy) {
      const u = nk.nguoiGoi ? {
        name: nk.nguoiGoi.hoTen,
        maNV: nk.nguoiGoi.maNV,
        role: nk.nguoiGoi.vaiTro || "CSKH",
        khoa: nk.nguoiGoi.coSo?.ten || "Chăm sóc khách hàng",
        isSystem: false
      } : getUserInfo(nk.nguoiGoiMa);

      events.push({
        id: `log-${nk.id}`,
        time: nk.ngay.toISOString(),
        userInfo: u,
        action: "📞 Ghi nhận nhật ký liên hệ & CSKH",
        type: "log",
        message: nk.noiDung,
        badge: { label: "Nhật ký CSKH", cls: "badge-amber" },
      });
    }

    // 3. Lịch sử kiểm toán chi tiết (AuditLog) - Bắt mọi thao tác chỉnh sửa thực tế
    for (const a of audits) {
      // Bỏ qua log "them" vì đã có mốc Khởi tạo hồ sơ số 1 ở trên
      if (a.hanhDong === "them") continue;

      const u = getUserInfo(a.nguoiDung);
      let changesObj: Record<string, any> = {};
      try { changesObj = JSON.parse(a.thayDoi || "{}"); } catch {}

      const changedKeys = Object.keys(changesObj).filter(
        (k) =>
          !["updatedBy", "createdBy", "id", "hoSoId", "coSoId", "buoiKhamId", "stt"].includes(k) &&
          changesObj[k] !== undefined &&
          changesObj[k] !== null &&
          changesObj[k] !== ""
      );

      if (changedKeys.length === 0) continue;

      // Phân loại tự động hành động dựa trên các trường được sửa
      let actionTitle = "✏️ Cập nhật & Chỉnh sửa thông tin hồ sơ";
      let eventType: "edit" | "clinical" | "group" | "his" | "surgery" = "edit";
      let badge = { label: "Chỉnh sửa", cls: "badge-gray" };

      if (u.isSystem || changedKeys.includes("maBNHIS") || (changesObj.ghiChuMat2 && String(changesObj.ghiChuMat2).includes("[HIS]:"))) {
        actionTitle = "⚡ Đồng bộ & Đối chiếu máy chủ HIS Bệnh viện";
        eventType = "his";
        badge = { label: "⚡ HIS Bệnh viện", cls: "badge-purple" };
      } else if (changedKeys.some((k) => ["chanDoan", "khuyenNghi", "thiLucMP", "thiLucMT", "chanDoanKhac"].includes(k))) {
        actionTitle = "🩺 Khám lâm sàng & Cập nhật chỉ định y khoa";
        eventType = "clinical";
        badge = { label: "Lâm sàng", cls: "badge-teal" };
      } else if (changedKeys.some((k) => ["nhom", "soTienBao", "bhyt", "ngayDieuTri", "diemDon"].includes(k))) {
        actionTitle = "🏷️ Phân nhóm điều trị & Tư vấn BHYT / Chi phí";
        eventType = "group";
        badge = { label: changesObj.nhom ? `Nhóm ${changesObj.nhom}` : "Tư vấn BHYT", cls: changesObj.nhom === "A" ? "badge-red" : "badge-amber" };
      } else if (changedKeys.some((k) => ["trangThaiDieuTri", "ngayMoThucTe", "daDon", "soTienThucThu"].includes(k))) {
        actionTitle = "🏥 Cập nhật trạng thái điều trị nội trú / Xuất viện";
        eventType = "surgery";
        badge = { label: changesObj.trangThaiDieuTri || "Tại bệnh viện", cls: "badge-green" };
      }

      // Format đẹp từng trường thay đổi
      const formattedChanges: Array<{ fieldLabel: string; displayValue: string }> = [];
      for (const k of changedKeys) {
        const label = FIELD_NAMES[k] || k;
        let val = changesObj[k];

        if (typeof val === "boolean") val = val ? "Có / Đã hoàn tất" : "Chưa / Không";
        else if (typeof val === "number" && (k.toLowerCase().includes("sotien") || k.toLowerCase().includes("tien"))) {
          val = val.toLocaleString("vi-VN") + " VNĐ";
        } else if (k === "trangThai") {
          val = statusOf(val).label || val;
        } else if (k === "chanDoan" && typeof val === "string" && val.startsWith("[")) {
          val = parseDiag(val).join(", ") || val;
        } else if (typeof val === "string" && (val.startsWith("202") || val.startsWith("19") || val.startsWith("201")) && val.includes("T")) {
          try { val = fmtDate(val); } catch {}
        }

        formattedChanges.push({ fieldLabel: label, displayValue: String(val) });
      }

      events.push({
        id: `audit-${a.id}`,
        time: a.thoiDiem.toISOString(),
        userInfo: u,
        action: actionTitle,
        type: eventType,
        changes: formattedChanges,
        badge,
      });
    }

    // Sắp xếp giảm dần theo thời gian (mới nhất lên trên)
    events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({
      hoSo: {
        id: hoSo.id,
        maBN: hoSo.maBN,
        hoTen: hoSo.hoTen,
        gioiTinh: hoSo.gioiTinh,
        namSinh: hoSo.namSinh,
        trangThai: hoSo.trangThai,
        nhom: hoSo.nhom,
        buoiKham: hoSo.buoiKham ? { xa: hoSo.buoiKham.xa, ngayKham: hoSo.buoiKham.ngayKham } : null,
      },
      events,
    });
  } catch (e) {
    console.error("Get Patient History Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi server" }, { status: 500 });
  }
}
