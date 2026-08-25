import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const isMaster = can(session.user.role, "admin.masterdata");
  const isIT = can(session.user.role, "admin.users");
  if (!isMaster && !isIT) return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });

  try {
    const where: any = {};
    if (!isMaster && session.user.coSoId) {
      where.coSoId = session.user.coSoId;
    }
    const data = await getPrisma().nguoiDungCSR.findMany({
      where,
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
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const isMaster = can(session.user.role, "admin.masterdata");
  const isIT = can(session.user.role, "admin.users");
  if (!isMaster && !isIT) return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });

  try {
    const { maNV, hoTen, vaiTro, coSoId, tenDangNhap, matKhau } = await request.json();
    if (!maNV || !hoTen || !vaiTro || !tenDangNhap || !matKhau)
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });

    let finalCoSoId = coSoId || null;
    let finalVaiTro = vaiTro;

    if (!isMaster) {
      // IT chỉ được tạo tài khoản cho đơn vị của mình
      finalCoSoId = session.user.coSoId || null;
      if (vaiTro === "QuanLy") {
        return NextResponse.json({ error: "IT đơn vị không được tạo tài khoản Quản trị toàn hệ thống" }, { status: 403 });
      }
    } else {
      if (vaiTro === "QuanLy") finalCoSoId = null;
    }

    const data = await getPrisma().nguoiDungCSR.create({
      data: {
        maNV: maNV.trim(), hoTen: hoTen.trim(), vaiTro: finalVaiTro,
        coSoId: finalCoSoId,
        tenDangNhap: tenDangNhap.trim(), matKhauHash: await bcrypt.hash(matKhau, 10),
      },
    });
    await audit(session.user.id, "NguoiDungCSR", data.maNV, "them", { hoTen, vaiTro: finalVaiTro, coSoId: finalCoSoId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi (mã NV / tên đăng nhập đã tồn tại)" }, { status: 500 });
  }
}
