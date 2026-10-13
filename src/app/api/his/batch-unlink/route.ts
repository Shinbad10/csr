import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";
import { normalizeRole } from "@/lib/permissions";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (normalizeRole(session.user.role) !== "QuanLy") {
    return NextResponse.json({ error: "Chỉ tài khoản Quản lý mới có quyền hủy liên kết HIS." }, { status: 403 });
  }

  try {
    const { buoiKhamId } = await request.json();
    if (!buoiKhamId) {
      return NextResponse.json({ error: "Vui lòng chọn đợt khám để hủy liên kết" }, { status: 400 });
    }

    const prisma = getPrisma();
    const patients = await prisma.hoSoBenhNhan.findMany({
      where: { buoiKhamId },
      select: { id: true, ghiChuMat2: true, coSoId: true },
    });

    if (patients.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy bệnh nhân nào trong đợt khám này." }, { status: 404 });
    }

    const coSoId = patients[0].coSoId;
    let unlinkedCount = 0;

    for (const p of patients) {
      const fullNote = p.ghiChuMat2 || "";
      const idx = fullNote.indexOf("[HIS]");
      const cleanNote = idx !== -1 ? fullNote.substring(0, idx).trim() : fullNote;

      await prisma.hoSoBenhNhan.update({
        where: { id: p.id },
        data: {
          maBNHIS: null,
          daDon: false,
          ngayMoThucTe: null,
          soTienThucThu: null,
          soTienBao: null,
          trangThaiDieuTri: null,
          followUpStatus: null,
          ghiChuMat2: cleanNote,
        },
      });

      /* KHÔNG xoá nhật ký cuộc gọi ở đây. Lệnh cũ deleteMany({ noiDung: { startsWith: "[⚡ Đối chiếu HIS]" } })
         trên SQL Server thành LIKE '[⚡ Đối chiếu HIS]%' — ngoặc vuông là "1 ký tự bất kỳ trong nhóm" nên đã xoá
         nhầm mọi cuộc gọi mở đầu bằng Đ/H/I/S/… (vd. "Đã gọi - Đồng ý mổ") sau mỗi lần đối chiếu.
         Rác hệ thống cần dọn đã hết (0 dòng) và không còn được tạo ra. */

      unlinkedCount++;
    }

    broadcastEvent({
      type: "hoso_change",
      action: "update",
      coSoId,
      buoiKhamId,
    });
    broadcastEvent({
      type: "buoikham_change",
      action: "update",
      coSoId,
      buoiKhamId,
    });

    return NextResponse.json({
      success: true,
      unlinkedCount,
      message: `Đã hủy liên kết HIS, xóa trạng thái Đã mổ/Đã đến và làm sạch dữ liệu cho ${unlinkedCount} bệnh nhân!`,
    });
  } catch (e: any) {
    console.error("Batch Unlink Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi server" }, { status: 500 });
  }
}
