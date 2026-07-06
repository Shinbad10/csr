# Plan — UC-10: Ghi danh sách hồ sơ lên Google Sheet (BR-15)

**Phiên bản:** 1.0 · 06/2026
**Quyết định đã chốt:** Tức thì + cron dự phòng · Windows Task Scheduler gọi API · `google-auth-library` + fetch.

---

## Hiện trạng (đã có)
- `SyncQueue` đã được đẩy ở 3 điểm ghi:
  - `src/app/api/csr/hoso/route.ts:92` (tạo)
  - `src/app/api/csr/hoso/[id]/route.ts:78` (sửa)
  - `src/app/api/csr/nhatky/route.ts:22` (ghi nhật ký)
- Cấu trúc cột chuẩn (SRS §11.1) đã định nghĩa trong `src/app/api/csr/export/route.ts:28-53` — tái dùng làm "1 dòng Sheet".
- **Chưa có**: thư viện Google, `lib/googleSheet.ts`, `.env` keys, cron route.

---

## 1. Chuẩn bị Google Cloud (ngoài code)
- Tạo **Service Account** → tải JSON credentials.
- Bật **Google Sheets API**.
- Mỗi cơ sở: tạo 1 spreadsheet, share **Editor** cho email service account, lấy `spreadsheetId` từ URL.

## 2. Config `.env`
```
GOOGLE_CREDENTIALS={"type":"service_account",...}   # JSON 1 dòng hoặc base64
GOOGLE_SHEET_TAB=DanhSach                            # tên tab trong mỗi spreadsheet
SHEET_<MA_COSO>=<spreadsheetId>                       # mỗi cơ sở 1 dòng
CRON_SECRET=<chuỗi ngẫu nhiên>                        # bảo vệ /api/cron/sync
```
Map `coSoId → spreadsheetId` đọc từ `process.env["SHEET_" + coSoId]`. Cơ sở chưa cấu hình → bỏ qua (không lỗi).

## 3. `src/lib/googleSheet.ts` (mới)
- `getAccessToken()`: `google-auth-library` JWT, scope `spreadsheets`, **cache token module-level** (TTL ~50 phút).
- `HEADER` + `toRow(hoSo)`: tái dùng mapping cột của export route → tách helper dùng chung `lib/csr.ts::hoSoToRow` + `HOSO_HEADER`.
- `syncHoSo(hoSoId)`:
  1. Load hồ sơ + `coSo` + `buoiKham`.
  2. Tìm `spreadsheetId` theo `coSoId`; không có → skip.
  3. Đảm bảo header (đọc hàng 1, trống thì ghi HEADER).
  4. Upsert theo Mã BN: `values.get` cột Mã BN → tìm dòng → update (PUT) hoặc append.
  - Timeout 8–10s, retry 1 lần nếu lỗi mạng/401.

## 4. Worker — `src/lib/syncWorker.ts::drainSyncQueue(limit)`
- Lấy `SyncQueue` cũ nhất (limit ~50), gom theo `hoSoId` (tránh push trùng).
- Thành công → `delete`. Lỗi → `retries++`; ≥5 → giữ lại + log.

## 5. Tức thì + cron dự phòng
- **Tức thì**: sau 3 điểm enqueue → gọi `drainSyncQueue()` fire-and-forget (không `await`, `.catch()`).
- **Cron**: `src/app/api/cron/sync/route.ts` (GET) → check `CRON_SECRET` → `drainSyncQueue()` → trả `{ processed, failed }`.
- **Lịch**: Windows Task Scheduler chạy `curl "http://localhost:3000/api/cron/sync?secret=..."` mỗi 2–5 phút.

## 6. Thứ tự thực hiện
1. `npm i google-auth-library` + `.env` keys.
2. Tách `hoSoToRow`/`HOSO_HEADER` vào `lib/csr.ts`; export route dùng helper.
3. `lib/googleSheet.ts` (token cache + `syncHoSo` upsert).
4. `lib/syncWorker.ts::drainSyncQueue`.
5. Nối fire-and-forget vào 3 route ghi.
6. `api/cron/sync/route.ts` + tài liệu Task Scheduler.
7. Test: tạo/sửa hồ sơ → kiểm Sheet; offline → sửa → online + cron → đồng bộ bù.

