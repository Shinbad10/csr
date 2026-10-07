import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { clearBhxhCache } from "@/lib/bhxh";
import { autoEncryptCoSo, coSoForAdmin, coSoSecretsForWrite } from "@/lib/coso";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const isAllowed = session && (can(session.user.role, "admin.masterdata") || (can(session.user.role, "admin.users") && session.user.coSoId === id));
  if (!session || !isAllowed) return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });
  try {
    const body = await request.json();
    const { ten, diaChi, bhxhMaCSKCB, bhxhHoTenCB, cauHinhTruong } = body;

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
        bhxhMaCSKCB: bhxhMaCSKCB !== undefined ? (bhxhMaCSKCB?.trim() || null) : undefined,
        bhxhHoTenCB: bhxhHoTenCB !== undefined ? (bhxhHoTenCB?.trim() || null) : undefined,
        // Thông tin kết nối HIS / BHXH lưu dạng mã hoá; mật khẩu để trống = giữ nguyên
        ...coSoSecretsForWrite(body, "update"),
      },
    });
    // Cấu hình Cổng BHXH được cache 10 phút trong bộ nhớ — xoá ngay để lần tra cứu kế tiếp dùng tài khoản mới
    clearBhxhCache(id);
    await audit(session.user.id, "CoSo", id, "sua", { ten, diaChi });
    // Trường để trống (giữ nguyên) mà còn dạng rõ cũ → mã hoá luôn khi lưu
    return NextResponse.json(coSoForAdmin(await autoEncryptCoSo(id, data)));
  } catch (e) {
    // 422 thay vì 500: nginx chặn phản hồi 5xx, người quản trị không đọc được lý do (vd. thiếu khoá mã hoá)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 422 });
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
