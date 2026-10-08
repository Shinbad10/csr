import type { CoSo } from "@prisma/client";
import { createHash } from "crypto";
import { getPrisma } from "./prisma";
import {
  COSO_SECRET_FIELDS,
  decryptSecret,
  encryptSecret,
  encryptionReady,
  encryptionWriteEnabled,
  isEncrypted,
  type CoSoSecretField,
} from "./secret";

/*
  Dữ liệu cơ sở gửi ra trình duyệt. Thông tin kết nối HIS / cổng BHXH lưu mã hoá trong CSDL
  (src/lib/secret.ts) và KHÔNG gửi nguyên văn ra trình duyệt cho bất kỳ ai, kể cả quản trị: quản trị chỉ
  nhận bản che bớt (vd. 14.•••.•••.96) để nhận ra đã lưu gì; mật khẩu thì không có cả bản che.
  Muốn đổi thì nhập giá trị mới, để trống = giữ nguyên.
*/

/** Cho mọi người dùng đăng nhập (chọn cơ sở, bật/tắt tính năng HIS, cấu hình trường phiếu…). */
export function coSoPublic(c: CoSo) {
  return {
    id: c.id,
    ten: c.ten,
    diaChi: c.diaChi,
    trangThai: c.trangThai,
    sheetId: c.sheetId,
    cauHinhTruong: c.cauHinhTruong,
    bhxhMaCSKCB: c.bhxhMaCSKCB,
    hisConfigured: Boolean(c.hisHost && c.hisDbName),
    bhxhConfigured: Boolean(c.bhxhUser && c.bhxhPass),
  };
}

/**
 * Che bớt một giá trị kết nối: giữ vài ký tự đầu/cuối để nhận ra, phần giữa thay bằng "•".
 * IPv4 giữ octet đầu và cuối (14.•••.•••.96).
 */
export function maskSecret(v: string | null): string | null {
  const s = v?.trim();
  if (!s) return null;
  const ip = s.match(/^(\d{1,3})\.\d{1,3}\.\d{1,3}\.(\d{1,3})$/);
  if (ip) return `${ip[1]}.•••.•••.${ip[2]}`;
  const keep = s.length >= 10 ? 3 : s.length >= 7 ? 2 : s.length >= 4 ? 1 : 0;
  if (!keep) return "•".repeat(Math.max(3, s.length));
  return s.slice(0, keep) + "•".repeat(Math.min(6, Math.max(3, s.length - 2 * keep))) + s.slice(-keep);
}

const PASSWORD_FIELDS: CoSoSecretField[] = ["hisPass", "bhxhPass"];

/** Cho người quản trị sửa cấu hình: trường nào đã lưu + bản che bớt (mật khẩu không có bản che). */
export function coSoForAdmin(c: CoSo) {
  const daLuu = Object.fromEntries(COSO_SECRET_FIELDS.map((f) => [f, Boolean(c[f])])) as Record<CoSoSecretField, boolean>;
  const che: Partial<Record<CoSoSecretField, string>> = {};
  let secretError: string | null = null;
  for (const f of COSO_SECRET_FIELDS) {
    try {
      const plain = decryptSecret(c[f]); // giải mã cả mật khẩu để báo sớm khi khoá sai / thiếu
      if (!PASSWORD_FIELDS.includes(f)) {
        const m = maskSecret(plain);
        if (m) che[f] = m;
      }
    } catch (e) {
      secretError = e instanceof Error ? e.message : String(e);
    }
  }
  return {
    ...coSoPublic(c),
    bhxhHoTenCB: c.bhxhHoTenCB,
    daLuu,
    che,
    /** Từng trường đã ở dạng mã hoá trong CSDL (đã lưu nhưng false = còn bản rõ cũ). */
    maHoa: Object.fromEntries(COSO_SECRET_FIELDS.map((f) => [f, isEncrypted(c[f])])) as Record<CoSoSecretField, boolean>,
    /** Tất cả trường kết nối đã lưu đều ở dạng mã hoá. */
    daMaHoa: COSO_SECRET_FIELDS.every((f) => !c[f] || isEncrypted(c[f])),
    /**
     * "bat": máy chủ có khoá & được ghi mã hoá (dữ liệu cũ tự mã hoá khi đọc);
     * "cho-may-chu": có khoá nhưng là máy dev — chỉ đọc, việc mã hoá để máy chủ production làm;
     * "tat": chưa có CSR_ENCRYPTION_KEY.
     */
    cheDoMaHoa: (!encryptionReady() ? "tat" : encryptionWriteEnabled() ? "bat" : "cho-may-chu") as "bat" | "cho-may-chu" | "tat",
    secretError,
  };
}

