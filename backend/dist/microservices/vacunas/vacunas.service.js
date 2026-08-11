"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVacuna = exports.updateVacuna = exports.createVacuna = exports.getVacunas = void 0;
const db_1 = require("../../config/db");
const admin_controller_1 = require("../../controllers/admin.controller");
const getVacunas = async (req, res) => {
    try {
        const result = await (0, db_1.query)("SELECT * FROM vacunas_calendario ORDER BY meses_edad ASC");
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: "Error al obtener vacunas" });
    }
};
exports.getVacunas = getVacunas;
const createVacuna = async (req, res) => {
    try {
        const { nombre, meses_edad, obligatoria, enfermedades_previene } = req.body;
        const result = await (0, db_1.query)("INSERT INTO vacunas_calendario (nombre, meses_edad, obligatoria, enfermedades_previene) VALUES ($1, $2, $3, $4) RETURNING *", [nombre, meses_edad, obligatoria, enfermedades_previene]);
        const newRecord = result.rows[0];
        await (0, admin_controller_1.logAudit)(req.admin.id, req.admin.rol, "CREATE", "vacunas_calendario", newRecord.id.toString(), null, newRecord, req.ip);
        res.status(201).json(newRecord);
    }
    catch (error) {
        res.status(500).json({ error: "Error al crear vacuna" });
    }
};
exports.createVacuna = createVacuna;
const updateVacuna = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, meses_edad, obligatoria, enfermedades_previene } = req.body;
        const old = await (0, db_1.query)("SELECT * FROM vacunas_calendario WHERE id = $1", [
            id,
        ]);
        if (old.rows.length === 0)
            return res.status(404).json({ error: "No encontrado" });
        const result = await (0, db_1.query)("UPDATE vacunas_calendario SET nombre = $1, meses_edad = $2, obligatoria = $3, enfermedades_previene = $4 WHERE id = $5 RETURNING *", [nombre, meses_edad, obligatoria, enfermedades_previene, id]);
        const newRecord = result.rows[0];
        await (0, admin_controller_1.logAudit)(req.admin.id, req.admin.rol, "UPDATE", "vacunas_calendario", id, old.rows[0], newRecord, req.ip);
        res.json(newRecord);
    }
    catch (error) {
        res.status(500).json({ error: "Error al actualizar vacuna" });
    }
};
exports.updateVacuna = updateVacuna;
const deleteVacuna = async (req, res) => {
    try {
        const { id } = req.params;
        const old = await (0, db_1.query)("SELECT * FROM vacunas_calendario WHERE id = $1", [
            id,
        ]);
        if (old.rows.length === 0)
            return res.status(404).json({ error: "No encontrado" });
        await (0, db_1.query)("DELETE FROM vacunas_calendario WHERE id = $1", [id]);
        await (0, admin_controller_1.logAudit)(req.admin.id, req.admin.rol, "DELETE", "vacunas_calendario", id, old.rows[0], null, req.ip);
        res.json({ message: "Vacuna eliminada correctamente" });
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Error al eliminar vacuna (puede estar en uso)" });
    }
};
exports.deleteVacuna = deleteVacuna;
