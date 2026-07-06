import { getPrisma } from "./src/lib/prisma";
async function clear() {
  const p = getPrisma();
  await p.nhatKyTheoDoi.deleteMany();
  await p.hoSoBenhNhan.deleteMany();
  await p.buoiKham.deleteMany();
  console.log("Deleted NhatKyTheoDoi, HoSoBenhNhan, BuoiKham.");
}
clear();