/**
 * Cổng giám định BHYT nhận mật khẩu dạng MD5. Người quản trị nhập mật khẩu thường thì tự băm;
 * dán sẵn chuỗi MD5 (32 ký tự hex) thì giữ nguyên. Cổng không phân biệt hoa/thường của chuỗi MD5.
 */
export function bhxhPasswordMd5(v: string): string {
  const s = v.trim();
  return /^[0-9a-f]{32}$/i.test(s) ? s : createHash("md5").update(s, "utf8").digest("hex").toUpperCase();
}

const HIS_FIELDS: CoSoSecretField[] = ["hisHost", "hisPort", "hisUser", "hisPass", "hisDbName"];
const BHXH_FIELDS: CoSoSecretField[] = ["bhxhUser", "bhxhPass", "bhxhCccdCB"];

/**
 * Dữ liệu ghi CSDL cho các trường kết nối từ form, đã mã hoá.
 *  - Thêm mới: ô trống → null.
 *  - Sửa: ô trống / không gửi → giữ nguyên giá trị đã lưu; `xoaHis` / `xoaBhxh` = true → xoá cả nhóm.
 */
export function coSoSecretsForWrite(body: Record<string, unknown>, mode: "create" | "update") {
  const out: Partial<Record<CoSoSecretField, string | null>> = {};
  for (const f of COSO_SECRET_FIELDS) {
    const v = body[f];
    const text = typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
    if (!text) {
      if (mode === "create") out[f] = null;
      continue;
    }
    out[f] = encryptSecret(f === "bhxhPass" ? bhxhPasswordMd5(text) : text);
  }
  if (mode === "update") {
    if (body.xoaHis === true) for (const f of HIS_FIELDS) out[f] = null;
    if (body.xoaBhxh === true) for (const f of BHXH_FIELDS) out[f] = null;
  }
  return out;
}

/**
 * Tự mã hoá các trường kết nối còn dạng rõ (dữ liệu cũ) của một cơ sở — không cần ai nhập lại.
 * Chỉ chạy khi môi trường được phép ghi mã hoá và có khoá (máy chủ production). Ghi từng trường theo kiểu
 * "so sánh rồi mới ghi" (chỉ cập nhật khi giá trị trong CSDL vẫn là bản rõ vừa đọc) để không đè lên
 * thay đổi quản trị vừa lưu cùng lúc. Trả về bản ghi sau khi mã hoá (để hiển thị đúng ngay).
 */
export async function autoEncryptCoSo<T extends Partial<Record<CoSoSecretField, string | null>>>(id: string, row: T): Promise<T> {
  if (!encryptionWriteEnabled() || !encryptionReady()) return row;
  const plainFields = COSO_SECRET_FIELDS.filter((f) => {
    const v = row[f];
    return typeof v === "string" && v.trim() !== "" && !isEncrypted(v);
  });
  if (!plainFields.length) return row;
  const next = { ...row };
  const prisma = getPrisma();
  try {
    for (const f of plainFields) {
      const plain = row[f] as string;
      const enc = encryptSecret(plain);
      const r = await prisma.coSo.updateMany({ where: { id, [f]: plain }, data: { [f]: enc } });
      if (r.count > 0) (next as Record<string, string | null>)[f] = enc;
    }
    console.info(`[mã hoá] Đã tự mã hoá ${plainFields.length} trường kết nối của cơ sở ${id}`);
  } catch (e) {
    console.error(`[mã hoá] Tự mã hoá cơ sở ${id} lỗi:`, e);
  }
  return next;
}
