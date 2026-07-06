// UC-10 / BR-15 — Đồng bộ 1 chiều phần mềm → Google Sheet.
// Mỗi cơ sở 1 spreadsheet (tự tạo lần đầu, lưu vào CoSo.sheetId), upsert theo Mã BN,
// cột trùng Excel (§11.1). Xác thực service account (JWT) qua google-auth-library.
import { JWT } from "google-auth-library";
import { getPrisma } from "./prisma";
import { HOSO_HEADER, hoSoToCells } from "./csr";

// drive.file đủ để tạo file mới + cấp quyền share cho file do app tạo.
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];
const TAB = process.env.GOOGLE_SHEET_TAB || "DanhSach";
// Chế độ DÙNG CHUNG 1 bảng tính: nếu đặt GOOGLE_SHEET_ID → mọi cơ sở ghi vào cùng 1 file,
// mỗi cơ sở là 1 TAB riêng (tên tab = tên cơ sở). Bỏ trống → mỗi cơ sở 1 file (như cũ).
const SHARED_ID = process.env.GOOGLE_SHEET_ID?.trim() || null;
// Tên tab hợp lệ cho Sheets: bỏ ký tự cấm []:\/?*, tối đa 90 ký tự, duy nhất theo cơ sở.
function tabNameFor(coSo: { id: string; ten: string }): string {
  const clean = (coSo.ten || coSo.id).replace(/[[\]:\\/?*]/g, " ").replace(/\s+/g, " ").trim().slice(0, 90);
  return clean || coSo.id;
}
const MABN_COL = HOSO_HEADER.indexOf("Mã BN");          // 0-based vị trí cột Mã BN
const HIS_COL = HOSO_HEADER.indexOf("Mã BN HIS");       // cột do kế toán điền, giữ nguyên khi cập nhật
// Ghi tiêu đề & mỗi dòng theo một BỀ RỘNG CỐ ĐỊNH (đệm "") để khi bỏ/đổi cột,
// các ô thừa bên phải bị xoá trắng thay vì để lại dữ liệu cũ.
const WIDE = 32;
const WIDE_COL = colLetter(WIDE);
const padRow = (a: (string | number)[]): (string | number)[] => {
  const r = a.slice(0, WIDE);
  while (r.length < WIDE) r.push("");
  return r;
};
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const DRIVE_API = "https://www.googleapis.com/drive/v3";

