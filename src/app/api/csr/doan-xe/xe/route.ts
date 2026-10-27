import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getWorkingCoSoId } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";
import { LOAI_XE } from "@/lib/csr";

// Đoàn xe của từng điểm đón: loại xe (số chỗ) + giờ đón. Bệnh nhân thuộc đoàn nào vẫn ghi bằng
// tag [Đoàn N] trên hồ sơ — bảng này chỉ thêm thông tin về chiếc xe của đoàn đó.

/** Tiến trình đang chạy còn giữ Prisma Client sinh trước khi có model DoanXe (vd. `next dev` chưa khởi động lại). */
function chuaCoModel() {
  return !(getPrisma() as unknown as Record<string, unknown>).doanXe;
}
const LOI_CHUA_CO_MODEL = "Server đang dùng Prisma Client cũ (chưa có DoanXe) — khởi động lại server";

/** DB chưa chạy prisma/manual/004_doan_xe.sql → coi như chưa có xe nào, trang vẫn chạy. */
function chuaCoBang(e: unknown) {
  const msg = String((e as Error)?.message || e);
  return /Invalid object name|DoanXe.*does not exist|no such table/i.test(msg);
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(request.url).searchParams;
  const coSoId = sp.get("coSoId") || (await getWorkingCoSoId(session));
  if (chuaCoModel()) return NextResponse.json({ items: [], chuaCoBang: true, error: LOI_CHUA_CO_MODEL });
  try {
    const items = await getPrisma().doanXe.findMany({
      where: coSoId ? { coSoId } : {},
      orderBy: [{ ngayDon: "asc" }, { diemDon: "asc" }, { soDoan: "asc" }],
    });
    return NextResponse.json({ items });
  } catch (e) {
    if (chuaCoBang(e)) return NextResponse.json({ items: [], chuaCoBang: true });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

/** Tạo / cập nhật xe của một đoàn: { coSoId?, ngayDon, diemDon, soDoan, soCho, gioDon? } */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const coSoId: string | null = body.coSoId || (await getWorkingCoSoId(session));
  const ngayDon = String(body.ngayDon || "").trim();
  const diemDon = String(body.diemDon || "").trim();
  const soDoan = Number(body.soDoan);
  const soCho = Number(body.soCho);
  const gioDon = body.gioDon ? String(body.gioDon).trim() : null;

  if (!coSoId) return NextResponse.json({ error: "Chưa xác định cơ sở" }, { status: 400 });
  if (!ngayDon || !diemDon) return NextResponse.json({ error: "Thiếu ngày đón hoặc điểm đón" }, { status: 400 });
  if (!Number.isInteger(soDoan) || soDoan < 1) return NextResponse.json({ error: "Số đoàn không hợp lệ" }, { status: 400 });
  if (!(LOAI_XE as readonly number[]).includes(soCho)) return NextResponse.json({ error: "Loại xe không hợp lệ" }, { status: 400 });
  if (chuaCoModel()) return NextResponse.json({ error: LOI_CHUA_CO_MODEL }, { status: 503 });

  try {
    const xe = await getPrisma().doanXe.upsert({
      where: { coSoId_ngayDon_diemDon_soDoan: { coSoId, ngayDon, diemDon, soDoan } },
      create: { coSoId, ngayDon, diemDon, soDoan, soCho, gioDon },
      update: { soCho, ...(gioDon !== null ? { gioDon } : {}) },
    });
    broadcastEvent({ type: "hoso_change", action: "update", coSoId, data: { action: "doan_xe", id: xe.id } });
    return NextResponse.json({ xe });
  } catch (e) {
    if (chuaCoBang(e))
      return NextResponse.json({ error: "CSDL chưa có bảng DoanXe — cần chạy prisma/manual/004_doan_xe.sql" }, { status: 503 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

/** Xoá xe của một đoàn (?id=…). Không đụng hồ sơ — bệnh nhân còn tag đoàn đó thì đoàn vẫn hiện, chỉ mất loại xe. */
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  if (chuaCoModel()) return NextResponse.json({ error: LOI_CHUA_CO_MODEL }, { status: 503 });
  try {
    const xe = await getPrisma().doanXe.delete({ where: { id } });
    broadcastEvent({ type: "hoso_change", action: "update", coSoId: xe.coSoId, data: { action: "doan_xe", id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (chuaCoBang(e)) return NextResponse.json({ error: "CSDL chưa có bảng DoanXe" }, { status: 503 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}
