-- Phần additive (KHÔNG mất dữ liệu): thêm ngaySinh + 3 index.
-- Các cột MSG/thực nghiệm cũ để lại trong DB cũng không sao — Prisma bỏ qua cột thừa.
IF COL_LENGTH('dbo.HoSoBenhNhan', 'ngaySinh') IS NULL
  ALTER TABLE [dbo].[HoSoBenhNhan] ADD [ngaySinh] DATETIME2;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'HoSoBenhNhan_coSoId_idx')
  CREATE NONCLUSTERED INDEX [HoSoBenhNhan_coSoId_idx] ON [dbo].[HoSoBenhNhan]([coSoId]);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'HoSoBenhNhan_buoiKhamId_idx')
  CREATE NONCLUSTERED INDEX [HoSoBenhNhan_buoiKhamId_idx] ON [dbo].[HoSoBenhNhan]([buoiKhamId]);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'HoSoBenhNhan_trangThai_idx')
  CREATE NONCLUSTERED INDEX [HoSoBenhNhan_trangThai_idx] ON [dbo].[HoSoBenhNhan]([trangThai]);
