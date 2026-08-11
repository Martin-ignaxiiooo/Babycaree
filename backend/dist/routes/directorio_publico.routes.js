"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../config/db");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect all public directory routes with normal user auth
router.use(auth_middleware_1.verifyToken);
router.get("/previsiones", async (req, res) => {
    try {
        const result = await (0, db_1.query)(`SELECT codigo, nombre_visible 
       FROM tipos_prevision 
       WHERE estado = 'activo'
       ORDER BY orden_visualizacion ASC`);
        res.json(result.rows);
    }
    catch (error) {
        console.error("Error fetching previsiones:", error);
        res.status(500).json({ error: "Error al obtener previsiones" });
    }
});
router.get("/medicos", async (req, res) => {
    try {
        const result = await (0, db_1.query)(`SELECT m.*, e.nombre_visible as especialidad_nombre, c.icono as centro_icono
       FROM medicos_directorio m
       LEFT JOIN especialidades_medicas e ON m.especialidad = e.codigo
       LEFT JOIN tipos_centro_atencion c ON m.id_tipo_centro = c.codigo
       WHERE m.estado_verificacion = 'verificado'
       ORDER BY m.calificacion_promedio DESC, m.fecha_creacion DESC`);
        res.json(result.rows);
    }
    catch (error) {
        console.error("Error fetching medicos:", error);
        res.status(500).json({ error: "Error al obtener médicos" });
    }
});
router.get("/especialidades", async (req, res) => {
    try {
        const result = await (0, db_1.query)("SELECT * FROM especialidades_medicas WHERE estado = 'activa' ORDER BY orden_visualizacion ASC");
        res.json(result.rows);
    }
    catch (error) {
        console.error("Error fetching especialidades:", error);
        res.status(500).json({ error: "Error al obtener especialidades" });
    }
});
exports.default = router;
