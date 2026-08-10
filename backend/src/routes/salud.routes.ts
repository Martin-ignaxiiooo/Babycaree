import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import {
  getVacunas,
  updateVacuna,
  getControles,
  createControl
} from "../controllers/salud.controller";

const router = Router();

// Todas las rutas de salud son protegidas
router.use(verifyToken);

// Rutas de Vacunas
router.get("/:bebeId/vacunas", getVacunas);
router.patch("/:bebeId/vacunas/:vacunaId", updateVacuna);

// Rutas de Controles
router.get("/:bebeId/crecimiento", getControles);
router.post("/:bebeId/crecimiento", createControl);

export default router;
