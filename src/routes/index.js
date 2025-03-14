import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import employeeRoutes from "./employeeRoutes.js";
import medicineRoutes from "./medicineRoutes.js";
import campaignRoutes from "./campaignRoutes.js";
import patientRoutes from "./patientRoutes.js";

const router = express.Router();
const protectedRouter = express.Router();
protectedRouter.use(authenticateToken);

protectedRouter.use("/nhan-vien",authenticateToken, employeeRoutes);
protectedRouter.use("/thuoc",authenticateToken, medicineRoutes);
protectedRouter.use("/dot-kham",authenticateToken, campaignRoutes);
protectedRouter.use("/benh-nhan",authenticateToken, patientRoutes);

router.use(protectedRouter);

export default router;
