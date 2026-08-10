import { Request, Response } from "express";
import { query } from "../../config/db";
import { AdminAuthRequest } from "../../middlewares/adminAuth.middleware";
import { logAudit } from "../../controllers/admin.controller";

export const getVacunas = async (req: AdminAuthRequest, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM vacunas_calendario ORDER BY meses_edad ASC",
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener vacunas" });
  }
};

export const createVacuna = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { nombre, meses_edad, obligatoria, enfermedades_previene } = req.body;
    const result = await query(
      "INSERT INTO vacunas_calendario (nombre, meses_edad, obligatoria, enfermedades_previene) VALUES ($1, $2, $3, $4) RETURNING *",
      [nombre, meses_edad, obligatoria, enfermedades_previene],
    );
    const newRecord = result.rows[0];
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "CREATE",
      "vacunas_calendario",
      newRecord.id.toString(),
      null,
      newRecord,
      req.ip,
    );
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: "Error al crear vacuna" });
  }
};

export const updateVacuna = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, meses_edad, obligatoria, enfermedades_previene } = req.body;
    const old = await query("SELECT * FROM vacunas_calendario WHERE id = $1", [
      id,
    ]);

    if (old.rows.length === 0)
      return res.status(404).json({ error: "No encontrado" });

    const result = await query(
      "UPDATE vacunas_calendario SET nombre = $1, meses_edad = $2, obligatoria = $3, enfermedades_previene = $4 WHERE id = $5 RETURNING *",
      [nombre, meses_edad, obligatoria, enfermedades_previene, id],
    );

    const newRecord = result.rows[0];
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "UPDATE",
      "vacunas_calendario",
      id,
      old.rows[0],
      newRecord,
      req.ip,
    );
    res.json(newRecord);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar vacuna" });
  }
};

export const deleteVacuna = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const old = await query("SELECT * FROM vacunas_calendario WHERE id = $1", [
      id,
    ]);
    if (old.rows.length === 0)
      return res.status(404).json({ error: "No encontrado" });

    await query("DELETE FROM vacunas_calendario WHERE id = $1", [id]);
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "DELETE",
      "vacunas_calendario",
      id,
      old.rows[0],
      null,
      req.ip,
    );
    res.json({ message: "Vacuna eliminada correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al eliminar vacuna (puede estar en uso)" });
  }
};
