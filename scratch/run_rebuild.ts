import { getPrisma } from "../src/lib/prisma";
import { drainSyncQueue } from "../src/lib/syncWorker";
import { clearDataRows } from "../src/lib/googleSheet";

async function main() {
  const prisma = getPrisma();
  console.log("Starting batch rebuild test...");
  const cosos = await prisma.coSo.findMany();
  for (const c of cosos) {
    await clearDataRows(c);
  }
  const hoSos = await prisma.hoSoBenhNhan.findMany({ select: { id: true }, orderBy: [{ buoiKhamId: "asc" }, { stt: "asc" }] });
  console.log(`Queueing ${hoSos.length} records...`);
  await prisma.syncQueue.deleteMany({});
  if (hoSos.length > 0) {
    await prisma.syncQueue.createMany({ data: hoSos.map((h) => ({ hoSoId: h.id })) });
  }

  let totalProcessed = 0;
  let totalFailed = 0;
  const start = Date.now();
  for (let i = 0; i < 20; i++) {
    const res = await drainSyncQueue(200);
    totalProcessed += res.processed;
    totalFailed += res.failed;
    console.log(`Batch ${i + 1} finished in ${(Date.now() - start)}ms -> processed: ${res.processed}, failed: ${res.failed}`);
    if (res.processed === 0 && res.failed === 0) break;
  }
  console.log(`ALL DONE in ${(Date.now() - start)}ms! Total Processed: ${totalProcessed}, Failed: ${totalFailed}`);
}
main().catch(console.error);
