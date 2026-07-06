import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { triggerSync } from "@/lib/syncWorker";

// UC-04: thêm dòng nhật ký theo dõi cho hồ sơ nhóm B.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "hoso.followup"))
    return NextResponse.json({ error: "Bạn không có quyền theo dõi" }, { status: 403 });

  try {
    const { hoSoId, noiDung, followUpStatus } = await request.json();
    if (!hoSoId || !noiDung?.trim()) return NextResponse.json({ error: "Thiếu nội dung" }, { status: 400 });
    const prisma = getPrisma();
    const log = await prisma.nhatKyTheoDoi.create({
      data: { hoSoId, ngay: new Date(), nguoiGoiMa: session.user.id, noiDung: noiDung.trim() },
    });
    if (followUpStatus) await prisma.hoSoBenhNhan.update({ where: { id: hoSoId }, data: { followUpStatus, nguoiPhuTrachMa: session.user.id } });
    await prisma.syncQueue.create({ data: { hoSoId } });
    triggerSync(); // đẩy Sheet ngay, không chặn response
    return NextResponse.json(log);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}
