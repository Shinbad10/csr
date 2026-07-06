import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "admin.masterdata")) return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });
  try {
    const data = await getPrisma().nguoiDungCSR.findMany({
      select: { maNV: true, hoTen: true, vaiTro: true, coSoId: true, tenDangNhap: true, trangThai: true, coSo: { select: { ten: true } } },
      orderBy: { maNV: "asc" },
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "admin.masterdata")) return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });
  try {
    const { maNV, hoTen, vaiTro, coSoId, tenDangNhap, matKhau } = await request.json();
    if (!maNV || !hoTen || !vaiTro || !tenDangNhap || !matKhau)
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    const data = await getPrisma().nguoiDungCSR.create({
      data: {
        maNV: maNV.trim(), hoTen: hoTen.trim(), vaiTro,
        coSoId: vaiTro === "QuanLy" ? null : coSoId || null,
        tenDangNhap: tenDangNhap.trim(), matKhauHash: await bcrypt.hash(matKhau, 10),
      },
    });
    await audit(session.user.id, "NguoiDungCSR", data.maNV, "them", { hoTen, vaiTro });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi (mã NV / tên đăng nhập đã tồn tại)" }, { status: 500 });
  }
}
