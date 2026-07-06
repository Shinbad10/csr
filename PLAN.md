# Kế hoạch thiết kế phần mềm — VISI CSR (Quản lý khám tầm soát cộng đồng & Tư vấn phẫu thuật)

**Phiên bản plan:** 2.1 · 06/2026 (chốt: bỏ field ngoài SRS · thêm `ngaySinh`)
**Bám theo:** SRS 1.1 (VISI_02) + Hướng dẫn triển khai kỹ thuật 1.0 (VISI_03) + UI mẫu app khám tầm soát.
**Hiện trạng:** Dự án đã reset. Còn lại: `.env` (kết nối **SQL Server** `visi_csr` + creds **BHXH**), `prisma-local/` (mô hình dữ liệu + client SQLite offline), `public/`.
**Mục tiêu tài liệu:** Blueprint để dựng lại từ đầu một cách tối ưu, tận dụng DB đã kết nối và các quyết định kiến trúc đã kiểm chứng.

---

## 1. Phạm vi (bám SRS §1–2)

Phần mềm = **sổ ghi nhận bệnh nhân điện tử đa cơ sở**, thay Google Sheet. Ba mục tiêu:
1. Nhập liệu khi khám cộng đồng (tiếp nhận + lâm sàng + tư vấn).
2. CSKH cập nhật điều trị tại bệnh viện (đón, mổ, số tiền, tái khám).
3. Kế toán xuất dữ liệu tính tiền CSR (tính tiền làm trên Excel theo policy).

**Ngoài phạm vi:** tính hoa hồng; tích hợp HIS; tự tính BHYT/giá (số tiền nhập tay); phân biệt mắt 1/mắt 2 trong thống kê (mắt 2 chỉ ghi chú).

**4 vai trò:** CSKH · Tư vấn viên · Kế toán · Quản lý. Mỗi tài khoản gắn 1 cơ sở; Quản lý xem toàn hệ thống.

---

## 2. Ngăn xếp công nghệ (tối ưu theo hiện trạng)

| Thành phần | Chọn | Ghi chú |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | 1 codebase UI + API Routes |
| ORM | **Prisma 7 (driver adapters)** | đã có client SQLite ở `prisma-local/` |
| DB chính | **SQL Server** (`visi_csr` @ 192.168.10.250) | đã kết nối qua `.env`; `sa` để migrate, `reader` để chạy app |
| DB offline | **SQLite** (`local.db`) mirror | tùy chọn ưu tiên thấp (SRS §12) — đã có schema mirror |
| Auth | **NextAuth (Credentials, JWT ≤8h)** | RBAC qua callback; bcrypt |
| UI | **Tailwind + design tokens công ty** | navy `#031da6` (thương hiệu) · teal `#02b8a9` (chỉ cho "thành công/sống") · Fraunces + Manrope + JetBrains Mono |
| Form/validate | **React Hook Form + Zod** | schema dùng chung client/server |
| Bảng | **TanStack Table** | danh sách hồ sơ (UC-07) |
| Xuất Excel | **xlsx (SheetJS)** hoặc ExcelJS | route server, áp bộ lọc |
| Google Sheet | **googleapis (Sheets API v4)** | service account, 1 chiều (BR-15) |
| Tra cứu BHYT | **API BHXH** (egw.baohiemxahoi.gov.vn) | creds đã có trong `.env` (token → query) |
| Biểu đồ | **Recharts** | thống kê cơ bản (UC-08) |

> **Lưu ý dual-DB:** Prisma 7 không cho `url` trong schema → đặt `DATABASE_URL` ở `prisma.config.ts`. Client cloud (SQL Server) dùng `PrismaMssql`, client offline dùng `PrismaBetterSqlite3`; chọn runtime qua `lib/db-mode.ts`. Generate cả 2 client: `prisma generate` + `prisma generate --schema=prisma-local/schema.prisma`.

---

## 3. Mô hình dữ liệu (giữ theo `prisma-local/schema.prisma`, bám SRS §6)

7 bảng: `CoSo`, `NguoiDungCSR`, `BuoiKham`, `HoSoBenhNhan` (trung tâm), `NhatKyTheoDoi`, `AuditLog`, `SyncQueue` (+ `DanhMucBenhVien`).

