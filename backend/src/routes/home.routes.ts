import { Router } from "express";
import { getHomeDashboard, addGrowthRecord } from "../controllers/home.controller";

const router = Router();

// Endpoint for Home Dashboard
router.get("/:idPerfil", getHomeDashboard);
router.post("/:idPerfil/crecimiento", addGrowthRecord);

export default router;
