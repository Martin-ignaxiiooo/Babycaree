import { Response } from "express";
import { query } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { cifrar, descifrar, descifrarCampos, descifrarFilas } from "../utils/cifrado";

/** Puede ver el perfil (dueño o acceso compartido activo). */
async function puedeVer(bebeId: string, usuarioId: string): Promise<boolean> {
  const res = await query(
    `SELECT b.id FROM perfiles_bebes b WHERE b.id = $1 AND b.usuario_id = $2
     UNION
     SELECT a.id_perfil_bebe FROM accesos_compartidos_bebe a
     WHERE a.id_perfil_bebe = $1 AND a.id_usuario_invitado = $2 AND a.estado = 'activo'`,
    [bebeId, usuarioId]
  );
  return res.rows.length > 0;
}

/** Puede modificar (excluye los accesos de solo lectura). */
async function puedeEditar(bebeId: string, usuarioId: string): Promise<boolean> {
  const res = await query(
    `SELECT b.id FROM perfiles_bebes b WHERE b.id = $1 AND b.usuario_id = $2
     UNION
     SELECT a.id_perfil_bebe FROM accesos_compartidos_bebe a
     WHERE a.id_perfil_bebe = $1 AND a.id_usuario_invitado = $2 AND a.estado = 'activo'
     AND a.nivel_permiso NOT IN ('solo_lectura', 'solo_lectura_galeria')`,
    [bebeId, usuarioId]
  );
  return res.rows.length > 0;
}

/**
 * Las fotos llegan como data URI base64. Se valida el prefijo y el tamaño
 * para que nadie meta un string arbitrario ni un archivo enorme en una
 * columna de texto.
 */
const MAX_FOTO_CHARS = 2_800_000; // ~2MB de imagen ya codificada en base64

function fotoValida(valor: unknown): valor is string {
  return (
    typeof valor === "string" &&
    /^data:image\/(jpeg|jpg|png|webp);base64,/.test(valor) &&
    valor.length <= MAX_FOTO_CHARS
  );
}

