import { Request, Response } from "express";
import { query } from "../../config/db";
import { AdminAuthRequest } from "../../middlewares/adminAuth.middleware";
import { logAudit } from "../../controllers/admin.controller";

// ==========================================
// PREVISIONES
// ==========================================
export const getPrevisiones = async (req: AdminAuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT t.*, COUNT(b.id) as usuarios_asociados 
       FROM tipos_prevision t 
       LEFT JOIN perfiles_bebes b ON t.codigo = b.prevision_salud 
       GROUP BY t.codigo
       ORDER BY t.orden_visualizacion ASC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener previsiones" });
  }
};

export const createPrevision = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { nombre_visible, tipo, orden_visualizacion } = req.body;
    let { codigo } = req.body;
    if (!codigo) codigo = `PREV-${Date.now().toString().slice(-6)}`;

    const result = await query(
      "INSERT INTO tipos_prevision (codigo, nombre_visible, tipo, orden_visualizacion) VALUES ($1, $2, $3, $4) RETURNING *",
      [codigo, nombre_visible, tipo, orden_visualizacion],
    );
    const newRecord = result.rows[0];
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "CREATE",
      "tipos_prevision",
      newRecord.codigo,
      null,
      newRecord,
      req.ip,
    );
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: "Error al crear prevision" });
  }
};

export const updatePrevision = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { codigo } = req.params;
    const { nombre_visible, tipo, orden_visualizacion } = req.body;

    const result = await query(
      "UPDATE tipos_prevision SET nombre_visible = $1, tipo = $2, orden_visualizacion = $3 WHERE codigo = $4 RETURNING *",
      [nombre_visible, tipo, orden_visualizacion, codigo],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Prevision no encontrada" });

    const updatedRecord = result.rows[0];
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "UPDATE",
      "tipos_prevision",
      codigo,
      null,
      updatedRecord,
      req.ip,
    );
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar prevision" });
  }
};

export const deletePrevision = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { codigo } = req.params;
    const result = await query(
      "DELETE FROM tipos_prevision WHERE codigo = $1 RETURNING *",
      [codigo],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Prevision no encontrada" });

    await logAudit(
      req.admin.id,
      req.admin.rol,
      "DELETE",
      "tipos_prevision",
      codigo,
      result.rows[0],
      null,
      req.ip,
    );
    res.json({ message: "Prevision eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar prevision" });
  }
};

// ==========================================
// ESPECIALIDADES
// ==========================================
export const getEspecialidades = async (
  req: AdminAuthRequest,
  res: Response,
) => {
  try {
    const result = await query(
      "SELECT * FROM especialidades_medicas ORDER BY orden_visualizacion ASC",
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener especialidades" });
  }
};

export const getEspecialidadesStats = async (
  req: AdminAuthRequest,
  res: Response,
) => {
  try {
    const espRes = await query("SELECT COUNT(*) FROM especialidades_medicas WHERE estado = 'activa'");
    const medRes = await query("SELECT COUNT(*) FROM medicos_directorio");
    const noMedRes = await query(`
      SELECT COUNT(*) FROM especialidades_medicas e 
      LEFT JOIN medicos_directorio m ON e.codigo = m.especialidad 
      WHERE m.id IS NULL AND e.estado = 'activa'
    `);
    const popRes = await query(`
      SELECT e.nombre_visible, COUNT(m.id) as total 
      FROM especialidades_medicas e 
      JOIN medicos_directorio m ON e.codigo = m.especialidad 
      GROUP BY e.nombre_visible 
      ORDER BY total DESC LIMIT 1
    `);

    res.json({
      activas: parseInt(espRes.rows[0].count) || 0,
      medicos: parseInt(medRes.rows[0].count) || 0,
      sinAsignar: parseInt(noMedRes.rows[0].count) || 0,
      masSolicitada: popRes.rows.length > 0 ? popRes.rows[0].nombre_visible : "Ninguna",
      masSolicitadaTotal: popRes.rows.length > 0 ? parseInt(popRes.rows[0].total) : 0
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estadisticas" });
  }
};

export const createEspecialidad = async (
  req: AdminAuthRequest,
  res: Response,
) => {
  try {
    const { nombre_visible, categoria, descripcion_breve, estado } = req.body;
    let { codigo, orden_visualizacion } = req.body;
    if (!codigo) codigo = `ESP-${Date.now().toString().slice(-6)}`;

    if (!orden_visualizacion) {
      const maxOrderResult = await query(
        "SELECT COALESCE(MAX(orden_visualizacion), 0) as max_order FROM especialidades_medicas",
      );
      orden_visualizacion = parseInt(maxOrderResult.rows[0].max_order) + 1;
    }

    // Capitalize each word so it doesn't matter how the user types it
    const titleCasedName = nombre_visible
      .toLowerCase()
      .split(" ")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const finalEstado = estado || "activa";

    const result = await query(
      "INSERT INTO especialidades_medicas (codigo, nombre_visible, categoria, descripcion_breve, orden_visualizacion, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        codigo,
        titleCasedName,
        categoria,
        descripcion_breve,
        orden_visualizacion,
        finalEstado,
      ],
    );
    const newRecord = result.rows[0];
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "CREATE",
      "especialidades_medicas",
      newRecord.codigo,
      null,
      newRecord,
      req.ip,
    );
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: "Error al crear especialidad" });
  }
};

