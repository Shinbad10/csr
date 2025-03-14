import db from "../config/knex.js";

export const getCampaigns = async () => {
    const result = await db("DotKham as dk")
    .select("dk.*")
    .select(
      db.raw(`
        COALESCE(
          (
            SELECT 
            tv.MaNV, 
            nv.HoTenNV,
            nv.Username,
            nv.ChucVu,
            nv.ChucDanh,
            cn.MaDotKham
        FROM ThanhVien tv
        JOIN DotKham cn ON tv.MaDotKham = cn.MaDotKham
        JOIN NhanVien nv ON nv.MaNV = tv.MaNV
        WHERE tv.MaDotKham = dk.MaDotKham
            FOR JSON PATH
          ), '[]'
        ) AS ThanhVien,
          COALESCE(
          (
            SELECT 
            tv.MaDotKham,
            tv.MaCongViec
        FROM DotKhamThucHien tv
        WHERE tv.MaDotKham = dk.MaDotKham
            FOR JSON PATH
          ), '[]'
        ) AS CongViecThucHien,
        (
            SELECT COUNT(MaBenhNhan) 
            FROM BenhNhan 
            WHERE BenhNhan.MaDotKham = dk.MaDotKham
        ) AS SLBN,
         (
            SELECT COUNT(MaBenhNhan) 
            FROM BenhNhan 
            WHERE BenhNhan.MaDotKham = dk.MaDotKham AND BenhNhan.DaMo = 1
        ) AS SLMo,
         (
            SELECT TenTrangThai
            FROM TrangThai 
            WHERE dk.MaTrangThai = TrangThai.MaTrangThai
        ) AS TrangThai,
        (
            SELECT  HoTenNV
            FROM NhanVien 
            WHERE dk.TruongDoan = NhanVien.MaNV
        ) AS NguoiTao
      `)
    )
  return result.map((row) => ({
    ...row,
    ThanhVien: JSON.parse(row.ThanhVien), // Chuyển từ string JSON thành object
    CongViecThucHien: JSON.parse(row.CongViecThucHien), // Chuyển từ string JSON thành object
  }));
  };
export const getTasks = async () => {
  return await db("CongViec").select("*");
};
export const insertCampaign = async (data) => {
  const result = await db("DotKham").insert(data);
  return result;
}
export const insertMembers = async (data) => {
  const result = await db("ThanhVien").insert(data);
  return result;
}
export const updateMembers = async (MaDotKham, members) => {
  if (members.length === 0) {
    return await db("ThanhVien").delete().where("MaDotKham", MaDotKham);
  }
  await db("ThanhVien").delete().where("MaDotKham", MaDotKham);
  return await db("ThanhVien").insert(members);
};
export const insertTasks = async (data) => {
  const result = await db("DotKhamThucHien").insert(data);
  return result;
}
export const updateTasks = async (MaDotKham, tasks) => {
  if (tasks.length === 0) {
    return await db("DotKhamThucHien").delete().where("MaDotKham", MaDotKham);
  }
  await db("DotKhamThucHien").delete().where("MaDotKham", MaDotKham);
  return await db("DotKhamThucHien").insert(tasks);
};
export const updateCampaign = async (MaDotKham, updatedData)  => {
  const columns = await db("DotKham").columnInfo();
  const allowedFields = Object.keys(columns); // Lấy danh sách các cột hợp lệ
  const cleanData = Object.fromEntries(Object.entries(updatedData).filter(([key]) => allowedFields.includes(key)));
  return await db("DotKham").where("MaDotKham", MaDotKham).update(cleanData);
};

export const deleteCampaign = async (rows) => {
  await db("DotKhamThucHien").delete().where("MaDotKham", "in", rows);
  await db("ThanhVien").delete().where("MaDotKham", "in", rows);
  await db("BenhNhan").delete().where("MaDotKham", "in", rows);
  await db("DotKham").delete().where("MaDotKham", "in", rows);
  return true;
}
export const getDetailCampaign = async (MaDotKham) => {
  const result = await db("DotKham as dk")
    .select("dk.*")
    .select(
      db.raw(`
        COALESCE(
          (
            SELECT 
            tv.MaNV, 
            nv.HoTenNV,
            nv.Username,
            nv.ChucVu,
            nv.ChucDanh,
            cn.MaDotKham
        FROM ThanhVien tv
        JOIN DotKham cn ON tv.MaDotKham = cn.MaDotKham
        JOIN NhanVien nv ON nv.MaNV = tv.MaNV
        WHERE tv.MaDotKham = dk.MaDotKham
            FOR JSON PATH
          ), '[]'
        ) AS ThanhVien,
          COALESCE(
          (
            SELECT 
            tv.MaDotKham,
            tv.MaCongViec,
            cv.TenCongViec
        FROM DotKhamThucHien tv
        JOIN CongViec cv ON tv.MaCongViec = cv.MaCongViec
        WHERE tv.MaDotKham = dk.MaDotKham
            FOR JSON PATH
          ), '[]'
        ) AS CongViecThucHien
      `)
    )
    .where("dk.MaDotKham", MaDotKham)
  return result.map((row) => ({
    ...row,
    ThanhVien: JSON.parse(row.ThanhVien), // Chuyển từ string JSON thành object
    CongViecThucHien: JSON.parse(row.CongViecThucHien), // Chuyển từ string JSON thành object
  }));
}