## Điểm còn chốt khi code
- `CoSo.id` thực tế là chuỗi gì (an toàn làm hậu tố env `SHEET_<id>`). → **Đã xác nhận: `CS01`, `CS02`** (sạch, dùng `SHEET_CS01`...).
- Xóa hồ sơ: mặc định **không** xóa dòng trên Sheet (BR-15 chỉ 1 chiều tạo/cập nhật).

---

## ĐÃ TRIỂN KHAI (06/2026)
File mới/sửa:
- `src/lib/csr.ts` — thêm `HOSO_HEADER` + `hoSoToCells()` (dùng chung Excel & Sheet).
- `src/app/api/csr/export/route.ts` — dùng helper chung (aoa_to_sheet).
- `src/lib/googleSheet.ts` — JWT token cache (scope `spreadsheets` + `drive.file`); **tự tạo spreadsheet** mỗi cơ sở (tab + tiêu đề + share Editor) khi chưa có, lưu `CoSo.sheetId`; `syncHoSo()` upsert theo Mã BN.
- `src/lib/syncWorker.ts` — `drainSyncQueue()` (gom theo hồ sơ, retry ≤5, khoá tránh chồng) + `triggerSync()` fire-and-forget.
- 3 route ghi (`hoso`, `hoso/[id]`, `nhatky`) — gọi `triggerSync()` sau khi enqueue.
- `src/app/api/cron/sync/route.ts` — GET, bảo vệ `CRON_SECRET`, gọi drain.
- `prisma/schema.prisma` + `prisma-local/schema.prisma` — thêm cột `CoSo.sheetId String?`.
- `.env` — thêm `GOOGLE_CREDENTIALS`, `GOOGLE_SHEET_TAB`, `GOOGLE_SHARE_EMAIL`, `SHEET_CS01/CS02` (tùy chọn), `CRON_SECRET`.
- `package.json` — thêm `google-auth-library`.

### Cấu hình để bật tính năng
1. **Migration** (thêm cột `sheetId`): chạy `npm run db:push` với tài khoản `sa` (cả SQL Server lẫn SQLite local). Prisma client đã `generate` sẵn.
2. Tạo service account + bật **Google Sheets API** và **Google Drive API**; dán JSON (1 dòng hoặc base64) vào `GOOGLE_CREDENTIALS`.
3. Đặt `GOOGLE_SHARE_EMAIL` = email Google của bạn (để nhận quyền Editor file tự tạo).
4. Đặt `CRON_SECRET` ngẫu nhiên.
5. **Không cần tạo spreadsheet tay**: lần đồng bộ đầu của mỗi cơ sở, hệ thống tự tạo file `VISI CSR — <tên> (<id>)`, tạo tab `DanhSach` + tiêu đề, share về email bạn, và lưu `spreadsheetId` vào `CoSo.sheetId`.
   - Muốn dùng file có sẵn thì điền `SHEET_<id>` (ưu tiên `CoSo.sheetId` > `SHEET_<id>` > tự tạo).

### Lập lịch cron (Windows Task Scheduler)
Tạo Task chạy mỗi 2–5 phút:
```
Program/script: curl.exe
Arguments: "http://localhost:3000/api/cron/sync?secret=<CRON_SECRET>"
```
(Hoặc dùng header: `curl.exe -H "x-cron-secret: <CRON_SECRET>" http://localhost:3000/api/cron/sync`)

### Lưu ý vận hành
- Chưa cấu hình `GOOGLE_CREDENTIALS` → `triggerSync()`/cron tự bỏ qua (no-op), hàng đợi **giữ nguyên** chờ bật.
- Đã bật credentials: cơ sở nào chưa có Sheet sẽ **tự tạo file** ở lần đồng bộ đầu → không còn rớt hồ sơ vì thiếu cấu hình.
- `GOOGLE_SHARE_EMAIL` trống → vẫn tạo file nhưng chỉ service account thấy (có cảnh báo log). Nên điền trước khi bật.
- Offline mode: queue ghi vào SQLite mirror; khi online + cron chạy sẽ đẩy bù.
