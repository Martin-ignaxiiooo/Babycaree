"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createControl = exports.getControles = exports.updateVacuna = exports.getVacunas = void 0;
const db_1 = require("../config/db");
// =======================
// VACUNAS
// =======================
const getVacunas = async (req, res) => {
    try {
        const { bebeId } = req.params;
        // Primero, verificamos que el bebé pertenezca al usuario (o tenga acceso)
        const accessCheck = await (0, db_1.query)("SELECT id FROM perfiles_bebes WHERE id = $1 AND usuario_id = $2", [bebeId, req.user.id]);
        if (accessCheck.rows.length === 0) {
            // TODO: También podríamos revisar tabla de accesos compartidos
            return res.status(403).json({ error: "No tienes permiso para ver este perfil" });
        }
        // Obtenemos todas las vacunas del PNI, cruzadas con los registros existentes del bebé
        const result = await (0, db_1.query)(`
      SELECT 
        v.id as vacuna_id,
        v.nombre,
        v.enfermedades_previene,
        v.meses_edad_recomendada,
        rv.id as registro_id,
        rv.fecha_aplicacion,
        rv.aplicada,
        rv.lugar_aplicacion,
        rv.notas
      FROM vacunas_pni v
      LEFT JOIN registro_vacunas rv ON v.id = rv.vacuna_id AND rv.bebe_id = $1
      ORDER BY v.meses_edad_recomendada ASC, v.id ASC
    `, [bebeId]);
        res.json(result.rows);
    }
    catch (error) {
        console.error("Error en getVacunas:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.getVacunas = getVacunas;
const updateVacuna = async (req, res) => {
    try {
        const { bebeId, vacunaId } = req.params;
        const { aplicada, fecha_aplicacion, notas, lugar_aplicacion } = req.body;
        const accessCheck = await (0, db_1.query)("SELECT id FROM perfiles_bebes WHERE id = $1 AND usuario_id = $2", [bebeId, req.user.id]);
        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
        }
        // Upsert (Insert si no existe, Update si ya existe)
        // En PostgreSQL podemos usar INSERT ... ON CONFLICT
        const result = await (0, db_1.query)(`
      INSERT INTO registro_vacunas (bebe_id, vacuna_id, aplicada, fecha_aplicacion, notas, lugar_aplicacion)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (bebe_id, vacuna_id) 
      DO UPDATE SET 
        aplicada = EXCLUDED.aplicada,
        fecha_aplicacion = EXCLUDED.fecha_aplicacion,
        notas = EXCLUDED.notas,
        lugar_aplicacion = EXCLUDED.lugar_aplicacion
      RETURNING *;
    `, [bebeId, vacunaId, aplicada, fecha_aplicacion || null, notas || null, lugar_aplicacion || null]);
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error("Error en updateVacuna:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.updateVacuna = updateVacuna;
// =======================
// CONTROLES DE CRECIMIENTO
// =======================
const getControles = async (req, res) => {
    try {
        const { bebeId } = req.params;
        const accessCheck = await (0, db_1.query)("SELECT id FROM perfiles_bebes WHERE id = $1 AND usuario_id = $2", [bebeId, req.user.id]);
        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: "No tienes permiso para ver este perfil" });
        }
        const result = await (0, db_1.query)(`
      SELECT id, fecha_registro, peso_kg, talla_cm, notas, fecha_creacion
      FROM registros_crecimiento
      WHERE bebe_id = $1
      ORDER BY fecha_registro DESC, fecha_creacion DESC
    `, [bebeId]);
        res.json(result.rows);
    }
    catch (error) {
        console.error("Error en getControles:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.getControles = getControles;
const createControl = async (req, res) => {
    try {
        const { bebeId } = req.params;
        const { fecha_registro, peso_kg, talla_cm, notas } = req.body;
        const accessCheck = await (0, db_1.query)("SELECT id FROM perfiles_bebes WHERE id = $1 AND usuario_id = $2", [bebeId, req.user.id]);
        if (accessCheck.rows.length === 0) {
            return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
        }
        if (!fecha_registro || peso_kg === undefined || talla_cm === undefined) {
            return res.status(400).json({ error: "Faltan datos obligatorios (fecha, peso o talla)" });
        }
        const result = await (0, db_1.query)(`
      INSERT INTO registros_crecimiento (bebe_id, fecha_registro, peso_kg, talla_cm, notas)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [bebeId, fecha_registro, peso_kg, talla_cm, notas || null]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error("Error en createControl:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.createControl = createControl;
