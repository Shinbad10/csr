import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  // Bảo vệ mọi route trừ auth API, login, static assets, PWA files, và ảnh/icon.
  matcher: [
    "/((?!api|login|_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.(?:json|webmanifest)|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};
