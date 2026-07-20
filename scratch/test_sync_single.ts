import { getPrisma } from "../src/lib/prisma";
import { syncHoSo, sheetEnabled } from "../src/lib/googleSheet";

async function main() {
  console.log("sheetEnabled:", sheetEnabled());
  const prisma = getPrisma();
  const hoSo = await prisma.hoSoBenhNhan.findFirst({
    include: { coSo: true, buoiKham: true }
  });
  if (!hoSo) {
    console.log("No HoSoBenhNhan found in database!");
    return;
  }
  console.log("Found sample HoSo:", hoSo.maBN, hoSo.hoTen, "coSo:", hoSo.coSo?.ten);
  try {
    const res = await syncHoSo(hoSo.id);
    console.log("syncHoSo result:", res);
  } catch (err) {
    console.error("syncHoSo threw error:", err);
  }
}
main().catch(console.error);
