"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const directorio_service_1 = require("./directorio.service");
const adminAuth_middleware_1 = require("../../middlewares/adminAuth.middleware");
const router = (0, express_1.Router)();
// Permisos generales para el directorio (editor_contenido, admin_general, auditor)
const allowedRoles = ["admin_general", "editor_contenido"];
// Prevision
router.get("/prevision", directorio_service_1.getPrevisiones);
router.post("/prevision", (0, adminAuth_middleware_1.requireRole)(allowedRoles), directorio_service_1.createPrevision);
router.put("/prevision/:codigo", (0, adminAuth_middleware_1.requireRole)(allowedRoles), directorio_service_1.updatePrevision);
router.delete("/prevision/:codigo", (0, adminAuth_middleware_1.requireRole)(allowedRoles), directorio_service_1.deletePrevision);
// Especialidades
router.get("/especialidades/stats", directorio_service_1.getEspecialidadesStats);
router.get("/especialidades", directorio_service_1.getEspecialidades);
router.post("/especialidades", (0, adminAuth_middleware_1.requireRole)(allowedRoles), directorio_service_1.createEspecialidad);
router.put("/especialidades/:codigo", (0, adminAuth_middleware_1.requireRole)(allowedRoles), directorio_service_1.updateEspecialidad);
router.delete("/especialidades/:codigo", (0, adminAuth_middleware_1.requireRole)(allowedRoles), directorio_service_1.deleteEspecialidad);
// Centros
router.get("/centros", directorio_service_1.getCentros);
router.post("/centros", (0, adminAuth_middleware_1.requireRole)(allowedRoles), directorio_service_1.createCentro);
router.put("/centros/:codigo", (0, adminAuth_middleware_1.requireRole)(allowedRoles), directorio_service_1.updateCentro);
router.delete("/centros/:codigo", (0, adminAuth_middleware_1.requireRole)(allowedRoles), directorio_service_1.deleteCentro);
// Medicos
router.get("/medicos", directorio_service_1.getMedicos);
router.post("/medicos", (0, adminAuth_middleware_1.requireRole)(allowedRoles), directorio_service_1.createMedico);
router.put("/medicos/:id", (0, adminAuth_middleware_1.requireRole)(allowedRoles), directorio_service_1.updateMedico);
router.delete("/medicos/:id", (0, adminAuth_middleware_1.requireRole)(allowedRoles), directorio_service_1.deleteMedico);
exports.default = router;
