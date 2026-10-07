import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { autoEncryptCoSo, coSoForAdmin, coSoPublic, coSoSecretsForWrite } from "@/lib/coso";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = new URL(request.url).searchParams.get("all"); // ?all=1 → cả inactive (cho quản trị)
  try {
    const rows = await getPrisma().coSo.findMany({
      where: all ? undefined : { trangThai: "active" },
      orderBy: { ten: "asc" },
    });
    // Dữ liệu kết nối cũ còn dạng rõ → máy chủ tự mã hoá luôn, không cần quản trị nhập lại
    const data = await Promise.all(rows.map((c) => autoEncryptCoSo(c.id, c)));
    /* Trước đây trả nguyên bản ghi — MỌI tài khoản đăng nhập đều nhận mật khẩu HIS / BHXH dạng rõ.
       Nay: quản trị toàn hệ thống (hoặc IT của chính cơ sở) nhận cấu hình đã giải mã, không kèm mật khẩu;
       người dùng khác chỉ nhận thông tin công khai. */
    const isMaster = can(session.user.role, "admin.masterdata");
    const isIT = can(session.user.role, "admin.users");
    return NextResponse.json(
      data.map((c) => (isMaster || (isIT && c.id === session.user.coSoId) ? coSoForAdmin(c) : coSoPublic(c)))
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "admin.masterdata")) return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });
  try {
    const body = await request.json();
    const { id, ten, diaChi, bhxhMaCSKCB, bhxhHoTenCB, cauHinhTruong } = body;
    if (!id || !ten) return NextResponse.json({ error: "Thiếu mã hoặc tên cơ sở" }, { status: 400 });
    if (cauHinhTruong) {
      try {
        const parsed = JSON.parse(cauHinhTruong);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      } catch {
        return NextResponse.json({ error: "Cấu hình trường không hợp lệ" }, { status: 400 });
      }
    }
    const data = await getPrisma().coSo.create({
      data: {
        id: id.trim(),
        ten: ten.trim(),
        diaChi: diaChi || null,
        bhxhMaCSKCB: bhxhMaCSKCB?.trim() || null,
        bhxhHoTenCB: bhxhHoTenCB?.trim() || null,
        // Thông tin kết nối HIS / BHXH lưu dạng mã hoá AES-256-GCM
        ...coSoSecretsForWrite(body, "create"),
        cauHinhTruong: cauHinhTruong || null,
      },
    });
    await audit(session.user.id, "CoSo", data.id, "them", { ten });
    return NextResponse.json(coSoForAdmin(await autoEncryptCoSo(data.id, data)));
  } catch (e) {
    // 422 thay vì 500: nginx chặn phản hồi 5xx, người quản trị không đọc được lý do (vd. thiếu khoá mã hoá)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi (mã cơ sở có thể đã tồn tại)" }, { status: 422 });
  }
}
