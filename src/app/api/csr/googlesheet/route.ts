import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { sheetEnabled } from "@/lib/googleSheet";
import { drainSyncQueue } from "@/lib/syncWorker";

export const dynamic = "force-dynamic";

async function guard() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!can(session.user.role, "admin.masterdata")) return { error: NextResponse.json({ error: "Không đủ quyền" }, { status: 403 }) };
  return { session };
}

// Trạng thái kết nối Google Sheet + danh sách sheet theo cơ sở.
export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  try {
    const [cosos, pending] = await Promise.all([
      getPrisma().coSo.findMany({ orderBy: { ten: "asc" }, select: { id: true, ten: true, sheetId: true } }),
      getPrisma().syncQueue.count(),
    ]);
    return NextResponse.json({
      status: {
        enabled: sheetEnabled(),
        shareEmail: process.env.GOOGLE_SHARE_EMAIL?.trim() || null,
        tab: process.env.GOOGLE_SHEET_TAB || "DanhSach",
        sharedSheetId: process.env.GOOGLE_SHEET_ID?.trim() || null, // chế độ dùng chung 1 file
        cronConfigured: !!process.env.CRON_SECRET,
        pending,
      },
      cosos: cosos.map((c) => ({ ...c, envSheetId: process.env[`SHEET_${c.id}`]?.trim() || null })),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

// Gán / xoá spreadsheetId thủ công cho một cơ sở (ghi CoSo.sheetId).
export async function PUT(request: Request) {
  const g = await guard();
  if (g.error) return g.error;
  try {
    const { coSoId, sheetId } = await request.json();
    if (!coSoId) return NextResponse.json({ error: "Thiếu mã cơ sở" }, { status: 400 });
    const data = await getPrisma().coSo.update({ where: { id: coSoId }, data: { sheetId: sheetId?.trim() || null } });
    await audit(g.session!.user.id, "CoSo", coSoId, "sua", { sheetId: sheetId?.trim() || null });
    return NextResponse.json({ ok: true, sheetId: data.sheetId });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}

// Đồng bộ ngay: rút hàng đợi SyncQueue đẩy lên Google Sheet.
export async function POST() {
  const g = await guard();
  if (g.error) return g.error;
  if (!sheetEnabled()) return NextResponse.json({ ok: false, error: "Chưa cấu hình GOOGLE_CREDENTIALS trong .env" }, { status: 409 });
  try {
    const result = await drainSyncQueue(200);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}
