import db from "../config/knex.js";

export const getMedicines = async () => {
    return await db("DMThuoc").select("*");
};
export const insertMedicine = async (medicineData) => {
    return await db("DMThuoc").insert(medicineData);
}
export const updateMedicine = async (maThuoc, updatedData) => {
    return await db("DMThuoc").where("MaThuoc", maThuoc).update(updatedData);
  };
export const deleteMedicine = async (rows) => {
    return await db("DMThuoc").delete().where("MaThuoc", "in", rows);
};