import { Router } from "express";
import {
  getIp,
  trackLocation,
  trackTime,
  updateFraudUser,
} from "../controllers/getIp.controller";
import { getUserIP } from "../middleware/getUserIP";

const router = Router();

router.get("/", getIp);
router.post("/track-time", getUserIP, trackTime);
router.put("/user-location", getUserIP, trackLocation);
router.put("/update-fraud-user", getUserIP, updateFraudUser);

export default router;
