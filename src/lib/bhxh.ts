// UC-02 / BR-02 — Tầng client server-side giao tiếp Cổng tiếp nhận BHXH (egw.baohiemxahoi.gov.vn)
// Quản lý token cache trong bộ nhớ theo từng cơ sở (coSoId) với TTL ~50 phút,
// TỰ ĐỘNG REFRESH TOKEN khi hết hạn (cả HTTP 401/403 và mã lỗi maKetQua: 501 / "Token không đúng"),
// Đọc tài khoản Cổng BHXH trực tiếp từ Database CoSo theo từng Bệnh viện / Cơ sở.

import https from "node:https";
import http from "node:http";
import { bhytLevel } from "./csr";
import { getPrisma, getLocalPrisma } from "./prisma";
import { getTenCSKCB } from "./cskcb";
export * from "./bhxh-types";
import {
  type LichSuKCBRecord,
  type LichSuKTRecord,
  type ThongTinTheBHYT,
  type KetQuaTraCuuBHYT,
  toDobBhxh,
  explainMaKetQua,
} from "./bhxh-types";

const BHXH_TOKEN_URL = process.env.BHXH_TOKEN_URL || "https://egw.baohiemxahoi.gov.vn/api/token/take";
const BHXH_QUERY_URL = process.env.BHXH_QUERY_URL || "https://egw.baohiemxahoi.gov.vn/api/egw/KQNhanLichSuKCB2024";

interface TokenCache {
  access_token: string;
  id_token: string;
  expiresAt: number;
}

// Map cache token theo từng coSoId
const _tokenCache = new Map<string, TokenCache>();
// Gộp các lần xin token trùng nhau đang bay (2 tab / 2 lần quét liên tiếp chỉ tốn 1 request)
const _tokenInflight = new Map<string, Promise<{ access_token: string; id_token: string } | null>>();

// Giữ kết nối sống (keep-alive) tới Cổng BHXH: bỏ được bước bắt tay TCP + TLS (~200–600ms) cho mỗi lần tra cứu.
// Trước đây header "Connection: close" ép mở lại socket mới mỗi request.
const _httpsAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 15_000, maxSockets: 12 });
const _httpAgent = new http.Agent({ keepAlive: true, keepAliveMsecs: 15_000, maxSockets: 12 });

// Lỗi socket chập chờn (thường do server đóng socket đang nằm trong pool) — đáng thử lại ngay lập tức.
// Timeout do ta tự ném ra thì KHÔNG retry ở tầng này, nếu không mỗi lần tra cứu hỏng sẽ mất 3×timeout.
const RETRYABLE_NET_CODES = new Set(["ECONNRESET", "EPIPE", "ETIMEDOUT", "ESOCKETTIMEDOUT", "EAI_AGAIN"]);
function isRetryableNetError(err: any): boolean {
  return Boolean(err?.code && RETRYABLE_NET_CODES.has(err.code));
}

export interface BhxhCreds {
  coSoId: string;
  user: string;
  pass: string;
  maCSKCB: string;
  tenCSKCB: string;
  hoTenCB: string;
  cccdCB: string;
  tokenUrl: string;
  queryUrl: string;
}

/**
 * Gửi POST JSON qua HTTP/HTTPS thuần của Node.js
 * Tự động retry nếu gặp lỗi ngắt kết nối chập chờn (ECONNRESET) từ Cổng BHXH
 */
