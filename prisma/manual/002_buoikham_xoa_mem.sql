-- Xoá mềm đợt khám: thêm trạng thái + thời điểm / người xoá. Chỉ THÊM cột (không mất dữ liệu),
-- chạy lại nhiều lần vô hại. Phải chạy TRƯỚC khi triển khai bản code có xoá mềm đợt khám.
IF COL_LENGTH('dbo.BuoiKham', 'trangThai') IS NULL
  ALTER TABLE [dbo].[BuoiKham] ADD [trangThai] NVARCHAR(1000) NOT NULL
    CONSTRAINT [BuoiKham_trangThai_df] DEFAULT 'active';

IF COL_LENGTH('dbo.BuoiKham', 'xoaLuc') IS NULL
  ALTER TABLE [dbo].[BuoiKham] ADD [xoaLuc] DATETIME2 NULL;

IF COL_LENGTH('dbo.BuoiKham', 'xoaBoi') IS NULL
  ALTER TABLE [dbo].[BuoiKham] ADD [xoaBoi] NVARCHAR(1000) NULL;
