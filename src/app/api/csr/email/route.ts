import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { readEmailConfig, emailConfigProblem } from "@/lib/email";

/** Trạng thái cấu hình gửi email (không trả mật khẩu) — cho màn quản trị hiển thị. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  if (!can(session.user.role, "admin.masterdata") && !can(session.user.role, "admin.users"))
    return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });
  const c = readEmailConfig();
  const problem = emailConfigProblem(c);
  return NextResponse.json({ ready: !problem, problem, from: c.user, fromName: c.fromName, host: c.host, port: c.port });
}

/** Kiểm tra kết nối SMTP hoặc gửi email thử nghiệm. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  if (!can(session.user.role, "admin.masterdata") && !can(session.user.role, "admin.users"))
    return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });

  const c = readEmailConfig();
  const problem = emailConfigProblem(c);
  if (problem) return NextResponse.json({ error: problem }, { status: 503 });

  const b = await request.json().catch(() => ({}));
  const to = String(b?.to || "").trim().toLowerCase();

  if (to) {
    const { sendEmail, emailShell } = await import("@/lib/email");
    const res = await sendEmail({
      to,
      subject: "[VISI CSR] Thử nghiệm cấu hình SMTP máy chủ mail VISI",
      html: emailShell(
        "Kiểm tra kết nối Email",
        `<p>Đây là email kiểm tra kết nối từ hệ thống <strong>VISI CSR</strong> qua máy chủ SMTP <strong>${c.host}:${c.port}</strong>.</p>
         <p>Tài khoản gửi: <strong>${c.user}</strong> (${c.fromName})</p>
         <p>Thời điểm gửi: <strong>${new Date().toLocaleString("vi-VN")}</strong></p>`
      ),
      text: `Kiểm tra kết nối email từ hệ thống VISI CSR (${c.user}). Thời điểm: ${new Date().toLocaleString("vi-VN")}`,
    });
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 502 });
    return NextResponse.json({ ok: true, message: `Đã gửi email thử nghiệm thành công tới ${to}` });
  }

  try {
    const nodemailer = (await import("nodemailer")).default;
    const tp = nodemailer.createTransport({
      host: c.host,
      port: c.port,
      secure: c.port === 465,
      auth: { user: c.user, pass: c.pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
    });
    await tp.verify();
    return NextResponse.json({ ok: true, message: `Kết nối máy chủ SMTP ${c.host}:${c.port} (${c.user}) thành công!` });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Không kết nối được máy chủ SMTP" }, { status: 502 });
  }
}