`HoSoBenhNhan` lớn dần theo khâu — nhóm trường theo SRS §6.4:
- **Tiếp nhận (CSKH):** maBN, stt, buoiKhamId, coSoId, hoTen, gioiTinh, **ngaySinh** (DOB đầy đủ — tự lấy khi quét thẻ), namSinh (năm — suy từ ngaySinh), **cccd**, **diaChi**, sdt, sdtNguoiNha.
- **Lâm sàng (TVV chép từ phiếu BS):** thiLucMP, thiLucMT, chanDoan (JSON mảng enum), chanDoanKhac, khuyenNghi.
- **Tư vấn (TVV):** bhyt, tuVanVienMa, soTienBao, ngayDieuTri, diemDon, nhom.
- **Theo dõi nhóm B:** followUpStatus, nguoiPhuTrachMa, nguoiChotCuoiMa, ngayChot.
- **Điều trị (CSKH @BV):** daDon, ngayMoThucTe, soTienThucThu, trangThaiDieuTri, ngayTaiKham, ghiChuMat2.
- **Hệ thống:** trangThai (suy ra), createdAt/updatedAt, createdBy/updatedBy, **syncStatus**.

**Chênh lệch so với SRS — quyết định đã chốt:**
| Trường | Quyết định |
|---|---|
| `cccd`, `diaChi` | **Giữ** — phục vụ quét CCCD/BHYT/VNeID. |
| `ngaySinh` (DateTime?) | **THÊM MỚI** — ngày sinh đầy đủ, lấy tự động khi quét thẻ BHYT/CCCD; là nguồn chính để hiển thị & tính tuổi. |
| `namSinh` (Int) | **Giữ** (SRS §6.4 + cột "Năm sinh" khi xuất). Tự suy = năm của `ngaySinh`; cho nhập tay năm khi không có thẻ. |
| `loaiKinh`, `benhVienDen`, `buoi`, `ghiChu` | **BỎ** — field của app mẫu MSG, không có trong SRS. Schema rebuild không khai báo. |
| `syncStatus` | **Giữ** — offline/Google Sheet. |

**Migration:**
- Schema rebuild **không khai báo** 4 cột MSG (`loaiKinh, benhVienDen, buoi, ghiChu`); nếu DB `visi_csr` đang có → `DROP COLUMN` (chỉ mất dữ liệu cột MSG không dùng — xác nhận trước khi chạy).
- **Thêm** cột `ngaySinh DATETIME NULL` (an toàn, nullable).
- Dùng `sa` để `prisma db push`. Trên DB dùng chung → review script trước; ưu tiên thao tác không mất dữ liệu nghiệp vụ.

---

## 4. RBAC & multi-tenant (SRS §3, BR-11/12)

| Chức năng | CSKH | Tư vấn viên | Kế toán | Quản lý |
|---|---|---|---|---|
| Tạo/quản lý buổi khám | ✓ | — | — | ✓ |
| Tiếp nhận bệnh nhân | ✓ | — | — | — |
| Nhập lâm sàng & tư vấn, phân nhóm A/B | — | ✓ | — | — |
| Theo dõi nhóm B | ✓ (>28 ngày) | ✓ (≤28 ngày) | — | — |
| Nhắc lịch | ✓ | ✓ | — | — |
| Cập nhật điều trị tại BV | ✓ | — | — | — |
| Xem danh sách BN | Đọc | Đọc | Đọc | Đọc (mọi CS) |
| Xuất Excel & thống kê | — | — | ✓ | ✓ |
| Quản trị master data | — | — | — | ✓ |

**Thực thi:**
- `lib/permissions.ts` — `can(role, cap)` (ma trận thuần, dùng cả client/server). Chuẩn hóa role legacy (Admin→Quản lý, BacSi→TVV).
- `lib/auth.ts` — NextAuth callback nạp `{ maNV, vaiTro, coSoId }` vào JWT/session.
- `getWorkingCoSoId(session)` — staff = coSoId được gán; **Quản lý chọn cơ sở** qua cookie `selected_coso_id` (selector trên sidebar). Mọi truy vấn scope theo `coSoId` ở **tầng query** (BR-11) — không tin frontend.
- `middleware`/`proxy.ts` — chặn route theo session.
- Mỗi route handler tự gọi `can()` (BR-12).

---

## 5. Bản đồ màn hình (UI mẫu + SRS UC) — **quyết định kiến trúc quan trọng**

> Tách rõ: **việc làm TẠI buổi khám** (nhanh, đông) vs **việc làm SAU buổi khám**. Đây là điểm đã chốt khác với app mẫu (gộp tất cả vào 1 màn).

