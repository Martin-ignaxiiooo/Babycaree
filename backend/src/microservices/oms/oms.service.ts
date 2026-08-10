import { Request, Response } from "express";
import { query } from "../../config/db";
import { AdminAuthRequest } from "../../middlewares/adminAuth.middleware";
import { logAudit } from "../../controllers/admin.controller";

export const getOMSData = async (req: AdminAuthRequest, res: Response) => {
  try {
    const result = await query("SELECT * FROM oms_percentiles ORDER BY mes_vida ASC, sexo ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener datos de OMS" });
  }
};

export const createOMSData = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { mes_vida, sexo, peso_esperado_kg, talla_esperada_cm } = req.body;
    const result = await query(
      "INSERT INTO oms_percentiles (mes_vida, sexo, peso_esperado_kg, talla_esperada_cm) VALUES ($1, $2, $3, $4) RETURNING *",
      [mes_vida, sexo, peso_esperado_kg, talla_esperada_cm]
    );
    
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "CREATE",
      "oms_percentiles",
      result.rows[0].id,
      null,
      result.rows[0],
      req.ip
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: "Ya existe un registro para ese mes y sexo" });
    }
    res.status(500).json({ error: "Error al crear dato OMS" });
  }
};

export const updateOMSData = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { mes_vida, sexo, peso_esperado_kg, talla_esperada_cm } = req.body;
    const result = await query(
      "UPDATE oms_percentiles SET mes_vida = $1, sexo = $2, peso_esperado_kg = $3, talla_esperada_cm = $4 WHERE id = $5 RETURNING *",
      [mes_vida, sexo, peso_esperado_kg, talla_esperada_cm, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    await logAudit(
      req.admin.id,
      req.admin.rol,
      "UPDATE",
      "oms_percentiles",
      id,
      null,
      result.rows[0],
      req.ip
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: "Ya existe un registro para ese mes y sexo" });
    }
    res.status(500).json({ error: "Error al actualizar dato OMS" });
  }
};

export const deleteOMSData = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM oms_percentiles WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    await logAudit(
      req.admin.id,
      req.admin.rol,
      "DELETE",
      "oms_percentiles",
      id,
      result.rows[0],
      null,
      req.ip
    );

    res.json({ message: "Registro eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar dato OMS" });
  }
};

export const getOMSStats = async (req: AdminAuthRequest, res: Response) => {
  try {
    const totalRes = await query("SELECT COUNT(*) FROM oms_percentiles");
    const maxMesRes = await query("SELECT MAX(mes_vida) as max_mes FROM oms_percentiles");
    
    res.json({
      registrosTotales: parseInt(totalRes.rows[0].count) || 0,
      mesMaximo: parseInt(maxMesRes.rows[0].max_mes) || 0,
      // Just some hardcoded placeholders for UI since we only track one thing essentially
      fuente: "OMS 2006",
      actualizacion: "Al día"
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estadisticas OMS" });
  }
};