export async function postBhxhJson<T = any>(
  urlStr: string,
  data: unknown,
  timeoutMs = 10_000,
  maxRetries = 2
): Promise<{ status: number; data: T }> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await new Promise<{ status: number; data: T }>((resolve, reject) => {
        try {
          const url = new URL(urlStr);
          const postData = JSON.stringify(data);
          const isHttps = url.protocol === "https:";
          const mod = isHttps ? https : http;

          const req = mod.request(
            {
              hostname: url.hostname,
              port: url.port ? Number(url.port) : isHttps ? 443 : 80,
              path: url.pathname + url.search,
              method: "POST",
              agent: isHttps ? _httpsAgent : _httpAgent,
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Content-Length": Buffer.byteLength(postData),
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                Accept: "application/json, text/plain, */*",
                "Accept-Encoding": "identity",
              },
              timeout: timeoutMs,
            },
            (res) => {
              let body = "";
              res.setEncoding("utf-8");
              res.on("data", (chunk) => (body += chunk));
              res.on("end", () => {
                try {
                  resolve({ status: res.statusCode || 200, data: JSON.parse(body) });
                } catch {
                  resolve({ status: res.statusCode || 200, data: body as unknown as T });
                }
              });
            }
          );

          req.on("error", (err) => {
            reject(err);
          });

          req.on("timeout", () => {
            req.destroy();
            reject(new Error(`Timeout sau ${timeoutMs}ms kết nối Cổng BHXH`));
          });

          req.write(postData);
          req.end();
        } catch (err) {
          reject(err);
        }
      });
      return res;
    } catch (err: any) {
      lastError = err;
      // Chỉ thử lại với lỗi socket chập chờn. Timeout thì trả lỗi ngay để người dùng
      // không phải chờ 3 lần timeout cộng dồn (10s → 30s) mới thấy thông báo.
      if (attempt < maxRetries && isRetryableNetError(err)) {
        await new Promise((r) => setTimeout(r, 150));
        continue;
      }
      break;
    }
  }

  throw lastError;
}

// Cache cấu hình tài khoản theo cơ sở để không phải query database liên tục mỗi lần quét thẻ.
// Cache CẢ kết quả rỗng (negative cache): cơ sở chưa cấu hình tài khoản thì mỗi lần bấm "Thử lại"
// trước đây đều đánh DB cloud (chờ tới 1.5s) rồi lại đánh tiếp DB local — nhân đôi độ trễ vô ích.
interface CredsCacheEntry {
  creds: BhxhCreds | null;
  expiresAt: number;
}
const _credsCache = new Map<string, CredsCacheEntry>();
const _credsInflight = new Map<string, Promise<BhxhCreds | null>>();
const CREDS_TTL_HIT_MS = 10 * 60 * 1000; // có cấu hình → nhớ 10 phút
const CREDS_TTL_MISS_MS = 60 * 1000; // chưa cấu hình → nhớ 60 giây

/** Xoá cache cấu hình + token của một cơ sở (gọi sau khi Quản trị sửa tài khoản Cổng BHXH) */
export function clearBhxhCache(coSoId?: string | null) {
  if (coSoId) {
    _credsCache.delete(coSoId);
    _tokenCache.delete(coSoId);
    _tokenInflight.delete(coSoId);
    // Bản ghi "default" có thể đang trỏ tới chính cơ sở này
    if (_credsCache.get("default")?.creds?.coSoId === coSoId) _credsCache.delete("default");
    return;
  }
  _credsCache.clear();
  _tokenCache.clear();
  _tokenInflight.clear();
}

async function findCoSoBhxh(p: any, coSoId?: string | null) {
  let cs: any = null;
  if (coSoId) {
    cs = await p.coSo.findUnique({
      where: { id: coSoId },
      select: {
        id: true,
        ten: true,
        bhxhUser: true,
        bhxhPass: true,
        bhxhMaCSKCB: true,
        bhxhHoTenCB: true,
        bhxhCccdCB: true,
      },
    });
  }
  if (!cs || !cs.bhxhUser || !cs.bhxhPass) {
    cs = await p.coSo.findFirst({
      where: {
        trangThai: "active",
        bhxhUser: { not: null },
        bhxhPass: { not: null },
      },
      select: {
        id: true,
        ten: true,
        bhxhUser: true,
        bhxhPass: true,
        bhxhMaCSKCB: true,
        bhxhHoTenCB: true,
        bhxhCccdCB: true,
      },
    });
  }
  return cs;
}

