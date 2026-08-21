import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { uploadAudioMemoria } from "../middlewares/uploadAudio.middleware";
import {
  getVacunas,
  updateVacuna,
  getControles,
  createControl,
  getCitas,
  createCita,
  registrarResultadoCita,
  transcribirNotaDeVoz
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
// Agendar dictando una nota de voz: devuelve los campos extraídos para que
// el usuario los revise; no crea la cita directamente.
router.post("/:bebeId/citas/transcribir", uploadAudioMemoria.single("audio"), transcribirNotaDeVoz);
// Registrar cómo resultó la cita (contraparte del correo de seguimiento).
router.patch("/:bebeId/citas/:citaId", registrarResultadoCita);

export default router;
