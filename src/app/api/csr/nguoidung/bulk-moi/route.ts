import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can, roleLabel } from "@/lib/permissions";
import {
  sendEmail,
  inviteEmail,
  appUrlFrom,
  tempPassword,
  emailConfigProblem,
  HANH_DONG_MOI,
} from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const isMaster = can(session.user.role, "admin.masterdata");
  const isIT = can(session.user.role, "admin.users");
  if (!isMaster && !isIT) return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });

  const problem = emailConfigProblem();
  if (problem) return NextResponse.json({ error: `Chưa gửi được email: ${problem}` }, { status: 503 });

  const b = await request.json().catch(() => ({}));
  const targets: { maNV: string; email: string; capMatKhauMoi?: boolean; matKhau?: string }[] = Array.isArray(b?.targets)
    ? b.targets
    : [];

  if (targets.length === 0) {
    return NextResponse.json({ error: "Danh sách tài khoản gửi thư mời trống" }, { status: 400 });
  }

  const prisma = getPrisma();
  const results: { maNV: string; email: string; ok: boolean; error?: string }[] = [];
  let successCount = 0;
  let failCount = 0;

  const appUrl = appUrlFrom(request);

  for (const item of targets) {
    const maNV = String(item.maNV || "").trim();
    const email = String(item.email || "").trim().toLowerCase();

    if (!maNV || !EMAIL_RE.test(email)) {
      results.push({ maNV, email, ok: false, error: "Email không hợp lệ" });
      failCount++;
      continue;
    }

    try {
      const user = await prisma.nguoiDungCSR.findUnique({
        where: { maNV },
        include: { coSo: { select: { ten: true } } },
      });

      if (!user) {
        results.push({ maNV, email, ok: false, error: "Không tìm thấy tài khoản" });
        failCount++;
        continue;
      }

      if (!isMaster && (user.vaiTro === "QuanLy" || (user.coSoId && user.coSoId !== session.user.coSoId))) {
        results.push({ maNV, email, ok: false, error: "Không có quyền gửi cho tài khoản ngoài đơn vị" });
        failCount++;
        continue;
      }

      if (user.trangThai !== "active") {
        results.push({ maNV, email, ok: false, error: "Tài khoản đang bị khóa" });
        failCount++;
        continue;
      }

      const capMatKhauMoi = item.capMatKhauMoi !== false;
      const matKhau = capMatKhauMoi ? String(item.matKhau || "").trim() || tempPassword() : null;

      if (matKhau && maNV === "admin") {
        results.push({ maNV, email, ok: false, error: "Không thể đổi mật khẩu tài khoản admin mặc định" });
        failCount++;
        continue;
      }

      const mail = inviteEmail({
        hoTen: user.hoTen,
        vaiTro: roleLabel(user.vaiTro),
        coSo: user.coSo?.ten || "Toàn hệ thống",
        tenDangNhap: user.tenDangNhap,
        matKhau,
        url: appUrl,
        nguoiMoi: session.user.name || null,
      });

      const res = await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });

      if (res.ok && matKhau) {
        await prisma.nguoiDungCSR.update({
          where: { maNV },
          data: { matKhauHash: await bcrypt.hash(matKhau, 10) },
        });
      }

      await prisma.auditLog
        .create({
          data: {
            bang: "NguoiDungCSR",
            banGhiId: maNV,
            hanhDong: HANH_DONG_MOI,
            nguoiDung: session.user.id,
            thayDoi: JSON.stringify({
              email,
              ok: res.ok,
              loi: res.ok ? undefined : res.error,
              capMatKhauMoi: !!matKhau && res.ok,
              nguoiGui: session.user.name || session.user.id,
              hangLoat: true,
            }),
          },
        })
        .catch(() => {});

      if (res.ok) {
        successCount++;
        results.push({ maNV, email, ok: true });
      } else {
        failCount++;
        results.push({ maNV, email, ok: false, error: res.error });
      }
    } catch (err) {
      failCount++;
      results.push({ maNV, email, ok: false, error: err instanceof Error ? err.message : "Lỗi hệ thống" });
    }
  }

  return NextResponse.json({
    ok: true,
    total: targets.length,
    successCount,
    failCount,
    results,
  });
}
