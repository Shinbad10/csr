import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coSoId = new URL(request.url).searchParams.get("coSoId") || (await getWorkingCoSoId(session));
  try {
    const data = await getPrisma().buoiKham.findMany({
      where: coSoId ? { coSoId } : undefined,
      include: { 
        coSo: true, 
        _count: { select: { hoSo: true } },
        hoSo: { select: { nhom: true, trangThai: true, ngayMoThucTe: true, bacSiChiDinh: true } }
      },
      orderBy: { ngayKham: "desc" },
    });
    const result = data.map(item => {
      let nhomA = 0;
      let nhomB = 0;
      let daMo = 0;
      let chuaMo = 0;
      for (const hs of item.hoSo) {
        const isA = hs.nhom === "A" || ["NhomA", "DaNhacLich", "DaDonVien", "DaMoHauPhau"].includes(hs.trangThai);
        const isB = hs.nhom === "B" || hs.trangThai === "NhomB";
        const isMo = hs.ngayMoThucTe != null; // Chỉ tính "đã mổ" khi có ngày mổ thực tế (không chỉ vì có mã HIS)
        
        if (isA) nhomA++;
        else if (isB) nhomB++;
        
        if (isMo) {
          daMo++;
        } else if (isA) {
          chuaMo++;
        }
      }
      const { hoSo, ...rest } = item;
      // Đợt khám cũ chưa có bác sĩ → suy từ bệnh nhân đầu tiên đã ghi nhận.
      const bacSiKham = rest.bacSiKham || hoSo.find((h) => h.bacSiChiDinh)?.bacSiChiDinh || null;
      return { ...rest, bacSiKham, stats: { nhomA, nhomB, daMo, chuaMo } };
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "buoikham.manage"))
    return NextResponse.json({ error: "Bạn không có quyền tạo buổi khám" }, { status: 403 });

  try {
    const { coSoId, ngayKham, xa, diaDiem, bacSiKham, ghiChu } = await request.json();
    if (!coSoId || !ngayKham || !xa || !diaDiem)
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc (cơ sở, ngày, xã, địa điểm)" }, { status: 400 });

    const dateStr = new Date(ngayKham).toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
    const count = await getPrisma().buoiKham.count({
      where: { id: { startsWith: `ĐK-${dateStr}` } },
    });
    const id = `ĐK-${dateStr}-${String(count + 1).padStart(2, "0")}`;


    const data = await getPrisma().buoiKham.create({
      data: { id, coSoId, ngayKham: new Date(ngayKham), xa, diaDiem, bacSiKham: bacSiKham?.trim() || null, ghiChu: ghiChu || null, nguoiTao: session.user.id },
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}
