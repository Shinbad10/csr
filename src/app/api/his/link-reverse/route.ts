import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { triggerSync } from "@/lib/syncWorker";
import { appendHisNote } from "@/lib/his";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const items = body.items || [body]; // hỗ trợ cả liên kết đơn hoặc danh sách nhiều BN
    const prisma = getPrisma();

    let updatedCount = 0;
    for (const item of items) {
      if (!item.hoSoId || !item.maHIS) continue;

      const hoSo = await prisma.hoSoBenhNhan.findUnique({ where: { id: item.hoSoId } });
      if (!hoSo) continue;

      const updateData: any = {
        maBNHIS: item.maHIS,
        daDon: true,
        trangThaiDieuTri: "Đã mổ",
        trangThai: "DaMoHauPhau",
        followUpStatus: "Đã chốt",
      };

      if (item.ngayMo) {
        updateData.ngayMoThucTe = new Date(item.ngayMo);
      } else if (!hoSo.ngayMoThucTe) {
        updateData.ngayMoThucTe = new Date();
      }

      const chiTiet = item.chiTiet || `Bệnh nhân phẫu thuật HIS (Mã HIS: ${item.maHIS})`;
      updateData.ghiChuMat2 = appendHisNote(hoSo.ghiChuMat2, chiTiet);

      await prisma.hoSoBenhNhan.update({
        where: { id: item.hoSoId },
        data: updateData,
      });

      // Xoá rác nhật ký liên hệ nếu có
      await prisma.nhatKyTheoDoi.deleteMany({
        where: { hoSoId: item.hoSoId, noiDung: { startsWith: "[⚡ Đối chiếu HIS]" } },
      });

      try {
        await prisma.syncQueue.create({ data: { hoSoId: item.hoSoId } });
      } catch {}

      updatedCount++;
    }

    triggerSync();

    return NextResponse.json({
      success: true,
      count: updatedCount,
    });
  } catch (e: any) {
    console.error("Link Reverse HIS Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi server" }, { status: 500 });
  }
}
