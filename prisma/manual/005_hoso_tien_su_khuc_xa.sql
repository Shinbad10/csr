-- Thêm Tiền sử phẫu thuật + Thị lực có kính + KCĐT vào phiếu khám (additive, không mất dữ liệu).
-- Chạy TRƯỚC khi deploy bản có các cột này: Prisma đọc mọi cột của HoSoBenhNhan nên thiếu cột là
-- mọi trang hồ sơ báo lỗi "Invalid column name". Chạy lại nhiều lần vẫn an toàn.
-- tienSuPhauThuat: JSON mảng, vd. ["Đục TTT (MP)","Đục TTT (MT)"].
IF COL_LENGTH('dbo.HoSoBenhNhan', 'tienSuPhauThuat') IS NULL
  ALTER TABLE [dbo].[HoSoBenhNhan] ADD [tienSuPhauThuat] NVARCHAR(1000) NULL;
IF COL_LENGTH('dbo.HoSoBenhNhan', 'thiLucCoKinhMP') IS NULL
  ALTER TABLE [dbo].[HoSoBenhNhan] ADD [thiLucCoKinhMP] NVARCHAR(1000) NULL;
IF COL_LENGTH('dbo.HoSoBenhNhan', 'thiLucCoKinhMT') IS NULL
  ALTER TABLE [dbo].[HoSoBenhNhan] ADD [thiLucCoKinhMT] NVARCHAR(1000) NULL;
IF COL_LENGTH('dbo.HoSoBenhNhan', 'kcdt') IS NULL
  ALTER TABLE [dbo].[HoSoBenhNhan] ADD [kcdt] NVARCHAR(1000) NULL;