| Route | UC | Vai trò | Nội dung |
|---|---|---|---|
| `/login` | — | tất cả | Đăng nhập; sau đăng nhập nạp cơ sở theo tài khoản |
| `/` | — | tất cả | Dashboard tổng quan (theo cơ sở đang chọn) |
| `/buoi-kham` | UC-01 | CSKH/QL | Danh sách đợt khám + tạo mới; nút **"Tham gia khám"** → `/kham/[id]` |
| `/kham/[buoiKhamId]` | UC-02, UC-03(lâm sàng) | CSKH + TVV | **Màn immersive 3 cột** (toàn màn, không sidebar): cột trái = danh sách BN + nút đăng ký; cột giữa = thông tin BN + timeline **2 bước** + In; cột phải = **1. Đo thị lực · 2. Khám mắt (Chẩn đoán + Khuyến nghị)**. Modal tiếp nhận có **quét CCCD/BHYT/VNeID** + **tra cứu BHXH** |
| `/tu-van` | UC-03(tư vấn) | TVV/QL | **Màn riêng, làm SAU buổi khám**: hàng chờ BN khuyến nghị **Phẫu thuật** (toàn cơ sở) → BHYT (tự từ thẻ) · số tiền báo · **phân nhóm A/B** · ngày điều trị (mặc định ngày mai) · điểm đón. Tự gắn người chốt (BR-03) |
| `/theo-doi` | UC-04, UC-05 | TVV/CSKH | Nhóm B: nhật ký liên hệ + followUpStatus + người chốt cuối/ngày chốt; tab **Nhắc lịch** = nhóm A theo ngày mổ |
| `/dieu-tri` | UC-06 | CSKH | Cập nhật tại BV: đã đón, ngày mổ thực tế, thực thu, trạng thái điều trị, tái khám, ghi chú mắt 2 |
| `/ho-so` | UC-07 | tất cả (đọc) | Danh sách + lọc (cơ sở/buổi/tháng/trạng thái/nhóm) + tìm (tên/mã/SĐT) |
| `/bao-cao` | UC-08 | KT/QL | Xuất Excel theo bộ lọc + thống kê cơ bản |
| `/quan-tri` | UC-09 | QL | Cơ sở, tài khoản (gán vai trò+cơ sở), audit log; soft-delete (BR-13) |

**Tái dùng UI app mẫu, áp tokens công ty:** master-detail 3 cột, step timeline, form chia mục, modal scan. Top bar teal đặc của mẫu → **navy gradient** (teal để dành "thành công"). Pill chẩn đoán → vàng `gold`. Select/date → **component tùy biến** (Dropdown/DateField) thay control mặc định của trình duyệt.

**Component dùng chung (tránh trùng giữa các màn):**
- `lib/csr.ts` — hằng số (CHAN_DOAN, KHUYEN_NGHI, BHYT, NHOM, THI_LUC) + helper thuần (`bhytLevel`, `statusOf`, `parseDiag`, `tomorrowISO`, `ageOf`).
- `components/csr/fields.tsx` — `Dropdown`, `DateField`, `ChoiceRow` (chọn 1), `PillGroup` (chọn nhiều), `Field`, `Select`, `SectionHeader`.

---

## 6. Sơ đồ trạng thái hồ sơ (BR-08, SRS §8) — suy tự động

```
Tiếp nhận ─(nhập lâm sàng)→ Đã khám
   ├─(khuyến nghị Phẫu thuật)──────────────→ Có chỉ định mổ
   │        ├─(tư vấn: có ngày điều trị)────→ Nhóm A (đã chốt lịch)
   │        └─(tư vấn: chưa chốt ngày)──────→ Nhóm B (theo dõi) ─(chốt được)→ Nhóm A
   └─(khuyến nghị Theo dõi)─────────────────→ Theo dõi
         ▼ (tại BV)
Đã đón → Đã mổ
       └→ Hủy / Không đến
```

`lib/stateMachine.ts::inferNextState(current, payload)` — hàm thuần, có unit test, gọi mỗi lần PATCH trước khi lưu + đồng bộ Sheet.
> **Lưu ý đã rút ra:** màn `/tu-van` nhập một lần đủ cả `nhom` + `ngayDieuTri` nên cần state machine **chuyển thẳng** `Có chỉ định mổ → Nhóm A/B` trong 1 lần lưu (không bắt lưu 2 lần).

---

## 7. Quy tắc nghiệp vụ (BR-01…BR-15)