// A=1, ..., Z=26, AA=27...
function colLetter(n: number): string {
  let s = "";
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
const colA = (i: number) => colLetter(i + 1); // 0-based → chữ cột
const enc = (s: string) => encodeURIComponent(s);

// ── Credentials + JWT client (google-auth-library tự cache & refresh access token) ──
function readCreds(): { client_email: string; private_key: string } {
  const raw = process.env.GOOGLE_CREDENTIALS?.trim();
  if (!raw) throw new Error("Thiếu GOOGLE_CREDENTIALS");
  const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  const c = JSON.parse(json);
  if (!c.client_email || !c.private_key) throw new Error("GOOGLE_CREDENTIALS thiếu client_email/private_key");
  return c;
}

let _client: JWT | null = null;
function getClient(): JWT {
  if (_client) return _client;
  const c = readCreds();
  _client = new JWT({ email: c.client_email, key: c.private_key, scopes: SCOPES });
  return _client;
}

// fetch có Authorization + timeout 10s + retry 1 lần khi 401 (token hết hạn) hoặc lỗi mạng.
async function request(url: string, method: string, body?: unknown, retry = true): Promise<unknown> {
  const token = (await getClient().getAccessToken()).token;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    if (res.status === 401 && retry) { _client = null; return request(url, method, body, false); }
    if (!res.ok) throw new Error(`Google ${res.status}: ${await res.text()}`);
    return res.status === 204 ? null : await res.json();
  } catch (e) {
    if (retry && e instanceof Error && (e.name === "AbortError" || e.message.includes("fetch")))
      return request(url, method, body, false);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
const sheets = (path: string, method: string, body?: unknown) => request(`${SHEETS_API}/${path}`, method, body);
const drive = (path: string, method: string, body?: unknown) => request(`${DRIVE_API}/${path}`, method, body);

// Tạo spreadsheet mới cho cơ sở: tab + tiêu đề + share cho GOOGLE_SHARE_EMAIL, rồi lưu sheetId.
async function createSpreadsheet(coSo: { id: string; ten: string }): Promise<string> {
  const created = (await request(SHEETS_API, "POST", {
    properties: { title: `VISI CSR — ${coSo.ten} (${coSo.id})` },
    sheets: [{ properties: { title: TAB } }],
  })) as { spreadsheetId: string };
  const id = created.spreadsheetId;

  await sheets(`${id}/values/${enc(`${TAB}!A1`)}?valueInputOption=RAW`, "PUT", { values: [[...HOSO_HEADER]] });

  const email = process.env.GOOGLE_SHARE_EMAIL?.trim();
  if (email) await drive(`files/${id}/permissions?sendNotificationEmail=false`, "POST", { role: "writer", type: "user", emailAddress: email });
  else console.warn(`[sync] Đã tạo Sheet cho ${coSo.id} nhưng GOOGLE_SHARE_EMAIL trống → chỉ service account thấy file.`);

  await getPrisma().coSo.update({ where: { id: coSo.id }, data: { sheetId: id } });
  return id;
}

// Tìm spreadsheetId cho cơ sở: CoSo.sheetId → env SHEET_<id> → tự tạo mới.
// Trả { id, fresh } — fresh=true nghĩa là vừa tạo (đã có tab+header, khỏi kiểm lại).
async function resolveSheet(coSo: { id: string; ten: string; sheetId?: string | null }): Promise<{ id: string; fresh: boolean }> {
  if (coSo.sheetId) return { id: coSo.sheetId, fresh: false };
  const envId = process.env[`SHEET_${coSo.id}`]?.trim();
  if (envId) return { id: envId, fresh: false };
  return { id: await createSpreadsheet(coSo), fresh: true };
}

// Đảm bảo spreadsheet có TAB `tab` + hàng tiêu đề. Idempotent (tạo tab nếu thiếu).
async function ensureTab(spreadsheetId: string, tab: string): Promise<void> {
  const meta = (await sheets(`${spreadsheetId}?fields=sheets.properties.title`, "GET")) as {
    sheets?: { properties?: { title?: string } }[];
  };
  if (!meta.sheets?.some((s) => s.properties?.title === tab))
    await sheets(`${spreadsheetId}:batchUpdate`, "POST", { requests: [{ addSheet: { properties: { title: tab } } }] });

  // Luôn ghi lại hàng tiêu đề (idempotent, đệm rộng) để cột mới/bỏ cột lan tới cả tab đã tồn tại.
  await sheets(`${spreadsheetId}/values/${enc(`${tab}!A1:${WIDE_COL}1`)}?valueInputOption=RAW`, "PUT", { values: [padRow([...HOSO_HEADER])] });
}

// Đẩy 1 hồ sơ lên Sheet của cơ sở tương ứng. Trả về trạng thái để worker quyết định.
export async function syncHoSo(hoSoId: string): Promise<"updated" | "appended" | "skipped"> {
  const hoSo = await getPrisma().hoSoBenhNhan.findUnique({
    where: { id: hoSoId },
    include: {
      coSo: true, buoiKham: true, _count: { select: { nhatKy: true } },
      tuVanVien: { select: { hoTen: true } }, nguoiChotCuoi: { select: { hoTen: true } },
    },
  });
  if (!hoSo || !hoSo.coSo) return "skipped"; // hồ sơ đã bị xoá → bỏ qua

  // Xác định file + tab theo chế độ.
  let spreadsheetId: string;
  let tab: string;
  if (SHARED_ID) {
    // Dùng chung 1 bảng tính; mỗi cơ sở = 1 tab riêng.
    spreadsheetId = SHARED_ID;
    tab = tabNameFor(hoSo.coSo);
    await ensureTab(spreadsheetId, tab);
  } else {
    const resolved = await resolveSheet(hoSo.coSo);
    spreadsheetId = resolved.id;
    tab = TAB;
    if (!resolved.fresh) await ensureTab(spreadsheetId, tab); // file tự tạo đã sẵn tab+header
  }

  // Tìm dòng theo Mã BN trong cột Mã BN của đúng tab.
  const range = `${tab}!${colA(MABN_COL)}:${colA(MABN_COL)}`;
  const col = (await sheets(`${spreadsheetId}/values/${enc(range)}`, "GET")) as { values?: string[][] };
  const idx = (col.values || []).findIndex((r) => (r[0] || "") === hoSo.maBN); // 0-based gồm cả tiêu đề
  const cells = hoSoToCells({ ...hoSo, soLanLienHe: hoSo._count.nhatKy }, true);

  if (idx >= 0) {
    const rowNum = idx + 1; // Sheets 1-based
    // Giữ nguyên "Mã BN HIS" do kế toán nhập tay (không để sync ghi đè về trống).
    if (HIS_COL >= 0) {
      const cur = (await sheets(`${spreadsheetId}/values/${enc(`${tab}!${colA(HIS_COL)}${rowNum}`)}`, "GET")) as { values?: string[][] };
      const hisVal = cur.values?.[0]?.[0];
      if (hisVal && !cells[HIS_COL]) cells[HIS_COL] = hisVal;
    }
    await sheets(`${spreadsheetId}/values/${enc(`${tab}!A${rowNum}:${WIDE_COL}${rowNum}`)}?valueInputOption=USER_ENTERED`, "PUT", { values: [padRow(cells)] });
    return "updated";
  }
  await sheets(`${spreadsheetId}/values/${enc(`${tab}!A1`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, "POST", { values: [cells] });
  return "appended";
}

// Có cấu hình Sheet hay không (để worker bỏ qua sớm khi chưa bật tính năng).
export const sheetEnabled = () => !!process.env.GOOGLE_CREDENTIALS?.trim();
