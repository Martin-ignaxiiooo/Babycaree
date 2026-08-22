import { Response } from "express";
import { query } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";

/**
 * Verifica que el usuario sea dueño del bebé o tenga acceso compartido activo.
 * Devuelve true si puede acceder. Mismo criterio que usa salud.controller.
 */
async function tieneAcceso(bebeId: string, usuarioId: string): Promise<boolean> {
  const accessCheck = await query(
    `SELECT b.id FROM perfiles_bebes b WHERE b.id = $1 AND b.usuario_id = $2
     UNION
     SELECT a.id_perfil_bebe FROM accesos_compartidos_bebe a
     WHERE a.id_perfil_bebe = $1 AND a.id_usuario_invitado = $2 AND a.estado = 'activo'`,
    [bebeId, usuarioId]
  );
  return accessCheck.rows.length > 0;
}

// ─────────────────────────────────────────────────────────────────────────
// GET /:bebeId/registros — línea de tiempo de eventos
// ─────────────────────────────────────────────────────────────────────────
export const getRegistros = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;

    if (!(await tieneAcceso(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para ver este perfil" });
    }

    // `limit` acotado para que un cliente no pueda pedir la tabla entera.
    const limitRaw = parseInt(String(req.query.limit ?? "50"), 10);
    const limit = Number.isNaN(limitRaw) ? 50 : Math.min(Math.max(limitRaw, 1), 200);

    const result = await query(
      `SELECT r.id, r.tipo, r.fecha_hora, r.fuente, r.cantidad_ml, r.duracion_min,
              r.sueno_inicio, r.sueno_fin, r.panal_tipo, r.nota,
              u.nombre AS registrado_por_nombre
       FROM registros_diarios r
       LEFT JOIN usuarios u ON u.id = r.registrado_por
       WHERE r.bebe_id = $1
       ORDER BY r.fecha_hora DESC
       LIMIT $2`,
      [bebeId, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error en getRegistros:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// GET /:bebeId/registros/resumen — datos para la cabecera del dashboard
// ─────────────────────────────────────────────────────────────────────────
export const getResumenDia = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;

    if (!(await tieneAcceso(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para ver este perfil" });
    }

    // Totales del día en curso. Se calculan en SQL (no en JS) para no traer
    // todos los registros del día solo para sumarlos.
    const totalesRes = await query(
      `SELECT
         COUNT(*) FILTER (WHERE tipo = 'toma')                       AS tomas,
         COALESCE(SUM(cantidad_ml) FILTER (WHERE tipo = 'toma'), 0)  AS ml_total,
         COUNT(*) FILTER (WHERE tipo = 'panal')                      AS panales,
         COALESCE(SUM(
           EXTRACT(EPOCH FROM (sueno_fin - sueno_inicio)) / 60
         ) FILTER (WHERE tipo = 'sueno' AND sueno_fin IS NOT NULL), 0) AS sueno_min
       FROM registros_diarios
       WHERE bebe_id = $1 AND fecha_hora >= date_trunc('day', NOW())`,
      [bebeId]
    );

    // Último evento, para la tarjeta "Último Evento" del dashboard.
    const ultimoRes = await query(
      `SELECT id, tipo, fecha_hora, fuente, cantidad_ml, duracion_min,
              sueno_inicio, sueno_fin, panal_tipo, nota
       FROM registros_diarios
       WHERE bebe_id = $1
       ORDER BY fecha_hora DESC
       LIMIT 1`,
      [bebeId]
    );

    // Sueño en curso (si lo hay), para poder mostrar "durmiendo hace X".
    const suenoAbiertoRes = await query(
      `SELECT id, sueno_inicio
       FROM registros_diarios
       WHERE bebe_id = $1 AND tipo = 'sueno' AND sueno_fin IS NULL
       ORDER BY sueno_inicio DESC
       LIMIT 1`,
      [bebeId]
    );

    // Último sueño ya cerrado: permite decir "lleva X despierto".
    const ultimoSuenoRes = await query(
      `SELECT sueno_fin
       FROM registros_diarios
       WHERE bebe_id = $1 AND tipo = 'sueno' AND sueno_fin IS NOT NULL
       ORDER BY sueno_fin DESC
       LIMIT 1`,
      [bebeId]
    );

    const t = totalesRes.rows[0];

    res.json({
      hoy: {
        tomas: Number(t.tomas),
        ml_total: Number(t.ml_total),
        panales: Number(t.panales),
        sueno_min: Math.round(Number(t.sueno_min)),
      },
      ultimo_evento: ultimoRes.rows[0] ?? null,
      sueno_en_curso: suenoAbiertoRes.rows[0] ?? null,
      ultimo_sueno_fin: ultimoSuenoRes.rows[0]?.sueno_fin ?? null,
    });
  } catch (error) {
    console.error("Error en getResumenDia:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// POST /:bebeId/registros — crear un evento
// ─────────────────────────────────────────────────────────────────────────
export const createRegistro = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;

    if (!(await tieneAcceso(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
    }

    const { tipo, fecha_hora, fuente, cantidad_ml, duracion_min, panal_tipo, nota } = req.body;

    if (!["toma", "sueno", "panal"].includes(tipo)) {
      return res.status(400).json({ error: "Tipo inválido. Debe ser 'toma', 'sueno' o 'panal'." });
    }

    // Se valida acá y no solo con los CHECK de la base para poder devolver
    // mensajes útiles al usuario en vez de un error 500 de Postgres.
    if (tipo === "toma") {
      if (!["pecho_izq", "pecho_der", "biberon"].includes(fuente)) {
        return res.status(400).json({ error: "Fuente inválida para una toma." });
      }
      if (fuente === "biberon") {
        const ml = Number(cantidad_ml);
        if (!ml || ml <= 0 || ml > 500) {
          return res.status(400).json({ error: "La cantidad debe estar entre 1 y 500 ml." });
        }
      } else if (duracion_min != null) {
        const min = Number(duracion_min);
        if (min <= 0 || min > 240) {
          return res.status(400).json({ error: "La duración debe estar entre 1 y 240 minutos." });
        }
      }
    }

    if (tipo === "panal" && !["pis", "caca", "mixto"].includes(panal_tipo)) {
      return res.status(400).json({ error: "Tipo de pañal inválido." });
    }

    if (tipo === "sueno") {
      // Un solo sueño abierto a la vez: si ya hay uno en curso, registrar otro
      // dejaría dos contadores corriendo y el resumen del día quedaría mal.
      const abierto = await query(
        `SELECT id FROM registros_diarios
         WHERE bebe_id = $1 AND tipo = 'sueno' AND sueno_fin IS NULL`,
        [bebeId]
      );
      if (abierto.rows.length > 0) {
        return res.status(409).json({
          error: "Ya hay un sueño en curso. Ciérralo antes de registrar uno nuevo.",
          sueno_en_curso_id: abierto.rows[0].id,
        });
      }
    }

    const cuando = fecha_hora ? new Date(fecha_hora) : new Date();
    if (isNaN(cuando.getTime())) {
      return res.status(400).json({ error: "Fecha inválida." });
    }
    // No permitimos registrar en el futuro: siempre es algo que ya pasó.
    if (cuando.getTime() > Date.now() + 60_000) {
      return res.status(400).json({ error: "No se puede registrar un evento en el futuro." });
    }

    const result = await query(
      `INSERT INTO registros_diarios
         (bebe_id, registrado_por, tipo, fecha_hora, fuente, cantidad_ml,
          duracion_min, sueno_inicio, panal_tipo, nota)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        bebeId,
        req.user.id,
        tipo,
        cuando,
        tipo === "toma" ? fuente : null,
        tipo === "toma" && fuente === "biberon" ? Number(cantidad_ml) : null,
        tipo === "toma" && fuente !== "biberon" && duracion_min ? Number(duracion_min) : null,
        tipo === "sueno" ? cuando : null,
        tipo === "panal" ? panal_tipo : null,
        nota ? String(nota).slice(0, 300) : null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error en createRegistro:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// PATCH /:bebeId/registros/:registroId/despertar — cerrar un sueño en curso
// ─────────────────────────────────────────────────────────────────────────
export const cerrarSueno = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId, registroId } = req.params;

    if (!(await tieneAcceso(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
    }

    const fin = req.body?.sueno_fin ? new Date(req.body.sueno_fin) : new Date();
    if (isNaN(fin.getTime())) {
      return res.status(400).json({ error: "Fecha de fin inválida." });
    }

    const result = await query(
      `UPDATE registros_diarios
       SET sueno_fin = $1
       WHERE id = $2 AND bebe_id = $3 AND tipo = 'sueno' AND sueno_fin IS NULL
         AND $1 >= sueno_inicio
       RETURNING *`,
      [fin, registroId, bebeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "No se encontró un sueño en curso con ese id, o la hora de fin es anterior al inicio.",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en cerrarSueno:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// DELETE /:bebeId/registros/:registroId
// ─────────────────────────────────────────────────────────────────────────
export const deleteRegistro = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId, registroId } = req.params;

    if (!(await tieneAcceso(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
    }

    const result = await query(
      `DELETE FROM registros_diarios WHERE id = $1 AND bebe_id = $2 RETURNING id`,
      [registroId, bebeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error("Error en deleteRegistro:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
