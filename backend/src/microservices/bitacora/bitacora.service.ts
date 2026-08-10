import { Request, Response } from "express";
import { query } from "../../config/db";
import { AdminAuthRequest } from "../../middlewares/adminAuth.middleware";

export const getBitacora = async (req: AdminAuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT b.*, a.nombre_completo as admin_nombre 
      FROM bitacora_auditoria b
      LEFT JOIN administradores a ON b.id_admin = a.id
      ORDER BY b.fecha_hora_utc DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener bitacora" });
  }
};
