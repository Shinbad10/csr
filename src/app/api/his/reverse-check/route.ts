import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getHISSurgeryList, foldName, foldId, foldPhone } from "@/lib/his";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { coSoId: reqCoSoId, month, date } = await request.json();
    const prisma = getPrisma();

    let coSoId = reqCoSoId;
    if (!coSoId) {
      const firstCoSo = await prisma.coSo.findFirst();
      coSoId = firstCoSo?.id || "BT";
    }

    const hisSurgeries = await getHISSurgeryList(coSoId, month, date);

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
      const hisBhyt = (his.bhyt || "").toUpperCase().trim();
      const hisBhytDigits = foldId(hisBhyt);
      const hisPhone = foldPhone(his.sdt);

      // Tìm khớp 3 tầng: 
      // 1. CCCD (định danh 9-12 số)
      // 2. BHYT (mã thẻ 15 ký tự hoặc 10 số cuối BHXH)
      // 3. Họ tên + Năm sinh / SĐT
      let matched = null;
      let matchType: "exact" | "partial" = "partial";
      let matchReason = "";
      let ambiguous = false;
      let candidates = 0;

      // 1. Khớp theo CCCD
      if (hisCccd && hisCccd.length >= 9) {
        const byCccd = csrPatients.filter((csr) => foldId(csr.cccd) === hisCccd);
        if (byCccd.length > 0) {
          matched = byCccd[0];
          matchType = "exact";
          matchReason = "Khớp CCCD";
          candidates = byCccd.length;
          ambiguous = byCccd.length > 1;
        }
      }

      // 2. Khớp theo mã thẻ BHYT (nếu chưa khớp CCCD)
      if (!matched && (hisBhyt.length >= 10 || hisBhytDigits.length >= 10)) {
        const byBhyt = csrPatients.filter((csr) => {
          const csrBhyt = (csr.bhyt || "").toUpperCase().trim();
          if (!csrBhyt) return false;
          if (csrBhyt === hisBhyt) return true;
          const csrDigits = foldId(csrBhyt);
          if (csrDigits.length >= 10 && hisBhytDigits.length >= 10) {
            return csrDigits.endsWith(hisBhytDigits.slice(-10)) || hisBhytDigits.endsWith(csrDigits.slice(-10));
          }
          return false;
        });
        if (byBhyt.length > 0) {
          matched = byBhyt[0];
          matchType = "exact";
          matchReason = "Khớp thẻ BHYT";
          candidates = byBhyt.length;
          ambiguous = byBhyt.length > 1;
        }
      }

      // 3. Khớp theo Họ tên + Năm sinh / SĐT
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
          matchReason = "Khớp Họ tên + Năm sinh";
          candidates = byInfo.length;
          ambiguous = byInfo.length > 1;
        }
      }

      if (matched) {
        // Kiểm tra nếu bệnh nhân trong CSR đã từng mổ mắt trước đây
        const hadPriorSurgeryInCsr = Boolean(
          matched.trangThaiDieuTri === "Đã mổ" ||
          (matched.ngayMoThucTe && his.ngayMo && new Date(his.ngayMo).getTime() > new Date(matched.ngayMoThucTe).getTime() + 86400000) ||
          (matched.ghiChuMat2 && matched.ghiChuMat2.trim().length > 0)
        );

        const isMat2 = Boolean(his.isMat2 || hadPriorSurgeryInCsr);
        const lanMo = his.lanMo > 1 ? his.lanMo : (hadPriorSurgeryInCsr ? 2 : 1);
        const mat2Reason = hadPriorSurgeryInCsr && matched.ngayMoThucTe
          ? `Đã mổ mắt 1 ngày ${new Date(matched.ngayMoThucTe).toLocaleDateString("vi-VN")}`
          : (his.lanMo > 1 ? `Ca mổ thứ ${his.lanMo} trên HIS` : "");

        return {
          ...his,
          isMat2,
          lanMo,
          mat2Reason,
          matchedCsr: {
            id: matched.id,
            maBN: matched.maBN,
            hoTen: matched.hoTen,
            namSinh: matched.namSinh,
            cccd: matched.cccd || null,
            bhyt: matched.bhyt || null,
            sdt: matched.sdt,
            buoiKham: matched.buoiKham
              ? {
                  ngayKham: matched.buoiKham.ngayKham,
                  xa: matched.buoiKham.xa,
                  diaDiem: matched.buoiKham.diaDiem,
                }
              : null,
            trangThaiDieuTri: matched.trangThaiDieuTri,
            daMo: matched.trangThaiDieuTri === "Đã mổ" || matched.daDon,
            ngayMoThucTe: matched.ngayMoThucTe,
            ghiChuMat2: matched.ghiChuMat2 || null,
            maBNHIS: matched.maBNHIS,
            matchType,
            matchReason,
            candidates,
            ambiguous,
          },
        };
      }
      return { ...his, matchedCsr: null };
    });

    const summary = {
      totalHIS: listWithMatches.length,
      matchedCSR: listWithMatches.filter((h: any) => h.matchedCsr).length,
      alreadyLinked: listWithMatches.filter((h: any) => h.matchedCsr?.maBNHIS).length,
      unlinkedMatched: listWithMatches.filter((h: any) => h.matchedCsr && !h.matchedCsr?.maBNHIS).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      list: listWithMatches,
      surgeries: listWithMatches,
    });
  } catch (e: any) {
    console.error("Reverse HIS Check Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi server" }, { status: 500 });
  }
}
