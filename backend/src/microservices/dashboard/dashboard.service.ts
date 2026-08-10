import { Request, Response } from "express";
import { query } from "../../config/db";
import { AdminAuthRequest } from "../../middlewares/adminAuth.middleware";

export const getDashboardStats = async (
  req: AdminAuthRequest,
  res: Response,
) => {
  try {
    const usuariosRes = await query("SELECT COUNT(*) FROM usuarios");
    const bebesRes = await query("SELECT COUNT(*) FROM perfiles_bebes");
    const articulosRes = await query(
      "SELECT COUNT(*) FROM articulos_educativos",
    );
    const medicosRes = await query("SELECT COUNT(*) FROM medicos_directorio");

    res.json({
      usuarios: parseInt(usuariosRes.rows[0].count),
      bebes: parseInt(bebesRes.rows[0].count),
      articulos: parseInt(articulosRes.rows[0].count),
      medicos: parseInt(medicosRes.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estadisticas" });
  }
};
