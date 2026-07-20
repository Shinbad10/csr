import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "admin.masterdata")) return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });
  const { id } = await params;
  try {
    const { ten, diaChi, bhxhUser, bhxhPass, bhxhMaCSKCB, bhxhHoTenCB, bhxhCccdCB, hisHost, hisPort, hisUser, hisPass, hisDbName, cauHinhTruong } = await request.json();

    // cauHinhTruong là chuỗi JSON object { "<fieldKey>": boolean }
    if (cauHinhTruong !== undefined && cauHinhTruong !== null) {
      try {
        const parsed = JSON.parse(cauHinhTruong);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      } catch {
        return NextResponse.json({ error: "Cấu hình trường không hợp lệ" }, { status: 400 });
      }
    }

    const data = await getPrisma().coSo.update({
      where: { id },
      data: {
        ten,
        diaChi: diaChi !== undefined ? (diaChi || null) : undefined,
        cauHinhTruong: cauHinhTruong !== undefined ? (cauHinhTruong || null) : undefined,
        bhxhUser: bhxhUser !== undefined ? (bhxhUser?.trim() || null) : undefined,
        bhxhPass: bhxhPass !== undefined ? (bhxhPass?.trim() || null) : undefined,
        bhxhMaCSKCB: bhxhMaCSKCB !== undefined ? (bhxhMaCSKCB?.trim() || null) : undefined,
        bhxhHoTenCB: bhxhHoTenCB !== undefined ? (bhxhHoTenCB?.trim() || null) : undefined,
        bhxhCccdCB: bhxhCccdCB !== undefined ? (bhxhCccdCB?.trim() || null) : undefined,
        hisHost: hisHost !== undefined ? (hisHost?.trim() || null) : undefined,
        hisPort: hisPort !== undefined ? (hisPort?.trim() || null) : undefined,
        hisUser: hisUser !== undefined ? (hisUser?.trim() || null) : undefined,
        hisPass: hisPass !== undefined ? (hisPass?.trim() || null) : undefined,
        hisDbName: hisDbName !== undefined ? (hisDbName?.trim() || null) : undefined,
      },
    });
    await audit(session.user.id, "CoSo", id, "sua", { ten, diaChi });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

// Xoá cứng khỏi hệ thống và cascade xóa các dữ liệu con
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "admin.masterdata")) return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });
  const { id } = await params;
  const prisma = getPrisma();
  try {
    // 1. Gỡ liên kết của nhân viên khỏi cơ sở này trước khi xóa
    await prisma.nguoiDungCSR.updateMany({ where: { coSoId: id }, data: { coSoId: null } });
    
    // 2. Xóa toàn bộ Hồ sơ bệnh nhân của Cơ sở này
    await prisma.hoSoBenhNhan.deleteMany({ where: { coSoId: id } });
    
    // 3. Xóa toàn bộ Buổi khám của Cơ sở này
    await prisma.buoiKham.deleteMany({ where: { coSoId: id } });
    
    // 4. Xóa Cơ sở
    await prisma.coSo.delete({ where: { id } });
    
    await audit(session.user.id, "CoSo", id, "xoa", {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}