async function loadBhxhCredsFromDb(coSoId?: string | null): Promise<BhxhCreds | null> {
  let cs: any = null;

  // Thử query DB chính với timeout 1.5s, nếu mạng offline/lag thì fallback ngay sang local DB SQLite
  try {
    cs = await Promise.race([
      findCoSoBhxh(getPrisma(), coSoId),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout DB")), 1500)),
    ]);
  } catch {
    cs = null;
  }

  // Chỉ đụng tới DB local khi DB chính không trả được cấu hình hợp lệ (trước đây luôn chạy 2 lần)
  if (!cs || !cs.bhxhUser || !cs.bhxhPass) {
    try {
      cs = await findCoSoBhxh(getLocalPrisma(), coSoId);
    } catch {
      // ignore
    }
  }

  if (!cs || !cs.bhxhUser || !cs.bhxhPass) return null;

  return {
    coSoId: cs.id,
    user: cs.bhxhUser.trim(),
    pass: cs.bhxhPass.trim(),
    maCSKCB: cs.bhxhMaCSKCB?.trim() || "",
    tenCSKCB: cs.ten || "",
    hoTenCB: cs.bhxhHoTenCB?.trim() || "",
    cccdCB: cs.bhxhCccdCB?.trim() || "",
    tokenUrl: BHXH_TOKEN_URL,
    queryUrl: BHXH_QUERY_URL,
  };
}

/** Lấy cấu hình tài khoản BHXH cho cơ sở từ Database CoSo (theo từng bệnh viện) — có cache TTL */
export async function getBhxhCreds(coSoId?: string | null): Promise<BhxhCreds | null> {
  const cacheKey = coSoId || "default";
  const now = Date.now();

  const cached = _credsCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.creds;

  // Nhiều lần quét/bấm Tra cứu cùng lúc chỉ tạo đúng 1 truy vấn DB
  const inflight = _credsInflight.get(cacheKey);
  if (inflight) return inflight;

  const task = (async () => {
    const creds = await loadBhxhCredsFromDb(coSoId);
    const expiresAt = Date.now() + (creds ? CREDS_TTL_HIT_MS : CREDS_TTL_MISS_MS);
    _credsCache.set(cacheKey, { creds, expiresAt });
    if (creds?.coSoId) _credsCache.set(creds.coSoId, { creds, expiresAt });
    return creds;
  })().finally(() => {
    _credsInflight.delete(cacheKey);
  });

  _credsInflight.set(cacheKey, task);
  return task;
}

/**
 * Xin token từ cổng BHXH theo tài khoản của cơ sở trong Database (hoặc cache TTL 50 phút).
 * Truyền sẵn `knownCreds` để khỏi phải giải lại cấu hình lần thứ hai trong cùng một lượt tra cứu.
 */
export async function getBhxhToken(
  coSoId?: string | null,
  forceRefresh = false,
  knownCreds?: BhxhCreds | null
): Promise<{ access_token: string; id_token: string; creds: BhxhCreds } | null> {
  const creds = knownCreds ?? (await getBhxhCreds(coSoId));
  if (!creds || !creds.user || !creds.pass) {
    console.warn(`[BHXH] Cơ sở ${coSoId || "(mặc định)"} chưa được cấu hình tài khoản Cổng BHXH trong cơ sở dữ liệu.`);
    return null;
  }

  const cacheKey = creds.coSoId || "default";
  const cached = _tokenCache.get(cacheKey);

  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return { access_token: cached.access_token, id_token: cached.id_token, creds };
  }

  // Gộp các lần xin token song song vào cùng một request
  if (!forceRefresh) {
    const inflight = _tokenInflight.get(cacheKey);
    if (inflight) {
      const t = await inflight;
      return t ? { ...t, creds } : null;
    }
  }

  const task = (async () => {
    try {
      const res = await postBhxhJson<{
        access_token?: string;
        id_token?: string;
        APIKey?: { access_token?: string; id_token?: string };
      }>(creds.tokenUrl, { username: creds.user, password: creds.pass }, 8_000);

      const j = (res.data || {}) as Record<string, any>;
      const access_token = j.access_token || j.APIKey?.access_token;
      const id_token = j.id_token || j.APIKey?.id_token || "";

      if (!access_token) {
        console.error(`[BHXH] Lấy token thất bại cho cơ sở ${creds.tenCSKCB} (${cacheKey}):`, j);
        _tokenCache.delete(cacheKey);
        return null;
      }

      _tokenCache.set(cacheKey, {
        access_token,
        id_token,
        expiresAt: Date.now() + 50 * 60 * 1000,
      });

      return { access_token, id_token };
    } catch (e) {
      console.error(`[BHXH] Lỗi kết nối lấy token cho cơ sở ${cacheKey}:`, e);
      return null;
    }
  })().finally(() => {
    _tokenInflight.delete(cacheKey);
  });

  _tokenInflight.set(cacheKey, task);
  const t = await task;
  return t ? { ...t, creds } : null;
}

