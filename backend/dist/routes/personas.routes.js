"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const personas_controller_1 = require("../controllers/personas.controller");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const searchLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minuto
    max: 20, // 20 peticiones
    message: { error: 'Demasiadas solicitudes de búsqueda. Por favor intente más tarde.' }
});
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyToken);
router.get('/buscar', searchLimiter, personas_controller_1.buscarPersonas);
router.post('/sincronizar-contactos', personas_controller_1.sincronizarContactos);
exports.default = router;
