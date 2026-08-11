"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const db_1 = require("../../config/db");
const getDashboardStats = async (req, res) => {
    try {
        const usuariosRes = await (0, db_1.query)("SELECT COUNT(*) FROM usuarios");
        const bebesRes = await (0, db_1.query)("SELECT COUNT(*) FROM perfiles_bebes");
        const articulosRes = await (0, db_1.query)("SELECT COUNT(*) FROM articulos_educativos");
        const medicosRes = await (0, db_1.query)("SELECT COUNT(*) FROM medicos_directorio");
        res.json({
            usuarios: parseInt(usuariosRes.rows[0].count),
            bebes: parseInt(bebesRes.rows[0].count),
            articulos: parseInt(articulosRes.rows[0].count),
            medicos: parseInt(medicosRes.rows[0].count),
        });
    }
    catch (error) {
        res.status(500).json({ error: "Error al obtener estadisticas" });
    }
};
exports.getDashboardStats = getDashboardStats;