export const updateEspecialidad = async (
  req: AdminAuthRequest,
  res: Response,
) => {
  try {
    const { codigo } = req.params;
    const { nombre_visible, categoria, descripcion_breve, estado } = req.body;

    const titleCasedName = nombre_visible
      .toLowerCase()
      .split(" ")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const result = await query(
      "UPDATE especialidades_medicas SET nombre_visible = $1, categoria = $2, descripcion_breve = $3, estado = $4 WHERE codigo = $5 RETURNING *",
      [titleCasedName, categoria, descripcion_breve, estado, codigo],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Especialidad no encontrada" });
    }

    const updatedRecord = result.rows[0];
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "UPDATE",
      "especialidades_medicas",
      codigo,
      null,
      updatedRecord,
      req.ip,
    );
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar especialidad" });
  }
};

export const deleteEspecialidad = async (
  req: AdminAuthRequest,
  res: Response,
) => {
  try {
    const { codigo } = req.params;

    // Opcional: Podrías verificar si hay médicos usando esta especialidad antes de eliminarla.
    // Para simplificar, la eliminaremos directamente (o fallará si hay llaves foráneas restrictivas).
    const result = await query(
      "DELETE FROM especialidades_medicas WHERE codigo = $1 RETURNING *",
      [codigo],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Especialidad no encontrada" });
    }

    const deletedRecord = result.rows[0];
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "DELETE",
      "especialidades_medicas",
      codigo,
      deletedRecord,
      null,
      req.ip,
    );
    res.json({ message: "Especialidad eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar especialidad" });
  }
};

// ==========================================
// CENTROS
// ==========================================
export const getCentros = async (req: AdminAuthRequest, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM tipos_centro_atencion ORDER BY nombre_visible ASC",
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener centros" });
  }
};

export const createCentro = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { nombre_visible, icono, requiere_convenio } = req.body;
    let { codigo } = req.body;
    if (!codigo) codigo = `CEN-${Date.now().toString().slice(-6)}`;

    const result = await query(
      "INSERT INTO tipos_centro_atencion (codigo, nombre_visible, icono, requiere_convenio) VALUES ($1, $2, $3, $4) RETURNING *",
      [codigo, nombre_visible, icono, requiere_convenio],
    );
    const newRecord = result.rows[0];
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "CREATE",
      "tipos_centro_atencion",
      newRecord.codigo,
      null,
      newRecord,
      req.ip,
    );
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: "Error al crear centro" });
  }
};

export const updateCentro = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { codigo } = req.params;
    const { nombre_visible, icono, requiere_convenio } = req.body;

    const result = await query(
      "UPDATE tipos_centro_atencion SET nombre_visible = $1, icono = $2, requiere_convenio = $3 WHERE codigo = $4 RETURNING *",
      [nombre_visible, icono, requiere_convenio, codigo],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Centro no encontrado" });

    const updatedRecord = result.rows[0];
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "UPDATE",
      "tipos_centro_atencion",
      codigo,
      null,
      updatedRecord,
      req.ip,
    );
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar centro" });
  }
};

export const deleteCentro = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { codigo } = req.params;
    const result = await query(
      "DELETE FROM tipos_centro_atencion WHERE codigo = $1 RETURNING *",
      [codigo],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Centro no encontrado" });

    await logAudit(
      req.admin.id,
      req.admin.rol,
      "DELETE",
      "tipos_centro_atencion",
      codigo,
      result.rows[0],
      null,
      req.ip,
    );
    res.json({ message: "Centro eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar centro" });
  }
};

// ==========================================
// MEDICOS
// ==========================================
export const getMedicos = async (req: AdminAuthRequest, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM medicos_directorio ORDER BY fecha_creacion DESC",
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener medicos" });
  }
};

export const createMedico = async (req: AdminAuthRequest, res: Response) => {
  try {
    const {
      nombre_completo,
      rut,
      especialidad,
      id_tipo_centro,
      nombre_centro,
      prevision_aceptada,
      telefono_contacto,
    } = req.body;
    const result = await query(
      "INSERT INTO medicos_directorio (nombre_completo, rut, especialidad, id_tipo_centro, nombre_centro, prevision_aceptada, telefono_contacto) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        nombre_completo,
        rut,
        especialidad,
        id_tipo_centro,
        nombre_centro,
        prevision_aceptada,
        telefono_contacto,
      ],
    );
    const newRecord = result.rows[0];
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "CREATE",
      "medicos_directorio",
      newRecord.id,
      null,
      newRecord,
      req.ip,
    );
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: "Error al crear medico" });
  }
};

export const updateMedico = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nombre_completo,
      rut,
      especialidad,
      id_tipo_centro,
      nombre_centro,
      prevision_aceptada,
      telefono_contacto,
    } = req.body;

    const result = await query(
      "UPDATE medicos_directorio SET nombre_completo = $1, rut = $2, especialidad = $3, id_tipo_centro = $4, nombre_centro = $5, prevision_aceptada = $6, telefono_contacto = $7 WHERE id = $8 RETURNING *",
      [
        nombre_completo,
        rut,
        especialidad,
        id_tipo_centro,
        nombre_centro,
        prevision_aceptada,
        telefono_contacto,
        id,
      ],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Médico no encontrado" });

    const updatedRecord = result.rows[0];
    await logAudit(
      req.admin.id,
      req.admin.rol,
      "UPDATE",
      "medicos_directorio",
      id,
      null,
      updatedRecord,
      req.ip,
    );
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar medico" });
  }
};

export const deleteMedico = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      "DELETE FROM medicos_directorio WHERE id = $1 RETURNING *",
      [id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Médico no encontrado" });

    await logAudit(
      req.admin.id,
      req.admin.rol,
      "DELETE",
      "medicos_directorio",
      id,
      result.rows[0],
      null,
      req.ip,
    );
    res.json({ message: "Médico eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar medico" });
  }
};
