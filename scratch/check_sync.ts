import { getPrisma } from "../src/lib/prisma";
import { drainSyncQueue, triggerSync } from "../src/lib/syncWorker";
import { sheetEnabled } from "../src/lib/googleSheet";

async function main() {
  console.log("sheetEnabled:", sheetEnabled());
  const prisma = getPrisma();
  const count = await prisma.syncQueue.count();
  console.log("SyncQueue count:", count);
  const rows = await prisma.syncQueue.findMany({ take: 5 });
  console.log("Sample rows:", rows);

  if (count > 0) {
    console.log("Running drainSyncQueue...");
    const res = await drainSyncQueue(10);
    console.log("drainSyncQueue result:", res);
  }
}
main().catch(console.error);
