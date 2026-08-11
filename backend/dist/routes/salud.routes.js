"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const salud_controller_1 = require("../controllers/salud.controller");
const router = (0, express_1.Router)();
// Todas las rutas de salud son protegidas
router.use(auth_middleware_1.verifyToken);
// Rutas de Vacunas
router.get("/:bebeId/vacunas", salud_controller_1.getVacunas);
router.patch("/:bebeId/vacunas/:vacunaId", salud_controller_1.updateVacuna);
// Rutas de Controles
router.get("/:bebeId/crecimiento", salud_controller_1.getControles);
router.post("/:bebeId/crecimiento", salud_controller_1.createControl);
exports.default = router;
