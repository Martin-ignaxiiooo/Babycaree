import { Request, Response } from "express";
import { query } from "../../config/db";
import { AdminAuthRequest } from "../../middlewares/adminAuth.middleware";

// Obtener estadísticas de la comunidad
export const getComunidadStats = async (req: Request, res: Response) => {
  try {
    const forosCount = await query("SELECT COUNT(*) FROM comunidad_foros WHERE estado = 'activo'");
    const comentariosCount = await query("SELECT COUNT(*) FROM comunidad_respuestas");
    
    res.json({
      total_foros: parseInt(forosCount.rows[0].count),
      total_comentarios: parseInt(comentariosCount.rows[0].count),
    });
  } catch (error) {
    console.error("Error fetching comunidad stats:", error);
    res.status(500).json({ error: "Error al obtener estadísticas de comunidad" });
  }
};

// Obtener todos los foros activos
export const getForos = async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        id, titulo, autor_nombre, categoria, fecha_creacion, estado,
        (SELECT COUNT(*)::int FROM comunidad_likes WHERE foro_id = cf.id) as likes,
        (SELECT COUNT(*)::int FROM comunidad_respuestas WHERE foro_id = cf.id) as respuestas
      FROM comunidad_foros cf
      ORDER BY fecha_creacion DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching foros:", error);
    res.status(500).json({ error: "Error al obtener foros" });
  }
};

// Obtener comentarios de un foro específico
export const getComentarios = async (req: Request, res: Response) => {
  try {
    const { foroId } = req.params;
    const result = await query(`
      SELECT id, foro_id, usuario_id, autor_nombre, contenido, fecha_creacion, es_admin
      FROM comunidad_respuestas
      WHERE foro_id = $1
      ORDER BY fecha_creacion ASC
    `, [foroId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching comentarios:", error);
    res.status(500).json({ error: "Error al obtener comentarios" });
  }
};

// Eliminar un comentario
export const deleteComentario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if it exists
    const check = await query("SELECT id FROM comunidad_respuestas WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Comentario no encontrado" });
    }

    await query("DELETE FROM comunidad_respuestas WHERE id = $1", [id]);
    res.json({ message: "Comentario eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting comentario:", error);
    res.status(500).json({ error: "Error al eliminar comentario" });
  }
};

// Crear comentario como administrador
export const createAdminComentario = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { foroId } = req.params;
    const { contenido } = req.body;
    
    // Check if foro exists
    const foroCheck = await query("SELECT id FROM comunidad_foros WHERE id = $1", [foroId]);
    if (foroCheck.rows.length === 0) {
      return res.status(404).json({ error: "Foro no encontrado" });
    }

    const adminName = req.admin?.nombre || req.admin?.nombre_completo || "Equipo BabyCare";
    const autorNombre = `[Admin] ${adminName}`;

    const result = await query(`
      INSERT INTO comunidad_respuestas (foro_id, usuario_id, autor_nombre, contenido, es_admin)
      VALUES ($1, NULL, $2, $3, TRUE)
      RETURNING *
    `, [foroId, autorNombre, contenido]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando comentario de administrador:", error);
    res.status(500).json({ error: "Error al crear comentario" });
  }
};
