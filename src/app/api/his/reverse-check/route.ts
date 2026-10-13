import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getHISSurgeryList, foldName, foldId, foldCccd, foldPhone } from "@/lib/his";

import { HOSO_CUA_DOT_CON_HIEU_LUC } from "@/lib/dotKham";
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
      where: { coSoId, ...HOSO_CUA_DOT_CON_HIEU_LUC }, // bỏ hồ sơ thuộc đợt khám đã xoá mềm
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
      const hisCccd = foldCccd(his.cccd); // bù số 0 đầu mà HIS/CSR lưu dạng số làm mất
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
        const byCccd = csrPatients.filter((csr) => foldCccd(csr.cccd) === hisCccd);
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
        /* CSR đã có ca mổ TRƯỚC ca này (cách hơn 1,5 ngày) → ca này là Mắt 2. Trước đây chỉ cần CSR đang
           "Đã mổ" hoặc có bất kỳ ghi chú HIS nào là bị coi là Mắt 2 — kể cả khi đó chính là ca mổ này. */
        const NGAY_MS = 86400000;
        const csrMoMs = matched.ngayMoThucTe ? new Date(matched.ngayMoThucTe).getTime() : 0;
        const hisMoMs = his.ngayMo ? new Date(his.ngayMo).getTime() : 0;
        const hadPriorSurgeryInCsr = Boolean(csrMoMs && hisMoMs && hisMoMs - csrMoMs > 1.5 * NGAY_MS);

        const isMat2 = Boolean(his.isMat2 || hadPriorSurgeryInCsr);
        /* CSR đã ghi nhận ĐÚNG ca mổ này (cùng ngày, hoặc đã lưu ghi chú Mắt 2). Chỉ có mã HIS / đã đến
           viện thì CHƯA tính — BN được đối chiếu lúc mới nhập viện (chờ mổ) vẫn phải được đánh dấu khi mổ. */
        const daGhiCaNay =
          !his.choMo &&
          Boolean(
            (csrMoMs && hisMoMs && Math.abs(hisMoMs - csrMoMs) <= 1.5 * NGAY_MS) ||
              (isMat2 && /Mắt 2/.test(matched.ghiChuMat2 || "")) ||
              (matched.trangThaiDieuTri === "Đã mổ" && !csrMoMs)
          );
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
            daMo: daGhiCaNay,
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

    // Số liệu ca mổ chỉ tính ca có trong sổ phòng mổ; ca chờ mổ đếm riêng
    const caMo = listWithMatches.filter((h: any) => !h.choMo);
    const choMo = listWithMatches.filter((h: any) => h.choMo);
    const summary = {
      totalHIS: caMo.length,
      matchedCSR: caMo.filter((h: any) => h.matchedCsr).length,
      alreadyLinked: caMo.filter((h: any) => h.matchedCsr?.daMo).length,
      unlinkedMatched: caMo.filter((h: any) => h.matchedCsr && !h.matchedCsr.daMo).length,
      choMo: choMo.length,
      choMoCSR: choMo.filter((h: any) => h.matchedCsr).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      list: listWithMatches,
      surgeries: listWithMatches,
    });
  } catch (e: any) {
    console.error("Reverse HIS Check Error:", e);
    // 422 thay vì 500: nginx chặn phản hồi 5xx nên người dùng không đọc được lý do lỗi HIS
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi server" }, { status: 422 });
  }
}
