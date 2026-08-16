import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { broadcastEvent } from "@/lib/events";
import { phaseOf } from "@/lib/csr";

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

    const phase = phaseOf(existing.ngayKham);
    if (phase.key === "DaKetThuc") {
      return NextResponse.json({ error: "Đợt khám đã kết thúc, không thể chỉnh sửa thông tin" }, { status: 400 });
    }

    const updateData: any = {};
    if (xa !== undefined) updateData.xa = xa;
    if (diaDiem !== undefined) updateData.diaDiem = diaDiem;
    if (ghiChu !== undefined) updateData.ghiChu = ghiChu || null;
    if (ngayKham !== undefined) updateData.ngayKham = new Date(ngayKham);
    if (bacSiKham !== undefined) {
      const trimmed = bacSiKham?.trim() || null;
      updateData.bacSiKham = trimmed;

      if (trimmed) {
        const docNames = trimmed.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean);
        for (const docName of docNames) {
          const existingUser = await getPrisma().nguoiDungCSR.findFirst({
            where: { hoTen: { equals: docName } },
          });
          if (!existingUser) {
            const cleanName = docName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            const rand = Math.random().toString(36).slice(2, 6);
            const maNV = `BS-${Date.now().toString().slice(-6)}-${rand}`.toUpperCase();
            const tenDangNhap = `bs_${cleanName || "user"}_${rand}`.slice(0, 50);
            await getPrisma().nguoiDungCSR.create({
              data: {
                maNV,
                maHIS: null,
                hoTen: docName,
                vaiTro: "BacSi",
                coSoId: existing.coSoId,
                tenDangNhap,
                matKhauHash: "CSR_LOCAL_CREATED",
                trangThai: "active",
              },
            }).catch((err) => console.error("Auto create doctor error:", err));
          }
        }
      }
    }

    const updated = await getPrisma().buoiKham.update({
      where: { id },
      data: updateData,
      include: { coSo: true, _count: { select: { hoSo: true } } },
    });

    broadcastEvent({
      type: "buoikham_change",
      action: "update",
      coSoId: updated.coSoId,
      buoiKhamId: id,
      data: updated,
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

    broadcastEvent({
      type: "buoikham_change",
      action: "delete",
      coSoId: existing.coSoId,
      buoiKhamId: id,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}
