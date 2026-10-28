import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { broadcastEvent } from "@/lib/events";
import { DOT_KHAM_DA_XOA } from "@/lib/dotKham";
import { DOT_MO_KHOA, duocSuaSauNgayKham } from "@/lib/khoaSua";

/**
 * Mở khoá / khoá lại đợt khám đã qua ngày — chỉ Quản trị viên.
 * Body: { moKhoa: boolean }. Mở khoá → người có quyền sửa được phiếu khám & thông tin đợt như lúc chưa qua ngày.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!duocSuaSauNgayKham(session.user.role))
    return NextResponse.json({ error: "Chỉ Quản trị viên được mở / khoá đợt khám" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const moKhoa = Boolean(body.moKhoa);

  try {
    const prisma = getPrisma();
    const bk = await prisma.buoiKham.findUnique({ where: { id }, select: { id: true, coSoId: true, trangThai: true } });
    if (!bk || bk.trangThai === DOT_KHAM_DA_XOA)
      return NextResponse.json({ error: "Không tìm thấy đợt khám (có thể đã bị xoá)" }, { status: 404 });

    // Quản trị viên đơn vị chỉ thao tác đợt của đơn vị mình
    if (!can(session.user.role, "admin.masterdata")) {
      const coSo = await getWorkingCoSoId(session);
      if (coSo && bk.coSoId !== coSo)
        return NextResponse.json({ error: "Bạn chỉ được mở / khoá đợt khám thuộc đơn vị của mình" }, { status: 403 });
    }

    const data = await prisma.buoiKham.update({
      where: { id },
      data: { trangThai: moKhoa ? DOT_MO_KHOA : "active" },
      select: { id: true, coSoId: true, trangThai: true },
    });
    await audit(session.user.id, "BuoiKham", id, "sua", { thaoTac: moKhoa ? "Mở khoá đợt khám" : "Khoá lại đợt khám", trangThai: data.trangThai });
    broadcastEvent({ type: "buoikham_change", action: "update", coSoId: data.coSoId, buoiKhamId: id });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}
