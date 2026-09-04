import { Request, Response } from "express";
import { query } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";
import bcrypt from "bcrypt";
import { passwordCumpleRequisitos, PASSWORD_REQUISITOS_MSG } from "../utils/password";

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

    if (!newPassword) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    if (!passwordCumpleRequisitos(newPassword)) {
      return res.status(400).json({ error: PASSWORD_REQUISITOS_MSG });
    }

    const userRes = await query(
      "SELECT password_hash, password_definida FROM usuarios WHERE id = $1",
      [userId]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Las cuentas creadas con Google llevan un password_hash aleatorio que el
    // usuario nunca vio. Pedirles la "contraseña actual" las dejaba sin forma
    // de establecer una: por eso, si todavía no definieron ninguna, se les
    // permite hacerlo directamente. Ya están autenticadas con su token.
    const yaTienePassword = userRes.rows[0].password_definida !== false;

    if (yaTienePassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Debes ingresar tu contraseña actual" });
      }
      const validPassword = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
      if (!validPassword) {
        return res.status(400).json({ error: "La contraseña actual es incorrecta" });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    // Se limpian los intentos fallidos y el bloqueo, igual que hace el flujo
    // de recuperación: si el usuario acaba de elegir contraseña, no tiene
    // sentido dejarlo bloqueado por intentos viejos.
    await query(
      `UPDATE usuarios
       SET password_hash = $1, password_definida = TRUE,
           intentos_login_fallidos = 0, bloqueado_hasta = NULL
       WHERE id = $2`,
      [passwordHash, userId]
    );

    res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Error in updatePassword:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/** GET /me/password-estado — si la cuenta ya tiene contraseña propia definida. */
export const getPasswordEstado = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      "SELECT password_definida FROM usuarios WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({ definida: result.rows[0].password_definida !== false });
  } catch (error) {
    console.error("Error in getPasswordEstado:", error);
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
    const userEmail = (req as any).user?.email || '';
    const result = await query(
      `SELECT pb.* 
       FROM perfiles_bebes pb 
       LEFT JOIN accesos_compartidos_bebe acb ON acb.id_perfil_bebe = pb.id AND acb.estado = 'activo'
       WHERE pb.usuario_id = $1 
         OR acb.id_usuario_invitado = $1 
         OR (LOWER(acb.correo_invitado) = LOWER($2) AND acb.id_usuario_invitado IS NULL)
       GROUP BY pb.id
       ORDER BY pb.fecha_creacion DESC`,
      [userId, userEmail],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error in getMyBabies:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const deleteBabyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Si es el dueño real del perfil, se borra el perfil completo (y en
    // cascada sus accesos compartidos, vacunas, controles, etc.)
    const ownerResult = await query(
      "DELETE FROM perfiles_bebes WHERE id = $1 AND usuario_id = $2 RETURNING id",
      [id, userId]
    );

    if (ownerResult.rowCount && ownerResult.rowCount > 0) {
      return res.json({ message: "Perfil eliminado correctamente" });
    }

    // Si no es el dueño, puede tener el perfil en su lista solo por una
    // invitación de un familiar. En ese caso "eliminar" NO debe borrar el
    // perfil para todos — solo debe sacar al perfil de SU propia lista,
    // revocando su propio acceso compartido. El resto de las personas con
    // acceso (dueño, otros familiares) no se ven afectadas.
    const accesoResult = await query(
      `UPDATE accesos_compartidos_bebe
       SET estado = 'revocado'
       WHERE id_perfil_bebe = $1 AND id_usuario_invitado = $2 AND estado = 'activo'
       RETURNING id`,
      [id, userId]
    );

    if (accesoResult.rowCount && accesoResult.rowCount > 0) {
      return res.json({ message: "Perfil quitado de tu lista. El perfil sigue existiendo para su dueño y otros familiares con acceso." });
    }

    return res.status(404).json({ error: "Perfil de bebé no encontrado o no tienes permiso para quitarlo" });
  } catch (error) {
    console.error("Error in deleteBabyProfile:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
