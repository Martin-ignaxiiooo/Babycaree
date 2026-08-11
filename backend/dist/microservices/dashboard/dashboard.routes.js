"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_service_1 = require("./dashboard.service");
const adminAuth_middleware_1 = require("../../middlewares/adminAuth.middleware");
const router = (0, express_1.Router)();
router.get("/stats", (0, adminAuth_middleware_1.requireRole)([
    "admin_general",
    "auditor",
    "soporte_cliente",
    "editor_contenido",
]), dashboard_service_1.getDashboardStats);
exports.default = router;
