import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { batchCheckHISForPatients } from "@/lib/his";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { buoiKhamId, hoSoIds, month } = await request.json();
    const prisma = getPrisma();

    let whereClause: any = {};
    if (hoSoIds && Array.isArray(hoSoIds) && hoSoIds.length > 0) {
      whereClause.id = { in: hoSoIds };
    } else if (buoiKhamId) {
      whereClause.buoiKhamId = buoiKhamId;
    } else {
      return NextResponse.json({ error: "Vui lòng chọn buổi khám hoặc danh sách bệnh nhân để đối chiếu" }, { status: 400 });
    }

    const patients = await prisma.hoSoBenhNhan.findMany({
      where: whereClause,
      include: { buoiKham: true },
      take: 200, // giới hạn mỗi lần quét tối đa 200 hồ sơ để đảm bảo hiệu năng
    });

    if (patients.length === 0) {
      return NextResponse.json({ error: "Không có hồ sơ nào trong danh sách được chọn" }, { status: 404 });
    }

    const coSoId = patients[0].coSoId;
    const results = await batchCheckHISForPatients(coSoId, patients, month);

    const summary = {
      total: results.length,
      found: results.filter((r) => r.found).length,
      surgery: results.filter((r) => r.hasSurgery).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      results,
    });
  } catch (e: any) {
    console.error("Batch HIS Check Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi server" }, { status: 500 });
  }
}
