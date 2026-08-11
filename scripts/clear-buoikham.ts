import "dotenv/config";
import { getCloudPrisma, getLocalPrisma } from "../src/lib/prisma";
import { clearDataRows, sheetEnabled } from "../src/lib/googleSheet";

async function clearDb(name: string, getClient: () => any) {
  try {
    const prisma = getClient();
    console.log(`--- Clear data on [${name}] ---`);
    const nhatKy = await prisma.nhatKyTheoDoi.deleteMany({});
    console.log(`Deleted NhatKyTheoDoi: ${nhatKy.count}`);
    const syncQ = await prisma.syncQueue.deleteMany({});
    console.log(`Deleted SyncQueue: ${syncQ.count}`);
    const hoSo = await prisma.hoSoBenhNhan.deleteMany({});
    console.log(`Deleted HoSoBenhNhan: ${hoSo.count}`);
    const buoiKham = await prisma.buoiKham.deleteMany({});
    console.log(`Deleted BuoiKham: ${buoiKham.count}`);
    console.log(`Done clearing [${name}]!`);
  } catch (e) {
    console.error(`Error clearing [${name}]:`, e);
  }
}

async function main() {
  await clearDb("Cloud DB (MSSQL)", getCloudPrisma);
  await clearDb("Local DB (SQLite)", getLocalPrisma);

  if (sheetEnabled()) {
    console.log("--- Clearing Google Sheet data rows ---");
    try {
      const prisma = getCloudPrisma();
      const cosos = await prisma.coSo.findMany({ select: { id: true, ten: true, sheetId: true } });
      for (const c of cosos) {
        try {
          await clearDataRows(c);
          console.log(`Cleared Google Sheet data for [${c.ten} (${c.id})]`);
        } catch (err) {
          console.error(`Error clearing Google Sheet for [${c.id}]:`, err);
        }
      }
    } catch (err) {
      console.error("Error clearing Google Sheets:", err);
    }
  }

  process.exit(0);
}

main();
