import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "admin.masterdata")) return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });
  const { id } = await params;
  try {
    const b = await request.json();
    const data: Record<string, unknown> = {};
    if (b.hoTen) data.hoTen = b.hoTen.trim();
    if (b.vaiTro) { data.vaiTro = b.vaiTro; data.coSoId = b.vaiTro === "QuanLy" ? null : b.coSoId || null; }
    else if (b.coSoId !== undefined) data.coSoId = b.coSoId || null;
    if (b.trangThai) data.trangThai = b.trangThai;
    if (b.matKhau) data.matKhauHash = await bcrypt.hash(b.matKhau, 10);
    await getPrisma().nguoiDungCSR.update({ where: { maNV: id }, data });
    await audit(session.user.id, "NguoiDungCSR", id, "sua", { ...b, matKhau: b.matKhau ? "***" : undefined });
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
