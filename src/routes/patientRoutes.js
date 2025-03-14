import express from "express";
import { patientController } from "../controllers/index.js";

const router = express.Router();

router.get("/", patientController.fetchPatients);
router.get("/:MaDotKham", patientController.fetchPatientsbyCampaign);

export default router;
