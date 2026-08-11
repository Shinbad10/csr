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
