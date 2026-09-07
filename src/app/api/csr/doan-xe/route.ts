import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(request.url).searchParams;
  const coSoId = sp.get("coSoId") || (await getWorkingCoSoId(session));
  const buoiKhamId = sp.get("buoiKhamId") || undefined;
  const ngay = sp.get("ngay") || undefined; // YYYY-MM-DD
  const diemDon = sp.get("diemDon") || undefined;
  const search = sp.get("search") || "";

  try {
    const prisma = getPrisma();

    // Lấy tất cả bệnh nhân có xếp xe hoặc có lịch hẹn điều trị
    const where: any = {
      AND: [
        coSoId ? { coSoId } : {},
        buoiKhamId ? { buoiKhamId } : {},
        {
          OR: [
            { nhom: "A" },
            { xacNhanDieuTri: true },
            { ngayDieuTri: { not: null } },
            { diemDon: { not: null } },
            { gioDon: { not: null } },
          ],
        },
      ],
    };

    if (search.trim()) {
      where.AND.push({
        OR: [
          { hoTen: { contains: search } },
          { sdt: { contains: search } },
          { sdtNguoiNha: { contains: search } },
          { cccd: { contains: search } },
          { diemDon: { contains: search } },
          { ghiChuTuVan: { contains: search } },
        ],
      });
    }

    if (diemDon && diemDon !== "ALL") {
      where.AND.push({ diemDon });
    }

    // Lọc theo ngày hẹn điều trị (YYYY-MM-DD)
    if (ngay && ngay !== "ALL") {
      const startOfDay = new Date(`${ngay}T00:00:00.000Z`);
      const endOfDay = new Date(`${ngay}T23:59:59.999Z`);
      where.AND.push({
        ngayDieuTri: {
          gte: startOfDay,
          lte: endOfDay,
        },
      });
    }

    const items = await prisma.hoSoBenhNhan.findMany({
      where,
      include: {
        buoiKham: true,
        tuVanVien: { select: { maNV: true, hoTen: true } },
      },
      orderBy: [
        { ngayDieuTri: "asc" },
        { gioDon: "asc" },
        { diemDon: "asc" },
        { stt: "asc" },
      ],
    });

    // Thống kê & Danh mục unique
    const uniqueDates = Array.from(
      new Set(
        items
          .map((i) => (i.ngayDieuTri ? new Date(i.ngayDieuTri).toISOString().slice(0, 10) : null))
          .filter(Boolean) as string[]
      )
    ).sort();

    const uniqueDiemDon = Array.from(
      new Set(items.map((i) => i.diemDon?.trim()).filter(Boolean) as string[])
    ).sort();

    const daDonCount = items.filter((i) => i.daDon || i.ngayDenBV).length;
    const daMoCount = items.filter((i) => i.trangThaiDieuTri === "Đã mổ" || i.ngayMoThucTe).length;
    const chuaDonCount = items.length - daDonCount;

    return NextResponse.json({
      items,
      summary: {
        total: items.length,
        daDon: daDonCount,
        chuaDon: chuaDonCount,
        daMo: daMoCount,
        soDiemDon: uniqueDiemDon.length,
      },
      uniqueDates,
      uniqueDiemDon,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi tải đoàn xe" }, { status: 500 });
  }
}
