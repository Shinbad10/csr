import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { checkHISForPatient, appendHisNote } from "@/lib/his";
import { triggerSync } from "@/lib/syncWorker";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { hoSoId, month } = await request.json();
    if (!hoSoId) return NextResponse.json({ error: "Thiếu ID hồ sơ" }, { status: 400 });

    const prisma = getPrisma();
    const hoSo = await prisma.hoSoBenhNhan.findUnique({
      where: { id: hoSoId },
      include: { buoiKham: true },
    });

    if (!hoSo) return NextResponse.json({ error: "Không tìm thấy hồ sơ bệnh nhân" }, { status: 404 });

    // Gọi HIS check
    const res = await checkHISForPatient(
      hoSo.coSoId,
      hoSo.hoTen,
      hoSo.namSinh,
      hoSo.cccd,
      hoSo.bhyt,
      month || (hoSo.buoiKham?.ngayKham ? new Date(hoSo.buoiKham.ngayKham).toISOString().slice(0, 7) : null)
    );

    if (!res.found) {
      return NextResponse.json({
        success: false,
        message: res.error || "Không tìm thấy thông tin bệnh nhân trên hệ thống HIS bệnh viện",
      }, { status: 404 });
    }

    // Đã tìm thấy trên HIS -> Cập nhật hồ sơ
    const updateData: any = { maBNHIS: res.maHIS };

    if (res.hasSurgery) {
      // Nhóm A hoặc Điều trị -> cập nhật trạng thái mổ
      if (hoSo.nhom === "A" || hoSo.khuyenNghi === "Phẫu thuật" || !hoSo.nhom) {
        updateData.daDon = true;
        updateData.trangThaiDieuTri = "Đã mổ";
        updateData.trangThai = "DaMoHauPhau";
        if (res.ngayMo) {
          updateData.ngayMoThucTe = new Date(res.ngayMo);
        } else if (!hoSo.ngayMoThucTe) {
          updateData.ngayMoThucTe = new Date();
        }
      }
      // Cập nhật trạng thái theo dõi
      updateData.followUpStatus = "Đã chốt";
      if (session.user.id && session.user.id !== "admin") {
        updateData.nguoiPhuTrachMa = session.user.id;
      }
      if (res.chiTiet) {
        updateData.ghiChuMat2 = appendHisNote(hoSo.ghiChuMat2, res.chiTiet);
      }
    }

    const updated = await prisma.hoSoBenhNhan.update({
      where: { id: hoSoId },
      data: updateData,
    });

    // Xoá các nhật ký liên hệ do hệ thống tự tạo nhầm vào lịch sử liên hệ khi đối chiếu HIS trước đây
    await prisma.nhatKyTheoDoi.deleteMany({
      where: {
        hoSoId,
        noiDung: { startsWith: "[⚡ Đối chiếu HIS]" },
      },
    });

    // Đẩy vào hàng đợi đồng bộ Google Sheet
    try {
      await prisma.syncQueue.create({ data: { hoSoId } });
      triggerSync();
    } catch {}

    return NextResponse.json({
      success: true,
      data: res,
      updated,
    });
  } catch (e: any) {
    console.error("HIS check route error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi server" }, { status: 500 });
  }
}
