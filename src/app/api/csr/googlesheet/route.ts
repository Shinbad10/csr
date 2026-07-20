import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { sheetEnabled, clearDataRows } from "@/lib/googleSheet";
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
// ?rebuild=1 → DỰNG LẠI: xoá hết dòng dữ liệu cũ rồi đẩy lại toàn bộ hồ sơ.
// Dùng khi đổi bộ cột báo cáo (dòng cũ theo cột cũ sẽ lệch, không tự ghi đè được).
export async function POST(request: Request) {
  const g = await guard();
  if (g.error) return g.error;
  if (!sheetEnabled()) return NextResponse.json({ ok: false, error: "Chưa cấu hình GOOGLE_CREDENTIALS trong .env" }, { status: 409 });

  const rebuild = new URL(request.url).searchParams.get("rebuild") === "1";
  const prisma = getPrisma();

  try {
    if (rebuild) {
      const cosos = await prisma.coSo.findMany({ select: { id: true, ten: true, sheetId: true } });
      for (const c of cosos) await clearDataRows(c);

      // Xếp lại toàn bộ hồ sơ vào hàng đợi (bỏ hàng đợi cũ để không đẩy trùng).
      const hoSos = await prisma.hoSoBenhNhan.findMany({ select: { id: true }, orderBy: [{ buoiKhamId: "asc" }, { stt: "asc" }] });
      await prisma.syncQueue.deleteMany({});
      if (hoSos.length > 0) {
        await prisma.syncQueue.createMany({ data: hoSos.map((h) => ({ hoSoId: h.id })) });
      }

      await audit(g.session!.user.id, "CoSo", "*", "sua", { hanhDong: "Dựng lại Google Sheet", soHoSo: hoSos.length });
    }

    // Dựng lại có thể nhiều hồ sơ → rút hàng đợi theo lô cho tới khi hết (tối đa 20 lô).
    let processed = 0, failed = 0;
    for (let i = 0; i < 20; i++) {
      const r = await drainSyncQueue(200);
      processed += r.processed;
      failed += r.failed;
      if (!rebuild) break;              // đồng bộ thường: 1 lô là đủ
      if (r.skipped || r.processed === 0) break; // hết hàng đợi hoặc đang có drain khác chạy
    }
    const remaining = await prisma.syncQueue.count();
    return NextResponse.json({ ok: true, rebuild, processed, failed, remaining });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}
