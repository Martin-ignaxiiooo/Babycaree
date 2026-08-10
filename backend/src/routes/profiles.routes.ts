import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import {
  getMe,
  updateMe,
  updatePassword,
  createBabyProfile,
  getMyBabies,
  getPublicBabyProfile,
  deleteBabyProfile,
} from "../controllers/profiles.controller";

const router = Router();

// Rutas Públicas
router.get("/public/:id", getPublicBabyProfile);

// Rutas Protegidas
router.use(verifyToken);

router.get("/me", getMe);
router.patch("/me", updateMe);
router.patch("/me/password", updatePassword);
router.post("/babies", createBabyProfile);
router.get("/babies", getMyBabies);
router.delete("/babies/:id", deleteBabyProfile);

export default router;
