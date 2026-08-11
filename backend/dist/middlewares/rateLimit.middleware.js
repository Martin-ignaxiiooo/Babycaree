"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeVerifyLimiter = exports.forgotPasswordLimiter = exports.loginLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Límite global: 100 peticiones por IP en 1 min para evitar bloqueos masivos
exports.globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        status: 429,
        error: "Demasiadas peticiones, intenta más tarde.",
    },
});
// Login: 5 intentos por IP en 1 min (prevención estricta de fuerza bruta)
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        status: 429,
        error: "Demasiados intentos de inicio de sesión. Intenta en 15 minutos.",
        bloqueado: true,
    },
});
// Solicitud de código: 10 solicitudes por IP en 1 hora
exports.forgotPasswordLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        status: 429,
        error: "Demasiadas solicitudes de recuperación. Intenta más tarde.",
    },
});
// Verificación de código: 15 intentos por IP en 15 min
exports.codeVerifyLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        status: 429,
        error: "Demasiados intentos de verificación. Intenta más tarde.",
    },
});
