import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { checkHISForPatient, appendHisNote } from "@/lib/his";
import { triggerSync } from "@/lib/syncWorker";
import { broadcastEvent } from "@/lib/events";

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
      month || (hoSo.buoiKham?.ngayKham ? new Date(hoSo.buoiKham.ngayKham).toISOString().slice(0, 7) : null),
      hoSo.sdt,
      hoSo.buoiKham?.ngayKham,
      hoSo.trangThaiDieuTri
    );

    if (!res.found) {
      return NextResponse.json({
        success: false,
        message: res.error || "Không tìm thấy thông tin bệnh nhân trên hệ thống HIS bệnh viện",
      }, { status: 404 });
    }

    /* Đã tìm thấy trên HIS -> cập nhật hồ sơ. "Đã mổ" chỉ khi có trong sổ phòng mổ sau ngày khám;
       nhập viện / có DV phẫu thuật mà chưa vào sổ là "chờ mổ" — chỉ ghi chú, không đánh dấu (xem hisCareDecision). */
    const updateData: any = { maBNHIS: res.maHIS, ...(res.capNhat || {}) };

    if (res.isDaMo && session.user.id && session.user.id !== "admin") {
      updateData.nguoiPhuTrachMa = session.user.id;
    }
    if (res.soTienThucThu != null && res.soTienThucThu > 0) {
      updateData.soTienThucThu = res.soTienThucThu;
    }
    if (res.chiTiet) {
      updateData.ghiChuMat2 = appendHisNote(hoSo.ghiChuMat2, res.chiTiet);
    }

    const updated = await prisma.hoSoBenhNhan.update({
      where: { id: hoSoId },
      data: updateData,
    });

    /* KHÔNG xoá nhật ký cuộc gọi ở đây. Lệnh cũ deleteMany({ noiDung: { startsWith: "[⚡ Đối chiếu HIS]" } })
       trên SQL Server thành LIKE '[⚡ Đối chiếu HIS]%' — ngoặc vuông là "1 ký tự bất kỳ trong nhóm" nên đã xoá
       nhầm mọi cuộc gọi mở đầu bằng Đ/H/I/S/… (vd. "Đã gọi - Đồng ý mổ") sau mỗi lần đối chiếu.
       Rác hệ thống cần dọn đã hết (0 dòng) và không còn được tạo ra. */

    // Đẩy vào hàng đợi đồng bộ Google Sheet
    try {
      await prisma.syncQueue.create({ data: { hoSoId } });
      triggerSync();
    } catch {}

    broadcastEvent({
      type: "hoso_change",
      action: "update",
      coSoId: hoSo.coSoId,
      buoiKhamId: hoSo.buoiKhamId,
      hoSoId: hoSo.id,
      data: updated,
    });

    broadcastEvent({
      type: "buoikham_change",
      action: "update",
      coSoId: hoSo.coSoId,
      buoiKhamId: hoSo.buoiKhamId,
    });

    return NextResponse.json({
      success: true,
      data: res,
      updated,
    });
  } catch (e: any) {
    console.error("HIS check route error:", e);
    // 422 thay vì 500: nginx chặn phản hồi 5xx nên người dùng không đọc được lý do lỗi HIS
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi server" }, { status: 422 });
  }
}
