import { getPrisma } from "../src/lib/prisma";
import { sheetEnabled } from "../src/lib/googleSheet";

// helper from googleSheet.ts
function tabNameFor(coSo: { id: string; ten: string }): string {
  const clean = (coSo.ten || coSo.id).replace(/[[\]:\\/?*]/g, " ").replace(/\s+/g, " ").trim().slice(0, 90);
  return clean || coSo.id;
}

async function main() {
  console.log("sheetEnabled:", sheetEnabled());
  const prisma = getPrisma();
  const cosos = await prisma.coSo.findMany();
  console.log(`Found ${cosos.length} CoSo records in database.`);

  for (const c of cosos) {
    const totalHoSo = await prisma.hoSoBenhNhan.count({ where: { coSoId: c.id } });
    const tab = tabNameFor(c);
    console.log(`CoSo [${c.id}] ${c.ten} -> Tab Name: "${tab}" -> DB HoSo count: ${totalHoSo}`);
  }
}
main().catch(console.error);
