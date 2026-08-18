import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { traCuuTheBHYT } from "@/lib/bhxh";

// Tra cứu thông tin thẻ BHYT qua Cổng tiếp nhận BHXH (egw.baohiemxahoi.gov.vn).
// Sử dụng tài khoản cấu hình trong Database theo từng Cơ sở (hoặc fallback .env) và bộ đệm token trong bộ nhớ.
// Tự động làm mới (refresh) Token khi hết hạn hoặc gặp lỗi mã 501.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { maThe, cccd, hoTen, ngaySinh } = body;
    const ma = (maThe || cccd || "").trim();
    if (!ma || !hoTen) {
      return NextResponse.json({ success: false, error: "Thiếu CCCD/mã thẻ hoặc họ tên để tra cứu" }, { status: 200 });
    }

    const coSoId = body.coSoId || (await getWorkingCoSoId(session));
    const res = await traCuuTheBHYT({
      ma,
      hoTen,
      ngaySinh,
      coSoId,
      forceRefresh: Boolean(body.forceRefresh),
    });
    const url = new URL(request.url);
    const isDebug = url.searchParams.get("debug") === "1" || (session.user as { vaiTro?: string })?.vaiTro === "Quản lý";

    if (res.success && res.the) {
      return NextResponse.json({
        success: true,
        maThe: res.the.maThe,
        the: res.the,
        notification: res.notification || res.the.ghiChu || "Thẻ còn giá trị sử dụng",
        medicalHistory: res.the.dsLichSuKCB || [],
        verification: res.the.dsLichSuKT || [],
        raw: isDebug ? res.raw : undefined,
      });
    }

    return NextResponse.json({
      success: false,
      the: res.the || undefined,
      notification: res.notification || "",
      error: res.error || "Không tìm thấy thông tin thẻ BHYT",
      raw: isDebug ? res.raw : undefined,
    }, { status: 200 });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Lỗi tra cứu BHXH",
    }, { status: 200 });
  }
}
