import db from "../config/knex.js";

export const getEmployees = async () => {
  const result = await db("NhanVien as nv")
    .select("nv.*")
    .select(
      db.raw(`
        COALESCE(
          (
            SELECT 
              cn.MaChucNang, 
              cn.TenChucNang
            FROM ChucNangNhanVien cnv
            JOIN ChucNang cn ON cnv.MaChucNang = cn.MaChucNang
            WHERE cnv.MaNV = nv.MaNV
            FOR JSON PATH
          ), '[]'
        ) AS Permissions
      `)
    )
    .where("nv.MaNV", ">", 1 )
  return result.map((row) => ({
    ...row,
    Permissions: JSON.parse(row.Permissions), // Chuyển từ string JSON thành object
  }));
};
export const getPermissions = async () => {
  return await db("ChucNang").select("*").where("MaChucNang", ">", 1 );
};
export const insertEmployee = async (EmployeeData) => {
  return await db("NhanVien").insert(EmployeeData);
}
export const updateEmployee = async (MaNV, updatedData) => {
  return await db("NhanVien").where("MaNV", MaNV).update(updatedData);
};
export const deleteEmployee = async (rows) => {
  return await db("NhanVien").delete().where("MaNV", "in", rows);
};
export const assignFunctions = async (MaNV, functions) => {
  if (functions.length === 0) {
    return await db("ChucNangNhanVien").delete().where("MaNV", MaNV);
  }
  await db("ChucNangNhanVien").delete().where("MaNV", MaNV);
  return await db("ChucNangNhanVien").insert(functions);
};
export const deleteFunctions = async (rows) => {
  return await db("ChucNangNhanVien").delete().where("MaNV", "in", rows);
};