// ─────────────────────────────────────────────────────────────────────────
// GET /:bebeId/examenes
// ─────────────────────────────────────────────────────────────────────────
export const getExamenes = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;
    if (!(await puedeVer(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para ver este perfil" });
    }

    // Las fotos no se mandan en el listado: son pesadas y solo se necesitan
    // al abrir un examen puntual. Se devuelve un booleano en su lugar.
    const result = await query(
      `SELECT e.id, e.cita_id, e.nombre, e.indicaciones, e.fecha_indicacion,
              e.fecha_sugerida, e.fecha_realizacion, e.estado, e.resultado_notas,
              (e.resultado_foto IS NOT NULL) AS tiene_resultado_foto,
              (e.orden_foto IS NOT NULL) AS tiene_orden_foto,
              e.fecha_creacion,
              c.especialidad AS cita_especialidad, c.fecha_cita AS cita_fecha
       FROM examenes_medicos e
       LEFT JOIN citas_medicas c ON c.id = e.cita_id
       WHERE e.bebe_id = $1
       ORDER BY
         CASE e.estado WHEN 'pendiente' THEN 0 WHEN 'realizado' THEN 1 ELSE 2 END,
         COALESCE(e.fecha_sugerida, e.fecha_indicacion) ASC`,
      [bebeId]
    );

    // Los campos clínicos vienen cifrados de la base (ver utils/cifrado.ts).
    res.json(descifrarFilas(result.rows, ["indicaciones", "resultado_notas"]));
  } catch (error) {
    console.error("Error en getExamenes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// GET /:bebeId/examenes/:examenId/foto — la imagen del resultado, aparte
// ─────────────────────────────────────────────────────────────────────────
export const getExamenFoto = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId, examenId } = req.params;
    if (!(await puedeVer(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para ver este perfil" });
    }

    const result = await query(
      `SELECT resultado_foto FROM examenes_medicos WHERE id = $1 AND bebe_id = $2`,
      [examenId, bebeId]
    );

    if (result.rows.length === 0 || !result.rows[0].resultado_foto) {
      return res.status(404).json({ error: "Este examen no tiene una foto guardada" });
    }

    res.json({ foto: descifrar(result.rows[0].resultado_foto) });
  } catch (error) {
    console.error("Error en getExamenFoto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/** GET /:bebeId/examenes/:examenId/orden-foto — la foto de la orden/indicación, aparte del listado. */
export const getExamenOrdenFoto = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId, examenId } = req.params;
    if (!(await puedeVer(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para ver este perfil" });
    }

    const result = await query(
      `SELECT orden_foto FROM examenes_medicos WHERE id = $1 AND bebe_id = $2`,
      [examenId, bebeId]
    );

    if (result.rows.length === 0 || !result.rows[0].orden_foto) {
      return res.status(404).json({ error: "Este examen no tiene una foto de la orden guardada" });
    }

    res.json({ foto: descifrar(result.rows[0].orden_foto) });
  } catch (error) {
    console.error("Error en getExamenOrdenFoto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// POST /:bebeId/examenes
// ─────────────────────────────────────────────────────────────────────────
export const createExamen = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;
    if (!(await puedeEditar(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
    }

    const { nombre, indicaciones, fecha_sugerida, cita_id, orden_foto } = req.body;

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return res.status(400).json({ error: "Falta el nombre del examen" });
    }
    if (nombre.length > 150) {
      return res.status(400).json({ error: "El nombre del examen es demasiado largo" });
    }
    if (orden_foto != null && orden_foto !== "" && !fotoValida(orden_foto)) {
      return res.status(400).json({
        error: "La imagen no es válida o pesa demasiado. Usa una foto JPG o PNG.",
      });
    }

    const result = await query(
      `INSERT INTO examenes_medicos
         (bebe_id, cita_id, nombre, indicaciones, fecha_sugerida, registrado_por, orden_foto)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, cita_id, nombre, indicaciones, fecha_indicacion,
                 fecha_sugerida, fecha_realizacion, estado, resultado_notas,
                 FALSE AS tiene_resultado_foto, (orden_foto IS NOT NULL) AS tiene_orden_foto,
                 fecha_creacion`,
      [
        bebeId,
        cita_id || null,
        nombre.trim(),
        cifrar(indicaciones?.trim() || null),
        fecha_sugerida || null,
        req.user.id,
        cifrar(orden_foto || null),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error en createExamen:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// PATCH /:bebeId/examenes/:examenId — marcar como realizado, subir resultado
// ─────────────────────────────────────────────────────────────────────────
export const updateExamen = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId, examenId } = req.params;
    if (!(await puedeEditar(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
    }

    const { estado, fecha_realizacion, resultado_notas, resultado_foto, fecha_sugerida } = req.body;

    if (estado != null && !["pendiente", "realizado", "omitido"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido." });
    }

    if (resultado_foto != null && resultado_foto !== "" && !fotoValida(resultado_foto)) {
      return res.status(400).json({
        error: "La imagen no es válida o pesa demasiado. Usa una foto JPG o PNG.",
      });
    }

    // Si se marca como realizado y no vino la fecha, se asume hoy: es lo que
    // pasa en la práctica (se registra el mismo día que se lo hicieron).
    const fechaFinal =
      fecha_realizacion ?? (estado === "realizado" ? new Date().toISOString().slice(0, 10) : null);

    const result = await query(
      `UPDATE examenes_medicos
       SET estado            = COALESCE($3, estado),
           fecha_realizacion = COALESCE($4, fecha_realizacion),
           resultado_notas   = COALESCE($5, resultado_notas),
           resultado_foto    = COALESCE($6, resultado_foto),
           fecha_sugerida    = COALESCE($7, fecha_sugerida)
       WHERE id = $1 AND bebe_id = $2
       RETURNING id, cita_id, nombre, indicaciones, fecha_indicacion,
                 fecha_sugerida, fecha_realizacion, estado, resultado_notas,
                 (resultado_foto IS NOT NULL) AS tiene_resultado_foto, fecha_creacion`,
      [
        examenId,
        bebeId,
        estado ?? null,
        fechaFinal,
        cifrar(resultado_notas ?? null),
        cifrar(resultado_foto || null),
        fecha_sugerida ?? null,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Examen no encontrado" });
    }

    res.json(descifrarCampos(result.rows[0], ["indicaciones", "resultado_notas"]));
  } catch (error) {
    console.error("Error en updateExamen:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// DELETE /:bebeId/examenes/:examenId
// ─────────────────────────────────────────────────────────────────────────
export const deleteExamen = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId, examenId } = req.params;
    if (!(await puedeEditar(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
    }

    const result = await query(
      `DELETE FROM examenes_medicos WHERE id = $1 AND bebe_id = $2 RETURNING id`,
      [examenId, bebeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Examen no encontrado" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error en deleteExamen:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
