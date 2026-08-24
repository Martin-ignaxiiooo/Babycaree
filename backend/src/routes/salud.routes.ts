import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import {
  getVacunas,
  updateVacuna,
  getControles,
  createControl,
  getCitas,
  createCita,
  registrarResultadoCita,
  getRecetaFoto,
  deleteCita
} from "../controllers/salud.controller";
import {
  getExamenes,
  getExamenFoto,
  getExamenOrdenFoto,
  createExamen,
  updateExamen,
  deleteExamen
} from "../controllers/examenes.controller";
import {
  getSaludMaterna,
  createRegistroMaterno,
  createSintomas,
  setPesoInicial
} from "../controllers/salud_materna.controller";

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
// Resultado de la consulta: peso, talla, diagnóstico, receta.
router.patch("/:bebeId/citas/:citaId", registrarResultadoCita);
// La foto de la receta va aparte del listado porque es pesada.
router.get("/:bebeId/citas/:citaId/receta", getRecetaFoto);
router.delete("/:bebeId/citas/:citaId", deleteCita);

// Exámenes indicados en una consulta
router.get("/:bebeId/examenes", getExamenes);
router.post("/:bebeId/examenes", createExamen);
router.patch("/:bebeId/examenes/:examenId", updateExamen);
router.delete("/:bebeId/examenes/:examenId", deleteExamen);
router.get("/:bebeId/examenes/:examenId/foto", getExamenFoto);
router.get("/:bebeId/examenes/:examenId/orden-foto", getExamenOrdenFoto);

// Salud de la gestante: peso, presión y síntomas de la madre (distinto
// del peso/talla del bebé, que va en /crecimiento).
router.get("/:bebeId/materna", getSaludMaterna);
router.post("/:bebeId/materna", createRegistroMaterno);
router.post("/:bebeId/materna/sintomas", createSintomas);
router.patch("/:bebeId/materna/peso-inicial", setPesoInicial);

export default router;
