import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import {
  getVacunas,
  updateVacuna,
  getControles,
  createControl,
  getCitas,
  createCita
} from "../controllers/salud.controller";

const router = Router();

// Todas las rutas de salud son protegidas
router.use(verifyToken);

// Rutas de Vacunas
router.get("/:bebeId/vacunas", getVacunas);
router.patch("/:bebeId/vacunas/:vacunaId", updateVacuna);

// Rutas de Controles de Crecimiento
router.get("/:bebeId/crecimiento", getControles);
router.post("/:bebeId/crecimiento", createControl);

// Rutas de Citas Médicas / Controles Prenatales
router.get("/:bebeId/citas", getCitas);
router.post("/:bebeId/citas", createCita);

export default router;
