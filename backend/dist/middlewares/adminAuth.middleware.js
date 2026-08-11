"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireRole = exports.verifyAdminToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || "supersecret_admin_key_fallback";
const verifyAdminToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ error: "No token provided or invalid format" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_ADMIN_SECRET);
        // Check if the session is still valid in DB
        const sessionRes = await (0, db_1.query)("SELECT valido FROM sesiones_admin WHERE token_jti = $1 AND id_admin = $2", [decoded.jti, decoded.id]);
        if (sessionRes.rows.length === 0 || !sessionRes.rows[0].valido) {
            return res
                .status(401)
                .json({ error: "Sesión administrativa inválida o expirada" });
        }
        req.admin = decoded;
        next();
    }
    catch (error) {
        return res
            .status(403)
            .json({ error: "Fallo al autenticar el token administrativo" });
    }
};
exports.verifyAdminToken = verifyAdminToken;
const requireRole = (rolesAllowed) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ error: "No autenticado" });
        }
        if (rolesAllowed.includes(req.admin.rol) ||
            req.admin.rol === "admin_general") {
            next();
        }
        else {
            return res
                .status(403)
                .json({ error: "No tienes permiso para realizar esta acción" });
        }
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = exports.verifyAdminToken;
