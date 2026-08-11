"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBitacora = void 0;
const db_1 = require("../../config/db");
const getBitacora = async (req, res) => {
    try {
        const result = await (0, db_1.query)(`
      SELECT b.*, a.nombre_completo as admin_nombre 
      FROM bitacora_auditoria b
      LEFT JOIN administradores a ON b.id_admin = a.id
      ORDER BY b.fecha_hora_utc DESC
      LIMIT 100
    `);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: "Error al obtener bitacora" });
    }
};
exports.getBitacora = getBitacora;
