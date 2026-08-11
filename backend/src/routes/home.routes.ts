import { Router } from "express";
import { getHomeDashboard, addGrowthRecord } from "../controllers/home.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// Endpoint for Home Dashboard
router.get("/:idPerfil", verifyToken, getHomeDashboard);
router.post("/:idPerfil/crecimiento", verifyToken, addGrowthRecord);

export default router;
