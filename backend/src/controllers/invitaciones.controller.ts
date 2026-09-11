import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../config/db";
import { passwordCumpleRequisitos, PASSWORD_REQUISITOS_MSG } from "../utils/password";

const JWT_SECRET = process.env.JWT_SECRET || "secret_dev_key";

/**
 * Endpoints públicos (sin token de sesión) para el flujo de invitación
 * por correo a ver el perfil de un bebé.
 *
 * Antes el correo llevaba al onboarding completo (/registro), que pide
 * elegir embarazo/nacido y CREAR un bebé — algo que no corresponde a
 * quien fue invitado a ver el bebé de otra persona. Con el token de la
 * invitación, acá se puede: (1) mostrar de antemano quién invitó y a
 * qué bebé, y (2) crear la cuenta en un solo paso, sin onboarding.
 */

/** GET /api/v1/invitaciones/:token — datos para mostrar antes de aceptar. */
export const getInvitacion = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const result = await query(
      `SELECT a.id, a.correo_invitado, a.estado, a.fecha_expiracion,
              b.nombre AS nombre_bebe,
              u.nombre AS nombre_invitador,
              (SELECT id FROM usuarios WHERE LOWER(email) = LOWER(a.correo_invitado)) AS id_usuario_existente
       FROM accesos_compartidos_bebe a
       JOIN perfiles_bebes b ON b.id = a.id_perfil_bebe
       JOIN usuarios u ON u.id = a.invitado_por
       WHERE a.token_invitacion = $1`,
      [token],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invitación no encontrada o ya no es válida." });
    }

    const inv = result.rows[0];

    if (inv.fecha_expiracion && new Date(inv.fecha_expiracion) < new Date()) {
      return res.status(410).json({ error: "Esta invitación ya venció. Pídele a quien te invitó que te envíe una nueva." });
    }

    if (inv.estado === "revocado") {
      return res.status(410).json({ error: "Esta invitación fue revocada." });
    }

    res.json({
      correo_invitado: inv.correo_invitado,
      nombre_bebe: inv.nombre_bebe,
      nombre_invitador: inv.nombre_invitador,
      // Le dice al frontend si mostrar "crear cuenta" o "inicia sesión".
      ya_tiene_cuenta: Boolean(inv.id_usuario_existente),
      ya_aceptada: inv.estado === "activo",
    });
  } catch (error) {
    console.error("Error in getInvitacion:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * POST /api/v1/invitaciones/:token/aceptar — crea la cuenta del invitado
 * (un solo paso: nombre, apellidos y contraseña) y activa el acceso.
 * El correo NO viene del cliente: se toma de la invitación, para que
 * nadie pueda registrarse con un correo distinto al invitado.
 */
export const aceptarInvitacion = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password, nombre, apellidos, consentimiento_ley_19628, consentimiento_ley_21719 } = req.body;

    if (!password || !nombre || !apellidos) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    if (!passwordCumpleRequisitos(password)) {
      return res.status(400).json({ error: PASSWORD_REQUISITOS_MSG });
    }

    const invRes = await query(
      `SELECT id, correo_invitado, estado, fecha_expiracion
       FROM accesos_compartidos_bebe WHERE token_invitacion = $1`,
      [token],
    );

    if (invRes.rows.length === 0) {
      return res.status(404).json({ error: "Invitación no encontrada o ya no es válida." });
    }

    const inv = invRes.rows[0];

    if (inv.fecha_expiracion && new Date(inv.fecha_expiracion) < new Date()) {
      return res.status(410).json({ error: "Esta invitación ya venció." });
    }
    if (inv.estado === "revocado") {
      return res.status(410).json({ error: "Esta invitación fue revocada." });
    }

    const email = inv.correo_invitado;

    const userExists = await query(
      "SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)",
      [email],
    );
    if (userExists.rows.length > 0) {
      return res.status(409).json({
        error: "Ya existe una cuenta con este correo. Inicia sesión para ver el perfil compartido.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO usuarios (email, password_hash, nombre, apellidos, consentimiento_ley_19628, consentimiento_ley_21719)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, nombre, apellidos, rol`,
      [
        email.toLowerCase(),
        passwordHash,
        nombre,
        apellidos,
        !!consentimiento_ley_19628,
        !!consentimiento_ley_21719,
      ],
    );

    const newUser = result.rows[0];

    // Activa esta invitación y cualquier otra pendiente para el mismo
    // correo (puede haber sido invitada a más de un bebé).
    await query(
      `UPDATE accesos_compartidos_bebe
       SET id_usuario_invitado = $1, estado = 'activo', fecha_aceptacion = now()
       WHERE LOWER(correo_invitado) = LOWER($2) AND estado = 'pendiente'`,
      [newUser.id, email],
    );

    const jwtToken = jwt.sign(
      { id: newUser.id, email: newUser.email, rol: newUser.rol },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({ user: newUser, token: jwtToken });
  } catch (error) {
    console.error("Error in aceptarInvitacion:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
