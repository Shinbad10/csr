import db from "../config/knex.js";

export const getPatients = async () => {
    return await db("BenhNhan").select("*");
};
export const getPatientsByCampaign = async (MaDotKham) => {
    return await db("BenhNhan").select("*").where("MaDotKham",MaDotKham)
};
  