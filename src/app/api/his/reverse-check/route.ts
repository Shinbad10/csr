import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getHISSurgeryList } from "@/lib/his";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { coSoId: reqCoSoId, month } = await request.json();
    const prisma = getPrisma();

    let coSoId = reqCoSoId;
    if (!coSoId) {
      const firstCoSo = await prisma.coSo.findFirst();
      coSoId = firstCoSo?.id || "BT";
    }

    const hisSurgeries = await getHISSurgeryList(coSoId, month);

    // Lấy tất cả hồ sơ bệnh nhân của cơ sở trong DB để đối chiếu
    const csrPatients = await prisma.hoSoBenhNhan.findMany({
      where: { coSoId },
      include: {
        buoiKham: {
          select: { ngayKham: true, xa: true, diaDiem: true },
        },
      },
      orderBy: { buoiKham: { ngayKham: "desc" } },
    });

    const listWithMatches = hisSurgeries.map((his: any) => {
      const hisName = his.hoTen.trim().toLowerCase();
      const hisYear = String(his.namSinh).trim();
      const hisCccd = his.cccd?.trim() || "";

      // Tìm khớp (3 lớp định danh: CCCD -> Họ tên & Năm sinh -> Họ tên & SĐT)
      const matched = csrPatients.find((csr) => {
        if (hisCccd && csr.cccd && csr.cccd.trim() === hisCccd) return true;
        if (csr.hoTen.trim().toLowerCase() === hisName && String(csr.namSinh).trim() === hisYear) return true;
        if (his.sdt && csr.sdt && csr.sdt.trim() === his.sdt.trim() && csr.sdt.trim().length >= 9 && csr.hoTen.trim().toLowerCase() === hisName) return true;
        return false;
      });

      if (matched) {
        return {
          ...his,
          matchedCsr: {
            id: matched.id,
            maBN: matched.maBN,
            hoTen: matched.hoTen,
            namSinh: matched.namSinh,
            sdt: matched.sdt,
            buoiKham: matched.buoiKham
              ? {
                  ngayKham: matched.buoiKham.ngayKham,
                  xa: matched.buoiKham.xa,
                  diaDiem: matched.buoiKham.diaDiem,
                }
              : null,
            trangThaiDieuTri: matched.trangThaiDieuTri,
            maBNHIS: matched.maBNHIS,
            daDon: matched.daDon,
          },
        };
      }
      return { ...his, matchedCsr: null };
    });

    const summary = {
      totalHIS: listWithMatches.length,
      matchedCSR: listWithMatches.filter((h: any) => h.matchedCsr).length,
      alreadyLinked: listWithMatches.filter((h: any) => h.matchedCsr?.maBNHIS).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      list: listWithMatches,
    });
  } catch (e: any) {
    console.error("Reverse HIS Check Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi server" }, { status: 500 });
  }
}
