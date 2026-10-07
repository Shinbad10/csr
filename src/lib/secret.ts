import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * Mã hoá thông tin kết nối nhạy cảm của cơ sở (HIS, cổng BHXH) trước khi lưu CSDL — AES-256-GCM.
 *
 * Khoá lấy từ biến môi trường CSR_ENCRYPTION_KEY (chuỗi bất kỳ, nên ≥ 32 ký tự ngẫu nhiên),
 * KHÔNG lưu trong CSDL hay mã nguồn. Mọi máy chạy ứng dụng dùng chung CSDL (máy chủ, máy dev)
 * phải dùng CÙNG một khoá; đổi hoặc mất khoá thì phải nhập lại mật khẩu HIS/BHXH.
 *
 * Định dạng lưu: "enc:v1:<iv>:<tag>:<dữ liệu>" (base64). Giá trị không có tiền tố là bản rõ
 * cũ — vẫn đọc được; máy chủ production tự mã hoá lại khi đọc tới (src/lib/coso.ts).
 */

const PREFIX = "enc:v1:";

function getKey(): Buffer | null {
  const raw = process.env.CSR_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  return createHash("sha256").update(raw, "utf8").digest();
}

export const isEncrypted = (v?: string | null) => typeof v === "string" && v.startsWith(PREFIX);

export function encryptionReady(): boolean {
  return getKey() !== null;
}

/**
 * Môi trường này có được GHI dữ liệu dạng mã hoá không. Mặc định chỉ production (máy chủ chính).
 *
 * Máy dev dùng CHUNG CSDL với production: nếu dev mã hoá trước khi production chạy bản code biết
 * giải mã (hoặc production dùng khoá khác) thì production đọc chuỗi mã hoá như mật khẩu → mất kết nối
 * HIS/BHXH ngay. Nên dev chỉ đọc/giải mã; production tự mã hoá dữ liệu cũ khi đọc tới.
 * Ép bật/tắt: CSR_ENCRYPT_WRITE=1 / 0.
 */
export function encryptionWriteEnabled(): boolean {
  if (process.env.CSR_ENCRYPT_WRITE === "1") return true;
  if (process.env.CSR_ENCRYPT_WRITE === "0") return false;
  return process.env.NODE_ENV === "production";
}

/**
 * Giá trị để GHI CSDL: mã hoá nếu môi trường được phép ghi mã hoá, ngược lại giữ dạng rõ; rỗng → null.
 * Production thiếu khoá thì báo lỗi (không âm thầm lưu bản rõ).
 */
export function encryptSecret(v?: string | null): string | null {
  const plain = v?.trim();
  if (!plain) return null;
  if (isEncrypted(plain)) return plain;
  if (!encryptionWriteEnabled()) return plain;
  const key = getKey();
  if (!key) throw new Error("Chưa cấu hình CSR_ENCRYPTION_KEY trong .env — không thể lưu thông tin kết nối an toàn");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + [iv, tag, data].map((b) => b.toString("base64")).join(":");
}

/** Giải mã; bản rõ cũ (không tiền tố) trả nguyên. Sai/thiếu khoá thì báo lỗi rõ ràng. */
export function decryptSecret(v?: string | null): string | null {
  if (!v) return null;
  if (!isEncrypted(v)) return v;
  const key = getKey();
  if (!key) throw new Error("Thiếu CSR_ENCRYPTION_KEY trong .env — không giải mã được cấu hình HIS/BHXH");
  const [ivB64, tagB64, dataB64] = v.slice(PREFIX.length).split(":");
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("CSR_ENCRYPTION_KEY không khớp khoá đã dùng để mã hoá cấu hình HIS/BHXH — kiểm tra .env hoặc nhập lại thông tin kết nối");
  }
}

/** Các cột của CoSo được mã hoá khi lưu — không bao giờ gửi ra trình duyệt (xem src/lib/coso.ts). */
export const COSO_SECRET_FIELDS = ["hisHost", "hisPort", "hisUser", "hisPass", "hisDbName", "bhxhUser", "bhxhPass", "bhxhCccdCB"] as const;
export type CoSoSecretField = (typeof COSO_SECRET_FIELDS)[number];
