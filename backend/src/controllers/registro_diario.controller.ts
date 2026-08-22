import { Response } from "express";
import { query } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";

/**
 * Verifica que el usuario sea dueño del bebé o tenga acceso compartido activo.
 * Devuelve true si puede acceder. Mismo criterio que usa salud.controller.
 */
/** Puede VER el perfil: dueño, o invitado con acceso activo de cualquier nivel. */
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

/**
 * Puede MODIFICAR: excluye a los invitados de solo lectura.
 *
 * Antes el diario usaba tieneAcceso() también para crear y borrar, así que
 * un familiar invitado como 'solo_lectura' podía escribir en el diario. El
 * resto de los controladores (salud, exámenes, momentos) sí distinguían;
 * este quedó fuera.
 */
async function puedeEditar(bebeId: string, usuarioId: string): Promise<boolean> {
  const accessCheck = await query(
    `SELECT b.id FROM perfiles_bebes b WHERE b.id = $1 AND b.usuario_id = $2
     UNION
     SELECT a.id_perfil_bebe FROM accesos_compartidos_bebe a
     WHERE a.id_perfil_bebe = $1 AND a.id_usuario_invitado = $2 AND a.estado = 'activo'
       AND a.nivel_permiso NOT IN ('solo_lectura', 'solo_lectura_galeria')`,
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

    if (!(await puedeEditar(bebeId, req.user.id))) {
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

    if (!(await puedeEditar(bebeId, req.user.id))) {
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

    if (!(await puedeEditar(bebeId, req.user.id))) {
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

// ─────────────────────────────────────────────────────────────────────────
// GET /:bebeId/registros/estadisticas?dias=14
// ─────────────────────────────────────────────────────────────────────────
/**
 * Patrones del diario: lo que el papel no puede decirte.
 *
 * No devuelve datos crudos sino respuestas a lo que un padre realmente se
 * pregunta: ¿cuánto duerme?, ¿cada cuánto come?, ¿esto está cambiando?
 *
 * Todo se calcula en SQL para no traer semanas de registros y sumarlos en
 * JS. La ventana por defecto es de 14 días: suficiente para ver una
 * tendencia, corto para que refleje cómo está el bebé *ahora* y no hace
 * un mes (a esta edad cambian rápido).
 */
export const getEstadisticas = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;

    if (!(await tieneAcceso(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para ver este perfil" });
    }

    const dias = Math.min(Math.max(Number(req.query.dias) || 14, 3), 90);

    // ── Serie por día: alimenta los gráficos ────────────────────────────
    const porDiaRes = await query(
      `SELECT
         to_char(d.dia, 'YYYY-MM-DD')                                   AS dia,
         COUNT(r.id) FILTER (WHERE r.tipo = 'toma')                     AS tomas,
         COALESCE(SUM(r.cantidad_ml) FILTER (WHERE r.tipo = 'toma'), 0) AS ml,
         COUNT(r.id) FILTER (WHERE r.tipo = 'panal')                    AS panales,
         COALESCE(ROUND(SUM(
           EXTRACT(EPOCH FROM (r.sueno_fin - r.sueno_inicio)) / 60
         ) FILTER (WHERE r.tipo = 'sueno' AND r.sueno_fin IS NOT NULL)), 0) AS sueno_min
       FROM generate_series(
              date_trunc('day', NOW()) - ($2::int - 1) * INTERVAL '1 day',
              date_trunc('day', NOW()),
              INTERVAL '1 day'
            ) AS d(dia)
       LEFT JOIN registros_diarios r
         ON r.bebe_id = $1
        AND r.fecha_hora >= d.dia
        AND r.fecha_hora <  d.dia + INTERVAL '1 day'
       GROUP BY d.dia
       ORDER BY d.dia ASC`,
      [bebeId, dias]
    );

    // ── Intervalo entre tomas ───────────────────────────────────────────
    // Se mide con LAG (diferencia con la toma anterior). Se descartan
    // intervalos de más de 12 h: casi siempre significan que alguien se
    // olvidó de registrar, no que el bebé pasó medio día sin comer.
    const intervaloRes = await query(
      `SELECT ROUND(AVG(gap))::int AS promedio_min
       FROM (
         SELECT EXTRACT(EPOCH FROM (
                  fecha_hora - LAG(fecha_hora) OVER (ORDER BY fecha_hora)
                )) / 60 AS gap
         FROM registros_diarios
         WHERE bebe_id = $1 AND tipo = 'toma'
           AND fecha_hora >= NOW() - ($2::int || ' days')::interval
       ) t
       WHERE gap IS NOT NULL AND gap > 0 AND gap <= 720`,
      [bebeId, dias]
    );

    // ── Sueño: noche vs día ─────────────────────────────────────────────
    // Se considera nocturno lo que empieza entre las 19:00 y las 06:00.
    // Interesa el tramo más largo: "¿ya duerme corrido?" es la pregunta.
    const suenoRes = await query(
      `SELECT
         COALESCE(ROUND(AVG(dur) FILTER (WHERE es_noche)), 0)      AS promedio_noche_min,
         COALESCE(ROUND(AVG(dur) FILTER (WHERE NOT es_noche)), 0)  AS promedio_siesta_min,
         COALESCE(ROUND(MAX(dur)), 0)                              AS tramo_mas_largo_min,
         COUNT(*) FILTER (WHERE NOT es_noche)                      AS total_siestas
       FROM (
         SELECT
           EXTRACT(EPOCH FROM (sueno_fin - sueno_inicio)) / 60 AS dur,
           (EXTRACT(HOUR FROM sueno_inicio) >= 19
            OR EXTRACT(HOUR FROM sueno_inicio) < 6)            AS es_noche
         FROM registros_diarios
         WHERE bebe_id = $1 AND tipo = 'sueno' AND sueno_fin IS NOT NULL
           AND sueno_inicio >= NOW() - ($2::int || ' days')::interval
       ) s
       WHERE dur > 0`,
      [bebeId, dias]
    );

    // ── Tendencia: primera mitad del período vs segunda ─────────────────
    // Responde "¿esto está cambiando?" comparando ambas mitades, en vez de
    // mostrar un número suelto sin contexto.
    const tendenciaRes = await query(
      `SELECT
         COALESCE(AVG(tomas) FILTER (WHERE mitad = 'vieja'), 0)  AS tomas_antes,
         COALESCE(AVG(tomas) FILTER (WHERE mitad = 'nueva'), 0)  AS tomas_ahora,
         COALESCE(AVG(sueno) FILTER (WHERE mitad = 'vieja'), 0)  AS sueno_antes,
         COALESCE(AVG(sueno) FILTER (WHERE mitad = 'nueva'), 0)  AS sueno_ahora
       FROM (
         SELECT
           date_trunc('day', fecha_hora) AS dia,
           CASE WHEN fecha_hora >= NOW() - ($2::int / 2 || ' days')::interval
                THEN 'nueva' ELSE 'vieja' END AS mitad,
           COUNT(*) FILTER (WHERE tipo = 'toma') AS tomas,
           COALESCE(SUM(
             EXTRACT(EPOCH FROM (sueno_fin - sueno_inicio)) / 60
           ) FILTER (WHERE tipo = 'sueno' AND sueno_fin IS NOT NULL), 0) AS sueno
         FROM registros_diarios
         WHERE bebe_id = $1
           AND fecha_hora >= NOW() - ($2::int || ' days')::interval
         GROUP BY 1, 2
       ) d`,
      [bebeId, dias]
    );

    const s = suenoRes.rows[0] ?? {};
    const t = tendenciaRes.rows[0] ?? {};
    const porDia = porDiaRes.rows.map((r: any) => ({
      dia: r.dia,
      tomas: Number(r.tomas),
      ml: Number(r.ml),
      panales: Number(r.panales),
      sueno_min: Number(r.sueno_min),
    }));

    // Con muy pocos datos cualquier promedio engaña. Se avisa para que la
    // interfaz muestre "sigue registrando" en vez de conclusiones falsas.
    const diasConDatos = porDia.filter((d) => d.tomas > 0 || d.sueno_min > 0 || d.panales > 0).length;

    res.json({
      dias,
      dias_con_datos: diasConDatos,
      datos_suficientes: diasConDatos >= 3,
      por_dia: porDia,
      tomas: {
        intervalo_promedio_min: intervaloRes.rows[0]?.promedio_min ?? null,
      },
      sueno: {
        promedio_noche_min: Number(s.promedio_noche_min ?? 0),
        promedio_siesta_min: Number(s.promedio_siesta_min ?? 0),
        tramo_mas_largo_min: Number(s.tramo_mas_largo_min ?? 0),
        siestas_por_dia: diasConDatos > 0
          ? Number((Number(s.total_siestas ?? 0) / diasConDatos).toFixed(1))
          : 0,
      },
      tendencia: {
        tomas_antes: Number(Number(t.tomas_antes ?? 0).toFixed(1)),
        tomas_ahora: Number(Number(t.tomas_ahora ?? 0).toFixed(1)),
        sueno_antes_min: Math.round(Number(t.sueno_antes ?? 0)),
        sueno_ahora_min: Math.round(Number(t.sueno_ahora ?? 0)),
      },
    });
  } catch (error) {
    console.error("Error en getEstadisticas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
