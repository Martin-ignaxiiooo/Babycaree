"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditAction = void 0;
const admin_controller_1 = require("../controllers/admin.controller");
/**
 * Middleware para registrar automáticamente en la bitácora de auditoría
 * las acciones (POST, PUT, DELETE) realizadas por administradores.
 */
const auditAction = (tablaAfectada) => {
    return async (req, res, next) => {
        // Interceptar la respuesta para saber si fue exitosa (ej. 200 o 201)
        const originalSend = res.json;
        res.json = function (body) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Solo auditar acciones exitosas
                let accion = "UNKNOWN";
                if (req.method === "POST")
                    accion = "CREATE";
                if (req.method === "PUT" || req.method === "PATCH")
                    accion = "UPDATE";
                if (req.method === "DELETE")
                    accion = "DELETE";
                // Intentar obtener el ID del registro afectado (puede venir en params o body)
                const idRegistro = req.params.id || body?.id || "N/A";
                // Disparamos la función asíncrona sin bloquear el response
                if (req.admin) {
                    (0, admin_controller_1.logAudit)(req.admin.id, req.admin.rol, accion, tablaAfectada, idRegistro, null, // valor anterior (sería ideal pasarlo pero req no lo tiene por defecto)
                    body, // valor nuevo
                    req.ip || "unknown").catch(err => console.error("Fallo de auditoría asíncrona:", err));
                }
            }
            return originalSend.call(this, body);
        };
        next();
    };
};
exports.auditAction = auditAction;
