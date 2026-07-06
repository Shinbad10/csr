// BR-01: Mã BN = {MÃ CƠ SỞ}-{MMDD ngày khám}-{STT 3 chữ số}
export function genMaBN(coSoId: string, ngayKham: Date, stt: number): string {
  const mm = String(ngayKham.getMonth() + 1).padStart(2, "0");
  const dd = String(ngayKham.getDate()).padStart(2, "0");
  return `${coSoId.toUpperCase()}-${mm}${dd}-${String(stt).padStart(3, "0")}`;
}
