// UC-02 / BR-02 — Tầng client giao tiếp Cổng tiếp nhận BHXH (egw.baohiemxahoi.gov.vn)
// Quản lý token cache trong bộ nhớ theo từng cơ sở (coSoId) với TTL ~50 phút,
// tự động refresh khi hết hạn/401, hỗ trợ đọc tài khoản cổng BHXH từ Database CoSo (hoặc fallback .env).

import { bhytLevel } from "./csr";
import { getPrisma } from "./prisma";

const ENV_FALLBACK = {
  user: process.env.BHXH_USERNAME || "",
  pass: process.env.BHXH_PASSWORD || "",
  maCSKCB: process.env.BHXH_MACSKCB || "",
  hoTenCB: process.env.BHXH_HOTENCB || "",
  cccdCB: process.env.BHXH_CCCDCB || "",
  tokenUrl: process.env.BHXH_TOKEN_URL || "http://egw.baohiemxahoi.gov.vn/api/token/take",
  queryUrl: process.env.BHXH_QUERY_URL || "http://egw.baohiemxahoi.gov.vn/api/egw/KQNhanLichSuKCB2024",
};

interface TokenCache {
  access_token: string;
  id_token: string;
  expiresAt: number;
}

// Map cache token theo từng coSoId (hoặc 'default' nếu fallback .env)
const _tokenCache = new Map<string, TokenCache>();

export interface BhxhCreds {
  user: string;
  pass: string;
  maCSKCB: string;
  hoTenCB: string;
  cccdCB: string;
  tokenUrl: string;
  queryUrl: string;
}

// Chuẩn hóa ngày sinh sang định dạng dd/mm/yyyy mà API BHXH yêu cầu
export function toDobBhxh(s: string): string {
  if (!s) return "";
  const trim = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trim)) {
    const [y, m, d] = trim.split("-");
    return `${d}/${m}/${y}`;
  }
  if (/^\d{8}$/.test(trim)) {
    return `${trim.slice(0, 2)}/${trim.slice(2, 4)}/${trim.slice(4)}`;
  }
  return trim;
}

// Lấy cấu hình tài khoản BHXH cho cơ sở (ưu tiên Database CoSo -> fallback .env)
export async function getBhxhCreds(coSoId?: string | null): Promise<BhxhCreds> {
  if (coSoId) {
    try {
      const cs = await getPrisma().coSo.findUnique({
        where: { id: coSoId },
        select: { bhxhUser: true, bhxhPass: true, bhxhMaCSKCB: true, bhxhHoTenCB: true, bhxhCccdCB: true },
      });
      if (cs && cs.bhxhUser && cs.bhxhPass) {
        return {
          user: cs.bhxhUser.trim(),
          pass: cs.bhxhPass.trim(),
          maCSKCB: cs.bhxhMaCSKCB?.trim() || ENV_FALLBACK.maCSKCB,
          hoTenCB: cs.bhxhHoTenCB?.trim() || ENV_FALLBACK.hoTenCB,
          cccdCB: cs.bhxhCccdCB?.trim() || ENV_FALLBACK.cccdCB,
          tokenUrl: ENV_FALLBACK.tokenUrl,
          queryUrl: ENV_FALLBACK.queryUrl,
        };
      }
    } catch (e) {
      console.warn(`[BHXH] Lỗi truy vấn DB cấu hình BHXH cho cơ sở ${coSoId}, chuyển sang dùng fallback:`, e);
    }
  }

  return { ...ENV_FALLBACK };
}

// Xin token từ cổng BHXH theo tài khoản của cơ sở (hoặc cache TTL 50 phút)
export async function getBhxhToken(
  coSoId?: string | null,
  forceRefresh = false
): Promise<{ access_token: string; id_token: string; creds: BhxhCreds } | null> {
  const creds = await getBhxhCreds(coSoId);
  if (!creds.user || !creds.pass) {
    console.warn(`[BHXH] Chưa cấu hình tài khoản BHXH cho cơ sở ${coSoId || "(mặc định)"}`);
    return null;
  }

  const cacheKey = coSoId || "default";
  const now = Date.now();
  const cached = _tokenCache.get(cacheKey);

  if (!forceRefresh && cached && cached.expiresAt > now) {
    return { access_token: cached.access_token, id_token: cached.id_token, creds };
  }

  try {
    const res = await fetch(creds.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ username: creds.user, password: creds.pass }),
      signal: AbortSignal.timeout(10_000),
    });

    const j = await res.json().catch(() => ({}));
    const access_token = j.access_token || j.APIKey?.access_token;
    const id_token = j.id_token || j.APIKey?.id_token || "";

    if (!access_token) {
      console.error(`[BHXH] Lấy token thất bại cho cơ sở ${cacheKey}:`, j);
      _tokenCache.delete(cacheKey);
      return null;
    }

    _tokenCache.set(cacheKey, {
      access_token,
      id_token,
      expiresAt: now + 50 * 60 * 1000,
    });

    return { access_token, id_token, creds };
  } catch (e) {
    console.error(`[BHXH] Lỗi kết nối lấy token cho cơ sở ${cacheKey}:`, e);
    return null;
  }
}

export interface ThongTinTheBHYT {
  maThe: string;
  mucHuong: string;
  tuNgay?: string;
  denNgay?: string;
  maDKBD?: string;
  tenDKBD?: string;
  hoTen?: string;
  ngaySinh?: string;
  diaChi?: string;
  gioiTinh?: string;
}

export interface KetQuaTraCuuBHYT {
  success: boolean;
  the?: ThongTinTheBHYT;
  error?: string;
  raw?: unknown;
}

