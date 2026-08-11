import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getHISSurgeryList, foldName, foldId, foldPhone } from "@/lib/his";

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
      const hisName = foldName(his.hoTen);
      const hisYear = String(his.namSinh).trim();
      const hisCccd = foldId(his.cccd);
      const hisPhone = foldPhone(his.sdt);

      // Tìm khớp 2 lớp: CCCD (định danh duy nhất) -> Họ tên + Năm sinh / SĐT.
      // Đếm số ứng viên ở mỗi lớp: nhiều hơn 1 nghĩa là KHÔNG phân biệt được người nào,
      // phải đánh dấu để chặn liên kết tự động (rất nhiều BN cùng xã trùng tên + năm sinh).
      let matched = null;
      let matchType: "exact" | "partial" = "partial";
      let ambiguous = false;
      let candidates = 0;

      if (hisCccd) {
        const byCccd = csrPatients.filter((csr) => foldId(csr.cccd) === hisCccd);
        if (byCccd.length > 0) {
          matched = byCccd[0];
          matchType = "exact";
          candidates = byCccd.length;
          ambiguous = byCccd.length > 1;
        }
      }

      if (!matched) {
        const byInfo = csrPatients.filter((csr) => {
          const name = foldName(csr.hoTen);
          if (name !== hisName) return false;
          if (String(csr.namSinh).trim() === hisYear) return true;
          return !!hisPhone && foldPhone(csr.sdt) === hisPhone;
        });
        if (byInfo.length > 0) {
          matched = byInfo[0];
          matchType = "partial";
          candidates = byInfo.length;
          ambiguous = byInfo.length > 1;
        }
      }

      if (matched) {
        return {
          ...his,
          matchedCsr: {
            id: matched.id,
            maBN: matched.maBN,
            hoTen: matched.hoTen,
            namSinh: matched.namSinh,
            cccd: matched.cccd || null,
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
            matchType,
            /** true = có nhiều hồ sơ CSR cùng khớp, phải chọn tay thay vì liên kết tự động */
            ambiguous,
            candidates,
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
