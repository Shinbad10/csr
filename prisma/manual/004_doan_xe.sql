-- Đoàn xe theo điểm đón: loại xe (số chỗ) + giờ đón của từng đoàn. Additive — chỉ tạo bảng mới,
-- không đụng dữ liệu cũ. Chạy TRƯỚC khi deploy bản có trang Đoàn xe sơ đồ ghế.
-- (Trước đây đoàn tạo nhanh lưu ở file data/doan-xe-routes.json trong container nên mất mỗi lần deploy.)
IF OBJECT_ID('dbo.DoanXe', 'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[DoanXe] (
    [id]        NVARCHAR(1000) NOT NULL,
    [coSoId]    NVARCHAR(50)   NOT NULL,
    [ngayDon]   NVARCHAR(20)   NOT NULL,
    [diemDon]   NVARCHAR(300)  NOT NULL,
    [soDoan]    INT            NOT NULL,
    [soCho]     INT            NOT NULL,
    [gioDon]    NVARCHAR(20)   NULL,
    [createdAt] DATETIME2      NOT NULL CONSTRAINT [DoanXe_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2      NOT NULL,
    CONSTRAINT [DoanXe_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DoanXe_coSoId_ngayDon_diemDon_soDoan_key] UNIQUE NONCLUSTERED ([coSoId], [ngayDon], [diemDon], [soDoan])
  );
  CREATE NONCLUSTERED INDEX [DoanXe_coSoId_ngayDon_idx] ON [dbo].[DoanXe]([coSoId], [ngayDon]);
END
