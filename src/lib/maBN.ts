/** YYMMDD theo múi giờ máy. KHÔNG dùng toISOString() — nó quy về UTC nên ở VN (UTC+7)
 *  ngày khám 10/7 lúc 00:00 sẽ thành 09/7, làm mã đợt khám lệch đúng 1 ngày. */
export function yymmdd(d: Date): string {
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

// BR-01: Mã BN = {MÃ CƠ SỞ}-{MMDD ngày khám}-{STT 3 chữ số}
export function genMaBN(coSoId: string, ngayKham: Date, stt: number): string {
  const mm = String(ngayKham.getMonth() + 1).padStart(2, "0");
  const dd = String(ngayKham.getDate()).padStart(2, "0");
  return `${coSoId.toUpperCase()}-${mm}${dd}-${String(stt).padStart(3, "0")}`;
}

/** Lấy số thứ tự mã BN tiếp theo trên toàn cơ sở cho ngày khám đó,
 *  tránh trùng khoá maBN khi có nhiều đợt khám cùng một ngày. */
export async function getNextMaSeq(prisma: any, coSoId: string, ngayKham: Date): Promise<number> {
  const maPrefix = `${genMaBN(coSoId, ngayKham, 0).slice(0, -3)}`;
  const lastHs = await prisma.hoSoBenhNhan.findFirst({
    where: { maBN: { startsWith: maPrefix } },
    orderBy: { maBN: "desc" },
    select: { maBN: true },
  });
  if (!lastHs || !lastHs.maBN) return 1;
  const n = parseInt(lastHs.maBN.slice(maPrefix.length), 10);
  return Number.isFinite(n) && n > 0 ? n + 1 : 1;
}

