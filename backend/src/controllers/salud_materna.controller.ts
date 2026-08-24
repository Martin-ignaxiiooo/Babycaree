import { Response } from "express";
import { query } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { cifrar, descifrarFilas } from "../utils/cifrado";

/** Puede ver el perfil. */
async function puedeVer(bebeId: string, usuarioId: string): Promise<boolean> {
  const r = await query(
    `SELECT b.id FROM perfiles_bebes b WHERE b.id = $1 AND b.usuario_id = $2
     UNION
     SELECT a.id_perfil_bebe FROM accesos_compartidos_bebe a
     WHERE a.id_perfil_bebe = $1 AND a.id_usuario_invitado = $2 AND a.estado = 'activo'`,
    [bebeId, usuarioId]
  );
  return r.rows.length > 0;
}

/** Puede modificar: excluye los accesos de solo lectura. */
async function puedeEditar(bebeId: string, usuarioId: string): Promise<boolean> {
  const r = await query(
    `SELECT b.id FROM perfiles_bebes b WHERE b.id = $1 AND b.usuario_id = $2
     UNION
     SELECT a.id_perfil_bebe FROM accesos_compartidos_bebe a
     WHERE a.id_perfil_bebe = $1 AND a.id_usuario_invitado = $2 AND a.estado = 'activo'
       AND a.nivel_permiso NOT IN ('solo_lectura', 'solo_lectura_galeria')`,
    [bebeId, usuarioId]
  );
  return r.rows.length > 0;
}

/**
 * GET /:bebeId/materna — peso, presión y síntomas de la gestante.
 *
 * Devuelve lo último de cada cosa más el historial reciente, que es lo que
 * necesita la pantalla de un viaje.
 */
export const getSaludMaterna = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;
    if (!(await puedeVer(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para ver este perfil" });
    }

    const [registros, sintomas, perfil] = await Promise.all([
      query(
        `SELECT id, fecha_registro, peso_kg, presion_sistolica, presion_diastolica, nota
         FROM salud_materna WHERE bebe_id = $1
         ORDER BY fecha_registro DESC, fecha_creacion DESC LIMIT 30`,
        [bebeId]
      ),
      query(
        `SELECT id, fecha_registro, sintoma, nota
         FROM sintomas_maternos WHERE bebe_id = $1
         ORDER BY fecha_registro DESC, fecha_creacion DESC LIMIT 20`,
        [bebeId]
      ),
      query(`SELECT peso_pregestacional_kg FROM perfiles_bebes WHERE id = $1`, [bebeId]),
    ]);

    const filas = registros.rows;
    const ultimoPeso = filas.find((r: any) => r.peso_kg != null) ?? null;
    const ultimaPresion = filas.find((r: any) => r.presion_sistolica != null) ?? null;
    const inicial = perfil.rows[0]?.peso_pregestacional_kg ?? null;

    res.json({
      peso_pregestacional_kg: inicial,
      // Cuánto lleva subido: es lo que se sigue en el embarazo, más que el
      // número absoluto. Null si falta alguno de los dos datos.
      subida_kg: ultimoPeso && inicial != null
        ? Number((Number(ultimoPeso.peso_kg) - Number(inicial)).toFixed(1))
        : null,
      ultimo_peso: ultimoPeso,
      ultima_presion: ultimaPresion,
      // Las notas van cifradas en la base, como el resto de lo clínico.
      registros: descifrarFilas(filas, ["nota"]),
      sintomas: descifrarFilas(sintomas.rows, ["nota"]),
    });
  } catch (error) {
    console.error("Error en getSaludMaterna:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/** POST /:bebeId/materna — registra peso y/o presión. */
export const createRegistroMaterno = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;
    if (!(await puedeEditar(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
    }

    const { peso_kg, presion_sistolica, presion_diastolica, nota, fecha_registro } = req.body ?? {};

    const peso = peso_kg == null || peso_kg === "" ? null : Number(peso_kg);
    const sis = presion_sistolica == null || presion_sistolica === "" ? null : Number(presion_sistolica);
    const dia = presion_diastolica == null || presion_diastolica === "" ? null : Number(presion_diastolica);

    if (peso == null && sis == null) {
      return res.status(400).json({ error: "Registra al menos el peso o la presión." });
    }
    if (peso != null && (Number.isNaN(peso) || peso <= 25 || peso >= 250)) {
      return res.status(400).json({ error: "El peso debe estar entre 25 y 250 kg." });
    }
    if ((sis == null) !== (dia == null)) {
      return res.status(400).json({ error: "Para la presión hacen falta las dos cifras." });
    }
    if (sis != null && (sis < 60 || sis > 260 || dia! < 30 || dia! > 180)) {
      return res.status(400).json({ error: "Esos valores de presión no parecen correctos." });
    }

    const r = await query(
      `INSERT INTO salud_materna
         (bebe_id, registrado_por, fecha_registro, peso_kg, presion_sistolica, presion_diastolica, nota)
       VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), $4, $5, $6, $7)
       RETURNING id, fecha_registro, peso_kg, presion_sistolica, presion_diastolica`,
      [bebeId, req.user.id, fecha_registro || null, peso, sis, dia, cifrar(nota?.trim() || null)]
    );

    res.status(201).json(r.rows[0]);
  } catch (error) {
    console.error("Error en createRegistroMaterno:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/** POST /:bebeId/materna/sintomas — registra los síntomas del día. */
export const createSintomas = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;
    if (!(await puedeEditar(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
    }

    const { sintomas, nota } = req.body ?? {};
    if (!Array.isArray(sintomas) || sintomas.length === 0) {
      return res.status(400).json({ error: "Elige al menos un síntoma." });
    }
    if (sintomas.length > 12) {
      return res.status(400).json({ error: "Demasiados síntomas en un registro." });
    }

    const notaCifrada = cifrar(nota?.trim() || null);
    for (const s of sintomas) {
      if (typeof s !== "string" || !s.trim()) continue;
      await query(
        `INSERT INTO sintomas_maternos (bebe_id, registrado_por, sintoma, nota)
         VALUES ($1, $2, $3, $4)`,
        [bebeId, req.user.id, s.trim().slice(0, 40), notaCifrada]
      );
    }

    res.status(201).json({ success: true, registrados: sintomas.length });
  } catch (error) {
    console.error("Error en createSintomas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/** PATCH /:bebeId/materna/peso-inicial — el peso previo al embarazo. */
export const setPesoInicial = async (req: AuthRequest, res: Response) => {
  try {
    const { bebeId } = req.params;
    if (!(await puedeEditar(bebeId, req.user.id))) {
      return res.status(403).json({ error: "No tienes permiso para modificar este perfil" });
    }
    const peso = Number(req.body?.peso_pregestacional_kg);
    if (Number.isNaN(peso) || peso <= 25 || peso >= 250) {
      return res.status(400).json({ error: "El peso debe estar entre 25 y 250 kg." });
    }
    await query(`UPDATE perfiles_bebes SET peso_pregestacional_kg = $1 WHERE id = $2`, [peso, bebeId]);
    res.json({ success: true, peso_pregestacional_kg: peso });
  } catch (error) {
    console.error("Error en setPesoInicial:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
