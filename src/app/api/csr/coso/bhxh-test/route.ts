import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { decryptSecret } from "@/lib/secret";
import { bhxhPasswordMd5 } from "@/lib/coso";
import { BHXH_QUERY_URL, BHXH_TOKEN_URL, postBhxhJson } from "@/lib/bhxh";

/* Lỗi trả 422 (không dùng 5xx): nginx chặn phản hồi 5xx nên người dùng không đọc được lý do. */
const LOI = 422;

/**
 * Kiểm tra tài khoản Cổng giám định BHYT: (1) đăng nhập lấy token, (2) dò quyền tra cứu thẻ bằng một
 * mã thẻ giả — có quyền thì cổng trả HTTP 200 (kèm mã "thẻ không tồn tại"), không có quyền thì 401/403.
 * Bước 2 cần thiết vì có tài khoản đăng nhập được nhưng không được phép tra cứu (lỗi của Hoa Lư).
 * body: { coSoId?, bhxhUser?, bhxhPass?, bhxhHoTenCB?, bhxhCccdCB? } — ô trống dùng giá trị đã lưu.
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
  let hoTenCb = String(b?.bhxhHoTenCB || "").trim();
  let cccdCb = String(b?.bhxhCccdCB || "").trim();
  try {
    pass = pass ? bhxhPasswordMd5(pass) : "";
    if ((!user || !pass || !hoTenCb || !cccdCb) && coSoId) {
      const cs = await getPrisma().coSo.findUnique({
        where: { id: coSoId },
        select: { bhxhUser: true, bhxhPass: true, bhxhHoTenCB: true, bhxhCccdCB: true },
      });
      if (!user) user = (decryptSecret(cs?.bhxhUser) || "").trim();
      if (!pass) pass = (decryptSecret(cs?.bhxhPass) || "").trim();
      if (!hoTenCb) hoTenCb = (cs?.bhxhHoTenCB || "").trim();
      if (!cccdCb) cccdCb = (decryptSecret(cs?.bhxhCccdCB) || "").trim();
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
      id_token?: string;
      APIKey?: { access_token?: string; id_token?: string } | null;
      maKetQua?: string | number;
    }>(BHXH_TOKEN_URL, { username: user, password: pass }, 10_000, 0);
    const j = res.data || {};
    const accessToken = j.access_token || j.APIKey?.access_token;
    if (accessToken) {
      // Bước 2: dò quyền tra cứu bằng mã thẻ giả (không phải người thật)
      const qs = new URLSearchParams({
        username: user,
        password: pass,
        token: accessToken,
        id_token: j.id_token || j.APIKey?.id_token || "",
      });
      const probe = await postBhxhJson(
        `${BHXH_QUERY_URL}?${qs.toString()}`,
        { maThe: "0000000000", hoTen: "KIEM TRA KET NOI", ngaySinh: "01/01/2000", username: user, password: pass, hoTenCb, cccdCb },
        10_000,
        0
      );
      const ms = Date.now() - t0;
      if (probe.status === 401 || probe.status === 403) {
        return NextResponse.json(
          {
            error: `Đăng nhập được nhưng tài khoản KHÔNG có quyền tra cứu thẻ BHYT (HTTP ${probe.status}) — cần tài khoản cơ sở dạng <Mã CSKCB>_BV được BHXH cấp quyền tra cứu`,
          },
          { status: LOI }
        );
      }
      return NextResponse.json({ ok: true, message: `Đăng nhập & quyền tra cứu thẻ BHYT đều OK (${ms} ms)` });
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
