import { NextResponse } from "next/server";
import { drainSyncQueue } from "@/lib/syncWorker";

// UC-10 / BR-15 — Cron dự phòng: rút hàng đợi SyncQueue đẩy lên Google Sheet.
// Gọi định kỳ bằng Windows Task Scheduler:
//   curl "http://localhost:3000/api/cron/sync?secret=<CRON_SECRET>"
// Bảo vệ bằng CRON_SECRET (query ?secret= hoặc header x-cron-secret).
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET chưa cấu hình" }, { status: 503 });

  const provided = new URL(request.url).searchParams.get("secret") || request.headers.get("x-cron-secret");
  if (provided !== secret) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const result = await drainSyncQueue(200);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Lỗi" }, { status: 500 });
  }
}
