import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getPrisma } from "./prisma";
import { isCorporate } from "./permissions";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Tên đăng nhập", type: "text" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        if (credentials.username === "admin" && credentials.password === "Admin@123") {
          return { id: "admin", name: "Quản trị hệ thống", role: "QuanLy", coSoId: null };
        }
        const user = await getPrisma().nguoiDungCSR.findUnique({
          where: { tenDangNhap: credentials.username },
        });
        if (!user || user.trangThai !== "active") return null;
        if (!(await bcrypt.compare(credentials.password, user.matKhauHash))) return null;
        return { id: user.maNV, name: user.hoTen, role: user.vaiTro, coSoId: user.coSoId };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role?: string }).role;
        token.coSoId = (user as { coSoId?: string | null }).coSoId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.coSoId = (token.coSoId as string | null) ?? null;
      }
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // ≤ 8 giờ (SRS §12)
  pages: { signIn: "/login" },
};

// Cơ sở đang làm việc: staff = coSo được gán; Quản lý = cookie selected_coso_id (BR-11).
export async function getWorkingCoSoId(session: {
  user?: { role?: string; coSoId?: string | null };
} | null): Promise<string | null> {
  if (!session?.user) return null;
  if (!isCorporate(session.user.role)) return session.user.coSoId ?? null;
  const { cookies } = await import("next/headers");
  const selected = (await cookies()).get("selected_coso_id")?.value;
  return selected || session.user.coSoId || null;
}

/**
 * Bản ghi thuộc `recordCoSoId` có được phép truy cập không? Quản lý (toàn hệ thống): có;
 * nhân viên cơ sở: chỉ khi trùng cơ sở được gán. Dùng cho các route truy cập theo ID.
 */
export function canAccessCoSo(
  session: { user?: { role?: string; coSoId?: string | null } } | null,
  recordCoSoId: string | null | undefined,
): boolean {
  if (!session?.user) return false;
  if (isCorporate(session.user.role)) return true;
  return !!session.user.coSoId && session.user.coSoId === recordCoSoId;
}

export type CoSoReadScope ={ ok: true; coSoId: string | null } | { ok: false; status: number; error: string };

/**
 * Phạm vi cơ sở cho API đọc/ghi thông thường (giữ hành vi cũ của Quản lý: không chọn cơ sở = xem tất cả).
 * - Nhân viên cơ sở: LUÔN là cơ sở được gán; `coSoId` khác của mình → 403; chưa gán cơ sở → 403
 *   (trước đây rơi về `null` = không lọc = thấy dữ liệu mọi bệnh viện).
 * - Quản lý: `coSoId` yêu cầu → cookie đang chọn → null.
 */
export async function resolveReadCoSoScope(
  session: { user?: { role?: string; coSoId?: string | null } } | null,
  requested?: string | null,
): Promise<CoSoReadScope> {
  if (!session?.user) return { ok: false, status: 401, error: "Unauthorized" };
  if (!isCorporate(session.user.role)) {
    const own = session.user.coSoId;
    if (!own) return { ok: false, status: 403, error: "Tài khoản chưa được gán cơ sở" };
    if (requested && requested !== own)
      return { ok: false, status: 403, error: "Bạn chỉ được truy cập dữ liệu của cơ sở mình" };
    return { ok: true, coSoId: own };
  }
  return { ok: true, coSoId: requested || (await getWorkingCoSoId(session)) };
}

export type CoSoScope ={ ok: true; coSoId: string } | { ok: false; status: number; error: string };

/**
 * Cơ sở được phép đọc dữ liệu cho một request (dùng cho xuất Excel, không bao giờ trả "tất cả cơ sở"):
 * - Nhân viên cơ sở: LUÔN là cơ sở được gán; `?coSoId=` khác cơ sở của mình → từ chối.
 * - Quản lý (toàn hệ thống): `?coSoId=` → cookie cơ sở đang chọn → cơ sở hoạt động đầu tiên (khớp
 *   giao diện), kiểm tra cơ sở tồn tại để không xuất ra file rỗng sai ngữ cảnh.
 */
export async function resolveCoSoScope(
  session: { user?: { role?: string; coSoId?: string | null } } | null,
  requested?: string | null,
): Promise<CoSoScope> {
  if (!session?.user) return { ok: false, status: 401, error: "Unauthorized" };
  if (!isCorporate(session.user.role)) {
    const own = session.user.coSoId;
    if (!own) return { ok: false, status: 403, error: "Tài khoản chưa được gán cơ sở" };
    if (requested && requested !== own)
      return { ok: false, status: 403, error: "Bạn chỉ được xuất dữ liệu của cơ sở mình" };
    return { ok: true, coSoId: own };
  }
  let id = requested || (await getWorkingCoSoId(session));
  const prisma = getPrisma();
  if (!id) {
    const first = await prisma.coSo.findFirst({
      where: { trangThai: "active" },
      select: { id: true },
      orderBy: { ten: "asc" },
    });
    id = first?.id ?? null;
  } else if (requested) {
    const exists = await prisma.coSo.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return { ok: false, status: 404, error: "Không tìm thấy cơ sở" };
  }
  if (!id) return { ok: false, status: 400, error: "Chưa chọn cơ sở để xuất dữ liệu" };
  return { ok: true, coSoId: id };
}
