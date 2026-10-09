import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { HANH_DONG_MOI } from "@/lib/email";

async function generateUniqueMaNV(prisma: any, role: string, coSoId?: string | null): Promise<string> {
  if (role === "BacSi") {
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `BS-${Date.now().toString().slice(-6)}-${rand}`;
  }

  if (role === "IT") {
    const base = coSoId ? `IT-${coSoId.toUpperCase()}` : "IT";
    const exist = await prisma.nguoiDungCSR.findUnique({ where: { maNV: base } });
    if (!exist) return base;

    const all = await prisma.nguoiDungCSR.findMany({
      where: { maNV: { startsWith: base } },
      select: { maNV: true },
    });
    let max = 1;
    for (const u of all) {
      const match = u.maNV.match(new RegExp(`^${base}[-_]?(\\d+)$`, "i"));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    }
    return `${base}-${max + 1}`;
  }

  // Tất cả vai trò khác (MKT, TuVanVien, KeToan, HCNS, QuanLy, CSKH, ...)
  const allUsers = await prisma.nguoiDungCSR.findMany({
    where: { maNV: { startsWith: "NV" } },
    select: { maNV: true },
  });
  let maxNum = 0;
  for (const u of allUsers) {
    const m = u.maNV.match(/^NV(\d+)$/i);
    if (m) {
      const num = parseInt(m[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `NV${String(maxNum + 1).padStart(2, "0")}`;
}

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
    const prisma = getPrisma();
    const data = await prisma.nguoiDungCSR.findMany({
      where,
      select: { maNV: true, hoTen: true, vaiTro: true, coSoId: true, tenDangNhap: true, trangThai: true, coSo: { select: { ten: true } } },
      orderBy: { maNV: "asc" },
    });

    // Lần gửi thư mời gần nhất của từng tài khoản (lưu trong AuditLog - không cần cột email riêng)
    const logs = await prisma.auditLog
      .findMany({
        where: { bang: "NguoiDungCSR", hanhDong: HANH_DONG_MOI, banGhiId: { in: data.map((u) => u.maNV) } },
        orderBy: { thoiDiem: "desc" },
        select: { banGhiId: true, thoiDiem: true, thayDoi: true },
      })
      .catch(() => []);
    const loiMoi = new Map<string, { thoiDiem: string; email: string; ok: boolean; loi?: string; soLan: number }>();
    for (const l of logs) {
      const cur = loiMoi.get(l.banGhiId);
      if (cur) {
        cur.soLan++;
        continue;
      }
      let d: { email?: string; ok?: boolean; loi?: string } = {};
      try {
        d = JSON.parse(l.thayDoi || "{}");
      } catch {}
      loiMoi.set(l.banGhiId, { thoiDiem: l.thoiDiem.toISOString(), email: d.email || "", ok: !!d.ok, loi: d.loi, soLan: 1 });
    }

    return NextResponse.json(data.map((u) => ({ ...u, loiMoi: loiMoi.get(u.maNV) ?? null })));
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
    const { maNV, hoTen, vaiTro, coSoId, tenDangNhap, matKhau, email, guiEmail } = await request.json();
    if (!hoTen || !vaiTro || !tenDangNhap || !matKhau)
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });

    let finalCoSoId = coSoId || null;
    let finalVaiTro = vaiTro;

    if (!isMaster) {
      // IT chỉ được tạo tài khoản cho đơn vị của mình
      finalCoSoId = session.user.coSoId || null;
      if (vaiTro === "QuanLy") {
        return NextResponse.json({ error: "Quản trị viên đơn vị không được tạo tài khoản Quản lý toàn hệ thống" }, { status: 403 });
      }
    } else {
      if (vaiTro === "QuanLy") finalCoSoId = null;
    }

    const prisma = getPrisma();

    // 1. Kiểm tra trùng tên đăng nhập
    const normalizedUsername = String(tenDangNhap).trim().toLowerCase().replace(/\s+/g, "");
    if (!normalizedUsername) {
      return NextResponse.json({ error: "Tên đăng nhập không được để trống" }, { status: 400 });
    }

    const existingUsername = await prisma.nguoiDungCSR.findUnique({
      where: { tenDangNhap: normalizedUsername },
      select: { maNV: true, hoTen: true },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: `Tên đăng nhập "${normalizedUsername}" đã được sử dụng (${existingUsername.hoTen}). Vui lòng chọn tên đăng nhập khác.` },
        { status: 400 }
      );
    }

    // 2. Tự động sinh mã nhân viên chuẩn nếu chưa có hoặc nếu mã gửi lên đã tồn tại
    let finalMaNV = String(maNV || "").trim();
    let needGenMaNV = !finalMaNV;
    if (finalMaNV) {
      const exist = await prisma.nguoiDungCSR.findUnique({
        where: { maNV: finalMaNV },
        select: { maNV: true },
      });
      if (exist) {
        needGenMaNV = true;
      }
    }

    if (needGenMaNV) {
      finalMaNV = await generateUniqueMaNV(prisma, finalVaiTro, finalCoSoId);
    }

    // Vòng lặp an toàn tuyệt đối tránh race condition
    while (await prisma.nguoiDungCSR.findUnique({ where: { maNV: finalMaNV }, select: { maNV: true } })) {
      const match = finalMaNV.match(/^NV(\d+)$/i);
      if (match) {
        finalMaNV = `NV${String(parseInt(match[1], 10) + 1).padStart(2, "0")}`;
      } else {
        finalMaNV = `${finalMaNV}-${Math.floor(100 + Math.random() * 900)}`;
      }
    }

    const data = await prisma.nguoiDungCSR.create({
      data: {
        maNV: finalMaNV,
        hoTen: hoTen.trim(),
        vaiTro: finalVaiTro,
        coSoId: finalCoSoId,
        tenDangNhap: normalizedUsername,
        matKhauHash: await bcrypt.hash(matKhau, 10),
      },
      include: { coSo: { select: { ten: true } } },
    });
    await audit(session.user.id, "NguoiDungCSR", data.maNV, "them", { hoTen, vaiTro: finalVaiTro, coSoId: finalCoSoId });

    let emailSent = false;
    let emailError: string | undefined;

    if (guiEmail && email && email.includes("@")) {
      const { inviteEmail, sendEmail, appUrlFrom } = await import("@/lib/email");
      const { roleLabel } = await import("@/lib/permissions");
      const targetEmail = email.trim().toLowerCase();
      const mail = inviteEmail({
        hoTen: data.hoTen,
        vaiTro: roleLabel(data.vaiTro),
        coSo: data.coSo?.ten || "Toàn hệ thống",
        tenDangNhap: data.tenDangNhap,
        matKhau,
        url: appUrlFrom(request),
        nguoiMoi: session.user.name || null,
      });

      const res = await sendEmail({ to: targetEmail, subject: mail.subject, html: mail.html, text: mail.text });
      emailSent = res.ok;
      emailError = res.error;

      await prisma.auditLog
        .create({
          data: {
            bang: "NguoiDungCSR",
            banGhiId: data.maNV,
            hanhDong: HANH_DONG_MOI,
            nguoiDung: session.user.id,
            thayDoi: JSON.stringify({
              email: targetEmail,
              ok: res.ok,
              loi: res.ok ? undefined : res.error,
              capMatKhauMoi: true,
              nguoiGui: session.user.name || session.user.id,
              tuDongKhiTao: true,
            }),
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({ ok: true, maNV: data.maNV, emailSent, emailError });
  } catch (e: any) {
    console.error("[POST /api/csr/nguoidung] Error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint failed") || msg.includes("dbo.NguoiDungCSR") || msg.includes("tenDangNhap")) {
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mã nhân viên đã tồn tại trên hệ thống. Vui lòng kiểm tra lại." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi tạo tài khoản" }, { status: 500 });
  }
}
