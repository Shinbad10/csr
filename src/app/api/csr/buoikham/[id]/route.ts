import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { broadcastEvent } from "@/lib/events";
import { dotBiKhoa, duocSuaSauNgayKham, THONG_BAO_KHOA } from "@/lib/khoaSua";
import { audit } from "@/lib/audit";
import { COSO_AN_TOAN } from "@/lib/safeSelect";
import { DOT_KHAM_DA_XOA } from "@/lib/dotKham";

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
      include: { coSo: COSO_AN_TOAN },
    });
    if (!data || data.trangThai === DOT_KHAM_DA_XOA)
      return NextResponse.json({ error: "Không tìm thấy đợt khám (có thể đã bị xoá)" }, { status: 404 });
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
    if (!existing || existing.trangThai === DOT_KHAM_DA_XOA)
      return NextResponse.json({ error: "Không tìm thấy đợt khám (có thể đã bị xoá)" }, { status: 404 });

    // Đợt đã qua ngày: chỉ Quản trị viên được sửa (trước đây điều kiện trùng quyền buoikham.manage nên không chặn ai)
    if (dotBiKhoa(existing) && !duocSuaSauNgayKham(session.user.role)) {
      return NextResponse.json({ error: THONG_BAO_KHOA }, { status: 403 });
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
      include: { coSo: COSO_AN_TOAN, _count: { select: { hoSo: true } } },
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

/**
 * Xoá MỀM đợt khám: chuyển trạng thái "deleted", ẩn đợt và các hồ sơ trong đợt khỏi mọi danh sách / báo cáo,
 * KHÔNG xoá dữ liệu. Trước đây là xoá thật (kéo theo xoá toàn bộ hồ sơ bệnh nhân) và cả MKT / Tư vấn viên
 * cũng gọi được. Nay chỉ Quản lý (toàn hệ thống) và Quản trị viên (IT) của chính đơn vị được xoá.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isMaster = can(session.user.role, "admin.masterdata");
  const isIT = can(session.user.role, "admin.users");
  if (!isMaster && !isIT)
    return NextResponse.json({ error: "Chỉ Quản lý hoặc Quản trị viên được xoá đợt khám" }, { status: 403 });

  try {
    const { id } = await params;
    const prisma = getPrisma();
    const existing = await prisma.buoiKham.findUnique({
      where: { id },
      select: { id: true, coSoId: true, xa: true, ngayKham: true, trangThai: true, _count: { select: { hoSo: true } } },
    });
    if (!existing || existing.trangThai === DOT_KHAM_DA_XOA)
      return NextResponse.json({ error: "Không tìm thấy đợt khám (có thể đã bị xoá)" }, { status: 404 });
    if (!isMaster && existing.coSoId !== session.user.coSoId)
      return NextResponse.json({ error: "Bạn chỉ được xoá đợt khám thuộc đơn vị của mình" }, { status: 403 });

    await prisma.buoiKham.update({
      where: { id },
      data: { trangThai: DOT_KHAM_DA_XOA, xoaLuc: new Date(), xoaBoi: session.user.id },
    });
    await audit(session.user.id, "BuoiKham", id, "xoa", {
      xoaMem: true,
      xa: existing.xa,
      ngayKham: existing.ngayKham,
      soHoSo: existing._count.hoSo,
    });

    broadcastEvent({
      type: "buoikham_change",
      action: "delete",
      coSoId: existing.coSoId,
      buoiKhamId: id,
    });

    return NextResponse.json({ success: true, soHoSo: existing._count.hoSo });
  } catch (e) {
    // 422 thay vì 500: nginx chặn phản hồi 5xx nên người dùng không đọc được lý do
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 422 });
  }
}
