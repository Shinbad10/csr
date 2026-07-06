import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { id } = await params;
  const isSelf = session.user.id === id;
  const isAdmin = can(session.user.role, "admin.masterdata");
  if (!isSelf && !isAdmin) return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });

  try {
    const b = await request.json();
    const data: Record<string, unknown> = {};
    if (isAdmin) {
      if (b.hoTen) data.hoTen = b.hoTen.trim();
      if (b.vaiTro) { data.vaiTro = b.vaiTro; data.coSoId = b.vaiTro === "QuanLy" ? null : b.coSoId || null; }
      else if (b.coSoId !== undefined) data.coSoId = b.coSoId || null;
      if (b.trangThai) data.trangThai = b.trangThai;
    }
    if (b.matKhau) {
      if (id === "admin") {
        return NextResponse.json({ error: "Tài khoản admin mặc định không thể đổi mật khẩu tại đây" }, { status: 400 });
      }
      if (!isAdmin || isSelf) {
        if (!b.oldPassword) return NextResponse.json({ error: "Vui lòng nhập mật khẩu hiện tại" }, { status: 400 });
        const currentUser = await getPrisma().nguoiDungCSR.findUnique({ where: { maNV: id } });
        if (!currentUser || !(await bcrypt.compare(b.oldPassword, currentUser.matKhauHash))) {
          return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 400 });
        }
      }
      data.matKhauHash = await bcrypt.hash(b.matKhau, 10);
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Không có dữ liệu hợp lệ để cập nhật" }, { status: 400 });
    }
    await getPrisma().nguoiDungCSR.update({ where: { maNV: id }, data });
    await audit(session.user.id, "NguoiDungCSR", id, "sua", { ...b, matKhau: b.matKhau ? "***" : undefined, oldPassword: b.oldPassword ? "***" : undefined });
    return NextResponse.json({ ok: true });
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
    // 1. Gỡ liên kết trong Hồ sơ bệnh nhân (các trường nullable)
    await prisma.hoSoBenhNhan.updateMany({ where: { tuVanVienMa: id }, data: { tuVanVienMa: null } });
    await prisma.hoSoBenhNhan.updateMany({ where: { nguoiPhuTrachMa: id }, data: { nguoiPhuTrachMa: null } });
    await prisma.hoSoBenhNhan.updateMany({ where: { nguoiChotCuoiMa: id }, data: { nguoiChotCuoiMa: null } });

    // 2. Xóa Nhật ký theo dõi của người này tạo
    await prisma.nhatKyTheoDoi.deleteMany({ where: { nguoiGoiMa: id } });

    // 3. Xóa các Buổi khám do người này tạo (và tự động xóa Hồ sơ trong Buổi khám đó)
    const buoiKhams = await prisma.buoiKham.findMany({ where: { nguoiTao: id }, select: { id: true } });
    if (buoiKhams.length > 0) {
      const bkIds = buoiKhams.map(b => b.id);
      await prisma.hoSoBenhNhan.deleteMany({ where: { buoiKhamId: { in: bkIds } } });
      await prisma.buoiKham.deleteMany({ where: { nguoiTao: id } });
    }

    // 4. Cuối cùng xóa người dùng
    await prisma.nguoiDungCSR.delete({ where: { maNV: id } });
    
    await audit(session.user.id, "NguoiDungCSR", id, "xoa", {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}
