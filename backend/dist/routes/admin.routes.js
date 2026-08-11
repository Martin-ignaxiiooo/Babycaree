"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const adminAuth_middleware_1 = require("../middlewares/adminAuth.middleware");
const vacunas_routes_1 = __importDefault(require("../microservices/vacunas/vacunas.routes"));
const directorio_routes_1 = __importDefault(require("../microservices/directorio/directorio.routes"));
const articulos_routes_1 = __importDefault(require("../microservices/articulos/articulos.routes"));
const bitacora_routes_1 = __importDefault(require("../microservices/bitacora/bitacora.routes"));
const dashboard_routes_1 = __importDefault(require("../microservices/dashboard/dashboard.routes"));
const oms_routes_1 = __importDefault(require("../microservices/oms/oms.routes"));
const comunidad_routes_1 = __importDefault(require("../microservices/comunidad/comunidad.routes"));
const router = (0, express_1.Router)();
// Auth routes
const rateLimit_middleware_1 = require("../middlewares/rateLimit.middleware");
router.post("/auth/login", rateLimit_middleware_1.loginLimiter, admin_controller_1.login);
router.post("/auth/verificar-2fa", admin_controller_1.verify2fa);
// Seed admin
router.get("/seed", admin_controller_1.seedAdmin);
// Protected routes
router.use(adminAuth_middleware_1.verifyAdminToken);
const admin_2fa_controller_1 = require("../controllers/admin_2fa.controller");
router.post("/auth/2fa/generate", admin_2fa_controller_1.generate2fa);
router.post("/auth/2fa/enable", admin_2fa_controller_1.enable2fa);
// Usuarios
router.get("/usuarios/stats", (0, adminAuth_middleware_1.requireRole)(["admin_general", "soporte_cliente", "auditor"]), admin_controller_1.getUsuariosStats);
router.get("/usuarios", (0, adminAuth_middleware_1.requireRole)(["admin_general", "soporte_cliente", "auditor"]), admin_controller_1.getUsuarios);
router.post("/usuarios", (0, adminAuth_middleware_1.requireRole)(["admin_general", "soporte_cliente"]), admin_controller_1.createUsuario);
router.put("/usuarios/:id", (0, adminAuth_middleware_1.requireRole)(["admin_general", "soporte_cliente"]), admin_controller_1.updateUsuario);
router.delete("/usuarios/:id", (0, adminAuth_middleware_1.requireRole)(["admin_general"]), admin_controller_1.deleteUsuario);
router.post("/usuarios/:id/impersonate", (0, adminAuth_middleware_1.requireRole)(["admin_general", "soporte_cliente"]), admin_controller_1.impersonateUser);
// Administradores
router.get("/administradores/stats", (0, adminAuth_middleware_1.requireRole)(["admin_general", "auditor"]), admin_controller_1.getAdministradoresStats);
router.get("/administradores", (0, adminAuth_middleware_1.requireRole)(["admin_general", "auditor"]), admin_controller_1.getAdministradores);
router.post("/administradores", (0, adminAuth_middleware_1.requireRole)(["admin_general"]), admin_controller_1.createAdministrador);
router.put("/administradores/:id", (0, adminAuth_middleware_1.requireRole)(["admin_general"]), admin_controller_1.updateAdministrador);
router.put("/administradores/:id/password", (0, adminAuth_middleware_1.requireRole)(["admin_general"]), admin_controller_1.updateAdministradorPassword);
router.delete("/administradores/:id", (0, adminAuth_middleware_1.requireRole)(["admin_general"]), admin_controller_1.deleteAdministrador);
// Microservicios
router.use("/vacunas", vacunas_routes_1.default);
router.use("/directorio", directorio_routes_1.default);
router.use("/articulos", articulos_routes_1.default);
router.use("/bitacora", bitacora_routes_1.default);
router.use("/dashboard", dashboard_routes_1.default);
router.use("/oms", oms_routes_1.default);
router.use("/comunidad", comunidad_routes_1.default);
exports.default = router;
