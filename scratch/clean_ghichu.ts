import { getPrisma } from "../src/lib/prisma";
import { appendHisNote } from "../src/lib/his";

async function main() {
  const prisma = getPrisma();
  const patients = await prisma.hoSoBenhNhan.findMany({
    where: {
      ghiChuMat2: { not: null }
    },
    select: {
      id: true,
      ghiChuMat2: true
    }
  });

  let count = 0;
  for (const p of patients) {
    if (!p.ghiChuMat2) continue;
    // Kiểm tra xem có bị lặp [HIS]: hoặc dài quá 950 ký tự không
    const lines = p.ghiChuMat2.split("\n");
    const hisLines = lines.filter(l => l.trim().startsWith("[HIS]:"));
    if (hisLines.length > 1 || p.ghiChuMat2.length > 950) {
      const latestHis = hisLines[hisLines.length - 1] || "";
      const cleanNote = lines.filter(l => !l.trim().startsWith("[HIS]:")).join("\n").trim();
      let newNote = cleanNote;
      if (latestHis) {
        newNote = cleanNote ? `${cleanNote}\n${latestHis}` : latestHis;
      }
      newNote = newNote.slice(0, 950);
      
      if (newNote !== p.ghiChuMat2) {
        await prisma.hoSoBenhNhan.update({
          where: { id: p.id },
          data: { ghiChuMat2: newNote }
        });
        count++;
      }
    }
  }
  console.log("Cleaned ghiChuMat2 records:", count);
}

main().catch(console.error);
