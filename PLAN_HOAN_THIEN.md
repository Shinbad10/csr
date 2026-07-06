# Kế hoạch tối ưu & hoàn thiện — VISI CSR

**Phiên bản:** 1.0 · 06/2026 · Sau rà soát tổng thể
**Bám:** SRS 1.1 + hiện trạng code

---

## A. Hiện trạng (đã rà soát)

**Sức khỏe hệ thống:** `tsc` ✓ · `eslint` ✓ · `next build` ✓ (đã sửa các lỗi lint do thay đổi gần đây: login mount-guard/`any`, route admin `any`, effect ở quản trị).

**DB:** SQL Server `visi_csr` **đã đồng bộ** với `schema.prisma` (có `ngaySinh`, `gioDon`; đã bỏ cột MSG). Mirror SQLite offline có sẵn.

**Đã có (UC-01…09):**
| UC | Màn | Ghi chú |
|---|---|---|
| 01 | `/buoi-kham` | DS đợt khám + tạo; nút **Tham gia khám** + **Tư vấn** theo đợt |
| 02–03 | `/kham/[id]` | Tiếp nhận (quét QR + tra BHXH) + lâm sàng (thị lực, chẩn đoán, khuyến nghị) |
| 03 | `/tu-van/[id]` | Tư vấn & phân nhóm A/B (BHYT, số tiền, ngày ĐK mổ, điểm đón, **giờ đón**) |
| 04–05 | `/theo-doi` | Nhóm B + nhật ký · tab Nhắc lịch (nhóm A) |
| 06 | `/dieu-tri` | Đón, mổ, thực thu, tái khám, ghi chú mắt 2 |
| 07 | `/ho-so` | DS + lọc trạng thái/nhóm + tìm |
| 08 | `/bao-cao` | Thống kê + xuất Excel (§11.1) |
| 09 | `/quan-tri` | Cơ sở · tài khoản · audit · xoá hàng loạt |

**Tiện ích đã thêm:** sidebar mobile (drawer), skeleton loading, user dropdown, Combobox điểm đón, xác nhận xoá.

**Còn thiếu so với đặc tả đầy đủ:**
1. **Tra cứu thẻ BHYT (BHXH) — chưa chạy thật** (contract API chưa kiểm chứng). ← *ưu tiên cao nhất*
2. **UC-10 — Đồng bộ Google Sheet (BR-15):** mới đẩy `SyncQueue`, chưa push thật.
3. **Camera QR** (hiện chỉ nhập/scan text).
4. **Offline mode** (hạ tầng có, chưa nối UI).
5. Polish: in hồ sơ, validate bằng Zod, responsive màn khám 3 cột.

---

## B. ƯU TIÊN 1 — Hoàn thiện tra cứu thẻ BHYT (Cổng BHXH)

> Mục tiêu: quét/nhập CCCD → gọi cổng BHXH → tự điền **mã thẻ + mức hưởng + hạn thẻ + nơi ĐKBĐ**, ổn định và có chẩn đoán lỗi rõ ràng.

### B1. Vấn đề hiện tại
- `src/app/api/bhxh/route.ts` viết theo luồng *take token → query KQNhanLichSuKCB2024*, parse mã thẻ phòng thủ — **nhưng chưa kiểm chứng** với cổng thật (sandbox không truy cập được `egw.baohiemxahoi.gov.vn`).
- Chưa rõ **đúng hàm API** cho "tra cứu thông tin thẻ" hay phải dùng hàm khác.
- Chưa cache token (mỗi lần tra đều xin token mới → chậm + dễ bị giới hạn).
- Chỉ lấy `maThe`, chưa lấy **hạn dùng / mức hưởng / nơi ĐKBĐ**.

### B2. Cần xác nhận trước khi code (từ tài liệu BHXH / công cụ bệnh viện đang dùng)
1. **Endpoint token** đúng + định dạng request (query `?username=&password=` hay JSON body) + **dạng password** (đang là chuỗi hex 32 ký tự — MD5? gửi nguyên hay hash lại mỗi request?).
2. **Hàm tra cứu thẻ đúng**: `KQNhanLichSuKCB2024` là "lịch sử KCB" — có thể KHÔNG phải hàm tra thẻ. BHXH thường có hàm riêng *"Tra cứu thông tin thẻ BHYT"* (trả mã thẻ, mức hưởng, giá trị từ/đến, mã ĐKBĐ). Cần đúng URL + tham số.
3. **Tên trường trong response** chứa: maThe, mucHuong/mức hưởng, gtTheTu/gtTheDen (hạn), maDKBD/tenDKBD.

### B3. Cách hoàn thiện (sau khi có contract) - ĐÃ HOÀN THIỆN
- [x] **Tầng client BHXH** `lib/bhxh.ts`:
  - Cấu hình tài khoản cổng BHXH **riêng theo từng Cơ sở trong Database** (`CoSo`: `bhxhUser`, `bhxhPass`, `bhxhMaCSKCB`...) thay vì dùng chung `.env`.
  - `getToken(coSoId)` có **cache trong bộ nhớ theo từng cơ sở** (TTL ~50 phút, refresh khi hết hạn). Tránh xin token mỗi request.
  - `traCuuTheBHYT({ ma, hoTen, ngaySinh, coSoId })` → gọi đúng tài khoản cơ sở đang làm việc, trả `{ maThe, mucHuong, tuNgay, denNgay, maDKBD, tenDKBD, hoTen, ngaySinh }`.
  - Timeout 10s, **retry 1 lần** nếu lỗi mạng/timeout; nếu token hết hạn (401) → refresh token rồi gọi lại.
- [x] **Endpoint** `POST /api/bhxh`:
  - Trả `{ success, the: {...} }` hoặc `{ success:false, error, raw }`.
  - Khi `?debug=1` (chỉ Quản lý) → luôn kèm `raw` (JSON thô) để map trường.