/** Bóc tách thông tin thẻ từ dữ liệu JSON thô trả về của cổng BHXH */
export function parseTheBhyt(raw: unknown): ThongTinTheBHYT | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const sources = [o, o.data, o.thongTinThe, o.kq, o.result, o.fullData];
  let found: Record<string, unknown> | null = null;
  let maThe = "";

  for (const src of sources) {
    if (src && typeof src === "object") {
      const s = src as Record<string, unknown>;
      const cand = [s.maThe, s.MaThe, s.maTheMoi, s.maThe_moi, s.ma_the, s.maSoBHXH].find(
        (x) => typeof x === "string" && x.trim().length >= 10
      );
      if (cand) {
        maThe = String(cand).trim().toUpperCase();
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

  const tuNgay = getStr("gtTheTu", "gtTheTuMoi", "tuNgay", "TuNgay", "giaTriTu", "gt_the_tu", "ngay_hieu_luc");
  const denNgay = getStr("gtTheDen", "gtTheDenMoi", "denNgay", "DenNgay", "giaTriDen", "gt_the_den", "ngay_het_han");
  const maDKBD = getStr("maDKBD", "maDKBDMoi", "maKCB", "MaKCB", "ma_kcb", "noi_dkbd_ma");

  const rawTenDKBD = getStr("tenDKBDMoi", "tenDKBD", "tenKCB", "TenKCB", "ten_kcb", "noi_dkbd_ten", "noiDKBD");
  const tenDKBD = getTenCSKCB(maDKBD, rawTenDKBD || getStr("cqBHXH"));

  const hoTen = getStr("hoTen", "HoTen", "ho_ten", "ten_benh_nhan");
  const ngaySinh = getStr("ngaySinh", "NgaySinh", "ngay_sinh", "dob");
  const diaChi = getStr("diaChi", "DiaChi", "dia_chi");
  const gioiTinh = getStr("gioiTinh", "GioiTinh", "gioi_tinh");
  const namNamLienTuc = getStr("ngayDu5Nam", "namNamLienTuc", "nam_nam_lien_tuc", "ngay5Nam", "ngay_5_nam");
  const maSoBHXH = getStr("maSoBHXH", "ma_so_bhxh");
  const maKV = getStr("maKV", "ma_kv");
  const cqBHXH = getStr("cqBHXH", "cq_bhxh");
  const maKetQua = getStr("maKetQua", "ma_ket_qua");
  const ghiChu = getStr("ghiChu", "notification", "noiDung");

  const cccdRaw = getStr(
    "soCCCD", "SoCCCD", "cccd", "CCCD", "so_cccd",
    "soDinhDanh", "maSoDinhDanh", "soDinhDanhCaNhan", "so_dinh_danh",
    "soCMND", "cmnd", "CMND", "so_cmnd"
  );
  const cccdDigits = (cccdRaw || "").replace(/\D/g, "");
  const cccd = cccdDigits.length === 9 || cccdDigits.length === 12 ? cccdDigits : undefined;

  let mucHuong = getStr("mucHuong", "MucHuong", "maQuyenLoi", "quyen_loi", "ty_le") || "";
  if (!mucHuong && maThe.length >= 3 && /^[A-Z]{2}\d/.test(maThe)) {
    mucHuong = bhytLevel(maThe);
  } else if (mucHuong && !mucHuong.includes("%")) {
    mucHuong = `${mucHuong}%`;
  }

  const dsLichSuKCB: LichSuKCBRecord[] = Array.isArray(found.dsLichSuKCB2018)
    ? (found.dsLichSuKCB2018 as any[]).map((item) => ({
        maThe: item.maThe,
        hoTen: item.hoTen,
        ngayVao: item.ngayVao,
        ngayRa: item.ngayRa,
        tenKhoa: item.tenKhoa,
        maCSKCB: item.maCSKCB,
        tenCSKCB: getTenCSKCB(item.maCSKCB, item.tenCSKCB),
        kqDieuTri: item.kqDieuTri,
        lyDoVV: item.lyDoVV,
        tinhTrangRV: item.tinhTrangRV,
        loaiKCB: item.loaiKCB,
      }))
    : [];

  const dsLichSuKT: LichSuKTRecord[] = Array.isArray(found.dsLichSuKT2018)
    ? (found.dsLichSuKT2018 as any[]).map((item) => ({
        userKT: item.userKT,
        maCSKCB: item.maCSKCB,
        tenCSKCB: item.tenCSKCB,
        tenCSKCB_Display: getTenCSKCB(item.maCSKCB, item.tenCSKCB),
        thoiGianKT: item.thoiGianKT,
        thongBao: item.thongBao,
      }))
    : [];

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
    cccd,
    namNamLienTuc,
    maSoBHXH,
    maKV,
    cqBHXH,
    maKetQua,
    ghiChu,
    dsLichSuKCB,
    dsLichSuKT,
  };
}

export interface TraCuuParams {
  ma: string;
  hoTen: string;
  ngaySinh?: string;
  coSoId?: string | null;
  forceRefresh?: boolean;
}

// Bộ nhớ đệm kết quả tra cứu: cùng một thẻ mở lại modal Sửa / bấm Tra cứu 2 lần
// trong vòng 5 phút thì trả ngay, không gọi lại Cổng BHXH (mỗi lượt gọi cổng mất ~1–3s).
const RESULT_TTL_MS = 5 * 60 * 1000;
const _resultCache = new Map<string, { at: number; res: KetQuaTraCuuBHYT }>();
const _resultInflight = new Map<string, Promise<KetQuaTraCuuBHYT>>();

function resultKey(p: TraCuuParams) {
  return [p.coSoId || "default", p.ma.trim().toUpperCase(), p.hoTen.trim().toUpperCase(), toDobBhxh(p.ngaySinh || "")].join("|");
}

/**
 * Tra cứu thông tin thẻ BHYT từ Cổng BHXH (KQNhanLichSuKCB2024)
 * Lấy thông tin tài khoản đăng nhập từ Database CoSo của bệnh viện.
 * Có cache kết quả 5 phút + gộp request trùng; bấm "Thử lại" (forceRefresh) luôn bỏ qua cache.
 */
export async function traCuuTheBHYT(params: TraCuuParams, retry = true): Promise<KetQuaTraCuuBHYT> {
  if (!params.ma?.trim() || !params.hoTen?.trim()) {
    return { success: false, error: "Thiếu mã thẻ/CCCD hoặc họ tên bệnh nhân để tra cứu BHYT" };
  }

  const key = resultKey(params);

  if (!params.forceRefresh) {
    const hit = _resultCache.get(key);
    if (hit && Date.now() - hit.at < RESULT_TTL_MS) return hit.res;

    const inflight = _resultInflight.get(key);
    if (inflight) return inflight;
  }

  const task = (async () => {
    const res = await traCuuTheBHYTGoc(params, retry);
    // Chỉ cache khi Cổng BHXH thực sự đã trả lời (có res.raw); lỗi mạng/token thì để lần sau gọi lại
    if (res.raw !== undefined) {
      const now = Date.now();
      // Dọn bản ghi hết hạn để cache không phình theo số bệnh nhân đã quét trong ngày
      if (_resultCache.size > 300) {
        for (const [k, v] of _resultCache) if (now - v.at >= RESULT_TTL_MS) _resultCache.delete(k);
      }
      _resultCache.set(key, { at: now, res });
    }
    return res;
  })().finally(() => {
    _resultInflight.delete(key);
  });

  _resultInflight.set(key, task);
  return task;
}

async function traCuuTheBHYTGoc(params: TraCuuParams, retry = true): Promise<KetQuaTraCuuBHYT> {
  const ma = params.ma.trim();
  const hoTen = params.hoTen.trim();
  if (!ma || !hoTen) {
    return { success: false, error: "Thiếu mã thẻ/CCCD hoặc họ tên bệnh nhân để tra cứu BHYT" };
  }

  const creds = await getBhxhCreds(params.coSoId);
  if (!creds || !creds.user || !creds.pass) {
    return {
      success: false,
      error: "Bệnh viện này chưa được cấu hình tài khoản Cổng BHXH trong cơ sở dữ liệu.",
    };
  }

  const shouldForce = Boolean(params.forceRefresh || !retry);
  const tokenInfo = await getBhxhToken(params.coSoId, shouldForce, creds);
  if (!tokenInfo) {
    return {
      success: false,
      error: "Không thể lấy phiên làm việc (Token) từ Cổng tiếp nhận BHXH. Vui lòng bấm Thử lại.",
    };
  }

  const { access_token, id_token } = tokenInfo;

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

    const res = await postBhxhJson(`${creds.queryUrl}?${queryParams.toString()}`, payload, 10_000);
    const raw = res.data;
    const rawObj = (raw || {}) as Record<string, unknown>;
    const maKetQua = String(rawObj.maKetQua || "");
    const ghiChu = String(rawObj.ghiChu || rawObj.message || rawObj.error || "").toLowerCase();

    // Phát hiện token hết hạn (kể cả khi BHXH trả về HTTP 200 kèm maKetQua: 501 / 999)
    const isTokenExpired =
      res.status === 401 ||
      res.status === 403 ||
      maKetQua === "501" ||
      maKetQua === "999" ||
      ghiChu.includes("token không đúng") ||
      ghiChu.includes("token het han") ||
      ghiChu.includes("token hết hạn") ||
      ghiChu.includes("không đúng token");

    if (isTokenExpired && retry) {
      console.warn(`[BHXH] Token hết hạn/không đúng (maKetQua: ${maKetQua}), tự động xin token mới và thử lại...`);
      _tokenCache.delete(creds.coSoId || "default");
      return traCuuTheBHYTGoc({ ...params, forceRefresh: true }, false);
    }

    const the = parseTheBhyt(raw);
    const isSuccess = Boolean(
      the &&
      the.maThe &&
      (maKetQua === "000" || maKetQua === "001" || (!maKetQua && Boolean(the.tuNgay || the.denNgay)))
    );

    if (isSuccess && the) {
      return {
        success: true,
        the,
        notification: String(rawObj.ghiChu || "Thẻ còn giá trị sử dụng"),
        raw,
      };
    }

    const errMsg = explainMaKetQua(maKetQua, String(rawObj.ghiChu || rawObj.message || rawObj.error || ""));
    return {
      success: false,
      the: the || undefined,
      notification: String(rawObj.ghiChu || ""),
      error: errMsg,
      raw,
    };
  } catch (e) {
    if (retry && e instanceof Error && (e.message.includes("Timeout") || e.message.includes("ECONNRESET"))) {
      console.warn("[BHXH] Lỗi mạng/timeout kết nối Cổng BHXH, thử lại với token mới...");
      _tokenCache.delete(creds.coSoId || "default");
      return traCuuTheBHYTGoc({ ...params, forceRefresh: true }, false);
    }
    return {
      success: false,
      error: e instanceof Error ? `Lỗi kết nối Cổng BHXH: ${e.message}` : "Lỗi không xác định khi tra cứu thẻ BHYT",
    };
  }
}
