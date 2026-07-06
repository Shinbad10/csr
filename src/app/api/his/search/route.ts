import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { searchHIS } from "@/lib/his";

// Tìm HIS thủ công theo từ khoá (họ tên / CCCD / mã HIS) cho 1 hồ sơ — dùng khi đối chiếu tự động không khớp.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { hoSoId, q } = await request.json();
    if (!hoSoId) return NextResponse.json({ error: "Thiếu ID hồ sơ" }, { status: 400 });
    if (!q || !String(q).trim()) return NextResponse.json({ error: "Nhập từ khoá tìm kiếm" }, { status: 400 });

    const hoSo = await getPrisma().hoSoBenhNhan.findUnique({
      where: { id: hoSoId },
      select: { coSoId: true },
    });
    if (!hoSo) return NextResponse.json({ error: "Không tìm thấy hồ sơ bệnh nhân" }, { status: 404 });

    const results = await searchHIS(hoSo.coSoId, String(q));
    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    console.error("HIS search route error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi server" }, { status: 500 });
  }
}
