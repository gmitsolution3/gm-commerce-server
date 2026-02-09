import { Router } from "express";
import { reSendOTPController, verifyOTPController } from "../controllers/otp.controller";


const router = Router()


router.post("/verify-otp", verifyOTPController)
router.post("/resend-otp", reSendOTPController);


export default router;