| Mã | Quy tắc | Hiện thực |
|---|---|---|
| BR-01 | Mã BN = `{CƠSỞ}-{MMDD ngày khám}-{STT 3 số}`, duy nhất | `lib/maBN.ts`, sinh trong transaction |
| BR-02 | STT tăng theo từng buổi khám | `COUNT(*)+1 WHERE buoiKhamId` cùng transaction |
| BR-03 | Người chốt = tài khoản đăng nhập khi lưu tư vấn (không sửa tay) | set `tuVanVienMa = session.maNV` ở server |
| BR-04 | Nhóm A bắt buộc có Ngày điều trị | Zod refine + chặn ở `/tu-van` |
| BR-05 | Ghi công B: ≤28 ngày→TVV, >28 ngày→CSKH | chỉ **lưu** dữ liệu; tính tiền do KT làm trên Excel |
| BR-06 | `sdtNguoiNha` bắt buộc khi `sdt` trống | Zod refine |
| BR-07 | `chanDoanKhac` bắt buộc khi chọn "Khác" | Zod refine + chặn ở form khám |
| BR-08 | Trạng thái suy ra tự động | `lib/stateMachine.ts` |
| BR-09 | Không phân biệt mắt 1/2 trong thống kê | `ghiChuMat2` loại khỏi tổng hợp |
| BR-10 | Số tiền nhập tay | không tự tính BHYT/hoa hồng |
| BR-11 | Phạm vi dữ liệu theo cơ sở | `scopeByCoSo()` tầng query |
| BR-12 | Quyền sửa theo vai trò | `requireRole()`/`can()` mỗi handler |
| BR-13 | Soft-delete master data nếu có ràng buộc | kiểm tra liên kết → `trangThai='inactive'` |
| BR-14 | Audit log mọi thao tác master data + sửa hồ sơ | `lib/audit.ts` ghi `AuditLog` |
| BR-15 | Đồng bộ Sheet 1 chiều khi tạo/cập nhật | `syncHoSo()` sau mỗi ghi; lỗi → `SyncQueue` + cron retry |

---

## 8. Tích hợp ngoài

**8.1 Tra cứu BHYT (BHXH)** — creds đã có trong `.env`. Route `POST /api/bhxh`: lấy token (`BHXH_TOKEN_URL`) → query (`BHXH_QUERY_URL`) với mã thẻ/CCCD + họ tên + ngày sinh. Khi quét CCCD ở modal tiếp nhận → tự tra mã thẻ BHYT. **Mức hưởng** (SRS §7: Không có/100%/95%/80%/Không rõ) **suy từ ký tự thứ 3 của mã thẻ** (1·2·5→100% · 3→95% · 4→80%) — không nhập tay. `bhyt` lưu **mã thẻ**; hiển thị & xuất thì suy ra mức hưởng.

**8.2 Google Sheet (BR-15)** — 1 chiều phần mềm→Sheet, mỗi cơ sở 1 Sheet, upsert theo Mã BN. Service account (`GOOGLE_CREDENTIALS`), `SHEET_<COSO>` spreadsheetId. Cột trùng bảng xuất Excel (SRS §11.1). Lỗi → `SyncQueue` + cron `/api/cron/sync`.

**8.3 Xuất Excel (UC-08)** — `GET /api/baocao/export`, chỉ KT/QL, áp bộ lọc + scope cơ sở, cột theo SRS §11.1 (gồm BHYT = **mức hưởng suy từ thẻ**).

---

## 9. Cấu trúc thư mục (Next.js App Router)

```
visi-csr/
├─ prisma/
│  ├─ schema.prisma            # SQL Server (datasource provider=sqlserver)
│  └─ seed.ts                  # cơ sở + admin + danh mục
├─ prisma-local/               # (đã có) schema + client SQLite offline
├─ prisma.config.ts            # DATABASE_URL cho CLI
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/
│  │  ├─ (app)/                # layout có sidebar + topbar + chọn cơ sở
│  │  │  ├─ page.tsx           # dashboard
│  │  │  ├─ buoi-kham/         # UC-01
│  │  │  ├─ tu-van/            # UC-03 tư vấn & phân nhóm (sau buổi khám)
│  │  │  ├─ theo-doi/          # UC-04, UC-05
│  │  │  ├─ dieu-tri/          # UC-06
│  │  │  ├─ ho-so/             # UC-07
│  │  │  ├─ bao-cao/           # UC-08
│  │  │  └─ quan-tri/          # UC-09
│  │  ├─ kham/[buoiKhamId]/    # UC-02 + UC-03(lâm sàng) — immersive, ngoài (app)
│  │  └─ api/
│  │     ├─ auth/[...nextauth]/
│  │     ├─ csr/buoikham · hoso · hoso/[id] · nhatky · coso · nguoidung · reports · export
│  │     ├─ bhxh/             # tra cứu BHYT
│  │     └─ cron/sync/        # retry Google Sheet
│  ├─ components/{ui, csr, layout, providers}/
│  ├─ lib/{prisma, db-mode, auth, permissions, maBN, stateMachine, googleSheet, excel, audit, csr}.ts
│  └─ middleware (proxy.ts)
└─ tailwind config (design tokens)
```

