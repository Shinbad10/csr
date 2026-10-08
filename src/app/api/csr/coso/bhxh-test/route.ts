import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { decryptSecret } from "@/lib/secret";
import { bhxhPasswordMd5 } from "@/lib/coso";
import { BHXH_TOKEN_URL, postBhxhJson } from "@/lib/bhxh";

/* Lỗi trả 422 (không dùng 5xx): nginx chặn phản hồi 5xx nên người dùng không đọc được lý do. */
const LOI = 422;

/**
 * Thử đăng nhập Cổng giám định BHYT (chỉ lấy token, không tra cứu thẻ).
 * body: { coSoId?, bhxhUser?, bhxhPass? } — ô nào để trống thì dùng giá trị đã lưu của cơ sở.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const b = await request.json().catch(() => ({}));
  const coSoId = String(b?.coSoId || "").trim() || null;
  const isMaster = can(session.user.role, "admin.masterdata");
  const isIT = can(session.user.role, "admin.users") && !!coSoId && coSoId === session.user.coSoId;
  if (!isMaster && !isIT) return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });

  let user = String(b?.bhxhUser || "").trim();
  let pass = String(b?.bhxhPass || "").trim();
  try {
    pass = pass ? bhxhPasswordMd5(pass) : "";
    if ((!user || !pass) && coSoId) {
      const cs = await getPrisma().coSo.findUnique({ where: { id: coSoId }, select: { bhxhUser: true, bhxhPass: true } });
      if (!user) user = (decryptSecret(cs?.bhxhUser) || "").trim();
      if (!pass) pass = (decryptSecret(cs?.bhxhPass) || "").trim();
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không đọc được cấu hình BHXH" }, { status: LOI });
  }
  if (!user || !pass) {
    return NextResponse.json({ error: "Chưa có tài khoản / mật khẩu cổng BHXH để kiểm tra" }, { status: LOI });
  }

  const t0 = Date.now();
  try {
    const res = await postBhxhJson<{
      access_token?: string;
      APIKey?: { access_token?: string } | null;
      maKetQua?: string | number;
    }>(BHXH_TOKEN_URL, { username: user, password: pass }, 10_000, 0);
    const j = res.data || {};
    const ms = Date.now() - t0;
    if (j.access_token || j.APIKey?.access_token) {
      return NextResponse.json({ ok: true, message: `Đăng nhập cổng BHXH thành công (${ms} ms)` });
    }
    const ma = j.maKetQua ?? res.status;
    const giongCccd = /^\d{9,12}$/.test(user);
    return NextResponse.json(
      {
        error:
          String(ma) === "401"
            ? `Sai tài khoản hoặc mật khẩu cổng BHXH (mã 401)${
                giongCccd ? " — ô tài khoản đang giống số CCCD; tài khoản cổng thường có dạng <Mã CSKCB>_BV" : ""
              }`
            : `Cổng BHXH từ chối đăng nhập (mã ${ma})`,
      },
      { status: LOI }
    );
  } catch (e) {
    return NextResponse.json(
      { error: `Không kết nối được cổng BHXH: ${e instanceof Error ? e.message : String(e)}` },
      { status: LOI }
    );
  }
}
