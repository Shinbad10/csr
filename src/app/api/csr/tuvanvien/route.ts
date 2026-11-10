import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, canAccessCoSo, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Gợi ý cho ô "Nhân viên tư vấn" trên phiếu khám: tài khoản tư vấn viên đang hoạt động của cơ sở,
 * cộng các tên đã từng nhập tay trên hồ sơ của cơ sở (nhiều lần dùng đứng trước). Chỉ trả về tên.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const yeuCau = new URL(request.url).searchParams.get("coSoId");
  const coSoId = yeuCau && canAccessCoSo(session, yeuCau) ? yeuCau : await getWorkingCoSoId(session);
  if (!coSoId) return NextResponse.json([]);

  const prisma = getPrisma();
  const [users, daNhap] = await Promise.all([
    prisma.nguoiDungCSR.findMany({
      where: { coSoId, trangThai: "active", vaiTro: { contains: "TuVanVien" } },
      select: { hoTen: true },
      orderBy: { hoTen: "asc" },
    }),
    prisma.hoSoBenhNhan
      .groupBy({
        by: ["nhanVienTuVan"],
        where: { coSoId, nhanVienTuVan: { not: null } },
        _count: { _all: true },
      })
      .catch(() => [] as { nhanVienTuVan: string | null; _count: { _all: number } }[]),
  ]);

  const ten = new Map<string, string>(); // khoá không phân biệt hoa/thường, khoảng trắng
  const them = (v: string | null | undefined) => {
    const t = (v || "").replace(/\s+/g, " ").trim();
    if (t.length < 2) return;
    const k = t.toLowerCase();
    if (!ten.has(k)) ten.set(k, t);
  };
  users.forEach((u) => them(u.hoTen));
  daNhap
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 80)
    .forEach((r) => them(r.nhanVienTuVan));

  return NextResponse.json([...ten.values()]);
}