---

## 10. Phi chức năng (SRS §12)

- Xử lý **dữ liệu cá nhân & sức khỏe** (NĐ 13/2023/NĐ-CP — rà soát pháp chế). HTTPS bắt buộc; mật khẩu bcrypt; JWT ≤8h.
- Kiểm tra phân quyền **ở server cho mọi route** (không tin frontend); lọc theo cơ sở ở tầng query; chỉ KT/QL xuất.
- Audit log; sao lưu DB hằng ngày (`sqlcmd`/job); bảo vệ khóa service account; ưu tiên hạ tầng tại VN.
- Responsive laptop + điện thoại; phản hồi < 2s; nhiều người nhập đồng thời 1 buổi.
- Offline (ưu tiên thấp): SQLite mirror + `SyncQueue`, đồng bộ khi có mạng.

---

## 11. Lộ trình triển khai

**GĐ 0 — Nền tảng (~1 tuần)**
- [ ] Khởi tạo Next.js + Tailwind tokens; `package.json`, `tsconfig`, `prisma.config.ts`.
- [ ] `prisma/schema.prisma` (SQL Server) đồng bộ với `prisma-local`; `prisma db push` (sa) + `seed.ts`.
- [ ] NextAuth + `permissions.ts` + `getWorkingCoSoId` + middleware.
- [ ] Bộ component lõi `ui/` + `csr/fields.tsx` + `lib/csr.ts` (tokens, Dropdown/DateField/ChoiceRow/PillGroup).

**GĐ 1 — MVP 1 cơ sở (nghiệm thu trước khi mở rộng)**
- [ ] Đăng nhập + menu theo vai trò + chọn cơ sở (QL).
- [ ] Buổi khám (UC-01).
- [ ] Màn khám immersive `/kham/[id]`: tiếp nhận (scan CCCD/BHYT/VNeID + tra BHXH, UC-02), lâm sàng (UC-03) — mã BN/STT tự sinh (BR-01/02), BR-06/07.
- [ ] Màn `/tu-van` (UC-03 tư vấn & phân nhóm A/B) — BR-03/04, BHYT suy từ thẻ.
- [ ] Danh sách hồ sơ + lọc/tìm (UC-07).
- [ ] Xuất Excel (UC-08).
- [ ] Quản trị cơ sở & tài khoản + soft-delete (UC-09, BR-13).

**GĐ 2**
- [ ] Theo dõi nhóm B + nhật ký + nhắc lịch (UC-04/05).
- [ ] Cập nhật điều trị tại BV (UC-06).
- [ ] Thống kê cơ bản (Recharts) + dashboard.
- [ ] Audit log (BR-14) + màn xem log.
- [ ] Đồng bộ Google Sheet tự động (BR-15) + cron retry.

**GĐ 3**
- [ ] Đa cơ sở đầy đủ + dashboard Quản lý toàn hệ thống.
- [ ] Nhập dữ liệu cũ từ Google Sheet.
- [ ] (Tùy chọn) PWA + offline nháp.

---

## 12. Nguyên tắc khi thêm trường mới (đồng bộ 5 bước)
(1) Prisma migration (cả 2 schema) → (2) Zod + handler → (3) HEADER + `toRow()` trong `googleSheet.ts` → (4) cột xuất Excel → (5) form + hiển thị frontend.

---

*Plan này mô tả "làm thế nào"; nghiệp vụ/dữ liệu/quy tắc bám SRS 1.1. Các quyết định khác app mẫu MSG: (a) tách màn Tư vấn ra khỏi màn khám; (b) **bỏ field MSG không có trong SRS** (cho thuốc, loại kính, bệnh viện đến, buổi, ghi chú); (c) BHYT suy từ thẻ thay vì chọn tay; (d) **thêm `ngaySinh`** (DOB đầy đủ) lấy tự động khi quét thẻ BHYT/CCCD.*
