import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can, roleLabel } from "@/lib/permissions";
import { sendEmail, inviteEmail, appUrlFrom, tempPassword, emailConfigProblem, HANH_DONG_MOI } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Gửi email mời tham gia hệ thống cho một tài khoản.
 * body: { email: string; capMatKhauMoi?: boolean; matKhau?: string }
 *  - capMatKhauMoi = true → đặt lại mật khẩu (tự sinh nếu không truyền) và gửi kèm trong thư.
 *  - false → chỉ gửi thông tin đăng nhập, không gửi mật khẩu.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const isMaster = can(session.user.role, "admin.masterdata");
  const isIT = can(session.user.role, "admin.users");
  if (!isMaster && !isIT) return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });

  const { id } = await params;
  const b = await request.json().catch(() => ({}));
  const email = String(b?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Địa chỉ email không hợp lệ" }, { status: 400 });

  const problem = emailConfigProblem();
  if (problem) return NextResponse.json({ error: `Chưa gửi được email: ${problem}` }, { status: 503 });

  const prisma = getPrisma();
  const user = await prisma.nguoiDungCSR.findUnique({ where: { maNV: id }, include: { coSo: { select: { ten: true } } } });
  if (!user) return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });

  // IT đơn vị chỉ được mời tài khoản thuộc cơ sở của mình
  if (!isMaster && (user.vaiTro === "QuanLy" || (user.coSoId && user.coSoId !== session.user.coSoId))) {
    return NextResponse.json({ error: "Bạn chỉ có quyền mời tài khoản thuộc đơn vị của mình" }, { status: 403 });
  }
  if (user.trangThai !== "active") {
    return NextResponse.json({ error: "Tài khoản đang bị khóa — mở khóa trước khi gửi thư mời" }, { status: 400 });
  }

  const capMatKhauMoi = b?.capMatKhauMoi !== false;
  const matKhau = capMatKhauMoi ? String(b?.matKhau || "").trim() || tempPassword() : null;
  if (matKhau && matKhau.length < 6) return NextResponse.json({ error: "Mật khẩu tạm tối thiểu 6 ký tự" }, { status: 400 });
  if (matKhau && id === "admin") return NextResponse.json({ error: "Không đặt lại mật khẩu tài khoản admin mặc định" }, { status: 400 });

  const mail = inviteEmail({
    hoTen: user.hoTen,
    vaiTro: roleLabel(user.vaiTro),
    coSo: user.coSo?.ten || "Toàn hệ thống",
    tenDangNhap: user.tenDangNhap,
    matKhau,
    url: appUrlFrom(request),
    nguoiMoi: session.user.name || null,
  });

  // Gửi TRƯỚC, đặt mật khẩu SAU: thư lỗi thì mật khẩu cũ vẫn giữ nguyên, người dùng không bị khóa ngoài.
  const res = await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
  if (res.ok && matKhau) {
    await prisma.nguoiDungCSR.update({ where: { maNV: id }, data: { matKhauHash: await bcrypt.hash(matKhau, 10) } });
  }

  await prisma.auditLog
    .create({
      data: {
        bang: "NguoiDungCSR",
        banGhiId: id,
        hanhDong: HANH_DONG_MOI,
        nguoiDung: session.user.id,
        thayDoi: JSON.stringify({
          email,
          ok: res.ok,
          loi: res.ok ? undefined : res.error,
          capMatKhauMoi: !!matKhau && res.ok,
          nguoiGui: session.user.name || session.user.id,
        }),
      },
    })
    .catch(() => {});

  if (!res.ok) return NextResponse.json({ error: `Gửi email thất bại: ${res.error}` }, { status: 502 });
  return NextResponse.json({ ok: true, email, capMatKhauMoi: !!matKhau });
}
