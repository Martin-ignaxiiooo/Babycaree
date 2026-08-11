"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const home_controller_1 = require("../controllers/home.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Endpoint for Home Dashboard
router.get("/:idPerfil", auth_middleware_1.verifyToken, home_controller_1.getHomeDashboard);
router.post("/:idPerfil/crecimiento", auth_middleware_1.verifyToken, home_controller_1.addGrowthRecord);
exports.default = router;