- [x] **Endpoint debug** `GET /api/bhxh/debug?cccd=&hoTen=&ngaySinh=` (chỉ Quản lý) → trả raw response của cổng để dò đúng tên trường → **không phải sửa code nhiều lần khi test trên mạng bệnh viện**.
- [x] **Modal đăng ký**: hiển thị đầy đủ thẻ tra được (mã thẻ · mức hưởng · hạn đến · nơi ĐKBĐ) thay vì chỉ mã thẻ; cho **đối chiếu họ tên/ngày sinh** giữa CCCD và thẻ (cảnh báo nếu lệch).
- [x] **Lưu hồ sơ**: `bhyt` = mã thẻ (đang đúng); cân nhắc lưu thêm hạn thẻ/nơi ĐKBĐ nếu nghiệp vụ cần (thêm cột nullable).
- [x] **Mức hưởng**: ưu tiên lấy từ cổng BHXH; fallback suy từ ký tự thứ 3 mã thẻ (đang có ở `bhytLevel`).

### B4. Quy trình test (bạn chạy trên mạng bệnh viện)
1. Gọi `GET /api/bhxh/debug?cccd=...&hoTen=...&ngaySinh=dd/mm/yyyy` → copy JSON thô gửi lại.
2. Mình map đúng tên trường → cập nhật `lib/bhxh.ts`.
3. Quét 1 CCCD thật ở modal → xác nhận tự điền đủ thông tin thẻ.

---

## C. ƯU TIÊN 2 — Hoàn thiện các chức năng còn lại

### C1. Đồng bộ Google Sheet (UC-10, BR-15)
- [ ] `lib/googleSheet.ts::syncHoSo(row)` — service account, upsert theo Mã BN, **mỗi cơ sở một Sheet** (`SHEET_<COSO>`), cột trùng Excel §11.1.
- [ ] Gọi sau mỗi POST/PUT hồ sơ; lỗi → đã có `SyncQueue` → thêm cron `GET /api/cron/sync` retry.
- [ ] Cấu hình `.env`: `GOOGLE_CREDENTIALS`, `SHEET_*`.

### C2. Camera QR (quét CCCD bằng webcam/điện thoại)
- [ ] Thêm `jsqr`/`@zxing/library` + component `QRScanner` (đã từng có) → nút camera ở ô quét trong modal.
- [ ] Decode QR CCCD (pipe-delimited) → tái dùng `handleScanData` + auto tra BHXH.

### C3. In hồ sơ
- [ ] Bản in riêng (route `/kham/[id]/in/[hoSoId]` hoặc CSS `@media print`) thay cho `window.print()` cả màn 3 cột.

### C4. Validate bằng Zod (đồng bộ client/server)
- [ ] Schema Zod cho tiếp nhận / lâm sàng / tư vấn / điều trị (BR-04/06/07) — dùng chung React Hook Form + route handler, giảm check thủ công.

### C5. Offline (ưu tiên thấp — SRS §12)
- [ ] Nút bật offline + nạp dữ liệu cơ sở/buổi khám vào SQLite; hàng đợi sync khi có mạng.

---

## D. ƯU TIÊN 3 — Tối ưu UX & độ bền

- [ ] **maBN trùng** khi 2 buổi khám cùng cơ sở + cùng ngày → STT đang theo buổi khám nên `CS-MMDD-001` đụng nhau. **Đề xuất:** sinh STT cho maBN theo `(cơ sở + ngày)` (vẫn giữ STT hiển thị theo buổi), hoặc thêm hậu tố buổi vào mã. Cần chốt nghiệp vụ.
- [ ] **Responsive màn khám 3 cột** (`/kham/[id]`) trên tablet — hiện tối ưu cho laptop.
- [ ] **Lọc trạng thái** ở `/ho-so` đã có nhãn tiếng Việt; bổ sung lọc **theo buổi khám / khoảng ngày**.
- [ ] **Thống kê** `/bao-cao`: thêm biểu đồ (Recharts) + lọc theo tháng/đợt; thêm dòng tổng số tiền báo/thực thu.
- [ ] **Skeleton/empty states** đồng nhất mọi màn.
- [ ] **Phân quyền sửa demographics**: hiện PUT suy cap theo trạng thái → CSKH sửa hồ sơ đã "Đã khám" có thể bị chặn. Tách quyền sửa thông tin tiếp nhận khỏi cap lâm sàng.
- [ ] **Dọn process dev**: tài liệu hoá việc chỉ chạy 1 `next dev` (tránh nhiều instance đụng `.next`).

---

## E. Lộ trình đề xuất

| Đợt | Nội dung | Ưu tiên |
|---|---|---|
| 1 | **BHXH (mục B)** — token cache + endpoint debug → test thật → map trường → tra đủ thông tin thẻ | ⭐ cao nhất |
| 2 | Google Sheet sync (C1) + camera QR (C2) | cao |
| 3 | In hồ sơ (C3) + Zod (C4) + tối ưu UX (mục D) | vừa |
| 4 | Offline (C5) + thống kê nâng cao + maBN edge-case | thấp |

---

## F. Việc cần BẠN cung cấp để hoàn thiện BHXH
1. **Tài liệu API BHXH** (hàm tra cứu thẻ đúng + tham số + mẫu response), HOẶC
2. Sau khi mình thêm **endpoint `/api/bhxh/debug`**, bạn chạy trên máy có mạng BHXH và **gửi lại JSON thô** → mình map trường chính xác.

*Mình đề xuất bắt đầu Đợt 1 ngay: thêm token-cache + endpoint debug để bạn lấy được response thật — đó là mảnh ghép quyết định để tra thẻ chạy đúng.*
