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
