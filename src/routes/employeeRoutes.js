import express from "express";
import { employeeController } from "../controllers/index.js";

const router = express.Router();

router.get("/", employeeController.fetchEmployees);
router.post("/them-nhan-vien", employeeController.insertEmployee);
router.post("/sua-nhan-vien", employeeController.updateEmployee);
router.post("/xoa-nhan-vien", employeeController.deleteEmployee);

export default router;
