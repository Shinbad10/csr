import express from "express";
import { medicineController } from "../controllers/index.js";

const router = express.Router();

router.get("/", medicineController.fetchMedicines);
router.post("/them-thuoc", medicineController.insertMedicine);
router.post("/sua-thuoc", medicineController.updateMedicine);
router.post("/xoa-thuoc", medicineController.deleteMedicine);

export default router;
