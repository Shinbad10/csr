-- Migration: đưa HoSoBenhNhan về đúng SRS 1.1 + thêm ngaySinh + index.
-- Bỏ các cột ngoài SRS (app mẫu MSG + thực nghiệm cũ): benhVienDen, buoi, donThuoc,
--   ghiChu, ghiChuKham, ghiChuTuVan, loaiKinh, thiLucMPCo, thiLucMTCo (chỉ mất dữ liệu các cột này).
-- Thêm: ngaySinh (ngày sinh đầy đủ, lấy khi quét thẻ BHYT/CCCD).
-- Chạy bằng tài khoản có quyền DDL (sa). Sinh từ: prisma migrate diff (read-only) vs DB hiện tại.

BEGIN TRY
  BEGIN TRAN;

  ALTER TABLE [dbo].[HoSoBenhNhan] DROP COLUMN
    [benhVienDen], [buoi], [donThuoc], [ghiChu], [ghiChuKham],
    [ghiChuTuVan], [loaiKinh], [thiLucMPCo], [thiLucMTCo];

  ALTER TABLE [dbo].[HoSoBenhNhan] ADD [ngaySinh] DATETIME2;

  CREATE NONCLUSTERED INDEX [HoSoBenhNhan_coSoId_idx]     ON [dbo].[HoSoBenhNhan]([coSoId]);
  CREATE NONCLUSTERED INDEX [HoSoBenhNhan_buoiKhamId_idx] ON [dbo].[HoSoBenhNhan]([buoiKhamId]);
  CREATE NONCLUSTERED INDEX [HoSoBenhNhan_trangThai_idx]  ON [dbo].[HoSoBenhNhan]([trangThai]);

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
