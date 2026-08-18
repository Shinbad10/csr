import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";
import { parseDoctorList } from "@/components/csr/DoctorAutocomplete";
import { triggerSync } from "@/lib/syncWorker";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const buoiKham = await getPrisma().buoiKham.findUnique({
      where: { id },
      include: { coSo: true },
    });

    if (!buoiKham) {
      return NextResponse.json({ error: "Không tìm thấy đợt khám" }, { status: 404 });
    }

    const teamDocs = parseDoctorList(buoiKham.bacSiKham);
    const defaultDoc = teamDocs.length > 0 ? teamDocs[0] : null;

    // Tìm tất cả các hồ sơ đang ở trạng thái Tiếp nhận (chưa khám)
    const pendingList = await getPrisma().hoSoBenhNhan.findMany({
      where: {
        buoiKhamId: id,
        trangThai: "TiepNhan",
      },
      select: { id: true, bacSiChiDinh: true },
    });

    if (pendingList.length === 0) {
      return NextResponse.json({
        message: "Không có ca nào đang chờ khám",
        updatedCount: 0,
      });
    }

    // Cập nhật hàng loạt tất cả các ca đang chờ thành Đã khám (Bình thường / Theo dõi)
    const result = await getPrisma().hoSoBenhNhan.updateMany({
      where: {
        buoiKhamId: id,
        trangThai: "TiepNhan",
      },
      data: {
        trangThai: "DaKham",
        benhSu: false,
        loaiBenhSu: "[]",
        thiLucMP: "10/10",
        thiLucMT: "10/10",
        benhLy: "Chưa phát hiện bất thường",
        chanDoanMP: "[]",
        chanDoanMT: "[]",
        chanDoan: "[]",
        huongXuTri: "Theo dõi",
        khuyenNghi: "Theo dõi",
        bacSiChiDinh: defaultDoc || undefined,
        updatedAt: new Date(),
        updatedBy: session.user.name || session.user.id,
      },
    });

    // Đẩy hàng đợi đồng bộ Google Sheet
    if (pendingList.length > 0) {
      await getPrisma().syncQueue.createMany({
        data: pendingList.map((h) => ({ hoSoId: h.id })),
      });
      triggerSync();
    }

    broadcastEvent({
      type: "buoikham_change",
      action: "update",
      coSoId: buoiKham.coSoId,
      buoiKhamId: id,
    });

    broadcastEvent({
      type: "hoso_change",
      action: "update",
      coSoId: buoiKham.coSoId,
      buoiKhamId: id,
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      message: `Đã tự động hoàn tất ${result.count} ca khám bình thường.`,
    });
  } catch (e) {
    console.error("Lỗi hoàn tất nhanh ca chờ:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi xử lý hàng loạt" },
      { status: 500 }
    );
  }
}
