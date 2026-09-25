import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { randomInt } from "crypto";

/**
 * Gửi email qua SMTP máy chủ mail VISI (mail.visicare.com.vn) — cùng cách làm với VisiHUB.
 * Toàn bộ thông tin đăng nhập SMTP đọc từ .env, KHÔNG ghi trong mã nguồn:
 *   EMAIL_BAT=1, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM_NAME
 */

/** Hành động ghi vào AuditLog cho mỗi lần gửi thư mời — danh sách tài khoản đọc lại để hiện trạng thái. */
export const HANH_DONG_MOI = "gui_email_moi";

export interface EmailConfig {
  enabled: boolean;
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
}

export function readEmailConfig(): EmailConfig {
  const port = Number(process.env.SMTP_PORT || 465);
  return {
    enabled: process.env.EMAIL_BAT === "1" || process.env.EMAIL_BAT === "true",
    host: (process.env.SMTP_HOST || "mail.visicare.com.vn").trim(),
    port,
    user: (process.env.SMTP_USER || "").trim(),
    pass: (process.env.SMTP_PASS || "").trim(),
    fromName: (process.env.EMAIL_FROM_NAME || "VISI CSR").replace(/"/g, "").trim(),
  };
}

/** Lý do chưa gửi được (rỗng = sẵn sàng). */
export function emailConfigProblem(c: EmailConfig = readEmailConfig()): string {
  const missing: string[] = [];
  if (!c.enabled) missing.push("công tắc EMAIL_BAT=1");
  if (!c.host) missing.push("SMTP_HOST");
  if (!c.user) missing.push("SMTP_USER");
  if (!c.pass) missing.push("SMTP_PASS");
  return missing.length ? `Chưa cấu hình ${missing.join(", ")} trong .env` : "";
}

/*
  Một transporter dùng chung, giữ kết nối (pool) — gửi nhiều thư liên tiếp không phải bắt tay
  TLS + đăng nhập SMTP lại từng thư. Khoá theo cấu hình: đổi mật khẩu / máy chủ là tạo mới.
*/
const g = globalThis as unknown as { __csrMailer?: { key: string; tp: Transporter } };

function getTransporter(c: EmailConfig): Transporter {
  const key = [c.host, c.port, c.user, c.pass].join("|");
  if (g.__csrMailer?.key === key) return g.__csrMailer.tp;
  try {
    g.__csrMailer?.tp.close();
  } catch {}
  const tp = nodemailer.createTransport({
    host: c.host,
    port: c.port,
    // 465 = SSL trực tiếp; 587/25 = STARTTLS
    secure: c.port === 465,
    auth: { user: c.user, pass: c.pass },
    tls: { rejectUnauthorized: false },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  g.__csrMailer = { key, tp };
  return tp;
}

export async function sendEmail(args: { to: string; subject: string; html: string; text?: string }): Promise<{ ok: boolean; id?: string; error?: string }> {
  const c = readEmailConfig();
  const problem = emailConfigProblem(c);
  if (problem) return { ok: false, error: problem };
  try {
    // Địa chỉ gửi phải trùng tài khoản đăng nhập SMTP, nếu không máy chủ sẽ từ chối relay
    const info = await getTransporter(c).sendMail({
      from: `"${c.fromName}" <${c.user}>`,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    return { ok: true, id: info.messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi kết nối máy chủ SMTP" };
  }
}

/** Địa chỉ hệ thống cho nút trong thư: ưu tiên chính host người quản trị đang dùng. */
export function appUrlFrom(request?: Request): string {
  const fallback = (process.env.PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "").trim().replace(/\/+$/, "");
  if (!request) return fallback;
  const h = request.headers;
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();
  const proto = (h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https")).split(",")[0].trim();
  if (host && !/^(127\.|0\.0\.0\.0|\[?::1\]?)/.test(host)) return `${proto}://${host}`;
  return fallback;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

/** Khung thư thương hiệu VISI CSR (bảng HTML thuần — hiển thị ổn trên Gmail / Outlook). */
export function emailShell(title: string, body: string): string {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:32px 14px;background:#f7f8fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e6e9f2;border-radius:18px;overflow:hidden;box-shadow:0 18px 40px -18px rgba(3,29,166,.18);">
      <tr><td style="background:linear-gradient(135deg,#020f5c 0%,#031da6 70%,#0b5bbf 100%);padding:22px 28px;border-bottom:3px solid #02b8a9;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#02b8a9,#031da6);color:#fff;font-weight:900;font-size:19px;text-align:center;vertical-align:middle;">V</td>
          <td style="padding-left:14px;">
            <div style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-.2px;">VISI <span style="color:#5eead4;">CSR</span></div>
            <div style="font-size:10.5px;font-weight:700;color:#a5f3fc;letter-spacing:.14em;text-transform:uppercase;margin-top:2px;">Khám sàng lọc cộng đồng</div>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:30px 28px 26px;color:#0d1025;font-size:14.5px;line-height:1.65;">
        <h1 style="margin:0 0 18px;font-size:20px;font-weight:800;color:#031da6;letter-spacing:-.3px;">${esc(title)}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:18px 28px;background:#fafbfd;border-top:1px solid #eef0f5;text-align:center;color:#8a8fa3;font-size:11.5px;line-height:1.6;">
        <div style="font-weight:700;color:#45495e;">© ${year} Tập đoàn Y khoa VISI · VISI CSR</div>
        Thư được gửi tự động từ hệ thống, vui lòng không trả lời thư này. Không chia sẻ thông tin đăng nhập cho người khác.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

/** Thư mời tham gia hệ thống: thông tin đăng nhập + nút vào hệ thống. */
export function inviteEmail(args: {
  hoTen: string;
  vaiTro: string;
  coSo: string;
  tenDangNhap: string;
  matKhau?: string | null;
  url: string;
  nguoiMoi?: string | null;
}): { subject: string; html: string; text: string } {
  const row = (label: string, value: string, mono = false) => `
    <tr>
      <td style="padding:11px 14px;background:#fafbfd;border-bottom:1px solid #eef0f5;width:140px;font-size:12.5px;font-weight:700;color:#45495e;">${label}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #eef0f5;font-size:14px;font-weight:700;color:#031da6;${mono ? "font-family:'SF Mono',Consolas,Menlo,monospace;letter-spacing:.3px;" : ""}">${value}</td>
    </tr>`;

  const body = `
    <p style="margin:0 0 6px;">Xin chào <strong style="color:#031da6;">${esc(args.hoTen)}</strong>,</p>
    <p style="margin:0 0 16px;color:#45495e;">
      ${args.nguoiMoi ? `<strong>${esc(args.nguoiMoi)}</strong> đã mời bạn` : "Bạn được mời"} tham gia hệ thống <strong>VISI CSR</strong> — quản lý khám sàng lọc cộng đồng, tư vấn &amp; theo dõi điều trị.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e6e9f2;border-radius:12px;overflow:hidden;border-collapse:separate;">
      ${row("Tên đăng nhập", esc(args.tenDangNhap), true)}
      ${args.matKhau ? row("Mật khẩu tạm", esc(args.matKhau), true) : row("Mật khẩu", "Dùng mật khẩu đã được cấp")}
      ${row("Vai trò", esc(args.vaiTro))}
      ${row("Cơ sở", esc(args.coSo))}
    </table>
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${esc(args.url)}/login" style="display:inline-block;padding:13px 32px;border-radius:12px;background:linear-gradient(135deg,#031da6 0%,#020f5c 100%);color:#ffffff;text-decoration:none;font-weight:800;font-size:14.5px;box-shadow:0 8px 20px -6px rgba(3,29,166,.45);">
        Đăng nhập VISI CSR &rarr;
      </a>
      <div style="margin-top:9px;font-size:11.5px;color:#8a8fa3;">Hoặc truy cập: <a href="${esc(args.url)}" style="color:#031da6;">${esc(args.url)}</a></div>
    </div>
    ${
      args.matKhau
        ? `<div style="margin-top:18px;padding:12px 16px;background:#fef6eb;border:1px solid #fde7c2;border-left:4px solid #d97706;border-radius:10px;color:#92400e;font-size:12.5px;line-height:1.55;">
             <strong>Lưu ý bảo mật:</strong> đây là mật khẩu tạm — hãy đổi mật khẩu ngay sau lần đăng nhập đầu tiên (menu tài khoản → Đổi mật khẩu).
           </div>`
        : ""
    }`;

  const text = [
    `Xin chào ${args.hoTen},`,
    `Bạn được mời tham gia hệ thống VISI CSR.`,
    `Tên đăng nhập: ${args.tenDangNhap}`,
    args.matKhau ? `Mật khẩu tạm: ${args.matKhau}` : `Mật khẩu: dùng mật khẩu đã được cấp`,
    `Vai trò: ${args.vaiTro} · Cơ sở: ${args.coSo}`,
    `Đăng nhập: ${args.url}/login`,
  ].join("\n");

  return { subject: "[VISI CSR] Lời mời tham gia hệ thống & thông tin đăng nhập", html: emailShell("Lời mời tham gia VISI CSR", body), text };
}

/** Mật khẩu tạm dễ đọc (bỏ ký tự dễ nhầm 0/O, 1/l/I). */
export function tempPassword(len = 10): string {
  const up = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const low = "abcdefghijkmnpqrstuvwxyz";
  const dig = "23456789";
  const all = up + low + dig;
  const pick = (s: string) => s[randomInt(s.length)];
  const chars = [pick(up), pick(low), pick(dig), "@"];
  while (chars.length < len) chars.push(pick(all));
  // Xáo trộn Fisher–Yates bằng nguồn ngẫu nhiên mật mã
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
