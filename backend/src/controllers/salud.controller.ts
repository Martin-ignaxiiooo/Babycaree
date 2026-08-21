import { Request, Response } from "express";
import { query } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";

// =======================
// VACUNAS
// =======================
export const getVacunas = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;
    
    // Verificamos que el bebé pertenezca al usuario o que tenga acceso
    // compartido activo (antes esto último no se revisaba: un familiar con
    // acceso concedido no podía ver las vacunas, solo el dueño de la cuenta).
    const accessCheck = await query(
      `SELECT b.id FROM perfiles_bebes b WHERE b.id = $1 AND b.usuario_id = $2
       UNION
       SELECT a.id_perfil_bebe FROM accesos_compartidos_bebe a
       WHERE a.id_perfil_bebe = $1 AND a.id_usuario_invitado = $2 AND a.estado = 'activo'`,
      [bebeId, req.user.id]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "No tienes permiso para ver este perfil" });
    }

    // Obtenemos todas las vacunas del PNI, cruzadas con los registros existentes del bebé
    const result = await query(`
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
  } catch (error) {
    console.error("Error en getVacunas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateVacuna = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId, vacunaId } = req.params;
    const { aplicada, fecha_aplicacion, notas, lugar_aplicacion } = req.body;

    const accessCheck = await query(
      `SELECT b.id FROM perfiles_bebes b WHERE b.id = $1 AND b.usuario_id = $2
       UNION
       SELECT a.id_perfil_bebe FROM accesos_compartidos_bebe a 
       WHERE a.id_perfil_bebe = $1 AND a.id_usuario_invitado = $2 AND a.estado = 'activo' 
       AND a.nivel_permiso NOT IN ('solo_lectura', 'solo_lectura_galeria')`,
      [bebeId, req.user.id]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
    }

    // Upsert (Insert si no existe, Update si ya existe)
    // En PostgreSQL podemos usar INSERT ... ON CONFLICT
    const result = await query(`
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
  } catch (error) {
    console.error("Error en updateVacuna:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


// =======================
// CONTROLES DE CRECIMIENTO
// =======================
export const getControles = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;
    
    const accessCheck = await query(
      `SELECT b.id FROM perfiles_bebes b WHERE b.id = $1 AND b.usuario_id = $2
       UNION
       SELECT a.id_perfil_bebe FROM accesos_compartidos_bebe a
       WHERE a.id_perfil_bebe = $1 AND a.id_usuario_invitado = $2 AND a.estado = 'activo'`,
      [bebeId, req.user.id]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "No tienes permiso para ver este perfil" });
    }

    const result = await query(`
      SELECT id, fecha_registro, peso_kg, talla_cm, notas, fecha_creacion
      FROM registros_crecimiento
      WHERE bebe_id = $1
      ORDER BY fecha_registro DESC, fecha_creacion DESC
    `, [bebeId]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error en getControles:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const createControl = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;
    const { fecha_registro, peso_kg, talla_cm, notas } = req.body;

    const accessCheck = await query(
      `SELECT b.id FROM perfiles_bebes b WHERE b.id = $1 AND b.usuario_id = $2
       UNION
       SELECT a.id_perfil_bebe FROM accesos_compartidos_bebe a 
       WHERE a.id_perfil_bebe = $1 AND a.id_usuario_invitado = $2 AND a.estado = 'activo' 
       AND a.nivel_permiso NOT IN ('solo_lectura', 'solo_lectura_galeria')`,
      [bebeId, req.user.id]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
    }

    if (!fecha_registro || peso_kg === undefined || talla_cm === undefined) {
      return res.status(400).json({ error: "Faltan datos obligatorios (fecha, peso o talla)" });
    }

    const result = await query(`
      INSERT INTO registros_crecimiento (bebe_id, fecha_registro, peso_kg, talla_cm, notas)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [bebeId, fecha_registro, peso_kg, talla_cm, notas || null]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error en createControl:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getCitas = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;
    
    const accessCheck = await query(
      `SELECT b.id FROM perfiles_bebes b WHERE b.id = $1 AND b.usuario_id = $2
       UNION
       SELECT a.id_perfil_bebe FROM accesos_compartidos_bebe a 
       WHERE a.id_perfil_bebe = $1 AND a.id_usuario_invitado = $2 AND a.estado = 'activo'`,
      [bebeId, req.user.id]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "No tienes permiso para ver este perfil" });
    }

    const result = await query(`
      SELECT id, especialidad, medico, lugar, fecha_cita, notas, estado, tipo,
             asistio, resultado_notas, fecha_seguimiento, fecha_creacion,
             peso_kg, talla_cm, diagnostico, indicaciones,
             (receta_foto IS NOT NULL) AS tiene_receta
      FROM citas_medicas
      WHERE bebe_id = $1
      ORDER BY fecha_cita DESC
    `, [bebeId]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error en getCitas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const createCita = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;
    const { fecha_cita, medico, lugar, notas, especialidad, tipo } = req.body;

    const accessCheck = await query(
      `SELECT b.id FROM perfiles_bebes b WHERE b.id = $1 AND b.usuario_id = $2
       UNION
       SELECT a.id_perfil_bebe FROM accesos_compartidos_bebe a 
       WHERE a.id_perfil_bebe = $1 AND a.id_usuario_invitado = $2 AND a.estado = 'activo' 
       AND a.nivel_permiso NOT IN ('solo_lectura', 'solo_lectura_galeria')`,
      [bebeId, req.user.id]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
    }

    if (!fecha_cita) {
      return res.status(400).json({ error: "Falta la fecha de la cita" });
    }

    // 'control' = control sano periódico; 'cita' = consulta puntual.
    // Se valida acá para devolver un mensaje claro en vez de un 500 del CHECK.
    const tipoCita = tipo ?? "cita";
    if (!["control", "cita"].includes(tipoCita)) {
      return res.status(400).json({ error: "Tipo inválido. Debe ser 'control' o 'cita'." });
    }

    const result = await query(`
      INSERT INTO citas_medicas (bebe_id, fecha_cita, medico, lugar, notas, especialidad, tipo, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'programada')
      RETURNING *
    `, [bebeId, fecha_cita, medico || null, lugar || null, notas || null, especialidad || null, tipoCita]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error en createCita:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * PATCH /:bebeId/citas/:citaId — registra cómo resultó la cita.
 * Es la contraparte del correo de seguimiento: la madre responde desde la app
 * con lo que le dijeron en la consulta (peso, talla, diagnóstico, receta).
 */
export const registrarResultadoCita = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId, citaId } = req.params;
    const {
      asistio, resultado_notas, estado,
      peso_kg, talla_cm, diagnostico, indicaciones, receta_foto,
      // Datos base de la cita: se editan acá para corregir lo que el
      // dictado por voz haya interpretado mal (hora, médico, lugar…),
      // sin tener que borrar y crear la cita de nuevo.
      fecha_cita, medico, lugar, especialidad, tipo, notas,
    } = req.body;

    if (tipo != null && !["control", "cita"].includes(tipo)) {
      return res.status(400).json({ error: "Tipo inválido. Debe ser 'control' o 'cita'." });
    }

    const accessCheck = await query(
      `SELECT b.id FROM perfiles_bebes b WHERE b.id = $1 AND b.usuario_id = $2
       UNION
       SELECT a.id_perfil_bebe FROM accesos_compartidos_bebe a
       WHERE a.id_perfil_bebe = $1 AND a.id_usuario_invitado = $2 AND a.estado = 'activo'
       AND a.nivel_permiso NOT IN ('solo_lectura', 'solo_lectura_galeria')`,
      [bebeId, req.user.id]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
    }

    if (estado != null && !["programada", "completada", "cancelada"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido." });
    }

    // Se validan los rangos acá para devolver un mensaje útil en vez de que
    // reviente el CHECK de Postgres con un 500.
    const peso = peso_kg == null || peso_kg === "" ? null : Number(peso_kg);
    if (peso != null && (Number.isNaN(peso) || peso <= 0 || peso >= 60)) {
      return res.status(400).json({ error: "El peso debe estar entre 0 y 60 kg." });
    }

    const talla = talla_cm == null || talla_cm === "" ? null : Number(talla_cm);
    if (talla != null && (Number.isNaN(talla) || talla <= 0 || talla >= 200)) {
      return res.status(400).json({ error: "La talla debe estar entre 0 y 200 cm." });
    }

    // La receta llega como data URI base64, igual que la foto de perfil: el
    // disco de Render es efímero y un archivo se perdería en cada redeploy.
    if (
      receta_foto != null && receta_foto !== "" &&
      !(
        typeof receta_foto === "string" &&
        /^data:image\/(jpeg|jpg|png|webp);base64,/.test(receta_foto) &&
        receta_foto.length <= 2_800_000
      )
    ) {
      return res.status(400).json({
        error: "La foto de la receta no es válida o pesa demasiado. Usa JPG o PNG.",
      });
    }

    // fecha_seguimiento marca "cuándo se respondió el seguimiento post-cita";
    // solo se toca si de verdad vino algún dato de resultado, no cuando el
    // usuario solo está corrigiendo la hora o el médico de una cita futura.
    const esResultado = [asistio, resultado_notas, peso, talla, diagnostico, indicaciones, receta_foto]
      .some((v) => v != null && v !== "");

    // Solo se tocan los campos que vinieron en el body: así la app puede
    // mandar únicamente "asistio" sin borrar notas escritas antes.
    const result = await query(`
      UPDATE citas_medicas
      SET asistio           = COALESCE($3, asistio),
          resultado_notas   = COALESCE($4, resultado_notas),
          estado            = COALESCE($5, estado),
          peso_kg           = COALESCE($6, peso_kg),
          talla_cm          = COALESCE($7, talla_cm),
          diagnostico       = COALESCE($8, diagnostico),
          indicaciones      = COALESCE($9, indicaciones),
          receta_foto       = COALESCE($10, receta_foto),
          fecha_cita        = COALESCE($11, fecha_cita),
          medico            = COALESCE($12, medico),
          lugar             = COALESCE($13, lugar),
          especialidad      = COALESCE($14, especialidad),
          tipo              = COALESCE($15, tipo),
          notas             = COALESCE($16, notas),
          fecha_seguimiento = CASE WHEN $17 THEN NOW() ELSE fecha_seguimiento END
      WHERE id = $1 AND bebe_id = $2
      RETURNING id, especialidad, medico, lugar, fecha_cita, notas, estado, tipo,
                asistio, resultado_notas, fecha_seguimiento, peso_kg, talla_cm,
                diagnostico, indicaciones, (receta_foto IS NOT NULL) AS tiene_receta
    `, [
      citaId, bebeId,
      asistio ?? null, resultado_notas ?? null, estado ?? null,
      peso, talla, diagnostico ?? null, indicaciones ?? null, receta_foto || null,
      fecha_cita || null, medico ?? null, lugar ?? null, especialidad ?? null,
      tipo ?? null, notas ?? null, esResultado,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    // Si informaron peso o talla, se registra también en la curva de
    // crecimiento: es el mismo dato y no tiene sentido pedírselo dos veces.
    if (peso != null || talla != null) {
      try {
        await query(
          `INSERT INTO registros_crecimiento (bebe_id, fecha_registro, peso_kg, talla_cm, notas)
           VALUES ($1, CURRENT_DATE, $2, $3, $4)`,
          [bebeId, peso, talla, "Registrado desde el resultado de una consulta"]
        );
      } catch (errCrecimiento) {
        // No es crítico: el resultado de la cita ya quedó guardado.
        console.error("No se pudo replicar en crecimiento:", errCrecimiento);
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en registrarResultadoCita:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/** GET /:bebeId/citas/:citaId/receta — la foto de la receta, aparte del listado. */
export const getRecetaFoto = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId, citaId } = req.params;

    const accessCheck = await query(
      `SELECT b.id FROM perfiles_bebes b WHERE b.id = $1 AND b.usuario_id = $2
       UNION
       SELECT a.id_perfil_bebe FROM accesos_compartidos_bebe a
       WHERE a.id_perfil_bebe = $1 AND a.id_usuario_invitado = $2 AND a.estado = 'activo'`,
      [bebeId, req.user.id]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "No tienes permiso para ver este perfil" });
    }

    const result = await query(
      `SELECT receta_foto FROM citas_medicas WHERE id = $1 AND bebe_id = $2`,
      [citaId, bebeId]
    );

    if (result.rows.length === 0 || !result.rows[0].receta_foto) {
      return res.status(404).json({ error: "Esta cita no tiene una receta guardada" });
    }

    res.json({ foto: result.rows[0].receta_foto });
  } catch (error) {
    console.error("Error en getRecetaFoto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
