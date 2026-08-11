import { Request, Response } from "express";
import { query } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";
import bcrypt from "bcrypt";

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const result = await query(
      "SELECT id, email, nombre, apellidos, rol, consentimiento_ley_19628, consentimiento_ley_21719 FROM usuarios WHERE id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { nombre, apellidos } = req.body;
    
    const result = await query(
      "UPDATE usuarios SET nombre = $1, apellidos = $2 WHERE id = $3 RETURNING id, email, nombre, apellidos, rol, consentimiento_ley_19628, consentimiento_ley_21719",
      [nombre, apellidos, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error in updateMe:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const userRes = await query("SELECT password_hash FROM usuarios WHERE id = $1", [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const validPassword = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: "La contraseña actual es incorrecta" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await query("UPDATE usuarios SET password_hash = $1 WHERE id = $2", [passwordHash, userId]);

    res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Error in updatePassword:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const createBabyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const {
      nombre,
      fecha_nacimiento,
      sexo,
      es_prematuro,
      semanas_gestacion,
      estado,
      fecha_estimada_parto,
      prevision_salud,
      peso_nacimiento_g,
      talla_nacimiento_cm,
    } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    if (estado === "nacido" && !fecha_nacimiento) {
      return res
        .status(400)
        .json({
          error: "La fecha de nacimiento es obligatoria para un bebé nacido",
        });
    }

    if (estado === "nacido" && fecha_nacimiento && new Date(fecha_nacimiento) > new Date()) {
      return res
        .status(400)
        .json({
          error: "La fecha de nacimiento no puede ser futura",
        });
    }

    if (estado === "embarazo" && !fecha_estimada_parto) {
      return res
        .status(400)
        .json({
          error:
            "La fecha estimada de parto (FUR) es obligatoria para registrar un embarazo",
        });
    }

    if (es_prematuro && !semanas_gestacion) {
      return res
        .status(400)
        .json({
          error:
            "Las semanas de gestación son obligatorias para bebés prematuros",
        });
    }

    const result = await query(
      "INSERT INTO perfiles_bebes (usuario_id, nombre, fecha_nacimiento, sexo, semanas_gestacion_nac, estado, fecha_estimada_parto, prevision_salud, peso_nacimiento_g, talla_nacimiento_cm) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
      [
        userId,
        nombre,
        fecha_nacimiento || null,
        sexo,
        semanas_gestacion || null,
        estado || "nacido",
        fecha_estimada_parto || null,
        prevision_salud || null,
        peso_nacimiento_g || null,
        talla_nacimiento_cm || null,
      ],
    );

    const baby = result.rows[0];

    // Si se proporcionó peso o talla al nacer, crear automáticamente el primer registro de crecimiento
    if (peso_nacimiento_g || talla_nacimiento_cm) {
      const peso_kg = peso_nacimiento_g ? (peso_nacimiento_g / 1000) : null;
      await query(
        "INSERT INTO registros_crecimiento (bebe_id, fecha_registro, peso_kg, talla_cm, notas) VALUES ($1, $2, $3, $4, $5)",
        [baby.id, baby.fecha_nacimiento, peso_kg, talla_nacimiento_cm || null, "Medidas al nacer"]
      );
    }

    res.status(201).json(baby);
  } catch (error) {
    console.error("Error in createBabyProfile:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getMyBabies = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT pb.* 
       FROM perfiles_bebes pb 
       LEFT JOIN accesos_compartidos_bebe acb ON acb.id_perfil_bebe = pb.id AND acb.estado = 'activo'
       WHERE pb.usuario_id = $1 OR acb.id_usuario_invitado = $1 
       GROUP BY pb.id
       ORDER BY pb.fecha_creacion DESC`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error in getMyBabies:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getPublicBabyProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Obtener datos del bebé
    const babyRes = await query(
      "SELECT id, nombre, fecha_nacimiento, sexo, es_prematuro, semanas_gestacion FROM perfiles_bebes WHERE id = $1",
      [id],
    );

    if (babyRes.rows.length === 0) {
      return res.status(404).json({ error: "Perfil de bebé no encontrado" });
    }

    const baby = babyRes.rows[0];

    // Obtener calendario de vacunas
    const vacunasRes = await query(
      `
      SELECT vp.id as vacuna_id, vp.nombre, vp.enfermedades_previene, vp.meses_edad_recomendada,
             rv.aplicada, rv.fecha_aplicacion, rv.lugar_aplicacion 
      FROM vacunas_pni vp
      LEFT JOIN registro_vacunas rv ON vp.id = rv.vacuna_id AND rv.bebe_id = $1
      ORDER BY vp.meses_edad_recomendada ASC, vp.id ASC
    `,
      [id],
    );

    res.json({
      baby,
      vacunas: vacunasRes.rows,
    });
  } catch (error) {
    console.error("Error in getPublicBabyProfile:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deleteBabyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      "DELETE FROM perfiles_bebes WHERE id = $1 AND usuario_id = $2 RETURNING id",
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Perfil de bebé no encontrado o no tienes permiso para eliminarlo" });
    }

    res.json({ message: "Perfil eliminado correctamente" });
  } catch (error) {
    console.error("Error in deleteBabyProfile:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