// Bóc tách thông tin thẻ từ dữ liệu JSON thô trả về của cổng BHXH
export function parseTheBhyt(raw: unknown): ThongTinTheBHYT | null {
  if (!raw || typeof raw !== "object") return null;
  const o = (raw as Record<string, unknown>);
  
  // Thử tìm trong các khối data thường gặp của BHXH (data, thongTinThe, kq, hoặc root)
  const sources = [o, o.data, o.thongTinThe, o.kq, o.result];
  let found: Record<string, unknown> | null = null;
  let maThe = "";

  for (const src of sources) {
    if (src && typeof src === "object") {
      const s = src as Record<string, unknown>;
      const cand = [s.maThe, s.MaThe, s.maThe_moi, s.ma_the].find(
        (x) => typeof x === "string" && /^[A-Za-z]{2}\d{13}$|^[A-Za-z]{2}\d/.test(x as string)
      );
      if (cand) {
        maThe = String(cand).toUpperCase();
        found = s;
        break;
      }
    }
  }

  if (!maThe || !found) return null;

  const getStr = (...keys: string[]) => {
    for (const k of keys) {
      if (found && typeof found[k] === "string" && found[k]) return String(found[k]).trim();
    }
    return undefined;
  };

  const tuNgay = getStr("gtTheTu", "tuNgay", "TuNgay", "giaTriTu", "gt_the_tu", "ngay_hieu_luc");
  const denNgay = getStr("gtTheDen", "denNgay", "DenNgay", "giaTriDen", "gt_the_den", "ngay_het_han");
  const maDKBD = getStr("maDKBD", "maKCB", "MaKCB", "ma_kcb", "noi_dkbd_ma");
  const tenDKBD = getStr("tenDKBD", "tenKCB", "TenKCB", "ten_kcb", "noi_dkbd_ten", "noiDKBD");
  const hoTen = getStr("hoTen", "HoTen", "ho_ten", "ten_benh_nhan");
  const ngaySinh = getStr("ngaySinh", "NgaySinh", "ngay_sinh", "dob");
  const diaChi = getStr("diaChi", "DiaChi", "dia_chi");
  const gioiTinh = getStr("gioiTinh", "GioiTinh", "gioi_tinh");

  // Mức hưởng: ưu tiên từ cổng, nếu không có tự suy từ ký tự thứ 3 của mã thẻ
  let mucHuong = getStr("mucHuong", "MucHuong", "maQuyenLoi", "quyen_loi", "ty_le") || "";
  if (!mucHuong && maThe.length >= 3) {
    mucHuong = bhytLevel(maThe);
  } else if (mucHuong && !mucHuong.includes("%")) {
    mucHuong = `${mucHuong}%`;
  }

  return {
    maThe,
    mucHuong,
    tuNgay,
    denNgay,
    maDKBD,
    tenDKBD,
    hoTen,
    ngaySinh,
    diaChi,
    gioiTinh,
  };
}

// Tra cứu thông tin thẻ BHYT từ Cổng BHXH (tự động dùng tài khoản cơ sở trong DB)
export async function traCuuTheBHYT(
  params: { ma: string; hoTen: string; ngaySinh?: string; coSoId?: string | null },
  retry = true
): Promise<KetQuaTraCuuBHYT> {
  const ma = params.ma.trim();
  const hoTen = params.hoTen.trim();
  if (!ma || !hoTen) {
    return { success: false, error: "Thiếu mã thẻ/CCCD hoặc họ tên bệnh nhân" };
  }

  const tokenInfo = await getBhxhToken(params.coSoId, !retry);
  if (!tokenInfo) {
    return { success: false, error: "Không kết nối được cổng BHXH hoặc chưa cấu hình tài khoản BHXH cho cơ sở này" };
  }

  const { access_token, id_token, creds } = tokenInfo;

  try {
    const queryParams = new URLSearchParams({
      username: creds.user,
      password: creds.pass,
      token: access_token,
      id_token: id_token,
    });

    const payload = {
      maThe: ma,
      hoTen: hoTen,
      ngaySinh: toDobBhxh(params.ngaySinh || ""),
      username: creds.user,
      password: creds.pass,
      hoTenCb: creds.hoTenCB,
      cccdCb: creds.cccdCB,
    };

    const res = await fetch(`${creds.queryUrl}?${queryParams.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    if ((res.status === 401 || res.status === 403) && retry) {
      console.warn(`[BHXH] Token hết hạn cho cơ sở ${params.coSoId || "default"}, đang refresh và thử lại...`);
      _tokenCache.delete(params.coSoId || "default");
      return traCuuTheBHYT(params, false);
    }

    const raw = await res.json().catch(() => ({}));
    const the = parseTheBhyt(raw);

    if (the) {
      return { success: true, the, raw };
    }

    const rObj = (raw || {}) as Record<string, unknown>;
    const errMsg = String(rObj.message || rObj.error || rObj.noiDung || rObj.msg || "Không tìm thấy thông tin thẻ BHYT hợp lệ trên cổng BHXH");
    return { success: false, error: errMsg, raw };
  } catch (e) {
    if (retry && e instanceof Error && (e.name === "AbortError" || e.message.includes("fetch"))) {
      console.warn("[BHXH] Lỗi mạng/timeout, thử lại 1 lần...");
      return traCuuTheBHYT(params, false);
    }
    return {
      success: false,
      error: e instanceof Error ? `Lỗi kết nối cổng BHXH: ${e.message}` : "Lỗi không xác định khi tra cứu BHYT",
    };
  }
}
