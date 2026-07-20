import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const data = await getPrisma().buoiKham.findUnique({
      where: { id },
      include: { coSo: true },
    });
    if (!data) return NextResponse.json({ error: "Không tìm thấy đợt khám" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "buoikham.manage"))
    return NextResponse.json({ error: "Bạn không có quyền chỉnh sửa đợt khám" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { xa, diaDiem, ghiChu, ngayKham, bacSiKham } = body;

    const existing = await getPrisma().buoiKham.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Không tìm thấy đợt khám" }, { status: 404 });

    const updateData: any = {};
    if (xa !== undefined) updateData.xa = xa;
    if (diaDiem !== undefined) updateData.diaDiem = diaDiem;
    if (ghiChu !== undefined) updateData.ghiChu = ghiChu || null;
    if (ngayKham !== undefined) updateData.ngayKham = new Date(ngayKham);
    if (bacSiKham !== undefined) updateData.bacSiKham = bacSiKham?.trim() || null;

    const updated = await getPrisma().buoiKham.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "buoikham.manage"))
    return NextResponse.json({ error: "Bạn không có quyền xóa đợt khám" }, { status: 403 });

  try {
    const { id } = await params;
    const existing = await getPrisma().buoiKham.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Không tìm thấy đợt khám" }, { status: 404 });

    await getPrisma().buoiKham.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}
