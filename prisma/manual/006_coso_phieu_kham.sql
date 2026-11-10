-- Thông tin in trên phiếu khám (hotline, email, website) + toa thuốc mặc định của cơ sở (additive, không mất dữ liệu).
-- Chạy TRƯỚC khi deploy bản có các cột này: Prisma đọc mọi cột của CoSo nên thiếu cột là các trang báo lỗi "Invalid column name".
-- toaThuoc: JSON { "thuoc": [{ "ten", "soLuong", "cachDung" }], "loiDan": "..." }. Chạy lại nhiều lần vẫn an toàn.
IF COL_LENGTH('dbo.CoSo', 'dienThoai') IS NULL
  ALTER TABLE [dbo].[CoSo] ADD [dienThoai] NVARCHAR(1000) NULL;
IF COL_LENGTH('dbo.CoSo', 'email') IS NULL
  ALTER TABLE [dbo].[CoSo] ADD [email] NVARCHAR(1000) NULL;
IF COL_LENGTH('dbo.CoSo', 'website') IS NULL
  ALTER TABLE [dbo].[CoSo] ADD [website] NVARCHAR(1000) NULL;
IF COL_LENGTH('dbo.CoSo', 'toaThuoc') IS NULL
  ALTER TABLE [dbo].[CoSo] ADD [toaThuoc] NVARCHAR(MAX) NULL;
