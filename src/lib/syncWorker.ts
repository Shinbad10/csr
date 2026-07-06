// UC-10 / BR-15 — Rút hàng đợi SyncQueue và đẩy lên Google Sheet.
// Gọi 2 nơi: fire-and-forget ngay sau mỗi ghi (cảm giác real-time) và cron dự phòng.
import { getPrisma } from "./prisma";
import { syncHoSo, sheetEnabled } from "./googleSheet";

const MAX_RETRIES = 5; // quá ngưỡng → bỏ khỏi hàng đợi, ghi log để xử lý tay
let running = false;    // khoá tránh nhiều lần drain chồng nhau (fire-and-forget liên tục)

export interface DrainResult {
  processed: number;
  failed: number;
  skipped?: boolean;
}

export async function drainSyncQueue(limit = 50): Promise<DrainResult> {
  if (!sheetEnabled()) return { processed: 0, failed: 0, skipped: true };
  if (running) return { processed: 0, failed: 0, skipped: true };
  running = true;
  const prisma = getPrisma();
  let processed = 0;
  let failed = 0;

  try {
    const rows = await prisma.syncQueue.findMany({ orderBy: { createdAt: "asc" }, take: limit });

    // Gom theo hồ sơ: nhiều lần sửa cùng 1 hồ sơ chỉ cần đẩy trạng thái mới nhất 1 lần.
    const byHoSo = new Map<string, { ids: number[]; retries: number }>();
    for (const r of rows) {
      const g = byHoSo.get(r.hoSoId) || { ids: [], retries: 0 };
      g.ids.push(r.id);
      g.retries = Math.max(g.retries, r.retries);
      byHoSo.set(r.hoSoId, g);
    }

    for (const [hoSoId, g] of byHoSo) {
      try {
        await syncHoSo(hoSoId);
        await prisma.syncQueue.deleteMany({ where: { id: { in: g.ids } } });
        processed++;
      } catch (e) {
        failed++;
        if (g.retries + 1 >= MAX_RETRIES) {
          await prisma.syncQueue.deleteMany({ where: { id: { in: g.ids } } });
          console.error(`[sync] Bỏ hồ sơ ${hoSoId} sau ${MAX_RETRIES} lần lỗi:`, e);
        } else {
          await prisma.syncQueue.updateMany({ where: { id: { in: g.ids } }, data: { retries: { increment: 1 } } });
          console.error(`[sync] Lỗi đẩy hồ sơ ${hoSoId} (lần ${g.retries + 1}):`, e);
        }
      }
    }
  } finally {
    running = false;
  }

  return { processed, failed };
}

// Gọi không chờ (không chặn response). Nuốt lỗi vì hàng đợi đã giữ việc cho cron retry.
export function triggerSync(): void {
  if (!sheetEnabled()) return;
  drainSyncQueue().catch((e) => console.error("[sync] triggerSync lỗi:", e));
}
