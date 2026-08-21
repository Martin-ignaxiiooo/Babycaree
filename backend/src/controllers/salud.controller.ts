import { Request, Response } from "express";
import { query } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { procesarNotaDeVoz, transcripcionDisponible } from "../services/transcripcionCita.service";

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
             asistio, resultado_notas, fecha_seguimiento, fecha_creacion
      FROM citas_medicas
      WHERE bebe_id = $1
      ORDER BY fecha_cita ASC
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
 * Es la contraparte del correo de seguimiento: la madre responde desde la app.
 */
export const registrarResultadoCita = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId, citaId } = req.params;
    const { asistio, resultado_notas, estado } = req.body;

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

    // Solo se tocan los campos que vinieron en el body: así la app puede
    // mandar únicamente "asistio" sin borrar notas escritas antes.
    const result = await query(`
      UPDATE citas_medicas
      SET asistio           = COALESCE($3, asistio),
          resultado_notas   = COALESCE($4, resultado_notas),
          estado            = COALESCE($5, estado),
          fecha_seguimiento = NOW()
      WHERE id = $1 AND bebe_id = $2
      RETURNING *
    `, [citaId, bebeId, asistio ?? null, resultado_notas ?? null, estado ?? null]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en registrarResultadoCita:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// =======================
// AGENDAR POR VOZ
// =======================

/**
 * POST /:bebeId/citas/transcribir — recibe una nota de voz y devuelve los
 * campos de la cita ya extraídos, para que la app prellene el formulario.
 *
 * No crea la cita: el usuario siempre revisa y confirma antes de guardar.
 * Eso evita que un error de transcripción agende algo equivocado.
 */
export const transcribirNotaDeVoz = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;

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

    if (!transcripcionDisponible()) {
      return res.status(503).json({
        error: "El registro por voz no está disponible en este momento.",
      });
    }

    const archivo = (req as any).file;
    if (!archivo?.buffer) {
      return res.status(400).json({ error: "No se recibió ningún audio." });
    }

    const resultado = await procesarNotaDeVoz(archivo.buffer, archivo.mimetype);

    if (!resultado.transcripcion) {
      return res.status(422).json({
        error: "No se entendió el audio. Intenta grabar de nuevo en un lugar más silencioso.",
      });
    }

    res.json(resultado);
  } catch (error) {
    console.error("Error en transcribirNotaDeVoz:", error);
    res.status(500).json({ error: "No pudimos procesar el audio. Intenta de nuevo." });
  }
};
