import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = new URL(request.url).searchParams.get("all"); // ?all=1 → cả inactive (cho quản trị)
  try {
    const data = await getPrisma().coSo.findMany({
      where: all ? undefined : { trangThai: "active" },
      orderBy: { ten: "asc" },
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "admin.masterdata")) return NextResponse.json({ error: "Không đủ quyền" }, { status: 403 });
  try {
    const { id, ten, diaChi, bhxhUser, bhxhPass, bhxhMaCSKCB, bhxhHoTenCB, bhxhCccdCB, hisHost, hisPort, hisUser, hisPass, hisDbName, cauHinhTruong } = await request.json();
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
        bhxhUser: bhxhUser?.trim() || null,
        bhxhPass: bhxhPass?.trim() || null,
        bhxhMaCSKCB: bhxhMaCSKCB?.trim() || null,
        bhxhHoTenCB: bhxhHoTenCB?.trim() || null,
        bhxhCccdCB: bhxhCccdCB?.trim() || null,
        hisHost: hisHost?.trim() || null,
        hisPort: hisPort?.trim() || null,
        hisUser: hisUser?.trim() || null,
        hisPass: hisPass?.trim() || null,
        hisDbName: hisDbName?.trim() || null,
        cauHinhTruong: cauHinhTruong || null,
      },
    });
    await audit(session.user.id, "CoSo", data.id, "them", { ten });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi (mã cơ sở có thể đã tồn tại)" }, { status: 500 });
  }
}
