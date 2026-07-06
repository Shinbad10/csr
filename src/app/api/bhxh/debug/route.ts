import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { traCuuTheBHYT, getBhxhToken } from "@/lib/bhxh";

// Endpoint debug dành riêng cho Quản lý / kỹ thuật kiểm tra kết quả thô (raw JSON)
// từ Cổng tiếp nhận BHXH theo từng cơ sở khi triển khai trên mạng nội bộ bệnh viện.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vaiTro = (session.user as { vaiTro?: string })?.vaiTro;
  if (vaiTro !== "Quản lý") {
    return NextResponse.json({ error: "Chỉ Quản lý mới được truy cập công cụ debug BHXH" }, { status: 403 });
  }

  const url = new URL(request.url);
  const cccd = url.searchParams.get("cccd") || url.searchParams.get("maThe") || "";
  const hoTen = url.searchParams.get("hoTen") || "";
  const ngaySinh = url.searchParams.get("ngaySinh") || "";
  const checkToken = url.searchParams.get("token") === "1";
  const coSoId = url.searchParams.get("coSoId") || (await getWorkingCoSoId(session));

  if (checkToken) {
    const tokenInfo = await getBhxhToken(coSoId, true);
    return NextResponse.json({
      ok: !!tokenInfo,
      coSoId: coSoId || "default (.env)",
      msg: tokenInfo ? `Lấy token BHXH thành công (tài khoản: ${tokenInfo.creds.user})` : "Lấy token BHXH thất bại",
      token: tokenInfo ? { access_token: tokenInfo.access_token.slice(0, 15) + "...", id_token: tokenInfo.id_token ? "yes" : "no" } : null,
    });
  }

  if (!cccd || !hoTen) {
    return NextResponse.json({
      error: "Vui lòng cung cấp tham số ?cccd=<mã>&hoTen=<tên>&ngaySinh=<dd/mm/yyyy>&coSoId=<id> (hoặc ?token=1 để kiểm tra kết nối token)",
    });
  }

  const startTime = Date.now();
  const res = await traCuuTheBHYT({ ma: cccd, hoTen, ngaySinh, coSoId });
  const durationMs = Date.now() - startTime;

  return NextResponse.json({
    ok: res.success,
    durationMs,
    coSoId: coSoId || "default (.env)",
    query: { ma: cccd, hoTen, ngaySinh, coSoId },
    parsedThe: res.the || null,
    error: res.error || null,
    rawResponse: res.raw || null,
  });
}
