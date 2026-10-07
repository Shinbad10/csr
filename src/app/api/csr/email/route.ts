import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { readEmailConfig, emailConfigProblem, verifySmtp } from "@/lib/email";

/* Lỗi cấu hình / gửi SMTP trả 422, KHÔNG dùng 5xx: nginx trước ứng dụng chặn mọi phản hồi 5xx
   (proxy_intercept_errors) và thay bằng trang lỗi riêng — với POST thành "405 Not Allowed", người dùng
   không đọc được lý do thật. */
const EMAIL_LOI = 422;

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
  if (problem) return NextResponse.json({ error: problem }, { status: EMAIL_LOI });

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
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: EMAIL_LOI });
    return NextResponse.json({ ok: true, message: `Đã gửi email thử nghiệm thành công tới ${to}` });
  }

  const v = await verifySmtp(c);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: EMAIL_LOI });
  return NextResponse.json({
    ok: true,
    message: `Kết nối máy chủ SMTP ${c.host}${c.hostIp ? ` (${c.hostIp})` : ""}:${c.port} (${c.user}) thành công!`,
  });
}

