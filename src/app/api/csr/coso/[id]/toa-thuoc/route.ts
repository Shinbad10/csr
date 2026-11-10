import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, canAccessCoSo } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { docToaThuoc, type ToaThuoc } from "@/lib/csr";

/** Toa thuốc mặc định của cơ sở — in kèm phiếu khám của mọi đợt khám thuộc cơ sở. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!canAccessCoSo(session, id)) return NextResponse.json({ error: "Bạn chỉ xem được toa thuốc của cơ sở mình" }, { status: 403 });
  const c = await getPrisma().coSo.findUnique({ where: { id }, select: { toaThuoc: true } });
  if (!c) return NextResponse.json({ error: "Không tìm thấy cơ sở" }, { status: 404 });
  return NextResponse.json(docToaThuoc(c.toaThuoc));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "buoikham.manage"))
    return NextResponse.json({ error: "Bạn không có quyền sửa toa thuốc" }, { status: 403 });
  const { id } = await params;
  if (!canAccessCoSo(session, id)) return NextResponse.json({ error: "Bạn chỉ sửa được toa thuốc của cơ sở mình" }, { status: 403 });

  try {
    const body = await request.json();
    // Chuẩn hoá qua docToaThuoc: bỏ dòng trống, cắt khoảng trắng, giới hạn độ dài
    const toa: ToaThuoc = docToaThuoc(JSON.stringify(body ?? {}));
    if (toa.thuoc.length > 30) return NextResponse.json({ error: "Toa thuốc tối đa 30 dòng" }, { status: 400 });
    const gioiHan = (v: string, n: number) => v.slice(0, n);
    const sach: ToaThuoc = {
      thuoc: toa.thuoc.map((t) => ({ ten: gioiHan(t.ten, 200), soLuong: gioiHan(t.soLuong, 60), cachDung: gioiHan(t.cachDung, 400) })),
      loiDan: gioiHan(toa.loiDan, 1000),
    };
    const raw = sach.thuoc.length || sach.loiDan ? JSON.stringify(sach) : null;
    await getPrisma().coSo.update({ where: { id }, data: { toaThuoc: raw } });
    await audit(session.user.id, "CoSo", id, "sua", { toaThuoc: sach });
    return NextResponse.json(sach);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi lưu toa thuốc" }, { status: 422 });
  }
}
