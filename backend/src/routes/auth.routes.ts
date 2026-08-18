import { Router } from "express";
import {
  register,
  login,
  googleAuth,
  registrarConsentimiento,
  forgotPassword,
  verifyCode,
  resetPassword,
  resendCode,
} from "../controllers/auth.controller";
import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  codeVerifyLimiter,
} from "../middlewares/rateLimit.middleware";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/google", loginLimiter, googleAuth);
router.post("/consentimiento", verifyToken, registrarConsentimiento);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/verify-code", codeVerifyLimiter, verifyCode);
router.post("/reset-password", codeVerifyLimiter, resetPassword);
router.post("/resend-code", forgotPasswordLimiter, resendCode);

export default router;
