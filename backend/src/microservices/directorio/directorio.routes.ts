import { Router } from "express";
import {
  getPrevisiones,
  createPrevision,
  updatePrevision,
  deletePrevision,
  getEspecialidades,
  createEspecialidad,
  updateEspecialidad,
  deleteEspecialidad,
  getEspecialidadesStats,
  getCentros,
  createCentro,
  updateCentro,
  deleteCentro,
  getMedicos,
  createMedico,
  updateMedico,
  deleteMedico,
} from "./directorio.service";
import { requireRole } from "../../middlewares/adminAuth.middleware";

const router = Router();

// Permisos generales para el directorio (editor_contenido, admin_general, auditor)
const allowedRoles = ["admin_general", "editor_contenido"];

// Prevision
router.get("/prevision", getPrevisiones);
router.post("/prevision", requireRole(allowedRoles), createPrevision);
router.put("/prevision/:codigo", requireRole(allowedRoles), updatePrevision);
router.delete("/prevision/:codigo", requireRole(allowedRoles), deletePrevision);

// Especialidades
router.get("/especialidades/stats", getEspecialidadesStats);
router.get("/especialidades", getEspecialidades);
router.post("/especialidades", requireRole(allowedRoles), createEspecialidad);
router.put(
  "/especialidades/:codigo",
  requireRole(allowedRoles),
  updateEspecialidad,
);
router.delete(
  "/especialidades/:codigo",
  requireRole(allowedRoles),
  deleteEspecialidad,
);

// Centros
router.get("/centros", getCentros);
router.post("/centros", requireRole(allowedRoles), createCentro);
router.put("/centros/:codigo", requireRole(allowedRoles), updateCentro);
router.delete("/centros/:codigo", requireRole(allowedRoles), deleteCentro);

// Medicos
router.get("/medicos", getMedicos);
router.post("/medicos", requireRole(allowedRoles), createMedico);
router.put("/medicos/:id", requireRole(allowedRoles), updateMedico);
router.delete("/medicos/:id", requireRole(allowedRoles), deleteMedico);

export default router;
