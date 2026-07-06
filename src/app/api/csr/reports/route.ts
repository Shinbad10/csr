import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

// Thống kê cơ bản theo cơ sở đang làm việc (UC-08).
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coSoId = new URL(request.url).searchParams.get("coSoId") || (await getWorkingCoSoId(session));
  const prisma = getPrisma();
  try {
    const where = coSoId ? { coSoId } : {};
    const [tong, theoTrangThai, soBuoi, coSo, daMo] = await Promise.all([
      prisma.hoSoBenhNhan.count({ where }),
      prisma.hoSoBenhNhan.groupBy({ by: ["trangThai"], where, _count: { _all: true } }),
      prisma.buoiKham.count({ where: coSoId ? { coSoId } : {} }),
      coSoId ? prisma.coSo.findUnique({ where: { id: coSoId }, select: { sheetId: true } }) : Promise.resolve(null),
      // "Đã mổ" chỉ tính khi có ngày mổ thực tế (không chỉ vì có mã HIS / trạng thái)
      prisma.hoSoBenhNhan.count({ where: { ...where, ngayMoThucTe: { not: null } } }),
    ]);
    const byStatus: Record<string, number> = {};
    for (const r of theoTrangThai) byStatus[r.trangThai] = r._count._all;
    const nhomA = (byStatus["NhomA"] || 0) + (byStatus["DaNhacLich"] || 0) + (byStatus["DaDonVien"] || 0) + (byStatus["DaMoHauPhau"] || 0);
    const nhomB = byStatus["NhomB"] || 0;
    // Link Google Sheet: chế độ dùng chung → file chung; ngược lại → file riêng của cơ sở.
    const sharedId = process.env.GOOGLE_SHEET_ID?.trim();
    const sheetId = sharedId || coSo?.sheetId || null;
    const sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}` : null;
    return NextResponse.json({ tong, soBuoi, byStatus, nhomA, nhomB, daMo, sheetUrl });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}
