import express from "express";
import { campaignController } from "../controllers/index.js";

const router = express.Router();

router.get("/", campaignController.fetchCampaigns);
router.post("/them-dot-kham", campaignController.insertCampaign);
router.post("/sua-dot-kham", campaignController.updateCampaign);
router.post("/xoa-dot-kham", campaignController.deleteCampaign);
router.get("/:MaDotKham", campaignController.campaignDetails);

export default router;
