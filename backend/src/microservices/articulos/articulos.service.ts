import { Request, Response } from "express";
import { query } from "../../config/db";
import { AdminAuthRequest } from "../../middlewares/adminAuth.middleware";
import { logAudit } from "../../controllers/admin.controller";

export const getArticulos = async (req: AdminAuthRequest, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM articulos_educativos ORDER BY fecha_creacion DESC",
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener articulos" });
  }
};

export const getArticulosStats = async (req: AdminAuthRequest, res: Response) => {
  try {
    const pubRes = await query("SELECT COUNT(*) FROM articulos_educativos WHERE estado = 'publicado'");
    const borradorRes = await query("SELECT COUNT(*) FROM articulos_educativos WHERE estado = 'borrador'");
    const lecturasRes = await query("SELECT SUM(contador_lecturas) as total FROM articulos_educativos");
    const utilRes = await query("SELECT AVG(calificacion_utilidad) as prom FROM articulos_educativos");

    res.json({
      publicados: parseInt(pubRes.rows[0].count) || 0,
      borradores: parseInt(borradorRes.rows[0].count) || 0,
      lecturasTotales: parseInt(lecturasRes.rows[0].total) || 0,
      utilidadPromedio: parseFloat(utilRes.rows[0].prom)?.toFixed(1) || "0.0"
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estadisticas de articulos" });
  }
};

export const createArticulo = async (req: AdminAuthRequest, res: Response) => {
  try {
    const {
      titulo,
      categoria,
      rango_edad_meses,
      resumen,
      contenido_completo,
      fuente_citada,
    } = req.body;
    const result = await query(
      "INSERT INTO articulos_educativos (titulo, categoria, rango_edad_meses, resumen, contenido_completo, fuente_citada) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        titulo,
        categoria,
        rango_edad_meses,
        resumen,
        contenido_completo,
        fuente_citada,
      ],
    );
    const newRecord = result.rows[0];
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "CREATE",
      "articulos_educativos",
      newRecord.id,
      null,
      newRecord,
      req.ip,
    );
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: "Error al crear articulo" });
  }
};

export const updateArticulo = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      categoria,
      rango_edad_meses,
      resumen,
      contenido_completo,
      fuente_citada,
      estado,
    } = req.body;

    const result = await query(
      "UPDATE articulos_educativos SET titulo = $1, categoria = $2, rango_edad_meses = $3, resumen = $4, contenido_completo = $5, fuente_citada = $6, estado = $7 WHERE id = $8 RETURNING *",
      [
        titulo,
        categoria,
        rango_edad_meses,
        resumen,
        contenido_completo,
        fuente_citada,
        estado,
        id,
      ],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Artículo no encontrado" });

    const updatedRecord = result.rows[0];
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "UPDATE",
      "articulos_educativos",
      id,
      null,
      updatedRecord,
      req.ip,
    );
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar articulo" });
  }
};

export const deleteArticulo = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      "DELETE FROM articulos_educativos WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Artículo no encontrado" });

    await logAudit(
      req.admin.id,
      req.admin.rol,
      "DELETE",
      "articulos_educativos",
      id,
      result.rows[0],
      null,
      req.ip,
    );
    res.json({ message: "Artículo eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar articulo" });
  }
};
