-- Thêm độ kính MP / MT vào phiếu khám (additive, không mất dữ liệu). Chạy TRƯỚC khi deploy bản có cột này:
-- Prisma đọc mọi cột của HoSoBenhNhan nên thiếu cột là mọi trang hồ sơ báo lỗi "Invalid column name".
IF COL_LENGTH('dbo.HoSoBenhNhan', 'doKinhMP') IS NULL
  ALTER TABLE [dbo].[HoSoBenhNhan] ADD [doKinhMP] NVARCHAR(1000) NULL;
IF COL_LENGTH('dbo.HoSoBenhNhan', 'doKinhMT') IS NULL
  ALTER TABLE [dbo].[HoSoBenhNhan] ADD [doKinhMT] NVARCHAR(1000) NULL;
